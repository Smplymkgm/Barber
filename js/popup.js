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
    console.log('DB initialized: ' + allBookings.length + ' bookings loaded');
  } catch(e){
    console.log('DB init failed, using localStorage cache:', e.message);
    if(!allBookings.length) allBookings = DB.get('bookings', []);
  }
}

