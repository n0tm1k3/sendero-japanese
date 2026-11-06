// Loads the course data and the pure text functions out of index.html so tools can inspect them.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(file = path.join(__dirname, '..', 'index.html')) {
  const s = fs.readFileSync(file, 'utf8');
  const a = s.indexOf('const KANJI_RE = ');
  const b = s.indexOf('// module.exports = { FSRS');
  if (a < 0 || b < 0) throw new Error('Could not find the content block in index.html');
  const ctx = {};
  vm.runInNewContext(s.slice(a, b) + '\nthis.out = { UNITS, STORIES, ROADMAP, surf, yomi, tok, toKana, normJa, checkJa, checkRoma, checkEnglish, KANJI_RE };', ctx);
  return ctx.out;
}

// Same key the page uses to look up an audio clip.
const audioKey = (t, surf) => surf(t).replace(/[…→↓〜~]/g, '').replace(/\s*\/\s*/g, '、').replace(/\s+/g, '').trim();

// Every Japanese text the page can play.
function texts(C) {
  const out = new Set(); const add = t => { if (t) out.add(audioKey(t, C.surf)); };
  C.UNITS.forEach(u => u.items.forEach(it => {
    if (it.kind === 'w' || it.kind === 'kana') { add(it.ja); if (it.ex) add(it.ex[0]); }
    if (it.kind === 'd') add(it.say);
    if (it.kind === 'c') add(it.q.replace('___', it.a[0]));
    if (it.kind === 'pi') add(it.q);
    if (it.kind === 'mc') { if (it.say) add(it.say); (it.demo || []).forEach(add); }
  }));
  C.STORIES.forEach(s => add(s.text));
  return [...out];
}

module.exports = { load, texts, audioKey };
if (require.main === module && process.argv[2] === 'texts') console.log(JSON.stringify(texts(load())));
