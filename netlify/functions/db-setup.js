// netlify/functions/db-setup.js
// Run this once to create all tables
// Call: POST /.netlify/functions/db-setup

const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event) {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    // USERS table
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      code TEXT UNIQUE,
      referred_by TEXT,
      referral_count INTEGER DEFAULT 0,
      is_admin BOOLEAN DEFAULT FALSE,
      is_affiliate BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // BOOKINGS table
    await sql`CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      service TEXT,
      service_name TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      group_size INTEGER DEFAULT 1,
      address TEXT,
      payment TEXT,
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending',
      price INTEGER DEFAULT 0,
      original_price INTEGER,
      coupon_code TEXT,
      coupon_discount INTEGER DEFAULT 0,
      ref_code TEXT,
      affiliate_code TEXT,
      source TEXT DEFAULT 'web',
      notes TEXT,
      auto_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // SERVICES table
    await sql`CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_es TEXT,
      desc TEXT,
      price INTEGER NOT NULL,
      badge TEXT,
      sort_order INTEGER DEFAULT 0
    )`;

    // Insert default services if empty
    const existing = await sql`SELECT COUNT(*) as count FROM services`;
    if(parseInt(existing[0].count) === 0){
      await sql`INSERT INTO services (id, name, name_es, desc, price, badge, sort_order) VALUES
        ('haircut', 'Haircut', 'Corte', 'Classic precision cut at your location', 150000, '', 1),
        ('haircut_beard', 'Haircut + Beard', 'Corte + Barba', 'Full grooming service', 180000, 'MOST POPULAR', 2),
        ('beard', 'Beard Only', 'Solo Barba', 'Beard trim and shape', 100000, '', 3)
      `;
    }

    // COUPONS table
    await sql`CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      label TEXT,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      expiry_date TEXT,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // BLOCKS table (specific date blocks)
    await sql`CREATE TABLE IF NOT EXISTS blocks (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      time_from TEXT,
      time_to TEXT,
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // RECURRING BLOCKS table
    await sql`CREATE TABLE IF NOT EXISTS recurring_blocks (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      days INTEGER[] NOT NULL,
      time_from TEXT,
      time_to TEXT,
      until_date TEXT,
      reason TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // WAITLIST table
    await sql`CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      date TEXT,
      service TEXT,
      notified BOOLEAN DEFAULT FALSE,
      added_at TIMESTAMP DEFAULT NOW()
    )`;

    // SETTINGS table (key-value for app config)
    await sql`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )`;

    // Insert default settings
    await sql`INSERT INTO settings (key, value) VALUES 
      ('calendar_open', 'true'),
      ('active_palette', 'noir'),
      ('max_per_day', '5')
      ON CONFLICT (key) DO NOTHING`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'All tables created successfully' })
    };

  } catch(err) {
    console.error('DB setup error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
