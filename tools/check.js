// Content checks. Run: node tools/check.js
// - duplicate item ids (ids are the keys of saved progress, so they must be unique and never renamed)
// - unit numbers must equal their position in UNITS
// - every kanji has a reading in brackets, so furigana and answer checking work
// - malformed cloze / choice items
// - graded stories: share of words known by the time the story unlocks (target >= 95%)
// - the romaji converter and the answer checker on known cases
const { load } = require('./content');
const C = load();
const { UNITS, STORIES, surf, yomi, tok, toKana, checkJa, KANJI_RE } = C;
let problems = 0;
const fail = m => { problems++; console.log('PROBLEM:', m); };
const needsReading = (where, t) => { if (t && KANJI_RE.test(yomi(t))) fail(`${where}: kanji without a [reading] in “${t}”`); };

const ids = new Set();
UNITS.forEach((u, i) => {
  if (u.n !== i) fail(`unit ${u.id} has n=${u.n} but sits at position ${i}`);
  needsReading(u.id + ' title', u.ja);
  u.items.forEach(it => {
    if (ids.has(it.id)) fail(`duplicate item id ${it.id}`);
    ids.add(it.id);
    if (it.kind === 'c' && !it.q.includes('___')) fail(`cloze ${it.id} has no ___ gap`);
    if ((it.kind === 'mc' || it.kind === 'pi') && !(it.a >= 0 && it.a < it.opts.length)) fail(`${it.id} answer index out of range`);
    if (it.kind === 'w' && !(it.en && it.en.length)) fail(`${it.id} has no English meanings`);
    [it.ja, it.q, it.say, it.ex && it.ex[0], ...(it.demo || [])].forEach(t => it.kind !== 'kana' && it.kind !== 'mc' && needsReading(it.id, t));
    if (it.kind === 'mc') [it.say, ...(it.demo || [])].forEach(t => needsReading(it.id, t));
    if (it.kind === 'c') it.a.forEach(a => { if (KANJI_RE.test(a)) fail(`${it.id}: cloze answers should be kana`); });
  });
});
console.log(`${UNITS.length} units, ${ids.size} items`);

const PUNCT = /^[。、！？!?「」『』…・（）()〜ー\s]+$/;
STORIES.forEach(st => {
  needsReading(st.id, st.text); needsReading(st.id, st.title);
  const known = new Set(st.free || []);
  UNITS.filter(u => u.n <= st.after).forEach(u => { u.items.forEach(it => (it.forms || []).forEach(f => known.add(f))); Object.keys(u.gram || {}).forEach(k => known.add(k)); });
  const toks = st.text.trim().split(/\s+/).map(tok).filter(t => t && !PUNCT.test(t));
  const unk = toks.filter(t => !known.has(t));
  const pct = 100 * (1 - unk.length / toks.length);
  const nogl = [...new Set(unk)].filter(t => !(st.gl || {})[t]);
  if (nogl.length) fail(`${st.id}: unknown words without a gloss: ${nogl.join(' ')}`);
  console.log(`${st.id} (after unit ${st.after}): ${pct.toFixed(1)}% known${unk.length ? ' · glossed: ' + [...new Set(unk)].join(' ') : ''}`);
  if (pct < 90) fail(`${st.id} is below 90% known words`);
});

// Romaji → kana
[['konnichiha', 'こんにちは'], ['kitte', 'きって'], ['shinbun', 'しんぶん'], ["kon'ya", 'こんや'], ['konnya', 'こんにゃ'], ['honn', 'ほん'], ['hon', 'ほん'], ['gakkou', 'がっこう'],
 ['matcha', 'まっちゃ'], ['ko-hi-', 'こーひー'], ['tabemasu', 'たべます'], ['ryokou', 'りょこう'], ['jitensha', 'じてんしゃ'], ['tsukue', 'つくえ'], ['onna', 'おんな'], ['kin\'en', 'きんえん'], ['sanpo', 'さんぽ']]
  .forEach(([r, k]) => { const g = toKana(r); if (g !== k) fail(`toKana(${r}) = ${g}, expected ${k}`); });
// Answer checking
const grade = (input, ans) => checkJa(toKana(input), ans).grade;
[['koohii', ['コーヒー'], 'right'], ['ko-hi-', ['コーヒー'], 'right'], ['kohi', ['コーヒー'], 'close'], ['gakusei', ['学生[がくせい]'], 'right'],
 ['gakkusei', ['学生[がくせい]'], 'close'], ['takusei', ['学生[がくせい]'], 'wrong'], ['kite', ['切手[きって]'], 'close'], ['konnichiwa', ['こんにちは'], 'right'],
 ['wa', ['は'], 'wrong'], ['dakusei', ['学生[がくせい]'], 'wrong'], ['tokei', ['時計[とけい]'], 'right'], ['dokei', ['時計[とけい]'], 'close'], ['biyouin', ['病院[びょういん]'], 'close'],
 ['学生', ['学生[がくせい]'], 'right'], ['tabemasu', ['食[た]べます'], 'right']]
  .forEach(([i, a, want]) => { const g = grade(i, a); if (g !== want) fail(`checkJa(${i} vs ${a}) = ${g}, expected ${want}`); });
// Verb forms
const V = Object.fromEntries(UNITS.flatMap(u => u.items).filter(it => it.conj).map(it => [it.id, it.conj]));
[['iku', 'te', '行[い]って'], ['kuru', 'masu', '来[き]ます'], ['kuru', 'te', '来[き]て'], ['yomu', 'te', '読[よ]んで'], ['kaku', 'te', '書[か]いて'], ['hanasu', 'te', '話[はな]して'],
 ['matsu', 'masu', '待[ま]ちます'], ['benkyou', 'masu', '勉強[べんきょう]します'], ['taberu', 'te', '食[た]べて'], ['kau', 'te', '買[か]って'], ['kaeru', 'masu', '帰[かえ]ります']]
  .forEach(([id, f, want]) => { if (!V[id] || V[id][f] !== want) fail(`${id}.${f} = ${V[id] && V[id][f]}, expected ${want}`); });
console.log(problems ? `${problems} problem(s)` : 'All checks passed.');
process.exit(problems ? 1 : 0);
