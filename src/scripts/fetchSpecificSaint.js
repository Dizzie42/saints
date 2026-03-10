/**
 * fetchSpecificSaint.js
 * Searches Wikidata for one or more Catholic saints by name, writes ALL
 * results to saints_fetched.json, then runs enrichSaints.js + mergeSaints.js
 * so every saint appears in the app immediately.
 *
 * Usage (single):
 *   node scripts/fetchSpecificSaint.js "Veronica"
 *
 * Usage (multiple — separate names with commas OR pass multiple quoted args):
 *   node scripts/fetchSpecificSaint.js "Virgin Mary" "Michael the Archangel" "Joseph"
 *   node scripts/fetchSpecificSaint.js "Veronica,Joseph,Therese of Lisieux"
 *
 * Flags:
 *   --dry-run    Preview results only, nothing written or merged
 *   --no-merge   Write saints_fetched.json but skip enrich + merge
 *   --delay N    Milliseconds between Wikidata requests (default 600)
 */

const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');

// ── Parse args ────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const NO_MERGE = args.includes('--no-merge');
const delayIdx = args.indexOf('--delay');
const DELAY    = delayIdx !== -1 && args[delayIdx + 1] ? parseInt(args[delayIdx + 1], 10) : 600;

// Collect all non-flag args, then split any comma-separated values
const rawNames = args
  .filter(a => !a.startsWith('--') && !/^\d+$/.test(a) || (delayIdx !== -1 && a === args[delayIdx + 1] ? false : !a.startsWith('--')))
  .filter(a => !a.startsWith('--') && a !== String(DELAY));

// Flatten comma-separated input: "Mary,Joseph" → ["Mary", "Joseph"]
const searchNames = rawNames
  .flatMap(n => n.split(','))
  .map(n => n.trim())
  .filter(Boolean);

if (!searchNames.length) {
  console.error('Usage: node fetchSpecificSaint.js "Name1" "Name2" ... [--dry-run] [--no-merge] [--delay ms]');
  process.exit(1);
}

// ── Paths ─────────────────────────────────────────────────────────────────────
const SCRIPTS_DIR = __dirname;
const FETCHED     = path.join(SCRIPTS_DIR, 'saints_fetched.json');
const ENRICH      = path.join(SCRIPTS_DIR, 'enrichSaints.js');
const MERGE       = path.join(SCRIPTS_DIR, 'mergeSaints.js');

console.log(`\n🔍 Saints to fetch: ${searchNames.map(n => `"${n}"`).join(', ')}`);
console.log(`   Delay between requests: ${DELAY}ms\n`);

// ── SPARQL builder ────────────────────────────────────────────────────────────
function buildSPARQL(nameVariant) {
  const escaped = nameVariant.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `
SELECT DISTINCT
  ?item ?itemLabel ?itemDescription
  ?birthDate ?deathDate ?image ?countryLabel ?article
  ?feastDayLabel
  (GROUP_CONCAT(DISTINCT ?patronOfLabel;  separator="|||") AS ?patronOfs)
  (GROUP_CONCAT(DISTINCT ?categoryLabel; separator="|||") AS ?categoryLabels)
WHERE {
  ?item wdt:P31  wd:Q5 .
  ?item wdt:P140 wd:Q9592 .

  ?item rdfs:label ?label .
  FILTER(LANG(?label) = "en")
  FILTER(CONTAINS(LCASE(?label), LCASE("${escaped}")))

  OPTIONAL { ?item wdt:P569 ?birthDate. }
  OPTIONAL { ?item wdt:P570 ?deathDate. }
  OPTIONAL { ?item wdt:P18  ?image. }
  OPTIONAL {
    ?item wdt:P27 ?country.
    ?country rdfs:label ?countryLabel.
    FILTER(LANG(?countryLabel) = "en")
  }
  OPTIONAL {
    ?item wdt:P2632 ?patronOf.
    ?patronOf rdfs:label ?patronOfLabel.
    FILTER(LANG(?patronOfLabel) = "en")
  }
  OPTIONAL {
    ?item wdt:P106 ?category.
    ?category rdfs:label ?categoryLabel.
    FILTER(LANG(?categoryLabel) = "en")
  }
  OPTIONAL {
    ?article schema:about ?item;
             schema:inLanguage "en";
             schema:isPartOf <https://en.wikipedia.org/>.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?itemDescription ?birthDate ?deathDate
         ?image ?countryLabel ?article ?feastDayLabel
ORDER BY ?itemLabel
LIMIT 20
`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const REGION_MAP = {
  'Italy':'Europe','France':'Europe','Germany':'Europe','Spain':'Europe',
  'England':'Europe','Ireland':'Europe','Scotland':'Europe','Poland':'Europe',
  'Portugal':'Europe','Netherlands':'Europe','Belgium':'Europe','Austria':'Europe',
  'Switzerland':'Europe','Hungary':'Europe','Czech Republic':'Europe',
  'Croatia':'Europe','Russia':'Europe','Ukraine':'Europe','Sweden':'Europe',
  'Norway':'Europe','Denmark':'Europe','Greece':'Europe','Romania':'Europe',
  'Slovakia':'Europe','Serbia':'Europe','Lithuania':'Europe',
  'Syria':'Middle East','Palestine':'Middle East','Israel':'Middle East',
  'Turkey':'Middle East','Lebanon':'Middle East','Iraq':'Middle East',
  'Egypt':'Africa','Ethiopia':'Africa','Algeria':'Africa','Tunisia':'Africa',
  'Morocco':'Africa','Uganda':'Africa','Nigeria':'Africa','Congo':'Africa',
  'Rwanda':'Africa','Tanzania':'Africa',
  'India':'Asia','Japan':'Asia','China':'Asia','Vietnam':'Asia',
  'Korea':'Asia','Philippines':'Asia','Indonesia':'Asia',
  'Mexico':'Americas','Peru':'Americas','Brazil':'Americas',
  'Colombia':'Americas','Argentina':'Americas',
  'United States':'Americas','Canada':'Americas',
};

const CATEGORY_KEYWORDS = {
  'pope':'Pope','bishop':'Bishop','archbishop':'Bishop',
  'priest':'Priest','friar':'Friar','monk':'Monk','nun':'Nun',
  'abbess':'Abbess','abbot':'Abbot','martyr':'Martyr',
  'virgin':'Virgin','confessor':'Confessor','mystic':'Mystic',
  'theologian':'Theologian','philosopher':'Philosopher',
  'missionary':'Missionary','apostle':'Apostle','evangelist':'Evangelist',
  'king':'King','queen':'Queen','deacon':'Deacon','hermit':'Hermit',
  'founder':'Founder','doctor of the church':'Doctor of the Church',
  'soldier':'Soldier','widow':'Widow','layperson':'Layperson',
};

function regionFromCountry(c) {
  if (!c) return 'Europe';
  for (const [k, v] of Object.entries(REGION_MAP)) { if (c.includes(k)) return v; }
  return 'Europe';
}

function eraFromYear(y) {
  if (!y || isNaN(y)) return 'Unknown';
  if (y <= 150)  return 'Apostolic';
  if (y <= 600)  return 'Early Church';
  if (y <= 1400) return 'Medieval';
  if (y <= 1700) return 'Early Modern';
  if (y <= 1900) return 'Modern';
  return 'Contemporary';
}

function splitGroup(str) {
  if (!str) return [];
  return [...new Set(str.split('|||').map(s => s.trim()).filter(s => s && s.length < 80))];
}

function parseYear(d) {
  if (!d) return null;
  const m = d.match(/^(-?\d+)/);
  return m ? (parseInt(m[1], 10) || null) : null;
}

function mapCategories(rawLabels) {
  const out = new Set();
  for (const label of rawLabels) {
    const lower = label.toLowerCase();
    for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
      if (lower.includes(kw)) out.add(cat);
    }
  }
  return out.size ? [...out] : ['Confessor'];
}

function wikimediaThumbnail(url, size = 600) {
  if (!url || !url.includes('upload.wikimedia.org')) return url;
  const parts    = url.split('/');
  const fileName = parts.pop();
  const hash2    = parts[parts.length - 1];
  const hash1    = parts[parts.length - 2];
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash1}/${hash2}/${fileName}/${size}px-${fileName}`;
}

function transform(row, id) {
  const name        = row.itemLabel?.value       || 'Unknown Saint';
  const description = row.itemDescription?.value || '';
  const birthYear   = parseYear(row.birthDate?.value);
  const deathYear   = parseYear(row.deathDate?.value);
  const image       = wikimediaThumbnail(row.image?.value || null, 600);
  const country     = row.countryLabel?.value    || null;
  const feastDay    = row.feastDayLabel?.value   || null;
  const wikidataId  = row.item?.value?.split('/').pop() || null;
  const wikipedia   = row.article?.value         || null;

  const patronOf   = splitGroup(row.patronOfs?.value);
  const rawCats    = splitGroup(row.categoryLabels?.value);
  const categories = mapCategories(rawCats);

  const summary = description
    ? description.charAt(0).toUpperCase() + description.slice(1) + '.'
    : `${name}, venerated saint of the Catholic Church.`;

  return {
    id,
    name,
    birthYear,
    deathYear,
    feastDay,
    region:          regionFromCountry(country),
    era:             eraFromYear(deathYear),
    categories,
    patronOf,
    image,
    summary,
    biography:       description || null,
    pathToSainthood: null,
    miracles:        [],
    martyrdom:       null,
    symbols:         [],
    quotes:          [],
    _meta: { wikidataId, wikipedia, country },
  };
}

// ── Query runner ──────────────────────────────────────────────────────────────
async function querySPARQL(sparql) {
  const url    = 'https://query.wikidata.org/sparql';
  const params = new URLSearchParams({ query: sparql, format: 'json' });
  const res    = await fetch(`${url}?${params}`, {
    headers: {
      'Accept':     'application/sparql-results+json',
      'User-Agent': 'CatholicSaintExplorer/1.0 (educational project)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return JSON.parse(await res.text()).results.bindings;
}

// ── Name variants (strip St./Saint prefixes) ──────────────────────────────────
function nameVariants(input) {
  const base     = input.trim();
  const stripped = base
    .replace(/^saints?\s+/i, '')
    .replace(/^st\.\s*/i,    '')
    .replace(/^st\s+/i,      '')
    .trim();
  const variants = [base];
  if (stripped.toLowerCase() !== base.toLowerCase()) variants.push(stripped);
  return [...new Set(variants)];
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Fetch all rows for a single search name ───────────────────────────────────
async function fetchForName(searchName) {
  const variants = nameVariants(searchName);
  let allRows = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    console.log(`  Querying: "${variant}"...`);
    const rows = await querySPARQL(buildSPARQL(variant));
    console.log(`    → ${rows.length} result(s)`);
    allRows = allRows.concat(rows);
    if (i < variants.length - 1) await sleep(DELAY);
  }

  // Deduplicate by Wikidata item ID
  const seenIds = new Set();
  return allRows.filter(row => {
    const id = row.item?.value;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
}

// ── Pipeline step runner ──────────────────────────────────────────────────────
function runStep(label, cmd) {
  console.log(`\n[${label}]\n  ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8' });
    console.log(out.trim());
  } catch (err) {
    console.error(`  ✗ ${label} failed: ${err.message}`);
    console.log('  Continuing...');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const allUniqueRows = [];
    const globalSeenIds = new Set();

    // ── Step 1: Fetch each name, cross-deduplicate ──────────────────────────
    for (let i = 0; i < searchNames.length; i++) {
      const name = searchNames[i];
      console.log(`\n[${ i + 1 }/${ searchNames.length }] Searching for "${name}"...`);

      const rows = await fetchForName(name);

      // Cross-query deduplication (e.g. "Mary" and "Virgin Mary" returning same entity)
      const fresh = rows.filter(row => {
        const id = row.item?.value;
        if (globalSeenIds.has(id)) return false;
        globalSeenIds.add(id);
        return true;
      });

      console.log(`  ✓ ${fresh.length} unique result(s) for "${name}"`);
      allUniqueRows.push(...fresh);

      // Polite delay between separate name searches
      if (i < searchNames.length - 1) await sleep(DELAY);
    }

    if (!allUniqueRows.length) {
      console.log('\nNo results found for any of the names provided.');
      console.log('Tips: use common English names (e.g. "Francis" not "Francesco").');
      process.exit(0);
    }

    const saints = allUniqueRows.map((row, i) => transform(row, i + 1));

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(45)}`);
    console.log(`Total: ${saints.length} saint(s) found across ${searchNames.length} search(es)`);
    console.log('─'.repeat(45));
    saints.forEach((s, i) => {
      console.log(`\n[${i + 1}] ${s.name}`);
      console.log(`    Wikidata:   ${s._meta.wikidataId}`);
      console.log(`    Wikipedia:  ${s._meta.wikipedia || 'none'}`);
      console.log(`    Born/Died:  ${s.birthYear ?? '?'} → ${s.deathYear ?? '?'}`);
      console.log(`    Era:        ${s.era}  |  Region: ${s.region}`);
      console.log(`    Categories: ${s.categories.join(', ')}`);
      console.log(`    Feast Day:  ${s.feastDay || 'unknown'}`);
      console.log(`    Patron of:  ${
        s.patronOf.length
          ? s.patronOf.slice(0, 5).join(', ') + (s.patronOf.length > 5 ? ` (+${s.patronOf.length - 5} more)` : '')
          : 'none listed'
      }`);
      console.log(`    Image:      ${s.image ? '✓' : '✗'}`);
      console.log(`    Summary:    ${s.summary.slice(0, 110)}...`);
    });
    console.log('\n' + '─'.repeat(45));

    if (DRY_RUN) {
      console.log('\n-- DRY RUN: nothing written, pipeline not run.');
      return;
    }

    // ── Step 2: Write saints_fetched.json ───────────────────────────────────
    fs.writeFileSync(FETCHED, JSON.stringify(saints, null, 2), 'utf8');
    console.log(`\nWritten → ${FETCHED}  (${saints.length} saints)`);

    if (NO_MERGE) {
      console.log('--no-merge: run enrichSaints.js + mergeSaints.js manually when ready.');
      return;
    }

    // ── Step 3: Enrich ──────────────────────────────────────────────────────
    if (fs.existsSync(ENRICH)) {
      runStep('2/3 Enrich', `node "${ENRICH}" --delay 300`);
    } else {
      console.log('\n[2/3 Enrich] enrichSaints.js not found — skipping.');
    }

    // ── Step 4: Merge into saints.js ────────────────────────────────────────
    runStep('3/3 Merge', `node "${MERGE}"`);

    console.log(`\n✓ Done! ${saints.length} saint(s) processed. Restart your dev server to see them in the app.`);

  } catch (err) {
    console.error('\nError:', err.message);
    process.exit(1);
  }
}

main();