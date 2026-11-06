# Working on Sendero Japanese (guide for AI assistants)

Sendero Japanese is a Japanese course for one adult English speaker who reads Chinese (standard Tokyo Japanese, starting from zero, aiming for 1–2 hours of study a day). It is the sister of [sendero-spanish](https://github.com/n0tm1k3/sendero-spanish) and shares its engine. Everything is in `index.html`: content, styles and logic, no build step. Read this file before changing anything.

## Ground rules

1. **Don't break saved progress.** Progress is stored by card id (`S.cards['gakusei:r']`). Never rename or delete an item id, never reuse one, and never change a unit's `n`. To retire an item, leave it in place. New units go at the end of `UNITS` with `n` equal to their position.
2. **Every mechanic needs a reason.** The course is built on published research; the Method tab lists the sources (`REFS`). If you add or change a mechanic, add an entry with a real, working link, or say in your PR that the evidence is thin.
3. **Japanese must be correct.** Standard (Tokyo) Japanese, polite style first. Readings, okurigana and particles matter. If you're not sure of a reading, a form or a usage, leave it out. Claims about Chinese (same meaning, false friend) must hold for modern Mandarin.
4. **Every kanji gets a reading.** Write Japanese with the reading in brackets after each kanji run: `学生[がくせい]`, `食[た]べます`. The page builds furigana and the kana answer from this. `node tools/check.js` fails on a kanji without a reading.
5. **Small, reviewable changes.** One idea per pull request. Describe what changed for the learner, not just the code.
6. **Keep it one file.** No frameworks, no build tools, no external scripts. Fonts come from Google Fonts; everything else is inline.
7. **Run the checks** (below) before you open a PR.

## How the page is organised (`index.html`)

| Section (search for the comment) | What it holds |
|---|---|
| `Sendero curriculum content` | Helpers (`K`, `W`, `V`, `A`, `C`, `P`, `M`, `D`), then `UNITS`: each unit has `id`, `n`, `title`, `ja`, `why`, `lesson` notes, optional `gram` (particles and grammar words that count as known once the lesson is seen) and `items`. Then `ROADMAP` and `STORIES`. |
| `FSRS` | The spaced-repetition scheduler (FSRS-6 default weights). |
| `text normalisation` | `toKana` (romaji → kana, IME-style), `normJa` (compare by sound), `checkJa` (grading with “close” for length, voicing and small-kana slips), `checkRoma`, `checkEnglish`. |
| `Voice` | Plays clips from `audio-ja.json` if present, otherwise the device's Japanese voice. |
| `registry` / `state` | Turns items into cards; the saved state `S` and `migrate()`. |
| `learning model` / `buildSession` | Picks reviews and new cards, adapts difficulty toward ~85% accuracy. |
| `daily plan` | Minutes per activity, phases, listening log and resources. |
| `reading` / `Claude:` | Story tokens, coverage, tap-to-gloss, today's story, word lookups, writing feedback. |
| `play` | The daily grouping puzzle (`CATS`) and the 60-second speed round. |
| `speak & write` | Shadowing rounds and writing prompts (`WRITE_PROMPTS`). |
| `views`, `session`, `events` | Rendering, click handling, live romaji → kana in answer boxes. |

### Item kinds

```js
K(id, 'あ', ['a'], '安', tip)                                   // kana: one card, type the romaji (list every accepted spelling)
W(id, '学生[がくせい]', ['student'], { same, ff, zh, note, ex: [ja, en], forms, alt })  // word: Japanese→English, English→Japanese, and a kanji-reading card if it has kanji
V(id, '食[た]べる', 'ru', ['eat'], {...})                        // verb from its dictionary form; group 'u' | 'ru' | 'kuru' | 'suru'. Shown as the ます form; forms are generated
A(id, '高[たか]い', 'i', ['expensive'], {...})                   // adjective, 'i' or 'na'; forms are generated
C(id, '私[わたし]は 学生[がくせい]___。', ['です'], en, hint, why)  // cloze: answers in kana
P(id, sentence, options, index, en, why)                         // structured input: choose the meaning (TENSE for verb-ending questions)
M(id, question, options, index, why, say)                        // multiple choice; add { demo: [...], listen: true } for sound contrasts
D(id, '今[いま] 何時[なんじ]ですか。', 'What time is it now?')        // dictation: hear it, type it
```

Word options: `same: true` marks a word with the same meaning in Chinese; `ff` is a false-friend warning; `zh` is a note for Chinese readers.

`forms` are the surface strings a story token is matched on (`tok()`: no brackets, no spaces). Stories (`STORIES`) separate tokens with spaces (`ケンさん は 毎日[まいにち] …`), keep a verb or adjective with its ending as one token, and take `after` (unit number), `free` (names) and `gl` (glosses for the few words not taught yet). Aim for at least 95% known words at the unit the story unlocks.

### Runs in two places

- **On claude.ai** (the published artifact): progress syncs to the learner's account (`db` + `user` capabilities), and Claude writes the daily story and writing feedback (`sample` capability), all through `window.claude.use(...)`.
- **Anywhere else** (a local server, GitHub Pages, the installed offline app): `window.claude` is missing, so progress stays in the browser's localStorage (`sendero-ja-v1`) and the Claude features show a message instead. Keep both paths working.
- **Progress files** (`mergeState`) move progress between copies. If you add a field to `S`, add it to `DEFAULT()` and decide how `mergeState` combines it.

## Checks

```bash
node tools/check.js          # ids, unit numbering, readings on every kanji, story coverage, romaji and grading tests, verb forms
node tools/smoke.js          # browser test of every tab; needs Playwright
```

Open the page locally with `python3 -m http.server` and go to http://localhost:8000.

## Open work

- **Neural audio.** The Spanish course ships Kokoro clips (see its `tools/gen_audio.py`). Kokoro has Japanese voices (`jf_alpha`, `jm_kumo`, `jf_tebukuro`) but needs a Japanese phonemizer (misaki with pyopenjtalk). Generate `audio-ja.json` keyed `voice|text` with `tools/content.js texts`, add it to `AUDIO` in `sw.js`, and bump `VERSION`.
- **Pitch accent marks** on words, once there's a reliable source for each word's accent.
- **Icons** are still the Spanish ones.

## Getting changes into the live app

The learner uses the copy published on claude.ai. After a change is merged here, the owner asks Claude to publish the repo's `index.html` to the Sendero Japanese artifact. Don't try to publish it yourself.
