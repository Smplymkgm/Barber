function buildContentPage(){
  var cfg = DB.get('siteContent', {});
  var fields = [
    {key:'heroTitle', label:'Hero - Nombre', placeholder:'MICHAIL'},
    {key:'heroSubtitle', label:'Hero - Subtítulo', placeholder:'Mobile Barber · Medellín'},
    {key:'heroCta', label:'Botón BOOK NOW', placeholder:'BOOK NOW'},
    {key:'service1Name', label:'Servicio 1 - Nombre', placeholder:'Haircut'},
    {key:'service1Desc', label:'Servicio 1 - Descripción', placeholder:'Fade, taper, classic'},
    {key:'service1Price', label:'Servicio 1 - Precio COP', placeholder:'150000'},
    {key:'service2Name', label:'Servicio 2 - Nombre', placeholder:'Haircut + Beard'},
    {key:'service2Price', label:'Servicio 2 - Precio COP', placeholder:'180000'},
    {key:'service3Name', label:'Servicio 3 - Nombre', placeholder:'Beard Only'},
    {key:'service3Price', label:'Servicio 3 - Precio COP', placeholder:'100000'},
    {key:'whatsapp', label:'WhatsApp (números)', placeholder:'573001234567'},
    {key:'instagram', label:'Instagram URL', placeholder:'https://www.instagram.com/...'},
    {key:'marqueeText', label:'Marquee texto', placeholder:'Mobile Barber · Medellín · El Poblado'},
  ];
  var h = '<div class="admin-section-title">Contenido del Sitio</div>';
  h += '<p style="font-size:12px;color:var(--gray);margin-bottom:16px;line-height:1.6;">Edita los textos principales.</p>';
  h += '<div class="admin-card"><div class="admin-card-inner">';
  fields.forEach(function(f){
    h += '<div class="form-group"><label class="form-label">'+f.label+'</label>';
    h += '<input type="text" id="content_'+f.key+'" class="form-input" placeholder="'+f.placeholder+'" value="'+(cfg[f.key]||'')+'"></div>';
  });
  h += '<div style="display:flex;gap:10px;">';
  h += '<button class="act-btn" onclick="saveContentSettings()">GUARDAR</button>';
  h += '</div></div></div>';
  return h;
}
function saveContentSettings(){
  var keys = ['heroTitle','heroSubtitle','heroCta','service1Name','service1Desc','service1Price','service2Name','service2Price','service3Name','service3Price','whatsapp','instagram','marqueeText'];
  var cfg = {};
  keys.forEach(function(k){ var el=document.getElementById('content_'+k); if(el) cfg[k]=el.value.trim(); });
  DB.set('siteContent', cfg);
  API.saveSetting('site_content', JSON.stringify(cfg)).catch(console.error);
  applyContentSettings(cfg);
  showToast('Contenido guardado ✓');
}
function applyContentSettings(cfg){
  if(!cfg) cfg = DB.get('siteContent', {});
  if(!cfg||!Object.keys(cfg).length) return;
  var heroTitle = document.querySelector('.hero-title');
  if(heroTitle && cfg.heroTitle) heroTitle.textContent = cfg.heroTitle;
  var heroCta = document.querySelector('.book-btn');
  if(heroCta && cfg.heroCta){ heroCta.textContent = cfg.heroCta; heroCta.setAttribute('data-en', cfg.heroCta); }
  if(cfg.marqueeText){
    document.querySelectorAll('.marquee-track').forEach(function(m){
      var items = cfg.marqueeText.split('·').map(function(t){ return '<span>'+t.trim()+'</span>'; }).join('<span class="marquee-dot">·</span>');
      m.innerHTML = items + items;
    });
  }
  if(cfg.whatsapp){
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function(a){
      a.href = 'https://wa.me/'+cfg.whatsapp.replace(/\D/g,'');
    });
  }
  if(cfg.instagram){
    document.querySelectorAll('a[href*="instagram"]').forEach(function(a){ a.href = cfg.instagram; });
  }
}

// ─── INIT: Load all data from DB on startup ───
async // === BOOKING POPUP ===
function openBookingPopup(prefillSvcId){
  const overlay=document.getElementById('bookingPopupModal');
  const inner=document.getElementById('bookingPopupInner');
  const src=document.getElementById('booking');

  // MOVE the real #booking section into the popup (no clone = no duplicate IDs)
  if(src&&inner){
    inner.innerHTML='';
    inner.appendChild(src);
  }

  overlay.classList.add('open');
  document.body.style.overflow='hidden';

  setTimeout(()=>{
    renderCal();
    if(typeof renderServicesSection==="function") renderServicesSection();
    if(prefillSvcId){
      const sel=document.getElementById('serviceSelect');
      if(sel){sel.value=prefillSvcId;if(typeof updatePricePreview==='function')updatePricePreview();}
    }
  },50);
}
function closeBookingPopup(){
  // Move #booking back to its original place in the page
  const overlay=document.getElementById('bookingPopupModal');
  const inner=document.getElementById('bookingPopupInner');
  const booking=document.getElementById('booking');
  const originalParent=document.getElementById('bookingAnchor');
  if(booking&&originalParent){
    originalParent.appendChild(booking);
  }
  overlay.classList.remove('open');
  document.body.style.overflow='';
}
// === PROMO POPUP ===
const DEFAULT_PROMO={enabled:false,text:'Oferta especial',ctaText:'APLICAR',code:'',bgColor:'#111111',bgOpacity:0.9,position:'center',durationSec:5};
function getPromoConfig(){return DB.get('promoPopup',DEFAULT_PROMO);}
function savePromoConfig(cfg){DB.set('promoPopup',cfg);}
function showPromoPopup(force){
  const cfg=getPromoConfig();
  if(!cfg.enabled) return;

  // Un solo uso por dispositivo — no mostrar si ya lo vio o ya usó el código
  // force=true solo desde el botón PREVIEW del admin
  if(!force){
    const seenKey = 'promoSeen_' + (cfg.code||'default');
    const alreadySeen = localStorage.getItem(seenKey);
    if(alreadySeen) return;

    // Tampoco mostrar si el usuario tiene sesión activa (ya es cliente)
    if(currentUser && !currentUser.isAdmin) return;
  }

  const overlay=document.getElementById('promoPopupOverlay');
  if(!overlay)return;
  document.getElementById('promoPopupText').innerHTML=cfg.text||'';
  const cta=document.getElementById('promoPopupCta');
  cta.textContent=cfg.ctaText||'APLICAR';
  cta.setAttribute('data-code',cfg.code||'');
  const bg=document.getElementById('promoPopupBg');
  bg.style.background=cfg.bgColor||'#111';
  bg.style.opacity=cfg.bgOpacity!=null?cfg.bgOpacity:0.9;
  if(cfg.bgImage){bg.style.backgroundImage='url('+cfg.bgImage+')';bg.style.backgroundSize='cover';}
  overlay.style.alignItems=cfg.position==='bottom'?'flex-end':cfg.position==='top'?'flex-start':'center';
  overlay.style.display='flex';
  if(cfg.durationSec>0)setTimeout(closePromoPopup,cfg.durationSec*1000);

  // Mark as seen immediately so it doesn't show again on this device
  if(!force){
    const seenKey = 'promoSeen_' + (cfg.code||'default');
    localStorage.setItem(seenKey, '1');
  }
}
function closePromoPopup(){
  const o=document.getElementById('promoPopupOverlay');
  if(o)o.style.display='none';
}
function applyPromoCode(){
  const btn=document.getElementById('promoPopupCta');
  const code=btn?btn.getAttribute('data-code'):'';
  if(code){
    const inp=document.getElementById('couponInput');
    if(inp)inp.value=code;
    showToast('Código aplicado: '+code);
    // Mark as used — won't show again on this device
    const seenKey = 'promoSeen_' + code;
    localStorage.setItem(seenKey, 'used');
    closePromoPopup();
    const bp=document.getElementById('bookingPopupModal');
    if(!bp||!bp.classList.contains('open'))openBookingPopup();
  }
}
function buildPromoPopupPage(){
  const cfg=getPromoConfig();
  let h='<div class="admin-section-title">Promo Popup</div><div class="admin-card"><div class="admin-card-inner">';
  h+='<div class="form-group" style="display:flex;align-items:center;gap:12px"><label class="form-label" style="margin:0">Activar</label>';
  h+='<input type="checkbox" id="ppEnabled"'+(cfg.enabled?' checked':'')+'></div>';
  h+='<div class="form-group"><label class="form-label">Texto</label><textarea id="ppText" class="form-input" rows="3">'+(cfg.text||'')+'</textarea></div>';
  h+='<div class="form-group"><label class="form-label">Código de descuento</label><input type="text" id="ppCode" class="form-input" value="'+(cfg.code||'')+'"></div>';
  h+='<div class="form-group"><label class="form-label">Texto botón CTA</label><input type="text" id="ppCta" class="form-input" value="'+(cfg.ctaText||'APLICAR')+'"></div>';
  h+='<div style="display:flex;gap:12px">';
  h+='<div class="form-group" style="flex:1"><label class="form-label">Color fondo</label><input type="color" id="ppColor" class="form-input" value="'+(cfg.bgColor||'#111111')+'" style="height:44px;padding:4px"></div>';
  h+='<div class="form-group" style="flex:1"><label class="form-label">Opacidad (0-1)</label><input type="number" id="ppOpacity" class="form-input" min="0" max="1" step="0.05" value="'+(cfg.bgOpacity!=null?cfg.bgOpacity:0.9)+'"></div></div>';
  h+='<div class="form-group"><label class="form-label">URL imagen fondo</label><input type="text" id="ppBgImg" class="form-input" value="'+(cfg.bgImage||'')+'"></div>';
  h+='<div class="form-group"><label class="form-label">Posición</label><select id="ppPosition" class="form-select">';
  h+='<option value="center"'+(cfg.position==='center'?' selected':'')+'>Centro</option>';
  h+='<option value="bottom"'+(cfg.position==='bottom'?' selected':'')+'>Abajo</option>';
  h+='<option value="top"'+(cfg.position==='top'?' selected':'')+'>Arriba</option></select></div>';
  h+='<div class="form-group"><label class="form-label">Duración (segundos) — 0 = no se cierra solo</label><input type="number" id="ppDuration" class="form-input" min="0" max="3600" placeholder="5" value="'+(cfg.durationSec!=null?cfg.durationSec:5)+'"></div>';
  h+='<div style="display:flex;gap:10px"><button class="act-btn" onclick="savePromoSettings()">GUARDAR</button>';
  h+='<button class="act-btn" style="background:var(--gray)" onclick="previewPromoPopup()">PREVIEW</button>'
  +'<button class="act-btn" style="background:var(--gray)" onclick="resetPromoSeen()">RESETEAR VISTAS</button></div>';
  h+='</div></div>';
  return h;
}
function savePromoSettings(){
  const el=id=>document.getElementById(id)||{};
  savePromoConfig({
    enabled:!!el('ppEnabled').checked,
    text:el('ppText').value||'',
    code:el('ppCode').value||'',
    ctaText:el('ppCta').value||'APLICAR',
    bgColor:el('ppColor').value||'#111111',
    bgOpacity:parseFloat(el('ppOpacity').value)||0.9,
    bgImage:el('ppBgImg').value||'',
    position:el('ppPosition').value||'center',
    durationSec:el('ppDuration').value!==''?parseInt(el('ppDuration').value):5
  });
  showToast('Guardado ✓');
}

function resetPromoSeen(){
  // Clear all promoSeen keys so popup shows again to everyone on their next visit
  Object.keys(localStorage).filter(k=>k.startsWith('promoSeen_')).forEach(k=>localStorage.removeItem(k));
  showToast('Popup reseteado — se mostrará de nuevo a visitantes');
}
function previewPromoPopup(){
  savePromoSettings();
  const cfg=getPromoConfig();cfg.enabled=true;savePromoConfig(cfg);showPromoPopup(true);
}

async function initFromDB(){
  try {
    const [services, settings, bookings] = await Promise.all([
      API.getServices(), API.getSettings(), API.getBookings()
    ]);

    if(services && services.length){
      DB.set('services', services);
      renderServicesSection();
    }

    // Always sync from DB even when empty — stale localStorage bookings
    // can fill calendar dates as "full" and block user from selecting
    if(Array.isArray(bookings)){
      allBookings = bookings;
      DB.set('bookings', bookings);
    }

    if(settings.calendar_open !== undefined){
      DB.set('calClosed', settings.calendar_open !== 'true');
      refreshBanner();
    }
    if(settings.active_palette){
      applyPalette(settings.active_palette);
    }

    // Apply hero photo for all visitors (not just the admin who uploaded)
    if(settings.hero_photo && !DB.get('heroPhoto',null)){
      _applyHeroPhoto(settings.hero_photo);
    }

    renderCal();
    setTimeout(()=>{if(!currentUser?.isAdmin)showPromoPopup();},2000);
    applyContentSettings();
    renderReelsGrid();
    // Load reels config from DB
    API.getSettings && API.getSettings().then(function(s){ if(s&&s.reels_config){try{var cfg=JSON.parse(s.reels_config);saveReelsConfig(cfg);renderReelsGrid();}catch(e){}} }).catch(function(){});
    console.log('DB initialized: ' + allBookings.length + ' bookings loaded');
    // Hide page loader
    const loader = document.getElementById('pageLoader');
    if(loader){
      loader.classList.add('hidden');
      setTimeout(()=>loader.classList.add('gone'), 450);
    }
  } catch(e){
    console.log('DB init failed, using localStorage cache:', e.message);
    if(!allBookings.length) allBookings = DB.get('bookings', []);
    renderCal();
    applyContentSettings();
    renderReelsGrid();
  } finally {
    // Always hide the loader — even if DB failed
    const loader = document.getElementById('pageLoader');
    if(loader){
      loader.classList.add('hidden');
      setTimeout(()=>loader.classList.add('gone'), 450);
    }
  }
}


// ═══════════════════════════════════════
// REELS / INSTAGRAM GRID
// ═══════════════════════════════════════
var DEFAULT_REELS = {
  handle: 'michailgonzalez',
  count: 6,
  urls: ['','','','','','','','','']
};

function getReelsConfig(){ return DB.get('reelsConfig', DEFAULT_REELS); }
function saveReelsConfig(cfg){ DB.set('reelsConfig', cfg); API.saveSetting('reels_config', JSON.stringify(cfg)).catch(console.error); }

function getReelEmbedUrl(url){
  if(!url) return '';
  // Instagram reel: https://www.instagram.com/reel/XXXXX/
  var igReel = url.match(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/);
  if(igReel) return 'https://www.instagram.com/reel/'+igReel[1]+'/embed/';
  // Instagram post
  var igPost = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
  if(igPost) return 'https://www.instagram.com/p/'+igPost[1]+'/embed/';
  // YouTube short or video
  var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=))([A-Za-z0-9_-]{11})/);
  if(yt) return 'https://www.youtube.com/embed/'+yt[1]+'?autoplay=1&mute=1&loop=1&playlist='+yt[1]+'&controls=0';
  // TikTok
  var tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if(tt) return 'https://www.tiktok.com/embed/v2/'+tt[1];
  // Direct mp4
  if(url.match(/\.(mp4|webm|mov)(\?|$)/i)) return url;
  return '';
}

function renderReelsGrid(){
  var wrap = document.getElementById('reelsGridWrap');
  if(!wrap) return;
  var cfg = getReelsConfig();
  var count = Math.min(Math.max(cfg.count||6, 3), 9);
  // Force 3-col grid based on count
  wrap.style.gridTemplateColumns = 'repeat(3,1fr)';

  // Update follow link
  var link = document.getElementById('instaProfileLink');
  if(link && cfg.handle){
    link.href = 'https://www.instagram.com/'+cfg.handle.replace('@','');
    link.querySelector('span') ? link.querySelector('span').textContent = '@'+cfg.handle.replace('@','') : (link.lastChild.textContent = '@'+cfg.handle.replace('@',''));
  }

  var cells = '';
  for(var i=0; i<count; i++){
    var url = (cfg.urls||[])[i]||'';
    var embed = getReelEmbedUrl(url);
    if(embed){
      if(embed.match(/\.(mp4|webm|mov)(\?|$)/i)){
        cells += '<div class="reel-cell"><video src="'+embed+'" autoplay muted loop playsinline></video></div>';
      } else {
        cells += '<div class="reel-cell"><iframe src="'+embed+'" frameborder="0" allowfullscreen allow="autoplay; fullscreen" loading="lazy" scrolling="no"></iframe></div>';
      }
    } else {
      cells += '<div class="reel-cell empty">+'+(i+1)+'<br>add reel</div>';
    }
  }
  wrap.innerHTML = cells;
}

function buildReelsAdminPage(){
  var cfg = getReelsConfig();
  var count = Math.min(Math.max(cfg.count||6, 3), 9);
  var h = '<div class="admin-section-title">Instagram / Reels Grid</div>';
  h += '<div class="admin-card"><div class="admin-card-inner">';
  h += '<div class="form-group"><label class="form-label">Handle de Instagram</label>';
  h += '<input type="text" id="reelsHandle" class="form-input" placeholder="michailgonzalez" value="'+(cfg.handle||'')+'" style="max-width:200px"></div>';
  h += '<div class="form-group"><label class="form-label">Número de videos (3, 6 o 9)</label>';
  h += '<div style="display:flex;gap:10px">';
  [3,6,9].forEach(function(n){
    h += '<button class="act-btn'+(count===n?' selected':'')+'" style="'+(count===n?'background:var(--accent);color:#000;':'background:var(--off);')+'" onclick="setReelCount('+n+',this)">'+n+'</button>';
  });
  h += '</div></div>';
  h += '<div class="form-group"><label class="form-label">URLs de Reels (pega el link de Instagram)</label>';
  for(var i=0; i<9; i++){
    h += '<div class="reel-editor-row" style="'+(i>=count?'opacity:0.3;':'')+'">';
    h += '<span class="reel-editor-num">'+(i+1)+'</span>';
    h += '<input type="text" id="reelUrl'+i+'" class="form-input" placeholder="https://www.instagram.com/reel/..." value="'+((cfg.urls||[])[i]||'')+'">';
    if((cfg.urls||[])[i]) h += '<button onclick="clearReel('+i+')" style="background:none;border:none;color:var(--gray);cursor:pointer;font-size:16px;">✕</button>';
    h += '</div>';
  }
  h += '</div>';
  h += '<div style="display:flex;gap:10px">';
  h += '<button class="act-btn" onclick="saveReelsSettings()">GUARDAR</button>';
  h += '<button class="act-btn" style="background:var(--gray)" onclick="previewReels()">PREVIEW</button>';
  h += '</div></div></div>';
  return h;
}

function setReelCount(n, btn){
  document.querySelectorAll('#adminAppBody .act-btn').forEach(function(b){
    if(['3','6','9'].includes(b.textContent)){
      b.style.background='var(--off)'; b.style.color='';
    }
  });
  btn.style.background='var(--accent)'; btn.style.color='#000';
  btn.setAttribute('data-count', n);
  // Show/hide rows
  for(var i=0; i<9; i++){
    var row = document.querySelector('.reel-editor-row:nth-child('+(i+1)+')');
    if(row) row.style.opacity = i<n ? '1' : '0.3';
  }
  window._reelCount = n;
}

function clearReel(i){
  var inp = document.getElementById('reelUrl'+i);
  if(inp) inp.value = '';
}

function saveReelsSettings(){
  var urls = [];
  for(var i=0; i<9; i++){
    var el = document.getElementById('reelUrl'+i);
    urls.push(el ? el.value.trim() : '');
  }
  var handle = (document.getElementById('reelsHandle')||{}).value||'';
  var count = window._reelCount || Math.min(Math.max(parseInt(document.querySelector('[data-count]')?.getAttribute('data-count')||'6'),3),9);
  var cfg = {handle:handle, count:count, urls:urls};
  saveReelsConfig(cfg);
  renderReelsGrid();
  showToast('Reels guardados ✓');
}

function previewReels(){
  saveReelsSettings();
  var sec = document.getElementById('instaGrid');
  if(sec) sec.scrollIntoView({behavior:'smooth'});
}

// Initialize app
initFromDB();

// Safety net: if loader still visible after 6s, force hide it
setTimeout(function(){
  const loader = document.getElementById('pageLoader');
  if(loader && !loader.classList.contains('hidden')){
    console.warn('Loader timeout - forcing hide');
    loader.classList.add('hidden');
    setTimeout(()=>loader.classList.add('gone'), 450);
  }
}, 6000);
