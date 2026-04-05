import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'data', 'countries.json');

const url =
  'https://restcountries.com/v3.1/all?fields=cca2,name,independent,unMember,region,subregion,capital,population,altSpellings';

const res = await fetch(url);
if (!res.ok) {
  throw new Error(`HTTP ${res.status}`);
}

const raw = await res.json();

/**
 * @param {any} c
 */
function mapRow(c) {
  if (!c.cca2 || !c.name?.common) {
    return null;
  }
  const code = c.cca2;
  const name = c.name.common;
  const continent = c.region || 'Unknown';
  const subregion = c.subregion || continent;
  const capital = Array.isArray(c.capital) && c.capital[0] ? c.capital[0] : 'Unknown';
  const population = typeof c.population === 'number' ? c.population : 0;
  const aliases = Array.isArray(c.altSpellings) ? c.altSpellings.filter(Boolean) : [];
  const flagUrl = `https://flagcdn.com/${code.toLowerCase()}.svg`;
  return {
    code,
    name,
    aliases,
    continent,
    subregion,
    capital,
    population,
    flagUrl,
  };
}

const byCode = new Map();

for (const c of raw) {
  if (!c.unMember) {
    continue;
  }
  const row = mapRow(c);
  if (row) {
    byCode.set(row.code, row);
  }
}

for (const c of raw) {
  if (!c.independent) {
    continue;
  }
  const row = mapRow(c);
  if (row && !byCode.has(row.code)) {
    byCode.set(row.code, row);
  }
}

const list = [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));

await writeFile(outPath, JSON.stringify(list, null, 2), 'utf8');
console.log(`Wrote ${list.length} countries to ${outPath}`);
