#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const documents = path.join(os.homedir(), 'Documents');
const target = path.resolve(valueAfter('--path') || path.join(documents, 'Research Card Library'));
const templatePath = path.join(root, 'assets', 'library-template', 'index.template.html');
await fs.mkdir(target, { recursive: true });
await fs.mkdir(path.join(target, 'cards'), { recursive: true });
const indexPath = path.join(target, 'index.html');
const dataPath = path.join(target, 'cards.json');
let cards = [];
try { cards = JSON.parse(await fs.readFile(dataPath, 'utf8')); if (!Array.isArray(cards)) throw new Error('cards.json must contain an array'); }
catch (error) { if (error.code !== 'ENOENT') throw new Error(`Existing cards.json cannot be read safely: ${error.message}`); cards = await migrateExisting(target); }
if (cards.length === 0) {
  const priorIndex = `${indexPath}.pre-research-card.bak`;
  if (await exists(priorIndex)) cards = await migrateExisting(target, priorIndex);
}
const priorIndex = `${indexPath}.pre-research-card.bak`;
if (await exists(priorIndex)) {
  const migrated = await migrateExisting(target, priorIndex);
  for (const old of migrated) {
    const current = cards.find(card => card.id === old.id);
    if (current && (!current.sources || current.sources.length === 0) && old.sources.length) current.sources = old.sources;
  }
}
const sourceTemplate = await fs.readFile(templatePath, 'utf8');
if (!sourceTemplate.includes('__CARD_DATA__')) throw new Error('Library template is missing its data marker.');
const rendered = sourceTemplate.replace('__CARD_DATA__', safeJson(cards));
if (await exists(indexPath)) {
  const old = await fs.readFile(indexPath, 'utf8');
  const recognizedLibrary = old.includes('id="card-data"') || (old.includes('研究卡片库') && /cards\/[^"']+\.html/i.test(old));
  if (!recognizedLibrary) throw new Error(`目标目录已有不相关的 index.html，为避免覆盖已停止安装：${indexPath}`);
  if (!old.includes('id="card-data"') && !await exists(`${indexPath}.pre-research-card.bak`)) {
    await fs.copyFile(indexPath, `${indexPath}.pre-research-card.bak`);
  }
}
await fs.writeFile(indexPath, rendered, 'utf8');
await fs.writeFile(dataPath, `${JSON.stringify(cards, null, 2)}\n`, 'utf8');
if (!await exists(path.join(target, 'README.txt'))) await fs.writeFile(path.join(target, 'README.txt'), '本地研究卡片库\n\n双击 index.html 查看卡片。\n在 Codex 中运行 $research-card 并提供文章链接，新卡片会保存到本目录。\n资料库完全保存在本电脑，不调用模型 API。请勿删除 cards/ 与 cards.json。\n', 'utf8');
console.log(JSON.stringify({ ok: true, library: target, cards: cards.length, migrated: cards.length > 0 }, null, 2));

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
function safeJson(data) { return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
async function migrateExisting(dir, indexFile = path.join(dir, 'index.html')) {
  const oldIndex = indexFile;
  if (!await exists(oldIndex)) return [];
  const html = await fs.readFile(oldIndex, 'utf8');
  const result = [];
  const articleLinks = [...html.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map(m => m[0]);
  for (const article of articleLinks) {
    const href = article.match(/href=["'](?:\.\/)?cards\/([^"'#?]+)\.html["']/i)?.[1];
    const link = article.match(/<a[^>]*href=["'](?:\.\/)?cards\/[^"'#?]+\.html["'][^>]*>([\s\S]*?)<\/a>/i)?.[1];
    const title = link?.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    if (!href || !title) continue;
    const id = path.basename(href);
    let detail = '';
    try { detail = await fs.readFile(path.join(dir, 'cards', `${id}.html`), 'utf8'); } catch { /* preserve the index entry even if its page is missing */ }
    const urls = [...new Set([...detail.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(match => match[1]))];
    const meta = article.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    result.push({ id, title, topic: '研究卡片', summary: '', sourceLabel: meta, date: '', keywords: [], sources: urls.map(url => ({ url })) });
  }
  return result;
}


