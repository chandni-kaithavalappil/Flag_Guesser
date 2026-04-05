/**
 * @typedef {{ label: string; value: string }} HintLine
 */

const POP_VERY_LARGE = 100_000_000;
const POP_LARGE = 50_000_000;
const POP_MEDIUM_LARGE = 10_000_000;
const POP_MEDIUM = 1_000_000;
const POP_SMALL = 100_000;

/**
 * Formats population into a human-readable tier string.
 *
 * @param {number} population
 * @returns {string}
 */
export function formatPopulationTier(population) {
  if (population >= POP_VERY_LARGE) {
    return 'Very large — over 100M';
  }
  if (population >= POP_LARGE) {
    return 'Large — over 50M';
  }
  if (population >= POP_MEDIUM_LARGE) {
    return 'Medium-large — over 10M';
  }
  if (population >= POP_MEDIUM) {
    return 'Medium — over 1M';
  }
  if (population >= POP_SMALL) {
    return 'Small — over 100k';
  }
  return 'Very small — under 100k';
}

/**
 * Returns hint rows visible for the given country and unlock count.
 *
 * @param {object} country - Country-like object with continent, subregion, population, capital
 * @param {number} hintsVisible - 0–4
 * @returns {HintLine[]}
 */
export function getVisibleHints(country, hintsVisible) {
  const rows = [];
  if (hintsVisible >= 1) {
    rows.push({ label: 'Continent', value: country.continent });
  }
  if (hintsVisible >= 2) {
    rows.push({ label: 'Subregion', value: country.subregion });
  }
  if (hintsVisible >= 3) {
    rows.push({
      label: 'Population',
      value: formatPopulationTier(country.population),
    });
  }
  if (hintsVisible >= 4) {
    rows.push({ label: 'Capital', value: country.capital });
  }
  return rows;
}
