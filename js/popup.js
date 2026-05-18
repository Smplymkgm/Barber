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
  if(src&&inner){
    inner.innerHTML='';
    const cl=src.cloneNode(true);
    cl.removeAttribute('id');
    inner.appendChild(cl);
  }
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>{
    renderCal();
    populateServiceSelect();
    if(prefillSvcId){
      const sel=document.getElementById('serviceSelect');
      if(sel){sel.value=prefillSvcId;if(typeof updatePricePreview==='function')updatePricePreview();}
    }
  },50);
}
function closeBookingPopup(){
  document.getElementById('bookingPopupModal').classList.remove('open');
  document.body.style.overflow='';
}
// === PROMO POPUP ===
const DEFAULT_PROMO={enabled:false,text:'Oferta especial',ctaText:'APLICAR',code:'',bgColor:'#111111',bgOpacity:0.9,position:'center',durationSec:5};
function getPromoConfig(){return DB.get('promoPopup',DEFAULT_PROMO);}
function savePromoConfig(cfg){DB.set('promoPopup',cfg);}
function showPromoPopup(){
  const cfg=getPromoConfig();
  if(!cfg.enabled)return;
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
    showToast('Código: '+code);
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
  h+='<div class="form-group"><label class="form-label">Duración seg (0=no cerrar)</label><input type="number" id="ppDuration" class="form-input" min="0" max="60" value="'+(cfg.durationSec!=null?cfg.durationSec:5)+'"></div>';
  h+='<div style="display:flex;gap:10px"><button class="act-btn" onclick="savePromoSettings()">GUARDAR</button>';
  h+='<button class="act-btn" style="background:var(--gray)" onclick="previewPromoPopup()">PREVIEW</button></div>';
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
    durationSec:parseInt(el('ppDuration').value)||5
  });
  showToast('Guardado ✓');
}
function previewPromoPopup(){
  savePromoSettings();
  const cfg=getPromoConfig();cfg.enabled=true;savePromoConfig(cfg);showPromoPopup();
}

function initFromDB(){
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
    console.log('DB initialized: ' + allBookings.length + ' bookings loaded');
  } catch(e){
    console.log('DB init failed, using localStorage cache:', e.message);
    if(!allBookings.length) allBookings = DB.get('bookings', []);
  }
}

