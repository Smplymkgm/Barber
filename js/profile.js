// ─── PROFILE PANEL ───
function renderProfilePanel(){
  if(!currentUser) return;
  if(currentUser.isAdmin){ openAdminApp(); return; }
  document.getElementById('panelTitle').textContent='My Profile';
  document.getElementById('panelContent').innerHTML=buildClientPanel();
}
function buildClientPanel(){
  const em=(currentUser.email||'').toLowerCase();
  const bks=getBookings().filter(b=>(b.email||'').toLowerCase()===em);
  const sub=getSubs().find(s=>s.email===currentUser.email&&s.active);
  return `<div class="panel-tabs">
    <button class="panel-tab active" onclick="swTab(event,'cp-profile')">Profile</button>
    <button class="panel-tab" onclick="swTab(event,'cp-bookings')">Bookings</button>
    <button class="panel-tab" onclick="swTab(event,'cp-sub')">Subscription</button>
  </div>
  <div class="panel-section active" id="cp-profile">
    <div class="code-card"><div class="code-label">YOUR REFERRAL CODE</div><div class="code-value">${currentUser.code}</div><div class="code-note">Share this with new clients. Progress updates automatically when services complete.</div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${currentUser.referralCount||0}</div><div class="stat-lbl">Referrals</div></div>
      <div class="stat-card"><div class="stat-val">${bks.filter(b=>b.status==='completed').length}</div><div class="stat-lbl">Services</div></div>
    </div>
    <div style="background:var(--off);padding:18px;margin-bottom:20px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.15em;color:var(--gray);text-transform:uppercase;margin-bottom:11px;">Referral Progress</div>
      <div style="background:var(--light);height:3px;margin-bottom:8px;"><div style="height:100%;background:var(--black);width:${Math.min((currentUser.referralCount||0)/5*100,100)}%;transition:width 1s ease;"></div></div>
      <div style="display:flex;justify-content:space-between;">${['0','1','2','3','4','FREE'].map(m=>`<span style="font-family:monospace;font-size:9px;color:var(--gray);">${m}</span>`).join('')}</div>
    </div>
    <div style="margin-bottom:20px;"><p style="font-size:14px;font-weight:500;margin-bottom:4px;">${currentUser.name}</p><p style="font-size:12px;color:var(--gray);">${currentUser.email}</p><p style="font-size:12px;color:var(--gray);">${currentUser.phone||''}</p></div>
    <button class="submit-btn" onclick="showChangePass()">CHANGE PASSWORD</button>
    <button class="act-btn danger" style="width:100%;padding:13px;margin-top:10px;" onclick="doSignOut()">SIGN OUT</button>
  </div>
  <div class="panel-section" id="cp-bookings">${bks.length?[...bks].reverse().map(b=>`<div class="bk-card"><div class="bk-info"><div class="bk-name">${b.serviceName||b.service}</div><div class="bk-details">${b.date} · ${b.time}${b.groupSize>1?' · ×'+b.groupSize:''}<br>${b.address}<br>${fmtP(b.price)}</div></div><span class="bk-status s-${b.status}">${b.status}</span></div>`).join(''):'<p style="font-size:13px;color:var(--gray);padding:24px 0;">No bookings yet.</p>'}</div>
  <div class="panel-section" id="cp-sub">${sub?`<div style="background:var(--black);color:var(--white);padding:22px;margin-bottom:20px;"><p style="font-family:monospace;font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:0.2em;margin-bottom:7px;">ACTIVE PLAN</p><p style="font-family:'Bebas Neue',sans-serif;font-size:30px;">${sub.plan.toUpperCase()}</p><p style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.45);margin-top:7px;">Renews: ${sub.renewDate} · Used: ${sub.used||0}/4</p></div>`:'<p style="font-size:13px;color:var(--gray);margin-bottom:20px;line-height:1.6;">No active subscription.</p><a href="#subscription" onclick="closePanel()" style="display:block;text-align:center;padding:15px;background:var(--black);color:var(--white);font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-decoration:none;">VIEW PLANS →</a>'}</div>`;
}

function swTab(e,id){ const p=e.target.closest('.panel-content')||document.getElementById('panelContent'); p.querySelectorAll('.panel-tab').forEach(t=>t.classList.remove('active')); p.querySelectorAll('.panel-section').forEach(s=>s.classList.remove('active')); e.target.classList.add('active'); document.getElementById(id).classList.add('active'); }

function showChangePass(){
  const s=document.createElement('div'); s.className='float-sheet';
  s.innerHTML=`<div class="float-inner"><h3 style="font-family:'Bebas Neue',sans-serif;font-size:30px;margin-bottom:18px;">CHANGE PASSWORD</h3><div class="form-group"><label class="form-label">Current Password</label><input type="password" class="form-input" id="cpCur"></div><div class="form-group"><label class="form-label">New Password</label><input type="password" class="form-input" id="cpNew"></div><div style="display:flex;gap:10px;"><button class="modal-btn" onclick="this.closest('.float-sheet').remove()">Cancel</button><button class="modal-btn primary" onclick="doChangePass(this)">SAVE →</button></div></div>`;
  document.body.appendChild(s);
}
function doChangePass(btn){
  const cur=document.getElementById('cpCur').value; const nw=document.getElementById('cpNew').value;
  if(btoa(cur)!==currentUser.password){alert('Current password incorrect.');return;}
  const users=getUsers(); const u=users.find(u=>u.email===currentUser.email); u.password=btoa(nw); currentUser.password=btoa(nw); saveUsers(users);
  btn.closest('.float-sheet').remove(); alert('Password changed.');
}
