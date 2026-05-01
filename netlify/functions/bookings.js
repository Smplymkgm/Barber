// netlify/functions/bookings.js
// GET /.netlify/functions/bookings
// POST /.netlify/functions/bookings (create)
// PUT /.netlify/functions/bookings (update status/payment)
// DELETE /.netlify/functions/bookings?id=xxx

const { neon } = require('@neondatabase/serverless');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async function(event) {
  if(event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // GET - fetch all bookings
    if(event.httpMethod === 'GET'){
      const bookings = await sql`
        SELECT * FROM bookings ORDER BY created_at DESC
      `;
      return { statusCode: 200, headers, body: JSON.stringify(bookings) };
    }

    // POST - create booking
    if(event.httpMethod === 'POST'){
      const b = JSON.parse(event.body);
      await sql`INSERT INTO bookings 
        (id, name, email, phone, service, service_name, date, time, group_size, 
         address, payment, payment_status, status, price, original_price, 
         coupon_code, coupon_discount, ref_code, affiliate_code, source)
        VALUES (
          ${b.id}, ${b.name}, ${b.email}, ${b.phone}, ${b.service}, ${b.serviceName},
          ${b.date}, ${b.time}, ${b.groupSize||1}, ${b.address}, ${b.payment},
          ${b.paymentStatus||'pending'}, ${b.status||'pending'}, ${b.price||0},
          ${b.originalPrice||b.price||0}, ${b.couponCode||null}, ${b.couponDiscount||0},
          ${b.refCode||null}, ${b.affiliateCode||null}, ${b.source||'web'}
        )`;
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, id: b.id }) };
    }

    // PUT - update booking
    if(event.httpMethod === 'PUT'){
      const { id, status, paymentStatus, notes } = JSON.parse(event.body);
      if(status !== undefined){
        await sql`UPDATE bookings SET status = ${status} WHERE id = ${id}`;
      }
      if(paymentStatus !== undefined){
        await sql`UPDATE bookings SET payment_status = ${paymentStatus} WHERE id = ${id}`;
      }
      if(notes !== undefined){
        await sql`UPDATE bookings SET notes = ${notes} WHERE id = ${id}`;
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // DELETE - delete booking
    if(event.httpMethod === 'DELETE'){
      const id = event.queryStringParameters?.id;
      if(!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
      await sql`DELETE FROM bookings WHERE id = ${id}`;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch(err) {
    console.error('Bookings error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
