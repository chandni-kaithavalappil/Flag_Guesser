import countries from '../data/countries.json';

export default countries;

/**
 * Normalizes a string for fuzzy matching.
 *
 * @param {string} s
 * @returns {string}
 */
export function normalizeName(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns countries matching the query (name or aliases).
 *
 * @param {typeof countries} list
 * @param {string} query
 * @returns {typeof countries}
 */
export function filterCountriesByQuery(list, query) {
  const q = normalizeName(query);
  if (!q) {
    return list.slice(0, 20);
  }
  const tokens = q.split(' ').filter(Boolean);

  return list.filter((c) => {
    const hay = `${c.name} ${(c.aliases || []).join(' ')}`;
    const n = normalizeName(hay);
    return tokens.every((t) => n.includes(t));
  });
}
