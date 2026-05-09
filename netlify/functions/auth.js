// netlify/functions/auth.js
// POST /.netlify/functions/auth
// Body: { password }
// Validates admin password against ADMIN_PASS env var — never exposed in frontend.

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
    const { password } = JSON.parse(event.body || '{}');
    const adminPass = process.env.ADMIN_PASS;

    if (!adminPass) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'ADMIN_PASS env var not configured in Netlify' }) };
    }

    if (password && password === adminPass) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };

  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }
};
