// ─── API LAYER (Netlify Functions) ───
// Declared here — top of script — so it's initialized before ANY other code runs.
const API = {
  // ── BOOKINGS ──
  async getBookings(){
    try {
      const r = await fetch('/.netlify/functions/bookings');
      if(!r.ok) throw new Error('Failed');
      const rows = await r.json();
      return rows.map(function(b){ return {
        id: b.id, name: b.name, email: b.email, phone: b.phone,
        service: b.service, serviceName: b.service_name,
        date: b.date, time: b.time, groupSize: b.group_size,
        address: b.address, payment: b.payment,
        paymentStatus: b.payment_status, status: b.status,
        price: b.price, originalPrice: b.original_price,
        couponCode: b.coupon_code, couponDiscount: b.coupon_discount,
        refCode: b.ref_code, affiliateCode: b.affiliate_code,
        source: b.source, createdAt: b.created_at
      };});
    } catch(e){ console.error('getBookings error:', e); return getBookings(); }
  },

  async saveBooking(b){
    try {
      const r = await fetch('/.netlify/functions/bookings', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(b)
      });
      if(!r.ok) throw new Error('Failed');
      return true;
    } catch(e){ console.error('saveBooking error:', e); saveBookings([...getBookings(), b]); return false; }
  },

  async updateBooking(id, updates){
    try {
      const r = await fetch('/.netlify/functions/bookings', {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id, ...updates})
      });
      return r.ok;
    } catch(e){ return false; }
  },

  async deleteBooking(id){
    try {
      const r = await fetch('/.netlify/functions/bookings?id=' + id, { method: 'DELETE' });
      return r.ok;
    } catch(e){ return false; }
  },

  // ── USERS ──
  async getUser(email, username){
    try {
      const q = email ? 'email=' + encodeURIComponent(email) : 'username=' + encodeURIComponent(username);
      const r = await fetch('/.netlify/functions/users?' + q);
      if(r.status === 404) return null;
      if(!r.ok) throw new Error('Failed');
      const u = await r.json();
      return {
        id: u.id, username: u.username, email: u.email, name: u.name,
        phone: u.phone, password: u.password, code: u.code,
        referredBy: u.referred_by, referralCount: u.referral_count,
        isAdmin: u.is_admin, isAffiliate: u.is_affiliate
      };
    } catch(e){ return null; }
  },

  async registerUser(u){
    try {
      const r = await fetch('/.netlify/functions/users', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(u)
      });
      if(r.status === 409) return { error: 'exists' };
      if(!r.ok) throw new Error('Failed');
      return await r.json();
    } catch(e){ return { error: e.message }; }
  },

  async updateUser(email, updates){
    try {
      const r = await fetch('/.netlify/functions/users', {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email, ...updates})
      });
      return r.ok;
    } catch(e){ return false; }
  },

  // ── SERVICES ──
  async getServices(){
    try {
      const r = await fetch('/.netlify/functions/data?type=services');
      if(!r.ok) throw new Error('Failed');
      const rows = await r.json();
      return rows.map(function(s){ return {
        id: s.id, name: s.name, nameEs: s.name_es,
        desc: s.desc, price: s.price, badge: s.badge
      };});
    } catch(e){ return getServices(); }
  },

  async updateService(id, updates){
    try {
      const r = await fetch('/.netlify/functions/data?type=services', {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({id, ...updates})
      });
      return r.ok;
    } catch(e){ return false; }
  },

  // ── SETTINGS ──
  async getSettings(){
    try {
      const r = await fetch('/.netlify/functions/data?type=settings');
      if(!r.ok) throw new Error('Failed');
      return await r.json();
    } catch(e){ return {}; }
  },

  async saveSetting(key, value){
    try {
      const r = await fetch('/.netlify/functions/data?type=settings', {
        method: 'PUT', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({[key]: value})
      });
      return r.ok;
    } catch(e){ return false; }
  },

  // ── COUPONS ──
  async getCoupons(){
    try {
      const r = await fetch('/.netlify/functions/data?type=coupons');
      if(!r.ok) throw new Error('Failed');
      const rows = await r.json();
      return rows.map(function(c){ return {
        id: c.id, code: c.code, label: c.label,
        discountType: c.discount_type, discountValue: c.discount_value,
        expiryDate: c.expiry_date, maxUses: c.max_uses,
        usedCount: c.used_count, active: c.active
      };});
    } catch(e){ return getCoupons(); }
  },

  async saveCoupon(c){
    try {
      const r = await fetch('/.netlify/functions/data?type=coupons', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(c)
      });
      return r.ok;
    } catch(e){ return false; }
  },

  async deleteCoupon(id){
    try {
      const r = await fetch('/.netlify/functions/data?type=coupons&id=' + id, { method: 'DELETE' });
      return r.ok;
    } catch(e){ return false; }
  }
};

// ─── DEFAULT SERVICES ───
const DEFAULT_SERVICES = [
  { id:'haircut', name:'Haircut', nameEs:'Corte', duration:60, desc:'Fade, taper, classic — your style, your space', descEs:'Fade, taper, clásico — tu estilo, tu espacio', price:150000, badge:'', badgeEs:'' },
  { id:'haircut_beard', name:'Haircut + Beard', nameEs:'Corte + Barba', duration:90, desc:'Full look. Optional: eyebrow & nose wax.', descEs:'Look completo. Opcional: cejas y nose wax.', price:180000, badge:'MOST POPULAR', badgeEs:'MÁS POPULAR' },
  { id:'beard', name:'Beard Only', nameEs:'Solo Barba', duration:60, desc:'Shape, trim & line-up. Optional: eyebrow & nose wax.', descEs:'Forma, recorte y perfilado. Opcional: cejas y nose wax.', price:100000, badge:'', badgeEs:'' },
];

const DEFAULT_ZONES = ['El Poblado','Laureles','Envigado','Sabaneta','Itagüí','Medellín'];
