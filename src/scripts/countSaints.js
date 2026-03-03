// Results as of 3/3/2026:
//
//  Catholic Saints — Wikidata Count Report
//  ──────────────────────────────────────────────────
//    Total saints (any data)             69301
//    With patronOf                       595
//    With English description            56151
//    With Wikipedia article              24915
//    Quality (patron OR desc OR wiki)    56867
//  ──────────────────────────────────────────────────
//    Quality saints as % of total:          82.1%
//    Estimated batches needed (500/batch):  114


const SPARQL_TOTAL = `
SELECT (COUNT(DISTINCT ?item) AS ?total)
WHERE {
  ?item wdt:P31  wd:Q5    .
  ?item wdt:P140 wd:Q9592 .
  ?item wdt:P570 ?deathDate .
}
`;

const SPARQL_WITH_PATRON = `
SELECT (COUNT(DISTINCT ?item) AS ?total)
WHERE {
  ?item wdt:P31   wd:Q5    .
  ?item wdt:P140  wd:Q9592 .
  ?item wdt:P570  ?deathDate .
  ?item wdt:P2632 ?patronOf .
}
`;

const SPARQL_WITH_DESCRIPTION = `
SELECT (COUNT(DISTINCT ?item) AS ?total)
WHERE {
  ?item wdt:P31  wd:Q5    .
  ?item wdt:P140 wd:Q9592 .
  ?item wdt:P570 ?deathDate .
  ?item schema:description ?desc .
  FILTER(LANG(?desc) = "en")
}
`;

const SPARQL_WITH_WIKIPEDIA = `
SELECT (COUNT(DISTINCT ?item) AS ?total)
WHERE {
  ?item wdt:P31  wd:Q5    .
  ?item wdt:P140 wd:Q9592 .
  ?item wdt:P570 ?deathDate .
  ?article schema:about ?item;
           schema:inLanguage "en";
           schema:isPartOf <https://en.wikipedia.org/>.
}
`;

const SPARQL_QUALITY = `
SELECT (COUNT(DISTINCT ?item) AS ?total)
WHERE {
  ?item wdt:P31  wd:Q5    .
  ?item wdt:P140 wd:Q9592 .
  ?item wdt:P570 ?deathDate .
  {
    ?item wdt:P2632 ?patronOf .
  } UNION {
    ?item schema:description ?desc .
    FILTER(LANG(?desc) = "en")
  } UNION {
    ?article schema:about ?item;
             schema:inLanguage "en";
             schema:isPartOf <https://en.wikipedia.org/>.
  }
}
`;

async function runQuery(label, sparql) {
  const url    = 'https://query.wikidata.org/sparql';
  const params = new URLSearchParams({ query: sparql, format: 'json' });
  const res    = await fetch(`${url}?${params}`, {
    headers: {
      'Accept': 'application/sparql-results+json',
      'User-Agent': 'CatholicSaintExplorer/1.0',
    },
  });
  const json  = await res.json();
  const total = json.results.bindings[0]?.total?.value || '?';
  console.log(`  ${label.padEnd(35)} ${total}`);
  return parseInt(total, 10);
}

async function main() {
  console.log('\nCatholic Saints — Wikidata Count Report');
  console.log('─'.repeat(50));
  const total    = await runQuery('Total saints (any data)',      SPARQL_TOTAL);
  const patron   = await runQuery('With patronOf',               SPARQL_WITH_PATRON);
  const desc     = await runQuery('With English description',    SPARQL_WITH_DESCRIPTION);
  const wiki     = await runQuery('With Wikipedia article',      SPARQL_WITH_WIKIPEDIA);
  const quality  = await runQuery('Quality (patron OR desc OR wiki)', SPARQL_QUALITY);
  console.log('─'.repeat(50));
  console.log(`  Quality saints as % of total:          ${((quality/total)*100).toFixed(1)}%`);
  console.log(`  Estimated batches needed (500/batch):  ${Math.ceil(quality/500)}\n`);
}

main();