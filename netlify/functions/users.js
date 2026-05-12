// netlify/functions/users.js
const { neon } = require('@neondatabase/serverless');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const sql = neon(process.env.DATABASE_URL);

  try {
    // GET - lookup user
    if (event.httpMethod === 'GET') {
      const p = event.queryStringParameters || {};

      if (p.email) {
        const rows = await sql`SELECT id, username, email, first_name, last_name, phone, role, affiliate_code, created_at FROM users WHERE email = ${p.email} LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      }

      if (p.username) {
        const rows = await sql`SELECT id, username, email, first_name, last_name, phone, role, affiliate_code, created_at FROM users WHERE username = ${p.username} LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      }

      if (p.id) {
        const rows = await sql`SELECT id, username, email, first_name, last_name, phone, role, affiliate_code, created_at FROM users WHERE id = ${p.id} LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      }

      // All users (admin)
      const rows = await sql`SELECT id, username, email, first_name, last_name, phone, role, affiliate_code, created_at FROM users ORDER BY created_at DESC`;
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    // POST - register user
    if (event.httpMethod === 'POST') {
      const b = JSON.parse(event.body || '{}');
      const { username, email, password, firstName, lastName, name, phone, role } = b;

      if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };

      // Check duplicate
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length) return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email already registered' }) };

      const fn = firstName || (name ? name.split(' ')[0] : '');
      const ln = lastName || (name ? name.split(' ').slice(1).join(' ') : '');
      const uname = username || email.split('@')[0];
      const hashedPw = password ? simpleHash(password) : '';
      const userRole = role || 'client';
      const affCode = userRole === 'affiliate' ? 'MICH-' + Math.random().toString(36).substring(2,6).toUpperCase() : null;

      const rows = await sql`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, affiliate_code)
        VALUES (${uname}, ${email}, ${hashedPw}, ${fn}, ${ln}, ${phone||''}, ${userRole}, ${affCode})
        RETURNING id, username, email, first_name, last_name, phone, role, affiliate_code
      `;

      return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
    }

    // PUT - update user
    if (event.httpMethod === 'PUT') {
      const b = JSON.parse(event.body || '{}');
      const { id, phone, firstName, lastName } = b;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required' }) };

      const rows = await sql`
        UPDATE users SET
          first_name = COALESCE(${firstName}, first_name),
          last_name = COALESCE(${lastName}, last_name),
          phone = COALESCE(${phone}, phone)
        WHERE id = ${id}
        RETURNING id, username, email, first_name, last_name, phone, role
      `;
      return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      const email = event.queryStringParameters?.email;
      if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
      await sql`DELETE FROM users WHERE email = ${email}`;
      return { statusCode: 200, headers, body: JSON.stringify({ deleted: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};