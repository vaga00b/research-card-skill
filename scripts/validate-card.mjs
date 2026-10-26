#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const input = argValue('--input');
if (!input || process.argv.includes('--help')) {
  process.stdout.write('Usage: node validate-card.mjs --input <card-json>\nChecks the card structure and evidence fields before archiving. It cannot judge whether a quotation semantically supports a claim; review that against the source.\n');
  process.exit(input ? 0 : 2);
}

let card;
try { card = JSON.parse(await fs.readFile(path.resolve(input), 'utf8')); }
catch (error) { fail(`Cannot read card JSON: ${error.message}`); }

const errors = [];
const sectionsByLanguage = card.sectionsByLanguage || {};
const languages = ['zh', 'en'].filter(language => Array.isArray(sectionsByLanguage[language]));
if (!card.title?.trim()) errors.push('Missing card title.');
if (!Array.isArray(card.sources) || !card.sources.length) errors.push('At least one source is required.');
for (const [i, source] of (card.sources || []).entries()) {
  if (!source.url || !validUrl(source.url)) errors.push(`Source ${i + 1} has no valid HTTP(S) URL.`);
}
if (!languages.length) errors.push('No structured sections found in sectionsByLanguage.zh or .en.');

const idsByLanguage = {};
let claimCount = 0;
for (const language of languages) {
  const sections = sectionsByLanguage[language];
  const sectionIds = new Set();
  const claimIds = [];
  for (const [sectionIndex, section] of sections.entries()) {
    if (!section.id || !/^S\d{2}$/.test(section.id)) errors.push(`${language} section ${sectionIndex + 1} must have an S01-style id.`);
    if (sectionIds.has(section.id)) errors.push(`${language} has duplicate section id ${section.id}.`);
    sectionIds.add(section.id);
    if (!section.title?.trim() || !section.summary?.trim()) errors.push(`${language} ${section.id || `section ${sectionIndex + 1}`} needs a title and summary.`);
    if (!Array.isArray(section.claims) || !section.claims.length) errors.push(`${language} ${section.id || `section ${sectionIndex + 1}`} has no claims.`);
    for (const [claimIndex, claim] of (section.claims || []).entries()) {
      claimCount++;
      const label = `${language} ${section.id || `section ${sectionIndex + 1}`} claim ${claim.id || claimIndex + 1}`;
      if (!claim.id || !/^C\d{2}$/.test(claim.id)) errors.push(`${label} must have a C01-style id.`);
      if (claim.id && claimIds.includes(claim.id)) errors.push(`${language} has duplicate claim id ${claim.id}.`);
      if (claim.id) claimIds.push(claim.id);
      if (!claim.statement?.trim()) errors.push(`${label} has no reusable claim statement.`);
      if (!claim.evidenceQuote?.trim()) errors.push(`${label} has no exact source quotation.`);
      if (!claim.locator?.trim()) errors.push(`${label} has no section or paragraph locator.`);
      if (!claim.sourceUrl || !validUrl(claim.sourceUrl)) errors.push(`${label} has no valid HTTP(S) source link.`);
    }
  }
  idsByLanguage[language] = claimIds;
}
if (idsByLanguage.zh && idsByLanguage.en && JSON.stringify(idsByLanguage.zh) !== JSON.stringify(idsByLanguage.en)) {
  errors.push('Chinese and English claim IDs or order do not match.');
}
if (!claimCount) errors.push('The card has no claims.');

const result = { ok: errors.length === 0, id: card.id || null, claimCount, errors, manualReview: [
  'Confirm every quotation is copied exactly from the accessible source.',
  'Confirm each quotation directly supports its claim and preserves relevant context, numbers, units, and denominators.',
  'Confirm source headings are genuine; otherwise label the section groups as editorial.'
] };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) process.exitCode = 1;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
function validUrl(value) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}
function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

