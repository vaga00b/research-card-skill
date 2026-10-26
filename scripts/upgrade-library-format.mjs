#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const valueAfter = flag => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const library = path.resolve(valueAfter('--library') || '');
if (!valueAfter('--library')) fail('用法：node upgrade-library-format.mjs --library <library-folder>');
const cardsPath = path.join(library, 'cards.json');
const cards = JSON.parse(await fs.readFile(cardsPath, 'utf8'));
if (!Array.isArray(cards)) fail('cards.json 必须是数组。');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(library, `backup-before-card-v3-${stamp}`);
await fs.mkdir(path.join(backup, 'cards'), { recursive: true });
await fs.copyFile(cardsPath, path.join(backup, 'cards.json'));
for (const name of ['index.html', 'README.txt']) {
  try { await fs.copyFile(path.join(library, name), path.join(backup, name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
for (const card of cards) {
  for (const suffix of ['.md', '.zh.md', '.en.md', '.html']) {
    const source = path.join(library, 'cards', `${card.id}${suffix}`);
    try { await fs.copyFile(source, path.join(backup, 'cards', path.basename(source))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archiveScript = path.join(skillRoot, 'scripts', 'archive-card.mjs');
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'research-card-v2-'));
try {
  for (const [index, card] of cards.entries()) {
    const input = path.join(tempDir, `${String(index).padStart(3, '0')}-${card.id}.json`);
    await fs.writeFile(input, `${JSON.stringify(card, null, 2)}\n`, 'utf8');
    const run = spawnSync(process.execPath, [archiveScript, '--library', library, '--input', input], { encoding: 'utf8' });
    if (run.status !== 0) fail(`升级卡片失败：${card.id}\n${run.stderr || run.stdout}`);
  }
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

const upgraded = JSON.parse(await fs.readFile(cardsPath, 'utf8'));
if (upgraded.length !== cards.length || upgraded.some(card => card.schemaVersion !== 3)) fail('升级后的卡片数或版本标记不匹配；备份位于：' + backup);
console.log(JSON.stringify({ ok: true, upgraded: upgraded.length, backup, library }, null, 2));

function fail(message) { console.error(message); process.exit(1); }


