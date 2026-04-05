import countries from '../data/countries.json';

/**
 * @typedef {Object} Country
 * @property {string} code
 * @property {string} name
 * @property {string[]} aliases
 * @property {string} continent
 * @property {string} subregion
 * @property {string} capital
 * @property {number} population
 * @property {string} flagUrl
 */

/** Fixed seed for deterministic daily permutation (full 195-day cycle). */
const PERM_SEED = 0x464c4147; // 'FLAG'

/** Milliseconds in one day (60 × 60 × 24 × 1000). */
const MS_PER_DAY = 86_400_000;

/** Divisor to normalise a uint32 to [0, 1) — equals 2^32. */
const UINT32 = 4_294_967_296;

/**
 * Mulberry32 PRNG.
 *
 * @param {number} initialSeed
 * @returns {() => number}
 */
function mulberry32(initialSeed) {
  let s = initialSeed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
}

/**
 * Deterministic shuffle of [0..n-1].
 *
 * @param {number} n
 * @param {number} seed
 * @returns {number[]}
 */
function permutation(n, seed) {
  const arr = Array.from({ length: n }, (_, i) => i);
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

let _perm = null;

/**
 * @param {number} len
 * @returns {number[]}
 */
function getPermutation(len) {
  if (!_perm || _perm.length !== len) {
    _perm = permutation(len, PERM_SEED);
  }
  return _perm;
}

/**
 * Ordinal day (UTC) for YYYY-MM-DD.
 *
 * @param {string} isoDate
 * @returns {number}
 */
function ordinalDayUtc(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/**
 * Returns stable daily index in [0, len).
 *
 * @param {string} isoDate - YYYY-MM-DD
 * @param {number} len - Number of countries
 * @returns {number}
 */
export function getDailyIndex(isoDate, len) {
  const perm = getPermutation(len);
  const slot = ((ordinalDayUtc(isoDate) % len) + len) % len;
  return perm[slot];
}

/**
 * Returns the country for the given calendar day.
 *
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {Country}
 */
export function getDailyFlag(isoDate) {
  const len = countries.length;
  const idx = getDailyIndex(isoDate, len);
  return countries[idx];
}

/**
 * Returns `count` distinct countries for a session starting on the given date.
 * Each day produces the same set, in the same order, for all players.
 *
 * @param {string} isoDate - YYYY-MM-DD
 * @param {number} count
 * @returns {Country[]}
 */
export function getSessionFlags(isoDate, count) {
  const len = countries.length;
  const perm = getPermutation(len);
  const baseSlot = ((ordinalDayUtc(isoDate) % len) + len) % len;
  return Array.from({ length: count }, (_, i) => {
    const slot = (baseSlot + i) % len;
    return countries[perm[slot]];
  });
}
