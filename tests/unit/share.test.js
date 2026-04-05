import { describe, it, expect } from 'vitest';
import { buildShareText } from '../../src/ui/share.js';

const mockAnswer = { code: 'FR', name: 'France' };

function makeState(guesses, status) {
  return { guesses, status, answer: mockAnswer };
}

describe('buildShareText', () => {
  it('includes "Flag Guesser" in the output', () => {
    const text = buildShareText('2026-04-05', makeState(['FR'], 'WON'));
    expect(text).toContain('Flag Guesser');
  });

  it('includes a puzzle number', () => {
    const text = buildShareText('2026-04-05', makeState(['FR'], 'WON'));
    expect(text).toMatch(/#\d+/);
  });

  it('shows a green square for a correct guess', () => {
    const text = buildShareText('2026-04-05', makeState(['FR'], 'WON'));
    expect(text).toContain('🟩');
  });

  it('shows a red square for a wrong guess', () => {
    const text = buildShareText('2026-04-05', makeState(['DE', 'FR'], 'WON'));
    expect(text).toContain('🟥');
    expect(text).toContain('🟩');
  });

  it('pads to 5 red squares when status is LOST', () => {
    const guesses = ['DE', 'GB', 'IT', 'ES', 'PT'];
    const text = buildShareText('2026-04-05', makeState(guesses, 'LOST'));
    const redCount = (text.match(/🟥/g) || []).length;
    expect(redCount).toBe(5);
  });

  it('does not pad squares when status is WON', () => {
    const text = buildShareText('2026-04-05', makeState(['FR'], 'WON'));
    const greenCount = (text.match(/🟩/g) || []).length;
    const redCount = (text.match(/🟥/g) || []).length;
    expect(greenCount).toBe(1);
    expect(redCount).toBe(0);
  });

  it('includes guess count in header line', () => {
    const text = buildShareText('2026-04-05', makeState(['DE', 'FR'], 'WON'));
    expect(text).toContain('2/5');
  });

  it('pads to 5 red squares when LOST with fewer than 5 guesses in state', () => {
    // buildShareText accepts arbitrary state; test the padding branch directly
    const text = buildShareText('2026-04-05', makeState(['DE'], 'LOST'));
    const redCount = (text.match(/🟥/g) || []).length;
    expect(redCount).toBe(5);
  });

  it('returns different puzzle numbers for different dates', () => {
    const a = buildShareText('2026-04-05', makeState(['FR'], 'WON'));
    const b = buildShareText('2026-04-06', makeState(['FR'], 'WON'));
    expect(a).not.toBe(b);
  });
});
