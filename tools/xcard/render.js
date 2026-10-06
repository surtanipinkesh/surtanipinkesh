// Renders an X (Twitter) image card in the Papad Pixels style.
// usage: node render.js out.png '{"kicker":"AI News · 06 Oct 2026","headline":"...*gold words*...","sub":"...","source":"yahoo.com"}'
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const [out, json] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'card.html') + '#' + encodeURIComponent(json));
  await p.waitForSelector('body[data-ready="1"]');
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, type: out.endsWith('.jpg') ? 'jpeg' : 'png', quality: out.endsWith('.jpg') ? 92 : undefined });
  await b.close();
})();
