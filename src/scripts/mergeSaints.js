/**
 * mergeSaints.js
 * Merges saints_fetched.json into src/data/saints.js
 * starting IDs at 61, skipping any names already in the existing file.
 *
 * Usage:
 *   node scripts/mergeSaints.js
 *   node scripts/mergeSaints.js --dry-run   (preview only, no write)
 */

const fs   = require('fs');
const path = require('path');

const DRY_RUN    = process.argv.includes('--dry-run');
const SAINTS_JS  = path.join(__dirname, '../../src/data/saints.js');
const FETCHED = path.join(__dirname, 'saints_fetched.json');

// ── Load existing saints.js and extract existing names ────────────────────────
function loadExistingNames(saintsJsPath) {
  const content = fs.readFileSync(saintsJsPath, 'utf8');
  const names   = new Set();
  // Match every `name: 'St. ...'` or `name: "St. ..."` line
  const matches = content.matchAll(/name:\s*['"](.+?)['"]/g);
  for (const m of matches) names.add(m[1].toLowerCase().trim());
  return names;
}

// ── Find the highest existing id ──────────────────────────────────────────────
function findMaxId(saintsJsPath) {
  const content = fs.readFileSync(saintsJsPath, 'utf8');
  const matches = [...content.matchAll(/id:\s*(\d+)/g)];
  if (!matches.length) return 60;
  return Math.max(...matches.map(m => parseInt(m[1], 10)));
}

// ── Format a single saint object as JS source ─────────────────────────────────
function formatSaint(s) {
  const esc  = str => (str || '').replace(/'/g, "\\'");
  const arr  = (a)  => a && a.length
    ? `[${a.map(x => `'${esc(x)}'`).join(', ')}]`
    : '[]';
  const str  = (v)  => v ? `'${esc(v)}'` : 'null';
  const num  = (v)  => v != null ? v : 'null';

  return `  {
    id: ${s.id},
    name: ${str(s.name)},
    birthYear: ${num(s.birthYear)},
    deathYear: ${num(s.deathYear)},
    feastDay: ${str(s.feastDay)},
    region: ${str(s.region)},
    era: ${str(s.era)},
    categories: ${arr(s.categories)},
    patronOf: ${arr(s.patronOf)},
    image: ${str(s.image)},
    summary: ${str(s.summary)},
    biography: ${str(s.biography)},
    pathToSainthood: ${str(s.pathToSainthood)},
    miracles: ${arr(s.miracles)},
    martyrdom: ${str(s.martyrdom)},
    symbols: ${arr(s.symbols)},
    quotes: ${arr(s.quotes)},
  }`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(FETCHED)) {
    console.error(`saints_fetched.json not found. Run fetchSaints.js first.`);
    process.exit(1);
  }

  if (!fs.existsSync(SAINTS_JS)) {
    console.error(`saints.js not found at ${SAINTS_JS}`);
    process.exit(1);
  }

  const fetched       = JSON.parse(fs.readFileSync(FETCHED, 'utf8'));
  const existingNames = loadExistingNames(SAINTS_JS);
  let   nextId        = findMaxId(SAINTS_JS) + 1;

  console.log(`Existing saints.js has ${existingNames.size} names, max id=${nextId - 1}`);
  console.log(`Fetched file has ${fetched.length} saints.`);

  // Filter out saints already in the file by name
  const newSaints = fetched
    .filter(s => {
      const key = s.name.toLowerCase().trim();
      if (existingNames.has(key)) {
        console.log(`  SKIP (duplicate): ${s.name}`);
        return false;
      }
      return true;
    })
    .map(s => ({ ...s, id: nextId++, _meta: undefined }));

  console.log(`\n${newSaints.length} new saints to add (starting at id ${nextId - newSaints.length}).`);

  if (DRY_RUN) {
    console.log('\n-- DRY RUN -- first 3 entries preview:');
    newSaints.slice(0, 3).forEach(s => console.log(formatSaint(s)));
    return;
  }

  if (!newSaints.length) {
    console.log('Nothing new to add.');
    return;
  }

  // Find the closing `];` of the saints array and insert before it
  let content = fs.readFileSync(SAINTS_JS, 'utf8');

  // Find last `},` or `}` before `];`
  const insertPoint = content.lastIndexOf('];');
  if (insertPoint === -1) {
    console.error('Could not find `];` in saints.js — is the file structured correctly?');
    process.exit(1);
  }

  const newEntries = newSaints.map(formatSaint).join(',\n') + ',\n';
  const updated    = content.slice(0, insertPoint) + newEntries + content.slice(insertPoint);

  // Backup original
  fs.writeFileSync(SAINTS_JS + '.bak', content, 'utf8');
  console.log(`Backup saved → saints.js.bak`);

  fs.writeFileSync(SAINTS_JS, updated, 'utf8');
  console.log(`saints.js updated with ${newSaints.length} new saints.`);
  console.log(`Total saints now: ${existingNames.size + newSaints.length}`);
}

main();