# Research Card Skill

Writing an article often starts with a pile of sources. You skim several pages, keep a few promising ones, and read those closely. Research Card turns the webpages and documents you select into structured notes, with claims, examples, and quotations tied to the evidence and source. Save cards as you research, then search your local library when you need to check a fact, compare sources, or find support for a draft.

Research Card is a reusable workflow for Codex, not a standalone app. Install the Skill so Codex can read a webpage or document you provide, build an evidence-linked card, and save it to your local library.

## What it does

- Keeps the article's structure, so you can see which section a claim came from instead of getting a flat list of takeaways.
- Gives you Chinese and English versions for cross-language research and drafting. Source titles and exact quotations stay in their original language.
- Saves Markdown and standalone HTML cards in a library on your computer, ready to open offline after they are archived.
- Lets you search saved cards and return to claim IDs and source links when drafting, comparing articles, or checking a detail.
- Keeps the library local. This package does not upload cards to a Research Card website or call a separate model API. Codex reads sources through the platform and tools available in your session.

Codex reads and summarizes the sources. Access to online material depends on the platform and tools available in your session. Once installed, the local library viewer works offline.

## Who it's for

- Article writers, journalists, editors, and newsletter creators collecting facts, examples, and quotations for a piece.
- Students and researchers organizing papers and reports around a topic or research question.
- Analysts and consultants comparing sources while preparing a briefing or recommendation.

## What a card looks like

A card keeps the source, article structure, reusable claims, evidence, and follow-up checks together. Here is a shortened outline; the actual card uses the source's headings and evidence:

```markdown
# [Card title]

- Source: [Article title and link]
- Topic: [Topic]
- In one sentence: [Main conclusion]

## Article Structure

### S01 | [Source section]
[Short section summary]
- [C01] [Reusable claim from the source]
  - Evidence: "[Exact quotation]" ([section or paragraph], [source link])
  - Example or data: [Example that supports the claim]

## Evidence and Limitations
- [Important caveat or missing evidence]

## Next-work Interface
- Useful for: [A writing, comparison, or decision task]
- Claims to reuse: C01
- Guardrails: [What the source does not establish]
- Next checks: [What to verify]
```

## Before you install

- You need Codex with Skills support. A Skill is a reusable set of instructions Codex can call for a task.
- Node.js is needed for the local library's install, archive, search, and upgrade scripts.
- Internet access may be needed to read online sources. Archived cards and the library viewer stay on your computer and can be opened offline.
- The Skill checks card structure and evidence fields. Verify quotations and their context before relying on them.
- The local library does not sync to a hosted service. Back it up with your other files.

## Package contents

- `SKILL.md` contains the workflow and card schema.
- `scripts/` contains helpers for installation, archiving, retrieval, validation, and upgrades.
- `references/` contains the card format and retrieval guidance.
- `assets/library-template/` contains the offline library viewer.

## Install

Put the package in Codex's Skills folder so Codex can discover `$research-card`. For a new install, run the command for your system.

macOS or Linux:

```sh
mkdir -p ~/.codex/skills
git clone https://github.com/vaga00b/research-card-skill.git ~/.codex/skills/research-card
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null
git clone https://github.com/vaga00b/research-card-skill.git "$env:USERPROFILE\.codex\skills\research-card"
```

You can also [download the ZIP](https://github.com/vaga00b/research-card-skill/archive/refs/heads/main.zip), extract it, and place the package folder at the same location. Keep all package files together.

On first use, the Skill creates `Documents/Research Card Library`. Open its `index.html` to browse your cards.

To initialize the library yourself:

```sh
node scripts/install-library.mjs
```

To choose another library location:

```sh
node scripts/install-library.mjs --path "path/to/research-card-library"
```

The installer recognizes and preserves existing cards. If the target folder contains an unrelated `index.html`, it stops rather than overwrite it. Keep `cards/` and `cards.json` alongside `index.html`.

## Quick start

In a Codex chat, enter `$research-card`, add a webpage URL or document, and say what you need the notes for. For example:

```text
$research-card
Make a concise, evidence-linked card for this article. Keep its section structure and include exact quotations for the main claims.
https://example.com/article
```

The card appears in the conversation. When local archiving succeeds, Markdown and HTML copies are saved in `Documents/Research Card Library`.

## Use saved cards

Ask `$research-card` about material you saved earlier to retrieve claims and compare sources. You can also search from a terminal:

```sh
node scripts/search-cards.mjs --query "healthspan" --language en --limit 8
```

Use **Settings** in the library to change its display language or theme. New cards include Chinese and English versions by default. Existing cards in one language stay as they are; the Skill does not translate them without being asked.

## FAQ

- **Does the library sync between devices?** No. It is a local folder; move or back it up yourself.
- **Can I open saved cards offline?** Yes. The viewer and archived files are local. Reading a new online source may still require internet access.
- **Does the Skill verify every quotation automatically?** It checks structure and evidence fields. You should confirm each quotation and its context before relying on it.

## Feedback and contributions

Found a problem or have an idea for improving the workflow? [Open a GitHub issue](https://github.com/vaga00b/research-card-skill/issues). For a larger change, start with an issue so we can discuss the scope.

## License

This project uses the PolyForm Noncommercial License 1.0.0 ([LICENSE](LICENSE)). You may use, modify, and redistribute it for noncommercial purposes under the license terms. Commercial use requires separate permission from the rights holder. The source is available, but this is not an OSI-approved open-source license.

---

# Research Card Skill（中文）

写文章时，手头常常先攒了一堆材料：网页粗读一遍，留下几篇，再仔细看其中有用的部分。Research Card 会把选中的网页和文档整理成结构化笔记，让观点、例子、引文和证据都连回原文。读到一篇就存一篇；写稿时要核对事实、比较来源或找段落依据，可以从本地资料库里搜出来。

Research Card 是给 Codex 调用的一套可复用工作流程，不是独立软件。安装后，Codex 可以按这套流程阅读你提供的网页或文档、整理证据卡片，并在归档成功时保存到本地资料库。

## 功能

- 按原文章节归纳内容，观点、例子、数字和引文都留在对应位置，方便写作时找回上下文。
- 每张卡片都有中英文两版，适合用中文研究、再用英文写作等跨语言工作；原文标题和精确引文保留原语言。
- 卡片保存为 Markdown 和独立 HTML，放在本机资料库里，归档后可离线查看。
- 可以检索已存卡片，从观点编号和来源链接回到依据，方便核对事实、比较材料和继续写作。
- 资料库保存在本机。本包不会把卡片上传到 Research Card 网站，也不会调用独立的模型 API。Codex 阅读来源时使用当前会话的平台和工具。

## 适合谁

- 文章写手、记者、编辑和公众号作者：写科普、评论、深度报道或行业文章时收集事实、案例和引文，并随时回查原文。
- 学生与研究者：围绕课程或选题整理论文、报告和不同研究的观点。
- 行业分析师、咨询顾问和政策研究者：比较多份材料，为简报、分析和建议留存依据。

## 卡片长什么样

一张卡片把来源、文章结构、可复用观点、证据和后续核查放在一起。下面是精简结构示意；实际卡片会使用原文标题和对应证据：

```markdown
# [卡片标题]

- 来源：[文章标题和链接]
- 主题：[主题]
- 一句话概括：[文章核心结论]

## 文章结构

### S01｜[原文章节]
[本节简要概括]
- [C01] [可复用观点]
  - 原文依据：“[精确引文]” ([章节或段落], [来源链接])
  - 例子或数据：[原文用于支持观点的例子]

## 证据与局限
- [重要限制或缺失证据]

## 后续工作接口
- 可用于：[写作、比较或决策任务]
- 可调用观点：C01
- 使用边界：[来源没有证明什么]
- 下一步核查：[还需要确认什么]
```

## 安装前先看

- 需要支持 Skills 的 Codex。Skill 是一组可重复调用的工作指引，告诉 Codex 如何处理某类任务。
- 本地资料库的安装、归档、检索和升级脚本需要 Node.js。
- 阅读在线来源可能需要联网；归档后的卡片和资料库页面保存在本机，可离线打开。
- Skill 会检查卡片结构和证据字段。使用前仍需确认引文准确，并且在原文语境中支持对应观点。
- 资料库不在设备间自动同步，请自行备份。

## 包含哪些文件

- `SKILL.md`：工作流程和卡片结构。
- `scripts/`：安装、归档、检索、校验和升级脚本。
- `references/`：卡片格式和检索说明。
- `assets/library-template/`：离线资料库页面模板。

## 安装

将整个包放到 Codex 的 Skills 文件夹，Codex 才能找到 `$research-card`。首次安装可按系统运行对应命令。

macOS 或 Linux：

```sh
mkdir -p ~/.codex/skills
git clone https://github.com/vaga00b/research-card-skill.git ~/.codex/skills/research-card
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null
git clone https://github.com/vaga00b/research-card-skill.git "$env:USERPROFILE\.codex\skills\research-card"
```

也可以[下载 ZIP](https://github.com/vaga00b/research-card-skill/archive/refs/heads/main.zip)，解压后把整个包放到对应目录。不要拆开包内文件。

首次使用时，Skill 会在 `Documents/Research Card Library` 创建资料库。打开其中的 `index.html` 就能浏览卡片。

手动初始化资料库：

```sh
node scripts/install-library.mjs
```

指定其他位置：

```sh
node scripts/install-library.mjs --path "library folder"
```

安装器会识别并保留已有卡片。如果目标目录里的 `index.html` 与资料库无关，安装器会停止，避免覆盖文件。请让 `cards/`、`cards.json` 和 `index.html` 保持在同一目录下。

## 快速开始

在 Codex 对话中输入 `$research-card`，附上网页链接或文档，再说明卡片要用于什么。比如：

```text
$research-card
请按文章结构整理这篇文章，给主要观点附上精确引文和来源链接。
https://example.com/article
```

卡片会先出现在对话里。成功归档后，Markdown 和 HTML 文件也会保存在 `Documents/Research Card Library`。

## 检索已保存的卡片

想找回以前保存的内容，可以直接问 `$research-card`，也可以在终端运行检索脚本：

```sh
node scripts/search-cards.mjs --query "健康寿命" --language zh --limit 8
```

资料库的“设置”页面可以切换显示语言和主题。新卡片默认保存中英文两版；已有的单语卡片不会被自动翻译。

## 常见问题

- **资料库会在不同设备间同步吗？** 不会。它是本地文件夹，需要自行迁移或备份。
- **没有网络能打开卡片吗？** 可以。已归档的卡片和资料库页面保存在本机；读取新的在线来源时可能仍需要联网。
- **引文会自动核实吗？** Skill 会检查结构和证据字段，但仍需回到原文确认引文准确，并且语境支持对应观点。

## 反馈与贡献

发现问题或有改进建议，可以[提交 GitHub Issue](https://github.com/vaga00b/research-card-skill/issues)。如果想做较大的改动，欢迎先开 Issue 讨论范围。

## 许可证

本项目采用 PolyForm Noncommercial License 1.0.0，具体条款见 [LICENSE](LICENSE)。你可以按许可证条款非商业地使用、修改和再发布本项目；商业用途需要另行取得权利人许可。源代码可以查看，但这不是 OSI 认可的开源许可证。








