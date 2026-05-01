// netlify/functions/data.js
// Handles: services, settings, coupons, blocks, recurring_blocks, waitlist
// GET /.netlify/functions/data?type=services
// POST /.netlify/functions/data?type=coupons (create)
// PUT /.netlify/functions/data?type=settings (update)
// DELETE /.netlify/functions/data?type=blocks&id=xxx

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
  const type = event.queryStringParameters?.type;

  try {
    // ── GET ──
    if(event.httpMethod === 'GET'){
      if(type === 'services'){
        const rows = await sql`SELECT * FROM services ORDER BY sort_order`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }
      if(type === 'settings'){
        const rows = await sql`SELECT * FROM settings`;
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return { statusCode: 200, headers, body: JSON.stringify(settings) };
      }
      if(type === 'coupons'){
        const rows = await sql`SELECT * FROM coupons ORDER BY created_at DESC`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }
      if(type === 'blocks'){
        const rows = await sql`SELECT * FROM blocks ORDER BY date`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }
      if(type === 'recurring'){
        const rows = await sql`SELECT * FROM recurring_blocks WHERE active = true ORDER BY created_at`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }
      if(type === 'waitlist'){
        const rows = await sql`SELECT * FROM waitlist ORDER BY added_at`;
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };
    }

    // ── POST ──
    if(event.httpMethod === 'POST'){
      const body = JSON.parse(event.body);

      if(type === 'services'){
        await sql`INSERT INTO services (id, name, name_es, desc, price, badge, sort_order)
          VALUES (${body.id}, ${body.name}, ${body.nameEs||null}, ${body.desc||''}, ${body.price}, ${body.badge||null}, ${body.sortOrder||0})`;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'coupons'){
        await sql`INSERT INTO coupons (code, label, discount_type, discount_value, expiry_date, max_uses)
          VALUES (${body.code}, ${body.label||body.code}, ${body.discountType}, ${body.discountValue}, ${body.expiryDate||null}, ${body.maxUses||null})`;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'blocks'){
        await sql`INSERT INTO blocks (date, time_from, time_to, reason)
          VALUES (${body.date}, ${body.timeFrom||null}, ${body.timeTo||null}, ${body.reason||null})`;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'recurring'){
        await sql`INSERT INTO recurring_blocks (id, type, days, time_from, time_to, until_date, reason)
          VALUES (${body.id}, ${body.type}, ${body.days}, ${body.timeFrom||null}, ${body.timeTo||null}, ${body.until||null}, ${body.reason||null})`;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'waitlist'){
        await sql`INSERT INTO waitlist (id, name, phone, email, date, service)
          VALUES (${body.id}, ${body.name}, ${body.phone||null}, ${body.email||null}, ${body.date||null}, ${body.service||null})`;
        return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };
    }

    // ── PUT ──
    if(event.httpMethod === 'PUT'){
      const body = JSON.parse(event.body);

      if(type === 'settings'){
        for(const [key, value] of Object.entries(body)){
          await sql`INSERT INTO settings (key, value) VALUES (${key}, ${String(value)})
            ON CONFLICT (key) DO UPDATE SET value = ${String(value)}, updated_at = NOW()`;
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'services'){
        const { id, ...fields } = body;
        if(fields.name !== undefined) await sql`UPDATE services SET name = ${fields.name} WHERE id = ${id}`;
        if(fields.nameEs !== undefined) await sql`UPDATE services SET name_es = ${fields.nameEs} WHERE id = ${id}`;
        if(fields.price !== undefined) await sql`UPDATE services SET price = ${fields.price} WHERE id = ${id}`;
        if(fields.badge !== undefined) await sql`UPDATE services SET badge = ${fields.badge} WHERE id = ${id}`;
        if(fields.desc !== undefined) await sql`UPDATE services SET desc = ${fields.desc} WHERE id = ${id}`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'coupons'){
        const { id, usedCount } = body;
        await sql`UPDATE coupons SET used_count = ${usedCount} WHERE id = ${id}`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      if(type === 'waitlist'){
        const { id, notified } = body;
        await sql`UPDATE waitlist SET notified = ${notified} WHERE id = ${id}`;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown type' }) };
    }

    // ── DELETE ──
    if(event.httpMethod === 'DELETE'){
      const id = event.queryStringParameters?.id;
      if(!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

      if(type === 'services') await sql`DELETE FROM services WHERE id = ${id}`;
      if(type === 'coupons') await sql`DELETE FROM coupons WHERE id = ${id}`;
      if(type === 'blocks') await sql`DELETE FROM blocks WHERE id = ${id}`;
      if(type === 'recurring') await sql`UPDATE recurring_blocks SET active = false WHERE id = ${id}`;
      if(type === 'waitlist') await sql`DELETE FROM waitlist WHERE id = ${id}`;

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: 'Method not allowed' };

  } catch(err) {
    console.error('Data error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
