// netlify/functions/bookings.js
// GET    /.netlify/functions/bookings          → all bookings
// GET    /.netlify/functions/bookings?email=x  → bookings for user
// GET    /.netlify/functions/bookings?id=x     → single booking
// POST   /.netlify/functions/bookings          → create booking
// PUT    /.netlify/functions/bookings          → update booking fields
// DELETE /.netlify/functions/bookings?id=x    → delete booking

const { neon } = require('@neondatabase/serverless');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // ── GET ──
    if (event.httpMethod === 'GET') {
      const { id, email } = event.queryStringParameters || {};
      if (id) {
        const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
        if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      }
      if (email) {
        const rows = await sql`SELECT * FROM bookings WHERE email = ${email} ORDER BY created_at DESC`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }
      const rows = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    // ── POST (create) ──
    if (event.httpMethod === 'POST') {
      const b = JSON.parse(event.body);
      if (!b.id || !b.name || !b.date || !b.time) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields: id, name, date, time' }) };
      }
      await sql`
        INSERT INTO bookings (
          id, name, email, phone, service, service_name, date, time,
          group_size, address, payment, payment_status, status, price,
          original_price, coupon_code, coupon_discount, ref_code,
          affiliate_code, source, notes, order_id
        ) VALUES (
          ${b.id}, ${b.name}, ${b.email || null}, ${b.phone || null},
          ${b.service || null}, ${b.serviceName || null},
          ${b.date}, ${b.time}, ${b.groupSize || 1},
          ${b.address || null}, ${b.payment || null},
          ${b.paymentStatus || 'pending'}, ${b.status || 'pending'},
          ${b.price || 0}, ${b.originalPrice || b.price || 0},
          ${b.couponCode || null}, ${b.couponDiscount || 0},
          ${b.refCode || null}, ${b.affiliateCode || null},
          ${b.source || 'web'}, ${b.notes || null}, ${b.orderId || null}
        )
      `;
      return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
    }

    // ── PUT (update) ──
    if (event.httpMethod === 'PUT') {
      const b = JSON.parse(event.body);
      if (!b.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

      if (b.status !== undefined) {
        await sql`UPDATE bookings SET status = ${b.status} WHERE id = ${b.id}`;
      }
      if (b.paymentStatus !== undefined) {
        await sql`UPDATE bookings SET payment_status = ${b.paymentStatus} WHERE id = ${b.id}`;
      }
      if (b.notes !== undefined) {
        await sql`UPDATE bookings SET notes = ${b.notes} WHERE id = ${b.id}`;
      }
      if (b.payment !== undefined) {
        await sql`UPDATE bookings SET payment = ${b.payment} WHERE id = ${b.id}`;
      }
      if (b.orderId !== undefined) {
        await sql`UPDATE bookings SET order_id = ${b.orderId} WHERE id = ${b.id}`;
      }
      if (b.autoCompleted !== undefined) {
        await sql`UPDATE bookings SET auto_completed = ${b.autoCompleted} WHERE id = ${b.id}`;
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ── DELETE ──
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
      await sql`DELETE FROM bookings WHERE id = ${id}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch (err) {
    console.error('Bookings function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
