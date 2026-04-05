# 🏳️ Flag Guesser

A daily flag-guessing game — identify 5 country flags per session, earn points for guessing quickly, and track your streak over time.

**Live:** [chandni-kaithavalappil.github.io/Flag_Guesser](https://chandni-kaithavalappil.github.io/Flag_Guesser/)

---

## How to Play

Each session gives you **5 flags** to identify, one at a time.

- The flag starts **blurred** — it gets clearer with each wrong guess
- You have **5 guesses** per flag
- **Hints unlock** after each wrong guess (continent → subregion → population → capital)
- Use the autocomplete search to find countries — type a name, use arrow keys to navigate, press Enter or click to submit
- After each flag, hit **Next Flag →** to continue
- After all 5 flags, your **total score** is revealed

Everyone gets the **same 5 flags on the same day**, so you can compare scores with friends.

---

## Scoring

Points are awarded based on how few guesses you needed:

| Guesses used  | Points |
| ------------- | ------ |
| 1             | 5      |
| 2             | 4      |
| 3             | 3      |
| 4             | 2      |
| 5             | 1      |
| Did not guess | 0      |

**Maximum score: 25 pts per session**

---

## Features

- **195 countries** — all UN-recognised nations with real flags from [flagcdn.com](https://flagcdn.com)
- **Daily session** — 5 new flags every day, same for all players, deterministic seed so no server needed
- **Progressive blur** — flag sharpens from 20 px blur down to 0 px as wrong guesses accumulate
- **4-stage hint system** — continent, subregion, population tier, capital
- **Autocomplete** — fuzzy search with accent normalisation, alias support, and full keyboard navigation
- **Streak tracking** — current and longest win streaks stored in `localStorage`
- **Share card** — spoiler-free emoji grid you can copy and paste
- **Countdown** — live timer to the next session at midnight
- **No sign-up, no server** — runs entirely in the browser

---

## Tech Stack

| Layer       | Tool                                         |
| ----------- | -------------------------------------------- |
| Build       | [Vite](https://vitejs.dev)                   |
| Language    | Vanilla JavaScript (ES modules, JSDoc types) |
| Styling     | Plain CSS (dark theme)                       |
| Testing     | [Vitest](https://vitest.dev) + jsdom         |
| Linting     | ESLint + Prettier                            |
| Git hooks   | Husky + lint-staged                          |
| CI / Deploy | GitHub Actions → GitHub Pages                |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run tests
npm test

# Run tests with coverage report
npm run test:coverage

# Lint
npm run lint

# Production build
npm run build
```

---

## Project Structure

```
src/
  data/
    countries.json        # 195 country records
  game/
    engine.js             # Pure game state functions (createGame, submitGuess)
    seed.js               # Deterministic daily flag selection (Mulberry32 PRNG)
    hints.js              # Hint unlock logic and population tier formatting
    countries.js          # Country list + fuzzy search
  storage/
    persistence.js        # localStorage: streaks, stats, mid-game save/restore
  ui/
    app.js                # Session controller — 5-round flow and scoring
    autocomplete.js       # Dropdown with keyboard navigation
    flagDisplay.js        # Flag image rendering with blur
    share.js              # Emoji share card builder
  main.js
  style.css
tests/
  unit/                   # engine, hints, seed, countries, persistence, autocomplete
  integration/            # Full game flow
```

---

## How the Daily Seed Works

A fixed seed (`0x464c4147` — the ASCII bytes of "FLAG") drives a [Mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c) PRNG to produce a deterministic Fisher-Yates shuffle of all 195 countries. Each calendar day maps to a unique slot in that permutation, guaranteeing a full 195-day cycle with no repeats — and no backend required.

---

## Running Tests

```bash
npm test                 # run once
npm run test:watch       # watch mode
npm run test:coverage    # with v8 coverage (thresholds: 80% lines/functions)
npm run test:ui          # visual test UI
```

35 tests across 7 files covering game logic, persistence, search, and integration.

---

## Deployment

Pushes to `main` automatically:

1. Lint → test with coverage → build
2. Deploy `dist/` to GitHub Pages

The live URL updates within ~30 seconds of a successful push.
