// ─── AUTH ───
function openProfile(){
  if(!currentUser){ showAuth('signin'); return; }
  if(currentUser.isAdmin){ openAdminApp(); return; }
  renderProfilePanel(); openPanel();
}
function showAuth(mode){
  document.getElementById('authTitle').textContent=mode==='signin'?'SIGN IN':'CREATE ACCOUNT';
  if(mode==='signin'){
    document.getElementById('authContent').innerHTML=`
      <div class="form-group"><label class="form-label">Username or Email</label><input type="text" class="form-input" id="aiEmail" placeholder="username or email" onkeydown="if(event.key==='Enter')doSignIn()"></div>
      <div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" id="aiPass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doSignIn()"></div>
      <div style="display:flex;gap:11px;margin-top:6px;"><button class="modal-btn" onclick="closeModal('authModal')">Cancel</button><button class="modal-btn primary" onclick="doSignIn()">SIGN IN →</button></div>
      <p style="font-family:monospace;font-size:10px;color:var(--gray);margin-top:14px;text-align:center;cursor:pointer;letter-spacing:0.08em;" onclick="showAuth('register')">No account? Register</p>
      <p style="font-family:monospace;font-size:10px;color:var(--gray);margin-top:8px;text-align:center;cursor:pointer;letter-spacing:0.08em;" onclick="showForgot()">Forgot password?</p>`;
  } else {
    document.getElementById('authContent').innerHTML=`
      <div class="form-row"><div class="form-group"><label class="form-label">First Name</label><input type="text" class="form-input" id="rnFirst" placeholder="John"></div><div class="form-group"><label class="form-label">Last Name</label><input type="text" class="form-input" id="rnLast" placeholder="Doe"></div></div>
      <div class="form-group"><label class="form-label">Username</label><input type="text" class="form-input" id="rnUsername" placeholder="john92" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'')"><p style="font-family:monospace;font-size:9px;color:var(--gray);margin-top:4px;letter-spacing:0.05em;">Lowercase, numbers and _ only. Used to sign in.</p></div>
      <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="rnEmail" placeholder="john@email.com"></div>
      <div class="form-group">
        <label class="form-label">Phone / WhatsApp</label>
        <div class="phone-wrap">
          <select class="country-select" id="rnCountry" onchange="updatePhoneCode('rnCountry','rnPhone')">
            <option value="+57">🇨🇴 +57</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+49">🇩🇪 +49</option>
            <option value="+33">🇫🇷 +33</option>
            <option value="+34">🇪🇸 +34</option>
            <option value="+39">🇮🇹 +39</option>
            <option value="+55">🇧🇷 +55</option>
            <option value="+52">🇲🇽 +52</option>
            <option value="+54">🇦🇷 +54</option>
          </select>
          <input type="tel" class="phone-number-input" id="rnPhone" placeholder="300 123 4567">
        </div>
      </div>
      <div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" id="rnPass" placeholder="••••••••"></div>
      <div class="form-group"><label class="form-label">Referral Code (optional)</label><input type="text" class="form-input" id="rnRef" placeholder="MICH-XXXX" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"></div>
      <div class="form-group"><label class="form-label">Account Type</label><select class="form-select" id="rnUserType"><option value="client">Client</option><option value="affiliate">Affiliate</option></select></div>
      <div style="display:flex;gap:11px;margin-top:6px;"><button class="modal-btn" onclick="showAuth('signin')">← Back</button><button class="modal-btn primary" onclick="doRegister()">CREATE ACCOUNT →</button></div>`;
  }
  openModal('authModal');
}
let _loginPending = false;
async function doSignIn() {
  if(_loginPending) return;
  const u = (document.getElementById('aiEmail')?.value || '').trim();
  const p = (document.getElementById('aiPass')?.value || '').trim();
  if (!u || !p) { showToast('Enter username and password'); return; }

  // Find the sign in button — it's the primary modal-btn
  const btn = document.querySelector('#authContent .modal-btn.primary');
  const originalText = btn ? btn.textContent : '';

  function setLoading(on){
    _loginPending = on;
    if(!btn) return;
    if(on){
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-text">SIGN IN →</span>';
      btn.classList.add('btn-loading');
    } else {
      btn.disabled = false;
      btn.textContent = originalText;
      btn.classList.remove('btn-loading');
    }
  }

  setLoading(true);
  try {
    if (u === 'admin') {
      const res = await fetch('/.netlify/functions/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: p })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        DB.set('session', {isAdmin: true}); // persist session across reloads
        currentUser = {name:'Michail González', email:'admin', isAdmin:true};
        closeModal('authModal');
        openAdminApp();
        if (typeof buildAdminPanel === 'function') buildAdminPanel();
      } else {
        showToast(data.error || 'Invalid password');
        setLoading(false);
      }
      return;
    }
    const field = u.includes('@') ? 'email' : 'username';
    const res = await fetch('/.netlify/functions/users?' + field + '=' + encodeURIComponent(u));
    const data = await res.json();
    if (!res.ok || !data.id) { showToast('User not found'); setLoading(false); return; }
    if (data.password && data.password !== p) { showToast('Incorrect password'); setLoading(false); return; }
    localStorage.setItem('currentUser', JSON.stringify(data));
    closeModal('authModal');
    showToast('Welcome back, ' + (data.firstName || u));
    if (typeof updateNavForUser === 'function') updateNavForUser(data);
  } catch(e) {
    showToast('Login error: ' + e.message);
    setLoading(false);
  }
}
async function doRegister(){
  const fn=document.getElementById('rnFirst').value.trim();
  const ln=document.getElementById('rnLast').value.trim();
  const em=document.getElementById('rnEmail').value.trim().toLowerCase();
  const ph=document.getElementById('rnPhone').value.trim();
  const pw=document.getElementById('rnPass').value;
  const ref=document.getElementById('rnRef').value.trim().toUpperCase();
  const userType=document.getElementById('rnUserType')?.value||'client';
  if(!fn||!em||!pw){ alert('Name, email and password required.'); return; }

  const username=document.getElementById('rnUsername')?.value?.trim()?.toLowerCase()||fn.toLowerCase()+Math.floor(Math.random()*999);
  const nu={
    name:`${fn} ${ln}`.trim(), username, email:em, phone:ph,
    password:btoa(pw), code:genCode(fn), referredBy:ref||null,
    referralCount:0, isAdmin:false, isAffiliate:userType==='affiliate',
    userType, createdAt:new Date().toISOString()
  };

  // Save to DB first
  const result = await API.registerUser(nu);
  if(result && result.error){
    if(result.error==='exists'){ alert('Email or username already registered.'); return; }
    // DB failed — fall back to localStorage only
    const users=getUsers();
    if(users.find(u=>u.email.toLowerCase()===em)){ alert('Email already registered.'); return; }
    if(ref){ const rUser=users.find(u=>u.code===ref); const rAff=getAffs().find(a=>a.code===ref); if(!rUser&&!rAff){ alert('Invalid referral code.'); return; } }
    users.push(nu); saveUsers(users);
  }
  // Also keep in localStorage for offline session restore
  const users=getUsers(); if(!users.find(u=>u.email===em)){ users.push(nu); saveUsers(users); }

  currentUser=nu;
  DB.set('session', {email:nu.email});
  closeModal('authModal');
  document.getElementById('navSignInBtn').textContent='◉';
  showToast('✓ ' + (currentLang==='es'?'Cuenta creada exitosamente':'Account created successfully'));
  renderProfilePanel(); openPanel();
  setTimeout(function(){ showToast('Welcome ' + fn + '! Code: ' + nu.code, 'success', 5000); }, 600);
}
function showForgot(){
  document.getElementById('authTitle').textContent='RESET PASSWORD';
  document.getElementById('authContent').innerHTML=`
    <p style="font-size:13px;color:var(--gray);margin-bottom:18px;line-height:1.6;">Enter your email and we'll send a reset link.</p>
    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="frEmail" placeholder="your@email.com"></div>
    <div style="display:flex;gap:11px;"><button class="modal-btn" onclick="showAuth('signin')">← Back</button><button class="modal-btn primary" onclick="doForgot()">SEND LINK →</button></div>`;
}
function doForgot(){ const em=document.getElementById('frEmail').value.trim(); if(!em){alert('Email required');return;} alert(`Reset link sent to ${em}. (Requires EmailJS setup)`); closeModal('authModal'); }
function doSignOut(){ currentUser=null; DB.set('session',null); localStorage.removeItem('adminToken'); document.getElementById('navSignInBtn').textContent=currentLang==='es'?'Ingresar':'Sign In'; closePanel(); closeAdminApp(); }
