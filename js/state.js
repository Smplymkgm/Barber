// ─── STATE ───
let currentLang='en', currentUser=null;
let selDate=null, selTime=null, selGroup=1, selPay=null;
let calYear, calMonth, curBookingData=null;

// ─── PRICING ───
function getSurcharge(time, base){
  if(!time) return {price:base,label:'',flat:false};
  const h=parseInt(time);
  if(h<5||h>=23) return {price:0,label:'Unavailable',flat:false,unavailable:true};
  if(h===5) return {price:Math.round(base*1.5),label:'+50%',flat:false};
  if(h===6) return {price:Math.round(base*1.4),label:'+40%',flat:false};
  if(h===7) return {price:Math.round(base*1.4),label:'+40%',flat:false};
  if(h===8) return {price:Math.round(base*1.2),label:'+20%',flat:false};
  if(h>=9&&h<=18) return {price:base,label:'',flat:false};
  if(h===19) return {price:Math.round(base*1.2),label:'+20%',flat:false};
  if(h===20) return {price:Math.round(base*1.4),label:'+40%',flat:false};
  if(h>=21&&h<=22) return {price:Math.round(base*1.5),label:'+50%',flat:false};
  return {price:base,label:'',flat:false};
}
function fmtP(p){ return '$'+(p/1000).toFixed(0)+'k COP'; }
function genCode(name){ const p=name.split(' ')[0].substring(0,4).toUpperCase(); const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return p+'-'+s; }
function genAffCode(name){ return 'AFF-'+name.substring(0,3).toUpperCase()+'-'+Math.random().toString(36).substring(2,6).toUpperCase(); }

// ─── SERVICES RENDER ───
function renderServicesSection(){
  const services=getServices();
  const lang=currentLang;
  const list=document.getElementById('servicesList');
  if(!list) return;
  const bookTxt = lang==='es' ? 'Reservar →' : 'Book →';
  list.innerHTML=services.map(s=>`
    <div class="service-item reveal" onclick="selectServiceAndBook('${s.id}')" style="cursor:pointer;transition:opacity 0.2s;" onmouseenter="this.style.opacity='0.75'" onmouseleave="this.style.opacity='1'">
      <div style="flex:1;">
        <div class="service-name">${lang==='es'&&s.nameEs?s.nameEs:s.name}</div>
        <div class="service-desc">${lang==='es'&&s.descEs?s.descEs:s.desc}</div>
        ${s.badge?`<span class="service-badge">${lang==='es'&&s.badgeEs?s.badgeEs:s.badge}</span>`:''}
        <div style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;margin-top:10px;color:var(--gray);">${bookTxt}</div>
      </div>
      <div style="text-align:right;">
        <div class="service-price">${fmtP(s.price)}</div>
      </div>
    </div>`).join('');
  // Re-observe reveals
  document.querySelectorAll('#servicesList .reveal').forEach(el=>{
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.08});
    obs.observe(el);
  });
  // Update service select
  const sel=document.getElementById('serviceSelect');
  if(sel) sel.innerHTML=services.map(s=>`<option value="${s.id}">${lang==='es'&&s.nameEs?s.nameEs:s.name} — ${fmtP(s.price)}</option>`).join('');
}

// ─── SERVICE CLICK → SCROLL TO BOOKING ───
function selectServiceAndBook(svcId){
  const sel = document.getElementById('serviceSelect');
  if(sel){ sel.value = svcId; updatePricePreview(); }
  const bookingSection = document.getElementById('booking');
  if(bookingSection){
    openBookingPopup(svcId); return;
    setTimeout(function(){ if(selDate) renderTimeSlots(selDate); }, 400);
  }
}

// ─── LANG ───
function setLang(lang){
  currentLang=lang;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.lang-btn').forEach(b=>{if(b.textContent===lang.toUpperCase())b.classList.add('active');});
  document.querySelectorAll('[data-en]').forEach(el=>{el.textContent=el.getAttribute('data-'+lang);});
  document.querySelectorAll('[data-ph-en]').forEach(el=>{el.placeholder=el.getAttribute('data-ph-'+lang);});
  renderServicesSection();
}

// ─── NAV ───
window.addEventListener('scroll',()=>document.getElementById('mainNav').classList.toggle('scrolled',window.scrollY>60));
function toggleMenu(){
  const m=document.getElementById('menuOverlay');
  const isOpen=m.style.transform==='translateX(0%)' || m.style.transform==='translateX(0px)' || m.style.transform==='translateX(0)';
  m.style.transform=isOpen?'translateX(100%)':'translateX(0%)';
}
function closeMenu(){
  document.getElementById('menuOverlay').style.transform='translateX(100%)';
}

// Menu event listeners
document.addEventListener('DOMContentLoaded',function(){
  const closeBtn=document.getElementById('menuCloseBtn');
  if(closeBtn) closeBtn.addEventListener('click',function(e){e.stopPropagation();closeMenu();});
  ['mLink1','mLink2','mLink3','mLink4','mLink5','mLink6'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('click',closeMenu);
  });
});

// ─── MODAL ───
function openModal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('open');
  // Close on outside click
  el.onclick = function(e){ if(e.target === el) closeModal(id); };
}
function closeModal(id){ var m=document.getElementById(id); if(m){ m.classList.remove('open'); m.style.display=''; } }
function showModal(id){ var m=document.getElementById(id); if(!m){ console.warn('showModal: element not found:',id); return; } m.style.display='flex'; m.classList.add('open'); m.onclick=function(e){ if(e.target===m) closeModal(id); }; }
function openTransferModal(name, svc, grpSuffix, date, time, price){
  var g=function(id){ return document.getElementById(id); };
  var info=name+' · '+svc+grpSuffix+' · '+date+' at '+time+' · '+price;
  var t;
  t=g('transferBookingInfo'); if(t) t.textContent=info;
  t=g('tmBankName');          if(t) t.textContent=BANK_NAME;
  t=g('tmAccount');           if(t) t.textContent=BANK_ACCOUNT;
  t=g('tmType');              if(t) t.textContent=BANK_TYPE;
  t=g('tmHolder');            if(t) t.textContent=BANK_HOLDER;
  t=g('tmNequi');             if(t) t.textContent=BANK_NEQUI;
  var m=g('transferModal');
  if(!m){ console.error('[openTransferModal] #transferModal not found in DOM'); return; }
  m.style.setProperty('display','flex','important');
  m.classList.add('open');
  m.onclick=function(ev){ if(ev.target===m) closeModal('transferModal'); };
  console.log('[openTransferModal] opened — display:',m.style.display,'classes:',m.className);
}
function openPanel(){ document.getElementById('sidePanel').classList.add('open'); }
function closePanel(){ document.getElementById('sidePanel').classList.remove('open'); }

// ─── CAL BANNER ───
function refreshBanner(){ document.getElementById('calBanner').classList.toggle('show',isCalClosed()); }

// ─── CALENDAR ───
function initCal(){ const n=new Date(); calYear=n.getFullYear(); calMonth=n.getMonth(); renderCal(); }
function renderCal(){
  const grid=document.getElementById('calGrid');
  if(isCalClosed()){
    if(!currentUser?.isAdmin){
      grid.innerHTML='<p style="font-family:\'Space Mono\',monospace;font-size:11px;color:var(--red);padding:16px;text-align:center;letter-spacing:0.1em;">CALENDAR CLOSED</p>';
      return;
    }
    // Admin: fall through and render calendar, banner added below
  }
  const fd=new Date(calYear,calMonth,1).getDay();
  const dm=new Date(calYear,calMonth+1,0).getDate();
  const today=new Date(); today.setHours(0,0,0,0);
  const mn=new Date(calYear,calMonth).toLocaleString('en',{month:'long'});
  const bookings=getBookings(); const blocks=getBlocks();
  let h=`<div class="cal-header"><button class="cal-nav" onclick="changeMonth(-1)">←</button><span class="cal-month">${mn} ${calYear}</span><button class="cal-nav" onclick="changeMonth(1)">→</button></div>
  <div class="cal-days-header">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<div class="cal-day-name">${d}</div>`).join('')}</div><div class="cal-days">`;
  for(let i=0;i<fd;i++) h+=`<div class="cal-day empty"></div>`;
  for(let d=1;d<=dm;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dobj=new Date(calYear,calMonth,d);
    const isPast=dobj<today;
    const isBlocked=blocks.some(bl=>bl.date===ds&&!bl.timeFrom);
    const cnt=bookings.filter(b=>b.date===ds&&b.status!=='cancelled').length;
    const isFull=cnt>=MAX_PER_DAY||isBlocked;
    const isSel=ds===selDate;
    let cls='cal-day';
    if(isPast) cls+=' disabled';
    else if(isFull) cls+=' full';
    else if(isSel) cls+=' selected';
    else if(dobj.getTime()===today.getTime()) cls+=' today';
    h+=`<div class="${cls}"${!isPast&&!isFull?` onclick="selectDate('${ds}')"`:''}>${d}</div>`;
  }
  h+=`</div>`;
  if(isCalClosed()) h='<div style="background:var(--red);color:#fff;padding:7px 14px;font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:0.1em;display:flex;justify-content:space-between;align-items:center;">CALENDAR CLOSED (admin view)<button type="button" onclick="adminOpenCalendar()" style="background:#fff;color:var(--red);border:none;font-family:\'Space Mono\',monospace;font-size:9px;padding:3px 8px;cursor:pointer;letter-spacing:0.08em;">OPEN →</button></div>'+h;
  grid.innerHTML=h;
}
function adminOpenCalendar(){
  DB.set('calClosed',false);
  API.saveSetting('calendar_open','true').catch(console.error);
  refreshBanner();
  renderCal();
  showToast('✓ Calendar opened for all users','success',2500);
}
function changeMonth(dir){ calMonth+=dir; if(calMonth>11){calMonth=0;calYear++;} if(calMonth<0){calMonth=11;calYear--;} selDate=null;selTime=null; document.getElementById('timeSlotsWrap').style.display='none'; document.getElementById('pricePreview').classList.remove('show'); renderCal(); }
function selectDate(ds){
  selDate=ds; window.selectedDate=ds; selTime=null;
  renderCal();
  // Check if date is full - show waitlist
  const dayCount = getBookings().filter(function(b){return b.date===ds&&b.status!=='cancelled';}).length;
  const blocks = getBlocks();
  const isBlocked = blocks.some(function(bl){return bl.date===ds&&!bl.timeFrom;});
  const isFull = dayCount >= MAX_PER_DAY || isBlocked;
  const wlBanner = document.getElementById('waitlistBanner');
  if(wlBanner){
    if(isFull){ wlBanner.classList.add('show'); wlBanner.setAttribute('data-date',ds); }
    else { wlBanner.classList.remove('show'); }
  }
  if(!isFull){
    renderTimeSlots(ds);
    document.getElementById('timeSlotsWrap').style.display='block';
    document.getElementById('pricePreview').classList.remove('show');
    setTimeout(function(){document.getElementById('timeSlotsWrap').scrollIntoView({behavior:'smooth',block:'nearest'});},100);
  }
}
function renderTimeSlots(ds){
  const allSlots=[];
  for(let hr=8;hr<=20;hr++){
    allSlots.push((hr<10?'0'+hr:String(hr))+':00');
    if(hr<20) allSlots.push((hr<10?'0'+hr:String(hr))+':30');
  }
  const bookings=getBookings(); const blocks=getBlocks();
  const blocked=new Set();
  blocks.filter(b=>b.date===ds).forEach(b=>{
    if(b.type==='day'){allSlots.forEach(t=>blocked.add(t));return;}
    if(b.startTime&&b.endTime) allSlots.forEach(t=>{if(t>=b.startTime&&t<b.endTime)blocked.add(t);});
  });
  const svcId=(document.getElementById('serviceSelect')||{}).value||'haircut';
  const svcs=getServices();
  const svc=svcs.find(s=>s.id===svcId)||svcs[0];
  const svcDur=svc&&svc.duration?svc.duration:60;
  bookings.filter(b=>b.date===ds&&b.status!=='cancelled').forEach(b=>{
    const [bh,bm]=b.time.split(':').map(Number);
    const bStart=bh*60+bm;
    const bSvc=svcs.find(s=>s.id===b.service);
    const bookedDur=bSvc&&bSvc.duration?bSvc.duration:60;
    const blockFrom=bStart-30; const blockTo=bStart+bookedDur+30;
    allSlots.forEach(t=>{
      const [th,tm]=t.split(':').map(Number);
      const tMin=th*60+tm; const tEnd=tMin+svcDur+30;
      if((tMin>=blockFrom&&tMin<blockTo)||(tEnd>bStart-30&&tMin<blockTo)) blocked.add(t);
    });
  });
  document.getElementById('timeSlots').innerHTML=allSlots.map(t=>{
    const isBl=blocked.has(t);
    return `<div class="time-slot${isBl?' blocked':''}"${isBl?'':` onclick="selectTime('${t}',this)"`}>${t}</div>`;
  }).join('');
}

// ─── PRICE PREVIEW ───
function updatePricePreview(){
  const svc=getServices().find(s=>s.id===document.getElementById('serviceSelect').value)||getServices()[0];
  const base=svc?svc.price:150000;
  if(!selTime){ document.getElementById('pricePreview').classList.remove('show'); return; }
  const sc=getSurcharge(selTime.split(':')[0],base);
  let total=sc.price*selGroup;
  const rc=document.getElementById('refCode')?.value?.trim()?.toUpperCase();
  let discNote='';
  if(rc){
    const u=getUsers().find(u=>u.code===rc);
    const a=getAffs().find(a=>a.code===rc);
    if(u&&!currentUser){ total=Math.round(total*0.9); discNote=' · 10% referral discount'; }
    if(a) discNote=' · Affiliate code applied';
  }
  const prev=document.getElementById('pricePreview');
  prev.classList.add('show');
  const svcName=currentLang==='es'&&svc.nameEs?svc.nameEs:svc.name;
  prev.textContent=`${svcName}${selGroup>1?' × '+selGroup:''} · ${fmtP(total)}${sc.label&&!sc.flat?' ('+sc.label+')':sc.flat?' (Late night)':''}${discNote}`;
}

// ─── GROUP / PAYMENT ───
function selectGroup(n,el){ selGroup=n; document.querySelectorAll('.grp-btn').forEach(b=>b.classList.remove('selected')); el.classList.add('selected'); updatePricePreview(); if(selDate) renderTimeSlots(selDate); }
function selectPay(m,el){ selPay=m; window.selectedPay=m; document.querySelectorAll('.pay-option').forEach(o=>o.classList.remove('selected')); el.classList.add('selected'); }

// ─── COVERAGE ───
function distToSurcharge(d){ if(d<=30)return 0; if(d<=40)return 10; if(d<=50)return 20; if(d<=60)return 40; if(d<=70)return 60; if(d<=80)return 80; if(d<=90)return 100; if(d<=100)return 150; return null; }
const ZONE_DISTS=[
  {kw:['poblado','laureles','envigado','sabaneta','itagui','itagüi','belen','belén','robledo','estadio','florida','manila','centro','boston','prado','america','castilla','aranjuez','manrique','copacabana','bello'],d:10},
  {kw:['palmas','llano grande','llanogrande','retiro'],d:55},
  {kw:['rionegro','río negro'],d:45},
  {kw:['guatape','guatapé'],d:85},
  {kw:['marinilla','carmen de viboral'],d:62},
];
function checkCoverage(){
  const addrEl=document.getElementById('addrInput');
  const res=document.getElementById('covResult');
  if(!addrEl||!res) return;
  const addr=addrEl.value.toLowerCase().trim();
  if(!addr){
    res.className='cov-result show no';
    res.textContent=currentLang==='es'?'Ingresa tu dirección para verificar cobertura.':'Enter your address to check coverage.';
    res.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  let dist=30;
  for(const z of ZONE_DISTS){ if(z.kw.some(k=>addr.includes(k))){ dist=z.d; break; } }
  const sur=distToSurcharge(dist);
  res.className='cov-result show '+(sur===null?'no':'yes');
  if(sur===null){ res.textContent=currentLang==='es'?'Fuera del área de cobertura (máx. 100km). Escríbenos por WhatsApp.':'Outside coverage area (max 100km). Message us on WhatsApp for a custom quote.'; }
  else if(sur===0){ res.textContent=currentLang==='es'?'✓ Dentro de la zona — precio estándar.':'✓ Within coverage area — standard pricing.'; }
  else{ const base=getServices()[0]?.price||150000; const total=Math.round(base*(1+sur/100)); res.textContent=currentLang==='es'?`✓ Cobertura disponible · Recargo +${sur}% · Corte desde ${fmtP(total)}`:`✓ Coverage available · Distance surcharge +${sur}% · Haircut from ${fmtP(total)}`; }
  res.scrollIntoView({behavior:'smooth',block:'nearest'});
}
document.getElementById('addrInput').addEventListener('keydown',e=>{if(e.key==='Enter')checkCoverage();});

// ─── NOMINATIM ADDRESS AUTOCOMPLETE ───
(function(){
  var input    = document.getElementById('bookAddr');
  var dropdown = document.getElementById('addrDropdown');
  if(!input || !dropdown) return;

  var debounceTimer = null;
  var activeIdx = -1;

  // Medellín centro: lat 6.2442, lon -75.5812
  // Viewbox cubre ~50km alrededor del Valle de Aburrá
  var MED_LAT = 6.2442, MED_LON = -75.5812;
  var VIEWBOX = '-75.8500,6.0000,-75.2500,6.5000'; // lon_min,lat_min,lon_max,lat_max
  var userLat = null, userLon = null;

  // Try to get user location for even better results
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
    }, function(){}, {timeout:5000});
  }

  function closeDropdown(){
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    activeIdx = -1;
  }

  function shortName(displayName){
    // Show only first 2-3 parts: "Name, Barrio, Medellín" instead of full string
    var parts = displayName.split(',');
    return parts.slice(0, 3).join(',').trim();
  }

  function renderItems(results){
    if(!results.length){ closeDropdown(); return; }
    dropdown.innerHTML = results.map(function(r, i){
      return '<div class="addr-item" data-lat="'+r.lat+'" data-lon="'+r.lon+'" data-idx="'+i+'" title="'+escHtml(r.display_name)+'">'
        + escHtml(shortName(r.display_name))
        + '</div>';
    }).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.addr-item').forEach(function(el){
      el.addEventListener('mousedown', function(e){
        e.preventDefault();
        input.value = el.textContent;
        window.bookLat = parseFloat(el.getAttribute('data-lat'));
        window.bookLng = parseFloat(el.getAttribute('data-lon'));
        closeDropdown();
      });
    });
  }

  function escHtml(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

  // Known Medellín landmarks not always in OpenStreetMap
  var LOCAL_LANDMARKS = [
    {name:'Triangle, El Poblado, Medellín', lat:6.2087, lon:-75.5670},
    {name:'Wall by Linares, El Poblado, Medellín', lat:6.2101, lon:-75.5680},
    {name:'Oviedo, El Poblado, Medellín', lat:6.2115, lon:-75.5712},
    {name:'El Tesoro, El Poblado, Medellín', lat:6.1972, lon:-75.5635},
    {name:'Santafé, Laureles, Medellín', lat:6.2468, lon:-75.5912},
    {name:'Los Molinos, Envigado', lat:6.1765, lon:-75.5736},
    {name:'Mayorca, Sabaneta', lat:6.1512, lon:-75.6145},
    {name:'Viva Envigado, Envigado', lat:6.1745, lon:-75.5891},
    {name:'Gran Plaza, Bello', lat:6.3368, lon:-75.5612},
    {name:'Jardín Plaza, Itagüí', lat:6.1845, lon:-75.5965},
    {name:'Aquarium, El Poblado, Medellín', lat:6.2098, lon:-75.5688},
    {name:'Manhattan, Laureles, Medellín', lat:6.2445, lon:-75.5945},
    {name:'Bello Centro, Bello', lat:6.3385, lon:-75.5598},
    {name:'Centro Comercial Premium Plaza, Medellín', lat:6.2512, lon:-75.5698},
    {name:'Unicentro, Medellín', lat:6.2745, lon:-75.5612},
  ];

  function searchLocalLandmarks(q){
    var ql = q.toLowerCase().replace(/[^a-záéíóúñ0-9 ]/g,'');
    return LOCAL_LANDMARKS.filter(function(l){
      return l.name.toLowerCase().includes(ql);
    }).map(function(l){
      return {lat:l.lat, lon:l.lon, display_name:l.name, place_id:'local_'+l.name};
    });
  }

  function fetchSuggestions(q){
    var headers = { 'Accept-Language':'es', 'User-Agent':'MichailBarberApp/1.0' };

    // Check local landmarks first for instant results
    var localHits = searchLocalLandmarks(q);

    // Tier 1: bounded to Medellín viewbox
    var urlBounded = 'https://nominatim.openstreetmap.org/search'
      + '?q=' + encodeURIComponent(q)
      + '&format=json&countrycodes=co&limit=8'
      + '&viewbox=' + VIEWBOX + '&bounded=1'
      + '&addressdetails=1&accept-language=es';

    // Tier 2: with "Medellín" appended, not bounded
    var urlMed = 'https://nominatim.openstreetmap.org/search'
      + '?q=' + encodeURIComponent(q + ' Medellín')
      + '&format=json&countrycodes=co&limit=5'
      + '&addressdetails=1&accept-language=es';

    // Tier 3: anywhere in Colombia, no restriction
    var urlCO = 'https://nominatim.openstreetmap.org/search'
      + '?q=' + encodeURIComponent(q)
      + '&format=json&countrycodes=co&limit=5'
      + '&addressdetails=1&accept-language=es';

    function dedup(arr){
      var seen = {};
      return arr.filter(function(r){
        if(seen[r.place_id]) return false;
        seen[r.place_id] = true; return true;
      });
    }

    fetch(urlBounded, {headers:headers})
      .then(function(r){ return r.json(); })
      .then(function(r1){
        // Combine local landmarks + Nominatim bounded results
        var combined = dedup(localHits.concat(r1||[]));
        if(combined.length >= 2){ renderItems(combined.slice(0,5)); return; }

        // Tier 2: try with "Medellín" appended
        return fetch(urlMed, {headers:headers})
          .then(function(r){ return r.json(); })
          .then(function(r2){
            combined = dedup(combined.concat(r2||[]));
            if(combined.length >= 1){ renderItems(combined.slice(0,5)); return; }

            // Tier 3: anything in Colombia
            return fetch(urlCO, {headers:headers})
              .then(function(r){ return r.json(); })
              .then(function(r3){
                combined = dedup(combined.concat(r3||[]));
                renderItems(combined.slice(0,5));
              });
          });
      })
      .catch(function(){
        // If Nominatim fails, show local results only
        if(localHits.length) renderItems(localHits.slice(0,5));
        else closeDropdown();
      });
  }

  input.addEventListener('input', function(){
    clearTimeout(debounceTimer);
    // Reset coords when user types manually — must re-select from dropdown
    window.bookLat = null;
    window.bookLng = null;
    var q = input.value.trim();
    if(q.length < 3){ closeDropdown(); return; }
    debounceTimer = setTimeout(function(){ fetchSuggestions(q); }, 400);
  });

  // Keyboard navigation
  input.addEventListener('keydown', function(e){
    var items = dropdown.querySelectorAll('.addr-item');
    if(!items.length) return;
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      activeIdx = Math.min(activeIdx+1, items.length-1);
      items.forEach(function(el,i){ el.classList.toggle('active', i===activeIdx); });
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      activeIdx = Math.max(activeIdx-1, 0);
      items.forEach(function(el,i){ el.classList.toggle('active', i===activeIdx); });
    } else if(e.key === 'Enter' && activeIdx >= 0){
      e.preventDefault();
      items[activeIdx].dispatchEvent(new MouseEvent('mousedown'));
    } else if(e.key === 'Escape'){
      closeDropdown();
    }
  });

  // Close on outside click
  document.addEventListener('click', function(e){
    if(!input.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
  });
})();

// ─── BOOKING SUBMIT ───
function submitBooking(){
  if(isCalClosed()){alert('Calendar is closed. Please contact via WhatsApp.');return;}
  const fn=document.getElementById('firstName').value.trim();
  const ln=document.getElementById('lastName').value.trim();
  const em=document.getElementById('bookEmail').value.trim();
  const ph=document.getElementById('bookPhone').value.trim();
  const svcId=document.getElementById('serviceSelect').value;
  const addr=document.getElementById('bookAddr').value.trim();
  const apt=document.getElementById('bookApt')?.value?.trim()||'';
  const fullAddr=apt?addr+', '+apt:addr;
  const rc=document.getElementById('refCode').value.trim().toUpperCase();
  if(!fn||!em||!ph){alert('Please fill name, email and phone.');return;}
  if(!selDate){alert('Please select a date.');return;}
  if(!selTime){alert('Please select a time.');return;}
  if(!addr){alert('Por favor ingresa tu dirección.');return;}
  // Validate that user picked from dropdown (has coordinates)
  // If no coords, show warning but allow continue (manual address still accepted)
  var hasCoords = window.bookLat && window.bookLng;
  if(!hasCoords){
    // Check if what they typed looks like just a name (< 5 chars or no street keywords)
    var looksLikeJustName = addr.length < 8 || (!addr.match(/\d/) && !addr.toLowerCase().match(/calle|carrera|cra|cll|avenida|av\.|transversal|diagonal|edificio|torre|apto|bl|barrio/i));
    if(looksLikeJustName){
      var ok = confirm('La dirección "'+addr+'" es muy corta o no tiene número.\n\nTe recomendamos seleccionar una sugerencia del dropdown para mayor precisión.\n\n¿Continuar de todas formas?');
      if(!ok) return;
    }
  }
  if(!selPay){alert('Please select a payment method.');return;}
  const svc=getServices().find(s=>s.id===svcId)||getServices()[0];
  const sc=getSurcharge(selTime.split(':')[0],svc.price);
  let unitPrice=sc.price; let total=unitPrice*selGroup; let discPct=0;
  let affCode=null;
  if(rc){
    const u=getUsers().find(u=>u.code===rc);
    const a=getAffs().find(a=>a.code===rc);
    if(u){ if(!currentUser){discPct=10;total=Math.round(total*0.9);}else{alert('Referral codes are only valid for new accounts.');return;} }
    if(a) affCode=rc;
  }
  const b={id:Date.now().toString(),name:`${fn} ${ln}`.trim(),email:em,phone:ph,service:svcId,serviceName:svc.name,date:selDate,time:selTime,groupSize:selGroup,address:fullAddr||addr,refCode:rc,affiliateCode:affCode,payment:selPay,status:'pending',paymentStatus: (selPay==='card')?'pending':'cash',source:'web',price:window._couponFinalPrice||total,originalPrice:total,couponCode:window._activeCoupon?window._activeCoupon.code:null,couponDiscount:window._couponDiscount||0,discPct,createdAt:new Date().toISOString()};
  allBookings.push(b); curBookingData=b;
  // Persist to DB (non-blocking — UI responds immediately)
  API.saveBooking(b).then(ok=>{ if(!ok) console.warn('Booking not synced to DB, id='+b.id); }).catch(console.error);
  let boldSection = '';
  if(selPay==='card'){
    boldSection = '\n\nTo pay by card, a payment link will be sent to your WhatsApp.';
    // Load Bold button dynamically to avoid script tag conflict
    setTimeout(()=>{
      const container = document.getElementById('boldButtonContainer');
      const boldBtn = document.getElementById('boldPayBtn');
      if(container && boldBtn){
        boldBtn.style.display='block';
        container.innerHTML = '';
        const s = document.createElement('script');
        s.setAttribute('data-bold-button','');
        s.setAttribute('data-api-key','zrs_Cb7UZlY8IGHGelNqnwITn3w15pGarebA_6cfWKo');
        s.setAttribute('data-currency','COP');
        s.setAttribute('data-amount', String(total));
        s.setAttribute('data-render-mode','embedded');
        s.src = 'https://checkout.bold.co/library/boldPaymentButton.js';
        container.appendChild(s);
      }
    }, 400);
  }
  var boldSec = document.getElementById('boldPaySection');
  var boldBtn2 = document.getElementById('boldPayNowBtn');
  if(boldSec && boldBtn2){
    if(selPay==='card'){
      boldSec.style.display='block';
      boldBtn2.onclick = function(){
        closeModal('confirmModal');
        payWithBold(b.id, b.price, b.serviceName||b.service);
      };
    } else { boldSec.style.display='none'; }
  }
  document.getElementById('confirmBody').textContent=`${b.name}\n${svc.name}${selGroup>1?' × '+selGroup:''}\n${selDate} at ${selTime}\n${addr}\nPayment: ${selPay.toUpperCase()}\nTotal: ${fmtP(total)}${discPct>0?' ('+discPct+'% discount)':''}${boldSection}\n\nPending confirmation. You'll hear back via WhatsApp shortly.`;
  // Show Bold pay button if card/link selected
  const boldBtn = document.getElementById('boldPayBtn');
  if(boldBtn){
    if(selPay==='card'){
      boldBtn.style.display='block';
      boldBtn.setAttribute('data-amount', total);
      boldBtn.setAttribute('data-order', b.id);
      boldBtn.setAttribute('data-email', em);
    } else {
      boldBtn.style.display='none';
    }
  }
  if (b.payment === 'transfer') {
    document.getElementById('tmBankName').textContent = BANK_NAME;
    document.getElementById('tmAccount').textContent = BANK_ACCOUNT;
    document.getElementById('tmType').textContent = BANK_TYPE;
    document.getElementById('tmHolder').textContent = BANK_HOLDER;
    document.getElementById('tmNequi').textContent = BANK_NEQUI;
    openModal('transferModal');
  } else {
    openModal('confirmModal');
  }
  selDate=null;selTime=null;selGroup=1;selPay=null;
  renderCal(); document.getElementById('timeSlotsWrap').style.display='none'; document.getElementById('pricePreview').classList.remove('show');
  document.querySelectorAll('.grp-btn').forEach((b,i)=>b.classList.toggle('selected',i===0));
  document.querySelectorAll('.pay-option').forEach(o=>o.classList.remove('selected'));
}
function addToCalendar(){
  if(!curBookingData) return;
  const {date,time,serviceName,address,groupSize}=curBookingData;
  const endH=String(parseInt(time)+Math.max(1,groupSize||1)).padStart(2,'0');
  const s=(date+'T'+time+':00').replace(/[-:]/g,'');
  const e=(date+'T'+endH+':'+time.split(':')[1]+':00').replace(/[-:]/g,'');
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Barber - '+serviceName)}&dates=${s}/${e}&location=${encodeURIComponent(address)}&details=${encodeURIComponent('Mobile barber with Michail González')}`, '_blank');
}
