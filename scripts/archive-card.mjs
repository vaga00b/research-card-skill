#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const getArg = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const library = path.resolve(getArg('--library') || '');
const inputPath = getArg('--input');
if (!getArg('--library') || !inputPath) fail('用法：node archive-card.mjs --library <library-folder> --input <card-json>');
const card = JSON.parse(await fs.readFile(path.resolve(inputPath), 'utf8'));
validate(card);
await fs.mkdir(path.join(library, 'cards'), { recursive: true });
const dataPath = path.join(library, 'cards.json');
let cards = [];
try { cards = JSON.parse(await fs.readFile(dataPath, 'utf8')); if (!Array.isArray(cards)) throw new Error('cards.json 必须是数组'); }
catch (error) { if (error.code !== 'ENOENT') fail(`读取卡片库失败：${error.message}`); }
const urls = sourceUrls(card);
let index = cards.findIndex(existing => sameSources(urls, sourceUrls(existing)));
let action = 'created';
if (index >= 0) {
  card.id = cards[index].id;
  card.createdAt = cards[index].createdAt || card.createdAt || new Date().toISOString();
  action = 'updated';
} else {
  card.id = await uniqueId(card.id, cards, library);
  card.createdAt ||= new Date().toISOString();
}
if (index >= 0) cards[index] = card; else { cards.unshift(card); index = 0; }
const markdownByLanguage = card.markdownByLanguage || { [card.language]: card.markdown };
for (const language of ['zh', 'en']) {
  if (typeof markdownByLanguage[language] === 'string' && markdownByLanguage[language].trim()) {
    markdownByLanguage[language] = prepareMarkdown(card, language, markdownByLanguage[language]);
  }
}
card.markdownByLanguage = markdownByLanguage;
card.markdown = markdownByLanguage[card.language] || markdownByLanguage.zh || markdownByLanguage.en;
const markdown = String(card.markdownByLanguage[card.language] || card.markdown).trim() + '\n';
const html = renderCard(card);
await fs.writeFile(path.join(library, 'cards', `${card.id}.md`), markdown, 'utf8');
for (const language of ['zh', 'en']) {
  if (typeof markdownByLanguage[language] === 'string' && markdownByLanguage[language].trim()) {
    await fs.writeFile(path.join(library, 'cards', `${card.id}.${language}.md`), `${markdownByLanguage[language].trim()}\n`, 'utf8');
  }
}
await fs.writeFile(path.join(library, 'cards', `${card.id}.html`), html, 'utf8');
await fs.writeFile(dataPath, `${JSON.stringify(cards, null, 2)}\n`, 'utf8');
const templatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'library-template', 'index.template.html');
const template = await fs.readFile(templatePath, 'utf8');
await fs.writeFile(path.join(library, 'index.html'), template.replace('__CARD_DATA__', safeJson(cards)), 'utf8');
console.log(JSON.stringify({ ok: true, action, id: card.id, title: card.title, library, markdown: path.join(library, 'cards', `${card.id}.md`), html: path.join(library, 'cards', `${card.id}.html`) }, null, 2));

function fail(message) { console.error(message); process.exit(1); }
function validate(c) {
  c.language = c.language === 'en' ? 'en' : 'zh';
  if ((!c?.markdownByLanguage || typeof c.markdownByLanguage !== 'object') && (typeof c?.markdown !== 'string' || !c.markdown.trim())) fail('卡片必须包含 markdown 或 markdownByLanguage。');
  if (typeof c?.title !== 'string' || !c.title.trim()) fail('卡片缺少必填字段：title');
  if (c.markdownByLanguage) {
    for (const language of ['zh', 'en']) if (c.markdownByLanguage[language] != null && typeof c.markdownByLanguage[language] !== 'string') fail(`markdownByLanguage.${language} 必须是文本。`);
    if (!c.markdownByLanguage[c.language] && !c.markdown) c.language = c.markdownByLanguage.zh ? 'zh' : 'en';
    c.markdown ||= c.markdownByLanguage[c.language] || c.markdownByLanguage.zh || c.markdownByLanguage.en;
  }
  c.markdownByLanguage ||= { [c.language]: c.markdown };
  if (!Array.isArray(c.sources)) c.sources = [];
  for (const s of c.sources) if (s.url && !validUrl(s.url)) fail(`来源必须是 HTTP/HTTPS 链接：${s.url}`);
  if (c.id && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(c.id)) fail('卡片 id 只能包含字母、数字、短横线和下划线。');
  c.id ||= `${new Date().toISOString().slice(0, 10)}-${slug(c.title)}`;
  c.schemaVersion = 3;
  c.topic = typeof c.topic === 'string' ? c.topic : '研究卡片';
  c.summary = typeof c.summary === 'string' ? c.summary : '';
  c.keywords = Array.isArray(c.keywords) ? c.keywords.map(String) : [];
  c.date = typeof c.date === 'string' ? c.date : new Date().toISOString().slice(0, 10);
  c.topicByLanguage = c.topicByLanguage && typeof c.topicByLanguage === 'object' ? c.topicByLanguage : {};
  c.sectionsByLanguage = c.sectionsByLanguage && typeof c.sectionsByLanguage === 'object' ? c.sectionsByLanguage : {};
  const hasStructuredSections = Object.values(c.sectionsByLanguage).some(value => Array.isArray(value) && value.length > 0);
  c.structureOrigin = c.structureOrigin === 'editorial' || !hasStructuredSections ? 'editorial' : 'source';
  c.summaryByLanguage = c.summaryByLanguage && typeof c.summaryByLanguage === 'object' ? c.summaryByLanguage : {};
  c.titleByLanguage = c.titleByLanguage && typeof c.titleByLanguage === 'object' ? c.titleByLanguage : {};
  c.cardType = c.cardType || (c.sources.length > 1 ? 'source_comparison' : 'source_summary');
  if (!['source_summary', 'source_comparison'].includes(c.cardType)) fail('cardType 必须是 source_summary 或 source_comparison。');
  c.reuseByLanguage = c.reuseByLanguage && typeof c.reuseByLanguage === 'object' ? c.reuseByLanguage : {};
  for (const language of ['zh', 'en']) {
    const reuse = c.reuseByLanguage[language] && typeof c.reuseByLanguage[language] === 'object' ? c.reuseByLanguage[language] : {};
    const sourceMarkdown = c.markdownByLanguage?.[language] || (language === c.language ? c.markdown : '');
    const oldUse = extractSection(sourceMarkdown, language === 'en' ? ['Why save this', 'Why Save This'] : ['为什么值得保存']);
    const oldLimits = extractSection(sourceMarkdown, language === 'en' ? ['Evidence and Limitations', 'Evidence and limitations'] : ['证据与局限']);
    const oldNext = extractSection(sourceMarkdown, language === 'en' ? ['Follow-up Questions', 'Follow-up questions'] : ['后续问题（可选）', '后续问题']);
    c.reuseByLanguage[language] = {
      useFor: String(reuse.useFor || firstContent(oldUse) || c.summaryByLanguage[language] || c.summary || '').replace(/^可用于[：:]?\s*/, '').replace(/^useful for[: ]?\s*/i, ''),
      claimIds: Array.isArray(reuse.claimIds) ? reuse.claimIds.map(String) : [],
      guardrails: String(reuse.guardrails || firstContent(oldLimits) || ''),
      nextChecks: String(reuse.nextChecks || firstContent(oldNext) || (language === 'en' ? 'No specific follow-up check is listed.' : '暂无明确的后续核查问题。'))
    };
  }
}
function validUrl(url) { try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; } }
function sourceUrls(c) { return [...new Set((c.sources || []).map(s => s.url).filter(validUrl).map(canonical))].sort(); }
function canonical(u) { const x = new URL(u); x.hash = ''; x.searchParams.delete('utm_source'); x.searchParams.delete('utm_medium'); x.searchParams.delete('utm_campaign'); return x.href.replace(/\/$/, ''); }
function sameSources(a,b) { return a.length > 0 && a.length === b.length && a.every((x,i)=>x===b[i]); }
function slug(s) { return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50) || 'research-card'; }
async function uniqueId(id, list, dir) { let next=id,n=2;while(list.some(c=>c.id===next)||await exists(path.join(dir,'cards',`${next}.html`))||await exists(path.join(dir,'cards',`${next}.md`)))next=`${id}-${n++}`;return next; }
async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
function safeJson(data) { return JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'); }
function esc(s) { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function inline(s) { return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,t,u)=>`<a href="${esc(u.replace(/&amp;/g,'&'))}" target="_blank" rel="noopener noreferrer">${t}</a>`); }
function markdownHtml(md, language = 'zh') {
  let out = '', list = null, inStructure = false, detailOpen = false;
  md = stripFrontMatter(md);
  const closeList = () => { if (list) { out += `</${list}>`; list = null; } };
  const closeDetail = () => { closeList(); if (detailOpen) { out += '</div></details>'; detailOpen = false; } };
  const isStructureHeading = value => /^(article structure|文章结构|文章脉络)$/i.test(value.trim());
  for (const line of md.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      if (level <= 2) {
        closeDetail();
        if (inStructure) { out += '</div></section>'; inStructure = false; }
        const title = heading[2].trim();
        if (level === 2 && isStructureHeading(title)) {
          inStructure = true;
          out += `<section class="article-structure"><h2>${inline(title)}</h2><div class="structure-controls"><button type="button" onclick="this.closest('.article-structure').querySelectorAll('details').forEach(item=>item.open=true)">${language === 'en' ? 'Expand all' : '展开全部'}</button><button type="button" onclick="this.closest('.article-structure').querySelectorAll('details').forEach(item=>item.open=false)">${language === 'en' ? 'Collapse all' : '收起全部'}</button></div><div class="structure-groups">`;
        } else if (level === 2 && (language === 'en' ? /^key points$/i.test(title) : title === '关键观点')) {
          inStructure = true;
          const label = language === 'en' ? 'Core findings · legacy thematic grouping' : '主要观点 · 旧卡片主题归组';
          out += `<section class="article-structure"><h2>${language === 'en' ? 'Article Structure' : '文章结构'}</h2><div class="structure-controls"><button type="button" onclick="this.closest('.article-structure').querySelectorAll('details').forEach(item=>item.open=true)">${language === 'en' ? 'Expand all' : '展开全部'}</button><button type="button" onclick="this.closest('.article-structure').querySelectorAll('details').forEach(item=>item.open=false)">${language === 'en' ? 'Collapse all' : '收起全部'}</button></div><div class="structure-groups"><details class="structure-group"><summary>${label}</summary><div class="structure-content">`;
          detailOpen = true;
        } else {
          const htmlLevel = Math.min(level + 1, 5);
          out += `<h${htmlLevel}>${inline(title)}</h${htmlLevel}>`;
        }
      } else if (inStructure && level === 3) {
        closeDetail();
        const title = heading[2].replace(/^S\d{2}\s*[|｜:]\s*/, '').trim();
        out += `<details class="structure-group"><summary>${inline(title)}</summary><div class="structure-content">`;
        detailOpen = true;
      } else {
        out += `<h${Math.min(level + 1, 5)}>${inline(heading[2])}</h${Math.min(level + 1, 5)}>`;
      }
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (list !== 'ul') { closeList(); out += '<ul>'; list = 'ul'; }
      out += `<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`;
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (list !== 'ol') { closeList(); out += '<ol>'; list = 'ol'; }
      out += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`;
      continue;
    }
    if (!line.trim()) { closeList(); continue; }
    closeList();
    out += `<p>${inline(line)}</p>`;
  }
  closeList();
  closeDetail();
  if (inStructure) out += '</div></section>';
  return out;
}
function prepareMarkdown(card, language, original) {
  const headings = language === 'en'
    ? ['Why save this', 'Why Save This', 'Follow-up Questions', 'Follow-up questions', 'Next-work interface', 'Next-work Interface']
    : ['为什么值得保存', '后续问题（可选）', '后续问题', '后续工作接口'];
  let md = stripFrontMatter(original).replace(/\r\n/g, '\n').trim();
  const structured = card.sectionsByLanguage?.[language];
  if (Array.isArray(structured) && structured.length) md = replaceClaimSection(md, language, renderStructuredSections(card, language));
  else md = wrapLegacyKeyPoints(md, language);
  const ids = [];
  let inPoints = false;
  let nextId = 0;
  md = md.split('\n').map(line => {
    const heading = line.match(/^(#{2})\s+(.+)/);
    if (heading) inPoints = (language === 'en' ? /^key points$|^article structure$/i : /^(关键观点|文章结构|文章脉络)$/).test(heading[2].trim());
    if (inPoints && /^[-*]\s+/.test(line) && !/\*\*\[C\d{2}\]\*\*/i.test(line)) {
      const id = `C${String(++nextId).padStart(2, '0')}`;
      ids.push(id);
      if (!/\bC\d{2}\b/.test(line)) line = line.replace(/^([-*]\s+)/, `$1**[${id}]** `);
    } else if (inPoints && /^[-*]\s+/.test(line)) {
      const id = line.match(/\b(C\d{2})\b/i)?.[1]?.toUpperCase();
      if (id) { ids.push(id); nextId = Math.max(nextId, Number(id.slice(1))); }
    }
    return line;
  }).join('\n');
  card.reuseByLanguage[language].claimIds = ids;
  const sections = [];
  let skip = false;
  for (const line of md.split('\n')) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      const normalized = heading[1].trim().replace(/\s*（可选）$/, '');
      skip = headings.some(value => value.replace(/\s*（可选）$/, '').toLowerCase() === normalized.toLowerCase());
    }
    if (!skip) sections.push(line);
  }
  md = sections.join('\n').trim().replace(/\n---\n\n(?:研究卡片|Research card) ·[\s\S]*$/i, '').trim();
  const reuse = card.reuseByLanguage[language];
  const section = language === 'en'
    ? `## Next-work Interface\n- **Useful for:** ${reuse.useFor}\n- **Claims to reuse:** ${reuse.claimIds.map(id => `[${id}]`).join(', ') || 'None identified.'}\n- **Guardrails:** See Evidence and Limitations above; carry those boundaries forward when reusing claims.\n- **Next checks:** ${reuse.nextChecks}`
    : `## 后续工作接口\n- **可用于：**${reuse.useFor.replace(/^可用于[：:]\s*/, '')}\n- **可调用观点：**${reuse.claimIds.map(id => `[${id}]`).join('、') || '暂无可调用观点。'}\n- **使用边界：**引用或改写观点时，同时保留上方“证据与局限”中的限制。\n- **下一步核查：**${reuse.nextChecks}`;
  md = `${md}\n\n${section}\n`;
  return `${frontMatter(card, language)}\n\n${md}`;
}
function stripFrontMatter(md) { return String(md || '').replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, ''); }
function extractSection(md, names) {
  const lines = stripFrontMatter(md).split(/\r?\n/);
  let active = false, out = [];
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading) {
      if (active) break;
      const normalized = heading[1].trim().replace(/\s*（可选）$/, '');
      active = names.some(name => name.replace(/\s*（可选）$/, '').toLowerCase() === normalized.toLowerCase());
      continue;
    }
    if (active) out.push(line);
  }
  return out.join('\n').trim();
}
function firstContent(text) { return String(text || '').split(/\r?\n/).map(line=>line.replace(/^\s*[-*]\s+/, '').trim()).find(Boolean) || ''; }
function frontMatter(card, language) {
  const title = card.titleByLanguage?.[language] || card.title;
  const topic = card.topicByLanguage?.[language] || card.topic;
  const summary = card.summaryByLanguage?.[language] || card.summary;
  const reuse = card.reuseByLanguage[language];
  const yaml = value => JSON.stringify(String(value ?? ''));
  const sources = (card.sources || []).map(source => [
    `  - title: ${yaml(source.title || '')}`,
    ...(source.url ? [`    url: ${yaml(source.url)}`] : []),
    ...(source.organization ? [`    publisher: ${yaml(source.organization)}`] : []),
    ...(source.author ? [`    author: ${yaml(source.author)}`] : []),
    ...(source.date ? [`    published_at: ${yaml(source.date)}`] : [])
  ].join('\n'));
  return [`---`, `schema_version: 3`, `id: ${yaml(card.id)}`, `created_at: ${yaml(card.createdAt || '')}`, `card_type: ${yaml(card.cardType)}`, `display_language: ${yaml(language)}`, `title: ${yaml(title)}`, `topics: [${yaml(topic)}]`, `summary: ${yaml(summary)}`, `keywords: [${(card.keywords || []).map(yaml).join(', ')}]`, `sources:`, ...(sources.length ? sources : ['  []']), `article_structure:`, `  origin: ${yaml(card.structureOrigin || 'source')}`, `reuse:`, `  can_use_for: ${yaml(reuse.useFor)}`, `  claim_ids: [${reuse.claimIds.map(yaml).join(', ')}]`, `  guardrails: ${yaml(reuse.guardrails)}`, `  next_checks: ${yaml(reuse.nextChecks)}`, `---`].join('\n');
}
function renderStructuredSections(card, language) {
  const sections = card.sectionsByLanguage[language] || [];
  let claimNumber = 0;
  const lines = [`## ${language === 'en' ? 'Article Structure' : '文章结构'}`];
  if (card.structureOrigin === 'editorial') lines.push(language === 'en' ? '> The source has no stable section headings; these are editorial topic groups.' : '> 原文没有清晰稳定的章节标题，以下为主题归组。');
  for (const [index, section] of sections.entries()) {
    const sid = section.id || `S${String(index + 1).padStart(2, '0')}`;
    const title = section.title || section.sourceHeading || (language === 'en' ? `Section ${index + 1}` : `第${index + 1}部分`);
    const sourceHeading = section.sourceHeading && section.sourceHeading !== title ? (language === 'en' ? ` (source heading: “${section.sourceHeading}”)` : `（原文标题：“${section.sourceHeading}”）`) : '';
    lines.push('', `### ${sid}｜${title}${sourceHeading}`, String(section.summary || ''));
    for (const claim of section.claims || []) {
      const id = claim.id || `C${String(++claimNumber).padStart(2, '0')}`;
      const statement = String(claim.statement || '').trim();
      if (!statement) continue;
      lines.push(`- **[${id}] ${statement}**${claim.claimType ? `（${claim.claimType}）` : ''}`);
      for (const example of claim.examples || []) lines.push(`  - **${language === 'en' ? 'Example/data:' : '重要例子/数据：'}** ${String(example)}`);
      const evidence = [];
      if (claim.evidenceQuote) evidence.push(`“${claim.evidenceQuote}”`);
      if (claim.locator) evidence.push(`(${claim.locator})`);
      if (claim.sourceUrl) evidence.push(`[${language === 'en' ? 'source' : '原文'}](${claim.sourceUrl})`);
      if (evidence.length) lines.push(`  - **${language === 'en' ? 'Evidence from the source:' : '原文依据：'}** ${evidence.join(' ')}`);
    }
  }
  return lines.join('\n');
}
function replaceClaimSection(md, language, replacement) {
  const names = language === 'en' ? /^(key points|article structure)$/i : /^(关键观点|文章结构|文章脉络)$/;
  const lines = md.split('\n');
  const output = [];
  let inserted = false;
  let skippingClaims = false;
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)/);
    if (heading && names.test(heading[1].trim())) {
      if (!inserted) { output.push(replacement); inserted = true; }
      skippingClaims = true;
      continue;
    }
    if (heading) skippingClaims = false;
    if (!skippingClaims) output.push(line);
  }
  if (!inserted) output.push('', replacement);
  return output.join('\n').trim();
}
function wrapLegacyKeyPoints(md, language) {
  const heading = language === 'en' ? /^##\s+Key Points\s*$/im : /^##\s+关键观点\s*$/m;
  const label = language === 'en' ? 'Core findings · legacy thematic grouping' : '主要观点 · 旧卡片主题归组';
  const note = language === 'en'
    ? '> Legacy card: source section headings were not preserved; these claims are grouped thematically.'
    : '> 旧版卡片未保存原文章节层级，以下为主题归组。';
  return md.replace(heading, `## ${language === 'en' ? 'Article Structure' : '文章结构'}\n\n${note}\n\n### S01｜${label}`);
}
function renderCard(c) {
  const en = c.language === 'en';
  const source = c.sources.find(s => validUrl(s.fullTextUrl || s.url));
  const sourceUrl = source?.fullTextUrl || source?.url;
  const sourceLink = source ? `<a class="source" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${en ? 'Open original ↗' : '打开原文 ↗'}</a>` : '';
  const back = en ? '← Back to library' : '← 返回卡片库';
  const displayTitle = c.titleByLanguage?.[c.language] || c.title;
  const sourceTitle = c.sourceTitle || (c.sources.length === 1 ? c.sources[0].title || c.title : '');
  const sourceTitleNote = '<p class="source-title" data-source-title hidden></p>';
  const versions = { zh: c.markdownByLanguage?.zh || (c.language === 'zh' ? c.markdown : ''), en: c.markdownByLanguage?.en || (c.language === 'en' ? c.markdown : '') };
  const topic = c.topicByLanguage?.[c.language] || c.topic || '研究卡片';
  const content = Object.entries(versions).filter(([, md]) => md).map(([language, md]) => `<article class="body" data-card-content="${language}"${language === c.language ? '' : ' hidden'}>${markdownHtml(stripFrontMatter(md).replace(/^\s*#\s+[^\n]+\n?/, ''), language)}</article>`).join('');
  const missing = `<p class="language-note" data-language-note hidden></p>`;
  const picker = '<span class="sr-only">卡片语言</span><select data-card-language hidden><option value="zh">中文</option><option value="en">English</option></select><span class="sr-only" data-theme-label>界面主题</span><select data-card-theme hidden><option value="academic-blue">学术蓝白</option><option value="maillard">暖麦纸感</option><option value="graphite">墨石深灰</option><option value="pure-white">纯白极简</option></select>';
  return `<!doctype html><html lang="${en ? 'en' : 'zh-CN'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(displayTitle)}</title><style>:root{color-scheme:light;--ink:#1d2a24;--muted:#65736b;--line:#dfe7e1;--green:#28634c}*{box-sizing:border-box}body{margin:0;background:#f7f8f5;color:var(--ink);font:16px/1.75 "Segoe UI","Microsoft YaHei",sans-serif}main{width:min(790px,calc(100% - 34px));margin:28px auto 60px}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:22px}.back{color:var(--green);font-weight:700;text-decoration:none}.language-picker select{min-height:38px;padding:6px 10px;border:1px solid var(--line);border-radius:9px;background:white;color:var(--green);font:inherit;font-weight:650}.topic{margin:0 0 8px;color:var(--green);font-size:13px;font-weight:750}h1{margin:0 0 10px;font-size:clamp(27px,5vw,38px);line-height:1.3}.source-title{margin:-6px 0 12px;color:var(--muted);font-size:13px;line-height:1.5}.meta{color:var(--muted);font-size:13px}.card-created{display:block;margin-top:3px}.source{display:inline-block;margin:18px 0 22px;padding:9px 14px;border:1px solid #bfd3c4;border-radius:9px;background:#edf4ef;color:var(--green);font-weight:750;text-decoration:none}.body{padding:25px 28px;border:1px solid var(--line);border-radius:15px;background:#fff}.body h2{margin:27px 0 8px;font-size:21px}.body h3{margin:22px 0 7px;font-size:18px}.body p,.body ul,.body ol{margin:0 0 14px}.body blockquote{margin:16px 0;padding:5px 15px;border-left:3px solid #8bad98;color:#52645a;background:#f5f8f5}.body a{color:#315d78}.body code{padding:2px 5px;border-radius:4px;background:#f0f3f0}.article-structure{margin:20px 0}.structure-groups{display:grid;gap:9px}.structure-group{border:1px solid var(--line);border-radius:11px;background:#fbfcfa;overflow:hidden}.structure-group>summary{padding:12px 15px;color:var(--green);font-weight:750;cursor:pointer}.structure-group>summary:focus-visible{outline:3px solid #8ab89a;outline-offset:-3px}.structure-content{padding:2px 16px 12px;border-top:1px solid var(--line)}.structure-content h3{font-size:16px}.language-note{color:var(--muted);font-size:13px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[hidden]{display:none!important}@media(max-width:560px){.body{padding:19px 17px}}</style><style>.article-structure{margin:20px 0}.structure-controls{display:flex;justify-content:flex-end;gap:7px;margin:-4px 0 9px}.structure-controls button{padding:5px 9px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--green);font:inherit;font-size:12px;font-weight:700;cursor:pointer}.structure-groups{display:grid;gap:9px}.structure-group{overflow:hidden;border:1px solid var(--line);border-radius:11px;background:#fbfcfa}.structure-group>summary{padding:12px 15px;color:var(--green);font-weight:750;cursor:pointer}.structure-group>summary:focus-visible,.structure-controls button:focus-visible{outline:3px solid #8ab89a;outline-offset:2px}.structure-content{padding:2px 16px 12px;border-top:1px solid var(--line)}.structure-content p,.structure-content ul{margin-bottom:10px}@media(prefers-reduced-motion:reduce){.structure-group{scroll-behavior:auto}}

html[data-theme="maillard"]{color-scheme:light;--ink:#352b23;--muted:#746456;--line:#dfd1c0;--green:#795637}html[data-theme="maillard"] body{background:#f5efe6;color:var(--ink)}html[data-theme="maillard"] .back,html[data-theme="maillard"] .topic,html[data-theme="maillard"] .structure-group>summary{color:#795637}html[data-theme="maillard"] .back,html[data-theme="maillard"] .body,html[data-theme="maillard"] .structure-group{background:#fffaf3;border-color:#dfd1c0}html[data-theme="maillard"] .source{background:#eee2d2;border-color:#d7c1a4;color:#795637}html[data-theme="maillard"] .body blockquote{background:#f4eadb;border-color:#a87542;color:#574533}html[data-theme="maillard"] .body a{color:#805a35}html[data-theme="maillard"] .structure-group>summary:focus-visible,html[data-theme="maillard"] .structure-controls button:focus-visible,html[data-theme="maillard"] select:focus-visible{outline-color:#a87542}
html[data-theme="graphite"]{color-scheme:dark;--ink:#e7edf3;--muted:#aeb9c5;--line:#3a4652;--green:#c0d1e1}html[data-theme="graphite"] body{background:#1b2026;color:var(--ink)}html[data-theme="graphite"] .back,html[data-theme="graphite"] .body,html[data-theme="graphite"] .structure-group,html[data-theme="graphite"] .structure-controls button{background:#252c34;border-color:#3a4652;color:var(--ink)}html[data-theme="graphite"] .back,html[data-theme="graphite"] .topic,html[data-theme="graphite"] .structure-group>summary{color:#c0d1e1}html[data-theme="graphite"] .source{background:#2b3540;border-color:#52677a;color:#d5e2ee}html[data-theme="graphite"] .body blockquote{background:#202830;border-color:#829bb3;color:#d2dce5}html[data-theme="graphite"] .body a{color:#a8cae8}html[data-theme="graphite"] .body code{background:#343e49}html[data-theme="graphite"] .structure-content{border-color:#3a4652}html[data-theme="graphite"] .language-picker select{background:#252c34;border-color:#3a4652;color:#e7edf3}html[data-theme="graphite"] .structure-group>summary:focus-visible,html[data-theme="graphite"] .structure-controls button:focus-visible,html[data-theme="graphite"] select:focus-visible{outline-color:#9bb5ce}
.settings-link{display:inline-flex;min-height:44px;align-items:center;padding:0 13px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--green);font-weight:700;text-decoration:none}html[data-theme="graphite"] .settings-link{background:#252c34;border-color:#3a4652;color:#a9d2fa}

/* UI refinement: calmer reading surface and clearer controls. */
body{background:radial-gradient(ellipse at 88% 0%,rgba(220,235,223,.38),transparent 34rem),#f7f8f5}
main{width:min(830px,calc(100% - 40px));margin:30px auto 64px}
.toolbar{gap:14px;margin-bottom:28px}
.back{display:inline-flex;min-height:42px;align-items:center;padding:0 13px;border:1px solid var(--line);border-radius:10px;background:#fff}
.language-picker select{min-height:42px;padding:7px 12px}
.topic{font-size:14px;letter-spacing:.01em}
h1{margin-bottom:12px;font-size:clamp(30px,4.5vw,42px);letter-spacing:-.035em}
.source-title{margin:0 0 14px;font-size:14px}
.meta{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;font-size:14px;line-height:1.5}
.card-created{font-size:13px}
.source{min-height:46px;display:inline-flex;align-items:center;margin:19px 0 24px;padding:10px 17px;border-radius:11px;font-size:15px}
.body{padding:30px 32px;border-radius:17px;box-shadow:0 8px 26px rgba(29,55,38,.04)}
.body h2{margin:31px 0 10px;font-size:23px;letter-spacing:-.02em;line-height:1.38}
.body h3{font-size:19px;line-height:1.45}
.body p,.body ul,.body ol{line-height:1.8}
.body blockquote{border-radius:0 9px 9px 0}
.structure-groups{gap:11px}
.structure-group{border-radius:13px}
.structure-group>summary{min-height:46px;padding:12px 16px;line-height:1.5}
@media(max-width:600px){main{width:calc(100% - 30px);margin:18px auto 38px}.toolbar{margin-bottom:23px}.back{min-height:44px;padding:0 11px}h1{font-size:29px}.source{min-height:46px}.body{padding:20px 18px;border-radius:14px}.body h2{margin-top:25px;font-size:21px}.body h3{font-size:17px}.meta{font-size:13px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}



/* Modern academic office reading surface: white paper, ink navy, research blue. */
:root{--ink:#16283d;--muted:#54657a;--line:#d7e0e9;--green:#1e3a5f}
body{background:linear-gradient(180deg,#f8fafc 0%,#f2f6fa 100%);color:#16283d}
main{width:min(860px,calc(100% - 40px));margin:32px auto 68px}
.back{min-height:44px;border:1px solid #d4dee8;border-radius:9px;background:#fff;color:#1e3a5f;transition:background .16s,border-color .16s}.back:hover{border-color:#a8bfd5;background:#f4f8fc}
.language-picker select{min-height:44px;border-color:#d4dee8;background:#fff;color:#1e3a5f}
.topic{color:#315b80;letter-spacing:.035em}
h1,.body h2,.body h3{font-family:Georgia,"Noto Serif SC","Songti SC","STSong","SimSun",serif;color:#16283d}
h1{letter-spacing:-.025em;line-height:1.28}.source-title,.meta{color:#56677b}.meta{font-size:14px}
.source{min-height:46px;border:1px solid #1e3a5f;border-radius:9px;background:#1e3a5f;color:#fff;box-shadow:0 4px 10px rgba(30,58,95,.14);transition:background .16s,transform .16s,box-shadow .16s}.source:hover{background:#142d4b;box-shadow:0 7px 14px rgba(30,58,95,.2);transform:translateY(-1px)}
.body{border:1px solid #d9e1e9;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(23,51,78,.055)}.body h2{padding-bottom:9px;border-bottom:1px solid #dbe3eb}.body blockquote{border-left-color:#4a7ca9;background:#f1f6fb;color:#3e5368}.body a{color:#215b91;text-decoration-thickness:1px;text-underline-offset:3px}
.structure-groups{gap:12px}.structure-group{overflow:hidden;border-color:#d9e1e9;border-radius:11px;background:#fbfcfe}.structure-group>summary{min-height:48px;background:#f2f6fa;color:#1e3a5f;transition:background .15s}.structure-group>summary:hover{background:#e8f0f8}
.tag{border-color:#d4dee8!important;background:#eff3f7!important;color:#435b72!important}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
@media(max-width:600px){main{width:calc(100% - 30px);margin:20px auto 42px}.body{padding:21px 18px}.body h2{font-size:21px}}

/* Muted blue-gray controls and link emphasis. */
:root{--green:#334b61}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline-color:#71879a}
.body a{color:#405f78}
/* Graphite contrast pass: ensure body text, controls, and card details remain readable. */
html[data-theme="graphite"] body,html[data-theme="graphite"] body *{color:#e7edf3}
html[data-theme="graphite"] .meta,html[data-theme="graphite"] .source-title,html[data-theme="graphite"] .language-note{color:#c4d0dc}
html[data-theme="graphite"] h1,html[data-theme="graphite"] .body h2,html[data-theme="graphite"] .body h3{color:#f4f8fc}
html[data-theme="graphite"] .topic,html[data-theme="graphite"] .structure-group>summary,html[data-theme="graphite"] .back{color:#c9def2}
html[data-theme="graphite"] .body a{color:#a9d2fa}
html[data-theme="graphite"] .source{color:#edf5fc}
html[data-theme="graphite"] .language-picker select,html[data-theme="graphite"] .structure-controls button{color:#e7edf3}

html[data-theme="academic-blue"] body{background:radial-gradient(ellipse at 10% 0%,rgba(217,231,246,.9),transparent 34rem),linear-gradient(180deg,#edf3f9,#e7eef6)}
html[data-theme="academic-blue"] .body{background:linear-gradient(145deg,#fff 0%,#f7fafd 100%);box-shadow:0 12px 30px rgba(35,63,91,.11)}
html[data-theme="academic-blue"] .structure-group{background:#f6f9fc;border-color:#d6e1ec;box-shadow:0 4px 12px rgba(35,63,91,.06)}html[data-theme="academic-blue"] .structure-group>summary{background:#eaf1f8}
html[data-theme="maillard"] body{background:radial-gradient(ellipse at 10% 0%,rgba(255,250,240,.92),transparent 34rem),linear-gradient(180deg,#f4eadb,#eadcc9)}
html[data-theme="maillard"] .body{background:linear-gradient(145deg,#fffdf9 0%,#fff7eb 100%);box-shadow:0 12px 30px rgba(87,62,39,.14)}
html[data-theme="maillard"] .structure-group{background:#fbf2e5;border-color:#dfcdb4;box-shadow:0 4px 12px rgba(87,62,39,.08)}html[data-theme="maillard"] .structure-group>summary{background:#f1e3d0}



html[data-theme="academic-blue"] .body{box-shadow:0 12px 30px rgba(35,63,91,.11)}html[data-theme="academic-blue"] .structure-group{box-shadow:0 4px 12px rgba(35,63,91,.07)}
html[data-theme="maillard"] .body{box-shadow:0 12px 30px rgba(87,62,39,.14)}html[data-theme="maillard"] .structure-group{box-shadow:0 4px 12px rgba(87,62,39,.09)}
html[data-theme="graphite"] .body{box-shadow:0 12px 30px rgba(0,0,0,.34)}html[data-theme="graphite"] .structure-group{box-shadow:0 4px 13px rgba(0,0,0,.28)}
html[data-theme="pure-white"] .body{box-shadow:0 12px 30px rgba(26,41,58,.10)}html[data-theme="pure-white"] .structure-group{box-shadow:0 4px 13px rgba(26,41,58,.07)}

</style><main><nav class="toolbar"><a class="back" href="../index.html#library">${back}</a><a class="settings-link" data-settings-link href="../index.html#settings">${en ? 'Settings' : '设置'}</a>${picker}</nav><p class="topic" data-topic="${esc(c.language)}">${esc(topic)}</p><h1 data-display-title>${esc(displayTitle)}</h1>${sourceTitleNote}<div class="meta">${esc(c.sourceLabel || source?.organization || source?.author || (en ? 'Research card' : '研究卡片'))} · ${esc(c.date)}</span><span class="card-created" data-created-at="${esc(c.createdAt || '')}"></span></div>${sourceLink}${missing}${content}</main><script>(()=>{const select=document.querySelector('[data-card-language]');const blocks=[...document.querySelectorAll('[data-card-content]')];const note=document.querySelector('[data-language-note]');const label=document.querySelector('.sr-only');const titleNote=document.querySelector('.source-title');const themeSelect=document.querySelector('[data-card-theme]');const themeLabel=document.querySelector('[data-theme-label]');const themeNames={zh:['学术蓝白','暖麦纸感','墨石深灰','纯白极简'],en:['Academic blue & white','Warm paper','Graphite','Pure white']};function updateThemeNames(){const lang=select.value==='en'?'en':'zh';themeLabel.textContent=lang==='en'?'Interface theme':'界面主题';themeSelect.setAttribute('aria-label',themeLabel.textContent);[...themeSelect.options].forEach((option,index)=>option.textContent=themeNames[lang][index])}const themeOptions=['academic-blue','maillard','graphite','pure-white'];try{const savedTheme=localStorage.getItem('research-card:theme');if(themeOptions.includes(savedTheme))themeSelect.value=savedTheme}catch{}document.documentElement.dataset.theme=themeSelect.value;themeSelect.addEventListener('change',()=>{document.documentElement.dataset.theme=themeSelect.value;try{localStorage.setItem('research-card:theme',themeSelect.value)}catch{}});const data=${safeJson({topic:c.topicByLanguage||{},title:c.titleByLanguage||{},sourceTitle,summary:c.summaryByLanguage||{},createdAt:c.createdAt||'',available:Object.fromEntries(Object.entries(versions).map(([key,value])=>[key,Boolean(value)]))})};function apply(){const lang=select.value;updateThemeNames();document.documentElement.lang=lang==='en'?'en':'zh-CN';document.querySelector('.back').textContent=lang==='en'?'← Back to library':'← 返回卡片库';document.querySelector('[data-settings-link]').textContent=lang==='en'?'Settings':'设置';label.textContent=lang==='en'?'Display language':'显示语言';select.setAttribute('aria-label',label.textContent);document.querySelector('.source')?.replaceChildren(document.createTextNode(lang==='en'?'Open original ↗':'打开原文 ↗'));const topic=data.topic[lang];if(topic)document.querySelector('.topic').textContent=topic;const title=data.title[lang]||data.sourceTitle||${JSON.stringify(displayTitle)};document.querySelector('[data-display-title]').textContent=title;document.title=title;if(titleNote){titleNote.hidden=!data.sourceTitle||title===data.sourceTitle;titleNote.textContent=(lang==='en'?'Original article title: ':'原文标题：')+data.sourceTitle}const created=document.querySelector('.card-created');if(created&&data.createdAt){const date=new Intl.DateTimeFormat(lang==='en'?'en-US':'zh-CN',{year:'numeric',month:'short',day:'numeric'}).format(new Date(data.createdAt));created.textContent=lang==='en'?'Created '+date:'创建于 '+date}const chosen=blocks.find(x=>x.dataset.cardContent===lang);blocks.forEach(x=>x.hidden=x!==chosen);if(note){note.textContent=lang==='en'?'This card has no English version yet.':'这张卡片暂时没有对应语言版本。';note.hidden=data.available[lang]}}try{const saved=localStorage.getItem('research-card:language');if(saved==='en'||saved==='zh')select.value=saved}catch{}select.addEventListener('change',()=>{try{localStorage.setItem('research-card:language',select.value)}catch{};apply()});apply()})();</script></html>`;
}




