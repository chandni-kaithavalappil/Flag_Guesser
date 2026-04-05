import { createGame, submitGuess, getBlurLevel } from '../game/engine.js';
import { getSessionFlags } from '../game/seed.js';
import { getVisibleHints } from '../game/hints.js';
import { saveResult, getStreakInfo } from '../storage/persistence.js';
import { updateFlagBlur } from './flagDisplay.js';
import { initAutocomplete } from './autocomplete.js';
import { buildShareText } from './share.js';
import countries, { filterCountriesByQuery } from '../game/countries.js';

const SESSION_SIZE = 5;
const MAX_GUESSES = 5;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1_000;
const COPY_RESET_MS = 2_000;

/**
 * Returns today's date as YYYY-MM-DD in UTC (consistent with seed.js).
 *
 * @returns {string}
 */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Points earned for a completed round.
 * Won in 1 guess = 5 pts … Won in 5 guesses = 1 pt … Lost = 0 pts.
 *
 * @param {'WON'|'LOST'} status
 * @param {number} guessCount
 * @returns {number}
 */
function roundScore(status, guessCount) {
  if (status !== 'WON') {
    return 0;
  }
  return MAX_GUESSES + 1 - guessCount;
}

/**
 * Starts a live countdown to local midnight, reloading the page when it hits zero.
 *
 * @param {HTMLElement} el
 * @returns {number} interval id
 */
function startCountdown(el) {
  function update() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / MS_PER_HOUR);
    const m = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
    const s = Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND);
    el.textContent = `Next session in ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (diff <= MS_PER_SECOND) {
      window.location.reload();
    }
  }
  update();
  return setInterval(update, MS_PER_SECOND);
}

/**
 * Mounts the session-based game UI into the given root element.
 *
 * @param {HTMLElement | null} root
 */
export function initApp(root) {
  if (!root) {
    return;
  }

  const date = todayIso();
  const sessionFlags = getSessionFlags(date, SESSION_SIZE);

  /** @type {{ status: 'WON'|'LOST', guessCount: number, answer: string }[]} */
  const roundResults = [];
  let roundIndex = 0;
  let state = createGame(sessionFlags[0], date);
  let acController = null;

  // ── build DOM ──────────────────────────────────────────────────────────────
  const main = document.createElement('main');
  main.className = 'app';

  const h1 = document.createElement('h1');
  h1.textContent = 'Flag Guesser';
  main.appendChild(h1);

  const sessionHeader = document.createElement('div');
  sessionHeader.className = 'session-header';
  const roundLabelEl = document.createElement('span');
  roundLabelEl.id = 'round-label';
  roundLabelEl.className = 'round-label';
  const dotsEl = document.createElement('div');
  dotsEl.id = 'round-dots';
  dotsEl.className = 'round-dots';
  sessionHeader.appendChild(roundLabelEl);
  sessionHeader.appendChild(dotsEl);
  main.appendChild(sessionHeader);

  const gameArea = document.createElement('div');
  gameArea.id = 'game-area';
  const flagWrap = document.createElement('div');
  flagWrap.id = 'flag-wrap';
  flagWrap.className = 'flag-wrap';
  const statusEl = document.createElement('p');
  statusEl.id = 'status';
  statusEl.className = 'status';
  const hintsEl = document.createElement('div');
  hintsEl.id = 'hints';
  hintsEl.className = 'hints';
  const guessRow = document.createElement('div');
  guessRow.id = 'guess-row';
  guessRow.className = 'guess-row';
  const inputWrap = document.createElement('div');
  inputWrap.className = 'input-wrap';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'guess-input';
  input.setAttribute('autocomplete', 'off');
  input.placeholder = 'Guess a country';
  inputWrap.appendChild(input);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'guess-btn';
  btn.textContent = 'Guess';
  guessRow.appendChild(inputWrap);
  guessRow.appendChild(btn);
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.id = 'next-btn';
  nextBtn.className = 'next-btn';
  nextBtn.hidden = true;
  gameArea.appendChild(flagWrap);
  gameArea.appendChild(statusEl);
  gameArea.appendChild(hintsEl);
  gameArea.appendChild(guessRow);
  gameArea.appendChild(nextBtn);
  main.appendChild(gameArea);

  const finalScoreEl = document.createElement('div');
  finalScoreEl.id = 'final-score';
  finalScoreEl.className = 'final-score';
  finalScoreEl.hidden = true;
  main.appendChild(finalScoreEl);

  const countdownEl = document.createElement('p');
  countdownEl.className = 'countdown';
  countdownEl.id = 'countdown';
  countdownEl.hidden = true;
  main.appendChild(countdownEl);

  const streakEl = document.createElement('p');
  streakEl.className = 'streak';
  streakEl.id = 'streak-info';
  main.appendChild(streakEl);

  root.replaceChildren(main);

  // Populate dot indicators (one per session round)
  for (let i = 0; i < SESSION_SIZE; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dotsEl.appendChild(dot);
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  function currentAnswer() {
    return sessionFlags[roundIndex];
  }

  function wrongCount() {
    const ans = currentAnswer();
    return state.guesses.filter((c) => c !== ans.code).length;
  }

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('dot--won', 'dot--lost', 'dot--active');
      if (i < roundResults.length) {
        dot.classList.add(roundResults[i].status === 'WON' ? 'dot--won' : 'dot--lost');
      } else if (i === roundIndex) {
        dot.classList.add('dot--active');
      }
    });
  }

  // ── render current round ───────────────────────────────────────────────────
  function render() {
    const ans = currentAnswer();
    const blur = getBlurLevel(wrongCount(), state.status);
    updateFlagBlur(flagWrap, ans.flagUrl, blur);

    statusEl.textContent =
      state.status === 'PLAYING'
        ? `Guesses remaining: ${MAX_GUESSES - state.guesses.length}`
        : state.status === 'WON'
          ? `Correct! +${roundScore('WON', state.guesses.length)} pts`
          : `It was ${ans.name} — 0 pts`;

    // hints
    hintsEl.replaceChildren();
    for (const h of getVisibleHints(ans, state.hintsVisible)) {
      const div = document.createElement('div');
      div.className = 'hint';
      const strong = document.createElement('strong');
      strong.textContent = `${h.label}:`;
      div.appendChild(strong);
      div.appendChild(document.createTextNode(` ${h.value}`));
      hintsEl.appendChild(div);
    }

    const done = state.status !== 'PLAYING';
    if (input) {
      input.disabled = done;
    }
    if (btn) {
      btn.disabled = done;
    }

    if (done) {
      const isLast = roundIndex === SESSION_SIZE - 1;
      nextBtn.textContent = isLast ? 'See Results' : 'Next Flag →';
      nextBtn.hidden = false;
      guessRow.style.display = 'none';
    }

    updateDots();

    const { currentStreak, longestStreak } = getStreakInfo();
    streakEl.textContent = `Streak: ${currentStreak} · Best: ${longestStreak}`;
  }

  // ── show final score screen ────────────────────────────────────────────────
  function showFinalScore() {
    const total = roundResults.reduce((sum, r) => sum + roundScore(r.status, r.guessCount), 0);
    const maxPts = SESSION_SIZE * MAX_GUESSES;
    const won = roundResults.filter((r) => r.status === 'WON').length;

    // save daily result: WON if majority correct
    saveResult(date, won >= Math.ceil(SESSION_SIZE / 2) ? 'WON' : 'LOST');

    gameArea.hidden = true;

    finalScoreEl.hidden = false;
    finalScoreEl.replaceChildren();

    const heading = document.createElement('h2');
    heading.className = 'score-heading';
    heading.textContent = 'Session Complete!';
    finalScoreEl.appendChild(heading);

    const summary = document.createElement('p');
    summary.className = 'score-summary';
    summary.textContent = `${won} / ${SESSION_SIZE} flags guessed · ${total} / ${maxPts} pts`;
    finalScoreEl.appendChild(summary);

    const table = document.createElement('table');
    table.className = 'score-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const title of ['#', 'Flag', 'Country', 'Result', 'Pts']) {
      const th = document.createElement('th');
      th.textContent = title;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    roundResults.forEach((r, i) => {
      const pts = roundScore(r.status, r.guessCount);
      const tr = document.createElement('tr');
      tr.className = r.status === 'WON' ? 'row--won' : 'row--lost';

      const tdNum = document.createElement('td');
      tdNum.textContent = String(i + 1);

      const tdFlag = document.createElement('td');
      const flagImg = document.createElement('img');
      flagImg.src = sessionFlags[i].flagUrl;
      flagImg.className = 'score-flag';
      flagImg.alt = '';
      tdFlag.appendChild(flagImg);

      const tdName = document.createElement('td');
      tdName.textContent = sessionFlags[i].name;

      const tdResult = document.createElement('td');
      tdResult.textContent = r.status === 'WON' ? `✓ in ${r.guessCount}` : '✗';

      const tdPts = document.createElement('td');
      tdPts.textContent = String(pts);

      tr.appendChild(tdNum);
      tr.appendChild(tdFlag);
      tr.appendChild(tdName);
      tr.appendChild(tdResult);
      tr.appendChild(tdPts);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    finalScoreEl.appendChild(table);

    // share text from last round's state (best effort)
    const shareText = buildShareText(date, state);
    const pre = document.createElement('pre');
    pre.className = 'share-pre';
    pre.textContent = shareText;
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy result';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy result';
        }, COPY_RESET_MS);
      } catch {
        copyBtn.textContent = 'Copy failed';
      }
    });
    finalScoreEl.appendChild(pre);
    finalScoreEl.appendChild(copyBtn);

    // start countdown
    countdownEl.hidden = false;
    startCountdown(countdownEl);

    updateDots();
    const { currentStreak, longestStreak } = getStreakInfo();
    streakEl.textContent = `Streak: ${currentStreak} · Best: ${longestStreak}`;
  }

  // ── advance to next round ─────────────────────────────────────────────────
  function handleNextFlag() {
    roundResults.push({
      status: state.status,
      guessCount: state.guesses.length,
      answer: currentAnswer().code,
    });

    if (roundResults.length === SESSION_SIZE) {
      showFinalScore();
      return;
    }

    roundIndex += 1;
    state = createGame(sessionFlags[roundIndex], date);

    roundLabelEl.textContent = `Round ${roundIndex + 1} / ${SESSION_SIZE}`;
    nextBtn.hidden = true;
    guessRow.style.display = '';
    if (input) {
      input.disabled = false;
      input.value = '';
      input.focus();
    }
    if (btn) {
      btn.disabled = false;
    }

    // re-init autocomplete for fresh round
    acController?.cleanup();
    acController = initAutocomplete(input, (code) => {
      state = submitGuess(state, code);
      render();
    });

    render();
  }

  // ── wire events ────────────────────────────────────────────────────────────
  nextBtn.addEventListener('click', handleNextFlag);

  function submitFromButton() {
    const query = input?.value.trim() ?? '';
    if (!query) {
      return;
    }
    const matches = filterCountriesByQuery(countries, query);
    const exact = matches.find((c) => c.name.toLowerCase() === query.toLowerCase());
    const pick = exact ?? (matches.length === 1 ? matches[0] : null);
    if (!pick) {
      return;
    }
    acController?.close();
    state = submitGuess(state, pick.code);
    if (input) {
      input.value = '';
    }
    render();
  }

  btn?.addEventListener('click', submitFromButton);

  // ── init first round ───────────────────────────────────────────────────────
  roundLabelEl.textContent = `Round 1 / ${SESSION_SIZE}`;
  acController = initAutocomplete(input, (code) => {
    state = submitGuess(state, code);
    render();
  });

  render();
}
