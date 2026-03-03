/**
 * fetchSaints.js
 * Queries Wikidata SPARQL for Catholic saints → saints_fetched.json
 *
 * Usage:
 *   node scripts/fetchSaints.js
 *   node scripts/fetchSaints.js --limit 200 --offset 0
 */

const fs   = require('fs');
const path = require('path');

const args     = process.argv.slice(2);
const getArg   = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : def; };
const LIMIT    = parseInt(getArg('--limit',  '300'), 10);
const OFFSET   = parseInt(getArg('--offset', '0'),   10);

// ── SPARQL ────────────────────────────────────────────────────────────────────
const SPARQL = `
SELECT DISTINCT
  ?item ?itemLabel ?itemDescription
  ?birthDate ?deathDate ?image ?countryLabel ?article
  (GROUP_CONCAT(DISTINCT ?patronOfLabel;  separator="|||") AS ?patronOfs)
  (GROUP_CONCAT(DISTINCT ?categoryLabel; separator="|||") AS ?categoryLabels)
WHERE {
  ?item wdt:P31  wd:Q5    .
  ?item wdt:P140 wd:Q9592 .
  ?item wdt:P570 ?deathDate .
  ?item wdt:P2632 ?patronOf .
  ?patronOf rdfs:label ?patronOfLabel.
  FILTER(LANG(?patronOfLabel) = "en")
  OPTIONAL { ?item wdt:P569 ?birthDate. }
  OPTIONAL { ?item wdt:P18  ?image. }
  OPTIONAL {
    ?item wdt:P27 ?country.
    ?country rdfs:label ?countryLabel.
    FILTER(LANG(?countryLabel) = "en")
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
         ?image ?countryLabel ?article
ORDER BY ?birthDate
LIMIT  ${LIMIT}
OFFSET ${OFFSET}
`;

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

function transform(row, id) {
  const name        = row.itemLabel?.value      || 'Unknown Saint';
  const description = row.itemDescription?.value || '';
  const birthYear   = parseYear(row.birthDate?.value);
  const deathYear   = parseYear(row.deathDate?.value);
  const image       = row.image?.value          || null;
  const country     = row.countryLabel?.value   || null;
  const feastDay    = row.feastDayLabel?.value  || null;
  const wikidataId  = row.item?.value?.split('/').pop() || null;
  const wikipedia   = row.article?.value        || null;

  const patronOf   = splitGroup(row.patronOfs?.value);
  const rawCats    = splitGroup(row.categoryLabels?.value);
  const categories = mapCategories(rawCats);
  const rawQuotes  = splitGroup(row.quotes?.value);
  const quotes     = rawQuotes.map(q => `"${q}"`).slice(0, 3);

  const summary = description
    ? description.charAt(0).toUpperCase() + description.slice(1) + '.'
    : `${name}, venerated saint of the Catholic Church.`;

  return {
    id,
    name,
    birthYear,
    deathYear,
    feastDay,
    region:  regionFromCountry(country),
    era:     eraFromYear(deathYear),
    categories,
    patronOf,
    image,
    summary,
    biography:      description || null,
    pathToSainthood: null,
    miracles:        [],
    martyrdom:       null,
    symbols:         [],
    quotes,
    _meta: { wikidataId, wikipedia, country },
  };
}

function deduplicate(saints) {
  const seen = new Set();
  return saints.filter(s => {
    const key = s.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const url    = 'https://query.wikidata.org/sparql';
    const params = new URLSearchParams({ query: SPARQL, format: 'json' });
    console.log(`Querying Wikidata (limit=${LIMIT}, offset=${OFFSET})...`);

    console.log('Query URL:', `${url}?${params}`.slice(0, 500));

    const res = await fetch(`${url}?${params}`, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'CatholicSaintExplorer/1.0 (educational project)',
      },
    });
    

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const text = await res.text();
    console.log('Raw response preview:', text.slice(0, 300));
    const json = JSON.parse(text);


    const rows   = json.results.bindings;
    console.log(`Received ${rows.length} rows.`);

    const saints = rows.map((row, i) => transform(row, OFFSET + i + 1));
    const unique = deduplicate(saints);
    console.log(`${unique.length} unique saints after deduplication.`);

    // Quality filter — keep saints with meaningful data
    const quality = unique.filter(s =>
    s.patronOf.length > 0 ||
    s.biography ||
    s._meta.wikipedia
    );
    console.log(`${quality.length} saints passed quality filter (patronOf OR biography OR wikipedia).`);

    // Breakdown stats
    console.log(`\nBreakdown by era:`);
    const eraCounts = quality.reduce((acc, s) => { acc[s.era] = (acc[s.era] || 0) + 1; return acc; }, {});
    Object.entries(eraCounts).sort((a,b) => a[0].localeCompare(b[0])).forEach(([era, count]) => console.log(`  ${era}: ${count}`));

    console.log(`\nBreakdown by region:`);
    const regionCounts = quality.reduce((acc, s) => { acc[s.region] = (acc[s.region] || 0) + 1; return acc; }, {});
    Object.entries(regionCounts).sort((a,b) => b[1]-a[1]).forEach(([region, count]) => console.log(`  ${region}: ${count}`));

    console.log(`\nWith images:    ${quality.filter(s => s.image).length}`);
    console.log(`With patronOf:  ${quality.filter(s => s.patronOf.length).length}`);
    console.log(`With biography: ${quality.filter(s => s.biography).length}`);
    console.log(`With wikipedia: ${quality.filter(s => s._meta.wikipedia).length}`);

    const outPath = path.join(__dirname, 'saints_fetched.json');
    fs.writeFileSync(outPath, JSON.stringify(quality, null, 2), 'utf8');
    console.log(`\nWritten → ${outPath}`);
    console.log(`Next: node scripts/mergeSaints.js`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();