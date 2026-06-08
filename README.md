# Refero

An Obsidian plugin for capturing and organizing references directly inside your notes. Assign a type, status, tags, and star rating to every reference — whether it's an internal note, a web page, a video, a paper, or anything else. Browse and audit references vault-wide from a dedicated map view.

## Features

- **Add references** via a modal with grouped type picker, URL auto-detection, status, tags, and star rating
- **Edit or delete** any reference under the cursor
- **Cycle status** through the workflow with a single command
- **Open URLs** in the browser straight from the command palette
- **Auto-detect type** from the URL (GitHub → Repository, YouTube → Video, arXiv → Paper, Spotify → Podcast, Reddit/HN → Thread, Kaggle → Dataset, etc.)
- **Clipboard capture** — the modal reads the clipboard on open and pre-fills the URL field automatically
- **Autocomplete** for internal Obsidian notes when type is set to *Obsidian Note*
- **Tags** stored inline on each reference
- **Dates** auto-stamped on capture; completion date set when status reaches *Completed*
- **Vault-wide Reference Map** — browse, filter, and sort every reference across all notes
- **Tag browser** — find all references by tag across the vault
- **Broken reference detection** — warns on save and lists all dead note links on demand
- **Auto-rename** — updates references automatically when a note is renamed or moved

## Reference format

Each reference is stored as two lines inside a `## References` section:

```
### [[Note Name]]
📎 Obsidian Note | 🔄 **In Progress** | ★★★☆☆ | #ml #attention | 📅 2026-06-08
```

```
### [Title](https://example.com)
🌐 Web Page | ✅ **Completed** | ★★★★★ | 📅 2026-01-15 | ✔ 2026-03-20
```

Tags, dates, and completion date are all optional and only appended when present, so the format is backward-compatible.

## Reference types

Types are grouped in the modal dropdown.

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

## Statuses

| Icon | Status |
|------|--------|
| 📥 | Saved |
| 🔍 | Skimmed |
| 🔄 | In Progress |
| ⏳ | To Review |
| ✅ | Completed |
| ❗ | Needs Review |
| 🚫 | Abandoned |

## Commands

| Command | Description |
|---------|-------------|
| **Add Reference to Note** | Opens the capture modal (clipboard URL auto-filled) |
| **Edit Reference Under Cursor** | Re-opens the modal pre-filled with the reference at the cursor |
| **Delete Reference Under Cursor** | Removes the reference and its meta line |
| **Open Reference URL in Browser** | Opens the external URL of the reference at the cursor |
| **Cycle Reference Status** | Advances the status to the next one; stamps completion date when reaching *Completed* |
| **Browse References by Tag** | Opens a tag cloud — click a tag to see all matching references vault-wide |
| **Open Reference Map** | Opens the vault-wide reference map in a new tab |
| **Find Broken References** | Lists all Obsidian Note references pointing to non-existent files |

## Reference Map

The Reference Map (**Open Reference Map** command) opens a persistent tab that aggregates every reference from every note in the vault.

**Filters** — live, no submit required:
- Type, Status, Tag (partial match), Minimum rating, Date range (added from/to)

**Sort** by Date Added, Rating, Title, Note Name, or Status — with ascending/descending toggle.

Each card shows the type icon, linked title, status, star rating, tags, dates, and the source note. Clicking a title opens the URL or navigates to the note; clicking the note name navigates there directly.

Use **↻ Refresh** to re-scan after making edits.

## Reference integrity

- **Save warning** — if an *Obsidian Note* reference points to a file that doesn't exist, a notice appears immediately after saving.
- **Find Broken References** — scans the vault and lists every dead note link with its source note (click to navigate).
- **Auto-rename** — when a note is renamed or moved in Obsidian, Refero automatically updates all `[[wiki-links]]` and `[markdown](links)` in reference lines across the vault and shows a notice with the count of updated notes.

## Installation

1. Download `main.js`, `styles.css`, and `manifest.json` from the latest release.
2. Copy them into `<vault>/.obsidian/plugins/refero/`.
3. Enable **Refero** in *Settings → Community Plugins*.

## Development

```bash
npm install
npm run build   # compiles main.ts → main.js
```

Requires Node.js and the Obsidian plugin API typings (included via `devDependencies`).

## License

MIT
