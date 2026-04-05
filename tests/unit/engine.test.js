import { describe, it, expect } from 'vitest';
import { createGame, submitGuess, getBlurLevel } from '../../src/game/engine.js';

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

  it('accepts lowercase code and normalises it', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const next = submitGuess(state, 'fr');
    expect(next.status).toBe('WON');
  });

  it('returns unchanged state for empty string', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const next = submitGuess(state, '');
    expect(next).toBe(state);
  });

  it('returns unchanged state for whitespace-only input', () => {
    const state = createGame(mockCountry, '2026-04-05');
    const next = submitGuess(state, '   ');
    expect(next).toBe(state);
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

  it('caps hintsVisible at 4 after 4 wrong guesses', () => {
    let state = createGame(mockCountry, '2026-04-05');
    ['DE', 'GB', 'IT', 'ES'].forEach((code) => {
      state = submitGuess(state, code);
    });
    expect(state.hintsVisible).toBe(4);
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
    expect(attempted.guesses).toHaveLength(1);
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

  it('clamps to last entry for out-of-bounds wrong guesses', () => {
    expect(getBlurLevel(100)).toBe(getBlurLevel(5));
  });

  it('clamps to first entry for negative wrong guesses', () => {
    expect(getBlurLevel(-1)).toBe(getBlurLevel(0));
  });
});
