/**
 * enrichSaints.js
 * Takes saints_fetched.json and enriches each saint
 * with patronOf and categories from Wikidata one by one.
 *
 * Usage:
 *   node .\src\scripts\enrichSaints.js
 *   node .\src\scripts\enrichSaints.js --start 50   (resume from index 50)
 */

const fs   = require('fs');
const path = require('path');

const args     = process.argv.slice(2);
const getArg   = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : def; };
const START    = parseInt(getArg('--start', '0'), 10);
const DELAY_MS = parseInt(getArg('--delay', '300'), 10);

const FETCHED  = path.join(__dirname, 'saints_fetched.json');

async function enrichSaint(wikidataId) {
  const SPARQL = `
SELECT DISTINCT
  (GROUP_CONCAT(DISTINCT ?patronOfLabel;  separator="|||") AS ?patronOfs)
  (GROUP_CONCAT(DISTINCT ?categoryLabel; separator="|||") AS ?categoryLabels)
WHERE {
  BIND(wd:${wikidataId} AS ?item)
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
}
GROUP BY ?item
  `;

  const url    = 'https://query.wikidata.org/sparql';
  const params = new URLSearchParams({ query: SPARQL, format: 'json' });

  const res  = await fetch(`${url}?${params}`, {
    headers: {
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'CatholicSaintExplorer/1.0',
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const row  = json.results.bindings[0];
  if (!row) return { patronOf: [], categories: [] };

  const splitGroup = str => str
    ? [...new Set(str.split('|||').map(s => s.trim()).filter(s => s && s.length < 80))]
    : [];

  return {
    patronOf:   splitGroup(row.patronOfs?.value),
    categories: splitGroup(row.categoryLabels?.value),
  };
}

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

async function main() {
  if (!fs.existsSync(FETCHED)) {
    console.error('saints_fetched.json not found. Run fetchSaints.js first.');
    process.exit(1);
  }

  const saints = JSON.parse(fs.readFileSync(FETCHED, 'utf8'));
  console.log(`Enriching ${saints.length} saints starting from index ${START}...`);
  console.log(`Delay between requests: ${DELAY_MS}ms\n`);

  for (let i = START; i < saints.length; i++) {
    const saint = saints[i];
    const id    = saint._meta?.wikidataId;

    if (!id) {
      console.log(`[${i+1}/${saints.length}] SKIP ${saint.name} — no wikidataId`);
      continue;
    }

    try {
      const enriched = await enrichSaint(id);
      saint.patronOf   = enriched.patronOf;
      saint.categories = mapCategories(enriched.categories);

      const hasData = enriched.patronOf.length > 0 || enriched.categories.length > 0;
      console.log(`[${i+1}/${saints.length}] ${saint.name} — patronOf: ${enriched.patronOf.length}, cats: ${enriched.categories.length} ${hasData ? '✓' : ''}`);

      // Save progress every 10 saints so we can resume if it crashes
      if (i % 10 === 0) {
        fs.writeFileSync(FETCHED, JSON.stringify(saints, null, 2), 'utf8');
        console.log(`  → Progress saved at index ${i}`);
      }
    } catch (err) {
      console.error(`[${i+1}/${saints.length}] ERROR ${saint.name}: ${err.message}`);
      console.log('  Waiting 5s before continuing...');
      await new Promise(r => setTimeout(r, 5000));
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // Final save
  fs.writeFileSync(FETCHED, JSON.stringify(saints, null, 2), 'utf8');
  console.log(`\nEnrichment complete. saints_fetched.json updated.`);
  console.log(`Saints with patronOf: ${saints.filter(s => s.patronOf.length).length}`);
  console.log(`\nNext: node scripts/mergeSaints.js`);
}

main();