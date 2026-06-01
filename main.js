"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const TYPE_OPTIONS = [
    { key: 'plain-note', label: 'Obsidian Note', icon: '📎' },
    { key: 'web-page', label: 'Web Page', icon: '🌐' },
    { key: 'video', label: 'Video', icon: '🎥' },
    { key: 'course', label: 'Course', icon: '🎓' },
    { key: 'textbook', label: 'Textbook', icon: '📚' },
    { key: 'paper', label: 'Paper', icon: '📄' },
    { key: 'repository', label: 'Repository', icon: '💻' },
    { key: 'other', label: 'Other', icon: '📦' },
];
const STATUS_ORDER = [
    { key: 'saved', label: 'Saved/Unprocessed', icon: '📥' },
    { key: 'skimmed', label: 'Skimmed', icon: '🔍' },
    { key: 'in-progress', label: 'In Progress', icon: '🔄' },
    { key: 'to-review', label: 'To Review', icon: '⏳' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'maybe-useful', label: 'Maybe Useful', icon: '🤔' },
    { key: 'needs-review', label: 'Needs Review', icon: '❗' },
];
function getStatusInfo(key) {
    return STATUS_ORDER.find(s => s.key === key) || STATUS_ORDER[0];
}
function getTypeInfo(key) {
    return TYPE_OPTIONS.find(t => t.key === key) || TYPE_OPTIONS[0];
}
class ReferenceAutomatorPlugin extends obsidian_1.Plugin {
    onload() {
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
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this in a Markdown note.');
                    return;
                }
                let lineNum = editor.getCursor().line;
                let line = editor.getLine(lineNum);
                if (!line.trim().startsWith('###') && lineNum > 0) {
                    const prevLine = editor.getLine(lineNum - 1);
                    if (prevLine.trim().startsWith('###')) {
                        lineNum = lineNum - 1;
                        line = prevLine;
                    }
                }
                if (!line.trim().startsWith('###')) {
                    new obsidian_1.Notice('⛔️ Place cursor on a reference line.');
                    return;
                }
                new ReferenceModal(this.app, editor, lineNum, line).open();
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
                const urlMatch = line.match(/\]\((https?:\/\/[^)]+)\)/);
                if (!urlMatch) {
                    new obsidian_1.Notice('No external URL on this reference.');
                    return;
                }
                window.open(urlMatch[1], '_blank');
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
                editor.replaceRange('', { line: lineNum, ch: 0 }, { line: lineNum + 1, ch: 0 });
                new obsidian_1.Notice('Reference deleted.');
            },
        });
        this.addCommand({
            id: 'cycle-ref-status',
            name: 'Cycle Reference Status',
            editorCallback: (editor, ctx) => {
                if (!(ctx instanceof obsidian_1.MarkdownView)) {
                    new obsidian_1.Notice('⛔️ Run this in a Markdown note.');
                    return;
                }
                const lineNum = editor.getCursor().line;
                let line = editor.getLine(lineNum);
                if (!line.trim().startsWith('###')) {
                    new obsidian_1.Notice('⛔️ Place cursor on a reference line.');
                    return;
                }
                const currIdx = STATUS_ORDER.findIndex(s => line.includes(`**${s.label}**`));
                const next = STATUS_ORDER[(currIdx + 1) % STATUS_ORDER.length];
                line = line.replace(/\|\s+\S+\s+\*\*.+?\*\*/, `| ${next.icon} **${next.label}**`);
                editor.setLine(lineNum, line);
                new obsidian_1.Notice(`Status → ${next.label}`);
            },
        });
    }
}
exports.default = ReferenceAutomatorPlugin;
class ReferenceModal extends obsidian_1.Modal {
    constructor(app, editor, editLine, initialLine) {
        super(app);
        this.currentRating = 0;
        this.stars = [];
        this.suggestionIndex = -1;
        this.editor = editor;
        this.editLine = editLine;
        this.initialLine = initialLine;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('refero-modal');
        contentEl.createEl('h2', {
            text: this.editLine != null ? 'Edit Reference' : 'Add Reference',
            cls: 'refero-modal-header',
        });
        // ── 1. Type — first tab stop; sets context for everything below ───────────
        const typeWrapper = contentEl.createDiv('refero-field-wrapper');
        typeWrapper.createEl('label', { text: 'Type', cls: 'refero-label' });
        this.typeSelect = typeWrapper.createEl('select', { cls: 'refero-select' });
        TYPE_OPTIONS.forEach(t => this.typeSelect.createEl('option', { text: `${t.icon} ${t.label}`, value: t.key }));
        this.typeSelect.onchange = () => this.onTypeChange();
        this.typeSelect.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')
                return;
            e.preventDefault(); // stop native macOS popup, handle cycling ourselves
            const opts = Array.from(this.typeSelect.options);
            const idx = opts.findIndex(o => o.value === this.typeSelect.value);
            const next = e.key === 'ArrowDown'
                ? Math.min(idx + 1, opts.length - 1)
                : Math.max(idx - 1, 0);
            if (next !== idx) {
                this.typeSelect.value = opts[next].value;
                this.onTypeChange();
            }
        });
        // ── 2. URL — second tab stop; hidden for plain-note, auto-focused on reveal
        this.urlWrapper = contentEl.createDiv('refero-field-wrapper');
        this.urlWrapper.createEl('label', { text: 'URL', cls: 'refero-label' });
        this.urlInput = this.urlWrapper.createEl('input', {
            type: 'text',
            placeholder: 'Paste a URL — type is auto-detected',
            cls: 'refero-input',
        });
        this.suggestionsContainer = this.urlWrapper.createDiv('refero-suggestions');
        this.urlInput.oninput = () => {
            if (this.typeSelect.value !== 'plain-note')
                this.detectTypeFromUrl();
        };
        this.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        // ── 3. Title — third tab stop; note autocomplete active in plain-note mode
        const titleWrapper = contentEl.createDiv('refero-field-wrapper');
        titleWrapper.createEl('label', { text: 'Title', cls: 'refero-label' });
        this.titleInput = titleWrapper.createEl('input', {
            type: 'text',
            placeholder: 'Enter the name of the reference',
            cls: 'refero-input',
        });
        this.titleSuggestionsContainer = titleWrapper.createDiv('refero-suggestions');
        this.titleInput.oninput = () => {
            if (this.typeSelect.value === 'plain-note')
                this.showTitleSuggestions();
        };
        this.titleInput.onfocus = () => {
            if (this.typeSelect.value === 'plain-note')
                this.showTitleSuggestions();
        };
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
                    const items = this.titleSuggestionsContainer.querySelectorAll('.refero-suggestion-item');
                    (_a = items[this.suggestionIndex]) === null || _a === void 0 ? void 0 : _a.click();
                }
                else if (!open) {
                    this.submit();
                }
            }
        });
        // ── 4. Status — fourth tab stop
        const statusWrapper = contentEl.createDiv('refero-field-wrapper');
        const statusLabel = statusWrapper.createEl('label', { cls: 'refero-label' });
        statusLabel.createSpan({ text: 'Status' });
        statusLabel.createEl('a', {
            text: '?',
            href: 'obsidian://open?vault=Obsidian%20Vault&file=Refrencer%2FReference%20Status%20Guide',
            cls: 'refero-label-hint',
        });
        this.statusSelect = statusWrapper.createEl('select', { cls: 'refero-select' });
        STATUS_ORDER.forEach(s => this.statusSelect.createEl('option', { text: `${s.icon} ${s.label}`, value: s.key }));
        // ── 5. Rating — fifth tab stop; ←→ arrows or 1–5 keys, Enter to submit
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
            star.onclick = () => {
                this.currentRating = this.currentRating === i + 1 ? 0 : i + 1;
                this.updateStarDisplay();
            };
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
        this.onTypeChange();
        if (this.initialLine) {
            this.prefillFromLine();
        }
        else {
            this.setInitialType();
            this.onTypeChange();
        }
        // new reference → focus Type so the user picks context first;
        // editing → focus Title since type is already set
        setTimeout(() => (this.editLine != null ? this.titleInput : this.typeSelect).focus(), 50);
        this.clickHandler = (e) => {
            if (!this.urlInput.contains(e.target) &&
                !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
            if (!this.titleInput.contains(e.target) &&
                !this.titleSuggestionsContainer.contains(e.target)) {
                this.hideTitleSuggestions();
            }
        };
        document.addEventListener('click', this.clickHandler);
    }
    onClose() {
        document.removeEventListener('click', this.clickHandler);
        this.contentEl.empty();
    }
    // ── Submit ───────────────────────────────────────────────────────────────
    submit() {
        const data = {
            type: this.typeSelect.value,
            title: this.titleInput.value.trim(),
            url: this.urlInput.value.trim(),
            status: this.statusSelect.value,
            stars: this.currentRating,
        };
        if (this.editLine != null) {
            this.replaceLine(this.editLine, data);
        }
        else {
            this.insertLine(data);
        }
        this.close();
    }
    // ── Type change ──────────────────────────────────────────────────────────
    onTypeChange() {
        var _a;
        this.hideSuggestions();
        this.hideTitleSuggestions();
        const isNote = this.typeSelect.value === 'plain-note';
        this.urlWrapper.style.display = isNote ? 'none' : '';
        if (isNote) {
            this.titleInput.placeholder = '📄 Start typing a note name…';
        }
        else {
            const placeholders = {
                video: '🎥 Video URL',
                repository: '💻 Repository URL',
                course: '🎓 Course URL',
                textbook: '📚 Book URL or ISBN page',
                paper: '📄 Paper or DOI URL',
            };
            this.urlInput.placeholder = (_a = placeholders[this.typeSelect.value]) !== null && _a !== void 0 ? _a : '🌐 Paste URL — type is auto-detected';
            this.titleInput.placeholder = 'Enter the name of the reference';
        }
    }
    // ── URL-based type detection ─────────────────────────────────────────────
    detectTypeFromUrl() {
        const url = this.urlInput.value.toLowerCase();
        if (!url)
            return;
        const detect = () => {
            if (/github\.com|gitlab\.com|bitbucket\.org|codeberg\.org|sourceforge\.net/.test(url))
                return 'repository';
            if (/youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|dailymotion\.com|wistia\.com|loom\.com/.test(url))
                return 'video';
            if (/udemy\.com|coursera\.org|edx\.org|pluralsight\.com|skillshare\.com|lynda\.com|linkedin\.com\/learning|masterclass\.com|khanacademy\.org|codecademy\.com|treehouse\.com|udacity\.com/.test(url))
                return 'course';
            if (/springer\.com|wiley\.com|elsevier\.com|pearson\.com|cengage\.com|mcgraw-hill\.com|cambridge\.org|oup\.com|books\.google\.com|amazon\.com\/(dp|gp\/product)|goodreads\.com|openstax\.org|mit\.edu\/books|archive\.org\/details/.test(url))
                return 'textbook';
            if (/arxiv\.org|doi\.org|pubmed\.ncbi|semanticscholar\.org|researchgate\.net|jstor\.org|ieee\.org|acm\.org/.test(url))
                return 'paper';
            // local obsidian paths only — exclude web URLs that happen to contain .md in their path
            if (url.startsWith('obsidian://') || url.startsWith('app://local/') ||
                (url.includes('.md') && !url.includes('://')))
                return 'plain-note';
            if (url.startsWith('https://') || url.startsWith('http://'))
                return 'web-page';
            // partial / unrecognised input — don't change type
            return null;
        };
        const next = detect();
        if (next !== null && next !== this.typeSelect.value) {
            this.typeSelect.value = next;
            this.onTypeChange();
        }
    }
    setInitialType() {
        var _a, _b, _c;
        const url = ((_c = (_b = (_a = this.initialLine) === null || _a === void 0 ? void 0 : _a.match(/\]\((.*?)\)/)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : '').toLowerCase();
        if (url) {
            const saved = this.urlInput.value;
            this.urlInput.value = url;
            this.detectTypeFromUrl();
            this.urlInput.value = saved;
        }
        else {
            this.typeSelect.value = 'plain-note';
        }
    }
    // ── Prefill for edit mode ────────────────────────────────────────────────
    prefillFromLine() {
        var _a, _b, _c, _d, _e;
        if (!this.initialLine)
            return;
        const parts = this.initialLine.split('|').map(p => p.trim());
        if (parts.length > 0) {
            const first = parts[0];
            const internal = first.match(/\[\[([^\]]+)(?:\|([^\]]+))?\]\]/);
            if (internal) {
                const path = internal[1];
                this.titleInput.value = (_b = (_a = internal[2]) !== null && _a !== void 0 ? _a : path.split('/').pop()) !== null && _b !== void 0 ? _b : path;
                this.urlInput.value = path.endsWith('.md') ? path : path + '.md';
            }
            else {
                const md = first.match(/\[([^\]]+)\]\((.*?)\)/);
                if (md) {
                    this.titleInput.value = md[1];
                    this.urlInput.value = md[2];
                }
                else {
                    this.titleInput.value = first.replace(/^###\s*/, '');
                }
            }
        }
        if (parts.length > 1) {
            const icon = (_c = parts[1].match(/^(\S+)/)) === null || _c === void 0 ? void 0 : _c[1];
            const match = TYPE_OPTIONS.find(t => t.icon === icon);
            if (match)
                this.typeSelect.value = match.key;
        }
        if (parts.length > 2) {
            const label = (_d = parts[2].match(/\*\*([^*]+)\*\*/)) === null || _d === void 0 ? void 0 : _d[1];
            const match = STATUS_ORDER.find(s => s.label === label);
            if (match)
                this.statusSelect.value = match.key;
        }
        if (parts.length > 3) {
            this.currentRating = ((_e = parts[3].match(/★/g)) !== null && _e !== void 0 ? _e : []).length;
            this.updateStarDisplay();
        }
        this.onTypeChange();
    }
    // ── Note autocomplete ────────────────────────────────────────────────────
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
            else {
                item.removeClass('refero-suggestion-item--active');
            }
        });
    }
    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
    }
    hideTitleSuggestions() {
        this.titleSuggestionsContainer.style.display = 'none';
        this.suggestionIndex = -1;
    }
    // ── Star rating ──────────────────────────────────────────────────────────
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
    // ── Line building ────────────────────────────────────────────────────────
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
                const linkPath = data.url.replace(/\.md$/, '');
                link = data.title.trim() === file.basename
                    ? `[[${linkPath}]]`
                    : `[[${linkPath}|${data.title}]]`;
            }
            else {
                link = `[${data.title}](${data.url})`;
            }
        }
        else {
            link = data.url ? `[${data.title}](${data.url})` : data.title;
        }
        return `### ${link}\n${typeInfo.icon} ${typeInfo.label} | ${statusInfo.icon} **${statusInfo.label}** | ${this.starString(data.stars)}`;
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
            if (insertPos < lines.length &&
                !lines[insertPos].startsWith('###') &&
                lines[insertPos].trim() !== '') {
                insertPos++;
            }
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
            if (editor.getLine(lineNum + 1) && !editor.getLine(lineNum + 1).startsWith('###')) {
                editor.setLine(lineNum + 1, refLines[1]);
            }
            else {
                editor.replaceRange('\n' + refLines[1], { line: lineNum, ch: Number.MAX_SAFE_INTEGER });
            }
        }
        new obsidian_1.Notice('Reference updated.');
    }
}
