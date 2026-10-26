# Reusable research-card format

Use this format so a saved card can serve as source material for later writing, comparison, or decision work. Keep the human-readable summary concise; make claims and reuse boundaries easy to locate and cite.

## Structured metadata

The archive script writes YAML frontmatter for Markdown exports:

```yaml
schema_version: 3
id: stable-card-id
created_at: ISO timestamp when first archived; preserve this value on updates
card_type: source_summary # or source_comparison
display_language: zh
title: Localized display title
topics:
  - Topic
keywords:
  - searchable term
sources:
  - title: Exact source title
    url: https://example.org/article
    publisher: Publisher or organization
    author: Author when visible
    published_at: YYYY-MM-DD when visible
reuse:
  can_use_for: A concrete kind of next-step work
  claim_ids: [C01, C02]
  guardrails: What the cited sources do not establish
  next_checks: A specific follow-up verification or question
article_structure:
  origin: source # or editorial when source headings are absent
  sections:
    - id: S01
      source_heading: Exact source heading when present
      title: Localized section title
      summary: Short section summary
      claims:
        - id: C01
          statement: One reusable viewpoint
          type: reported_fact # or author_interpretation, analysis
          examples: []
          evidence_quote: Exact short quotation
          locator: Section or paragraph description
          source_url: https://example.org/article
```

Use JSON-quoted YAML strings when generating metadata. Leave unavailable source metadata absent or unknown; never guess it. Topics and keywords should describe the actual source, not broad speculative associations.

## Claim records

- Under each article-structure section, give every distinct, reusable claim one stable ID (`C01`, `C02`, …); use the same IDs in the Chinese and English versions.
- Keep one claim per bullet. Mark whether it is a reported fact, the source author's interpretation, or this card's analysis when that distinction matters.
- Attach a short exact quotation, a section or paragraph locator, and the direct URL for every important claim. Do not invent page numbers, timestamps, or anchors.
- Preserve the denominator, population, timeframe, comparator, and units for numerical claims. Say when a number is an estimate, survey result, or company-reported figure.
- In comparisons, identify the source for each claim and distinguish shared conclusions from disagreements. Do not present source summaries as independent verification.

## Article structure and claim records

Use the source's substantive headings and their original order as the outer layer. Each section has a short summary; its expandable body contains the section's distinct reusable viewpoints. Put examples, data, counterexamples, and exact evidence inside the claim they support, not in a detached examples list. Keep evidence links and locators with each claim. Do not make a heading for every paragraph or force a structure the article does not have.

The JSON field `sectionsByLanguage` stores this hierarchy for both `zh` and `en`. Each section has `id` (`S01`...), `sourceHeading` when the source supplies one, localized `title` and `summary`, and a `claims` array. Each claim has a bilingual-stable `id` (`C01`...), `statement`, optional `claimType`, `examples` array, `evidenceQuote`, `locator`, and `sourceUrl`. Section and claim IDs must be the same in both languages. Use `structureOrigin: "source"` when headings follow the article; use `structureOrigin: "editorial"` when the source has no usable headings. For comparisons, sections can represent themes across sources; preserve source identity on every claim.

Markdown renders the hierarchy as `## Article Structure` → `### S01 | Section title` → section summary → claim bullets → indented example/data/evidence bullets. HTML presents each section as a keyboard-accessible `<details>` group, with an expand/collapse-all control. Exports preserve the same nesting. Old cards without section data are shown as one labelled legacy group; do not invent source headings during migration.

## Next-work interface

End each language version with a localized `Next-work interface` section containing these fields:

- **Useful for:** a concrete follow-on task, such as drafting background, comparing approaches, or framing a decision.
- **Claims to reuse:** the relevant claim IDs, not a repeated summary.
- **Guardrails:** what cannot safely be concluded from these sources; carry forward material caveats from `Evidence and Limitations`.
- **Next checks:** a concrete fact, data point, counter-source, or open question to verify before relying on the card. If none is apparent, state that rather than inventing one.

Do not turn an article's recommendation into the card's recommendation. For decision use, say what decision criteria or evidence are missing; do not prescribe a decision without user context and adequate evidence.

## Reading structure

For a single source, use this order:

1. Localized title and source metadata.
2. Topic and one-sentence summary.
3. `Article Structure` with section summaries and nested claim records, or `Key Points` for legacy cards only.
4. `Evidence and Limitations`.
5. `Next-work interface`.

For multiple sources, preserve every original title and add a `Sources` section before the comparison. Put source-specific evidence there; give the synthesis claims stable IDs under `Key Points`. The reusable interface should point to those synthesis IDs.

Chinese headings: `文章结构`, `证据与局限`, `后续工作接口`, `可用于`, `可调用观点`, `使用边界`, `下一步核查`. English headings: `Article Structure`, `Evidence and Limitations`, `Next-work Interface`, `Useful for`, `Claims to reuse`, `Guardrails`, `Next checks`.

