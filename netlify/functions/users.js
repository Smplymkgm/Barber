// netlify/functions/users.js
// GET /.netlify/functions/users?email=xxx
// POST /.netlify/functions/users (register)
// PUT /.netlify/functions/users (update)

const { neon } = require('@neondatabase/serverless');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(event) {
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // GET - find user by email or username
    if(event.httpMethod === 'GET'){
      const { email, username } = event.queryStringParameters || {};
      let user = null;
      if(email){
        const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
        user = result[0] || null;
      } else if(username){
        const result = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
        user = result[0] || null;
      }
      if(!user) return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(user) };
    }

    // POST - register new user
    if(event.httpMethod === 'POST'){
      const u = JSON.parse(event.body);
      // Check if email or username exists
      const existing = await sql`SELECT id FROM users WHERE email = ${u.email} OR username = ${u.username} LIMIT 1`;
      if(existing.length > 0){
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email or username already exists' }) };
      }
      await sql`INSERT INTO users (username, email, name, phone, password, code, referred_by)
        VALUES (${u.username}, ${u.email}, ${u.name}, ${u.phone||null}, ${u.password}, ${u.code}, ${u.referredBy||null})`;
      const newUser = await sql`SELECT * FROM users WHERE email = ${u.email} LIMIT 1`;
      return { statusCode: 201, headers, body: JSON.stringify(newUser[0]) };
    }

    // PUT - update user (password, phone, etc)
    if(event.httpMethod === 'PUT'){
      const { email, password, phone, referralCount } = JSON.parse(event.body);
      if(password){
        await sql`UPDATE users SET password = ${password} WHERE email = ${email}`;
      }
      if(phone){
        await sql`UPDATE users SET phone = ${phone} WHERE email = ${email}`;
      }
      if(referralCount !== undefined){
        await sql`UPDATE users SET referral_count = ${referralCount} WHERE email = ${email}`;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch(err) {
    console.error('Users error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
