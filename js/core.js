// ─── INIT ───
initCal();
renderServicesSection();
updateSubSlots();
refreshBanner();
setTimeout(()=>{document.getElementById('progFill').style.width='0%';},500);

// ─── ADMIN CALENDAR VIEW ───
const SVC_COLORS = {
  haircut: 'svc-haircut',
  haircut_beard: 'svc-haircut_beard',
  beard: 'svc-beard',
};
function getSvcColor(svcId){ return SVC_COLORS[svcId] || 'svc-default'; }

let calViewMode = 'week'; // day | week | month
let calViewDate = new Date();

function initCalView(){
  const wrap = document.getElementById('calViewWrap');
  if(!wrap) return;
  wrap.innerHTML = buildCalViewHTML();
  renderCalView();
}

function buildCalViewHTML(){
  return `<div class="cal-view-tabs">
    <button class="cal-view-tab ${calViewMode==='day'?'active':''}" onclick="setCalView('day')">Day</button>
    <button class="cal-view-tab ${calViewMode==='week'?'active':''}" onclick="setCalView('week')">Week</button>
    <button class="cal-view-tab ${calViewMode==='month'?'active':''}" onclick="setCalView('month')">Month</button>
  </div>
  <div id="calViewBody"></div>`;
}

function setCalView(mode){
  calViewMode = mode;
  document.querySelectorAll('.cal-view-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase() === mode);
  });
  renderCalView();
}

function renderCalView(){
  const body = document.getElementById('calViewBody');
  if(!body) return;
  if(calViewMode === 'day') body.innerHTML = buildDayView();
  else if(calViewMode === 'week') body.innerHTML = buildWeekView();
  else body.innerHTML = buildMonthView();
}

function fmtDateKey(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getBookingsForDate(dateStr){
  return getBookings().filter(b => b.date === dateStr && b.status !== 'cancelled');
}

function buildNavRow(title, prevFn, nextFn){
  return `<div class="cal-nav-row">
    <button onclick="${prevFn}">←</button>
    <span class="cal-nav-title">${title}</span>
    <button onclick="${nextFn}">→</button>
  </div>`;
}

// DAY VIEW
function buildDayView(){
  const dateStr = fmtDateKey(calViewDate);
  const bks = getBookingsForDate(dateStr);
  const hours = [];
  for(let h=5;h<=23;h++) hours.push(h);
  const title = calViewDate.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});
  
  let html = buildNavRow(title, 'prevCalDay()', 'nextCalDay()');
  html += '<div class="day-view">';
  hours.forEach(h => {
    const timeStr = String(h).padStart(2,'0')+':00';
    const slotBks = bks.filter(b => b.time && parseInt(b.time) === h);
    html += `<div class="day-hour-row">
      <div class="day-hour-label">${h===12?'12pm':h<12?h+'am':h===12?'12pm':(h-12)+'pm'}</div>
      <div class="day-hour-slots">`;
    slotBks.forEach(b => {
      html += `<div class="cal-event ${getSvcColor(b.service)}" onclick="showEventPopup('${b.id}')">
        <div class="cal-event-time">${b.time}${b.groupSize>1?' · ×'+b.groupSize:''}</div>
        <div class="cal-event-name">${b.name}</div>
        <div class="cal-event-svc">${b.serviceName||b.service}</div>
      </div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function prevCalDay(){ calViewDate.setDate(calViewDate.getDate()-1); renderCalView(); }
function nextCalDay(){ calViewDate.setDate(calViewDate.getDate()+1); renderCalView(); }

// WEEK VIEW
function buildWeekView(){
  const todayStr = fmtDateKey(new Date());
  // Get start of week (Monday)
  const startOfWeek = new Date(calViewDate);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(startOfWeek);
    d.setDate(d.getDate()+i);
    days.push(d);
  }
  
  const startLbl = days[0].toLocaleDateString('en',{month:'short',day:'numeric'});
  const endLbl = days[6].toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
  const title = startLbl + ' – ' + endLbl;
  
  const hours = [];
  for(let h=5;h<=23;h++) hours.push(h);
  
  const cols = 8; // time col + 7 days
  let html = buildNavRow(title, 'prevCalWeek()', 'nextCalWeek()');
  html += `<div class="week-view"><div class="week-grid" style="grid-template-columns:40px repeat(7,1fr);">`;
  
  // Header
  html += '<div class="week-header" style="grid-column:1/-1;display:grid;grid-template-columns:40px repeat(7,1fr);">';
  html += '<div class="week-header-cell"></div>';
  days.forEach(d => {
    const ds = fmtDateKey(d);
    const isToday = ds === todayStr;
    const lbl = d.toLocaleDateString('en',{weekday:'short'}) + ' ' + d.getDate();
    html += `<div class="week-header-cell ${isToday?'today-col':''}">${lbl}</div>`;
  });
  html += '</div>';
  
  // Hour rows
  hours.forEach(h => {
    const timeLbl = h<12?h+'am':h===12?'12pm':(h-12)+'pm';
    html += `<div class="week-hour-row" style="grid-column:1/-1;display:grid;grid-template-columns:40px repeat(7,1fr);">`;
    html += `<div class="week-time-cell">${timeLbl}</div>`;
    days.forEach(d => {
      const ds = fmtDateKey(d);
      const isToday = ds === todayStr;
      const slotBks = getBookingsForDate(ds).filter(b => b.time && parseInt(b.time) === h);
      html += `<div class="week-day-cell ${isToday?'today-col':''}">`;
      slotBks.forEach(b => {
        html += `<div class="cal-event ${getSvcColor(b.service)}" onclick="showEventPopup('${b.id}')" style="font-size:9px;padding:3px 4px;">
          <div style="font-weight:500;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${b.name.split(' ')[0]}</div>
          <div style="opacity:0.75;font-size:8px;">${b.time}</div>
        </div>`;
      });
      html += '</div>';
    });
    html += '</div>';
  });
  html += '</div></div>';
  return html;
}

function prevCalWeek(){ calViewDate.setDate(calViewDate.getDate()-7); renderCalView(); }
function nextCalWeek(){ calViewDate.setDate(calViewDate.getDate()+7); renderCalView(); }

// MONTH VIEW
function buildMonthView(){
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  const todayStr = fmtDateKey(new Date());
  const title = new Date(year,month).toLocaleDateString('en',{month:'long',year:'numeric'}).toUpperCase();
  
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const prevDays = new Date(year,month,0).getDate();
  
  let html = buildNavRow(title, 'prevCalMonth()', 'nextCalMonth()');
  html += '<div class="month-grid">';
  
  // Day headers
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    html += `<div class="month-header-cell">${d}</div>`;
  });
  
  // Previous month days
  for(let i=firstDay-1;i>=0;i--){
    const d = prevDays-i;
    html += `<div class="month-day-cell other-month"><div class="month-day-num">${d}</div></div>`;
  }
  
  // Current month days
  for(let d=1;d<=daysInMonth;d++){
    const ds = year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isToday = ds === todayStr;
    const bks = getBookingsForDate(ds);
    html += `<div class="month-day-cell ${isToday?'today-cell':''}" onclick="jumpToDay('${ds}')">
      <div class="month-day-num">${d}</div>`;
    bks.slice(0,3).forEach(b => {
      html += `<div class="month-event-dot ${getSvcColor(b.service)}" onclick="event.stopPropagation();showEventPopup('${b.id}')">${b.name.split(' ')[0]}</div>`;
    });
    if(bks.length>3) html += `<div style="font-family:monospace;font-size:8px;color:var(--gray);">+${bks.length-3} more</div>`;
    html += '</div>';
  }
  
  // Fill remaining
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for(let d=1;d<=remaining;d++){
    html += `<div class="month-day-cell other-month"><div class="month-day-num">${d}</div></div>`;
  }
  html += '</div>';
  return html;
}

function prevCalMonth(){ calViewDate.setMonth(calViewDate.getMonth()-1); renderCalView(); }
function nextCalMonth(){ calViewDate.setMonth(calViewDate.getMonth()+1); renderCalView(); }

function jumpToDay(dateStr){
  const parts = dateStr.split('-');
  calViewDate = new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
  setCalView('day');
  document.querySelectorAll('.cal-view-tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase() === 'day');
  });
}

// EVENT POPUP
function showEventPopup(id){
  const b = getBookings().find(function(bk){ return bk.id === id; });
  if(!b) return;
  const popup = document.createElement('div');
  popup.className = 'event-popup';
  popup.id = 'eventPopup';
  
  var confirmBtn = b.status==='pending' ? '<button class="act-btn ok" data-action="confirm" data-id="' + b.id + '">Confirm</button>' : '';
  var markPaidBtn = b.paymentStatus !== 'paid' ? '<button class="act-btn" data-action="markpaid" data-id="' + b.id + '">✓ Mark Paid</button>' : '';
  var completeBtn = b.status==='confirmed' ? '<button class="act-btn ok" data-action="complete" data-id="' + b.id + '">✓ Complete</button>' : '';
  var notesBtn = '<button class="act-btn" data-action="notes" data-id="' + b.id + '" data-name="' + b.name.replace(/"/g,'&quot;') + '">📝 Notes</button>';
  var deleteBtn = '<button class="act-btn danger" data-action="delete" data-id="' + b.id + '">Delete</button>';
  
  popup.innerHTML = '<div class="event-popup-inner">' +
    '<div style="height:4px;background:var(--black);margin:-24px -24px 16px;"></div>' +
    '<div class="event-popup-header">' +
    '<div><div class="event-popup-name">' + b.name + '</div>' +
    '<div class="event-popup-svc">' + (b.serviceName||b.service) + (b.groupSize>1?' · Group of '+b.groupSize:'') + '</div></div>' +
    '<button class="event-popup-close" onclick="closeEventPopup()">✕</button>' +
    '</div>' +
    '<div class="event-popup-details">' +
    '<div class="event-detail"><div class="event-detail-label">Date & Time</div><div class="event-detail-val">' + b.date + '<br>' + b.time + '</div></div>' +
    '<div class="event-detail"><div class="event-detail-label">Price</div><div class="event-detail-val">' + fmtP(b.price||0) + '<br><span class="pay-status ' + (b.paymentStatus==='paid'?'pay-paid':'pay-pending') + '">' + (b.paymentStatus==='paid'?'PAID':b.paymentStatus==='cash'?'CASH':'PAY PENDING') + '</span></div></div>' +
    '<div class="event-detail"><div class="event-detail-label">Phone</div><div class="event-detail-val">' + (b.phone||'—') + '</div></div>' +
    '<div class="event-detail"><div class="event-detail-label">Address</div><div class="event-detail-val" style="font-size:11px;">' + (b.address||'—') + '</div></div>' +
    '</div>' +
    '<div class="event-popup-actions" style="flex-wrap:wrap;gap:8px;">' +
    confirmBtn + completeBtn + markPaidBtn + notesBtn + deleteBtn +
    '<span class="bk-status s-' + b.status + '" style="margin-left:auto;align-self:center;">' + b.status + '</span>' +
    '</div></div>';
  
  document.body.appendChild(popup);
  popup.addEventListener('click', function(e){ if(e.target===popup) closeEventPopup(); });
}

function closeEventPopup(){
  const p = document.getElementById('eventPopup');
  if(p) p.remove();
}


// ─── ANIMATED SUBMIT ───
async function submitBookingAnimated(){
  const btn = document.getElementById('submitBtn');
  if(!btn || btn.classList.contains('loading')) return;

  // ── Validate ──
  clearFieldErrors();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName')?.value?.trim()||'';
  const email     = document.getElementById('bookEmail').value.trim();
  const phone     = document.getElementById('bookPhone')?.value?.trim()||'';
  const addr      = document.getElementById('bookAddr').value.trim();
  const apt       = document.getElementById('bookApt')?.value?.trim()||'';
  const fullAddr  = apt ? addr+', '+apt : addr;

  const missing = [];
  if(!firstName){ showFieldError('firstName', currentLang==='es'?'Campo obligatorio':'Required'); missing.push(currentLang==='es'?'Nombre':'First name'); }
  if(!email)    { showFieldError('bookEmail',  currentLang==='es'?'Campo obligatorio':'Required'); missing.push('Email'); }
  if(!phone)    { showFieldError('bookPhone',  currentLang==='es'?'Campo obligatorio':'Required'); missing.push(currentLang==='es'?'Teléfono':'Phone'); }
  if(!addr)     { showFieldError('bookAddr',   currentLang==='es'?'Ingresa tu dirección':'Required'); missing.push(currentLang==='es'?'Dirección':'Address'); }
  if(!selDate)  { showFieldError('calGrid',    currentLang==='es'?'Selecciona una fecha':'Select a date'); missing.push(currentLang==='es'?'Fecha':'Date'); }
  if(!selTime)  { showFieldError('timeSlots',  currentLang==='es'?'Selecciona una hora':'Select a time'); missing.push(currentLang==='es'?'Hora':'Time'); }
  selPay = selPay || window.selectedPay || null;
  if(!selPay)   { showFieldError('paymentGrid',currentLang==='es'?'Selecciona método de pago':'Select payment'); missing.push(currentLang==='es'?'Método de pago':'Payment method'); }

  if(missing.length){
    showToast((currentLang==='es'?'Falta: ':'Missing: ')+missing.join(', '), 'error', 5000);
    return;
  }

  // Save address for next time
  if(currentUser && addr) saveUserAddress(currentUser.email, {addr, apt});

  // ── Build booking object ──
  const svcId = document.getElementById('serviceSelect').value;
  const rc    = document.getElementById('refCode')?.value?.trim()?.toUpperCase()||'';
  const svc   = getServices().find(s=>s.id===svcId) || getServices()[0];
  const sc    = getSurcharge(selTime.split(':')[0], svc.price);
  let total   = sc.price * selGroup;
  let affCode = null;
  if(rc){
    const rUser = getUsers().find(u=>u.code===rc);
    const rAff  = getAffs().find(a=>a.code===rc);
    if(rUser && !currentUser) total = Math.round(total*0.9);
    if(rAff) affCode = rc;
  }
  const b = {
    id: Date.now().toString(),
    name: `${firstName} ${lastName}`.trim(),
    email, phone,
    service: svc.id, serviceName: svc.name,
    date: selDate, time: selTime, groupSize: selGroup,
    address: fullAddr, refCode: rc, affiliateCode: affCode,
    payment: selPay, status: 'pending',
    paymentStatus: (selPay==='card'||selPay==='link') ? 'pending' : 'cash',
    source: 'web',
    price: window._couponFinalPrice || total,
    originalPrice: total,
    couponCode: window._activeCoupon ? window._activeCoupon.code : null,
    couponDiscount: window._couponDiscount || 0,
    createdAt: new Date().toISOString()
  };

  // ── Start loading animation ──
  btn.classList.add('loading');
  btn.querySelector('.submit-arrow').style.display='none';
  btn.querySelector('.submit-text').style.display='none';
  btn.querySelector('.submit-dots').style.display='flex';

  // ── Try ONLY the DB save — UI code must not be inside this catch ──
  let savedOk = false;
  try {
    const ok = await API.saveBooking(b);
    if(!ok) console.warn('Booking saved to localStorage fallback, id='+b.id);
    savedOk = true;
  } catch(err) {
    console.error('Booking save error:', err);
    btn.classList.remove('loading');
    btn.querySelector('.submit-dots').style.display='none';
    btn.querySelector('.submit-arrow').style.display='block';
    btn.querySelector('.submit-text').style.display='block';
    showToast('Error al guardar la cita. Intenta de nuevo.','error',4000);
    return;
  }

  // ── Save succeeded — all UI code runs outside try/catch ──
  allBookings.push(b);
  curBookingData = b;

  btn.querySelector('.submit-dots').style.display='none';
  btn.querySelector('.submit-check').style.display='block';
  btn.querySelector('.submit-check').textContent='✓';
  btn.querySelector('.submit-text').style.display='block';
  btn.classList.remove('loading');
  btn.classList.add('success');

  // Reset form
  selDate=null; selTime=null; selGroup=1; selPay=null; window.selectedPay=null;
  window._activeCoupon=null; window._couponDiscount=0; window._couponFinalPrice=null;
  renderCal();
  document.getElementById('timeSlotsWrap').style.display='none';
  document.getElementById('pricePreview').classList.remove('show');
  document.querySelectorAll('.grp-btn').forEach(function(gb,i){gb.classList.toggle('selected',i===0);});
  document.querySelectorAll('.pay-option').forEach(function(o){o.classList.remove('selected');});
  setTimeout(function(){
    btn.classList.remove('success');
    btn.querySelector('.submit-check').style.display='none';
    btn.querySelector('.submit-arrow').style.display='block';
    btn.querySelector('.submit-text').textContent=currentLang==='es'?'SOLICITAR CITA':'REQUEST APPOINTMENT';
  }, 3000);

  // ── Open payment modal based on method ──
  var payMethod = b.payment;
  var snapDate  = b.date;
  var snapTime  = b.time;
  var snapGroup = b.groupSize || 1;
  var snapSvc   = b.serviceName || svc.name;
  var snapPrice = fmtP(b.price);
  var snapName  = b.name;
  var grpSuffix = snapGroup > 1 ? ' × ' + snapGroup : '';

  console.log('[booking] payment method:', payMethod);

  if(payMethod === 'cash'){
    btn.querySelector('.submit-text').textContent = currentLang==='es' ? 'Confirmado' : 'Confirmed';
    showToast(currentLang==='es' ? '✓ Cita confirmada — pagas en efectivo al momento del servicio' : '✓ Booking confirmed — pay cash at appointment', 'success', 4500);
    launchConfetti();
    var cb = document.getElementById('confirmBody');
    if(cb) cb.textContent = snapName+'\n'+snapSvc+grpSuffix+'\n'+snapDate+' at '+snapTime+'\n'+fullAddr+'\nPayment: CASH (pay at appointment)\nTotal: '+snapPrice+'\n\nBooking confirmed! You\'ll hear from us on WhatsApp shortly.';
    var bs = document.getElementById('boldPaySection');
    if(bs) bs.style.display = 'none';
    showModal('confirmModal');

  } else if(payMethod === 'transfer'){
    btn.querySelector('.submit-text').textContent = currentLang==='es' ? 'Enviado' : 'Sent';
    showToast(currentLang==='es' ? '✓ Solicitud enviada — transfiere para confirmar' : '✓ Request sent — transfer to confirm booking', 'success', 5000);
    document.getElementById('tmBankName').textContent = BANK_NAME;
    document.getElementById('tmAccount').textContent = BANK_ACCOUNT + ' (' + BANK_TYPE + ')';
    document.getElementById('tmType').textContent = BANK_TYPE;
    document.getElementById('tmHolder').textContent = BANK_HOLDER;
    document.getElementById('tmNequi').textContent = BANK_NEQUI;
    showModal('transferModal');

  } else if(payMethod === 'card' || payMethod === 'link'){
    btn.querySelector('.submit-text').textContent = currentLang==='es' ? 'Redirigiendo...' : 'Redirecting...';
    // Show full-screen spinner while Bold signature fetch runs
    var boldSpinner = document.createElement('div');
    boldSpinner.id = 'boldSpinner';
    boldSpinner.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;';
    boldSpinner.innerHTML = '<div style="width:36px;height:36px;border:3px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;"></div>'
      + '<p style="color:#fff;font-family:\'Space Mono\',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">'+(currentLang==='es'?'Redirigiendo al pago...':'Redirecting to payment...')+'</p>';
    document.body.appendChild(boldSpinner);
    var boldOrderId = 'MB-' + b.id + '-' + Date.now();
    openBoldPayment(b.price, 'Michail Barber - '+(b.serviceName||b.service), boldOrderId)
      .catch(function(){})
      .finally(function(){ var s=document.getElementById('boldSpinner'); if(s) s.remove(); });

  } else if(payMethod === 'paypal'){
    btn.querySelector('.submit-text').textContent = currentLang==='es' ? 'Enviado' : 'Sent';
    showToast(currentLang==='es' ? '✓ Solicitud enviada — completa el pago por PayPal' : '✓ Request sent — complete PayPal payment', 'success', 5000);
    var pi = document.getElementById('paypalBookingInfo');
    if(pi) pi.textContent = snapName+' · '+snapSvc+grpSuffix+' · '+snapDate+' at '+snapTime+' · '+snapPrice;
    var pl = document.getElementById('paypalPayLink');
    if(pl) pl.href = PAYPAL_LINK + '/' + (b.price/1000).toFixed(0) + 'COP';
    showModal('paypalModal');
  }
}

function launchConfetti(){
  const wrap = document.getElementById('confettiWrap');
  if(!wrap) return;
  wrap.classList.add('active');
  wrap.innerHTML = '';
  // Monochrome palette — black, white, gray tones
  const colors = ['#0d0d0d','#ffffff','#3d3d3d','#8a8a8a','#e8e6e0','#0d0d0d','#ffffff'];
  const shapes = ['rect','line'];
  for(let i=0;i<50;i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random()*100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.animationDelay = Math.random()*1.8 + 's';
    piece.style.animationDuration = (2.2+Math.random()*1.5) + 's';
    const isLine = Math.random() > 0.5;
    piece.style.width = isLine ? (2+Math.random()*2)+'px' : (5+Math.random()*6)+'px';
    piece.style.height = isLine ? (12+Math.random()*10)+'px' : (5+Math.random()*6)+'px';
    piece.style.opacity = (0.4+Math.random()*0.6).toString();
    wrap.appendChild(piece);
  }
  setTimeout(() => {
    wrap.classList.remove('active');
    wrap.innerHTML='';
  }, 4500);
}


function preselectService(svcId){
  const sel = document.getElementById('serviceSelect');
  if(sel){
    sel.value = svcId;
    updatePricePreview();
  }
}


// ─── PALETTE SYSTEM ───
const PALETTES = [
  // ── NEUTRALS ──
  {
    id: 'noir',
    name: 'Noir',
    tag: 'Default · Classic',
    vars: { '--black':'#0d0d0d', '--white':'#ffffff', '--off':'#f5f4f1', '--gray':'#8a8a8a', '--light':'#e8e6e0', '--green':'#25a244', '--red':'#c0392b' },
    swatches: ['#0d0d0d','#ffffff','#f5f4f1','#8a8a8a','#e8e6e0']
  },
  {
    id: 'onyx',
    name: 'Onyx',
    tag: 'Pure Black',
    vars: { '--black':'#000000', '--white':'#ffffff', '--off':'#f2f2f2', '--gray':'#777777', '--light':'#e0e0e0', '--green':'#00c853', '--red':'#d50000' },
    swatches: ['#000000','#ffffff','#f2f2f2','#777777','#e0e0e0']
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    tag: 'Warm Gray',
    vars: { '--black':'#2c2c2c', '--white':'#fefefe', '--off':'#f4f2ef', '--gray':'#888480', '--light':'#e2deda', '--green':'#27ae60', '--red':'#c0392b' },
    swatches: ['#2c2c2c','#fefefe','#f4f2ef','#888480','#e2deda']
  },
  {
    id: 'linen',
    name: 'Linen',
    tag: 'Warm & Soft',
    vars: { '--black':'#2a1f0e', '--white':'#faf7f2', '--off':'#f0e8d8', '--gray':'#8c7a6a', '--light':'#d8cbb8', '--green':'#5a8a5a', '--red':'#a0403a' },
    swatches: ['#2a1f0e','#faf7f2','#f0e8d8','#8c7a6a','#d8cbb8']
  },
  {
    id: 'espresso',
    name: 'Espresso',
    tag: 'Rich Brown',
    vars: { '--black':'#1c1209', '--white':'#fdf9f4', '--off':'#f5ede0', '--gray':'#8a7566', '--light':'#dfd2c0', '--green':'#6abf69', '--red':'#bf4040' },
    swatches: ['#1c1209','#fdf9f4','#f5ede0','#8a7566','#dfd2c0']
  },
  // ── BLUES ──
  {
    id: 'midnight',
    name: 'Midnight',
    tag: 'Deep Blue',
    vars: { '--black':'#0a0e1a', '--white':'#f0f4ff', '--off':'#e4eaf8', '--gray':'#6b7899', '--light':'#c8d3f0', '--green':'#3fb950', '--red':'#f85149' },
    swatches: ['#0a0e1a','#f0f4ff','#e4eaf8','#6b7899','#c8d3f0']
  },
  {
    id: 'ocean',
    name: 'Ocean',
    tag: 'Bold Blue',
    vars: { '--black':'#0d3b6e', '--white':'#f0f8ff', '--off':'#ddeeff', '--gray':'#5a7fa8', '--light':'#b8d4f0', '--green':'#00b894', '--red':'#e17055' },
    swatches: ['#0d3b6e','#f0f8ff','#ddeeff','#5a7fa8','#b8d4f0']
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    tag: 'Electric Blue',
    vars: { '--black':'#1a1aff', '--white':'#ffffff', '--off':'#f0f0ff', '--gray':'#7070cc', '--light':'#ccccff', '--green':'#00d084', '--red':'#ff4444' },
    swatches: ['#1a1aff','#ffffff','#f0f0ff','#7070cc','#ccccff']
  },
  // ── REDS ──
  {
    id: 'crimson',
    name: 'Crimson',
    tag: 'Bold Red',
    vars: { '--black':'#8b0000', '--white':'#fff5f5', '--off':'#ffe8e8', '--gray':'#b06060', '--light':'#f0c0c0', '--green':'#2ecc71', '--red':'#c0392b' },
    swatches: ['#8b0000','#fff5f5','#ffe8e8','#b06060','#f0c0c0']
  },
  {
    id: 'rouge',
    name: 'Rouge',
    tag: 'Deep Rose',
    vars: { '--black':'#6d1a2a', '--white':'#fff8f8', '--off':'#fce8ec', '--gray':'#a06070', '--light':'#ecc0ca', '--green':'#27ae60', '--red':'#e74c3c' },
    swatches: ['#6d1a2a','#fff8f8','#fce8ec','#a06070','#ecc0ca']
  },
  {
    id: 'tomato',
    name: 'Tomato',
    tag: 'Vivid Red',
    vars: { '--black':'#c0392b', '--white':'#ffffff', '--off':'#fff0ee', '--gray':'#c07060', '--light':'#f5c5be', '--green':'#27ae60', '--red':'#922b21' },
    swatches: ['#c0392b','#ffffff','#fff0ee','#c07060','#f5c5be']
  },
  // ── GREENS ──
  {
    id: 'forest',
    name: 'Forest',
    tag: 'Deep Green',
    vars: { '--black':'#1a3a2a', '--white':'#f4faf6', '--off':'#e2f2e8', '--gray':'#5a8a6a', '--light':'#b8dac4', '--green':'#27ae60', '--red':'#e74c3c' },
    swatches: ['#1a3a2a','#f4faf6','#e2f2e8','#5a8a6a','#b8dac4']
  },
  {
    id: 'sage',
    name: 'Sage',
    tag: 'Muted Green',
    vars: { '--black':'#2d3e2e', '--white':'#f7faf7', '--off':'#eaf2ea', '--gray':'#7a9a7a', '--light':'#c8dcc8', '--green':'#4caf50', '--red':'#e57373' },
    swatches: ['#2d3e2e','#f7faf7','#eaf2ea','#7a9a7a','#c8dcc8']
  },
  {
    id: 'emerald',
    name: 'Emerald',
    tag: 'Vivid Green',
    vars: { '--black':'#004d2e', '--white':'#f0fff6', '--off':'#d8f5e8', '--gray':'#4a8a6a', '--light':'#a8dcc0', '--green':'#00b894', '--red':'#d63031' },
    swatches: ['#004d2e','#f0fff6','#d8f5e8','#4a8a6a','#a8dcc0']
  },
  // ── SPECIAL ──
  {
    id: 'gold',
    name: 'Gold',
    tag: 'Premium',
    vars: { '--black':'#1a1200', '--white':'#fffdf0', '--off':'#fff8d6', '--gray':'#8a7a40', '--light':'#e8d890', '--green':'#27ae60', '--red':'#c0392b' },
    swatches: ['#1a1200','#fffdf0','#fff8d6','#8a7a40','#e8d890']
  },
  {
    id: 'purple',
    name: 'Violet',
    tag: 'Bold Purple',
    vars: { '--black':'#2d0a4e', '--white':'#faf5ff', '--off':'#f0e6ff', '--gray':'#7a5a9a', '--light':'#d4b8f0', '--green':'#00b894', '--red':'#ff6b6b' },
    swatches: ['#2d0a4e','#faf5ff','#f0e6ff','#7a5a9a','#d4b8f0']
  },
  {
    id: 'plum',
    name: 'Plum',
    tag: 'Dark Purple',
    vars: { '--black':'#4a0e5e', '--white':'#fdf8ff', '--off':'#f5e8ff', '--gray':'#8a6aa0', '--light':'#d8b8f0', '--green':'#2ecc71', '--red':'#e74c3c' },
    swatches: ['#4a0e5e','#fdf8ff','#f5e8ff','#8a6aa0','#d8b8f0']
  },
  {
    id: 'teal',
    name: 'Teal',
    tag: 'Bold Teal',
    vars: { '--black':'#004d4d', '--white':'#f0ffff', '--off':'#d8f5f5', '--gray':'#4a8a8a', '--light':'#a8dcdc', '--green':'#00b894', '--red':'#e17055' },
    swatches: ['#004d4d','#f0ffff','#d8f5f5','#4a8a8a','#a8dcdc']
  },
  {
    id: 'copper',
    name: 'Copper',
    tag: 'Warm Metal',
    vars: { '--black':'#5c2d0a', '--white':'#fff9f5', '--off':'#faecd8', '--gray':'#a07050', '--light':'#e8c8a0', '--green':'#27ae60', '--red':'#c0392b' },
    swatches: ['#5c2d0a','#fff9f5','#faecd8','#a07050','#e8c8a0']
  },
  {
    id: 'rose',
    name: 'Rose',
    tag: 'Soft Pink',
    vars: { '--black':'#3d0020', '--white':'#fff5f8', '--off':'#ffe8f0', '--gray':'#a06080', '--light':'#f0c0d8', '--green':'#2ecc71', '--red':'#e74c3c' },
    swatches: ['#3d0020','#fff5f8','#ffe8f0','#a06080','#f0c0d8']
  },
];

const SWATCH_LABELS = ['Background','Surface','Off-white','Gray','Border'];

let activePalette = DB.get('activePalette','noir');

function applyPalette(id){
  const p = PALETTES.find(p=>p.id===id);
  if(!p) return;
  const root = document.documentElement;
  Object.entries(p.vars).forEach(([k,v]) => root.style.setProperty(k,v));
  activePalette = id;
  DB.set('activePalette', id);
}

function renderPaletteTab(){
  const list = document.getElementById('paletteList');
  if(!list) return;
  list.innerHTML = PALETTES.map(p => `
    <div class="palette-item ${activePalette===p.id?'active-palette':''}" onclick="applyPalette('${p.id}');renderPaletteTab()">
      <div class="palette-header">
        <span class="palette-name">${p.name}</span>
        <span class="palette-tag">${p.tag}${activePalette===p.id?' · Active':''}</span>
      </div>
      <div class="palette-cols">
        ${p.swatches.map((c,i)=>`<div class="palette-col">
          <div class="swatch" style="background:${c};border:1px solid rgba(0,0,0,0.06);"></div>
          <div class="swatch-label">${SWATCH_LABELS[i]}</div>
        </div>`).join('')}
      </div>
    </div>`).join('');
}



// ─── ADMIN FULL APP ───

function openAdminApp(){
  const app = document.getElementById('adminApp');
  const overlay = document.getElementById('adminOverlay');
  if(!app) return;
  app.style.display = 'flex';
  app.classList.add('open');
  if(overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.admin-nav-btn').forEach(b=>b.classList.remove('active'));
  const firstBtn = document.querySelector('.admin-nav-btn');
  if(firstBtn) firstBtn.classList.add('active');
  showAdminPage('dashboard', firstBtn);
}

function closeAdminApp(){
  const app = document.getElementById('adminApp');
  const overlay = document.getElementById('adminOverlay');
  if(app){ app.classList.remove('open'); app.style.display='none'; }
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  if(currentUser && currentUser.isAdmin){
    document.getElementById('navSignInBtn').textContent = '⚙';
  }
}

function showAdminPage(page, btn){
  currentAdminPage = page;
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('adminPageTitle').textContent = {
    dashboard:'Dashboard', calendar:'Calendar', bookings:'Bookings',
    clients:'Clients', services:'Services', more:'More', add:'Add Booking',
    block:'Block Hours', zones:'Zones', affiliates:'Affiliates',
    subs:'Subscriptions', design:'Design', waitlist:'Waitlist', coupons:'Coupons', promo:'Promo Popup'
  }[page] || page;
  renderAdminPage(page);
}

// ── CLIENTS PAGE ──
async function buildClientsPage(body){
  body.innerHTML = '<p style="font-size:13px;color:var(--gray);padding:20px 0;">Loading clients…</p>';
  let users = [];
  try {
    const r = await fetch('/.netlify/functions/users');
    if(r.ok) users = await r.json();
  } catch(e){ users = getUsers(); }

  // Merge with local localStorage users
  const local = getUsers();
  local.forEach(function(lu){
    if(!users.find(function(u){ return u.email===lu.email; })) users.push(lu);
  });

  if(!users.length){ body.innerHTML='<p style="font-size:13px;color:var(--gray);padding:20px 0;">No clients yet.</p>'; return; }

  let search = '';
  function render(){
    const filtered = search ? users.filter(function(u){
      const q=search.toLowerCase();
      return (u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)||(u.phone||'').includes(q);
    }) : users;

    body.innerHTML = `
      <div style="margin-bottom:14px;">
        <input type="text" class="form-input" id="clientSearch" placeholder="Search name, email, phone…" value="${search}" oninput="window._clientSearch=this.value;buildClientsPage(document.getElementById('adminAppBody'))" style="width:100%;">
      </div>
      <p style="font-family:monospace;font-size:10px;color:var(--gray);margin-bottom:14px;">${filtered.length} client${filtered.length!==1?'s':''}</p>
      ${filtered.map(function(u){
        const phone=(u.phone||'').replace(/\D/g,'');
        const bks=allBookings.filter(function(b){ return b.email===u.email; });
        return `<div class="admin-card"><div class="admin-card-inner">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <div>
              <div style="font-size:14px;font-weight:500;">${u.name||'—'}</div>
              <div style="font-family:monospace;font-size:10px;color:var(--gray);line-height:1.8;">${u.email||''}<br>${u.phone||''}</div>
            </div>
            <span style="font-family:monospace;font-size:9px;padding:3px 8px;background:var(--off);color:var(--gray);">${u.user_type||u.userType||'client'}</span>
          </div>
          <div style="font-family:monospace;font-size:10px;color:var(--gray);margin-bottom:10px;">
            Code: <strong>${u.code||'—'}</strong> · Bookings: <strong>${bks.length}</strong> · Referrals: <strong>${u.referral_count||u.referralCount||0}</strong>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${phone?`<a href="https://wa.me/${phone}" target="_blank" class="act-btn" style="text-decoration:none;border-color:var(--green);color:var(--green);">WhatsApp</a>`:''}
            <button class="act-btn" onclick="adminEditClient('${u.email}')">Edit</button>
            <button class="act-btn danger" onclick="adminDeleteClient('${u.email}')">Delete</button>
          </div>
        </div></div>`;
      }).join('')}`;
    if(document.getElementById('clientSearch')) document.getElementById('clientSearch').focus();
  }
  search = window._clientSearch||'';
  render();
}

function adminEditClient(email){
  const users=getUsers(); const u=users.find(function(x){ return x.email===email; });
  if(!u){ showToast('Client not found in local cache','error',2000); return; }
  const s=document.createElement('div'); s.className='float-sheet';
  s.innerHTML=`<div class="float-inner"><h3 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:18px;">EDIT CLIENT</h3>
    <div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="ecName" value="${u.name||''}"></div>
    <div class="form-group"><label class="form-label">Phone</label><input type="text" class="form-input" id="ecPhone" value="${u.phone||''}"></div>
    <div style="display:flex;gap:10px;margin-top:6px;">
      <button class="modal-btn" onclick="this.closest('.float-sheet').remove()">Cancel</button>
      <button class="modal-btn primary" onclick="adminSaveClient('${email}',this)">SAVE →</button>
    </div></div>`;
  document.body.appendChild(s);
}

async function adminSaveClient(email, btn){
  const name=document.getElementById('ecName').value.trim();
  const phone=document.getElementById('ecPhone').value.trim();
  await API.updateUser(email, {name, phone}).catch(console.error);
  const users=getUsers(); const u=users.find(function(x){ return x.email===email; });
  if(u){ u.name=name; u.phone=phone; saveUsers(users); }
  btn.closest('.float-sheet').remove();
  showToast('✓ Client updated','success',2000);
  buildClientsPage(document.getElementById('adminAppBody'));
}

async function adminDeleteClient(email){
  if(!confirm('Delete client ' + email + '? This cannot be undone.')) return;
  await fetch('/.netlify/functions/users?email='+encodeURIComponent(email), {method:'DELETE'}).catch(console.error);
  const users=getUsers().filter(function(u){ return u.email!==email; }); saveUsers(users);
  showToast('✓ Client deleted','success',2000);
  buildClientsPage(document.getElementById('adminAppBody'));
}

function renderAdminPage(page){
  const body = document.getElementById('adminAppBody');
  switch(page){
    case 'dashboard': body.innerHTML = buildDashboardPage(); break;
    case 'calendar': body.innerHTML = '<div id="calViewWrap" style="background:var(--white);padding:16px;"></div>'; setTimeout(initCalView,50); break;
    case 'bookings': body.innerHTML = buildBookingsPage(); break;
    case 'clients': buildClientsPage(body); break;
    case 'add': body.innerHTML = buildAddBookingPage(); break;
    case 'block': body.innerHTML = buildBlockPage(); break;
    case 'services': body.innerHTML = buildServicesPage(); break;
    case 'zones': body.innerHTML = buildZonesPage(); break;
    case 'affiliates': body.innerHTML = buildAffiliatesPage(); break;
    case 'subs': body.innerHTML = buildSubsPage(); break;
    case 'promo': body.innerHTML = buildPromoPopupPage(); break;
    case 'design': body.innerHTML = buildDesignPage(); setTimeout(renderPaletteTab,50); break;
    case 'more': body.innerHTML = buildMorePage(); break;
    case 'waitlist': body.innerHTML = buildWaitlistPage(); break;
    case 'coupons': body.innerHTML = buildCouponsPage(); break;
    case 'clientnotes': body.innerHTML = buildClientNotesHTML(currentAdminPage.split('|')[1]||''); break;
  }
}

// ── DASHBOARD ──
// buildDashboardPage defined below

// ── BOOKINGS ──
function buildBookingsPage(){
  const bks = getBookings();
  if(!bks.length) return '<p style="font-size:13px;color:var(--gray);padding:20px 0;">No bookings yet.</p>';
  return '<div id="bkList">' + [...bks].reverse().map(b=>{
    return '<div class="admin-card" data-bkid="' + b.id + '" style="cursor:pointer;">' +
      '<div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
      '<div style="flex:1;">' +
      '<div style="font-size:14px;font-weight:500;margin-bottom:3px;">' + b.name + '</div>' +
      '<div style="font-family:monospace;font-size:10px;color:var(--gray);line-height:1.6;">' + b.date + ' · ' + b.time + (b.groupSize>1?' · x'+b.groupSize:'') + '<br>' + (b.serviceName||b.service) + ' · ' + fmtP(b.price||0) + '</div>' +
      '</div>' +
      '<span class="bk-status s-' + b.status + '">' + b.status + '</span>' +
      '</div></div>';
  }).join('') + '</div>';
}

// ── ADD BOOKING ──
function buildAddBookingPage(){
  return `
    <div class="admin-section-title">Add Booking</div>
    <p style="font-size:13px;color:var(--gray);margin-bottom:16px;line-height:1.6;">Add bookings from WhatsApp or in person.</p>
    <div class="admin-card"><div class="admin-card-inner">
      <div class="form-row"><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="mnName" placeholder="Client name"></div><div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-input" id="mnPhone" placeholder="+1..."></div></div>
      <div class="form-group"><label class="form-label">Service</label><select class="form-select" id="mnService">${getServices().map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="mnDate"></div><div class="form-group"><label class="form-label">Time</label><input type="time" class="form-input" id="mnTime"></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Group Size</label><input type="number" class="form-input" id="mnGroup" value="1" min="1" max="10"></div><div class="form-group"><label class="form-label">Custom Price (optional)</label><input type="number" class="form-input" id="mnPrice" placeholder="150000"></div></div>
      <div class="form-group"><label class="form-label">Address / Notes</label><input type="text" class="form-input" id="mnNotes" placeholder="Address..."></div>
      <button class="submit-btn" onclick="addManualBk();renderAdminPage('add')">ADD BOOKING →</button>
    </div></div>`;
}

// ── BLOCK HOURS ──
function buildBlockPage(){
  return `
    <div class="admin-section-title">Block Hours</div>
    <div class="admin-card"><div class="admin-card-inner">
      <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="blDate"></div>
      <div class="form-group"><label class="form-label">Block Type</label><select class="form-select" id="blType" onchange="toggleBlockType()"><option value="day">Full Day</option><option value="range">Time Range</option></select></div>
      <div id="blRangeWrap" style="display:none;"><div class="form-row"><div class="form-group"><label class="form-label">From</label><input type="time" class="form-input" id="blFrom"></div><div class="form-group"><label class="form-label">To</label><input type="time" class="form-input" id="blTo"></div></div></div>
      <div class="form-group"><label class="form-label">Reason</label><input type="text" class="form-input" id="blReason" placeholder="Personal, travel..."></div>
      <button class="submit-btn" onclick="addBlock();renderAdminPage('block')">BLOCK →</button>
    </div></div>
    <div class="admin-section-title" style="margin-top:20px;">Blocked Slots</div>
    ${buildBlockListCards()}`;
}

function buildBlockListCards(){
  const blocks = getBlocks();
  if(!blocks.length) return '<p style="font-size:13px;color:var(--gray);">No blocked slots.</p>';
  return blocks.map((bl,i)=>`
    <div class="admin-card"><div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:13px;font-weight:500;">${bl.date}</div>
        <div style="font-family:monospace;font-size:10px;color:var(--gray);">${bl.timeFrom?bl.timeFrom+'–'+bl.timeTo:'All day'}${bl.reason?' · '+bl.reason:''}</div>
      </div>
      <button class="act-btn danger" onclick="removeBlock(${i});renderAdminPage('block')">Remove</button>
    </div></div>`).join('');
}

// ── SERVICES ──
function buildServicesPage(){
  return `
    <div class="admin-section-title">Services</div>
    ${getServices().map((s,i)=>`
    <div class="admin-card"><div class="admin-card-inner">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-family:'Bebas Neue',sans-serif;font-size:22px;">${s.name}</span>
        <button class="act-btn danger" onclick="deleteService(${i});renderAdminPage('services')">Remove</button>
      </div>
      <div class="form-row" style="margin-bottom:8px;">
        <div class="form-group" style="margin:0;"><label class="form-label">Name (EN)</label><input type="text" class="form-input" value="${s.name}" onchange="updateService(${i},'name',this.value)"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Name (ES)</label><input type="text" class="form-input" value="${s.nameEs||''}" onchange="updateService(${i},'nameEs',this.value)"></div>
      </div>
      <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Description (EN)</label><input type="text" class="form-input" value="${s.desc}" onchange="updateService(${i},'desc',this.value)"></div>
      <div class="form-row">
        <div class="form-group" style="margin:0;"><label class="form-label">Price (COP)</label><input type="number" class="form-input" value="${s.price}" onchange="updateService(${i},'price',parseInt(this.value))"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">Badge</label><input type="text" class="form-input" value="${s.badge||''}" placeholder="MOST POPULAR" onchange="updateService(${i},'badge',this.value)"></div>
      </div>
    </div></div>`).join('')}
    <button class="submit-btn" style="margin-top:8px;" onclick="addNewService();renderAdminPage('services')">+ ADD SERVICE</button>`;
}

// ── ZONES ──
function buildZonesPage(){
  return `
    <div class="admin-section-title">Coverage Zones</div>
    <p style="font-size:13px;color:var(--gray);margin-bottom:16px;line-height:1.6;">Manage your coverage cities. These appear in the marquee.</p>
    ${getZones().map((z,i)=>`
    <div class="admin-card"><div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:14px;">${z}</span>
      <button class="act-btn danger" onclick="removeZone(${i});renderAdminPage('zones')">Remove</button>
    </div></div>`).join('')}
    <div style="display:flex;gap:10px;margin-top:14px;">
      <input type="text" class="form-input" id="newZoneInput" placeholder="New city (e.g. Cali, Bogotá)" style="flex:1;">
      <button class="act-btn" onclick="addZone();renderAdminPage('zones')" style="white-space:nowrap;padding:13px 16px;">ADD +</button>
    </div>`;
}

// ── AFFILIATES ──
function buildAffiliatesPage(){
  const affs = getAffs(); const bks = getBookings();
  if(!affs.length) return '<div class="admin-section-title">Affiliates</div><p style="font-size:13px;color:var(--gray);">No affiliates yet.</p>';
  return `<div class="admin-section-title">Affiliates</div>` +
    affs.map((a,i)=>{
      const rate = a.weeklyRefs>=5?0.15:0.10;
      const completed = bks.filter(b=>b.affiliateCode===a.code&&b.status==='completed');
      const earned = completed.reduce((s,b)=>s+(b.price||0)*rate,0);
      const owed = Math.max(0,earned-(a.totalPaid||0));
      return `<div class="admin-card"><div class="admin-card-inner">
        <div style="font-size:14px;font-weight:500;margin-bottom:4px;">${a.name}</div>
        <div style="font-family:monospace;font-size:10px;color:var(--gray);line-height:1.7;margin-bottom:10px;">${a.code}<br>${a.email}<br>Bank: ${a.bank||'—'} · ${a.payoutFreq}<br>Completed: ${completed.length} · Rate: ${rate*100}% · Owed: ${fmtP(owed)}</div>
        <button class="act-btn ok" onclick="openPayAff(${i})">Mark Paid</button>
      </div></div>`;
    }).join('');
}

// ── SUBSCRIPTIONS ──
function buildSubsPage(){
  const subs = getSubs();
  const active = subs.filter(s=>s.active).length;
  return `<div class="admin-section-title">Subscriptions</div>
    <div class="admin-stat-big" style="margin-bottom:16px;"><div class="stat-val">${active}<span style="font-size:20px;color:var(--gray);">/${MAX_SUBS}</span></div><div class="stat-lbl">Active Spots</div></div>
    ${subs.length?subs.map(s=>`<div class="admin-card"><div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div><div style="font-size:14px;font-weight:500;margin-bottom:3px;">${s.name}</div>
      <div style="font-family:monospace;font-size:10px;color:var(--gray);line-height:1.6;">${s.plan} · ${fmtP(s.price||0)}<br>Renews: ${s.renewDate} · Used: ${s.used||0}/4</div></div>
      <span class="bk-status ${s.active?'s-confirmed':'s-completed'}">${s.active?'active':'expired'}</span>
    </div></div>`).join(''):'<p style="font-size:13px;color:var(--gray);">No subscriptions yet.</p>'}`;
}

// ── DESIGN ──
function buildDesignPage(){
  var hasPhoto = !!DB.get('heroPhoto',null);
  var heroVideoUrl = DB.get('heroVideoUrl','');
  var h = '';
  h += '<div class="admin-section-title">Hero Media</div>';
  // Video URL input
  h += '<div class="form-group">';
  h += '<label class="form-label">Video URL (YouTube, Vimeo o MP4)</label>';
  h += '<div style="display:flex;gap:8px;">';
  h += '<input type="text" id="heroVideoUrlInput" class="form-input" placeholder="https://www.youtube.com/watch?v=..." value="' + (heroVideoUrl||'') + '" style="flex:1">';
  h += '<button class="act-btn" onclick="saveHeroVideoUrl()">Guardar</button>';
  h += '</div>';
  if(heroVideoUrl){
    h += '<button class="export-btn" onclick="removeHeroVideo()" style="border-color:var(--red);color:var(--red);margin-top:8px;">✕ Quitar video</button>';
  }
  h += '<p style="font-size:11px;color:var(--gray);margin-top:6px;">El video reemplaza la foto en el hero. YouTube/Vimeo recomendado.</p>';
  h += '</div>';
  // Photo upload
  h += '<div class="form-group">';
  if(hasPhoto && !heroVideoUrl){
    h += '<img id="heroPrev" class="hero-preview show" src="' + DB.get('heroPhoto','') + '">';
    h += '<div style="display:flex;gap:8px;margin-bottom:8px;">';
    h += '<button class="export-btn" onclick="document.getElementById(&quot;heroFileInput&quot;).click()">📷 Cambiar Foto</button>';
    h += '<button class="export-btn" onclick="removeHeroPhoto()" style="border-color:var(--red);color:var(--red);">Quitar</button>';
    h += '</div>';
  } else if(!heroVideoUrl){
    h += '<div class="hero-placeholder-preview" onclick="document.getElementById(&quot;heroFileInput&quot;).click()"><p>Tap para subir foto</p></div>';
    h += '<div style="display:flex;gap:8px;margin-bottom:8px;">';
    h += '<button class="export-btn" onclick="document.getElementById(&quot;heroFileInput&quot;).click()">📷 Subir Foto (máx 5MB)</button>';
    h += '</div>';
  }
  h += '</div>';
  h += '<input type="file" id="heroFileInput" accept="image/*" style="display:none;" onchange="handleHeroUpload(this)">';
  h += '<div class="admin-section-title">Color Palette</div>';
  h += '<p style="font-size:13px;color:var(--gray);margin-bottom:16px;line-height:1.6;">Choose a palette. Updates the entire site instantly.</p>';
  h += '<div class="palette-list" id="paletteList"></div>';
  return h;
}

// ── MORE ──
function buildMorePage(){
  return `<div class="admin-section-title">More</div>
    <div class="quick-actions" style="grid-template-columns:1fr;">
      <div class="quick-action" onclick="showAdminPage('add',null)"><div class="quick-action-icon">＋</div><div class="quick-action-label">Add Manual Booking</div></div>
      <div class="quick-action" onclick="showAdminPage('block',null)"><div class="quick-action-icon">⊗</div><div class="quick-action-label">Block Hours</div></div>
      <div class="quick-action" onclick="showAdminPage('zones',null)"><div class="quick-action-icon">◎</div><div class="quick-action-label">Coverage Zones</div></div>
      <div class="quick-action" onclick="showAdminPage('affiliates',null)"><div class="quick-action-icon">◈</div><div class="quick-action-label">Affiliates</div></div>
      <div class="quick-action" onclick="showAdminPage('waitlist',null)"><div class="quick-action-icon">⏳</div><div class="quick-action-label">Waitlist</div></div>
      <div class="quick-action" onclick="showAdminPage('coupons',null)"><div class="quick-action-icon">🏷</div><div class="quick-action-label">Coupons</div></div>
      <div class="quick-action" onclick="showAdminPage('subs',null)"><div class="quick-action-icon">◇</div><div class="quick-action-label">Subscriptions</div></div>
      <div class="quick-action" onclick="showAdminPage('design',null)"><div class="quick-action-icon">◐</div><div class="quick-action-label">Design & Colors</div>
      <div class="quick-action" onclick="showAdminPage('promo',null)"><div class="quick-action-icon">🎉</div><div class="quick-action-label">Promo Popup</div></div></div>
    </div>
    <button class="act-btn danger" style="width:100%;padding:14px;margin-top:16px;" onclick="doSignOut()">SIGN OUT</button>`;
}


// ─── DASHBOARD ANALYTICS ───
let chartPeriod = 'month'; // week | month | year


function setChartPeriod(btn, period){
  chartPeriod = period;
  renderAdminPage('dashboard');
}

function buildDashboardPage(){
  const bks = getBookings();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthBks = bks.filter(b=>{
    const d=new Date(b.date);
    return d.getMonth()===thisMonth && d.getFullYear()===thisYear && b.status!=='cancelled';
  });
  const lastMonthBks = bks.filter(b=>{
    const d=new Date(b.date);
    const lm=thisMonth===0?11:thisMonth-1;
    const ly=thisMonth===0?thisYear-1:thisYear;
    return d.getMonth()===lm && d.getFullYear()===ly && b.status!=='cancelled';
  });

  const todayBks = bks.filter(b=>b.date===todayStr && b.status!=='cancelled');
  const pendingBks = bks.filter(b=>b.status==='pending');
  const completed = bks.filter(b=>b.status==='completed');
  const thisMonthRev = thisMonthBks.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.price||0),0);
  const lastMonthRev = lastMonthBks.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.price||0),0);
  const totalRev = completed.reduce((s,b)=>s+(b.price||0),0);
  const avgPrice = completed.length ? Math.round(totalRev/completed.length) : 0;
  const revChange = lastMonthRev>0 ? Math.round((thisMonthRev-lastMonthRev)/lastMonthRev*100) : 0;
  const bkChange = lastMonthBks.length>0 ? Math.round((thisMonthBks.length-lastMonthBks.length)/lastMonthBks.length*100) : 0;
  const calClosed = isCalClosed();
  var calChecked = calClosed ? '' : 'checked';
  var calStatus = calClosed ? 'CLOSED' : 'OPEN';

  let html = '';

  // Calendar toggle
  html += '<div class="cal-toggle-bar" style="margin-bottom:16px;">';
  html += '<span class="cal-toggle-label" id="calToggleLabel">Calendar ' + (calClosed?'CLOSED':'OPEN') + '</span>';
  html += '<label class="toggle-switch"><input type="checkbox" ' + calChecked + ' onchange="toggleCal();"><span class="toggle-slider"></span></label>';
  html += '</div>';

  // Export buttons
  html += '<div class="export-row">';
  html += '<button class="export-btn" onclick="exportClientsCSV()">⬇ Clients CSV</button>';
  html += '<button class="export-btn" onclick="exportPDFReport()">⬇ PDF Report</button>';
  html += '</div>';

  // Stats
  html += '<div class="dash-section"><div class="dash-section-title">Overview</div>';
  html += '<div class="dash-stats-row">';
  html += '<div class="dash-stat"><div class="dash-stat-val">' + todayBks.length + '</div><div class="dash-stat-lbl">Today</div></div>';
  html += '<div class="dash-stat"><div class="dash-stat-val">' + pendingBks.length + '</div><div class="dash-stat-lbl">Pending</div></div>';
  html += '<div class="dash-stat"><div class="dash-stat-val">' + thisMonthBks.length + '</div><div class="dash-stat-lbl">This Month</div>';
  html += '<div class="dash-stat-sub ' + (bkChange>=0?'':'down') + '">' + (bkChange>=0?'↑':'↓') + ' ' + Math.abs(bkChange) + '% vs last</div></div>';
  html += '<div class="dash-stat"><div class="dash-stat-val" style="font-size:22px;">' + fmtP(thisMonthRev) + '</div><div class="dash-stat-lbl">Revenue</div>';
  html += '<div class="dash-stat-sub ' + (revChange>=0?'':'down') + '">' + (revChange>=0?'↑':'↓') + ' ' + Math.abs(revChange) + '% vs last</div></div>';
  html += '<div class="dash-stat"><div class="dash-stat-val" style="font-size:22px;">' + fmtP(avgPrice) + '</div><div class="dash-stat-lbl">Avg Price</div></div>';
  html += '<div class="dash-stat"><div class="dash-stat-val">' + completed.length + '</div><div class="dash-stat-lbl">Total Done</div></div>';
  html += '</div></div>';

  // Period comparison
  html += '<div class="dash-section"><div class="dash-section-title">Month Comparison</div>';
  html += '<div class="period-compare">';
  html += '<div class="period-card"><div class="period-tag">Last Month</div><div class="period-val">' + lastMonthBks.length + '</div><div class="period-sub">' + fmtP(lastMonthRev) + ' revenue</div></div>';
  html += '<div class="period-card current"><div class="period-tag">This Month</div><div class="period-val">' + thisMonthBks.length + '</div><div class="period-sub">' + fmtP(thisMonthRev) + ' revenue</div></div>';
  html += '</div>';

  // Line chart
  html += '<div class="chart-wrap">';
  html += '<div class="chart-header"><span class="chart-title">Bookings Over Time</span>';
  html += '<div class="chart-legend"><div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--black);width:12px;height:2px;"></div>This</div>';
  html += '<div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--gray);width:12px;height:2px;border-top:2px dashed var(--gray);"></div>Last</div></div></div>';
  html += '<div class="chart-period-tabs">';
  html += '<button class="chart-tab ' + (chartPeriod==='week'?'active':'') + '" onclick="setChartPeriod(this,&quot;week&quot;)">Week</button>';
  html += '<button class="chart-tab ' + (chartPeriod==='month'?'active':'') + '" onclick="setChartPeriod(this,&quot;month&quot;)">Month</button>';
  html += '<button class="chart-tab ' + (chartPeriod==='year'?'active':'') + '" onclick="setChartPeriod(this,&quot;year&quot;)">Year</button>';
  html += '</div>';
  html += buildLineChart(bks);
  html += '</div></div>';

  // Busiest days
  html += '<div class="dash-section"><div class="dash-section-title">Busiest Days</div>';
  html += '<div class="chart-wrap">' + buildDayHeatmap(bks) + '</div></div>';

  // Weekly bars
  html += '<div class="dash-section"><div class="dash-section-title">Weekly Breakdown</div>';
  html += '<div class="chart-wrap">' + buildWeekBars(bks) + '</div></div>';

  // Services
  html += '<div class="dash-section"><div class="dash-section-title">Services Performance</div>';
  html += '<div class="chart-wrap">' + buildServiceBars(bks) + '</div></div>';

  // Donut
  html += '<div class="dash-section"><div class="dash-section-title">Distribution</div>';
  html += '<div class="chart-wrap">' + buildDonutChart(bks) + '</div></div>';

  // Top clients
  html += '<div class="dash-section"><div class="dash-section-title">Top Clients</div>';
  html += '<div class="chart-wrap">' + buildTopClients(bks) + '</div></div>';

  // Quick actions
  html += '<div class="dash-section"><div class="dash-section-title">Quick Actions</div>';
  html += '<div class="quick-actions">';
  html += '<div class="quick-action" onclick="showAdminPage(&quot;add&quot;,null);document.querySelectorAll(&quot;.admin-nav-btn&quot;).forEach(function(b){b.classList.remove(&quot;active&quot;);})"><div class="quick-action-icon">＋</div><div class="quick-action-label">Add Booking</div></div>';
  html += '<div class="quick-action" onclick="showAdminPage(&quot;block&quot;,null);document.querySelectorAll(&quot;.admin-nav-btn&quot;).forEach(function(b){b.classList.remove(&quot;active&quot;);})"><div class="quick-action-icon">⊗</div><div class="quick-action-label">Block Hours</div></div>';
  html += '<div class="quick-action" onclick="showAdminPage(&quot;design&quot;,null);document.querySelectorAll(&quot;.admin-nav-btn&quot;).forEach(function(b){b.classList.remove(&quot;active&quot;);})"><div class="quick-action-icon">◐</div><div class="quick-action-label">Design</div></div>';
  html += '<div class="quick-action" onclick="showAdminPage(&quot;calendar&quot;,document.querySelectorAll(&quot;.admin-nav-btn&quot;)[1])"><div class="quick-action-icon">◫</div><div class="quick-action-label">Calendar</div></div>';
  html += '</div></div>';

  // Today bookings
  if(todayBks.length){
    html += '<div class="dash-section"><div class="dash-section-title">Today</div>';
    todayBks.forEach(b=>{
  html += '<div class="admin-card" onclick="showEventPopup(\"' + b.id + '\")">';
      html += '<div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<div><div style="font-size:14px;font-weight:500;margin-bottom:2px;">' + b.name + '</div>';
      html += '<div style="font-family:Space Mono,monospace;font-size:10px;color:var(--gray);">' + b.time + ' · ' + (b.serviceName||b.service) + '</div>';
      html += '<span class="bk-status s-' + b.status + '">' + b.status + '</span>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  return html;
}

// ── LINE CHART ──
function buildLineChart(bks){
  const now = new Date();
  let labels = [], currentData = [], prevData = [];

  if(chartPeriod === 'week'){
    // Last 7 days vs 7 days before
    for(let i=6;i>=0;i--){
      const d = new Date(now); d.setDate(d.getDate()-i);
      const ds = d.toISOString().split('T')[0];
      const pd = new Date(now); pd.setDate(pd.getDate()-i-7);
      const pds = pd.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en',{weekday:'short'}));
      currentData.push(bks.filter(b=>b.date===ds&&b.status!=='cancelled').length);
      prevData.push(bks.filter(b=>b.date===pds&&b.status!=='cancelled').length);
    }
  } else if(chartPeriod === 'month'){
    // This month vs last month by day
    const daysInMonth = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const ds = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const lm = now.getMonth()===0?11:now.getMonth()-1;
      const ly = now.getMonth()===0?now.getFullYear()-1:now.getFullYear();
      const lds = `${ly}-${String(lm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if(d%5===0||d===1||d===daysInMonth) labels.push(String(d));
      else labels.push('');
      currentData.push(bks.filter(b=>b.date===ds&&b.status!=='cancelled').length);
      prevData.push(bks.filter(b=>b.date===lds&&b.status!=='cancelled').length);
    }
  } else {
    // This year vs last year by month
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for(let m=0;m<12;m++){
      labels.push(monthNames[m]);
      currentData.push(bks.filter(b=>{
        const d=new Date(b.date); return d.getMonth()===m&&d.getFullYear()===now.getFullYear()&&b.status!=='cancelled';
      }).length);
      prevData.push(bks.filter(b=>{
        const d=new Date(b.date); return d.getMonth()===m&&d.getFullYear()===now.getFullYear()-1&&b.status!=='cancelled';
      }).length);
    }
  }

  const maxVal = Math.max(...currentData, ...prevData, 1);
  const W = 280, H = 100, PAD = 20;
  const points = (data) => data.map((v,i) => {
    const x = PAD + (i/(data.length-1||1))*(W-PAD*2);
    const y = H - PAD - (v/maxVal)*(H-PAD*2);
    return `${x},${y}`;
  }).join(' ');

  const curPts = currentData.map((v,i) => ({
    x: PAD + (i/(currentData.length-1||1))*(W-PAD*2),
    y: H - PAD - (v/maxVal)*(H-PAD*2)
  }));
  const prePts = prevData.map((v,i) => ({
    x: PAD + (i/(prevData.length-1||1))*(W-PAD*2),
    y: H - PAD - (v/maxVal)*(H-PAD*2)
  }));

  const curvePath = (pts) => pts.length < 2 ? '' : pts.reduce((acc,p,i) => {
    if(i===0) return `M ${p.x} ${p.y}`;
    const prev = pts[i-1];
    const cx = (prev.x+p.x)/2;
    return acc + ` C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  },'');

  // X axis labels
  const xLabels = labels.map((l,i) => {
    if(!l) return '';
    const x = PAD + (i/(labels.length-1||1))*(W-PAD*2);
    return `<text x="${x}" y="${H-2}" text-anchor="middle" fill="#8a8a8a" font-size="7" font-family="Space Mono">${l}</text>`;
  }).join('');

  // Y axis lines
  const yLines = [0,0.25,0.5,0.75,1].map(t => {
    const y = H - PAD - t*(H-PAD*2);
    return `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="#e8e6e0" stroke-width="1"/>
    <text x="${PAD-3}" y="${y+3}" text-anchor="end" fill="#8a8a8a" font-size="7" font-family="Space Mono">${Math.round(t*maxVal)}</text>`;
  }).join('');

  // Fill area under current line
  const fillPath = curPts.length >= 2
    ? `${curvePath(curPts)} L ${curPts[curPts.length-1].x} ${H-PAD} L ${PAD} ${H-PAD} Z`
    : '';

  return `<svg class="line-chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${yLines}
    ${fillPath ? `<path d="${fillPath}" fill="rgba(13,13,13,0.05)" stroke="none"/>` : ''}
    ${prePts.length>=2 ? `<path d="${curvePath(prePts)}" fill="none" stroke="#e8e6e0" stroke-width="1.5" stroke-dasharray="4,3"/>` : ''}
    ${curPts.length>=2 ? `<path d="${curvePath(curPts)}" fill="none" stroke="#0d0d0d" stroke-width="2"/>` : ''}
    ${curPts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#0d0d0d"/>`).join('')}
    ${xLabels}
  </svg>`;
}

// ── DAY HEATMAP ──
function buildDayHeatmap(bks){
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const counts = days.map((_,i) => bks.filter(b => {
    const d = new Date(b.date+'T12:00:00');
    return d.getDay()===i && b.status!=='cancelled';
  }).length);
  const max = Math.max(...counts,1);
  return `<div class="chart-title" style="margin-bottom:10px;">Bookings by Day of Week</div>
    <div class="day-heatmap">
      ${days.map((d,i)=>`<div class="day-heat-cell">
        <div style="font-family:monospace;font-size:9px;font-weight:700;color:var(--gray);margin-bottom:3px;">${counts[i]}</div>
        <div style="width:100%;height:48px;display:flex;align-items:flex-end;">
          <div style="width:100%;height:${Math.max(4,Math.round(counts[i]/max*44))}px;background:${counts[i]===max?'var(--accent,#d4a84b)':'var(--light)'};border-radius:2px 2px 0 0;transition:height 0.3s;"></div>
        </div>
        <div class="day-heat-lbl" style="margin-top:4px;">${d}</div>
      </div>`).join('')}
    </div>`;
}

// ── SERVICE BARS ──
function buildServiceBars(bks){
  const services = getServices();
  const counts = services.map(s => bks.filter(b=>b.service===s.id&&b.status!=='cancelled').length);
  const revs = services.map(s => bks.filter(b=>b.service===s.id&&b.status==='completed').reduce((sum,b)=>sum+(b.price||0),0));
  const max = Math.max(...counts,1);
  return `<div class="chart-title" style="margin-bottom:12px;">Services Performance</div>
    ${services.map((s,i)=>`
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;font-weight:500;">${s.name}</span>
        <span style="font-family:monospace;font-size:10px;color:var(--gray);">${counts[i]} · ${fmtP(revs[i])}</span>
      </div>
      <div style="height:6px;background:var(--light);width:100%;">
        <div style="height:100%;background:var(--black);width:${Math.round(counts[i]/max*100)}%;transition:width 0.5s ease;"></div>
      </div>
    </div>`).join('')}`;
}

// ── TOP CLIENTS ──
function buildTopClients(bks){
  const clientMap = {};
  bks.filter(b=>b.status!=='cancelled').forEach(b=>{
    if(!b.name) return;
    if(!clientMap[b.name]) clientMap[b.name] = {name:b.name, phone:b.phone||'', count:0, total:0, dates:[]};
    clientMap[b.name].count++;
    clientMap[b.name].total += b.price||0;
    clientMap[b.name].dates.push(b.date);
  });
  const sorted = Object.values(clientMap).sort((a,b)=>b.count-a.count).slice(0,5);
  if(!sorted.length) return '<p style="font-size:13px;color:var(--gray);">No data yet.</p>';
  return sorted.map((c,i)=>`
    <div class="client-row">
      <div class="client-rank">${i+1}</div>
      <div class="client-info">
        <div class="client-name">${c.name}</div>
        <div class="client-meta">${c.phone} · ${fmtP(c.total)} total · Last: ${c.dates.sort().reverse()[0]||'—'}</div>
      </div>
      <div class="client-count">${c.count}</div>
    </div>`).join('');
}


// ─── DONUT CHART ───
function buildDonutChart(bks){
  const services = getServices();
  const counts = services.map(s => bks.filter(b=>b.service===s.id&&b.status!=='cancelled').length);
  const total = counts.reduce((a,b)=>a+b,0)||1;
  const colors = ['#0d0d0d','#8a8a8a','#e8e6e0','#3d3d3d','#c0c0c0'];
  
  const R = 40, cx = 50, cy = 50, strokeW = 16;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  
  const segments = services.map((s,i) => {
    const pct = counts[i]/total;
    const dash = pct * circumference;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${colors[i]||'#ccc'}"
      stroke-width="${strokeW}" stroke-dasharray="${dash} ${circumference-dash}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dash;
    return seg;
  }).join('');

  return `<div class="chart-title" style="margin-bottom:10px;">Service Distribution</div>
  <div class="donut-wrap">
    <svg class="donut-svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--light)" stroke-width="${strokeW}"/>
      ${segments}
      <text x="${cx}" y="${cy+4}" text-anchor="middle" font-family="Space Mono" font-size="10" font-weight="700" fill="var(--black)">${total}</text>
    </svg>
    <div class="donut-legend">
      ${services.map((s,i)=>`<div class="donut-legend-item">
        <div class="donut-legend-dot" style="background:${colors[i]||'#ccc'};"></div>
        <span class="donut-legend-label">${s.name}</span>
        <span class="donut-legend-pct">${Math.round(counts[i]/total*100)}%</span>
      </div>`).join('')}
    </div>
  </div>`;
}

// ─── WEEK COMPARISON BARS ───
function buildWeekBars(bks){
  const now = new Date();
  const weeks = ['W1','W2','W3','W4'];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth===0?11:currentMonth-1;
  const lastYear = currentMonth===0?currentYear-1:currentYear;

  const getWeekNum = (dateStr) => {
    const d = new Date(dateStr);
    return Math.ceil(d.getDate()/7) - 1;
  };

  const currCounts = [0,0,0,0];
  const prevCounts = [0,0,0,0];

  bks.forEach(b => {
    if(b.status==='cancelled') return;
    const d = new Date(b.date);
    const w = Math.min(3, Math.ceil(d.getDate()/7)-1);
    if(d.getMonth()===currentMonth && d.getFullYear()===currentYear) currCounts[w]++;
    if(d.getMonth()===lastMonth && d.getFullYear()===lastYear) prevCounts[w]++;
  });

  const max = Math.max(...currCounts, ...prevCounts, 1);

  return `<div class="chart-title" style="margin-bottom:10px;">Weekly Bookings</div>
  <div class="chart-legend" style="margin-bottom:8px;">
    <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--black);width:12px;height:4px;"></div>This month</div>
    <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--light);width:12px;height:4px;"></div>Last month</div>
  </div>
  <div class="week-bars">
    ${weeks.map((w,i)=>`<div class="week-bar-col">
      <div class="week-bar-val">${currCounts[i]}</div>
      <div style="display:flex;gap:2px;align-items:flex-end;height:70px;">
        <div class="week-bar-prev" style="height:${Math.round(prevCounts[i]/max*70)}px;flex:1;"></div>
        <div class="week-bar-curr" style="height:${Math.round(currCounts[i]/max*70)}px;flex:1;"></div>
      </div>
      <div class="week-bar-lbl">${w}</div>
    </div>`).join('')}
  </div>`;
}

// ─── EXPORT CSV ───
function exportClientsCSV(){
  const bks = getBookings();
  const clientMap = {};
  bks.forEach(b => {
    if(!b.email&&!b.name) return;
    const key = b.email||b.name;
    if(!clientMap[key]) clientMap[key] = {name:b.name||'',email:b.email||'',phone:b.phone||'',visits:0,total:0,lastVisit:'',firstVisit:''};
    clientMap[key].visits++;
    clientMap[key].total += b.price||0;
    if(!clientMap[key].firstVisit||b.date<clientMap[key].firstVisit) clientMap[key].firstVisit=b.date;
    if(!clientMap[key].lastVisit||b.date>clientMap[key].lastVisit) clientMap[key].lastVisit=b.date;
  });
  const rows = [['Name','Email','Phone','Visits','Total Revenue','First Visit','Last Visit']];
  Object.values(clientMap).sort((a,b)=>b.visits-a.visits).forEach(c => {
    rows.push([c.name,c.email,c.phone,c.visits,c.total,c.firstVisit,c.lastVisit]);
  });
  const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'michail_barber_clients_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();
}

// ─── EXPORT PDF REPORT ───
function exportPDFReport(){
  const bks = getBookings();
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const thisMonthBks = bks.filter(b=>{const d=new Date(b.date);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear&&b.status!=='cancelled';});
  const lastMonthBks = bks.filter(b=>{const d=new Date(b.date);const lm=thisMonth===0?11:thisMonth-1;const ly=thisMonth===0?thisYear-1:thisYear;return d.getMonth()===lm&&d.getFullYear()===ly&&b.status!=='cancelled';});
  const completed = bks.filter(b=>b.status==='completed');
  const totalRev = completed.reduce((s,b)=>s+(b.price||0),0);
  const thisRev = thisMonthBks.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.price||0),0);
  const avgPrice = completed.length?Math.round(totalRev/completed.length):0;

  const services = getServices();
  const svcStats = services.map(s=>({
    name:s.name,
    count:bks.filter(b=>b.service===s.id&&b.status!=='cancelled').length,
    rev:bks.filter(b=>b.service===s.id&&b.status==='completed').reduce((s,b)=>s+(b.price||0),0)
  }));

  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayCounts=days.map((_,i)=>bks.filter(b=>{const d=new Date(b.date+'T12:00:00');return d.getDay()===i&&b.status!=='cancelled';}).length);
  const maxDay=Math.max(...dayCounts,1);
  const busiestDay=days[dayCounts.indexOf(Math.max(...dayCounts))];

  const clientMap={};
  bks.filter(b=>b.status!=='cancelled').forEach(b=>{
    if(!b.name)return;
    if(!clientMap[b.name])clientMap[b.name]={name:b.name,count:0,total:0};
    clientMap[b.name].count++;
    clientMap[b.name].total+=b.price||0;
  });
  const topClients=Object.values(clientMap).sort((a,b)=>b.count-a.count).slice(0,5);
  const totalBks = bks.filter(b=>b.status!=='cancelled').length||1;

  // Build HTML using string concatenation - no nested template literals
  var h = '';
  h += '<!DOCTYPE html><html><head><meta charset="UTF-8">';
  h += '<style>*{margin:0;padding:0;box-sizing:border-box;}';
  h += 'body{font-family:"Space Mono",monospace;background:#fff;color:#0d0d0d;padding:32px;}';
  h += 'h1{font-size:32px;margin-bottom:4px;}';
  h += '.sub{font-size:10px;color:#8a8a8a;letter-spacing:.15em;margin-bottom:32px;}';
  h += '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}';
  h += '.card{border:1px solid #e8e6e0;padding:16px;}';
  h += '.card-val{font-size:32px;font-weight:700;line-height:1;margin-bottom:4px;}';
  h += '.card-lbl{font-size:9px;color:#8a8a8a;letter-spacing:.15em;text-transform:uppercase;}';
  h += '.sec{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#8a8a8a;margin:24px 0 12px;border-bottom:1px solid #e8e6e0;padding-bottom:8px;}';
  h += '.bar-wrap{display:flex;align-items:center;gap:8px;margin-bottom:8px;}';
  h += '.bar-bg{flex:1;height:8px;background:#f0f0f0;}';
  h += '.bar-fill{height:100%;background:#0d0d0d;}';
  h += '.bar-name{font-size:10px;width:120px;}';
  h += '.bar-val{font-size:10px;width:80px;text-align:right;}';
  h += '.day-row{display:flex;gap:8px;align-items:flex-end;height:60px;margin-top:8px;}';
  h += '.dc{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}';
  h += '.db{width:100%;background:#0d0d0d;}';
  h += '.dl{font-size:8px;color:#8a8a8a;}';
  h += 'table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;}';
  h += 'th{text-align:left;padding:8px;background:#f5f4f1;font-size:9px;letter-spacing:.1em;}';
  h += 'td{padding:8px;border-bottom:1px solid #f0f0f0;}';
  h += 'footer{margin-top:32px;font-size:9px;color:#8a8a8a;text-align:center;border-top:1px solid #e8e6e0;padding-top:16px;}';
  // removed broken line
// ─── HERO PHOTO UPLOAD ───
function _applyHeroPhoto(src){
  const img=document.getElementById('heroImg');
  if(!img||!src) return;
  img.src=src;
  img.style.display='block';
  const hint=document.getElementById('heroPhotoHint');
  if(hint) hint.style.display='none';
  img.onerror=function(){ img.style.display='none'; if(hint) hint.style.display=''; };
}

function _getEmbedUrl(url){
  if(!url) return '';
  // YouTube
  var ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if(ytMatch) return 'https://www.youtube.com/embed/'+ytMatch[1]+'?autoplay=1&mute=1&loop=1&playlist='+ytMatch[1]+'&controls=0&showinfo=0&rel=0';
  // Vimeo
  var vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if(vmMatch) return 'https://player.vimeo.com/video/'+vmMatch[1]+'?autoplay=1&muted=1&loop=1&background=1';
  // Direct MP4 or other
  return url;
}

function _applyHeroVideo(url){
  const iframe=document.getElementById('heroVideoEmbed');
  const img=document.getElementById('heroImg');
  const hint=document.getElementById('heroPhotoHint');
  if(!iframe) return;
  const embedUrl=_getEmbedUrl(url);
  if(embedUrl){
    iframe.src=embedUrl;
    iframe.style.display='block';
    if(img) img.style.display='none';
    if(hint) hint.style.display='none';
  }
}

function saveHeroVideoUrl(){
  const inp=document.getElementById('heroVideoUrlInput');
  const url=(inp?inp.value:'').trim();
  DB.set('heroVideoUrl', url);
  API.saveSetting('hero_video_url', url).catch(console.error);
  if(url){
    _applyHeroVideo(url);
    // clear photo display
    const img=document.getElementById('heroImg');
    if(img) img.style.display='none';
  } else {
    // restore photo if exists
    const stored=DB.get('heroPhoto',null);
    if(stored) _applyHeroPhoto(stored);
    const iframe=document.getElementById('heroVideoEmbed');
    if(iframe){ iframe.src=''; iframe.style.display='none'; }
  }
  showToast(url ? '✓ Video guardado' : '✓ Video eliminado');
  renderAdminPage('design');
}

function removeHeroVideo(){
  DB.set('heroVideoUrl','');
  API.saveSetting('hero_video_url','').catch(console.error);
  const iframe=document.getElementById('heroVideoEmbed');
  if(iframe){ iframe.src=''; iframe.style.display='none'; }
  // Restore photo if exists
  const stored=DB.get('heroPhoto',null);
  if(stored) _applyHeroPhoto(stored);
  showToast('✓ Video eliminado');
  renderAdminPage('design');
}

function initHeroUpload(){
  try {
    // Video URL takes priority over photo
    const storedVideo=DB.get('heroVideoUrl','');
    if(storedVideo){ _applyHeroVideo(storedVideo); return; }
    const stored=DB.get('heroPhoto',null);
    if(stored){ _applyHeroPhoto(stored); return; }
    // Not in localStorage — try DB settings (visible to all visitors)
    fetch('/.netlify/functions/data?type=settings')
      .then(r=>r.ok?r.json():null)
      .then(s=>{
        if(s&&s.hero_video_url){ DB.set('heroVideoUrl',s.hero_video_url); _applyHeroVideo(s.hero_video_url); }
        else if(s&&s.hero_photo){ _applyHeroPhoto(s.hero_photo); }
      })
      .catch(()=>{});
  } catch(e){}
}

function handleHeroUpload(input){
  if(!input.files[0]) return;
  const file=input.files[0];
  const sizeMB=(file.size/(1024*1024)).toFixed(1);

  if(file.size > 5 * 1024 * 1024){
    alert('La foto pesa '+sizeMB+'MB. El límite es 5MB. Comprime la imagen antes de subir.');
    return;
  }

  const reader=new FileReader();
  reader.onload=function(e){
    const dataUrl=e.target.result;
    // Store in localStorage for instant admin preview
    try{ DB.set('heroPhoto',dataUrl); }catch(err){}
    // Save to DB so all visitors see the photo
    API.saveSetting('hero_photo',dataUrl)
      .then(ok=>{ if(!ok) console.warn('Hero photo not saved to DB'); })
      .catch(console.error);
    _applyHeroPhoto(dataUrl);
    renderAdminPage('design');
    showToast('✓ Foto actualizada ('+sizeMB+'MB)','success',2500);
  };
  reader.onerror=function(){ alert('Error: no se pudo leer el archivo.'); };
  reader.readAsDataURL(file);
}

function removeHeroPhoto(){
  DB.set('heroPhoto',null);
  API.saveSetting('hero_photo','').catch(console.error);
  const img=document.getElementById('heroImg');
  if(img){ img.src=''; img.style.display='none'; }
  const hint=document.getElementById('heroPhotoHint');
  if(hint) hint.style.display='';
  renderAdminPage('design');
}


function clearWaitlist(){
  if(confirm('Clear all waitlist entries?')){DB.set('waitlist',[]);renderAdminPage('waitlist');}
}

// ─── PHONE COUNTRY CODE ───
function updatePhoneCode(selectId, inputId){
  const sel = document.getElementById(selectId);
  const inp = document.getElementById(inputId);
  if(!sel || !inp) return;
  // Strip old code and set new
  const code = sel.value;
  const current = inp.value.replace(/^\+\d+\s?/, '');
  inp.placeholder = code === '+57' ? '300 123 4567' : '555 000 0000';
}

function getFullPhone(selectId, inputId){
  const sel = document.getElementById(selectId);
  const inp = document.getElementById(inputId);
  if(!sel || !inp) return inp?.value || '';
  const code = sel.value;
  const num = inp.value.trim().replace(/^\+\d+\s?/, '');
  return code + ' ' + num;
}


// ─── CLIENT NOTES & PHOTOS ───
function getClientNotes(){ return DB.get('clientNotes', {}); }
function saveClientNotes(n){ DB.set('clientNotes', n); }

function addClientNote(clientName, note, photos){
  const notes = getClientNotes();
  if(!notes[clientName]) notes[clientName] = [];
  const entry = {
    date: new Date().toISOString().split('T')[0],
    note: note,
    photos: photos || [],
    id: Date.now().toString()
  };
  notes[clientName].unshift(entry);
  saveClientNotes(notes);
  return entry;
}

function buildClientNotesHTML(clientName){
  const notes = getClientNotes();
  const clientNotes = notes[clientName] || [];
  let h = '<div class="client-notes-wrap">';
  h += '<div class="admin-section-title" style="font-size:18px;">Notes & Photos — ' + clientName + '</div>';
  
  // Add note form
  h += '<div class="note-add-form">';
  h += '<div class="form-group"><label class="form-label">Note</label>';
  h += '<textarea class="form-textarea" id="newNoteText" placeholder="Fade at 2, keeps beard short on sides, prefers no product..."></textarea></div>';
  h += '<div class="form-group"><label class="form-label">Photos</label>';
  h += '<input type="file" id="newNotePhotos" accept="image/*" multiple style="display:none;" onchange="previewNotePhotos(this)">';
  h += '<button class="act-btn" onclick="document.getElementById(&quot;newNotePhotos&quot;).click()" style="margin-bottom:8px;">+ Add Photos</button>';
  h += '<div id="notePhotoPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"></div></div>';
  h += '<button class="submit-btn" onclick="saveNote(this.dataset.client)" data-client="' + clientName.replace(/"/g,'&quot;') + '">SAVE NOTE \u2192</button>';
  h += '</div>';
  
  // Existing notes
  if(clientNotes.length){
    clientNotes.forEach(function(n){
      h += '<div class="note-card">';
      h += '<div class="note-date">' + n.date + '</div>';
      h += '<div class="note-text">' + n.note + '</div>';
      if(n.photos && n.photos.length){
        h += '<div class="note-photos">';
        n.photos.forEach(function(p){
          h += '<img class="note-photo" src="' + p + '" onclick="viewPhoto(this.src)">';
        });
        h += '</div>';
      }
      h += '</div>';
    });
  } else {
    h += '<p style="font-size:13px;color:var(--gray);padding:16px 0;">No notes yet. Add the first one above.</p>';
  }
  h += '</div>';
  return h;
}

function previewNotePhotos(input){
  const preview = document.getElementById('notePhotoPreview');
  if(!preview) return;
  preview.innerHTML = '';
  Array.from(input.files).forEach(function(file){
    const reader = new FileReader();
    reader.onload = function(e){
      const img = document.createElement('img');
      img.className = 'note-photo';
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function saveNote(clientName){
  const text = document.getElementById('newNoteText')?.value?.trim();
  if(!text){ alert('Please add a note'); return; }
  const preview = document.getElementById('notePhotoPreview');
  const photos = preview ? Array.from(preview.querySelectorAll('img')).map(function(i){return i.src;}) : [];
  addClientNote(clientName, text, photos);
  // Refresh
  const body = document.getElementById('adminAppBody');
  if(body) body.innerHTML = buildClientNotesHTML(clientName);
  alert('Note saved!');
}

function viewPhoto(src){
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
  div.onclick = function(){ div.remove(); };
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;';
  div.appendChild(img);
  document.body.appendChild(div);
}

// ─── WAITLIST ───
function getWaitlist(){ return DB.get('waitlist', []); }
function saveWaitlist(w){ DB.set('waitlist', w); }

function addToWaitlist(name, phone, email, date, service){
  const wl = getWaitlist();
  const entry = {
    id: Date.now().toString(),
    name, phone, email, date, service,
    addedAt: new Date().toISOString(),
    notified: false
  };
  wl.push(entry);
  saveWaitlist(wl);
  return entry;
}

function checkAndNotifyWaitlist(date){
  // When a slot opens up (cancellation), notify first person on waitlist for that date
  const wl = getWaitlist();
  const waiting = wl.filter(function(w){ return w.date === date && !w.notified; });
  if(waiting.length > 0){
    const next = waiting[0];
    // Mark as notified
    next.notified = true;
    saveWaitlist(wl);
    // Show alert (in production this would be an email/SMS)
    alert('Slot opened for ' + date + '! Notifying ' + next.name + ' (' + next.phone + ') from waitlist.');
  }
}

// Show waitlist option when calendar is full
function showWaitlistOption(date){
  const banner = document.getElementById('waitlistBanner');
  if(banner){
    banner.classList.add('show');
    banner.setAttribute('data-date', date);
  }
}

function joinWaitlistFromBooking(){
  const banner = document.getElementById('waitlistBanner');
  const date = banner?.getAttribute('data-date') || '';
  const fn = document.getElementById('firstName')?.value?.trim();
  const phone = getFullPhone('bookCountry', 'bookPhone');
  const email = document.getElementById('bookEmail')?.value?.trim();
  const service = document.getElementById('serviceSelect')?.value;
  if(!fn||!email){ alert('Please fill your name and email first.'); return; }
  addToWaitlist(fn, phone, email, date, service);
  alert("You've been added to the waitlist for " + date + ". We'll notify you if a spot opens!");
  banner.classList.remove('show');
}

// Override adminDeleteBooking to check waitlist
const _origAdminDelBk = adminDelBk;
function adminDelBk(id){
  const bk = getBookings().find(function(b){ return b.id===id; });
  const date = bk ? bk.date : null;
  _origAdminDelBk(id);
  if(date) checkAndNotifyWaitlist(date);
}


function showClientNotes(clientName){
  const body = document.getElementById('adminAppBody');
  if(!body) return;
  document.getElementById('adminPageTitle').textContent = 'Notes — ' + clientName;
  body.innerHTML = buildClientNotesHTML(clientName);
}


function buildWaitlistPage(){
  const wl = getWaitlist();
  let h = '<div class="admin-section-title">Waitlist</div>';
  if(!wl.length){
    h += '<p style="font-size:13px;color:var(--gray);">No one on the waitlist.</p>';
    return h;
  }
  wl.forEach(function(w,i){
    h += '<div class="admin-card"><div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:flex-start;">';
    h += '<div><div style="font-size:14px;font-weight:500;margin-bottom:3px;">' + w.name + '</div>';
    h += '<div style="font-family:monospace;font-size:10px;color:var(--gray);line-height:1.6;">' + w.date + ' · ' + (w.service||'') + '<br>' + (w.phone||'') + '<br>Added: ' + w.addedAt.split('T')[0] + '</div></div>';
    h += '<span class="bk-status ' + (w.notified?'s-completed':'s-pending') + '">' + (w.notified?'notified':'waiting') + '</span>';
    h += '</div></div>';
  });
  h += '<button class="act-btn danger" style="margin-top:16px;width:100%;padding:13px;" onclick="clearWaitlist()">Clear Waitlist</button>';
  return h;
}


// ─── EVENT DELEGATION FOR ADMIN CARDS ───
document.addEventListener('click', function(e){
  const card = e.target.closest('[data-bkid]');
  if(card){
    const id = card.getAttribute('data-bkid');
    if(id) showEventPopup(id);
  }
  const statusBtn = e.target.closest('[data-action]');
  if(statusBtn){
    const action = statusBtn.getAttribute('data-action');
    const id = statusBtn.getAttribute('data-id');
    if(action === 'confirm') { adminSetStatus(id,'confirmed'); closeEventPopup(); renderAdminPage(currentAdminPage); }
    if(action === 'complete') { adminSetStatus(id,'completed'); closeEventPopup(); renderAdminPage(currentAdminPage); }
    if(action === 'delete') { adminDelBk(id); closeEventPopup(); renderAdminPage(currentAdminPage); }
    if(action === 'notes') { closeEventPopup(); showClientNotes(statusBtn.getAttribute('data-name')); }
    if(action === 'markpaid') { 
      var bks2=getBookings(); var bp=bks2.find(function(b){return b.id===id;}); 
      if(bp){bp.paymentStatus='paid';saveBookings(bks2);} 
      closeEventPopup(); renderAdminPage(currentAdminPage);
      showToast('✓ Marked as paid', 'success', 2000);
    }
    if(action === 'delrec') { deleteRecurringBlock(id); }
  }
});


}

// Apply saved palette on load
applyPalette(activePalette);
// Load hero photo
initHeroUpload();
// ─── RESTORE SESSION ───
(async function restoreSession(){
  const sess = DB.get('session', null);
  if(!sess) return;
  if(sess.isAdmin){
    currentUser = {name:'Michail González', email:ADMIN_USER, isAdmin:true};
    document.getElementById('navSignInBtn').textContent = '⚙';
    document.getElementById('navSignInBtn').title = 'Admin Panel';
    return;
  }
  if(sess.email){
    // Try localStorage first (fast), then DB (authoritative)
    let u = getUsers().find(function(u){ return u.email === sess.email; });
    if(!u){
      const dbU = await API.getUser(sess.email, null).catch(()=>null);
      if(dbU) u = {name:dbU.name, email:dbU.email, phone:dbU.phone, code:dbU.code, referredBy:dbU.referred_by, referralCount:dbU.referral_count||0, isAdmin:dbU.is_admin||false, isAffiliate:dbU.is_affiliate||false, username:dbU.username, password:dbU.password, userType:dbU.user_type||'client'};
    }
    if(u){
      currentUser = u;
      document.getElementById('navSignInBtn').textContent = '◉';
    } else {
      DB.set('session', null); // stale session
    }
  }
})();
// ─── FIELD VALIDATION HELPERS ───
function showFieldError(fieldId, message){
  const field = document.getElementById(fieldId);
  if(!field) return;
  field.classList.add('error');
  // Check if error message already exists
  let errEl = field.parentElement.querySelector('.field-error');
  if(!errEl){
    errEl = document.createElement('p');
    errEl.className = 'field-error';
    field.parentElement.appendChild(errEl);
  }
  errEl.textContent = message;
  errEl.classList.add('show');
  // Scroll to first error
  field.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function clearFieldErrors(){
  document.querySelectorAll('.form-input.error,.form-select.error,.phone-wrap.error').forEach(function(el){
    el.classList.remove('error');
  });
  document.querySelectorAll('.field-error.show').forEach(function(el){
    el.classList.remove('show');
  });
}

// Clear error when user types
document.addEventListener('input', function(e){
  if(e.target.classList.contains('form-input') || e.target.classList.contains('form-select')){
    e.target.classList.remove('error');
    var err = e.target.parentElement.querySelector('.field-error');
    if(err) err.classList.remove('show');
  }
});


// ─── PRE-FILL BOOKING FORM ───
function prefillBookingForm(){
  if(!currentUser) return;
  const nameParts = (currentUser.name||'').split(' ');
  const fn = document.getElementById('firstName');
  const ln = document.getElementById('lastName');
  const em = document.getElementById('bookEmail');
  const ph = document.getElementById('bookPhone');
  if(fn && !fn.value) fn.value = nameParts[0]||'';
  if(ln && !ln.value) ln.value = nameParts.slice(1).join(' ')||'';
  if(em && !em.value) em.value = currentUser.email||'';
  if(ph && !ph.value){
    const phone = currentUser.phone||'';
    ph.value = phone.replace(/^\+\d+\s?/,'');
  }
  // Pre-fill saved address
  const saved = getSavedAddress();
  if(saved){
    const addrF = document.getElementById('bookAddr');
    const aptF = document.getElementById('bookApt');
    if(addrF && !addrF.value) addrF.value = saved.addr||'';
    if(aptF && !aptF.value) aptF.value = saved.apt||'';
  }
}

// Call when booking section comes into view
const bookingObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting) prefillBookingForm();
  });
},{threshold:0.1});
const bookingSection = document.getElementById('booking');
if(bookingSection) bookingObserver.observe(bookingSection);


// ─── ADDRESS CONFIRMATION ───
function getSavedAddress(){
  if(!currentUser) return null;
  const addrs = DB.get('userAddresses', {});
  return addrs[currentUser.email] || null;
}

function saveUserAddress(email, addr){
  const addrs = DB.get('userAddresses', {});
  addrs[email] = addr;
  DB.set('userAddresses', addrs);
}

function showAddressConfirm(callback){
  const saved = getSavedAddress();
  if(!saved) { callback(); return; }

  // Pre-fill the address field with saved address
  const addrField = document.getElementById('bookAddr');
  const aptField = document.getElementById('bookApt');
  if(addrField && !addrField.value) addrField.value = saved.addr||'';
  if(aptField && !aptField.value) aptField.value = saved.apt||'';

  // Show confirmation popup
  const popup = document.createElement('div');
  popup.id = 'addrConfirmPopup';
  popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:800;display:flex;align-items:flex-end;justify-content:center;';
  
  var fullAddr = saved.addr + (saved.apt ? ', ' + saved.apt : '');
  
  popup.innerHTML = '<div style="background:#fff;width:100%;max-width:480px;padding:28px 24px 36px;animation:slideUp 0.25s ease;">' +
    '<p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gray);margin-bottom:10px;">' + (currentLang==='es'?'CONFIRMA TU DIRECCIÓN':'CONFIRM YOUR ADDRESS') + '</p>' +
    '<p style="font-size:16px;font-weight:500;margin-bottom:6px;">' + fullAddr + '</p>' +
    '<p style="font-size:12px;color:var(--gray);margin-bottom:22px;">' + (currentLang==='es'?'¿Es esta tu dirección de hoy?':'Is this your address for today?') + '</p>' +
    '<div style="display:flex;gap:10px;">' +
    '<button style="flex:1;padding:14px;border:1.5px solid var(--black);background:none;font-family:monospace;font-size:10px;letter-spacing:0.15em;cursor:pointer;" onclick="document.getElementById(&quot;addrConfirmPopup&quot;).remove();document.getElementById(&quot;bookAddr&quot;).focus();">' + (currentLang==='es'?'CAMBIAR':'CHANGE') + '</button>' +
    '<button style="flex:1;padding:14px;background:var(--black);color:#fff;border:none;font-family:monospace;font-size:10px;letter-spacing:0.15em;cursor:pointer;" onclick="document.getElementById(&quot;addrConfirmPopup&quot;).remove();addrConfirmedCallback();">' + (currentLang==='es'?'ES CORRECTA ✓':'CORRECT ✓') + '</button>' +
    '</div></div>';
  
  document.body.appendChild(popup);
  window.addrConfirmedCallback = callback;
}


// ─── TOAST NOTIFICATIONS ───
function showToast(msg, type, duration){
  type = type || 'success';
  duration = duration || 2500;
  var t = document.getElementById('toastMsg');
  if(!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(function(){ t.classList.add('show'); }, 10);
  setTimeout(function(){ t.classList.remove('show'); }, duration);
}


// ─── BOLD PAYMENT ───
function initBoldCheckout(amount, description, orderId, integritySignature){
  if(document.getElementById('boldScript')) document.getElementById('boldScript').remove();
  var s = document.createElement('script');
  s.id = 'boldScript';
  s.src = 'https://checkout.bold.co/library/boldPaymentButton.js';
  s.onload = function(){
    try {
      var checkout = new BoldCheckout({
        orderId: orderId,
        currency: 'COP',
        amount: String(amount),
        apiKey: BOLD_API_KEY,
        integritySignature: integritySignature,
        description: description,
        redirectionUrl: window.location.origin + '/?payment=success',
      });
      checkout.open();
    } catch(e){
      console.error('[Bold] checkout.open() failed:', e);
      showToast('Error al abrir el pago. Intenta de nuevo.', 'error', 4000);
    }
  };
  s.onerror = function(){
    console.error('[Bold] script failed to load');
    showToast('Error cargando pasarela de pago.', 'error', 4000);
  };
  document.head.appendChild(s);
}

async function openBoldPayment(amount, description, orderId){
  try {
    showToast(currentLang==='es'?'Preparando pago...':'Preparing payment...', 'success', 5000);
    const res = await fetch('/.netlify/functions/bold-signature', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({orderId: orderId, amount: String(amount), currency: 'COP'})
    });
    if(!res.ok) throw new Error('Signature error');
    const data = await res.json();
    initBoldCheckout(amount, description, orderId, data.signature);
  } catch(err){
    console.error('Bold error:', err);
    showToast(currentLang==='es'?'Error al procesar pago':'Payment error', 'error', 3000);
  }
}

function selectTip(btn, amount){
  document.querySelectorAll('.tip-btn').forEach(function(b){ b.style.background=''; b.style.color=''; b.style.borderColor='#e8e6e0'; });
  btn.style.background='#0d0d0d'; btn.style.color='#fff'; btn.style.borderColor='#0d0d0d';
  window._currentTip = amount;
}

function confirmBoldPayment(btn, baseAmount, bookingId, serviceName){
  var tip = window._currentTip || 0;
  var total = baseAmount + tip;
  btn.closest('div[style*="position:fixed"]').remove();
  var orderId = 'MB-' + bookingId + '-' + Date.now();
  var tipLabel = tip > 0 ? ' + Propina ' + fmtP(tip) : '';
  openBoldPayment(total, 'Michail Barber - ' + serviceName + tipLabel, orderId);
}

function payWithBold(bookingId, amount, serviceName){
  var tipDiv = document.createElement('div');
  tipDiv.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9000;display:flex;align-items:flex-end;justify-content:center;';
  var cancelTxt = currentLang==='es' ? 'CANCELAR' : 'CANCEL';
  var payTxt = currentLang==='es' ? 'PAGAR' : 'PAY';
  var tipTxt = currentLang==='es' ? 'PROPINA (OPCIONAL)' : 'TIP (OPTIONAL)';
  tipDiv.innerHTML = '<div style="background:#fff;width:100%;max-width:480px;padding:28px 24px 36px;">' +
    '<p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8a8a;margin-bottom:8px;">' + tipTxt + '</p>' +
    '<p style="font-size:16px;font-weight:500;margin-bottom:16px;">' + fmtP(amount) + '</p>' +
    '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
    '<button class="tip-btn" onclick="selectTip(this,0)" style="flex:1;padding:10px;border:1.5px solid #e8e6e0;background:#0d0d0d;color:#fff;font-family:monospace;font-size:10px;cursor:pointer;">$0</button>' +
    '<button class="tip-btn" onclick="selectTip(this,5000)" style="flex:1;padding:10px;border:1.5px solid #e8e6e0;background:none;font-family:monospace;font-size:10px;cursor:pointer;">$5k</button>' +
    '<button class="tip-btn" onclick="selectTip(this,10000)" style="flex:1;padding:10px;border:1.5px solid #e8e6e0;background:none;font-family:monospace;font-size:10px;cursor:pointer;">$10k</button>' +
    '<button class="tip-btn" onclick="selectTip(this,20000)" style="flex:1;padding:10px;border:1.5px solid #e8e6e0;background:none;font-family:monospace;font-size:10px;cursor:pointer;">$20k</button>' +
    '</div>' +
    '<div style="display:flex;gap:10px;">' +
    '<button style="flex:1;padding:14px;border:1.5px solid #0d0d0d;background:none;font-family:monospace;font-size:10px;cursor:pointer;" onclick="this.closest(\'div[style*=\\\"position:fixed\\\"]\').remove()">' + cancelTxt + '</button>' +
    '<button style="flex:1;padding:14px;background:#0d0d0d;color:#fff;border:none;font-family:monospace;font-size:10px;cursor:pointer;" id="boldConfirmBtn">' + payTxt + '</button>' +
    '</div></div>';
  document.body.appendChild(tipDiv);
  window._currentTip = 0;
  document.getElementById('boldConfirmBtn').onclick = function(){
    // Use server-side price calculation via create-payment endpoint
    var tip = window._currentTip || 0;
    var bk = allBookings.find(function(b){ return b.id===bookingId; });
    this.closest('div[style*="position:fixed"]').remove();
    if(bk){
      // Call secure backend endpoint — price calculated server-side
      secureBoldPayment(bk, tip);
    } else {
      // Fallback: use frontend amount (dev only)
      confirmBoldPayment(this, amount, bookingId, serviceName);
    }
  };
}

async function secureBoldPayment(booking, tip){
  showToast(currentLang==='es'?'Preparando pago seguro…':'Preparing secure payment…','success',5000);
  try {
    const res = await fetch('/.netlify/functions/create-payment', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        serviceId: booking.service, date: booking.date,
        time: booking.time, groupSize: booking.groupSize||1,
        tip: tip, couponCode: booking.couponCode||null
      })
    });
    if(!res.ok) throw new Error('create-payment failed: ' + res.status);
    const data = await res.json();
    // Store orderId in booking
    booking.orderId = data.orderId;
    API.updateBooking(booking.id, {orderId: data.orderId}).catch(console.error);
    // Open Bold with server-verified amount and signature
    initBoldCheckout(data.amount, 'Michail Barber - ' + (booking.serviceName||booking.service), data.orderId, data.signature);
  } catch(err){
    console.error('Secure payment error:', err);
    // Fallback to legacy flow
    var orderId = 'MB-' + booking.id + '-' + Date.now();
    openBoldPayment(booking.price + tip, 'Michail Barber - ' + (booking.serviceName||booking.service), orderId);
  }
}


// ─── SUCCESS PAGE ───
function showSuccessPage(bookingData){
  const page = document.getElementById('successPage');
  if(!page) return;
  const msg = document.getElementById('successMsg');
  if(msg && bookingData){
    msg.textContent = (bookingData.serviceName||'Your service') + ' on ' + bookingData.date + ' at ' + bookingData.time + '.\nSee you soon!';
  }
  page.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function rebookIn(days){
  document.querySelectorAll('.rebook-btn').forEach(function(b){ b.classList.remove('selected'); });
  event.target.classList.add('selected');
  
  // Calculate target date
  var d = new Date();
  d.setDate(d.getDate() + days);
  var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  
  // Close success page and go to booking with pre-selected date
  document.getElementById('successPage').style.display = 'none';
  document.body.style.overflow = '';
  
  // Pre-select date in calendar
  setTimeout(function(){
    document.getElementById('booking').scrollIntoView({behavior:'smooth'});
    setTimeout(function(){ selectDate(ds); }, 500);
  }, 200);
}

// Check URL for Bold redirect after payment
function checkBoldRedirect(){
  const url = window.location.href;
  const params = new URLSearchParams(window.location.search);
  const status = params.get('bold-order-status') || params.get('payment');
  const orderId = params.get('bold-order-id') || params.get('orderId');

  if(url.includes('pago-exitoso') || url.includes('payment=success') || status === 'approved' || status === 'success'){
    // Try to find booking by orderId or use last booking
    let bkData = curBookingData;
    if(orderId && !bkData){
      bkData = allBookings.find(function(b){ return b.orderId === orderId || b.order_id === orderId; });
    }
    // Mark booking as paid in DB if found
    if(bkData){
      API.updateBooking(bkData.id, {paymentStatus:'paid', status:'confirmed'}).catch(console.error);
      const b = allBookings.find(function(x){ return x.id===bkData.id; });
      if(b){ b.paymentStatus='paid'; b.status='confirmed'; }
    }
    showSuccessPage(bkData);
    window.history.replaceState({}, '', '/');
  }
}

// ─── AUTO-COMPLETE BOOKINGS ───
function autoCompleteBookings(){
  const bks = getBookings();
  const now = new Date();
  let changed = false;
  
  bks.forEach(function(b){
    if(b.status === 'confirmed' && b.date && b.time){
      // Parse booking datetime
      var hour = parseInt(b.time.split(':')[0]);
      var bookingEnd = new Date(b.date + 'T' + String(hour + (b.groupSize||1)).padStart(2,'0') + ':00:00');
      // Add 1 hour buffer after end
      bookingEnd.setHours(bookingEnd.getHours() + 1);
      
      if(now > bookingEnd){
        b.status = 'completed';
        b.autoCompleted = true;
        changed = true;
        // Persist to DB
        API.updateBooking(b.id, {status:'completed', autoCompleted:true}).catch(console.error);
        // Update referrals
        if(b.refCode){
          var users = getUsers();
          var u = users.find(function(u){ return u.code === b.refCode; });
          if(u){ u.referralCount = (u.referralCount||0)+1; saveUsers(users);
            API.updateUser(u.email, {referralCount: u.referralCount}).catch(console.error);
          }
        }
      }
    }
  });
  
  if(changed){
    saveBookings(bks);
    // Refresh admin if open
    var adminApp = document.getElementById('adminApp');
    if(adminApp && adminApp.style.display === 'flex'){
      renderAdminPage(currentAdminPage);
    }
  }
}

// Run auto-complete check every 5 minutes
setInterval(autoCompleteBookings, 5 * 60 * 1000);
autoCompleteBookings(); // Run on load
checkBoldRedirect();
initFromDB();

// ─── PAY NOW / PAY LATER ───
function showPaymentChoice(bookingData){
  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:800;display:flex;align-items:flex-end;justify-content:center;';
  var nowTxt = currentLang==='es' ? 'PAGAR AHORA' : 'PAY NOW';
  var laterTxt = currentLang==='es' ? 'PAGAR DESPUÉS' : 'PAY LATER';
  var titleTxt = currentLang==='es' ? '¿CUÁNDO DESEAS PAGAR?' : 'WHEN WOULD YOU LIKE TO PAY?';
  div.innerHTML = '<div style="background:#fff;width:100%;max-width:480px;padding:28px 24px 36px;">' +
    '<p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8a8a;margin-bottom:16px;">' + titleTxt + '</p>' +
    '<p style="font-size:15px;font-weight:500;margin-bottom:6px;">' + (bookingData.serviceName||bookingData.service) + '</p>' +
    '<p style="font-family:monospace;font-size:12px;color:#8a8a8a;margin-bottom:24px;">' + bookingData.date + ' · ' + bookingData.time + ' · ' + fmtP(bookingData.price) + '</p>' +
    '<div style="display:flex;gap:12px;">' +
    '<button style="flex:1;padding:16px;border:1.5px solid #0d0d0d;background:none;font-family:monospace;font-size:10px;letter-spacing:0.15em;cursor:pointer;" onclick="payLater(this)">' + laterTxt + '</button>' +
    '<button style="flex:1;padding:16px;background:#0d0d0d;color:#fff;border:none;font-family:monospace;font-size:10px;letter-spacing:0.15em;cursor:pointer;" id="payNowBtn">' + nowTxt + ' 💳</button>' +
    '</div></div>';
  document.body.appendChild(div);
  document.getElementById('payNowBtn').onclick = function(){
    this.closest('div[style*="position:fixed"]').remove();
    payWithBold(window._pendingPayBooking.id, window._pendingPayBooking.price, (window._pendingPayBooking.serviceName||'').replace(/'/g,''));
  };
  window._pendingPayBooking = bookingData;
}

function payLater(btn){
  btn.closest('div[style*="position:fixed"]').remove();
  if(window._pendingPayBooking){
    var b = allBookings.find(function(bk){ return bk.id === window._pendingPayBooking.id; });
    if(b){ b.paymentStatus = 'pending';
      API.updateBooking(b.id, {paymentStatus:'pending'}).catch(console.error);
    }
  }
  showToast(currentLang==='es'?'Cita solicitada. Pago pendiente.':'Appointment requested. Payment pending.', 'success', 3000);
}

function payNow(btn, bookingId, amount, serviceName){
  btn.closest('div[style*="position:fixed"]').remove();
  payWithBold(bookingId, amount, serviceName);
}

// ─── UPDATE CONFIRM MODAL TO SHOW PAY CHOICE ───
var _origSubmitBooking = submitBooking;


// ─── COUPON SYSTEM ───
function getCoupons(){ return DB.get('coupons', []); }
function saveCoupons(c){ DB.set('coupons', c); }

function generateCouponCode(){
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for(var i=0;i<8;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}

function applyCoupon(){
  var code = document.getElementById('couponInput')?.value?.trim().toUpperCase();
  if(!code){ alert('Enter a coupon code'); return; }
  
  var coupons = getCoupons();
  var coupon = coupons.find(function(c){ return c.code === code && c.active; });
  
  if(!coupon){ 
    showToast(currentLang==='es'?'Código no válido':'Invalid coupon code', 'error', 2500);
    return; 
  }
  
  // Check expiry
  if(coupon.expiryDate && new Date(coupon.expiryDate) < new Date()){
    showToast(currentLang==='es'?'Cupón vencido':'Coupon expired', 'error', 2500);
    return;
  }
  
  // Check uses
  if(coupon.maxUses && (coupon.usedCount||0) >= coupon.maxUses){
    showToast(currentLang==='es'?'Cupón agotado':'Coupon exhausted', 'error', 2500);
    return;
  }
  
  // Apply coupon
  window._activeCoupon = coupon;
  var appliedDiv = document.getElementById('couponApplied');
  var discountText = coupon.discountType === 'percent' 
    ? coupon.discountValue + '% off' 
    : fmtP(coupon.discountValue) + ' off';
  
  if(appliedDiv){
    appliedDiv.textContent = '✓ ' + discountText + ' applied — ' + coupon.label;
    appliedDiv.classList.add('show');
  }
  
  // Recalculate price
  updatePriceWithCoupon();
  showToast('✓ Coupon applied: ' + discountText, 'success', 2500);
}

function updatePriceWithCoupon(){
  if(!window._activeCoupon) return;
  var coupon = window._activeCoupon;
  var base = calcPrice();
  var discount = coupon.discountType === 'percent' 
    ? Math.round(base * coupon.discountValue / 100)
    : Math.min(coupon.discountValue, base);
  var final = base - discount;
  
  // Update price preview
  var priceEl = document.getElementById('priceAmount');
  if(priceEl){
    priceEl.innerHTML = fmtP(final) + ' <span style="font-size:13px;color:var(--gray);text-decoration:line-through;">' + fmtP(base) + '</span>';
  }
  window._couponDiscount = discount;
  window._couponFinalPrice = final;
}

function getCouponDiscount(){
  return window._couponDiscount || 0;
}

function clearCoupon(){
  window._activeCoupon = null;
  window._couponDiscount = 0;
  window._couponFinalPrice = null;
  var appliedDiv = document.getElementById('couponApplied');
  if(appliedDiv) appliedDiv.classList.remove('show');
}

// ─── ADMIN COUPONS PAGE ───
function buildCouponsPage(){
  var coupons = getCoupons();
  var h = '';
  h += '<div class="admin-section-title">Coupons</div>';
  
  // Create new coupon form
  h += '<div class="admin-card"><div class="admin-card-inner">';
  h += '<div class="admin-section-title" style="font-size:18px;margin-bottom:12px;">New Coupon</div>';
  h += '<div class="form-row"><div class="form-group" style="margin:0;">';
  h += '<label class="form-label">Code</label>';
  h += '<div style="display:flex;gap:8px;">';
  h += '<input type="text" class="form-input" id="newCouponCode" placeholder="AMIGO50" style="text-transform:uppercase;flex:1;" oninput="this.value=this.value.toUpperCase()">';
  h += '<button class="act-btn" onclick="document.getElementById(&quot;newCouponCode&quot;).value=generateCouponCode()" style="white-space:nowrap;padding:13px 12px;">Random</button>';
  h += '</div></div>';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">Label</label>';
  h += '<input type="text" class="form-input" id="newCouponLabel" placeholder="Friends discount"></div></div>';
  
  h += '<div class="form-row" style="margin-top:10px;"><div class="form-group" style="margin:0;">';
  h += '<label class="form-label">Discount Type</label>';
  h += '<select class="form-select" id="newCouponType">';
  h += '<option value="percent">Percentage (%)</option>';
  h += '<option value="fixed">Fixed Amount (COP)</option>';
  h += '</select></div>';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">Value</label>';
  h += '<input type="number" class="form-input" id="newCouponValue" placeholder="50000"></div></div>';
  
  h += '<div class="form-row" style="margin-top:10px;"><div class="form-group" style="margin:0;">';
  h += '<label class="form-label">Expiry Date (optional)</label>';
  h += '<input type="date" class="form-input" id="newCouponExpiry"></div>';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">Max Uses (optional)</label>';
  h += '<input type="number" class="form-input" id="newCouponUses" placeholder="1"></div></div>';
  
  h += '<button class="submit-btn" style="margin-top:14px;" onclick="createCoupon()">CREATE COUPON →</button>';
  h += '</div></div>';
  
  // Coupon calculator
  h += '<div class="admin-section-title" style="margin-top:20px;">Price Calculator</div>';
  h += '<div class="admin-card"><div class="admin-card-inner">';
  h += '<div class="form-row"><div class="form-group" style="margin:0;"><label class="form-label">Base Price</label>';
  h += '<input type="number" class="form-input" id="calcBase" placeholder="150000" oninput="calcDiscount()"></div>';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">Client Pays</label>';
  h += '<input type="number" class="form-input" id="calcFinal" placeholder="100000" oninput="calcDiscount()"></div></div>';
  h += '<div id="calcResult" style="font-family:monospace;font-size:12px;margin-top:12px;padding:12px;background:var(--off);line-height:1.8;display:none;"></div>';
  h += '</div></div>';
  
  // Existing coupons
  if(coupons.length){
    h += '<div class="admin-section-title" style="margin-top:20px;">Active Coupons</div>';
    coupons.forEach(function(c, i){
      var isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
      var isExhausted = c.maxUses && (c.usedCount||0) >= c.maxUses;
      var status = (!c.active || isExpired || isExhausted) ? 'expired' : 'active';
      var discText = c.discountType==='percent' ? c.discountValue+'%' : fmtP(c.discountValue);
      h += '<div class="coupon-card">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
      h += '<div><div class="coupon-code">' + c.code + '</div>';
      h += '<div class="coupon-meta">' + c.label + '<br>' + discText + ' off · Used: ' + (c.usedCount||0) + (c.maxUses?'/'+c.maxUses:' times') + (c.expiryDate?'<br>Expires: '+c.expiryDate:'') + '</div></div>';
      h += '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">';
      h += '<span class="coupon-badge coupon-' + status + '">' + status + '</span>';
      h += '<button class="act-btn danger" style="font-size:9px;padding:4px 8px;" onclick="deleteCoupon(' + i + ')">Delete</button>';
      h += '</div></div></div>';
    });
  }
  
  return h;
}

function createCoupon(){
  var code = document.getElementById('newCouponCode')?.value?.trim().toUpperCase();
  var label = document.getElementById('newCouponLabel')?.value?.trim();
  var type = document.getElementById('newCouponType')?.value;
  var value = parseFloat(document.getElementById('newCouponValue')?.value);
  var expiry = document.getElementById('newCouponExpiry')?.value;
  var uses = parseInt(document.getElementById('newCouponUses')?.value)||null;
  
  if(!code||!value){ alert('Enter code and discount value'); return; }
  
  var coupons = getCoupons();
  if(coupons.find(function(c){ return c.code===code; })){ alert('Code already exists'); return; }
  
  coupons.push({
    code: code,
    label: label||code,
    discountType: type,
    discountValue: value,
    expiryDate: expiry||null,
    maxUses: uses,
    usedCount: 0,
    active: true,
    createdAt: new Date().toISOString()
  });
  saveCoupons(coupons);
  showToast('✓ Coupon ' + code + ' created', 'success', 2500);
  renderAdminPage('coupons');
}

function deleteCoupon(idx){
  var coupons = getCoupons();
  coupons.splice(idx, 1);
  saveCoupons(coupons);
  renderAdminPage('coupons');
}

function calcDiscount(){
  var base = parseFloat(document.getElementById('calcBase')?.value)||0;
  var final = parseFloat(document.getElementById('calcFinal')?.value)||0;
  var result = document.getElementById('calcResult');
  if(!result) return;
  if(base && final){
    var discount = base - final;
    var pct = Math.round(discount/base*100);
    result.style.display = 'block';
    result.innerHTML = 
      'Base: <strong>' + fmtP(base) + '</strong><br>' +
      'Client pays: <strong>' + fmtP(final) + '</strong><br>' +
      'Discount: <strong>' + fmtP(discount) + ' (' + pct + '% off)</strong>';
  } else {
    result.style.display = 'none';
  }
}


// ─── RECURRING BLOCKS ───
function getRecurringBlocks(){ return DB.get('recurringBlocks', []); }
function saveRecurringBlocks(r){ DB.set('recurringBlocks', r); }

function addRecurringBlock(){
  var type = document.getElementById('recType')?.value;
  var days = [];
  document.querySelectorAll('.rec-day-check:checked').forEach(function(cb){ days.push(parseInt(cb.value)); });
  var timeFrom = document.getElementById('recTimeFrom')?.value;
  var timeTo = document.getElementById('recTimeTo')?.value;
  var until = document.getElementById('recUntil')?.value;
  var reason = document.getElementById('recReason')?.value?.trim();

  if(!days.length){ alert('Select at least one day'); return; }
  if(type === 'hours' && (!timeFrom || !timeTo)){ alert('Select time range'); return; }

  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var rb = {
    id: Date.now().toString(),
    type: type,
    days: days,
    timeFrom: type==='hours' ? timeFrom : null,
    timeTo: type==='hours' ? timeTo : null,
    until: until || null,
    reason: reason || '',
    active: true,
    createdAt: new Date().toISOString()
  };

  var rbs = getRecurringBlocks();
  rbs.push(rb);
  saveRecurringBlocks(rbs);
  showToast('✓ Recurring block saved', 'success', 2000);
  renderAdminPage('block');
}

function deleteRecurringBlock(id){
  var rbs = getRecurringBlocks().filter(function(r){ return r.id !== id; });
  saveRecurringBlocks(rbs);
  renderAdminPage('block');
}

function isDateRecurringBlocked(dateStr){
  var d = new Date(dateStr + 'T12:00:00');
  var dayOfWeek = d.getDay();
  var rbs = getRecurringBlocks();
  var today = new Date().toISOString().split('T')[0];
  
  return rbs.some(function(rb){
    if(!rb.active) return false;
    if(rb.until && rb.until < today) return false;
    if(!rb.days.includes(dayOfWeek)) return false;
    if(rb.type === 'fullday') return true;
    return false; // hours type handled separately
  });
}

function getRecurringBlockedHours(dateStr){
  var d = new Date(dateStr + 'T12:00:00');
  var dayOfWeek = d.getDay();
  var rbs = getRecurringBlocks();
  var today = new Date().toISOString().split('T')[0];
  var blocked = [];
  
  rbs.forEach(function(rb){
    if(!rb.active) return;
    if(rb.until && rb.until < today) return;
    if(!rb.days.includes(dayOfWeek)) return;
    if(rb.type === 'hours' && rb.timeFrom && rb.timeTo){
      blocked.push({from: rb.timeFrom, to: rb.timeTo, reason: rb.reason});
    }
  });
  return blocked;
}

function buildRecurringBlocksSection(){
  var rbs = getRecurringBlocks();
  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var h = '';
  
  h += '<div class="admin-section-title" style="margin-top:24px;">Recurring Blocks</div>';
  
  // Add recurring block form
  h += '<div class="admin-card"><div class="admin-card-inner">';
  h += '<div class="form-group"><label class="form-label">Block Type</label>';
  h += '<select class="form-select" id="recType" onchange="toggleRecType()">';
  h += '<option value="fullday">Full Day</option>';
  h += '<option value="hours">Specific Hours</option>';
  h += '</select></div>';
  
  h += '<div class="form-group"><label class="form-label">Days of Week</label>';
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">';
  dayNames.forEach(function(d, i){
    h += '<label style="display:flex;align-items:center;gap:4px;font-family:monospace;font-size:11px;cursor:pointer;">';
    h += '<input type="checkbox" class="rec-day-check" value="' + i + '"> ' + d;
    h += '</label>';
  });
  h += '</div></div>';
  
  h += '<div id="recHoursWrap" style="display:none;">';
  h += '<div class="form-row"><div class="form-group" style="margin:0;"><label class="form-label">From</label>';
  h += '<input type="time" class="form-input" id="recTimeFrom"></div>';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">To</label>';
  h += '<input type="time" class="form-input" id="recTimeTo"></div></div>';
  h += '</div>';
  
  h += '<div class="form-row" style="margin-top:10px;">';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">Until (optional)</label>';
  h += '<input type="date" class="form-input" id="recUntil" placeholder="Leave empty = indefinite"></div>';
  h += '<div class="form-group" style="margin:0;"><label class="form-label">Reason</label>';
  h += '<input type="text" class="form-input" id="recReason" placeholder="Day off, training..."></div></div>';
  
  h += '<button class="submit-btn" style="margin-top:14px;" onclick="addRecurringBlock()">ADD RECURRING BLOCK →</button>';
  h += '</div></div>';
  
  // Existing recurring blocks
  if(rbs.length){
    h += '<div class="admin-section-title" style="margin-top:16px;font-size:16px;">Active Recurring Blocks</div>';
    rbs.forEach(function(rb){
      var daysLabel = rb.days.map(function(d){ return dayNames[d]; }).join(', ');
      var timeLabel = rb.type === 'fullday' ? 'All day' : (rb.timeFrom + ' – ' + rb.timeTo);
      var untilLabel = rb.until ? 'Until ' + rb.until : 'Indefinite';
      h += '<div class="admin-card"><div class="admin-card-inner" style="display:flex;justify-content:space-between;align-items:flex-start;">';
      h += '<div><div style="font-size:13px;font-weight:500;margin-bottom:4px;">' + daysLabel + '</div>';
      h += '<div style="font-family:monospace;font-size:10px;color:var(--gray);line-height:1.7;">' + timeLabel + ' · ' + untilLabel + (rb.reason?' · '+rb.reason:'') + '</div></div>';
      h += '<button class="act-btn danger" data-action="delrec" data-id="' + rb.id + '">Remove</button>';
      h += '</div></div>';
    });
  }
  
  return h;
}

function toggleRecType(){
  var type = document.getElementById('recType')?.value;
  var wrap = document.getElementById('recHoursWrap');
  if(wrap) wrap.style.display = type === 'hours' ? 'block' : 'none';
}

