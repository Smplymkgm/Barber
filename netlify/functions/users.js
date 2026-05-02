// netlify/functions/users.js
// GET    /.netlify/functions/users?email=x      → lookup user by email
// GET    /.netlify/functions/users?username=x   → lookup user by username
// GET    /.netlify/functions/users              → all users (admin use)
// POST   /.netlify/functions/users             → register user
// PUT    /.netlify/functions/users             → update user fields
// DELETE /.netlify/functions/users?email=x    → delete user

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
      const { email, username } = event.queryStringParameters || {};

      if (email) {
        const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      }

      if (username) {
        const rows = await sql`SELECT * FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
        if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
      }

      // All users for admin
      const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`;
      return { statusCode: 200, headers, body: JSON.stringify(rows) };
    }

    // ── POST (register) ──
    if (event.httpMethod === 'POST') {
      const u = JSON.parse(event.body);
      if (!u.email || !u.password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email or password' }) };
      }

      // Check if email or username already exists
      const existing = await sql`
        SELECT id FROM users WHERE LOWER(email) = LOWER(${u.email})
        ${u.username ? sql`OR LOWER(username) = LOWER(${u.username})` : sql``}
        LIMIT 1
      `;
      if (existing.length) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'exists' }) };
      }

      const rows = await sql`
        INSERT INTO users (username, email, name, phone, password, code, referred_by, is_admin, is_affiliate, user_type)
        VALUES (
          ${u.username || null}, ${u.email}, ${u.name || ''}, ${u.phone || null},
          ${u.password}, ${u.code || null}, ${u.referredBy || null},
          ${u.isAdmin || false}, ${u.isAffiliate || false}, ${u.userType || 'client'}
        )
        RETURNING id, username, email, name, phone, code, referred_by, referral_count, is_admin, is_affiliate, created_at
      `;

      // Increment referral count on referring user
      if (u.referredBy) {
        await sql`
          UPDATE users SET referral_count = referral_count + 1
          WHERE code = ${u.referredBy}
        `;
      }

      return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
    }

    // ── PUT (update) ──
    if (event.httpMethod === 'PUT') {
      const u = JSON.parse(event.body);
      if (!u.email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email' }) };

      if (u.password !== undefined) {
        await sql`UPDATE users SET password = ${u.password} WHERE LOWER(email) = LOWER(${u.email})`;
      }
      if (u.phone !== undefined) {
        await sql`UPDATE users SET phone = ${u.phone} WHERE LOWER(email) = LOWER(${u.email})`;
      }
      if (u.name !== undefined) {
        await sql`UPDATE users SET name = ${u.name} WHERE LOWER(email) = LOWER(${u.email})`;
      }
      if (u.isAffiliate !== undefined) {
        await sql`UPDATE users SET is_affiliate = ${u.isAffiliate} WHERE LOWER(email) = LOWER(${u.email})`;
      }
      if (u.referralCount !== undefined) {
        await sql`UPDATE users SET referral_count = ${u.referralCount} WHERE LOWER(email) = LOWER(${u.email})`;
      }
      if (u.userType !== undefined) {
        await sql`UPDATE users SET user_type = ${u.userType} WHERE LOWER(email) = LOWER(${u.email})`;
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ── DELETE ──
    if (event.httpMethod === 'DELETE') {
      const email = event.queryStringParameters?.email;
      if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email' }) };
      await sql`DELETE FROM users WHERE LOWER(email) = LOWER(${email})`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch (err) {
    console.error('Users function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
