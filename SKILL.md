---
name: research-card
description: Turn webpages or documents into evidence-linked research cards in Chinese or English, save them to a personal offline library, and retrieve saved claims for writing, comparison, and decision work.
license: PolyForm-Noncommercial-1.0.0
---

# Research Card

Create concise notes that help the reader understand a source, verify its claims, and find it again. A card is more than a shortened retelling: link each important claim to evidence, and distinguish the author's claims from your analysis.

## Workflow

Choose the workflow that matches the request:

- New article or document → follow **New-source card workflow**.
- A question about saved material, or a request to write, compare, or decide using saved cards → follow [references/retrieval.md](references/retrieval.md), not the new-source workflow.
- Both new and saved material → retrieve relevant cards and read the new source before synthesizing.

## New-source card workflow

1. Read the supplied page or document. If it is inaccessible, say so and ask for pasted text or an accessible copy. Do not infer its contents from a title or search snippets.
2. Record source metadata only when visible: title, author or organization, date, and canonical URL. Mark missing details unknown rather than guessing.
3. Map the article's actual structure first. For each substantial source section, write a short section summary, then place its reusable viewpoints under it. Keep important examples, figures, and counterexamples nested under the viewpoint they support; attach a precise evidence pointer and a brief, exact quotation to each claim. Link the section when a stable link exists; otherwise link the full source and identify the section or paragraph position. Do not flatten a long article into one undifferentiated list. If the source has no usable headings, create clearly labelled thematic groups and mark them as editorial organization.
4. Separate the source's claims from analysis. Note material caveats, missing evidence, or open questions. Label opinion and promotional material, and do not present their assertions as independently verified facts.
5. For multiple sources, compare agreement, disagreement, evidence, and gaps. Do not claim to compare against a knowledge base that is not available.
6. Follow the requested language as the default display and conversation language. Unless the user asks for a single-language or chat-only card, prepare complete, equivalent Chinese and English card versions so the reader can switch the card body later. Keep source titles and exact quotations in their original language in both versions; translate summaries, analysis, headings, and evidence context. Do not translate quotations. If an older saved card has only one version, say so instead of implying it was translated.
7. Before drafting a new card, read [the reusable card format](references/reusable-card-format.md). Before archiving, review every important claim against the source in context: quotations must be verbatim and directly support the claim; numerical claims retain their denominator, timeframe, comparator, and units; reported facts, the author's interpretation, and this card's analysis stay distinct. Do not claim a semantic quote check was automated. Run `node <skill-folder>/scripts/validate-card.mjs --input <card-json>` and resolve structural/evidence-field errors before archiving. Treat the output as source material for future writing, comparison, and decisions, not only as a short retelling. Return the finished card in Markdown in the conversation. Unless the user asks for chat-only output or another destination, also archive it in the user's **local research-card library** as described below. Confirm that the archive script succeeded and the generated card files exist before saying it was saved. After saving, put a prominent clickable link to the standalone HTML card in the reply, plus a link to the library home when useful. The user should be able to click the card link and read the formatted card directly. The website is a viewer and organizer; it does not generate cards or call a model API.

## Local library

The distributable package includes a standalone HTML library and scripts. It works offline after installation and stores the user's cards on their own computer.

- Default location: `Documents/Research Card Library`. Do not overwrite user files. To install or repair the library, run `node <skill-folder>/scripts/install-library.mjs`; it migrates recognizable card links from an existing library, backs up a prior `index.html` once, and keeps card files. If the target is different, pass `--path <folder>`.
- After creating a card, make a JSON file containing the card fields below in a temporary directory, then run `node <skill-folder>/scripts/archive-card.mjs --library <library-folder> --input <card-json>`. Remove the temporary input afterward. Do not put temporary files in the library.
- After a successful archive, link directly to `Documents/Research Card Library/cards/<id>.html` using the actual absolute path returned/known in the current environment, and optionally link `Documents/Research Card Library/index.html` as the library entry. Use the app's normal clickable local-file link syntax. Do not invent a `file://` URL or claim the card is saved on the user's computer if this session cannot access that computer's filesystem. In that case, return the card in chat and explain that local saving could not be completed; provide a downloadable file only if the current environment supports creating one.
- Card JSON fields: `title` (the card's preferred-language display title), `titleByLanguage`, `topicByLanguage`, and `summaryByLanguage` (`zh` and `en` display strings), `cardType` (`source_summary` or `source_comparison`), `sourceTitle` (the exact article title for a single-source card; omit for multi-source cards), `date` (source publication date when available), `createdAt` (ISO timestamp for when this card first entered the library; the archive script creates it and preserves it when updating an existing card), `language` (`zh` or `en`, the preferred display language), `sourceLabel`, `keywords` (array), `sources` (array of objects containing each exact `title`, `author`, `organization`, `date`, `url`, `fullTextUrl` when available), `sectionsByLanguage` (equivalent `zh` and `en` arrays of section records; each section has `id`, `title`, `summary`, optional `sourceHeading`, and `claims`; each claim has a stable `id`, `statement`, optional `claimType`, `examples` array, `evidenceQuote`, `locator`, and `sourceUrl`), `reuseByLanguage` (equivalent `zh` and `en` objects with `useFor`, `claimIds`, `guardrails`, and `nextChecks`), and `markdownByLanguage` (`zh` and `en` containing complete equivalent Markdown cards). Each Markdown card heading uses its localized display title; exact source titles stay in `Source` metadata and source entries. Keep claim IDs identical across languages. Set top-level `markdown` to the preferred language's exact version for compatibility. `id` is optional; use a short date-title slug when helpful.
- `sectionsByLanguage` is the canonical structured content for new cards. The archive renderer writes nested Markdown and turns each article section into an accessible expandable group in HTML. Examples and data stay nested inside the viewpoint they support. If a source has no clear headings, use thematic titles and set `structureOrigin: "editorial"`; do not imply these are source headings. Older cards without structured sections remain readable under a clearly labelled legacy “Core findings” group.
- `archive-card.mjs` adds stable YAML frontmatter, claim IDs, and a localized “Next-work interface” section from these fields to both Markdown versions. It hides frontmatter in the reading HTML while preserving it in Markdown exports so other agents and note tools can index the card. When upgrading existing libraries, run `node <skill-folder>/scripts/upgrade-library-format.mjs --library <library-folder>`; it creates a backup before rewriting existing cards.
- The archive script writes the preferred version to `cards/<id>.md`, language-specific copies to `cards/<id>.zh.md` and `cards/<id>.en.md`, a self-contained `cards/<id>.html` with a language switch, `cards.json`, and refreshes `index.html`. The selected display language controls the library interface, card cover title, detail title, and body. For single-source cards, when the display title differs from the source title, the detail page shows the original title separately. Multi-source cards keep each source title in its source entry. It matches existing cards by their canonical source URL set and updates the same card instead of duplicating it. The browser's folder assignments and hidden-card choices are kept in that browser's local storage; deleting from the view does not erase the card files.
- If Node.js is unavailable, the library path is not writable, or installation/archive fails, still return the card in chat and state clearly that it was not saved locally. Never silently claim it was archived. If the user asks for chat-only output, do not archive.

## Using saved cards

When the task depends on previously archived material, search the local library and inspect the matching Markdown cards before answering. Return claim IDs and original-source links with evidence; explain when the library has no useful match. Follow [references/retrieval.md](references/retrieval.md) for retrieval, comparison, drafting, and access boundaries.

## Single-source card format

For Chinese cards, use the following headings and order. Keep `（可选）` only when it has useful content; omit it otherwise. Use the localized display title as the heading and keep the source's exact title in the `来源` metadata.

```markdown
# [原文标题]

- **来源：**[作者或机构] · [日期] · [原文链接]
- **主题：**[简短主题]
- **一句话概括：**[文章核心结论]

## 文章结构
按原文的章节顺序概括；以下标题应对应原文标题。若原文没有清晰标题，改用主题标题，并注明“以下为主题归组”。

### S01｜[原文章节标题]
[本节内容概括]
- **[C01] [观点]**：[一个可单独引用的原文主张]
  - **重要例子/数据：**[保留能说明观点的案例、数字或反例；没有则省略]
  - **原文依据：**“[简短原文引文]” ([章节或段落；原文链接])

### S02｜[原文章节标题]
[本节内容概括]
- **[C02] [观点]**：[主张]
  - **原文依据：**“[简短原文引文]” ([章节或段落；原文链接])

## 证据与局限
- [证据类型、来源可靠性和重要限制；区分报道转述与独立核验。]

## 后续工作接口
- **可用于：**[具体的后续写作、比较或决策任务]
- **可调用观点：**[C01]
- **使用边界：**[原文没有证明什么；与“证据与局限”保持一致]
- **下一步核查：**[应查证的事实、数据或反方来源；没有明确问题时如实注明]
```

For English single-source cards, use the same structure with these headings: `Source`, `Topic`, `In one sentence`, `Key Points`, `Evidence and Limitations`, and `Next-work Interface`. Use the localized display title as the heading and include the source's exact title in the `Source` metadata.

## Multiple-source card format

Preserve every source's actual title and use this format when the user provides multiple sources. Include evidence from each source in relevant comparison points.

```markdown
# 多来源对照：[主题]

- **来源：**[原文标题] — [作者或机构] · [日期] · [原文链接]；[其余来源……]
- **主题：**[简短主题]
- **一句话概括：**[共同结论或最重要的分歧]

## 文章结构
比较卡按可比主题组织；不要假装多篇文章共享同一套原文章节。

### S01｜[比较主题]
[这一主题下来源之间的共同点或差异概括]
- **[C01] 共同点：**[共同主张]。
  - **重要例子/数据：**[保留支持共同点的实例或数据]
  - **原文依据：**“[来源一短引文]” ([章节；来源一链接])；“[来源二短引文]” ([章节；来源二链接])

### S02｜[另一比较主题]
[这一主题下的差异或互补之处]
- **[C02] 差异或互补：**[重要差异或互补之处]。
  - **原文依据：**[分别附短引文和来源链接]

## 证据与局限
- [比较证据质量、来源立场、时效差异，以及无法由这些来源确认的事项。]

## 后续工作接口
- **可用于：**[具体的后续写作、比较或决策任务]
- **可调用观点：**[C01]、[C02]
- **使用边界：**[来源类型、分歧、时效或证据限制]
- **下一步核查：**[应查证的事实、数据或反方来源；没有明确问题时如实注明]
```

For English multi-source cards, translate the headings and labels (`Source`, `Topic`, `In one sentence`, `Key Points`, `Shared ground`, `Differences or complements`, `Evidence and Limitations`, and `Next-work Interface`) while preserving each source title and quotation verbatim.

Every key claim needs a source link and a brief, exact quotation. Do not invent paragraph numbers or URL anchors. Keep the card proportionate to the source and request. Preserve the author's meaning and clearly label interpretation.



