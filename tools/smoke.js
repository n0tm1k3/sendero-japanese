// Browser smoke test. Needs Playwright: npm i -D playwright && npx playwright install chromium
// Run: node tools/smoke.js            (screenshots go to tools/shots/, which git ignores)
// Serves the folder, opens the page with a stand-in for Claude, visits every tab, plays a few
// cards, the puzzle, the speed round, a daily story and writing feedback. Fails on any page error.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/json' });
  fs.createReadStream(f).pipe(res);
}).listen(0);

// Stand-in for claude.ai's runtime: no account storage, canned answers for Claude.
const MOCK = `window.claude = { use: async n => {
  if (n !== 'sample') return null;
  const f = async () => ({ text: 'ok' });
  f.json = async input => {
    if (input.includes('graded readings')) return { title: '駅[えき]の 弁当[べんとう]', country: 'Japan', text: '駅[えき] で 弁当[べんとう] を 買[か]います 。 弁当[べんとう] は おいしい です 。 電車[でんしゃ] で 食[た]べます 。', en: 'I buy a bento at the station. The bento is tasty. I eat it on the train.', new_words: [{ ja: '弁当[べんとう]', lemma: '弁当[べんとう]', en: 'boxed lunch' }], questions: [{ q: 'どこで 食べますか。', options: ['電車で', '家で'], answer: 0 }], note: 'Station bento are called ekiben.' };
    if (input.includes('dictionary form')) return { lemma: 'x', en: 'x' };
    if (input.includes('Japanese teacher')) return { corrected: '私[わたし]は カナダ人[じん]です。', changes: [{ from: 'わたしわ', to: '私[わたし]は', why: 'The topic particle is written は.' }], good: 'Nice.', next: 'Try も.' };
    return {};
  };
  return f;
} };`;

(async () => {
  const url = `http://localhost:${server.address().port}/`;
  const b = await chromium.launch(); const errs = [];
  for (const [name, vp, scheme] of [['desktop', { width: 1100, height: 900 }, 'light'], ['phone', { width: 390, height: 844 }, 'dark']]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: scheme });
    await ctx.addInitScript(MOCK);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(`${name}: ${e.message}`));
    await page.goto(url); await page.waitForTimeout(1500);
    for (const t of ['Today', 'Path', 'Read', 'Play', 'Speak & write', 'Garden', 'Method']) {
      await page.click(`.tabs button:has-text("${t}")`); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOTS, `${name}-${t.replace(/\W+/g, '')}.png`), fullPage: true });
    }
    if (name !== 'desktop') { await ctx.close(); continue; }
    // cards
    await page.click('.tabs button:has-text("Today")'); await page.click('[data-block="cards"]');
    for (let i = 0; i < 40; i++) {
      const nx = await page.$('#next'); if (nx) { await nx.click(); continue; }
      const opt = await page.$('[data-opt="0"]'); if (opt) { await opt.click(); continue; }
      const inp = await page.$('#ans-in'); if (inp) { await inp.type('a'); await page.keyboard.press('Enter'); }
    }
    await page.screenshot({ path: path.join(SHOTS, 'desktop-session.png'), fullPage: true });
    await page.click('#quit');
    // play
    await page.click('.tabs button:has-text("Play")');
    const tiles = await page.$$eval('.g-tile', els => els.map(e => e.dataset.tile));
    if (tiles.length === 16) { for (const id of tiles.slice(0, 4)) await page.click(`[data-tile="${id}"]`); await page.click('#g-submit'); }
    await page.click('#sprint-go'); for (let i = 0; i < 3; i++) await page.click('[data-sp="0"]');
    // read
    await page.click('.tabs button:has-text("Read")'); await page.click('#gen-story'); await page.waitForTimeout(500);
    await page.click('[data-dword="弁当[べんとう]"]'); await page.click('[data-save]');
    // write
    await page.click('.tabs button:has-text("Speak & write")'); await page.click('[data-prac="write"]');
    await page.click('#w-text'); await page.keyboard.type('watashiwa kanadajin desu.'); const wt = await page.inputValue('#w-text'); console.log('typed in write box:', wt); await page.click('#w-go'); await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'desktop-write.png'), fullPage: true });
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('sendero-ja-v1')));
    console.log(`cards started: ${Object.keys(st.cards).length}, saved words: ${st.mine.length}, writing entries: ${st.writing.length}`);
    await ctx.close();
  }
  await b.close(); server.close();
  if (errs.length) { console.log('PAGE ERRORS:\n' + errs.join('\n')); process.exit(1); }
  console.log('Smoke test passed. Screenshots in tools/shots/.');
})();
