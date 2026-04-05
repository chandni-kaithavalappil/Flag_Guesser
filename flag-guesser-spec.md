# Flag Guesser — Technical Specification

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-04-05

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Feature Specifications](#3-feature-specifications)
4. [Data Models](#4-data-models)
5. [Game State Machine](#5-game-state-machine)
6. [Unit Test Specifications](#6-unit-test-specifications)
7. [Coding Standards](#7-coding-standards)
8. [Free Hosting Setup](#8-free-hosting-setup)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Productionalization Plan](#10-productionalization-plan)

---

## 1. Project Overview

**Flag Guesser** is a daily browser-based geography game. Each day, all players see the same flag (blurred), and have up to 5 guesses to identify the country. After each wrong guess, the blur decreases and a geographic hint is revealed.

### Goals

- Zero backend — fully client-side, no server, no database
- Works offline after first load (PWA)
- Shareable daily result (like Wordle)
- Mobile-first responsive design

### Tech Stack

| Layer        | Choice                  | Reason                                                 |
| ------------ | ----------------------- | ------------------------------------------------------ |
| Language     | Vanilla JS (ES Modules) | No framework overhead, simpler testing                 |
| Build tool   | Vite                    | Fast dev server, tree-shaking, easy Vitest integration |
| Test runner  | Vitest                  | Native ESM, co-located with Vite, fast                 |
| Linter       | ESLint + Prettier       | Standard, widely understood                            |
| Git hooks    | Husky + lint-staged     | Enforce quality at commit time                         |
| Hosting      | Vercel (free tier)      | Git-push deployments, global CDN, 0 cost               |
| CI           | GitHub Actions          | Free for public repos                                  |
| Flags        | flagcdn.com             | Free SVG/PNG flags, CDN-hosted                         |
| Country data | Local JSON file         | Avoids runtime API dependency                          |

---

## 2. Architecture

### Directory Structure

```
flag-guesser/
├── src/
│   ├── game/
│   │   ├── engine.js          # Core game logic — pure functions only
│   │   ├── seed.js            # Daily flag selection via date seeding
│   │   ├── countries.js       # Country data (195 entries)
│   │   └── hints.js           # Hint generation logic
│   ├── ui/
│   │   ├── app.js             # UI orchestration, event wiring
│   │   ├── autocomplete.js    # Country search input component
│   │   ├── flagDisplay.js     # Blur animation + flag reveal
│   │   └── share.js           # Result emoji card generation
│   ├── storage/
│   │   └── persistence.js     # localStorage abstraction
│   └── main.js                # Entry point
├── tests/
│   ├── unit/
│   │   ├── engine.test.js
│   │   ├── seed.test.js
│   │   ├── hints.test.js
│   │   ├── autocomplete.test.js
│   │   └── persistence.test.js
│   └── integration/
│       └── gameFlow.test.js
├── public/
│   ├── index.html
│   ├── manifest.json          # PWA manifest
│   └── data/
│       └── countries.json     # 195 countries with metadata
├── .github/
│   └── workflows/
│       └── ci.yml
├── .eslintrc.json
├── .prettierrc
├── package.json
├── vite.config.js
└── vitest.config.js
```

### Separation of Concerns

```
main.js
  └── app.js (UI layer — DOM only, no game logic)
        ├── engine.js (game logic — pure functions, no DOM)
        │     ├── seed.js (deterministic flag selection)
        │     ├── hints.js (hint unlocking rules)
        │     └── countries.js (static data)
        ├── flagDisplay.js (visual flag reveal)
        ├── autocomplete.js (search input component)
        ├── share.js (result card generation)
        └── persistence.js (localStorage read/write)
```

**Rule:** `engine.js`, `seed.js`, `hints.js` must never import from `ui/` or touch the DOM. This makes them 100% unit-testable without a browser.

---

## 3. Feature Specifications

Each feature is written as a BDD (Behaviour-Driven Development) spec in Given / When / Then format.

---

### FEAT-01: Daily Flag Seeding

**Description:** Every player sees the same flag on the same calendar day, with no server coordination.

**Acceptance Criteria:**

```
GIVEN today's date is 2026-04-05
WHEN getDailyFlag() is called
THEN it returns the same country object every time it is called on that date

GIVEN today's date is 2026-04-05
AND tomorrow's date is 2026-04-06
WHEN getDailyFlag() is called on each date
THEN the two returned countries are different (with very high probability)

GIVEN the full list of 195 countries
WHEN getDailyFlag() is called across 195 consecutive dates
THEN no country repeats before all 195 have appeared (full cycle)
```

---

### FEAT-02: Blur Reveal

**Description:** The flag starts maximally blurred and becomes clearer with each wrong guess.

**Blur schedule (CSS `filter: blur(Xpx)`):**

| Guesses used      | Blur level |
| ----------------- | ---------- |
| 0 (start)         | 20px       |
| 1 wrong           | 15px       |
| 2 wrong           | 10px       |
| 3 wrong           | 5px        |
| 4 wrong           | 2px        |
| 5 wrong / correct | 0px        |

**Acceptance Criteria:**

```
GIVEN the game has just started
WHEN the flag is displayed
THEN the blur is 20px

GIVEN the player submits 1 incorrect guess
WHEN the flag updates
THEN the blur decreases to 15px

GIVEN the player submits a correct guess
WHEN the flag updates
THEN the blur is 0px (fully revealed)
```

---

### FEAT-03: Country Autocomplete Input

**Description:** As the player types, a dropdown of matching countries appears. Matching is case-insensitive and fuzzy (handles common spelling variations).

**Acceptance Criteria:**

```
GIVEN the player types "fra"
WHEN the autocomplete filters
THEN "France" appears in the results

GIVEN the player types "united"
WHEN the autocomplete filters
THEN results include "United States", "United Kingdom", "United Arab Emirates"

GIVEN the player types a country name with incorrect capitalisation e.g. "france"
WHEN the autocomplete filters
THEN "France" still appears in the results

GIVEN the player selects a country from the dropdown
WHEN the selection is confirmed
THEN the input is cleared and the guess is submitted

GIVEN the player types a string matching no country
WHEN the autocomplete filters
THEN the dropdown shows "No matches" and no guess can be submitted
```

---

### FEAT-04: Hint System

**Description:** One hint unlocks after each wrong guess. Hints progress from broad to specific.

**Hint schedule:**

| Wrong guess # | Hint revealed                              |
| ------------- | ------------------------------------------ |
| 1             | Continent                                  |
| 2             | Subregion                                  |
| 3             | Population tier (e.g. "Large — over 100M") |
| 4             | Capital city                               |

**Acceptance Criteria:**

```
GIVEN the player has made 0 wrong guesses
WHEN hints are displayed
THEN no hints are visible

GIVEN the player has made 1 wrong guess
WHEN hints are displayed
THEN only the continent hint is visible

GIVEN the player has made 4 wrong guesses
WHEN hints are displayed
THEN all 4 hints are visible

GIVEN the country is France
WHEN all hints are unlocked
THEN the hints read: "Europe", "Western Europe", "Large — over 50M", "Paris"
```

---

### FEAT-05: Win / Lose States

**Acceptance Criteria:**

```
GIVEN the player guesses the correct country
WHEN the guess is evaluated
THEN the game transitions to WON state
AND the flag is revealed at 0px blur
AND a success message is shown with guess count
AND the share card is available

GIVEN the player has made 5 wrong guesses
WHEN the 5th guess is evaluated as incorrect
THEN the game transitions to LOST state
AND the correct answer is revealed
AND the flag is shown at 0px blur
AND the share card is available

GIVEN the game is in WON or LOST state
WHEN the player attempts to submit another guess
THEN no action is taken (input disabled)
```

---

### FEAT-06: Streak Tracking

**Acceptance Criteria:**

```
GIVEN a player has won 3 days in a row
WHEN they win today
THEN currentStreak is 4 AND longestStreak is updated if 4 > previous longest

GIVEN a player has a currentStreak of 5
WHEN they lose today
THEN currentStreak resets to 0 AND longestStreak is unchanged

GIVEN a player has no prior localStorage data
WHEN they open the game for the first time
THEN currentStreak is 0 AND longestStreak is 0

GIVEN a player completed yesterday's puzzle
WHEN they open today's game
THEN their streak from yesterday is preserved
```

---

### FEAT-07: Share Card

**Description:** After win/loss, a shareable text result is generated. No country name is revealed — only emoji.

**Format:**

```
Flag Guesser #42 🏳️ 3/5

🟥🟥🟩
```

**Acceptance Criteria:**

```
GIVEN the player won in 3 guesses
WHEN the share card is generated
THEN it shows 3 emoji: 2 red squares followed by 1 green square

GIVEN the player lost
WHEN the share card is generated
THEN it shows 5 red squares

GIVEN the player clicks "Copy"
WHEN the copy action completes
THEN the button label changes to "Copied!" for 2 seconds then reverts

GIVEN the share text is copied
WHEN pasted into any messaging app
THEN no country name or flag image is revealed (spoiler-free)
```

---

### FEAT-08: Countdown to Next Flag

**Acceptance Criteria:**

```
GIVEN the game is in WON or LOST state
WHEN the result screen is shown
THEN a live countdown to midnight (local time) is displayed

GIVEN it is 23:59:00 local time
WHEN the countdown reaches 00:00:00
THEN the page reloads and shows a fresh game
```

---

## 4. Data Models

### Country Object

```js
/**
 * @typedef {Object} Country
 * @property {string} code         - ISO 3166-1 alpha-2 (e.g. "FR")
 * @property {string} name         - Official English name (e.g. "France")
 * @property {string[]} aliases    - Common alternate names (e.g. ["The Gambia"])
 * @property {string} continent    - One of 7 continents
 * @property {string} subregion    - UN subregion (e.g. "Western Europe")
 * @property {string} capital      - Capital city name
 * @property {number} population   - Latest estimate
 * @property {string} flagUrl      - e.g. "https://flagcdn.com/fr.svg"
 */
```

### Game State Object

```js
/**
 * @typedef {'PLAYING' | 'WON' | 'LOST'} GameStatus
 *
 * @typedef {Object} GameState
 * @property {Country}     answer       - Today's correct country
 * @property {string[]}    guesses      - Country codes guessed so far (max 5)
 * @property {GameStatus}  status       - Current game status
 * @property {number}      hintsVisible - Number of hints currently shown (0–4)
 * @property {string}      date         - ISO date string for today e.g. "2026-04-05"
 */
```

### Persistence Record

```js
/**
 * Stored under localStorage key: "flagguesser_v1"
 *
 * @typedef {Object} PersistenceRecord
 * @property {string}    lastPlayed      - ISO date of last completed game
 * @property {GameStatus} lastResult     - 'WON' or 'LOST'
 * @property {number}    currentStreak   - Consecutive wins
 * @property {number}    longestStreak   - All-time best streak
 * @property {number}    totalGames      - Total games completed
 * @property {number}    totalWins       - Total wins
 * @property {GameState | null} savedState - Partial state if mid-game today
 */
```

---

## 5. Game State Machine

```
         ┌─────────┐
         │  IDLE   │  (page load, no game started)
         └────┬────┘
              │ initGame()
              ▼
         ┌─────────┐
         │ PLAYING │ ◄─────────────────┐
         └────┬────┘                   │
              │                        │ wrong guess
              │ submitGuess(code)      │ guesses.length < 5
              ▼                        │
      ┌───────────────┐                │
      │ Evaluate guess │────────────────┘
      └───────┬───────┘
              │
       ┌──────┴──────┐
       │             │
   correct?      wrong and
       │         guesses === 5?
       ▼               │
   ┌───────┐       ┌───────┐
   │  WON  │       │ LOST  │
   └───────┘       └───────┘
       │               │
       └───────┬────────┘
               ▼
        Save to localStorage
        Show result + share card
        Start countdown
```

---

## 6. Unit Test Specifications

### Test Setup

**package.json test scripts:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**vitest.config.js:**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: ['src/game/**', 'src/storage/**'],
      exclude: ['src/ui/**'], // UI layer tested via integration
    },
  },
});
```

---

### UNIT-01: seed.test.js

```js
import { describe, it, expect } from 'vitest';
import { getDailyIndex, getDailyFlag } from '../src/game/seed.js';
import countries from '../public/data/countries.json';

describe('getDailyIndex', () => {
  it('returns the same index for the same date string', () => {
    const a = getDailyIndex('2026-04-05', countries.length);
    const b = getDailyIndex('2026-04-05', countries.length);
    expect(a).toBe(b);
  });

  it('returns different indices for different dates (high probability)', () => {
    const a = getDailyIndex('2026-04-05', countries.length);
    const b = getDailyIndex('2026-04-06', countries.length);
    expect(a).not.toBe(b);
  });

  it('returns an index within bounds', () => {
    const idx = getDailyIndex('2026-04-05', countries.length);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(countries.length);
  });
});

describe('getDailyFlag', () => {
  it('returns a valid Country object', () => {
    const country = getDailyFlag('2026-04-05');
    expect(country).toHaveProperty('code');
    expect(country).toHaveProperty('name');
    expect(country).toHaveProperty('continent');
    expect(country).toHaveProperty('flagUrl');
  });

  it('returns the same country for the same date', () => {
    const a = getDailyFlag('2026-04-05');
    const b = getDailyFlag('2026-04-05');
    expect(a.code).toBe(b.code);
  });
});
```

---

### UNIT-02: engine.test.js

```js
import { describe, it, expect } from 'vitest';
import { createGame, submitGuess, getBlurLevel } from '../src/game/engine.js';

const mockCountry = {
  code: 'FR',
  name: 'France',
  continent: 'Europe',
  subregion: 'Western Europe',
  capital: 'Paris',
  population: 67000000,
  flagUrl: 'https://flagcdn.com/fr.svg',
  aliases: [],
};

describe('createGame', () => {
  it('initialises with PLAYING status', () => {
    const state = createGame(mockCountry, '2026-04-05');
    expect(state.status).toBe('PLAYING');
  });

  it('starts with no guesses', () => {
    const state = createGame(mockCountry, '2026-04-05');
    expect(state.guesses).toHaveLength(0);
  });

  it('starts with 0 hints visible', () => {
    const state = createGame(mockCountry, '2026-04-05');
    expect(state.hintsVisible).toBe(0);
  });
});

describe('submitGuess', () => {
  it('transitions to WON when correct country code is submitted', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const next = submitGuess(state, 'FR');
    expect(next.status).toBe('WON');
  });

  it('adds the guess to the guesses array on wrong answer', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const next = submitGuess(state, 'DE');
    expect(next.guesses).toContain('DE');
    expect(next.guesses).toHaveLength(1);
  });

  it('increments hintsVisible after a wrong guess', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const next = submitGuess(state, 'DE');
    expect(next.hintsVisible).toBe(1);
  });

  it('transitions to LOST after 5 wrong guesses', () => {
    let state = createGame(mockCountry, '2026-04-05');
    ['DE', 'GB', 'IT', 'ES', 'PT'].forEach((code) => {
      state = submitGuess(state, code);
    });
    expect(state.status).toBe('LOST');
  });

  it('does not accept further guesses in WON state', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const won = submitGuess(state, 'FR');
    const attempted = submitGuess(won, 'DE');
    expect(attempted.guesses).toHaveLength(1); // still only the winning guess
  });

  it('does not accept further guesses in LOST state', () => {
    let state = createGame(mockCountry, '2026-04-05');
    ['DE', 'GB', 'IT', 'ES', 'PT'].forEach((code) => {
      state = submitGuess(state, code);
    });
    const attempted = submitGuess(state, 'FR');
    expect(attempted.guesses).toHaveLength(5);
  });
});

describe('getBlurLevel', () => {
  it('returns 20 with 0 wrong guesses', () => {
    expect(getBlurLevel(0)).toBe(20);
  });

  it('returns 0 when game is WON regardless of guess count', () => {
    expect(getBlurLevel(1, 'WON')).toBe(0);
  });

  it('returns 0 when game is LOST', () => {
    expect(getBlurLevel(5, 'LOST')).toBe(0);
  });

  it('decreases blur with each wrong guess', () => {
    expect(getBlurLevel(1)).toBeLessThan(getBlurLevel(0));
    expect(getBlurLevel(2)).toBeLessThan(getBlurLevel(1));
    expect(getBlurLevel(3)).toBeLessThan(getBlurLevel(2));
  });
});
```

---

### UNIT-03: hints.test.js

```js
import { describe, it, expect } from 'vitest';
import { getVisibleHints } from '../src/game/hints.js';

const france = {
  continent: 'Europe',
  subregion: 'Western Europe',
  population: 67000000,
  capital: 'Paris',
};

describe('getVisibleHints', () => {
  it('returns empty array when 0 hints are visible', () => {
    expect(getVisibleHints(france, 0)).toHaveLength(0);
  });

  it('returns continent hint when 1 hint is visible', () => {
    const hints = getVisibleHints(france, 1);
    expect(hints[0].label).toBe('Continent');
    expect(hints[0].value).toBe('Europe');
  });

  it('returns all 4 hints when 4 hints are visible', () => {
    const hints = getVisibleHints(france, 4);
    expect(hints).toHaveLength(4);
  });

  it('includes capital in 4th hint', () => {
    const hints = getVisibleHints(france, 4);
    expect(hints[3].label).toBe('Capital');
    expect(hints[3].value).toBe('Paris');
  });

  it('formats population into human-readable tier', () => {
    const hints = getVisibleHints(france, 3);
    expect(hints[2].label).toBe('Population');
    expect(typeof hints[2].value).toBe('string');
    expect(hints[2].value).toMatch(/\d/); // contains a number
  });
});
```

---

### UNIT-04: persistence.test.js

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadRecord, saveResult, getStreakInfo } from '../src/storage/persistence.js';

const mockStorage = {};

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k) => mockStorage[k] ?? null,
    setItem: (k, v) => {
      mockStorage[k] = v;
    },
    removeItem: (k) => {
      delete mockStorage[k];
    },
  });
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
});

describe('loadRecord', () => {
  it('returns default record when no data exists', () => {
    const record = loadRecord();
    expect(record.currentStreak).toBe(0);
    expect(record.longestStreak).toBe(0);
    expect(record.totalGames).toBe(0);
  });
});

describe('saveResult', () => {
  it('increments totalGames on each save', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'LOST');
    const record = loadRecord();
    expect(record.totalGames).toBe(2);
  });

  it('increments currentStreak on consecutive wins', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    const record = loadRecord();
    expect(record.currentStreak).toBe(2);
  });

  it('resets currentStreak to 0 after a loss', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    saveResult('2026-04-07', 'LOST');
    const record = loadRecord();
    expect(record.currentStreak).toBe(0);
  });

  it('preserves longestStreak after a loss', () => {
    saveResult('2026-04-05', 'WON');
    saveResult('2026-04-06', 'WON');
    saveResult('2026-04-07', 'LOST');
    const record = loadRecord();
    expect(record.longestStreak).toBe(2);
  });
});
```

---

### Coverage Targets

| Module                       | Target                        |
| ---------------------------- | ----------------------------- |
| `src/game/engine.js`         | 90%+                          |
| `src/game/seed.js`           | 90%+                          |
| `src/game/hints.js`          | 85%+                          |
| `src/storage/persistence.js` | 85%+                          |
| `src/game/countries.js`      | 70%+ (data only)              |
| `src/ui/**`                  | excluded (integration tested) |
| **Overall enforced minimum** | **80% lines/functions**       |

CI will **fail the build** if coverage drops below thresholds.

---

## 7. Coding Standards

### ESLint Configuration (.eslintrc.json)

```json
{
  "env": { "browser": true, "es2022": true },
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "eqeqeq": ["error", "always"],
    "curly": "error",
    "no-implicit-globals": "error",
    "no-param-reassign": "error"
  }
}
```

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Git Hooks (package.json)

```json
{
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"],
    "*.{html,css,json,md}": ["prettier --write"]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  }
}
```

### JSDoc Requirements

All exported functions **must** have JSDoc:

```js
/**
 * Submits a country code guess and returns the updated game state.
 * This is a pure function — the original state is never mutated.
 *
 * @param {GameState} state - Current game state
 * @param {string}    code  - ISO 3166-1 alpha-2 country code
 * @returns {GameState}     - New game state after applying the guess
 */
export function submitGuess(state, code) { ... }
```

### Pure Functions Rule

All logic in `src/game/` must be **pure** (no side effects, no DOM access, no localStorage):

```js
// ✅ Correct — pure function
export function submitGuess(state, code) {
  if (state.status !== 'PLAYING') {
    return state;
  }
  // ...
  return { ...state, guesses: [...state.guesses, code], status: nextStatus };
}

// ❌ Wrong — modifies DOM (belongs in ui/ only)
export function submitGuess(state, code) {
  document.getElementById('result').textContent = '...'; // NEVER in game/
}
```

---

## 8. Free Hosting Setup

### Vercel (recommended)

1. Push repository to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Set build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
4. Click Deploy — done. Vercel assigns a free `.vercel.app` domain instantly.

**Free tier limits:** 100GB bandwidth/month, unlimited deployments, custom domain supported.

### Custom Domain (free with Vercel)

1. Buy domain (~₹500–₹1000/yr via Namecheap or Porkbun)
2. In Vercel dashboard: Settings → Domains → Add domain
3. Update DNS with Vercel's nameservers — SSL certificate is automatic.

### Alternative: Netlify

- Same process, equally free
- Slightly better form handling if ever needed
- Free tier: 100GB bandwidth, 300 build minutes/month

### Environment

No environment variables needed — this is a fully static site. No secrets, no API keys.

---

## 9. CI/CD Pipeline

### GitHub Actions (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Branch Strategy

```
main          — production, auto-deploys to vercel.app
  └── develop — integration branch, preview deploys on each PR
        └── feat/blur-reveal       — feature branches
        └── feat/hint-system
        └── fix/autocomplete-bug
```

**Rule:** No direct pushes to `main`. All changes go through a PR. CI must pass before merge.

---

## 10. Productionalization Plan

### Phase 1 — MVP (Week 1–2)

**Goal:** A playable game on a public URL.

| Task                            | Owner | Done when                                                            |
| ------------------------------- | ----- | -------------------------------------------------------------------- |
| Scaffold project with Vite      | Dev   | `npm run dev` works                                                  |
| countries.json with 195 entries | Dev   | All entries have code, name, continent, capital, population, flagUrl |
| seed.js + tests passing         | Dev   | CI green                                                             |
| engine.js + tests passing       | Dev   | CI green                                                             |
| hints.js + tests passing        | Dev   | CI green                                                             |
| persistence.js + tests passing  | Dev   | CI green                                                             |
| Basic UI (flag + input + hints) | Dev   | Game is playable in browser                                          |
| Share card + copy               | Dev   | Emoji result copies to clipboard                                     |
| Deploy to Vercel                | Dev   | Public URL live                                                      |

---

### Phase 2 — Polish (Week 3)

| Task                            | Notes                               |
| ------------------------------- | ----------------------------------- |
| Mobile-first CSS                | Test on Chrome iOS + Android        |
| Keyboard navigation             | Tab through hints, Enter to submit  |
| Smooth blur animation           | CSS transition on filter change     |
| Streak display on result screen | Uses persistence.js                 |
| Countdown timer to next flag    | Reloads page at midnight            |
| PWA manifest + service worker   | Offline support, Add to Home Screen |
| Favicon + Open Graph meta tags  | Better link previews when shared    |

---

### Phase 3 — Growth (Week 4)

| Task                                             | Notes                                      |
| ------------------------------------------------ | ------------------------------------------ |
| Submit to r/geography, r/vexillology, r/webgames | Main viral channels                        |
| Add to Hacker News "Show HN"                     | Developer community                        |
| Lightweight analytics                            | Plausible.io — privacy-first, free tier    |
| Flag number in share card                        | "Flag Guesser #42" — builds daily identity |
| "Hard mode" toggle                               | No hints allowed — for advanced players    |
| Statistics modal                                 | Win %, guess distribution bar chart        |

---

### Phase 4 — Monitoring (Week 5+)

| Concern           | Tool                                | Free? |
| ----------------- | ----------------------------------- | ----- |
| Error tracking    | Sentry (free tier: 5k events/month) | Yes   |
| Uptime monitoring | UptimeRobot (free tier)             | Yes   |
| Performance       | Vercel Analytics (built-in)         | Yes   |
| Lighthouse CI     | GitHub Action on every PR           | Yes   |

**Lighthouse CI target scores:**

| Metric         | Target |
| -------------- | ------ |
| Performance    | ≥ 90   |
| Accessibility  | ≥ 95   |
| Best Practices | ≥ 90   |
| SEO            | ≥ 90   |

---

### Risks & Mitigations

| Risk                                         | Likelihood | Mitigation                                                 |
| -------------------------------------------- | ---------- | ---------------------------------------------------------- |
| flagcdn.com goes down                        | Low        | Bundle flag SVGs locally as fallback                       |
| localStorage disabled (private browsing)     | Medium     | Graceful degradation — game still works, streaks not saved |
| Country names disputed (e.g. Taiwan, Kosovo) | Medium     | Follow ISO 3166-1; add note in FAQ                         |
| Mobile layout breaks on unusual screen sizes | Medium     | Test on BrowserStack free tier                             |
| Seed collision (same flag two days in a row) | Very low   | Shuffle algorithm prevents repeats within a 195-day cycle  |

---

_End of specification. This document should be updated as features are added or changed._
