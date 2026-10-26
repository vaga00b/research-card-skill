# Research Card Skill

**Turn articles into research cards you can check, save, and find again.** Each card links claims to the article's sections and evidence. The Skill supports Chinese and English, with your library stored on your computer.

## What it does

- Follows the article's own headings, with claims, examples, figures, and quotations filed under the section they came from.
- Creates matching Chinese and English versions while keeping source titles and exact quotations in their original language.
- Saves each card as Markdown and standalone HTML in a library you can open without a hosted service.
- Searches saved cards and links results to claim IDs and original sources, so you can check the context before reusing an idea.
- Keeps cards on your computer. This package does not upload them to a Research Card website or call a separate model API.

Codex reads and summarizes the sources. Access to online material depends on the platform and tools available in your session. Once installed, the local library viewer works offline.

## Install

1. Install Node.js.
2. Copy or clone the whole package into `~/.codex/skills/research-card` (Windows: `%USERPROFILE%\.codex\skills\research-card`). The files work together, so keep the folder intact.
3. In Codex, enter `$research-card` and add an article URL or document.
4. On first use, the Skill creates `Documents/Research Card Library`. Open its `index.html` to browse your cards.

To initialize the library yourself:

```sh
node scripts/install-library.mjs
```

To choose another library location:

```sh
node scripts/install-library.mjs --path "path/to/research-card-library"
```

The installer recognizes and preserves existing cards. If the target folder contains an unrelated `index.html`, it stops rather than overwrite it. Keep `cards/` and `cards.json` alongside `index.html`.

## Use saved cards

Looking for something you saved earlier? Ask `$research-card` about your articles, or search the library from a terminal:

```sh
node scripts/search-cards.mjs --query "healthspan" --language en --limit 8
```

Use **Settings** in the library to change its display language or theme. New cards include Chinese and English versions by default. Existing cards in one language stay as they are; the Skill does not translate them without being asked.

## Package contents

- `SKILL.md` contains the workflow and card schema.
- `scripts/` contains helpers for installation, archiving, retrieval, validation, and upgrades.
- `references/` contains the card format and retrieval guidance.
- `assets/library-template/` contains the offline library viewer.

## Requirements and boundaries

- Codex with Skills support.
- Node.js to install, archive, retrieve, and upgrade the library.
- Internet access to read online sources. The saved library and its viewer stay local.
- The Skill checks card structure and evidence fields. Please verify that each quotation is exact and supports its claim in context before relying on it.
- The library is a folder on your computer and does not sync through a hosted service. Back it up with your other personal files.

## License

This project uses the PolyForm Noncommercial License 1.0.0 ([LICENSE](LICENSE)). You may use, modify, and redistribute it for noncommercial purposes under the license terms. Commercial use requires separate permission from the rights holder. The source is available, but this is not an OSI-approved open-source license.

---

# Research Card Skill（中文）

把文章整理成有出处、方便回查的研究卡片，也能从个人离线卡片库里找回保存过的观点。支持中英文卡片，观点、例子、原文证据和后续使用说明都对应在一起。

## 功能

- 跟着文章本身的章节整理内容，把可复用的观点、例子、数字和引文放回对应位置。
- 生成中英文两版，原文标题和精确引文仍保留原来的语言。
- 将卡片保存为 Markdown 和独立 HTML。资料库装好后，可以离线浏览。
- 搜索已保存的卡片，并从观点编号回到原文，方便写作、比较和做判断时核对上下文。
- 卡片留在你的电脑上。本包不会把它们上传到 Research Card 网站，也不会调用独立的模型 API。

Skill 由 Codex 阅读和总结来源。能否访问在线材料，取决于当前会话使用的平台和工具；卡片资料库安装后可在本机离线浏览。

## 安装

1. 安装 Node.js。
2. 将整个包复制或克隆到 `~/.codex/skills/research-card`（Windows：`%USERPROFILE%\.codex\skills\research-card`），保留完整目录结构。
3. 在 Codex 中输入 `$research-card`，再附上文章链接或文档。
4. 首次使用时，Skill 会在 `Documents/Research Card Library` 创建资料库。打开其中的 `index.html` 就能浏览卡片。

手动初始化资料库：

```sh
node scripts/install-library.mjs
```

指定其他位置：

```sh
node scripts/install-library.mjs --path "library folder"
```

安装器会识别并保留已有卡片。如果目标目录里的 `index.html` 与资料库无关，安装器会停止，避免覆盖文件。请让 `cards/`、`cards.json` 和 `index.html` 保持在同一目录下。

## 检索已保存的卡片

想找回以前保存的内容，可以直接问 `$research-card`，也可以在终端运行检索脚本：

```sh
node scripts/search-cards.mjs --query "健康寿命" --language zh --limit 8
```

资料库的“设置”页面可以切换显示语言和主题。新卡片默认保存中英文两版；已有的单语卡片不会被自动翻译。

## 依赖与边界

- 需要支持 Skills 的 Codex。
- 安装、归档、检索和升级资料库需要 Node.js。
- 阅读在线来源时可能需要联网。生成的卡片保存在本机，浏览器可以离线打开。
- Skill 会检查卡片结构和证据字段。使用卡片前，请核对引文是否准确，以及它在原文语境中是否支持对应观点。
- 资料库保存在本地，不提供线上同步。记得和其他个人文件一起备份。

## 许可证

本项目采用 PolyForm Noncommercial License 1.0.0，具体条款见 [LICENSE](LICENSE)。你可以按许可证条款非商业地使用、修改和再发布本项目；商业用途需要另行取得权利人许可。源代码可以查看，但这不是 OSI 认可的开源许可证。








