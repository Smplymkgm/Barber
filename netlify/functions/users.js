// netlify/functions/users.js
const { neon } = require('@neondatabase/serverless');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h).toString(36) + s.length.toString(36);
}

function genCode() {
  return 'MICH-' + Math.random().toString(36).substring(2,6).toUpperCase();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const p = event.queryStringParameters || {};

  try {
    // GET
    if (event.httpMethod === 'GET') {
      if (p.email) {
        const rows = await sql`SELECT id, username, email, name, phone, code, is_affiliate, is_admin, user_type, created_at FROM users WHERE email = ${p.email} LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers: CORS, body: JSON.stringify(rows[0]) };
      }
      if (p.username) {
        const rows = await sql`SELECT id, username, email, name, phone, code, is_affiliate, is_admin, user_type, created_at FROM users WHERE username = ${p.username} LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers: CORS, body: JSON.stringify(rows[0]) };
      }
      if (p.id) {
        const rows = await sql`SELECT id, username, email, name, phone, code, is_affiliate, is_admin, user_type, created_at FROM users WHERE id = ${p.id} LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers: CORS, body: JSON.stringify(rows[0]) };
      }
      const rows = await sql`SELECT id, username, email, name, phone, code, is_affiliate, is_admin, user_type, created_at FROM users ORDER BY created_at DESC`;
      return { statusCode: 200, headers: CORS, body: JSON.stringify(rows) };
    }

    // POST - register
    if (event.httpMethod === 'POST') {
      const b = JSON.parse(event.body || '{}');
      const email = (b.email || '').trim().toLowerCase();
      if (!email) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email required' }) };

      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'Email already registered' }) };

      const fn = b.firstName || '';
      const ln = b.lastName || '';
      const fullName = b.name || (fn + ' ' + ln).trim() || email.split('@')[0];
      const username = (b.username || email.split('@')[0]).trim();
      const phone = b.phone || '';
      const pw = b.password ? simpleHash(b.password) : simpleHash('default');
      const isAff = b.role === 'affiliate' || b.isAffiliate === true;
      const code = isAff ? genCode() : null;
      const userType = isAff ? 'affiliate' : (b.role || 'client');

      const rows = await sql`
        INSERT INTO users (username, email, name, phone, password, code, is_affiliate, user_type, referred_by)
        VALUES (${username}, ${email}, ${fullName}, ${phone}, ${pw}, ${code}, ${isAff}, ${userType}, ${b.refCode || null})
        RETURNING id, username, email, name, phone, code, is_affiliate, user_type`;

      return { statusCode: 201, headers: CORS, body: JSON.stringify({ ...rows[0], affiliate_code: rows[0].code }) };
    }

    // PUT - update
    if (event.httpMethod === 'PUT') {
      const b = JSON.parse(event.body || '{}');
      if (!b.id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'ID required' }) };
      const rows = await sql`
        UPDATE users SET
          name = COALESCE(${b.name}, name),
          phone = COALESCE(${b.phone}, phone)
        WHERE id = ${b.id}
        RETURNING id, username, email, name, phone, code, is_affiliate, user_type`;
      return { statusCode: 200, headers: CORS, body: JSON.stringify(rows[0]) };
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      if (!p.email) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email required' }) };
      await sql`DELETE FROM users WHERE email = ${p.email}`;
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ deleted: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};