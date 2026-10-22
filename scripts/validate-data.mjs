// Validates data/spaces.json against the schema in src/types.ts.
// Run with: npm run validate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const file = join(root, 'data', 'spaces.json');

const ACCESS = new Set(['free', 'paid', 'restricted']);
const VENUE = new Set(['makerspace', 'library', 'university', 'corporate', 'studio', 'community']);
const EQUIPMENT = new Set([
  '3d-printing', 'laser-cutting', 'cnc-machining', 'woodworking', 'metalworking', 'welding',
  'electronics', 'textiles', 'sewing', 'embroidery', 'ceramics', 'printmaking', 'jewelry',
  'glass', 'vinyl-cutting', 'large-format-printing', 'photography', 'av-media', 'computers',
  'bikes', 'casting', 'robotics', 'prototyping',
]);

const REQUIRED_STRINGS = ['id', 'name', 'accessSummary', 'address', 'city', 'state', 'website', 'description', 'lastVerified'];
const NULLABLE_STRINGS = ['accessUrl', 'affiliation', 'eligibility', 'googleMapsUrl', 'foundedNote', 'hours', 'hoursUrl', 'equipmentUrl', 'phone', 'email'];

const errors = [];
const err = (id, msg) => errors.push(`[${id}] ${msg}`);

let spaces;
try {
  spaces = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`Could not parse ${file}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(spaces)) {
  console.error('data/spaces.json must be a JSON array');
  process.exit(1);
}

const ids = new Set();
for (const s of spaces) {
  const id = s?.id ?? '(missing id)';
  if (typeof s !== 'object' || s === null) { err(id, 'entry is not an object'); continue; }
  if (ids.has(id)) err(id, 'duplicate id');
  ids.add(id);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(s.id))) err(id, 'id must be kebab-case');

  for (const k of REQUIRED_STRINGS) {
    if (typeof s[k] !== 'string' || !s[k].trim()) err(id, `${k} must be a non-empty string`);
  }
  for (const k of NULLABLE_STRINGS) {
    if (!(k in s)) err(id, `${k} is missing (use null if unknown)`);
    else if (s[k] !== null && typeof s[k] !== 'string') err(id, `${k} must be a string or null`);
  }
  if (!ACCESS.has(s.access)) err(id, `access must be one of ${[...ACCESS].join(', ')}`);
  if (!VENUE.has(s.venueType)) err(id, `venueType must be one of ${[...VENUE].join(', ')}`);
  if (s.access === 'restricted' && !s.affiliation) err(id, 'restricted spaces need an affiliation');

  if (typeof s.lat !== 'number' || s.lat < -90 || s.lat > 90) err(id, 'lat must be a number in [-90, 90]');
  if (typeof s.lng !== 'number' || s.lng < -180 || s.lng > 180) err(id, 'lng must be a number in [-180, 180]');

  if (!('founded' in s)) err(id, 'founded is missing (use null if unknown)');
  else if (s.founded !== null && (!Number.isInteger(s.founded) || s.founded < 1800 || s.founded > 2100)) err(id, 'founded must be a 4-digit year or null');

  if (!Array.isArray(s.equipmentCategories)) err(id, 'equipmentCategories must be an array');
  else for (const c of s.equipmentCategories) if (!EQUIPMENT.has(c)) err(id, `unknown equipment category "${c}"`);
  if (!Array.isArray(s.equipment) || s.equipment.some((e) => typeof e !== 'string')) err(id, 'equipment must be an array of strings');
  if (!Array.isArray(s.sources) || s.sources.length === 0) err(id, 'sources must be a non-empty array of URLs');

  for (const k of ['website', 'accessUrl', 'googleMapsUrl', 'hoursUrl', 'equipmentUrl']) {
    if (typeof s[k] === 'string' && !/^https?:\/\//.test(s[k])) err(id, `${k} must start with http(s)://`);
  }
  if (typeof s.lastVerified === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(s.lastVerified)) err(id, 'lastVerified must be YYYY-MM-DD');
}

if (errors.length) {
  console.error(`data/spaces.json has ${errors.length} problem(s):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`data/spaces.json OK: ${spaces.length} space(s)`);
