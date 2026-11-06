# Sendero Japanese

A Japanese course in a single web page, for an English speaker who reads Chinese. Built around what research says works: spaced retrieval, short explicit grammar in the order learners acquire it, graded reading, and a daily plan split across listening, reading, speaking, writing and focused study. Sister project of [Sendero Spanish](https://github.com/n0tm1k3/sendero-spanish).

It's a personal project. Suggestions and pull requests from people and AI assistants are welcome. Start with [AGENTS.md](AGENTS.md).

## What's in it

- **16 units** (A1, JLPT N5 territory): sounds and rhythm, hiragana and katakana (each kana shown with the kanji it came from), survival phrases, は and です, こ・そ・あ, numbers and time, polite verbs, past and negative, い and な adjectives, あります・います, likes and wants, and the te-form. About 500 items.
- **Built for Chinese readers:** words that mean the same in Chinese are marked, false friends (手紙, 勉強, 走る, 上手…) get warnings, and every kanji word has a card for reading it without furigana, which is where the work is.
- **Type Japanese without a Japanese keyboard:** answer boxes turn romaji into kana as you type. Grading is by sound, with “close” for slips in vowel length, the small っ, voicing or small kana.
- **A daily plan** of 30 to 120 minutes, timed by activity, with a phase roadmap measured in hours.
- **Spaced repetition** with FSRS and difficulty that adapts toward about 85% accuracy.
- **Reading:** 8 graded stories with tap-to-gloss and furigana that fades as words are learned, plus a daily story written by Claude to your vocabulary (on claude.ai only).
- **Play:** a daily puzzle where you sort 16 words into four groups, and a 60-second speed round.
- **Speak & write:** shadowing practice, and writing prompts with corrections from Claude (on claude.ai only).
- **Method tab:** each mechanic with the study behind it.

## Run it locally

```bash
python3 -m http.server
# open http://localhost:8000
```

Audio uses your device's Japanese voice for now. On a Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices, and add a Japanese voice.

## Files

- `index.html`: the whole app
- `manifest.webmanifest`, `sw.js`, `icon-*.png`: makes the page installable and offline-capable
- `tools/`: content checks and a browser smoke test
