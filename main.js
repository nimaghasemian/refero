"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_GROUPS = [
    {
        label: 'Written',
        types: [
            { key: 'plain-note', label: 'Obsidian Note', icon: '📎' },
            { key: 'book', label: 'Book / Textbook', icon: '📚' },
            { key: 'paper', label: 'Paper', icon: '📄' },
            { key: 'blog-post', label: 'Blog Post', icon: '📝' },
            { key: 'article', label: 'Article / News', icon: '📰' },
        ],
    },
    {
        label: 'Media',
        types: [
            { key: 'video', label: 'Video', icon: '🎥' },
            { key: 'course', label: 'Course', icon: '🎓' },
            { key: 'podcast', label: 'Podcast / Episode', icon: '🎙️' },
        ],
    },
    {
        label: 'Technical',
        types: [
            { key: 'repository', label: 'Repository', icon: '💻' },
            { key: 'dataset', label: 'Dataset', icon: '🗂️' },
            { key: 'thread', label: 'Thread', icon: '🧵' },
        ],
    },
    {
        label: 'Other',
        types: [
            { key: 'web-page', label: 'Web Page', icon: '🌐' },
            { key: 'other', label: 'Other', icon: '📦' },
        ],
    },
];
const TYPE_OPTIONS = TYPE_GROUPS.flatMap(g => g.types);
const STATUS_ORDER = [
    { key: 'saved', label: 'Saved', icon: '📥' },
    { key: 'skimmed', label: 'Skimmed', icon: '🔍' },
    { key: 'in-progress', label: 'In Progress', icon: '🔄' },
    { key: 'to-review', label: 'To Review', icon: '⏳' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'needs-review', label: 'Needs Review', icon: '❗' },
    { key: 'abandoned', label: 'Abandoned', icon: '🚫' },
];
const VIEW_TYPE_REFERO_MAP = 'refero-map';
// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusInfo(key) {
    var _a;
    return (_a = STATUS_ORDER.find(s => s.key === key)) !== null && _a !== void 0 ? _a : STATUS_ORDER[0];
}
function getTypeInfo(key) {
    var _a;
    return (_a = TYPE_OPTIONS.find(t => t.key === key)) !== null && _a !== void 0 ? _a : TYPE_OPTIONS[0];
}
function today() {
    return new Date().toISOString().slice(0, 10);
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function parseVaultRefs(app) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const results = [];
        for (const file of app.vault.getMarkdownFiles()) {
            const content = yield app.vault.cachedRead(file);
            const lines = content.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
                if (!lines[i].trim().startsWith('###'))
                    continue;
                const metaLine = (_a = lines[i + 1]) !== null && _a !== void 0 ? _a : '';
                const firstPart = metaLine.split('|')[0].trim();
                const typeInfo = TYPE_OPTIONS.find(t => firstPart.startsWith(t.icon));
                if (!typeInfo)
                    continue;
                const headerStr = lines[i].replace(/^###\s*/, '');
                let title = '', url = '';
                const internal = headerStr.match(/\[\[([^\]]+?)(?:\|([^\]]+?))?\]\]/);
                if (internal) {
                    url = internal[1];
                    title = (_c = (_b = internal[2]) !== null && _b !== void 0 ? _b : url.split('/').pop()) !== null && _c !== void 0 ? _c : url;
                }
                else {
                    const md = headerStr.match(/\[([^\]]+)\]\((.*?)\)/);
                    if (md) {
                        title = md[1];
                        url = md[2];
                    }
                    else
                        title = headerStr;
                }
                const metaParts = metaLine.split('|').map(p => p.trim());
                const statusLabel = (_f = (_e = (_d = metaParts[1]) === null || _d === void 0 ? void 0 : _d.match(/\*\*([^*]+)\*\*/)) === null || _e === void 0 ? void 0 : _e[1]) !== null && _f !== void 0 ? _f : '';
                const statusInfo = (_g = STATUS_ORDER.find(s => s.label === statusLabel)) !== null && _g !== void 0 ? _g : STATUS_ORDER[0];
                const stars = ((_j = (_h = metaParts[2]) === null || _h === void 0 ? void 0 : _h.match(/★/g)) !== null && _j !== void 0 ? _j : []).length;
                let tags = [], dateAdded = '', dateCompleted = '';
                for (let j = 3; j < metaParts.length; j++) {
                    const p = metaParts[j];
                    if (p.startsWith('📅'))
                        dateAdded = p.replace('📅', '').trim();
                    else if (p.startsWith('✔'))
                        dateCompleted = p.replace('✔', '').trim();
                    else if (/^#\w/.test(p))
                        tags = p.split(/\s+/).filter(t => t.startsWith('#'));
                }
                const linkedPath = (typeInfo.key === 'plain-note' && url)
                    ? (url.endsWith('.md') ? url : url + '.md')
                    : null;
                const isBroken = linkedPath != null && !app.vault.getAbstractFileByPath(linkedPath);
                results.push({
                    title, url,
                    type: typeInfo.key, typeLabel: typeInfo.label, typeIcon: typeInfo.icon,
                    status: statusInfo.key, statusLabel: statusInfo.label, statusIcon: statusInfo.icon,
                    stars, tags, dateAdded, dateCompleted,
                    sourceFile: file, lineNum: i, isBroken,
                });
            }
        }
        return results;
    });
}
// ── Plugin ────────────────────────────────────────────────────────────────────
class ReferenceAutomatorPlugin extends obsidian_1.Plugin {
    onload() {
        this.registerView(VIEW_TYPE_REFERO_MAP, leaf => new RefMapView(leaf));
        this.addCommand({
            id: 'add-reference',
            name: 'Add Reference to Note',
            editorCallback: (editor, ctx) => {
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this command in a Markdown note.');
                    return;
                }
                new ReferenceModal(this.app, editor).open();
            },
        });
        this.addCommand({
            id: 'edit-reference',
            name: 'Edit Reference Under Cursor',
            editorCallback: (editor, ctx) => {
                var _a;
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this in a Markdown note.');
                    return;
                }
                let lineNum = editor.getCursor().line;
                let line = editor.getLine(lineNum);
                if (!line.trim().startsWith('###') && lineNum > 0) {
                    const prev = editor.getLine(lineNum - 1);
                    if (prev.trim().startsWith('###')) {
                        lineNum--;
                        line = prev;
                    }
                }
                if (!line.trim().startsWith('###')) {
                    new obsidian_1.Notice('⛔️ Place cursor on a reference line.');
                    return;
                }
                new ReferenceModal(this.app, editor, lineNum, line, (_a = editor.getLine(lineNum + 1)) !== null && _a !== void 0 ? _a : '').open();
            },
        });
        this.addCommand({
            id: 'open-reference-url',
            name: 'Open Reference URL in Browser',
            editorCallback: (editor, ctx) => {
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this in a Markdown note.');
                    return;
                }
                let lineNum = editor.getCursor().line;
                let line = editor.getLine(lineNum);
                if (!line.trim().startsWith('###') && lineNum > 0) {
                    const prev = editor.getLine(lineNum - 1);
                    if (prev.trim().startsWith('###')) {
                        lineNum--;
                        line = prev;
                    }
                }
                if (!line.trim().startsWith('###')) {
                    new obsidian_1.Notice('⛔️ Place cursor on a reference line.');
                    return;
                }
                const m = line.match(/\]\((https?:\/\/[^)]+)\)/);
                if (!m) {
                    new obsidian_1.Notice('No external URL on this reference.');
                    return;
                }
                window.open(m[1], '_blank');
            },
        });
        this.addCommand({
            id: 'delete-reference',
            name: 'Delete Reference Under Cursor',
            editorCallback: (editor, ctx) => {
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this in a Markdown note.');
                    return;
                }
                const lineNum = editor.getCursor().line;
                const line = editor.getLine(lineNum);
                if (!line.trim().startsWith('###')) {
                    new obsidian_1.Notice('⛔️ Place cursor on a reference line.');
                    return;
                }
                const nextLine = editor.getLine(lineNum + 1);
                const endLine = nextLine && !nextLine.trim().startsWith('###') ? lineNum + 2 : lineNum + 1;
                editor.replaceRange('', { line: lineNum, ch: 0 }, { line: endLine, ch: 0 });
                new obsidian_1.Notice('Reference deleted.');
            },
        });
        this.addCommand({
            id: 'cycle-ref-status',
            name: 'Cycle Reference Status',
            editorCallback: (editor, ctx) => {
                var _a;
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this in a Markdown note.');
                    return;
                }
                let lineNum = editor.getCursor().line;
                let line = editor.getLine(lineNum);
                if (!line.trim().startsWith('###') && lineNum > 0) {
                    const prev = editor.getLine(lineNum - 1);
                    if (prev.trim().startsWith('###')) {
                        lineNum--;
                        line = prev;
                    }
                }
                if (!line.trim().startsWith('###')) {
                    new obsidian_1.Notice('⛔️ Place cursor on a reference line.');
                    return;
                }
                const metaLineNum = lineNum + 1;
                let metaLine = (_a = editor.getLine(metaLineNum)) !== null && _a !== void 0 ? _a : '';
                const currIdx = STATUS_ORDER.findIndex(s => metaLine.includes(`**${s.label}**`));
                const next = STATUS_ORDER[(currIdx + 1) % STATUS_ORDER.length];
                metaLine = metaLine.replace(/\|\s+\S+\s+\*\*.+?\*\*/, `| ${next.icon} **${next.label}**`);
                if (next.key === 'completed' && !metaLine.includes('✔')) {
                    metaLine += ` | ✔ ${today()}`;
                }
                editor.setLine(metaLineNum, metaLine);
                new obsidian_1.Notice(`Status → ${next.label}`);
            },
        });
        this.addCommand({
            id: 'browse-references-by-tag',
            name: 'Browse References by Tag',
            callback: () => new TagBrowserModal(this.app).open(),
        });
        this.addCommand({
            id: 'open-reference-map',
            name: 'Open Reference Map',
            callback: () => this.openReferenceMap(),
        });
        this.addCommand({
            id: 'find-broken-references',
            name: 'Find Broken References',
            callback: () => new BrokenRefsModal(this.app).open(),
        });
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            if (!(file instanceof obsidian_1.TFile) || !file.path.endsWith('.md'))
                return;
            this.handleNoteRename(oldPath, file.path);
        }));
    }
    openReferenceMap() {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_REFERO_MAP);
            if (existing.length > 0) {
                this.app.workspace.revealLeaf(existing[0]);
                return;
            }
            yield this.app.workspace.getLeaf(true).setViewState({
                type: VIEW_TYPE_REFERO_MAP,
                active: true,
            });
        });
    }
    handleNoteRename(oldPath, newPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldBase = oldPath.replace(/\.md$/, '');
            const newBase = newPath.replace(/\.md$/, '');
            let count = 0;
            for (const file of this.app.vault.getMarkdownFiles()) {
                const content = yield this.app.vault.read(file);
                // wiki-link: ### [[oldBase]] or ### [[oldBase|alias]]
                const wikiRe = new RegExp(`(^###[ \\t]+\\[\\[)${escapeRegex(oldBase)}(\\|[^\\]]*)?\\]\\]`, 'gm');
                // markdown link: ### [title](oldPath)
                const mdRe = new RegExp(`(^###[ \\t]+\\[[^\\]]*\\]\\()${escapeRegex(oldPath)}\\)`, 'gm');
                const updated = content
                    .replace(wikiRe, (_, pre, alias) => `${pre}${newBase}${alias !== null && alias !== void 0 ? alias : ''}]]`)
                    .replace(mdRe, `$1${newPath})`);
                if (updated !== content) {
                    yield this.app.vault.modify(file, updated);
                    count++;
                }
            }
            if (count > 0)
                new obsidian_1.Notice(`Refero: updated references in ${count} note${count !== 1 ? 's' : ''}.`);
        });
    }
}
exports.default = ReferenceAutomatorPlugin;
// ── Reference Modal ───────────────────────────────────────────────────────────
class ReferenceModal extends obsidian_1.Modal {
    constructor(app, editor, editLine, initialLine, initialMetaLine) {
        super(app);
        this.currentRating = 0;
        this.preservedDateAdded = '';
        this.preservedDateCompleted = '';
        this.stars = [];
        this.suggestionIndex = -1;
        this.editor = editor;
        this.editLine = editLine;
        this.initialLine = initialLine;
        this.initialMetaLine = initialMetaLine;
    }
    onOpen() {
        const { contentEl } = this;
        this.modalEl.addClass('refero-modal-el');
        contentEl.addClass('refero-modal');
        contentEl.createEl('h2', {
            text: this.editLine != null ? 'Edit Reference' : 'Add Reference',
            cls: 'refero-modal-header',
        });
        contentEl.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                this.submit();
            }
        });
        // ── 1. Type ────────────────────────────────────────────────────────────
        const typeWrapper = contentEl.createDiv('refero-field-wrapper');
        typeWrapper.createEl('label', { text: 'Type', cls: 'refero-label' });
        this.typeSelect = typeWrapper.createEl('select', { cls: 'refero-select' });
        TYPE_GROUPS.forEach(group => {
            const og = document.createElement('optgroup');
            og.label = group.label;
            group.types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.key;
                opt.textContent = `${t.icon} ${t.label}`;
                og.appendChild(opt);
            });
            this.typeSelect.appendChild(og);
        });
        this.typeSelect.onchange = () => this.onTypeChange();
        this.typeSelect.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
                return;
            }
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')
                return;
            e.preventDefault();
            const opts = Array.from(this.typeSelect.options);
            const idx = opts.findIndex(o => o.value === this.typeSelect.value);
            const next = e.key === 'ArrowDown' ? Math.min(idx + 1, opts.length - 1) : Math.max(idx - 1, 0);
            if (next !== idx) {
                this.typeSelect.value = opts[next].value;
                this.onTypeChange();
            }
        });
        // ── 2. URL ─────────────────────────────────────────────────────────────
        this.urlWrapper = contentEl.createDiv('refero-field-wrapper');
        this.urlWrapper.createEl('label', { text: 'URL', cls: 'refero-label' });
        this.urlInput = this.urlWrapper.createEl('input', {
            type: 'text', placeholder: 'Paste a URL — type is auto-detected', cls: 'refero-input',
        });
        this.suggestionsContainer = this.urlWrapper.createDiv('refero-suggestions');
        this.urlInput.oninput = () => { if (this.typeSelect.value !== 'plain-note')
            this.detectTypeFromUrl(); };
        this.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        // ── 3. Title ───────────────────────────────────────────────────────────
        const titleWrapper = contentEl.createDiv('refero-field-wrapper');
        titleWrapper.createEl('label', { text: 'Title', cls: 'refero-label' });
        this.titleInput = titleWrapper.createEl('input', {
            type: 'text', placeholder: 'Enter the name of the reference', cls: 'refero-input',
        });
        this.titleSuggestionsContainer = titleWrapper.createDiv('refero-suggestions');
        this.titleInput.oninput = () => { if (this.typeSelect.value === 'plain-note')
            this.showTitleSuggestions(); };
        this.titleInput.onfocus = () => { if (this.typeSelect.value === 'plain-note')
            this.showTitleSuggestions(); };
        this.titleInput.onblur = () => setTimeout(() => this.hideTitleSuggestions(), 200);
        this.titleInput.addEventListener('keydown', (e) => {
            var _a;
            const open = this.titleSuggestionsContainer.style.display !== 'none';
            if (e.key === 'ArrowDown' && open) {
                e.preventDefault();
                const items = this.titleSuggestionsContainer.querySelectorAll('.refero-suggestion-item');
                this.suggestionIndex = Math.min(this.suggestionIndex + 1, items.length - 1);
                this.highlightSuggestion(items);
                return;
            }
            if (e.key === 'ArrowUp' && open) {
                e.preventDefault();
                this.suggestionIndex = Math.max(this.suggestionIndex - 1, -1);
                const items = this.titleSuggestionsContainer.querySelectorAll('.refero-suggestion-item');
                this.highlightSuggestion(items);
                return;
            }
            if (e.key === 'Escape' && open) {
                e.preventDefault();
                this.hideTitleSuggestions();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (open && this.suggestionIndex >= 0) {
                    (_a = this.titleSuggestionsContainer.querySelectorAll('.refero-suggestion-item')[this.suggestionIndex]) === null || _a === void 0 ? void 0 : _a.click();
                }
                else if (!open) {
                    this.submit();
                }
            }
        });
        // ── 4. Status ──────────────────────────────────────────────────────────
        const statusWrapper = contentEl.createDiv('refero-field-wrapper');
        const statusLabel = statusWrapper.createEl('label', { cls: 'refero-label' });
        statusLabel.createSpan({ text: 'Status' });
        const statusHint = statusLabel.createEl('a', { text: '?', cls: 'refero-label-hint' });
        statusHint.onclick = (e) => { e.preventDefault(); new StatusGuideModal(this.app).open(); };
        this.statusSelect = statusWrapper.createEl('select', { cls: 'refero-select' });
        STATUS_ORDER.forEach(s => this.statusSelect.createEl('option', { text: `${s.icon} ${s.label}`, value: s.key }));
        this.statusSelect.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        // ── 5. Tags ────────────────────────────────────────────────────────────
        const tagsWrapper = contentEl.createDiv('refero-field-wrapper');
        tagsWrapper.createEl('label', { text: 'Tags', cls: 'refero-label' });
        this.tagsInput = tagsWrapper.createEl('input', {
            type: 'text', placeholder: '#tag1 #tag2 …', cls: 'refero-input',
        });
        this.tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        // ── Date info (edit mode) ──────────────────────────────────────────────
        if (this.editLine != null) {
            this.dateInfoEl = contentEl.createDiv('refero-date-info');
        }
        // ── 6. Rating ──────────────────────────────────────────────────────────
        const ratingWrapper = contentEl.createDiv('refero-field-wrapper');
        ratingWrapper.createEl('label', { text: 'Rating', cls: 'refero-label' });
        const ratingContainer = ratingWrapper.createDiv('refero-rating');
        ratingContainer.tabIndex = 0;
        ratingContainer.setAttribute('aria-label', 'Rating: use ← → arrows or press 1–5');
        const starsEl = ratingContainer.createDiv('refero-stars');
        this.ratingText = ratingContainer.createSpan('refero-rating-text');
        for (let i = 0; i < 5; i++) {
            const star = starsEl.createSpan({ text: '☆', cls: 'refero-star' });
            this.stars.push(star);
            star.onclick = () => { this.currentRating = this.currentRating === i + 1 ? 0 : i + 1; this.updateStarDisplay(); };
            star.onmouseenter = () => this.updateStarDisplay(i + 1);
            star.onmouseleave = () => this.updateStarDisplay();
        }
        this.updateStarDisplay();
        ratingContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.currentRating = Math.min(this.currentRating + 1, 5);
                this.updateStarDisplay();
            }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.currentRating = Math.max(this.currentRating - 1, 0);
                this.updateStarDisplay();
            }
            else if (e.key >= '0' && e.key <= '5') {
                e.preventDefault();
                this.currentRating = parseInt(e.key);
                this.updateStarDisplay();
            }
            else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.submit();
            }
        });
        // ── Submit ─────────────────────────────────────────────────────────────
        const footer = contentEl.createDiv('refero-footer');
        footer.createEl('button', {
            text: this.editLine != null ? 'Update Reference' : 'Add Reference',
            cls: 'mod-cta',
        }).onclick = () => this.submit();
        // ── Initial state ───────────────────────────────────────────────────────
        if (this.initialLine) {
            this.prefillFromLine();
        }
        else {
            this.typeSelect.value = 'plain-note';
            this.onTypeChange();
            this.tryPrefillFromClipboard();
        }
        setTimeout(() => (this.editLine != null ? this.titleInput : this.typeSelect).focus(), 50);
        this.clickHandler = (e) => {
            if (!this.urlInput.contains(e.target) && !this.suggestionsContainer.contains(e.target))
                this.hideSuggestions();
            if (!this.titleInput.contains(e.target) && !this.titleSuggestionsContainer.contains(e.target))
                this.hideTitleSuggestions();
        };
        document.addEventListener('click', this.clickHandler);
    }
    onClose() {
        document.removeEventListener('click', this.clickHandler);
        this.contentEl.empty();
    }
    // ── Submit ────────────────────────────────────────────────────────────────
    submit() {
        const rawTags = this.tagsInput.value.trim();
        const normalizedTags = rawTags
            ? rawTags.split(/\s+/).map(t => t.startsWith('#') ? t : `#${t}`).join(' ')
            : '';
        const data = {
            type: this.typeSelect.value,
            title: this.titleInput.value.trim(),
            url: this.urlInput.value.trim(),
            status: this.statusSelect.value,
            stars: this.currentRating,
            tags: normalizedTags,
            dateAdded: this.preservedDateAdded || (this.editLine == null ? today() : ''),
            dateCompleted: '',
        };
        if (data.status === 'completed')
            data.dateCompleted = this.preservedDateCompleted || today();
        // Warn if the linked note doesn't exist
        if (data.type === 'plain-note' && data.url) {
            const linkedPath = data.url.endsWith('.md') ? data.url : data.url + '.md';
            if (!this.app.vault.getAbstractFileByPath(linkedPath))
                new obsidian_1.Notice(`⚠️ Note not found: ${data.url}`);
        }
        if (this.editLine != null)
            this.replaceLine(this.editLine, data);
        else
            this.insertLine(data);
        this.close();
    }
    // ── Type change ───────────────────────────────────────────────────────────
    onTypeChange() {
        var _a;
        this.hideSuggestions();
        this.hideTitleSuggestions();
        const isNote = this.typeSelect.value === 'plain-note';
        this.urlWrapper.style.display = isNote ? 'none' : '';
        if (isNote) {
            this.titleInput.placeholder = '📎 Start typing a note name…';
        }
        else {
            const placeholders = {
                video: '🎥 Video URL',
                repository: '💻 Repository URL',
                course: '🎓 Course URL',
                book: '📚 Book URL or ISBN page',
                paper: '📄 Paper or DOI URL',
                podcast: '🎙️ Podcast episode URL',
                dataset: '🗂️ Dataset URL',
                thread: '🧵 Thread URL',
                'blog-post': '📝 Blog post URL',
                article: '📰 Article URL',
            };
            this.urlInput.placeholder = (_a = placeholders[this.typeSelect.value]) !== null && _a !== void 0 ? _a : '🌐 Paste URL — type is auto-detected';
            this.titleInput.placeholder = 'Enter the name of the reference';
        }
    }
    // ── URL-based type detection ──────────────────────────────────────────────
    detectTypeFromUrl() {
        const url = this.urlInput.value.toLowerCase();
        if (!url)
            return;
        const detect = () => {
            if (/github\.com|gitlab\.com|bitbucket\.org|codeberg\.org|sourceforge\.net/.test(url))
                return 'repository';
            if (/youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|dailymotion\.com|wistia\.com|loom\.com/.test(url))
                return 'video';
            if (/spotify\.com\/(episode|show)|podcasts\.apple\.com|anchor\.fm|buzzsprout\.com|podbean\.com|pocketcasts\.com/.test(url))
                return 'podcast';
            if (/twitter\.com|x\.com|reddit\.com|news\.ycombinator\.com/.test(url))
                return 'thread';
            if (/kaggle\.com|huggingface\.co|zenodo\.org/.test(url))
                return 'dataset';
            if (/udemy\.com|coursera\.org|edx\.org|pluralsight\.com|skillshare\.com|lynda\.com|linkedin\.com\/learning|masterclass\.com|khanacademy\.org|codecademy\.com|treehouse\.com|udacity\.com/.test(url))
                return 'course';
            if (/springer\.com|wiley\.com|elsevier\.com|pearson\.com|cengage\.com|mcgraw-hill\.com|cambridge\.org|oup\.com|books\.google\.com|amazon\.com\/(dp|gp\/product)|goodreads\.com|openstax\.org|archive\.org\/details/.test(url))
                return 'book';
            if (/arxiv\.org|doi\.org|pubmed\.ncbi|semanticscholar\.org|researchgate\.net|jstor\.org|ieee\.org|acm\.org/.test(url))
                return 'paper';
            if (url.startsWith('obsidian://') || url.startsWith('app://local/') || (url.includes('.md') && !url.includes('://')))
                return 'plain-note';
            if (url.startsWith('https://') || url.startsWith('http://'))
                return 'web-page';
            return null;
        };
        const next = detect();
        if (next !== null && next !== this.typeSelect.value) {
            this.typeSelect.value = next;
            this.onTypeChange();
        }
    }
    // ── Clipboard prefill ─────────────────────────────────────────────────────
    tryPrefillFromClipboard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const text = yield navigator.clipboard.readText();
                if (text && /^https?:\/\//.test(text.trim()) && !this.urlInput.value.trim() && !this.titleInput.value.trim()) {
                    this.urlInput.value = text.trim();
                    this.detectTypeFromUrl();
                    this.urlWrapper.style.display = '';
                }
            }
            catch ( /* clipboard access denied */_a) { /* clipboard access denied */ }
        });
    }
    // ── Prefill for edit mode ─────────────────────────────────────────────────
    prefillFromLine() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!this.initialLine)
            return;
        const headerStr = this.initialLine.replace(/^###\s*/, '');
        const internal = headerStr.match(/\[\[([^\]]+?)(?:\|([^\]]+?))?\]\]/);
        if (internal) {
            const path = internal[1];
            this.titleInput.value = (_b = (_a = internal[2]) !== null && _a !== void 0 ? _a : path.split('/').pop()) !== null && _b !== void 0 ? _b : path;
            this.urlInput.value = path.endsWith('.md') ? path : path + '.md';
        }
        else {
            const md = headerStr.match(/\[([^\]]+)\]\((.*?)\)/);
            if (md) {
                this.titleInput.value = md[1];
                this.urlInput.value = md[2];
            }
            else
                this.titleInput.value = headerStr;
        }
        if (this.initialMetaLine) {
            const parts = this.initialMetaLine.split('|').map(p => p.trim());
            const icon = (_d = (_c = parts[0]) === null || _c === void 0 ? void 0 : _c.match(/^(\S+)/)) === null || _d === void 0 ? void 0 : _d[1];
            const tm = TYPE_OPTIONS.find(t => t.icon === icon);
            if (tm)
                this.typeSelect.value = tm.key;
            const slabel = (_f = (_e = parts[1]) === null || _e === void 0 ? void 0 : _e.match(/\*\*([^*]+)\*\*/)) === null || _f === void 0 ? void 0 : _f[1];
            const sm = STATUS_ORDER.find(s => s.label === slabel);
            if (sm)
                this.statusSelect.value = sm.key;
            this.currentRating = ((_h = (_g = parts[2]) === null || _g === void 0 ? void 0 : _g.match(/★/g)) !== null && _h !== void 0 ? _h : []).length;
            this.updateStarDisplay();
            for (let i = 3; i < parts.length; i++) {
                const p = parts[i];
                if (p.startsWith('📅'))
                    this.preservedDateAdded = p.replace('📅', '').trim();
                else if (p.startsWith('✔'))
                    this.preservedDateCompleted = p.replace('✔', '').trim();
                else if (/^#\w/.test(p))
                    this.tagsInput.value = p;
            }
        }
        this.onTypeChange();
        this.updateDateInfo();
    }
    updateDateInfo() {
        if (!this.dateInfoEl)
            return;
        this.dateInfoEl.empty();
        if (this.preservedDateAdded)
            this.dateInfoEl.createSpan({ text: `📅 Added ${this.preservedDateAdded}`, cls: 'refero-date-chip' });
        if (this.preservedDateCompleted)
            this.dateInfoEl.createSpan({ text: `✔ Done ${this.preservedDateCompleted}`, cls: 'refero-date-chip' });
    }
    // ── Note autocomplete ─────────────────────────────────────────────────────
    getMatchingSuggestions(query) {
        const files = this.app.vault.getMarkdownFiles();
        if (query === '')
            return files.slice(0, 6);
        const q = query.toLowerCase();
        return files
            .filter(f => f.basename.toLowerCase().includes(q))
            .sort((a, b) => {
            const an = a.basename.toLowerCase(), bn = b.basename.toLowerCase();
            if (an === q)
                return -1;
            if (bn === q)
                return 1;
            if (an.startsWith(q) && !bn.startsWith(q))
                return -1;
            if (bn.startsWith(q) && !an.startsWith(q))
                return 1;
            return an.localeCompare(bn);
        })
            .slice(0, 8);
    }
    showTitleSuggestions() {
        if (this.typeSelect.value !== 'plain-note') {
            this.hideTitleSuggestions();
            return;
        }
        this.suggestionIndex = -1;
        this.renderSuggestions(this.getMatchingSuggestions(this.titleInput.value.trim()), this.titleSuggestionsContainer);
    }
    renderSuggestions(files, container) {
        container.innerHTML = '';
        if (files.length === 0) {
            container.style.display = 'none';
            return;
        }
        files.forEach(file => {
            const item = container.createDiv('refero-suggestion-item');
            item.createDiv({ text: file.basename, cls: 'refero-suggestion-name' });
            item.createDiv({ text: file.path, cls: 'refero-suggestion-path' });
            item.onclick = () => {
                this.titleInput.value = file.basename;
                this.urlInput.value = file.path;
                container.style.display = 'none';
                this.suggestionIndex = -1;
            };
        });
        container.style.display = 'block';
    }
    highlightSuggestion(items) {
        items.forEach((item, i) => {
            if (i === this.suggestionIndex) {
                item.addClass('refero-suggestion-item--active');
                item.scrollIntoView({ block: 'nearest' });
            }
            else
                item.removeClass('refero-suggestion-item--active');
        });
    }
    hideSuggestions() { this.suggestionsContainer.style.display = 'none'; }
    hideTitleSuggestions() { this.titleSuggestionsContainer.style.display = 'none'; this.suggestionIndex = -1; }
    // ── Star rating ───────────────────────────────────────────────────────────
    updateStarDisplay(hoverRating) {
        const r = hoverRating !== undefined ? hoverRating : this.currentRating;
        this.stars.forEach((star, i) => {
            if (i < r) {
                star.textContent = '★';
                star.addClass('refero-star--filled');
            }
            else {
                star.textContent = '☆';
                star.removeClass('refero-star--filled');
            }
        });
        this.ratingText.textContent = r === 0 ? 'Not rated' : `${r} / 5`;
    }
    // ── Line building ─────────────────────────────────────────────────────────
    starString(n) {
        return n === 0 ? '⚪ Not Rated' : '★'.repeat(n) + '☆'.repeat(5 - n);
    }
    buildLine(data) {
        const typeInfo = getTypeInfo(data.type);
        const statusInfo = getStatusInfo(data.status);
        let link;
        if (data.type === 'plain-note' && data.url) {
            const file = this.app.vault.getAbstractFileByPath(data.url);
            if (file instanceof obsidian_1.TFile) {
                const lp = data.url.replace(/\.md$/, '');
                link = data.title.trim() === file.basename ? `[[${lp}]]` : `[[${lp}|${data.title}]]`;
            }
            else {
                link = `[${data.title}](${data.url})`;
            }
        }
        else {
            link = data.url ? `[${data.title}](${data.url})` : data.title;
        }
        let line2 = `${typeInfo.icon} ${typeInfo.label} | ${statusInfo.icon} **${statusInfo.label}** | ${this.starString(data.stars)}`;
        if (data.tags)
            line2 += ` | ${data.tags}`;
        if (data.dateAdded)
            line2 += ` | 📅 ${data.dateAdded}`;
        if (data.dateCompleted)
            line2 += ` | ✔ ${data.dateCompleted}`;
        return `### ${link}\n${line2}`;
    }
    insertLine(data) {
        const editor = this.editor;
        let doc = editor.getValue();
        if (!/## References/.test(doc)) {
            editor.replaceRange('\n## References\n', { line: editor.lastLine() + 1, ch: 0 });
            doc = editor.getValue();
        }
        const lines = doc.split('\n');
        const headerIdx = lines.findIndex(l => /## References/.test(l));
        let insertPos = headerIdx + 1;
        while (insertPos < lines.length && lines[insertPos].startsWith('###')) {
            insertPos++;
            if (insertPos < lines.length && !lines[insertPos].startsWith('###') && lines[insertPos].trim() !== '')
                insertPos++;
        }
        lines.splice(insertPos, 0, ...this.buildLine(data).split('\n'));
        editor.setValue(lines.join('\n'));
        new obsidian_1.Notice('Reference added.');
    }
    replaceLine(lineNum, data) {
        const editor = this.editor;
        const refLines = this.buildLine(data).split('\n');
        editor.setLine(lineNum, refLines[0]);
        if (refLines.length > 1) {
            if (editor.getLine(lineNum + 1) && !editor.getLine(lineNum + 1).startsWith('###'))
                editor.setLine(lineNum + 1, refLines[1]);
            else
                editor.replaceRange('\n' + refLines[1], { line: lineNum, ch: Number.MAX_SAFE_INTEGER });
        }
        new obsidian_1.Notice('Reference updated.');
    }
}
// ── Status Guide Modal ────────────────────────────────────────────────────────
const STATUS_DESCRIPTIONS = {
    'saved': 'You\'ve saved this for later but haven\'t looked at it yet.',
    'skimmed': 'You\'ve glanced at it and have a rough sense of the content.',
    'in-progress': 'You\'re actively reading, watching, or working through it.',
    'to-review': 'You\'ve gone through it but want to revisit before considering it done.',
    'completed': 'You\'ve fully consumed it and extracted what you needed.',
    'needs-review': 'Something about it needs attention — unclear notes, conflicting info, etc.',
    'abandoned': 'You\'ve decided not to continue with it.',
};
class StatusGuideModal extends obsidian_1.Modal {
    onOpen() {
        const { contentEl } = this;
        this.modalEl.addClass('refero-modal-el');
        contentEl.addClass('refero-modal');
        contentEl.createEl('h2', { text: 'Reference Statuses', cls: 'refero-modal-header' });
        const list = contentEl.createDiv('refero-status-guide-list');
        STATUS_ORDER.forEach(s => {
            var _a;
            const row = list.createDiv('refero-status-guide-row');
            row.createSpan({ text: `${s.icon}  ${s.label}`, cls: 'refero-status-guide-name' });
            row.createSpan({ text: (_a = STATUS_DESCRIPTIONS[s.key]) !== null && _a !== void 0 ? _a : '', cls: 'refero-status-guide-desc' });
        });
    }
    onClose() { this.contentEl.empty(); }
}
// ── Tag Browser Modal ─────────────────────────────────────────────────────────
class TagBrowserModal extends obsidian_1.Modal {
    onOpen() {
        const { contentEl } = this;
        this.modalEl.addClass('refero-modal-el');
        contentEl.addClass('refero-modal');
        contentEl.createEl('h2', { text: 'Browse by Tag', cls: 'refero-modal-header' });
        const loadingEl = contentEl.createEl('p', { text: 'Scanning vault…', cls: 'refero-muted' });
        parseVaultRefs(this.app).then(refs => {
            loadingEl.remove();
            const tagMap = new Map();
            refs.forEach(r => r.tags.forEach(t => {
                if (!tagMap.has(t))
                    tagMap.set(t, []);
                tagMap.get(t).push(r);
            }));
            if (tagMap.size === 0) {
                contentEl.createEl('p', { text: 'No tagged references found.', cls: 'refero-muted' });
                return;
            }
            const tagCloud = contentEl.createDiv('refero-tag-cloud');
            const resultEl = contentEl.createDiv('refero-tag-results');
            Array.from(tagMap.keys()).sort().forEach(tag => {
                const refs = tagMap.get(tag);
                const chip = tagCloud.createSpan({ text: `${tag} (${refs.length})`, cls: 'refero-tag-chip' });
                chip.onclick = () => {
                    tagCloud.querySelectorAll('.refero-tag-chip').forEach(c => c.removeClass('refero-tag-chip--active'));
                    chip.addClass('refero-tag-chip--active');
                    this.renderResults(resultEl, refs);
                };
            });
        });
    }
    renderResults(container, refs) {
        container.empty();
        refs.forEach(ref => {
            const item = container.createDiv('refero-suggestion-item');
            item.createDiv({ text: ref.title, cls: 'refero-suggestion-name' });
            item.createDiv({ text: ref.sourceFile.path, cls: 'refero-suggestion-path' });
            item.onclick = () => {
                this.app.workspace.openLinkText(ref.sourceFile.basename, '', false);
                this.close();
            };
        });
    }
    onClose() { this.contentEl.empty(); }
}
class RefMapView extends obsidian_1.ItemView {
    constructor() {
        super(...arguments);
        this.refs = [];
        this.filters = { type: '', status: '', tag: '', minStars: 0, dateFrom: '', dateTo: '' };
        this.sortBy = 'dateAdded';
        this.sortDir = 'desc';
    }
    getViewType() { return VIEW_TYPE_REFERO_MAP; }
    getDisplayText() { return 'Reference Map'; }
    getIcon() { return 'layout-list'; }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('refero-map-view');
            this.filterBarEl = contentEl.createDiv('refero-map-filters');
            this.statsEl = contentEl.createDiv('refero-map-stats');
            this.listEl = contentEl.createDiv('refero-map-list');
            this.buildFilterBar();
            yield this.loadAndRender();
        });
    }
    onClose() {
        return __awaiter(this, void 0, void 0, function* () { this.contentEl.empty(); });
    }
    buildFilterBar() {
        const bar = this.filterBarEl;
        bar.empty();
        const typeSelect = bar.createEl('select', { cls: 'refero-map-select' });
        typeSelect.createEl('option', { text: 'All Types', value: '' });
        TYPE_OPTIONS.forEach(t => typeSelect.createEl('option', { text: `${t.icon} ${t.label}`, value: t.key }));
        typeSelect.value = this.filters.type;
        typeSelect.onchange = () => { this.filters.type = typeSelect.value; this.render(); };
        const statusSelect = bar.createEl('select', { cls: 'refero-map-select' });
        statusSelect.createEl('option', { text: 'All Statuses', value: '' });
        STATUS_ORDER.forEach(s => statusSelect.createEl('option', { text: `${s.icon} ${s.label}`, value: s.key }));
        statusSelect.value = this.filters.status;
        statusSelect.onchange = () => { this.filters.status = statusSelect.value; this.render(); };
        const tagInput = bar.createEl('input', { type: 'text', placeholder: '#tag…', cls: 'refero-map-input' });
        tagInput.value = this.filters.tag;
        tagInput.oninput = () => { this.filters.tag = tagInput.value.trim(); this.render(); };
        const starsSelect = bar.createEl('select', { cls: 'refero-map-select' });
        starsSelect.createEl('option', { text: 'Any ★', value: '0' });
        for (let i = 1; i <= 5; i++)
            starsSelect.createEl('option', { text: `≥ ${'★'.repeat(i)}`, value: `${i}` });
        starsSelect.value = `${this.filters.minStars}`;
        starsSelect.onchange = () => { this.filters.minStars = parseInt(starsSelect.value); this.render(); };
        const dateFrom = bar.createEl('input', { type: 'date', cls: 'refero-map-input' });
        dateFrom.value = this.filters.dateFrom;
        dateFrom.title = 'Added from';
        dateFrom.onchange = () => { this.filters.dateFrom = dateFrom.value; this.render(); };
        const dateTo = bar.createEl('input', { type: 'date', cls: 'refero-map-input' });
        dateTo.value = this.filters.dateTo;
        dateTo.title = 'Added to';
        dateTo.onchange = () => { this.filters.dateTo = dateTo.value; this.render(); };
        const sortSelect = bar.createEl('select', { cls: 'refero-map-select' });
        [
            ['dateAdded', 'Date Added'],
            ['stars', 'Rating'],
            ['title', 'Title'],
            ['noteName', 'Note Name'],
            ['status', 'Status'],
        ].forEach(([v, t]) => sortSelect.createEl('option', { text: t, value: v }));
        sortSelect.value = this.sortBy;
        sortSelect.onchange = () => { this.sortBy = sortSelect.value; this.render(); };
        const dirBtn = bar.createEl('button', { text: this.sortDir === 'asc' ? '↑' : '↓', cls: 'refero-map-btn' });
        dirBtn.title = 'Toggle sort direction';
        dirBtn.onclick = () => {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
            dirBtn.textContent = this.sortDir === 'asc' ? '↑' : '↓';
            this.render();
        };
        const refreshBtn = bar.createEl('button', { text: '↻', cls: 'refero-map-btn' });
        refreshBtn.title = 'Refresh';
        refreshBtn.onclick = () => this.loadAndRender();
    }
    loadAndRender() {
        return __awaiter(this, void 0, void 0, function* () {
            this.statsEl.textContent = 'Scanning vault…';
            this.listEl.empty();
            this.refs = yield parseVaultRefs(this.app);
            this.render();
        });
    }
    render() {
        const filtered = this.applyFilters();
        const sorted = this.applySort(filtered);
        const noteCount = new Set(sorted.map(r => r.sourceFile.path)).size;
        this.statsEl.textContent =
            `${sorted.length} reference${sorted.length !== 1 ? 's' : ''} across ${noteCount} note${noteCount !== 1 ? 's' : ''}` +
                (sorted.length < this.refs.length ? ` (${this.refs.length} total)` : '');
        this.renderList(sorted);
    }
    applyFilters() {
        return this.refs.filter(r => {
            if (this.filters.type && r.type !== this.filters.type)
                return false;
            if (this.filters.status && r.status !== this.filters.status)
                return false;
            if (this.filters.minStars > 0 && r.stars < this.filters.minStars)
                return false;
            if (this.filters.tag) {
                const q = this.filters.tag.startsWith('#') ? this.filters.tag : `#${this.filters.tag}`;
                if (!r.tags.some(t => t.toLowerCase().includes(q.toLowerCase())))
                    return false;
            }
            if (this.filters.dateFrom && r.dateAdded && r.dateAdded < this.filters.dateFrom)
                return false;
            if (this.filters.dateTo && r.dateAdded && r.dateAdded > this.filters.dateTo)
                return false;
            return true;
        });
    }
    applySort(refs) {
        const dir = this.sortDir === 'asc' ? 1 : -1;
        return [...refs].sort((a, b) => {
            switch (this.sortBy) {
                case 'dateAdded': return dir * (a.dateAdded || '').localeCompare(b.dateAdded || '');
                case 'stars': return dir * (a.stars - b.stars);
                case 'title': return dir * a.title.localeCompare(b.title);
                case 'noteName': return dir * a.sourceFile.basename.localeCompare(b.sourceFile.basename);
                case 'status': {
                    const ai = STATUS_ORDER.findIndex(s => s.key === a.status);
                    const bi = STATUS_ORDER.findIndex(s => s.key === b.status);
                    return dir * (ai - bi);
                }
                default: return 0;
            }
        });
    }
    renderList(refs) {
        this.listEl.empty();
        if (refs.length === 0) {
            this.listEl.createEl('p', { text: 'No references match the current filters.', cls: 'refero-muted' });
            return;
        }
        refs.forEach(ref => {
            const card = this.listEl.createDiv({ cls: `refero-map-card${ref.isBroken ? ' refero-map-card--broken' : ''}` });
            const header = card.createDiv('refero-map-card-header');
            header.createSpan({ text: ref.typeIcon, cls: 'refero-map-type-icon' });
            const titleEl = header.createSpan({ cls: 'refero-map-card-title' });
            if (ref.isBroken) {
                titleEl.createSpan({ text: ref.title || ref.url });
                titleEl.createSpan({ text: ' ⚠️ missing', cls: 'refero-broken-badge' });
            }
            else if (ref.type === 'plain-note' && ref.url) {
                const a = titleEl.createEl('a', { text: ref.title, href: '#' });
                a.onclick = (e) => { e.preventDefault(); this.app.workspace.openLinkText(ref.title, ref.sourceFile.path, false); };
            }
            else if (ref.url) {
                const a = titleEl.createEl('a', { text: ref.title, href: ref.url });
                a.onclick = (e) => { e.preventDefault(); window.open(ref.url, '_blank'); };
            }
            else {
                titleEl.createSpan({ text: ref.title });
            }
            header.createSpan({ text: `${ref.statusIcon} ${ref.statusLabel}`, cls: 'refero-map-status' });
            if (ref.stars > 0)
                header.createSpan({ text: '★'.repeat(ref.stars) + '☆'.repeat(5 - ref.stars), cls: 'refero-map-stars' });
            const meta = [];
            if (ref.tags.length)
                meta.push(ref.tags.join(' '));
            if (ref.dateAdded)
                meta.push(`📅 ${ref.dateAdded}`);
            if (ref.dateCompleted)
                meta.push(`✔ ${ref.dateCompleted}`);
            if (meta.length)
                card.createDiv({ text: meta.join('  ·  '), cls: 'refero-map-card-meta' });
            const sourceEl = card.createDiv('refero-map-card-source');
            sourceEl.createSpan({ text: 'in ' });
            const nl = sourceEl.createEl('a', { text: ref.sourceFile.basename, href: '#' });
            nl.onclick = (e) => { e.preventDefault(); this.app.workspace.openLinkText(ref.sourceFile.basename, '', false); };
        });
    }
}
// ── Broken References Modal ───────────────────────────────────────────────────
class BrokenRefsModal extends obsidian_1.Modal {
    onOpen() {
        const { contentEl } = this;
        this.modalEl.addClass('refero-modal-el');
        contentEl.addClass('refero-modal');
        contentEl.createEl('h2', { text: 'Broken References', cls: 'refero-modal-header' });
        const loadingEl = contentEl.createEl('p', { text: 'Scanning vault…', cls: 'refero-muted' });
        parseVaultRefs(this.app).then(refs => {
            loadingEl.remove();
            const broken = refs.filter(r => r.isBroken);
            if (broken.length === 0) {
                contentEl.createEl('p', { text: '✅ No broken references found.', cls: 'refero-muted' });
                return;
            }
            contentEl.createEl('p', {
                text: `Found ${broken.length} broken reference${broken.length !== 1 ? 's' : ''}:`,
                cls: 'refero-muted',
            });
            const list = contentEl.createDiv('refero-broken-list');
            broken.forEach(ref => {
                const item = list.createDiv('refero-suggestion-item');
                item.createDiv({ text: ref.title || ref.url, cls: 'refero-suggestion-name' });
                const detail = item.createDiv({ cls: 'refero-suggestion-path' });
                detail.createSpan({ text: 'in ' });
                const nl = detail.createEl('a', { text: ref.sourceFile.basename, href: '#' });
                nl.onclick = (e) => { e.preventDefault(); this.app.workspace.openLinkText(ref.sourceFile.basename, '', false); this.close(); };
                detail.createSpan({ text: ` → missing: ${ref.url}` });
            });
        });
    }
    onClose() { this.contentEl.empty(); }
}
