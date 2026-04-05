import { describe, it, expect } from 'vitest';
import countries from '../../src/data/countries.json';

describe('countries.json', () => {
  it('has 195 unique ISO codes', () => {
    expect(countries).toHaveLength(195);
    const codes = new Set(countries.map((c) => c.code));
    expect(codes.size).toBe(195);
  });
});
