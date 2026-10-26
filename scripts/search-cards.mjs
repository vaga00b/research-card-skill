#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  process.stdout.write('Usage: node search-cards.mjs --query "topic" [--query "synonym or related phrase"] [--library <folder>] [--language zh|en|both] [--limit 1-50]\n');
  process.exit(0);
}
if (!options.queries.length) fail('Missing required --query.');
if (!['zh', 'en', 'both'].includes(options.language)) fail('--language must be zh, en, or both.');

const library = path.resolve(options.library || path.join(os.homedir(), 'Documents', 'Research Card Library'));
let cards;
try {
  cards = JSON.parse(await fs.readFile(path.join(library, 'cards.json'), 'utf8'));
} catch (error) {
  fail(`Cannot read ${path.join(library, 'cards.json')}: ${error.message}`);
}
if (!Array.isArray(cards)) fail('cards.json must contain a JSON array.');

const queries = options.queries.map(raw => ({ raw, normalized: normalize(raw), terms: queryTerms(raw) }));
const languages = options.language === 'both' ? ['zh', 'en'] : [options.language];
const results = [];
for (const card of cards) {
  const localized = [];
  for (const language of languages) {
    const hits = queries.map(query => ({ query: query.raw, ...scoreCard(card, language, query.normalized, query.terms) })).filter(data => data.score > 0 && data.eligible);
    if (!hits.length) continue;
    hits.sort((a, b) => b.score - a.score);
    const best = hits[0];
    const uniqueMatches = new Map();
    for (const hit of hits) for (const match of hit.matches) {
      const key = `${match.sectionId}:${match.claimId}:${match.matchedIn}`;
      if (!uniqueMatches.has(key) || uniqueMatches.get(key).score < match.score) uniqueMatches.set(key, match);
    }
    localized.push({ language, score: best.score + hits.slice(1).reduce((sum, hit) => sum + hit.score * 0.2, 0), matchedQueries: hits.map(hit => hit.query), matches: [...uniqueMatches.values()].sort((a, b) => b.score - a.score).slice(0, 8) });
  }
  if (!localized.length) continue;
  localized.sort((a, b) => b.score - a.score);
  const best = localized[0];
  results.push({
    score: best.score,
    id: card.id,
    title: card.titleByLanguage?.[best.language] || card.title,
    language: best.language,
    topic: card.topicByLanguage?.[best.language] || card.topic || '',
    summary: card.summaryByLanguage?.[best.language] || card.summary || '',
    sources: (card.sources || []).map(({ title, url, date, author, organization }) => ({ title, url, date, author, organization })),
    reuse: card.reuseByLanguage?.[best.language] || card.reuseByLanguage?.zh || null,
    matchedQueries: best.matchedQueries,
    matches: best.matches,
  });
}
results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
process.stdout.write(`${JSON.stringify({ library, queries: options.queries, resultCount: results.length, results: results.slice(0, options.limit) }, null, 2)}\n`);

function scoreCard(card, language, normalizedQuery, terms) {
  let score = 0;
  let exactMatch = false;
  const matched = new Set();
  const matches = [];
  const addField = (value, weight, kind, section, claim) => {
    if (typeof value !== 'string' || !value.trim()) return 0;
    const text = normalize(value);
    const hits = terms.filter((term) => text.includes(term));
    if (!hits.length) return 0;
    for (const hit of hits) matched.add(hit);
    const exact = text.includes(normalizedQuery);
    exactMatch ||= exact;
    const fieldScore = weight * hits.length + (exact ? weight * 2 : 0);
    score += fieldScore;
    return fieldScore;
  };

  addField(card.titleByLanguage?.[language] || card.title, 10, 'title');
  addField(card.topicByLanguage?.[language] || card.topic, 8, 'topic');
  addField(card.summaryByLanguage?.[language] || card.summary, 5, 'summary');
  for (const keyword of card.keywords || []) addField(keyword, 6, 'keyword');
  for (const source of card.sources || []) {
    addField(source.title, 2, 'source');
    addField(source.organization, 1, 'source');
    addField(source.author, 1, 'source');
  }
  for (const section of card.sectionsByLanguage?.[language] || []) {
    const sectionScoreBefore = score;
    addField(section.title, 7, 'section', section);
    addField(section.sourceHeading, 4, 'source heading', section);
    addField(section.summary, 4, 'section summary', section);
    if (score > sectionScoreBefore) matches.push({ sectionId: section.id, section: section.title, claimId: '', statement: section.summary || '', matchedIn: 'section', score: score - sectionScoreBefore });
    for (const claim of section.claims || []) {
      const before = score;
      addField(claim.statement, 7, 'claim', section, claim);
      addField((claim.examples || []).join(' '), 3, 'example', section, claim);
      addField(claim.evidenceQuote, 2, 'evidence', section, claim);
      addField(claim.locator, 1, 'locator', section, claim);
      if (score > before) {
        matches.push({
          sectionId: section.id,
          section: section.title,
          claimId: claim.id,
          statement: claim.statement,
          examples: claim.examples || [],
          evidenceQuote: claim.evidenceQuote || '',
          locator: claim.locator || '',
          sourceUrl: claim.sourceUrl || card.sources?.[0]?.url || '',
          matchedIn: 'claim details',
          score: score - before,
        });
      }
    }
  }
  const reuse = card.reuseByLanguage?.[language];
  for (const [key, value] of Object.entries(reuse || {})) {
    for (const item of Array.isArray(value) ? value : [value]) addField(String(item), 2, `reuse:${key}`);
  }
  matches.sort((a, b) => b.score - a.score);
  const matchedTerms = matched.size;
  const eligible = exactMatch || matchedTerms >= Math.min(2, terms.length);
  return { score, matchedTerms, eligible, matches: matches.sort((a, b) => b.score - a.score).slice(0, 8) };
}

function queryTerms(value) {
  const terms = new Set();
  for (const match of value.matchAll(/[\p{Script=Han}]+|[\p{L}\p{N}][\p{L}\p{N}._-]*/gu)) {
    const part = normalize(match[0]);
    if (/^\p{Script=Han}+$/u.test(part)) {
      if (part.length <= 2) terms.add(part);
      else for (let i = 0; i < part.length - 1; i++) terms.add(part.slice(i, i + 2));
    } else terms.add(part);
  }
  return [...terms].filter((term) => term.length > 0);
}

function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

function parseArgs(args) {
  const parsed = { queries: [], language: 'zh', limit: 8, help: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') parsed.help = true;
    else if (['--query', '--library', '--language', '--limit'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) fail(`Missing value for ${arg}.`);
      if (arg === '--query') parsed.queries.push(value);
      else {
        const key = { '--library': 'library', '--language': 'language', '--limit': 'limit' }[arg];
        parsed[key] = key === 'limit' ? Number(value) : value;
      }
    } else fail(`Unknown option: ${arg}`);
  }
  if (!Number.isInteger(parsed.limit) || parsed.limit < 1 || parsed.limit > 50) fail('--limit must be an integer from 1 to 50.');
  return parsed;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}


