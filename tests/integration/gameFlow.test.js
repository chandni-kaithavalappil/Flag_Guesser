import { describe, it, expect } from 'vitest';
import { createGame, submitGuess } from '../../src/game/engine.js';
import { getDailyFlag } from '../../src/game/seed.js';

describe('game flow', () => {
  it('completes a win when the first guess is correct', () => {
    const answer = getDailyFlag('2026-04-05');
    let state = createGame(answer, '2026-04-05');
    state = submitGuess(state, answer.code);
    expect(state.status).toBe('WON');
  });
});
