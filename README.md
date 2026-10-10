# Refero

**Track everything you read, watch, and learn from right inside your Obsidian notes.**

Refero turns the links scattered across your vault into a reading list you can manage. Every reference gets a type, a status, tags, and a rating. You can see all of them at once in a vault-wide map.

<img width="800" height="450" alt="Refero: adding a reference and browsing the Reference Map" src="https://github.com/user-attachments/assets/78c4d3f6-d10a-4ff8-a395-af6fb305ba82" />

![Release](https://img.shields.io/github/v/release/nimaghasemian/refero?style=flat-square)
![License](https://img.shields.io/github/license/nimaghasemian/refero?style=flat-square)

---

## Why Refero?

You save a paper, a YouTube talk, and a GitHub repo, and a month later you can't remember which ones you finished, which ones were worth it, or which note you put them in.

Refero solves this without leaving Obsidian:

- **Capture in seconds.** Copy a URL and run one command. Refero fills in the link from your clipboard and works out whether it's a paper, video, repo, or something else.
- **Know where you stand.** Move each reference from *Saved* to *In Progress* to *Completed* with a single command. Completion dates are recorded for you.
- **See the whole picture.** The Reference Map lists every reference in your vault, and you can filter it by type, status, tag, rating, or date.
- **Your data stays plain Markdown.** References are ordinary lines in your notes. There's no database, no lock-in, and they're readable without the plugin.

## Installation

**[Click here to install Refero in Obsidian](https://obsidian.md/plugins?id=refero)**, then click **Install** and **Enable**.

Or, inside Obsidian, go to *Settings → Community plugins → Browse* and search for **Refero**.

<details>
<summary>Manual install</summary>

Download `main.js`, `styles.css`, and `manifest.json` from the [latest release](https://github.com/nimaghasemian/refero/releases/latest), put them in `<vault>/.obsidian/plugins/refero/`, and enable **Refero** in *Settings → Community plugins*.

</details>

## How do I use it?

### 1. Set up hotkeys (recommended)

Refero is built to be used from the keyboard. With a hotkey, you can capture a reference in a few seconds without touching the mouse.

Go to *Settings → Hotkeys*, search for **Refero**, and assign keys to the commands you'll use most. For example:

| Command | Example hotkey |
|---------|----------------|
| Add reference to note | `Ctrl/Cmd + Shift + R` |
| Cycle reference status | `Ctrl/Cmd + Shift + S` |
| Open reference map | `Ctrl/Cmd + Shift + M` |

Pick any keys you like. If a combination is already taken, Obsidian will tell you.

### 2. Capture a reference

1. Copy a URL.
2. Press your **Add reference** hotkey. The URL and type are already filled in.
3. Add a title, status, tags, and rating, then press `Enter` to save.

Refero adds a `## References` section to the note (if it doesn't have one yet) and appends:

```markdown
### [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
📄 Paper | 🔄 **In Progress** | ★★★★★ | #ml #transformers | 📅 2026-06-08
```

### 3. Keep it up to date

Put your cursor on a reference and use **Cycle reference status** to move it along, from *Saved* to *In Progress* to *Completed*. **Edit**, **delete**, and **open URL** work the same way on the reference under your cursor.

### 4. Review everything

Open the **Reference map** to see every reference in your vault, then filter by status to find what's still unfinished.

### Keyboard shortcuts in the capture window

Every field in the capture window works with the keyboard:

| Key | Action |
|-----|--------|
| `Tab` / `Shift + Tab` | Move between fields |
| `Enter` | Save the reference (from any field) |
| `Ctrl/Cmd + Enter` | Save the reference |
| `↑` / `↓` on **Type** | Change the type |
| `↑` / `↓` then `Enter` on **Title** | Pick an Obsidian note from the suggestions |
| `Esc` on **Title** | Close the suggestions |
| `0`–`5` on **Rating** | Set the rating directly |
| `←` / `→` on **Rating** | Lower or raise the rating |
| `Esc` | Close without saving |

> No hotkeys? Every command is also available from the command palette (`Ctrl/Cmd + P`). Type "Refero" to see them all.

## Features

### Capture
- **Clipboard capture**: the URL field is pre-filled from your clipboard
- **Type auto-detection**: GitHub → Repository, YouTube → Video, arXiv → Paper, Spotify → Podcast, Reddit/HN → Thread, Kaggle → Dataset, and more
- **Note autocomplete**: link to other notes in your vault with the *Obsidian Note* type
- **Automatic dates**: the capture date is stamped on save, and the completion date is added when the status reaches *Completed*

### Organize
- **13 reference types**, grouped into Written, Media, Technical, and Other
- **7 statuses** covering a full reading workflow, with a built-in status guide
- **Inline tags** and **1–5 star ratings**
- **Edit, delete, or cycle status** for the reference under your cursor

### Browse
- **Reference Map**: a persistent tab showing every reference in the vault, with live filters and sorting
- **Tag browser**: click a tag to see every matching reference across the vault
- **Open URL**: open the link under your cursor in the browser from the command palette

### Stay consistent
- **Auto-rename**: when you rename or move a note, Refero updates every reference that points to it
- **Broken link warnings**: you're notified when you save a reference to a note that doesn't exist
- **Find broken references**: scan the whole vault for links to notes that no longer exist

## Commands

| Command | What it does |
|---------|--------------|
| **Add reference to note** | Opens the capture modal with the URL pre-filled from your clipboard |
| **Edit reference under cursor** | Re-opens the modal with the reference's current values |
| **Delete reference under cursor** | Removes the reference and its meta line |
| **Cycle reference status** | Moves to the next status and stamps the completion date at *Completed* |
| **Open reference URL in browser** | Opens the external link under the cursor |
| **Browse references by tag** | Opens a tag cloud, and clicking a tag lists its references vault-wide |
| **Open reference map** | Opens the vault-wide Reference Map in a new tab |
| **Find broken references** | Lists every note reference that points to a missing file |


## Reference Map

The Reference Map collects every reference from every note into one view.

- **Filter** live by type, status, tag (partial match), minimum rating, and date added
- **Sort** by date added, rating, title, note name, or status, in ascending or descending order
- **Navigate**: click a title to open its URL or note, or click the source note to jump to it
- Click **↻ Refresh** to re-scan after editing

## Reference types and statuses

<details>
<summary><strong>Types (13)</strong></summary>

| Group | Icon | Type |
|-------|------|------|
| Written | 📎 | Obsidian Note |
| Written | 📚 | Book / Textbook |
| Written | 📄 | Paper |
| Written | 📝 | Blog Post |
| Written | 📰 | Article / News |
| Media | 🎥 | Video |
| Media | 🎓 | Course |
| Media | 🎙️ | Podcast / Episode |
| Technical | 💻 | Repository |
| Technical | 🗂️ | Dataset |
| Technical | 🧵 | Thread |
| Other | 🌐 | Web Page |
| Other | 📦 | Other |

</details>

<details>
<summary><strong>Statuses (7)</strong></summary>

| Icon | Status | Meaning |
|------|--------|---------|
| 📥 | Saved | Saved for later, not opened yet |
| 🔍 | Skimmed | Glanced at, rough sense of the content |
| 🔄 | In Progress | Actively reading, watching, or working through it |
| ⏳ | To Review | Finished, but you want to revisit it before calling it done |
| ✅ | Completed | Fully consumed, and you've extracted what you needed |
| ❗ | Needs Review | Something needs attention, such as unclear notes or conflicting info |
| 🚫 | Abandoned | Decided not to continue |

</details>

<details>
<summary><strong>Storage format</strong></summary>

Each reference takes two lines under a `## References` heading:

```markdown
### [[Note Name]]
📎 Obsidian Note | 🔄 **In Progress** | ★★★☆☆ | #ml #attention | 📅 2026-06-08

### [Title](https://example.com)
🌐 Web Page | ✅ **Completed** | ★★★★★ | 📅 2026-01-15 | ✔ 2026-03-20
```

Tags and dates are optional and are only written when present, so older references keep working.

</details>

## Development

```bash
npm install
npm run build   # compiles main.ts → main.js
```

Bug reports and feature requests are welcome in [Issues](https://github.com/nimaghasemian/refero/issues).

## License

[MIT](LICENSE)
