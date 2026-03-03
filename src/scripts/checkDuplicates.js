/**
 * checkDuplicates.js
 * Scans saints.js for duplicate names and reports them.
 *
 * Usage:
 *   node .\src\scripts\checkDuplicates.js
 *   node .\src\scripts\checkDuplicates.js --fix   (removes duplicates, keeps first occurrence)
 */

const fs   = require('fs');
const path = require('path');

const FIX       = process.argv.includes('--fix');
const SAINTS_JS = path.join(__dirname, '../../src/data/saints.js');

function main() {
  const content = fs.readFileSync(SAINTS_JS, 'utf8');

  // Extract all name + id pairs
  const entries = [];
  const idMatches   = [...content.matchAll(/id:\s*(\d+)/g)];
  const nameMatches = [...content.matchAll(/name:\s*['"](.+?)['"]/g)];

  if (idMatches.length !== nameMatches.length) {
    console.warn(`Warning: found ${idMatches.length} ids but ${nameMatches.length} names — file may be malformed.`);
  }

  for (let i = 0; i < nameMatches.length; i++) {
    entries.push({
      index: i,
      id:    idMatches[i]   ? parseInt(idMatches[i][1])   : null,
      name:  nameMatches[i] ? nameMatches[i][1].trim()    : null,
    });
  }

  // Find duplicates
  const seen       = new Map(); // name → first entry
  const duplicates = [];

  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) {
      duplicates.push({ duplicate: entry, original: seen.get(key) });
    } else {
      seen.set(key, entry);
    }
  }

  console.log(`\nTotal saints in file: ${entries.length}`);
  console.log(`Unique names:         ${seen.size}`);
  console.log(`Duplicates found:     ${duplicates.length}`);

  if (!duplicates.length) {
    console.log('\n✓ No duplicates found!');
    return;
  }

  console.log('\nDuplicate list:');
  console.log('─'.repeat(60));
  duplicates.forEach(({ duplicate, original }) => {
    console.log(`  "${duplicate.name}"`);
    console.log(`    Original:  id=${original.id} (index ${original.index})`);
    console.log(`    Duplicate: id=${duplicate.id} (index ${duplicate.index})`);
  });

  if (!FIX) {
    console.log('\nRun with --fix to automatically remove duplicates (keeps first occurrence).');
    return;
  }

  // Fix — remove duplicate entries from the file
  console.log('\nFixing duplicates...');
  const idsToRemove = new Set(duplicates.map(d => d.duplicate.id));

  // Split into individual saint blocks and filter
  // Match each { ... } block that starts with an id:
  const blocks = content.split(/(?=\s*\{\s*\n\s*id:)/);
  const header = blocks.shift(); // export const saints = [

  const filtered = blocks.filter(block => {
    const idMatch = block.match(/id:\s*(\d+)/);
    if (!idMatch) return true;
    const id = parseInt(idMatch[1], 10);
    if (idsToRemove.has(id)) {
      const nameMatch = block.match(/name:\s*['"](.+?)['"]/);
      console.log(`  Removing duplicate: id=${id} "${nameMatch?.[1]}"`);
      return false;
    }
    return true;
  });

  const updated = header + filtered.join('');

  fs.writeFileSync(SAINTS_JS + '.bak', content, 'utf8');
  console.log('Backup saved → saints.js.bak');

  fs.writeFileSync(SAINTS_JS, updated, 'utf8');
  console.log(`Done. Removed ${idsToRemove.size} duplicates.`);
  console.log(`Saints remaining: ${entries.length - idsToRemove.size}`);
}

main();