[English](#research-card-skill) · [简体中文](#research-card-skill-中文)

# Research Card Skill

Skimming several sources for an article is easy; finding the exact claim and its evidence again while drafting is harder. Research Card turns selected webpages and documents into structured notes, then saves them in a local library you can search when writing, comparing sources, or checking a detail.

Research Card is a reusable workflow for Codex. Give it a source and a task, and Codex can build an evidence-linked card and archive it locally.

## What it does

- Preserves the source's section structure, so a claim stays connected to the part of the article it came from.
- Creates Chinese and English versions for cross-language research and drafting. Source titles and exact quotations remain in their original language.
- Saves Markdown and standalone HTML cards in a local library you can open offline.
- Searches saved cards and returns claim IDs and source links for drafting, comparison, and fact-checking.
- Keeps your library on your computer. This package does not upload cards to a Research Card website or call a separate model API; Codex reads sources through the tools available in your session.

## Who it's for

- Writers, journalists, editors, and newsletter creators collecting evidence and quotations for a draft.
- Students and researchers organizing papers and reports around a question.
- Analysts, consultants, and policy researchers comparing sources for a briefing or recommendation.

## What a card looks like

Here is a shortened example based on the [WHO's “Ageing and health” fact sheet](https://www.who.int/news-room/fact-sheets/detail/ageing-and-health). The quotation stays in the source's original language; the claim and notes can be read in either display language.

```markdown
# Population ageing

- Source: WHO, [Ageing and health](https://www.who.int/news-room/fact-sheets/detail/ageing-and-health)
- Topic: Population ageing
- In one sentence: WHO projects that the global share of people aged 60 and over will rise from 12% in 2015 to 22% in 2050.

## Article Structure

### S01 | Key facts
- [C01] The share of people aged 60 and over is projected to nearly double between 2015 and 2050.
  - Evidence: “Between 2015 and 2050, the proportion of the world's population over 60 years will nearly double from 12% to 22%.” (WHO fact sheet)

## Evidence and Limitations
- This figure is global; a country-level comparison needs country-specific data.

## Next-work Interface
- Useful for: Background in a piece about population ageing.
- Claims to reuse: C01
- Guardrail: This projection alone does not establish future health outcomes.
```

## Before you install

- You need Codex with Skills support.
- Node.js is required for the library's install, archive, search, and upgrade scripts.
- Git is required for the clone commands below. To install without Git, use the ZIP download.
- Reading online sources may require internet access. Check quotations and their context against the original source before relying on them.

## Package contents

- `SKILL.md`: workflow and card schema.
- `scripts/`: installation, archiving, retrieval, validation, and upgrade helpers.
- `references/`: card format and retrieval guidance.
- `assets/library-template/`: offline library viewer.

## Install

Put the package in Codex's Skills folder so Codex can find `$research-card`.

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

Or [download the ZIP](https://github.com/vaga00b/research-card-skill/archive/refs/heads/main.zip), extract it, and move the folder containing `SKILL.md` to `~/.codex/skills/research-card` (Windows: `%USERPROFILE%\.codex\skills\research-card`). Keep the package files together.

The first use creates `Documents/Research Card Library`. Open its `index.html` to browse saved cards. To initialize the library manually:

```sh
node scripts/install-library.mjs
```

Choose a different location with:

```sh
node scripts/install-library.mjs --path "path/to/research-card-library"
```

The installer preserves existing cards. If the target contains an unrelated `index.html`, it stops rather than overwrite it. Keep `cards/`, `cards.json`, and `index.html` together.

## Quick start

In a Codex chat, enter `$research-card`, add a webpage URL or document, and say what you need the notes for:

```text
$research-card
Make a concise, evidence-linked card for this article. Keep its section structure and quote the source for its main claims.
https://example.com/article
```

The card appears in the conversation. If archiving succeeds, Markdown and HTML copies are saved in `Documents/Research Card Library`.

## Find saved cards

Ask `$research-card` to retrieve or compare material you saved earlier. Or search from a terminal:

```sh
node scripts/search-cards.mjs --query "healthspan" --language en --limit 8
```

The library's Settings page changes its display language and theme. New cards include Chinese and English versions by default; existing cards are not translated automatically.

## FAQ

- **Does the library sync between devices?** No. It is a local folder; move or back it up yourself.
- **Can I open saved cards offline?** Yes. The viewer and archived files are local. Reading a new online source may require internet access.
- **Does the Skill verify quotations automatically?** It checks card structure and evidence fields. Confirm each quotation and its context in the original source.

## Feedback and contributions

[Open an issue](https://github.com/vaga00b/research-card-skill/issues) to report a problem or suggest an improvement. For larger changes, start with an issue so the scope is clear before work begins.

## License

This project uses the PolyForm Noncommercial License 1.0.0 ([LICENSE](LICENSE)). You may use, modify, and redistribute it for noncommercial purposes under the license terms. Commercial use requires separate permission from the rights holder. The source is available, but this is not an OSI-approved open-source license.

---

# Research Card Skill（中文）

[English](#research-card-skill) · [简体中文](#research-card-skill-中文)

写文章时，常常要先粗读一批材料，再挑出几篇细看。Research Card 会把选中的网页和文档整理成带证据的结构化卡片，保存到本地资料库。写稿、比较来源或核对细节时，可以再搜回来。

Research Card 是一套供 Codex 调用的工作流程。提供来源和任务后，Codex 可以按流程整理卡片，并在归档成功时保存到本地。

## 功能

- 保留原文的章节结构，观点能对应回它所在的章节，查上下文更方便。
- 生成中英文两版，适合跨语言研究和写作；原文标题和精确引文保留原语言。
- 将卡片保存为 Markdown 和独立 HTML，在本地资料库中离线查看。
- 检索已保存的卡片，从观点编号和来源链接找回依据，用于写作、比较材料和核对事实。
- 资料库保存在本机。本包不会把卡片上传到 Research Card 网站，也不会调用独立的模型 API；Codex 通过当前会话可用的工具读取来源。

## 适合谁

- 文章写手、记者、编辑和 newsletter 作者：收集写稿需要的事实、案例和引文，之后还能回查来源。
- 学生与研究者：围绕一个问题整理论文和报告。
- 行业分析师、咨询顾问和政策研究者：比较材料，为简报或建议留存依据。

## 卡片长什么样

下面的精简示例取自 [世界卫生组织的《Ageing and health》资料页](https://www.who.int/news-room/fact-sheets/detail/ageing-and-health)。观点和说明可以切换为中文，原文引文仍保留英文。

```markdown
# 人口老龄化

- 来源：世界卫生组织，[Ageing and health](https://www.who.int/news-room/fact-sheets/detail/ageing-and-health)
- 主题：人口老龄化
- 一句话概括：世卫组织预计，全球 60 岁及以上人口占比将从 2015 年的 12% 升至 2050 年的 22%。

## 文章结构

### S01｜关键事实
- [C01] 2015 至 2050 年间，全球 60 岁及以上人口占比预计将接近翻倍。
  - 原文依据：“Between 2015 and 2050, the proportion of the world's population over 60 years will nearly double from 12% to 22%.”（世卫组织资料页）

## 证据与局限
- 这项数字是全球比例；比较具体国家时还要查各国数据。

## 后续工作接口
- 可用于：介绍人口老龄化的文章背景。
- 可调用观点：C01
- 使用边界：仅凭这项预测，无法推断未来健康状况。
```

## 安装前先看

- 需要支持 Skills 的 Codex。
- 资料库的安装、归档、检索和升级脚本需要 Node.js。
- 使用下面的克隆命令需要 Git。没有 Git 时，可以下载 ZIP 安装。
- 阅读在线来源可能需要联网。引用内容前，请回到原文核对引文和上下文。

## 包含哪些文件

- `SKILL.md`：工作流程和卡片结构。
- `scripts/`：安装、归档、检索、校验和升级脚本。
- `references/`：卡片格式和检索说明。
- `assets/library-template/`：离线资料库页面。

## 安装

将整个包放到 Codex 的 Skills 文件夹，Codex 才能找到 `$research-card`。

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

也可以[下载 ZIP](https://github.com/vaga00b/research-card-skill/archive/refs/heads/main.zip)，解压后把包含 `SKILL.md` 的文件夹移到 `~/.codex/skills/research-card`（Windows：`%USERPROFILE%\.codex\skills\research-card`）。包内文件需要放在一起。

首次使用时，Skill 会在 `Documents/Research Card Library` 创建资料库。打开其中的 `index.html` 就能浏览卡片。手动初始化可以运行：

```sh
node scripts/install-library.mjs
```

指定其他位置：

```sh
node scripts/install-library.mjs --path "library folder"
```

安装器会保留已有卡片。如果目标目录里有无关的 `index.html`，安装器会停止，避免覆盖文件。请让 `cards/`、`cards.json` 和 `index.html` 保持在同一目录下。

## 快速开始

在 Codex 对话中输入 `$research-card`，附上网页链接或文档，再说明卡片要用于什么：

```text
$research-card
请按文章结构整理这篇文章，给主要观点附上精确引文和来源链接。
https://example.com/article
```

卡片会出现在对话里。归档成功后，Markdown 和 HTML 副本会保存在 `Documents/Research Card Library`。

## 检索已保存的卡片

可以直接让 `$research-card` 找回或比较之前保存的材料，也可以在终端运行：

```sh
node scripts/search-cards.mjs --query "健康寿命" --language zh --limit 8
```

资料库的“设置”页面可以切换显示语言和主题。新卡片默认包含中英文两版；已有卡片不会自动翻译。

## 常见问题

- **资料库会在不同设备间同步吗？** 不会。它是本地文件夹，需要自行迁移或备份。
- **没有网络能打开卡片吗？** 可以。已归档的卡片和资料库页面保存在本机；读取新的在线来源时可能需要联网。
- **引文会自动核实吗？** Skill 会检查卡片结构和证据字段。使用前仍需回到原文核对引文和上下文。

## 反馈与贡献

可以[提交 Issue](https://github.com/vaga00b/research-card-skill/issues)反馈问题或建议。较大的改动可以先开 Issue 讨论范围，再开始动手。

## 许可证

本项目采用 PolyForm Noncommercial License 1.0.0，具体条款见 [LICENSE](LICENSE)。你可以按许可证条款非商业地使用、修改和再发布；商业用途需要另行取得权利人许可。源代码可以查看，但这不是 OSI 认可的开源许可证。



