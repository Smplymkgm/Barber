// ─── DB ───
const DB = {
  get:(k,d)=>{ try{ const v=localStorage.getItem('mg2_'+k); return v?JSON.parse(v):(d!==undefined?d:null); }catch(e){ return d||null; }},
  set:(k,v)=>{ try{ localStorage.setItem('mg2_'+k,JSON.stringify(v)); }catch(e){} }
};

// ─── IN-MEMORY BOOKING CACHE (source of truth after DB load) ───
let allBookings = []; // populated from DB on load — do NOT seed from localStorage (stale data blocks calendar)

function getServices(){ return DB.get('services', DEFAULT_SERVICES); }
function getZones(){ return DB.get('zones', DEFAULT_ZONES); }
function getBookings(){ return allBookings; }
function getUsers(){ return DB.get('users',[]); }
function getAffs(){ return DB.get('affiliates',[]); }
function getBlocks(){ return DB.get('blocks',[]); }
function getSubs(){ return DB.get('subs',[]); }
function isCalClosed(){ return DB.get('calClosed',false); }
function saveServices(v){ DB.set('services',v); }
function saveZones(v){ DB.set('zones',v); }
function saveBookings(v){ allBookings=v; DB.set('bookings',v); }
function saveUsers(v){ DB.set('users',v); }
function saveAffs(v){ DB.set('affiliates',v); }
function saveBlocks(v){ DB.set('blocks',v); }
function saveSubs(v){ DB.set('subs',v); }
