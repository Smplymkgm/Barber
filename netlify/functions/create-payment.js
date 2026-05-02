// netlify/functions/create-payment.js
// POST /.netlify/functions/create-payment
// Body: { serviceId, date, time, groupSize?, tip? }
// Returns: { orderId, amount, currency, signature, bookingId }
// SECURITY: Price is ALWAYS calculated server-side from DB — never trusted from frontend.

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function calcSurcharge(time, basePrice) {
  const h = parseInt(time);
  if (h === 5)  return Math.round(basePrice * 1.5);
  if (h === 6)  return Math.round(basePrice * 1.4);
  if (h === 7)  return Math.round(basePrice * 1.4);
  if (h === 8)  return Math.round(basePrice * 1.2);
  if (h >= 9 && h <= 18) return basePrice;
  if (h === 19) return Math.round(basePrice * 1.2);
  if (h === 20) return Math.round(basePrice * 1.4);
  if (h >= 21 && h <= 22) return Math.round(basePrice * 1.5);
  return basePrice;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  const secret = process.env.BOLD_SECRET_KEY;
  if (!secret) return { statusCode: 500, headers, body: JSON.stringify({ error: 'BOLD_SECRET_KEY not configured' }) };

  try {
    const { serviceId, date, time, groupSize = 1, tip = 0, couponCode } = JSON.parse(event.body);

    if (!serviceId || !date || !time) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing serviceId, date, or time' }) };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Fetch service from DB — never trust frontend price
    const services = await sql`SELECT * FROM services WHERE id = ${serviceId} LIMIT 1`;
    if (!services.length) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Service not found' }) };
    }
    const svc = services[0];

    // Calculate final price with time surcharge
    const hour = time.split(':')[0];
    let unitPrice = calcSurcharge(hour, svc.price);
    let total = unitPrice * Math.max(1, parseInt(groupSize));

    // Apply coupon if provided
    if (couponCode) {
      const coupons = await sql`
        SELECT * FROM coupons WHERE UPPER(code) = UPPER(${couponCode})
          AND active = true
          AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
          AND (max_uses IS NULL OR used_count < max_uses)
        LIMIT 1
      `;
      if (coupons.length) {
        const c = coupons[0];
        if (c.discount_type === 'percent') {
          total = Math.round(total * (1 - c.discount_value / 100));
        } else {
          total = Math.max(0, total - c.discount_value);
        }
      }
    }

    // Add tip (validated: only allowed values)
    const ALLOWED_TIPS = [0, 5000, 10000, 20000, 50000];
    const safeTip = ALLOWED_TIPS.includes(parseInt(tip)) ? parseInt(tip) : 0;
    const finalAmount = total + safeTip;

    // Generate unique order ID
    const orderId = 'MB-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Generate Bold integrity signature: SHA256(orderId + amount + currency + secret)
    const hash = orderId + String(finalAmount) + 'COP' + secret;
    const signature = crypto.createHash('sha256').update(hash).digest('hex');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderId,
        amount: finalAmount,
        baseAmount: total,
        tip: safeTip,
        currency: 'COP',
        signature,
        serviceId,
        serviceName: svc.name,
        date,
        time
      })
    };

  } catch (err) {
    console.error('create-payment error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
