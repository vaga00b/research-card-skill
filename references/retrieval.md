# Retrieve and reuse saved cards

Use this workflow when the user asks what the library says about a topic, wants cards compared, or wants to use saved research in a draft, analysis, or decision.

## Access and search

1. Confirm that the local library is accessible in the current session. The default is `Documents/Research Card Library`; use a user-specified library path when provided. A hosted viewer, screenshot, or browser `localStorage` is not the local card store. Do not claim to search a library that this session cannot read.
2. Convert the request into two or three short search phrasings: the user's words plus likely synonyms or neighboring concepts. Search them together:

   ```sh
   node <skill-folder>/scripts/search-cards.mjs --library "<library-folder>" --query "<user's wording>" --query "<synonym or related wording>" --language zh --limit 8
   ```

   Use `--language en` for English cards or `--language both` when the request or library warrants it. The helper reads `cards.json`, deduplicates results across query phrasings, and returns matching query terms, sections, claims, evidence, and source URLs. It is a candidate finder, not evidence by itself.
3. Review whether the hits actually answer the request. If no relevant hit appears, try one better synonym or narrower phrase; do not pad the response with loosely related matches. Open the full Markdown file for each promising result (`cards/<id>.md`, or `.zh.md` / `.en.md`) and verify the claim, quotation, locator, caveat, and source URL before reusing it.
4. If the library path is inaccessible, ask the user to open the local Codex workspace or attach the relevant card files. Do not silently substitute the hosted card-library site, which is a separate copy and may not include recent local cards.

## Reuse in a response or deliverable

- Cite each reused viewpoint as `[card title, Cxx]`, link the original source, and include the card's short exact quotation or precise locator where it helps the reader verify the claim. Stable `Cxx` identifiers remain the same across languages.
- For comparisons, make a compact evidence table with one row per relevant claim and identify agreements, disagreements, differences in evidence quality, and unanswered questions. Do not turn several cards into a false consensus.
- For drafting or analysis, synthesize in the user's requested format, but keep source-backed statements distinct from the assistant's inference. Carry forward the card's guardrails; do not present a card summary as independent verification.
- For decisions, use the cards to surface criteria and evidence, not to prescribe a choice without the user's context or enough evidence. Identify the next checks that could change the conclusion.
- Report the scope of the search when useful (number of cards examined and which relevant cards were used). If no card supports the task, say that plainly; offer to research a new source only when that fits the request.

## Result shape

Keep the answer proportionate to the task. A typical retrieval response contains:

1. A direct answer to the user's question.
2. Relevant claims with card IDs and source links.
3. Important limits, disagreements, or missing evidence.
4. A usable next step or draft when the user requested one.

Do not return a dump of every search hit when a short evidence-backed synthesis answers the question.


