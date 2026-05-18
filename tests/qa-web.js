// QA Test: Public page
// Run with: node tests/qa-web.js
// Requires: npx serve . running on localhost:3000

const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  const BASE = 'http://localhost:3000';
  const results = [];

  function test(name, passed, detail) {
    const icon = passed ? '✅' : '❌';
    results.push({ name, passed, detail });
    console.log(`${icon} ${name}${detail ? ': ' + detail : ''}`);
  }

  try {
    // 1. Page loads
    const page = await fetch(BASE);
    test('Page loads (200)', page.status === 200);

    const html = page.body;

    // 2. Key content
    test('González present', html.includes('González'));
    test('BOOK NOW button (popup)', html.includes('openBookingPopup()'));
    test('Services section', html.includes('id="services"'));
    test('Subscription section', html.includes('id="subscription"'));
    test('Booking section', html.includes('id="booking"'));

    // 3. External files linked
    test('CSS external', html.includes('css/main.css'));
    test('JS files external', html.includes('js/config.js'));
    test('No inline script block', !html.includes('<script>'));
    test('No inline style block', !html.includes('<style>'));

    // 4. Modals present
    test('Booking popup modal', html.includes('id="bookingPopupModal"'));
    test('Promo popup', html.includes('id="promoPopupOverlay"'));

    // 5. CSS loads
    const css = await fetch(BASE + '/css/main.css');
    test('CSS file loads', css.status === 200);
    test('CSS has booking popup styles', css.body.includes('bookingPopupModal'));

    // 6. JS files load
    const jsFiles = ['config', 'api', 'db', 'state', 'auth', 'admin', 'core', 'popup'];
    for (const f of jsFiles) {
      const r = await fetch(`${BASE}/js/${f}.js`);
      test(`js/${f}.js loads`, r.status === 200, `${Math.round(r.body.length/1024)}KB`);
    }

    // 7. Key functions in JS
    const core = await fetch(BASE + '/js/core.js');
    test('submitBooking defined', core.body.includes('function submitBooking'));
    test('renderCal defined', core.body.includes('function renderCal'));
    test('8am-8pm slots', core.body.includes('for(let hr=8;hr<=20'));
    test('No old 5am slots', !core.body.includes("'05:00'"));

    const popup = await fetch(BASE + '/js/popup.js');
    test('openBookingPopup defined', popup.body.includes('function openBookingPopup'));
    test('buildPromoPopupPage defined', popup.body.includes('function buildPromoPopupPage'));

    const admin = await fetch(BASE + '/js/admin.js');
    test('showAdminPage defined', admin.body.includes('showAdminPage') || core.body.includes('showAdminPage'));

  } catch(e) {
    console.log('❌ ERROR:', e.message);
    console.log('   Make sure server is running: npx serve . --listen 3000');
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Result: ${passed}/${total} tests passed`);
  if (passed < total) {
    console.log('\nFailed:');
    results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.name}`));
  }
  process.exit(passed === total ? 0 : 1);
}

run();
