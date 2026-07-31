# 🍉 Watermelon Workbench

> 给 Obsidian 小说作者的一张“西瓜味写作桌”：左边放章节，中间专心写，右边放灵感工具和码字仪表盘。

Watermelon Workbench is a cozy long-form writing workspace for Obsidian. It keeps your Markdown files plain and portable, while adding a focused writing interface for drafting novels, web fiction, worldbuilding notes, serial chapters, and any text that wants to grow into a small universe.

如果你经常在 Obsidian 里写小说，却觉得默认编辑器像一张太宽的白纸、章节跳转不够顺手、临时角色名又总卡壳——欢迎把这颗西瓜切开。

## ✨ Features

### 🧘 Focused writing workbench

- Opens the current Markdown file in a dedicated writing view.
- Exits back to Obsidian's normal Markdown editor without spawning extra tabs.
- Comfortable typography controls: font family, font size, and line height.
- Auto-scrolls near the bottom so the cursor stays in a comfortable writing zone.

### 📚 Chapter navigation

- Shows sibling Markdown files as a chapter list.
- Switch chapters without leaving the workbench.
- Supports sorting by path/name or modified time.

### ✍️ Writing-friendly indentation

- Press Enter and the next line starts at a Chinese-style first-line indent position.
- The indent is for the workbench writing experience; saved Markdown stays clean.
- Legacy full-width indent characters inserted by earlier builds are normalized when opening files.

### 🎲 Local random name generator

No API key. No network request. No waiting for the cloud muse to wake up.

Generate and insert:

- Chinese character names
- English names
- Two-character or three-character Chinese names
- Ancient-style or modern-style place names

Click a generated name to insert it into your draft.

### 🕰 Time Machine backups

For when chapter 7 takes a wrong turn into a swamp.

- Automatically creates a backup snapshot every ~100 new non-space characters.
- Stores backups in a `备份` folder next to your chapter file.
- View added/removed lines between a snapshot and the current draft.
- Restore a snapshot; the current draft is backed up first before restoration.

### 📊 Compact live stats

A small right-side dashboard tracks the essentials:

- Session words / typing speed
- Writing time / idle time
- Total characters / non-space characters

## 📦 Installation

### Manual installation

1. Download or build the plugin files.
2. Copy these files into your Obsidian vault plugin folder:

   ```text
   <your-vault>/.obsidian/plugins/watermelon-workbench/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```

3. Restart Obsidian or reload plugins.
4. Enable **Watermelon Workbench** in `Settings → Community plugins`.

### Build from source

```bash
npm install
npm run build
```

For development watch mode:

```bash
npm run dev
```

Type-check only:

```bash
npm run typecheck
```

## 🚀 Usage

After enabling the plugin, use one of these entry points:

- Ribbon icon: **Open Watermelon Workbench**
- Command palette:
  - `Open writing workbench`
  - `Open current file in writing workbench`
  - `Exit writing workbench`

Inside the workbench:

- Left panel: chapter list
- Center: focused editor
- Right panel: plugin box + live stats
- `Esc` or the toolbar exit button returns to normal Obsidian editing

## 🧃 Philosophy

Watermelon Workbench tries to be a writing table, not a writing prison.

Your novel remains Markdown. Your backups are Markdown. Your random names are local. The plugin is there to make drafting feel smoother, not to trap your manuscript in a mysterious proprietary watermelon crate.

## 🗂 Project structure

```text
src/
├── main.ts                         # Obsidian plugin lifecycle and commands
├── settings.ts                     # Settings schema and settings tab
├── services/
│   ├── RandomNameService.ts        # Local name/place generation
│   ├── StatsService.ts             # Writing statistics
│   └── TimeMachineService.ts       # Snapshot, diff, restore helpers
├── utils/
│   └── formatting.ts               # Toolbar text transforms
└── views/
    └── WorkbenchView.ts            # Main workbench UI
```

## 🛣 Roadmap ideas

- Better theme presets for different writing moods
- Search inside chapter scope
- More local name packs and worldbuilding generators
- Export/release packaging automation
- Optional per-project writing goals

## 🤝 Contributing

Issues, ideas, and pull requests are welcome.

If you find a bug, it helps to include:

- Obsidian version
- Plugin version
- Operating system
- A short reproduction step list
- Whether it happens in a fresh vault

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

Made for people who open a blank chapter, stare at it for 20 minutes, then suddenly write 3,000 words because the fake character name finally sounded right. 🍉
