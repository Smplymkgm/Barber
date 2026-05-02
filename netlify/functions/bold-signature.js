// netlify/functions/bold-signature.js
// POST /.netlify/functions/bold-signature
// Body: { orderId, amount, currency }
// Returns: { signature }
// Signature = SHA256(orderId + amount + currency + BOLD_SECRET_KEY)

const crypto = require('crypto');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const { orderId, amount, currency } = JSON.parse(event.body);

    if (!orderId || !amount || !currency) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing orderId, amount, or currency' }) };
    }

    const secret = process.env.BOLD_SECRET_KEY;
    if (!secret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'BOLD_SECRET_KEY not configured' }) };
    }

    const hash = orderId + amount + currency + secret;
    const signature = crypto.createHash('sha256').update(hash).digest('hex');

    return { statusCode: 200, headers, body: JSON.stringify({ signature, orderId, amount, currency }) };

  } catch (err) {
    console.error('Bold signature error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
