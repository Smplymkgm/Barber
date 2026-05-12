// netlify/functions/auth.js
// POST { password } OR { username, password }
// Admin auth - verifies against ADMIN_PASS env var
// Returns { token: 'admin-token' } on success

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { password, username } = body;

    // Accept either { password } or { username, password } where username==='admin'
    if (username && username !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not an admin account' }) };
    }

    const adminPass = process.env.ADMIN_PASS || 'admin2025';
    if (!password || password !== adminPass) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid password' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token: 'admin-' + Date.now(), role: 'admin' })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};