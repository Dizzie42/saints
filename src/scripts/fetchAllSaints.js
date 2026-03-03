/**
 * fetchAllSaints.js
 * Runs fetch → enrich → merge in batches automatically.
 *
 * Usage:
 *   node .\src\scripts\fetchAllSaints.js
 *   node .\src\scripts\fetchAllSaints.js --batch 50 --start 0
 */

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const args    = process.argv.slice(2);
const getArg  = (flag, def) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : def; };
const BATCH   = parseInt(getArg('--batch', '50'),  10);
const START   = parseInt(getArg('--start', '0'),   10);
const MAX_EMPTY = 3;

const FETCH   = path.join(__dirname, 'fetchSaints.js');
const ENRICH  = path.join(__dirname, 'enrichSaints.js');
const MERGE   = path.join(__dirname, 'mergeSaints.js');
const FETCHED = path.join(__dirname, 'saints_fetched.json');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  let offset     = START;
  let emptyCount = 0;
  let totalAdded = 0;
  let batch      = 1;

  console.log(`\nStarting full batch run — batch size: ${BATCH}, starting offset: ${START}`);
  console.log('─'.repeat(55));

  while (emptyCount < MAX_EMPTY) {
    console.log(`\n═══ Batch ${batch} (offset ${offset}) ═══`);

    // ── Step 1: Fetch ──────────────────────────────────────
    try {
      console.log(`[1/3] Fetching ${BATCH} saints from Wikidata...`);
      const fetchOut = run(`node "${FETCH}" --limit ${BATCH} --offset ${offset}`);
      console.log(fetchOut.trim());

      // Check if anything came back
      const fetched = fs.existsSync(FETCHED)
        ? JSON.parse(fs.readFileSync(FETCHED, 'utf8'))
        : [];

      if (!fetched.length) {
        emptyCount++;
        console.log(`Empty batch (${emptyCount}/${MAX_EMPTY}).`);
        offset += BATCH;
        batch++;
        continue;
      }

      emptyCount = 0;
    } catch (err) {
      console.error(`Fetch error: ${err.message}`);
      console.log('Waiting 10s before retry...');
      await sleep(10000);
      continue;
    }

    // ── Step 2: Enrich ─────────────────────────────────────
    try {
      console.log(`[2/3] Enriching with patronOf and categories...`);
      const enrichOut = run(`node "${ENRICH}" --delay 300`);
      console.log(enrichOut.trim());
    } catch (err) {
      console.error(`Enrich error: ${err.message}`);
      console.log('Continuing to merge with whatever was enriched...');
    }

    // ── Step 3: Merge ──────────────────────────────────────
    try {
      console.log(`[3/3] Merging into saints.js...`);
      const mergeOut = run(`node "${MERGE}"`);
      console.log(mergeOut.trim());

      const match = mergeOut.match(/(\d+) new saints to add/);
      const added = match ? parseInt(match[1], 10) : 0;
      totalAdded += added;
      console.log(`✓ Batch ${batch} done — added ${added} saints (running total: ${totalAdded})`);
    } catch (err) {
      console.error(`Merge error: ${err.message}`);
    }

    // ── Pause between batches ──────────────────────────────
    console.log(`Waiting 5s before next batch...`);
    await sleep(5000);

    offset += BATCH;
    batch++;
  }

  console.log('\n' + '─'.repeat(55));
  console.log(`All done! Total new saints added: ${totalAdded}`);
}

main();