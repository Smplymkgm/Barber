// ─── ADMIN PANEL ───
function buildAdminPanel(){
  const bks=getBookings(); const today=new Date().toISOString().split('T')[0]; const wk=new Date(Date.now()-7*86400000).toISOString().split('T')[0];
  const rev=bks.filter(b=>b.status==='completed').reduce((s,b)=>s+(b.price||0),0);
  const calClosed=isCalClosed();
  return `<div class="panel-tabs">
    <button class="panel-tab" onclick="swTab(event,'at-calview')">📅 Calendar</button>
    <button class="panel-tab active" onclick="swTab(event,'at-bookings')">Bookings</button>
    <button class="panel-tab" onclick="swTab(event,'at-add')">Add</button>
    <button class="panel-tab" onclick="swTab(event,'at-block')">Block</button>
    <button class="panel-tab" onclick="swTab(event,'at-services')">Services</button>
    <button class="panel-tab" onclick="swTab(event,'at-zones')">Zones</button>
    <button class="panel-tab" onclick="swTab(event,'at-palette');renderPaletteTab()">Design</button>
    <button class="panel-tab" onclick="swTab(event,'at-affs')">Affiliates</button>
    <button class="panel-tab" onclick="swTab(event,'at-subs')">Subs</button>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-val">${bks.filter(b=>b.date===today).length}</div><div class="stat-lbl">Today</div></div>
    <div class="stat-card"><div class="stat-val">${bks.filter(b=>b.date>=wk).length}</div><div class="stat-lbl">This Week</div></div>
    <div class="stat-card"><div class="stat-val">${bks.filter(b=>b.status==='pending').length}</div><div class="stat-lbl">Pending</div></div>
    <div class="stat-card"><div class="stat-val">${fmtP(rev)}</div><div class="stat-lbl">Revenue</div></div>
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px;background:${calClosed?'#fde8e8':'var(--off)'};margin-bottom:20px;">
    <span style="font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;">Calendar: <strong>${calClosed?'CLOSED':'OPEN'}</strong></span>
    <button class="act-btn${calClosed?'':' danger'}" onclick="toggleCal()">${calClosed?'OPEN':'CLOSE'}</button>
  </div>

  <div class="panel-section" id="at-calview">
    <div class="cal-view-wrap" id="calViewWrap"></div>
  </div>
  <div class="panel-section active" id="at-bookings">${buildAdminBkList(bks)}</div>

  <div class="panel-section" id="at-add">
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;">Add bookings from WhatsApp or in person.</p>
    <div class="form-row"><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="mnName" placeholder="Client name"></div><div class="form-group"><label class="form-label">Phone</label><input type="tel" class="form-input" id="mnPhone" placeholder="+1..."></div></div>
    <div class="form-group"><label class="form-label">Service</label><select class="form-select" id="mnService">${getServices().map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="mnDate"></div><div class="form-group"><label class="form-label">Time</label><input type="time" class="form-input" id="mnTime"></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Group</label><input type="number" class="form-input" id="mnGroup" value="1" min="1" max="10"></div><div class="form-group"><label class="form-label">Custom Price (optional)</label><input type="number" class="form-input" id="mnPrice" placeholder="150000"></div></div>
    <div class="form-group"><label class="form-label">Address / Notes</label><input type="text" class="form-input" id="mnNotes" placeholder="Address, offer details..."></div>
    <button class="submit-btn" onclick="addManualBk()">ADD BOOKING →</button>
  </div>

  <div class="panel-section" id="at-block">
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;">Block a full day or a time range.</p>
    <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="blDate"></div>
    <div class="form-group">
      <label class="form-label">Block Type</label>
      <select class="form-select" id="blType" onchange="toggleBlockType()">
        <option value="day">Full Day</option>
        <option value="range">Time Range</option>
      </select>
    </div>
    <div id="blRangeWrap" style="display:none;">
      <div class="form-row"><div class="form-group"><label class="form-label">From</label><input type="time" class="form-input" id="blFrom"></div><div class="form-group"><label class="form-label">To</label><input type="time" class="form-input" id="blTo"></div></div>
    </div>
    <div class="form-group"><label class="form-label">Reason</label><input type="text" class="form-input" id="blReason" placeholder="Personal, travel..."></div>
    <button class="submit-btn" onclick="addBlock()">BLOCK →</button>
    <div id="blList" style="margin-top:16px;">${buildBlockList()}</div>
  </div>

  <div class="panel-section" id="at-services">
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;">Edit existing services or add new ones.</p>
    <div id="adminServicesList">${buildAdminServicesList()}</div>
    <button class="submit-btn" style="margin-top:16px;" onclick="addNewService()">+ ADD SERVICE</button>
  </div>

  <div class="panel-section" id="at-zones">
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;">Update your coverage zones / cities.</p>
    <div id="zonesList">${buildZonesList()}</div>
    <div style="display:flex;gap:10px;margin-top:14px;"><input type="text" class="form-input" id="newZoneInput" placeholder="New city (e.g. Cali, Bogotá, New York)" style="flex:1;"><button class="act-btn" onclick="addZone()" style="white-space:nowrap;">ADD +</button></div>
  </div>

  <div class="panel-section" id="at-palette">
    <p style="font-size:13px;color:var(--gray);margin-bottom:20px;line-height:1.6;">Choose a color palette. All colors update instantly across the entire site.</p>
    <div class="palette-list" id="paletteList"></div>
  </div>
  <div class="panel-section" id="at-affs">${buildAffAdminList()}</div>
  <div class="panel-section" id="at-subs">${buildSubsAdminList()}</div>

  <button class="act-btn danger" style="width:100%;padding:13px;margin-top:28px;" onclick="doSignOut()">SIGN OUT</button>`;
}

function buildAdminBkList(bks){
  if(!bks.length) return '<p style="font-size:13px;color:var(--gray);padding:20px 0;">No bookings yet.</p>';
  const payBadge=b=>{
    const ps=b.paymentStatus||b.payment_status||'pending';
    const pm=(b.payment||'').toLowerCase();
    if(ps==='paid') return '<span style="font-family:monospace;font-size:8px;padding:2px 6px;background:#d1e7dd;color:#0f5132;">PAID</span>';
    if(pm==='cash') return '<span style="font-family:monospace;font-size:8px;padding:2px 6px;background:#f5f4f1;color:#888;">CASH</span>';
    if(pm==='transfer') return '<span style="font-family:monospace;font-size:8px;padding:2px 6px;background:#fff3cd;color:#856404;">TRANSFER</span>';
    if(pm==='card') return '<span style="font-family:monospace;font-size:8px;padding:2px 6px;background:#cfe2ff;color:#084298;">CARD</span>';
    return '<span style="font-family:monospace;font-size:8px;padding:2px 6px;background:#fff3cd;color:#856404;">PAY PENDING</span>';
  };
  const waLink=b=>b.phone?`<a href="https://wa.me/${b.phone.replace(/\D/g,'')}" target="_blank" class="act-btn" style="text-decoration:none;">WhatsApp</a>`:'';
  return [...bks].reverse().map(b=>{
    const ps=b.paymentStatus||b.payment_status||'pending';
    return `<div class="bk-card"><div style="flex:1;"><div class="bk-name">${b.name} ${payBadge(b)}</div><div class="bk-details">${b.date} · ${b.time}${(b.groupSize||b.group_size)>1?' · ×'+(b.groupSize||b.group_size):''}<br>${b.serviceName||b.service_name||b.service} · ${fmtP(b.price||0)}<br>${b.phone||''} ${b.address?'· '+b.address:''}</div><div class="bk-actions">${b.status==='pending'?`<button class="act-btn ok" onclick="adminSetStatus('${b.id}','confirmed')">Confirm</button>`:''}${b.status==='confirmed'?`<button class="act-btn ok" onclick="adminSetStatus('${b.id}','completed')">✓ Complete</button>`:''} ${ps!=='paid'?`<button class="act-btn" onclick="adminMarkPaid('${b.id}')" style="border-color:var(--green);color:var(--green);">Mark Paid</button>`:''}${waLink(b)}<button class="act-btn danger" onclick="adminDelBk('${b.id}')">Delete</button></div></div><span class="bk-status s-${b.status}">${b.status}</span></div>`;
  }).join('');
}

function buildBlockList(){
  const blocks=getBlocks();
  if(!blocks.length) return '<p style="font-size:12px;color:var(--gray);">No blocked slots.</p>';
  return blocks.map((bl,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--light);"><span style="font-family:monospace;font-size:11px;">${bl.date} ${bl.timeFrom?bl.timeFrom+'–'+bl.timeTo:'ALL DAY'}${bl.reason?' · '+bl.reason:''}</span><button class="act-btn danger" onclick="removeBlock(${i})">Remove</button></div>`).join('');
}

function buildAdminServicesList(){
  const svcs=getServices();
  return svcs.map((s,i)=>`<div style="border:1.5px solid var(--light);padding:16px;margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="font-family:'Bebas Neue',sans-serif;font-size:22px;">${s.name}</span>
      <button class="act-btn danger" onclick="deleteService(${i})">Remove</button>
    </div>
    <div class="form-row" style="margin-bottom:8px;">
      <div class="form-group" style="margin:0;"><label class="form-label">Name (EN)</label><input type="text" class="form-input" value="${s.name}" onchange="updateService(${i},'name',this.value)"></div>
      <div class="form-group" style="margin:0;"><label class="form-label">Name (ES)</label><input type="text" class="form-input" value="${s.nameEs||''}" onchange="updateService(${i},'nameEs',this.value)"></div>
    </div>
    <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Description (EN)</label><input type="text" class="form-input" value="${s.desc}" onchange="updateService(${i},'desc',this.value)"></div>
    <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Description (ES)</label><input type="text" class="form-input" value="${s.descEs||''}" onchange="updateService(${i},'descEs',this.value)"></div>
    <div class="form-row">
      <div class="form-group" style="margin:0;"><label class="form-label">Price (COP)</label><input type="number" class="form-input" value="${s.price}" onchange="updateService(${i},'price',parseInt(this.value))"></div>
      <div class="form-group" style="margin:0;"><label class="form-label">Badge</label><input type="text" class="form-input" value="${s.badge||''}" placeholder="MOST POPULAR" onchange="updateService(${i},'badge',this.value)"></div>
    </div>
  </div>`).join('');
}

function buildZonesList(){
  const zones=getZones();
  return zones.map((z,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--light);"><span style="font-size:13px;">${z}</span><button class="act-btn danger" onclick="removeZone(${i})">Remove</button></div>`).join('');
}

function buildAffAdminList(){
  const affs=getAffs(); const bks=getBookings();
  if(!affs.length) return '<p style="font-size:13px;color:var(--gray);padding:20px 0;">No affiliates yet.</p>';
  return affs.map((a,i)=>{
    const completed=bks.filter(b=>b.affiliateCode===a.code&&b.status==='completed');
    const rate=a.weeklyRefs>=5?0.15:0.10;
    const earned=completed.reduce((s,b)=>s+(b.price||0)*rate,0);
    const owed=Math.max(0,earned-(a.totalPaid||0));
    return `<div class="bk-card"><div style="flex:1;"><div class="bk-name">${a.name}</div><div class="bk-details">${a.code}<br>${a.email}<br>Bank: ${a.bank||'—'} · ${a.payoutFreq}<br>Completed: ${completed.length} · Owed: ${fmtP(owed)} · Rate: ${rate*100}%</div><div class="bk-actions"><button class="act-btn ok" onclick="openPayAff(${i})">Mark Paid</button></div></div></div>`;
  }).join('');
}

function buildSubsAdminList(){
  const subs=getSubs();
  const active=subs.filter(s=>s.active).length;
  if(!subs.length) return '<p style="font-size:13px;color:var(--gray);padding:20px 0;">No subscriptions yet.</p>';
  return `<p style="font-family:monospace;font-size:11px;margin-bottom:14px;">Active: ${active}/${MAX_SUBS}</p>`+subs.map(s=>`<div class="bk-card"><div style="flex:1;"><div class="bk-name">${s.name}</div><div class="bk-details">${s.plan} · ${fmtP(s.price||0)}<br>Started: ${s.startDate} · Renews: ${s.renewDate}<br>Used: ${s.used||0}/4</div></div><span class="bk-status ${s.active?'s-confirmed':'s-completed'}">${s.active?'active':'expired'}</span></div>`).join('');
}

// ─── ADMIN ACTIONS ───
function toggleBlockType(){ document.getElementById('blRangeWrap').style.display=document.getElementById('blType').value==='range'?'block':'none'; }

function adminSetStatus(id,status){
  const bks=getBookings(); const b=bks.find(b=>b.id===id); if(!b) return;
  b.status=status;
  if(status==='completed'&&b.refCode){
    const users=getUsers(); const u=users.find(u=>u.code===b.refCode);
    if(u){ u.referralCount=(u.referralCount||0)+1; u.referrals=u.referrals||[]; u.referrals.push(b.id); saveUsers(users);
      API.updateUser(u.email, {referralCount: u.referralCount}).catch(console.error);
    }
    if(b.affiliateCode){
      const affs=getAffs(); const a=affs.find(a=>a.code===b.affiliateCode);
      if(a){ a.totalCompleted=(a.totalCompleted||0)+1; const wk=new Date(Date.now()-7*86400000).toISOString().split('T')[0]; a.weeklyRefs=bks.filter(bk=>bk.affiliateCode===a.code&&bk.status==='completed'&&bk.date>=wk).length; saveAffs(affs); }
    }
  }
  saveBookings(bks);
  // Persist to DB
  API.updateBooking(id, {status}).catch(console.error);
  renderProfilePanel(); renderCal();
  if(typeof renderAdminPage==='function') renderAdminPage(currentAdminPage);
}

function adminMarkPaid(id){
  const bks=getBookings(); const b=bks.find(b=>b.id===id); if(!b) return;
  b.paymentStatus='paid'; saveBookings(bks);
  API.updateBooking(id, {paymentStatus:'paid'}).catch(console.error);
  showToast('✓ Marked as paid','success',2000);
  if(typeof renderAdminPage==='function') renderAdminPage(currentAdminPage);
}

function adminDelBk(id){
  if(!confirm('Delete this booking?')) return;
  allBookings=allBookings.filter(b=>b.id!==id);
  DB.set('bookings',allBookings);
  API.deleteBooking(id).catch(console.error);
  renderProfilePanel(); renderCal();
  if(typeof renderAdminPage==='function') renderAdminPage(currentAdminPage);
}

function addManualBk(){
  const name=document.getElementById('mnName').value.trim();
  const phone=document.getElementById('mnPhone').value.trim();
  const svcId=document.getElementById('mnService').value;
  const date=document.getElementById('mnDate').value;
  const time=document.getElementById('mnTime').value;
  const group=parseInt(document.getElementById('mnGroup').value)||1;
  const customPrice=document.getElementById('mnPrice').value;
  const notes=document.getElementById('mnNotes').value.trim();
  if(!name||!date||!time){alert('Name, date and time required.');return;}
  const svc=getServices().find(s=>s.id===svcId)||getServices()[0];
  const sc=getSurcharge(time.split(':')[0]||'9',svc.price);
  const price=customPrice?parseInt(customPrice):sc.price*group;
  const nb={id:Date.now().toString(),name,phone,service:svcId,serviceName:svc.name,date,time,groupSize:group,address:notes,status:'confirmed',source:'manual',price,payment:'cash',paymentStatus:'pending',createdAt:new Date().toISOString()};
  allBookings.push(nb);
  DB.set('bookings',allBookings);
  API.saveBooking(nb).catch(console.error);
  renderProfilePanel(); renderCal();
  showToast('✓ Booking added!','success',2500);
  if(typeof renderAdminPage==='function') renderAdminPage(currentAdminPage);
}

function addBlock(){
  const date=document.getElementById('blDate').value;
  const type=document.getElementById('blType').value;
  const reason=document.getElementById('blReason').value;
  if(!date){alert('Date required');return;}
  const bl={date,reason};
  if(type==='range'){
    const from=document.getElementById('blFrom').value;
    const to=document.getElementById('blTo').value;
    if(!from||!to){alert('Please set both from and to times.');return;}
    bl.timeFrom=from; bl.timeTo=to;
  }
  const blocks=getBlocks(); blocks.push(bl); saveBlocks(blocks);
  document.getElementById('blList').innerHTML=buildBlockList();
  renderCal();
}
function removeBlock(i){ const blocks=getBlocks(); blocks.splice(i,1); saveBlocks(blocks); document.getElementById('blList').innerHTML=buildBlockList(); renderCal(); }

function toggleCal(){ DB.set('calClosed',!isCalClosed()); refreshBanner(); renderCal(); renderProfilePanel(); }

// ─── SERVICES ADMIN ───
function updateService(i,field,val){
  const svcs=getServices(); svcs[i][field]=val; saveServices(svcs);
  renderServicesSection();
}
function deleteService(i){ if(!confirm('Delete this service?')) return; const svcs=getServices(); svcs.splice(i,1); saveServices(svcs); renderServicesSection(); renderProfilePanel(); }
function addNewService(){
  const svcs=getServices();
  svcs.push({id:'svc_'+Date.now(),name:'New Service',nameEs:'Nuevo Servicio',desc:'Description here',descEs:'Descripción aquí',price:150000,badge:'',badgeEs:''});
  saveServices(svcs); renderServicesSection(); renderProfilePanel();
}

// ─── ZONES ADMIN ───
function addZone(){ const v=document.getElementById('newZoneInput').value.trim(); if(!v) return; const z=getZones(); z.push(v); saveZones(z); document.getElementById('zonesList').innerHTML=buildZonesList(); document.getElementById('newZoneInput').value=''; updateMarquee(); }
function removeZone(i){ const z=getZones(); z.splice(i,1); saveZones(z); document.getElementById('zonesList').innerHTML=buildZonesList(); updateMarquee(); }
function updateMarquee(){
  const zones=getZones();
  const track=document.querySelector('.marquee-track');
  if(!track) return;
  const items=zones.map(z=>`<span>${z}</span><span class="dot">·</span>`).join('');
  track.innerHTML=items+items;
}

// ─── SUBSCRIPTION ───
function openSubModal(plan){
  const subs=getSubs(); const active=subs.filter(s=>s.active).length;
  const plans={cut:{label:'Cut Plan',price:480000,was:600000},cut_beard:{label:'Cut + Beard',price:576000,was:720000},beard:{label:'Beard Plan',price:320000,was:400000}};
  const p=plans[plan];
  document.getElementById('subModalTitle').textContent=p.label.toUpperCase();
  document.getElementById('subModalContent').innerHTML=active>=MAX_SUBS?`
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;line-height:1.6;"><strong style="color:var(--red);">No spots available.</strong> Join the waitlist.</p>
    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="wlEmail" placeholder="your@email.com"></div>
    <div style="display:flex;gap:11px;"><button class="modal-btn" onclick="closeModal('subModal')">Cancel</button><button class="modal-btn primary" onclick="joinWL('${plan}')">JOIN WAITLIST →</button></div>`:`
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;line-height:1.6;">${MAX_SUBS-active} of ${MAX_SUBS} spots remaining. 30-day cycle from today.</p>
    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="subEmail" value="${currentUser?.email||''}" placeholder="your@email.com"></div>
    <div style="display:flex;gap:11px;"><button class="modal-btn" onclick="closeModal('subModal')">Cancel</button><button class="modal-btn primary" onclick="doSub('${plan}',${p.price})">SUBSCRIBE — ${fmtP(p.price)} →</button></div>`;
  openModal('subModal');
}
function doSub(plan,price){
  const em=document.getElementById('subEmail').value.trim(); if(!em){alert('Email required');return;}
  const subs=getSubs(); if(subs.filter(s=>s.active).length>=MAX_SUBS){alert('No spots available.');return;}
  const start=new Date(); const renew=new Date(start.getTime()+30*86400000);
  subs.push({email:em,name:currentUser?.name||em,plan,price,startDate:start.toISOString().split('T')[0],renewDate:renew.toISOString().split('T')[0],active:true,used:0,createdAt:start.toISOString()});
  saveSubs(subs); closeModal('subModal'); updateSubSlots();
  alert(`Subscription activated! Renews on ${renew.toISOString().split('T')[0]}.`);
}
function joinWL(plan){ const em=document.getElementById('wlEmail').value.trim(); if(!em){alert('Email required');return;} closeModal('subModal'); alert(`Added to waitlist. We'll notify you when a spot opens.`); }
function updateSubSlots(){ const active=getSubs().filter(s=>s.active).length; const r=MAX_SUBS-active; ['subSlots0','subSlots1','subSlots2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=r>0?`${r} spot${r!==1?'s':''} available`:'Full — join waitlist'; }); }

// ─── AFFILIATES ───
function openAffRegister(){
  document.getElementById('affModalContent').innerHTML=`
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;line-height:1.6;">Fill out your details to join. You'll receive your affiliate code instantly.</p>
    <div class="form-row"><div class="form-group"><label class="form-label">First Name</label><input type="text" class="form-input" id="afFirst" placeholder="John"></div><div class="form-group"><label class="form-label">Last Name</label><input type="text" class="form-input" id="afLast" placeholder="Doe"></div></div>
    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="afEmail" placeholder="john@email.com"></div>
    <div class="form-group"><label class="form-label">WhatsApp</label><input type="tel" class="form-input" id="afPhone" placeholder="+1 555 000 0000"></div>
    <div class="form-group"><label class="form-label">Bank / Payment (Nequi, Bancolombia, PayPal...)</label><input type="text" class="form-input" id="afBank" placeholder="Nequi 300..."></div>
    <div class="form-group"><label class="form-label">Payout Frequency</label><select class="form-select" id="afPayout"><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option></select></div>
    <div style="display:flex;gap:11px;"><button class="modal-btn" onclick="closeModal('affModal')">Cancel</button><button class="modal-btn primary" onclick="doAffRegister()">REGISTER →</button></div>`;
  openModal('affModal');
}
function doAffRegister() {
  const first = document.getElementById('afFirst')?.value?.trim();
  const last = document.getElementById('afLast')?.value?.trim();
  const email = document.getElementById('afEmail')?.value?.trim();
  const phone = document.getElementById('afPhone')?.value?.trim();
  const bank = document.getElementById('afBank')?.value?.trim();
  if (!first || !email) { showToast('Name and email required'); return; }
  const btn = document.querySelector('#affModal button[onclick*="doAff"]');
  if (btn) btn.disabled = true;
  fetch('/.netlify/functions/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: first, lastName: last, email, phone, role: 'affiliate', bank })
  }).then(r => r.json()).then(data => {
    if (data.id) {
      closeModal('affModal');
      showToast('Welcome! Your code: ' + (data.affiliate_code || 'MICH-' + data.id.toString(36).toUpperCase()));
    } else {
      showToast(data.error || 'Registration failed');
    }
  }).catch(e => showToast('Error: ' + e.message))
  .finally(() => { if (btn) btn.disabled = false; });
}
function openPayAff(i){
  const s=document.createElement('div'); s.className='float-sheet';
  s.innerHTML=`<div class="float-inner"><h3 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:16px;">MARK PAYMENT</h3><p style="font-size:13px;color:var(--gray);margin-bottom:16px;line-height:1.5;">Upload proof of transfer. This will reset their pending balance to $0.</p><div class="upload-area" onclick="document.getElementById('payProof').click()"><p>TAP TO UPLOAD TRANSFER SCREENSHOT</p><input type="file" id="payProof" accept="image/*" style="display:none;" onchange="confirmPayAff(${i},this)"></div><button class="modal-btn" style="width:100%;margin-top:14px;" onclick="this.closest('.float-sheet').remove()">Cancel</button></div>`;
  document.body.appendChild(s);
}
function confirmPayAff(i,input){
  if(!input.files[0]) return;
  const affs=getAffs(); const bks=getBookings(); const a=affs[i];
  const rate=a.weeklyRefs>=5?0.15:0.10;
  const earned=bks.filter(b=>b.affiliateCode===a.code&&b.status==='completed').reduce((s,b)=>s+(b.price||0)*rate,0);
  a.totalPaid=(a.totalPaid||0)+Math.max(0,earned-(a.totalPaid||0));
  a.lastPaid=new Date().toISOString().split('T')[0];
  saveAffs(affs);
  document.body.querySelector('.float-sheet').remove();
  renderProfilePanel();
  alert(`Payment recorded for ${a.name}. Balance reset.`);
}

// ─── SCROLL REVEAL ───
const revObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.08});
document.querySelectorAll('.reveal').forEach(el=>revObserver.observe(el));
