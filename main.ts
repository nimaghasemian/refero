// main.ts — Reference Automator (Type, Title, URL, Status, Rating)

import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  TFile,
} from 'obsidian';

interface ReferenceData {
  type: string;
  title: string;
  url: string;
  status: string;
  stars: number; // 0–5
}

const TYPE_OPTIONS = [
  { key: 'plain-note', label: 'Obsidian Note', icon: '📄' },
  { key: 'web-page', label: 'Web Page', icon: '🌐' },
  { key: 'video', label: 'Video', icon: '🎥' },
  { key: 'course', label: 'Course', icon: '🎓' },
  { key: 'textbook', label: 'Textbook', icon: '📚' },
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

function getStatusInfo(key: string) {
  return STATUS_ORDER.find(s => s.key === key) || STATUS_ORDER[0];
}
function getTypeInfo(key: string) {
  return TYPE_OPTIONS.find(t => t.key === key) || TYPE_OPTIONS[0];
}

export default class ReferenceAutomatorPlugin extends Plugin {
  onload() {
    this.addCommand({
      id: 'add-reference',
      name: 'Add Reference to Note',
      editorCallback: (editor, ctx) => {
        if (!(ctx instanceof MarkdownView)) {
          new Notice('⛔️ Run this command in a Markdown note.');
          return;
        }
        new ReferenceModal(this.app, editor).open();
      },
    });

    this.addCommand({
      id: 'edit-reference',
      name: 'Edit Reference Under Cursor',
      editorCallback: (editor, ctx) => {
        if (!(ctx instanceof MarkdownView)) {
          new Notice('⛔️ Run this in a Markdown note.');
          return;
        }
        let lineNum = editor.getCursor().line;
        let line = editor.getLine(lineNum);
        // If not a reference line, check the line above
        if (!line.trim().startsWith('###') && lineNum > 0) {
          const prevLine = editor.getLine(lineNum - 1);
          if (prevLine.trim().startsWith('###')) {
            lineNum = lineNum - 1;
            line = prevLine;
          }
        }
        if (!line.trim().startsWith('###')) {
          new Notice('⛔️ Place cursor on a reference line.');
          return;
        }
        new ReferenceModal(this.app, editor, lineNum, line).open();
      },
    });

    this.addCommand({
      id: 'delete-reference',
      name: 'Delete Reference Under Cursor',
      editorCallback: (editor, ctx) => {
        if (!(ctx instanceof MarkdownView)) {
          new Notice('⛔️ Run this in a Markdown note.');
          return;
        }
        const lineNum = editor.getCursor().line;
        const line = editor.getLine(lineNum);
        // Fixed: Check for any line starting with '###'
        if (!line.trim().startsWith('###')) {
          new Notice('⛔️ Place cursor on a reference line.');
          return;
        }
        editor.replaceRange('', { line: lineNum, ch: 0 }, { line: lineNum + 1, ch: 0 });
        new Notice('Reference deleted.');
      },
    });

    this.addCommand({
      id: 'cycle-ref-status',
      name: 'Cycle Reference Status',
      editorCallback: (editor, ctx) => {
        if (!(ctx instanceof MarkdownView)) {
          new Notice('⛔️ Run this in a Markdown note.');
          return;
        }
        const lineNum = editor.getCursor().line;
        let line = editor.getLine(lineNum);
        // Fixed: Check for any line starting with '###'
        if (!line.trim().startsWith('###')) {
          new Notice('⛔️ Place cursor on a reference line.');
          return;
        }
        const currIdx = STATUS_ORDER.findIndex(s => line.includes(`**${s.label}**`));
        const next = STATUS_ORDER[(currIdx + 1) % STATUS_ORDER.length];
        line = line.replace(/\|\s+\S+\s+\*\*.+?\*\*/, `| ${next.icon} **${next.label}**`);
        editor.setLine(lineNum, line);
        new Notice(`Status → ${next.label}`);
      },
    });
  }
}

class ReferenceModal extends Modal {
  private editor: Editor;
  private editLine?: number;
  private initialLine?: string;
  private currentRating: number = 0;
  private urlInput!: HTMLInputElement;
  private titleInput!: HTMLInputElement;
  private typeSelect!: HTMLSelectElement;
  private suggestionsContainer!: HTMLElement;
  private titleSuggestionsContainer!: HTMLElement;

  constructor(app: App, editor: Editor, editLine?: number, initialLine?: string) {
    super(app);
    this.editor = editor;
    this.editLine = editLine;
    this.initialLine = initialLine;
  }

  onOpen() {
    const { contentEl } = this;
    
    // Enhanced modal styling - fixed scrolling
    contentEl.style.padding = '20px';
    contentEl.style.display = 'flex';
    contentEl.style.flexDirection = 'column';
    contentEl.style.gap = '12px';
    contentEl.style.maxWidth = '500px';
    contentEl.style.width = '500px';
    contentEl.style.margin = '0 auto';
    contentEl.style.fontFamily = 'var(--font-text)';
    contentEl.style.lineHeight = '1.4';
    contentEl.style.maxHeight = '85vh';
    contentEl.style.height = 'auto';
    contentEl.style.overflowY = 'auto';
    contentEl.style.overflowX = 'hidden';

    // Header with better styling
    const header = contentEl.createEl('h2', {
      text: this.editLine != null ? 'Edit Reference' : 'Add Reference'
    });
    header.style.margin = '0 0 12px 0';
    header.style.color = 'var(--text-normal)';
    header.style.fontSize = '22px';
    header.style.fontWeight = '600';
    header.style.borderBottom = '2px solid var(--interactive-accent)';
    header.style.paddingBottom = '10px';

    // Enhanced label styling - improved font
    const labelStyle = {
      fontWeight: '600',
      display: 'block',
      marginTop: '16px',
      marginBottom: '8px',
      color: 'var(--text-normal)',
      fontSize: '15px',
      textTransform: 'none',
      letterSpacing: '0.2px',
      fontFamily: 'var(--font-text)',
      lineHeight: '1.3'
    };

    // Enhanced input styling - better sizing
    const inputStyle = {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid var(--background-modifier-border)',
      borderRadius: '8px',
      fontSize: '15px',
      backgroundColor: 'var(--background-primary)',
      color: 'var(--text-normal)',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-text)',
      lineHeight: '1.4',
      minHeight: '44px'
    };

    const inputFocusStyle = {
      borderColor: 'var(--interactive-accent)',
      boxShadow: '0 0 0 3px rgba(var(--interactive-accent-rgb), 0.1)',
      outline: 'none'
    };

    // Enhanced select styling - fixed display
    const selectStyle = {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid var(--background-modifier-border)',
      borderRadius: '8px',
      fontSize: '15px',
      backgroundColor: 'var(--background-primary)',
      color: 'var(--text-normal)',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
      cursor: 'pointer',
      fontFamily: 'var(--font-text)',
      appearance: 'none',
      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px top 50%',
      backgroundSize: '14px auto',
      paddingRight: '40px',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      minHeight: '44px',
      lineHeight: '1.4',
      paddingTop: '12px',
      paddingBottom: '12px',
      display: 'flex',
      alignItems: 'center'
    };

    // TYPE
    const typeLabel = contentEl.createEl('label', { text: 'Type' });
    Object.assign(typeLabel.style, labelStyle);
    this.typeSelect = contentEl.createEl('select');
    Object.assign(this.typeSelect.style, selectStyle);
    TYPE_OPTIONS.forEach(t =>
      this.typeSelect.createEl('option', { text: `${t.icon} ${t.label}`, value: t.key })
    );
    
    // Add focus styles
    this.typeSelect.onfocus = () => Object.assign(this.typeSelect.style, inputFocusStyle);
    this.typeSelect.onblur = () => {
      this.typeSelect.style.borderColor = 'var(--background-modifier-border)';
      this.typeSelect.style.boxShadow = 'none';
    };

    // TITLE
    const titleLabel = contentEl.createEl('label', { text: 'Title' });
    Object.assign(titleLabel.style, labelStyle);
    this.titleInput = contentEl.createEl('input', {
      type: 'text',
      placeholder: 'Enter the name of the reference'
    });
    Object.assign(this.titleInput.style, inputStyle);
    
    // Add focus styles
    this.titleInput.onfocus = () => Object.assign(this.titleInput.style, inputFocusStyle);
    this.titleInput.onblur = () => {
      this.titleInput.style.borderColor = 'var(--background-modifier-border)';
      this.titleInput.style.boxShadow = 'none';
    };

    // URL (conditionally rendered)
    const urlLabel = contentEl.createEl('label', { text: 'URL' });
    Object.assign(urlLabel.style, labelStyle);
    this.urlInput = contentEl.createEl('input', {
      type: 'text',
      placeholder: 'Enter URL or note path'
    });
    Object.assign(this.urlInput.style, inputStyle);
    
    // Add focus styles and prevent underlining
    this.urlInput.onfocus = () => Object.assign(this.urlInput.style, inputFocusStyle);
    this.urlInput.onblur = () => {
      this.urlInput.style.borderColor = 'var(--background-modifier-border)';
      this.urlInput.style.boxShadow = 'none';
    };
    
    // Prevent default browser styling
    this.urlInput.style.textDecoration = 'none';
    this.urlInput.style.borderBottom = '2px solid var(--background-modifier-border)';

    // Hide URL field if type is Obsidian Note
    if (this.typeSelect.value === 'plain-note') {
      urlLabel.style.display = 'none';
      this.urlInput.style.display = 'none';
    } else {
      urlLabel.style.display = '';
      this.urlInput.style.display = '';
    }

    // Enhanced suggestions container
    this.suggestionsContainer = contentEl.createEl('div');
    this.suggestionsContainer.style.display = 'none';
    this.suggestionsContainer.style.maxHeight = '200px';
    this.suggestionsContainer.style.height = '200px';
    this.suggestionsContainer.style.overflowY = 'auto';
    this.suggestionsContainer.style.border = '2px solid var(--background-modifier-border)';
    this.suggestionsContainer.style.borderRadius = '6px';
    this.suggestionsContainer.style.marginTop = '4px';
    this.suggestionsContainer.style.backgroundColor = 'var(--background-primary)';
    this.suggestionsContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    this.suggestionsContainer.style.position = 'relative';
    this.suggestionsContainer.style.zIndex = '1000';

    // Enhanced title suggestions container
    this.titleSuggestionsContainer = contentEl.createEl('div');
    this.titleSuggestionsContainer.style.display = 'none';
    this.titleSuggestionsContainer.style.maxHeight = '200px';
    this.titleSuggestionsContainer.style.height = '200px';
    this.titleSuggestionsContainer.style.overflowY = 'auto';
    this.titleSuggestionsContainer.style.border = '2px solid var(--background-modifier-border)';
    this.titleSuggestionsContainer.style.borderRadius = '6px';
    this.titleSuggestionsContainer.style.marginTop = '4px';
    this.titleSuggestionsContainer.style.backgroundColor = 'var(--background-primary)';
    this.titleSuggestionsContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    this.titleSuggestionsContainer.style.position = 'relative';
    this.titleSuggestionsContainer.style.zIndex = '1000';

    // STATUS
    const statusLabel = contentEl.createEl('label', { text: 'Status' });
    Object.assign(statusLabel.style, labelStyle);
    const statusSelect = contentEl.createEl('select');
    Object.assign(statusSelect.style, selectStyle);
    STATUS_ORDER.forEach(s =>
      statusSelect.createEl('option', { text: `${s.icon} ${s.label}`, value: s.key })
    );
    
    // Add focus styles
    statusSelect.onfocus = () => Object.assign(statusSelect.style, inputFocusStyle);
    statusSelect.onblur = () => {
      statusSelect.style.borderColor = 'var(--background-modifier-border)';
      statusSelect.style.boxShadow = 'none';
    };

    // Enhanced help text - more compact
    const help = contentEl.createEl('div');
    help.style.fontSize = '12px';
    help.style.marginBottom = '6px';
    help.style.padding = '10px';
    help.style.backgroundColor = 'var(--background-secondary)';
    help.style.borderRadius = '5px';
    help.style.borderLeft = '3px solid var(--interactive-accent)';
    help.style.fontFamily = 'var(--font-text)';
    help.innerHTML =
      '💡 <strong>Need help picking a status?</strong> <a href="obsidian://open?vault=Obsidian%20Vault&file=Refrencer%2FReference%20Status%20Guide" style="color: var(--text-accent); text-decoration: none;">See the guide</a>';

    // RATING - Enhanced Dynamic Star Rating - more compact
    const ratingLabel = contentEl.createEl('label', { text: 'Reference Quality' });
    Object.assign(ratingLabel.style, labelStyle);
    
    const ratingContainer = contentEl.createEl('div');
    ratingContainer.style.display = 'flex';
    ratingContainer.style.alignItems = 'center';
    ratingContainer.style.gap = '10px';
    ratingContainer.style.marginBottom = '6px';
    ratingContainer.style.padding = '12px';
    ratingContainer.style.backgroundColor = 'var(--background-secondary)';
    ratingContainer.style.borderRadius = '6px';
    ratingContainer.style.border = '1px solid var(--background-modifier-border)';
    
    const starsContainer = ratingContainer.createEl('div');
    starsContainer.style.display = 'flex';
    starsContainer.style.gap = '3px';
    starsContainer.style.fontSize = '20px';
    starsContainer.style.cursor = 'pointer';
    
    const ratingText = ratingContainer.createEl('span');
    ratingText.style.marginLeft = '6px';
    ratingText.style.fontSize = '13px';
    ratingText.style.color = 'var(--text-muted)';
    ratingText.style.fontWeight = '500';
    ratingText.style.fontFamily = 'var(--font-text)';
    
    // Create star elements with enhanced styling
    const stars: HTMLElement[] = [];
    for (let i = 0; i < 5; i++) {
      const star = starsContainer.createEl('span', { text: '☆' });
      star.style.cursor = 'pointer';
      star.style.transition = 'all 0.2s ease';
      star.style.fontSize = '22px';
      star.style.lineHeight = '1';
      stars.push(star);
      
      // Click event
      star.onclick = () => {
        this.currentRating = i + 1;
        this.updateStarDisplay(stars, ratingText);
      };
      
      // Hover events
      star.onmouseenter = () => {
        this.updateStarDisplay(stars, ratingText, i + 1);
      };
      
      star.onmouseleave = () => {
        this.updateStarDisplay(stars, ratingText);
      };
    }
    
    // Initialize star display
    this.updateStarDisplay(stars, ratingText);

    const RQhelp = contentEl.createEl('div');
    RQhelp.style.fontSize = '12px';
    RQhelp.style.marginBottom = '6px';
    RQhelp.style.padding = '10px';
    RQhelp.style.backgroundColor = 'var(--background-secondary)';
    RQhelp.style.borderRadius = '5px';
    RQhelp.style.borderLeft = '3px solid var(--interactive-accent)';
    RQhelp.style.fontFamily = 'var(--font-text)';
    RQhelp.innerHTML = '⭐ <strong>Rate this reference\'s quality/reliability</strong> from 1 (low) to 5 (high).';

    // Set up event listeners for Obsidian note detection and URL type detection
    this.setupObsidianNoteDetection();
    this.setupUrlTypeDetection();

    // Prefill if editing
    if (this.initialLine) {
      const parts = this.initialLine.split('|').map(p => p.trim());
      
      // Parse title and URL
      if (parts.length > 0) {
        const firstPart = parts[0];
        
        // Handle Obsidian internal links [[path|title]] or [[path]]
        const internalLinkMatch = firstPart.match(/\[\[([^\]]+)(?:\|([^\]]+))?\]\]/);
        if (internalLinkMatch) {
          const linkPath = internalLinkMatch[1];
          const linkTitle = internalLinkMatch[2] || linkPath.split('/').pop() || linkPath;
          this.titleInput.value = linkTitle;
          this.urlInput.value = linkPath + (linkPath.endsWith('.md') ? '' : '.md');
        } else {
          // Handle markdown links [title](url)
          const linkMatch = firstPart.match(/\[([^\]]+)\]\((.*?)\)/);
          if (linkMatch) {
            this.titleInput.value = linkMatch[1];
            this.urlInput.value = linkMatch[2];
          } else {
            // Handle plain title without URL
            this.titleInput.value = firstPart.replace(/^###\s*/, '');
          }
        }
      }
      
      // Parse type
      if (parts.length > 1) {
        const typePart = parts[1];
        const typeIconMatch = typePart.match(/^(\S+)/);
        if (typeIconMatch) {
          const typeIcon = typeIconMatch[1];
          const typeOption = TYPE_OPTIONS.find(t => t.icon === typeIcon);
          if (typeOption) this.typeSelect.value = typeOption.key;
        }
      }
      
      // Parse status
      if (parts.length > 2) {
        const statusPart = parts[2];
        const statusLabelMatch = statusPart.match(/\*\*([^*]+)\*\*/);
        if (statusLabelMatch) {
          const statusLabel = statusLabelMatch[1];
          const statusOption = STATUS_ORDER.find(s => s.label === statusLabel);
          if (statusOption) statusSelect.value = statusOption.key;
        }
      }
      
      // Parse rating
      if (parts.length > 3) {
        const ratingPart = parts[3];
        const starCount = (ratingPart.match(/★/g) || []).length;
        this.currentRating = starCount;
        this.updateStarDisplay(stars, ratingText);
      }
    } else {
      // For new references, set type based on URL
      const initialUrl = this.initialLine
        ? (this.initialLine.match(/\]\((.*?)\)/)?.[1] || '')
        : '';
      if (initialUrl.startsWith('https://')) {
        this.typeSelect.value = 'web-page';
      } else {
        this.typeSelect.value = 'plain-note';
      }
    }

    // Enhanced submit button - more compact
    const submit = contentEl.createEl('button', {
      text: this.editLine != null ? 'Update Reference' : 'Add Reference',
      cls: 'mod-cta'
    });
    submit.style.fontWeight = '600';
    submit.style.padding = '12px 20px';
    submit.style.marginTop = '16px';
    submit.style.borderRadius = '6px';
    submit.style.fontSize = '14px';
    submit.style.transition = 'all 0.2s ease';
    submit.style.border = 'none';
    submit.style.cursor = 'pointer';
    submit.style.backgroundColor = 'var(--interactive-accent)';
    submit.style.color = 'var(--text-on-accent)';
    submit.style.fontFamily = 'var(--font-text)';
    
    // Button hover effect
    submit.onmouseenter = () => {
      submit.style.transform = 'translateY(-1px)';
      submit.style.boxShadow = '0 2px 8px rgba(var(--interactive-accent-rgb), 0.3)';
    };
    submit.onmouseleave = () => {
      submit.style.transform = 'translateY(0)';
      submit.style.boxShadow = 'none';
    };
    
    submit.onclick = () => {
      const data: ReferenceData = {
        type: this.typeSelect.value,
        title: this.titleInput.value.trim(),
        url: this.urlInput.value.trim(),
        status: statusSelect.value,
        stars: this.currentRating,
      };
      if (this.editLine != null) {
        this.replaceLine(this.editLine, data);
      } else {
        this.insertLine(data);
      }
      this.close();
    };
  }

  private setupObsidianNoteDetection() {
    // Update placeholder and behavior based on type selection
    this.typeSelect.onchange = () => {
      // Clear any existing event handlers first
      this.urlInput.oninput = null;
      this.urlInput.onfocus = null;
      this.urlInput.onblur = null;
      this.titleInput.oninput = null;
      this.titleInput.onfocus = null;
      this.titleInput.onblur = null;
      
      if (this.typeSelect.value === 'plain-note') {
        this.urlInput.placeholder = '📄 Note path (auto-filled)';
        this.urlInput.readOnly = true;
        this.urlInput.style.backgroundColor = 'var(--background-secondary)';
        
        // Set up title field for suggestions
        this.titleInput.placeholder = '📄 Start typing note name...';
        this.titleInput.oninput = () => this.showTitleSuggestions();
        this.titleInput.onfocus = () => this.showTitleSuggestions();
        this.titleInput.onblur = () => {
          // Keep focus styles but don't hide suggestions immediately
          setTimeout(() => this.hideTitleSuggestions(), 200);
        };
      } else if (this.typeSelect.value === 'video') {
        this.urlInput.placeholder = '🎥 Video URL';
        this.urlInput.readOnly = false;
        this.urlInput.style.backgroundColor = 'var(--background-primary)';
        this.urlInput.oninput = () => this.setupUrlTypeDetection();
      } else if (this.typeSelect.value === 'repository') {
        this.urlInput.placeholder = '💻 Repository URL';
        this.urlInput.readOnly = false;
        this.urlInput.style.backgroundColor = 'var(--background-primary)';
        this.urlInput.oninput = () => this.setupUrlTypeDetection();
      } else if (this.typeSelect.value === 'course') {
        this.urlInput.placeholder = '🎓 Course URL';
        this.urlInput.readOnly = false;
        this.urlInput.style.backgroundColor = 'var(--background-primary)';
        this.urlInput.oninput = () => this.setupUrlTypeDetection();
      } else if (this.typeSelect.value === 'textbook') {
        this.urlInput.placeholder = '📚 Book URL';
        this.urlInput.readOnly = false;
        this.urlInput.style.backgroundColor = 'var(--background-primary)';
        this.urlInput.oninput = () => this.setupUrlTypeDetection();
      } else {
        this.urlInput.placeholder = '🌐 Website URL';
        this.urlInput.readOnly = false;
        this.urlInput.style.backgroundColor = 'var(--background-primary)';
        this.urlInput.oninput = () => this.setupUrlTypeDetection();
      }
      
      if (this.typeSelect.value !== 'plain-note') {
        this.hideSuggestions();
        this.hideTitleSuggestions();
      }

      // When type changes, show/hide URL field
      if (this.typeSelect.value === 'plain-note') {
        this.urlInput.style.display = 'none';
      } else {
        this.urlInput.style.display = '';
      }
    };

    // Initial setup
    if (this.typeSelect.value === 'plain-note') {
      this.urlInput.placeholder = '📄 Note path (auto-filled)';
      this.urlInput.readOnly = true;
      this.urlInput.style.backgroundColor = 'var(--background-secondary)';
      
      // Set up title field for suggestions
      this.titleInput.placeholder = '📄 Start typing note name...';
      this.titleInput.oninput = () => this.showTitleSuggestions();
      this.titleInput.onfocus = () => this.showTitleSuggestions();
      this.titleInput.onblur = () => {
        // Keep focus styles but don't hide suggestions immediately
        setTimeout(() => this.hideTitleSuggestions(), 200);
      };
    } else {
      this.urlInput.readOnly = false;
      this.urlInput.style.backgroundColor = 'var(--background-primary)';
      this.urlInput.oninput = () => this.setupUrlTypeDetection();
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.urlInput.contains(e.target as Node) && !this.suggestionsContainer.contains(e.target as Node)) {
        this.hideSuggestions();
      }
      if (!this.titleInput.contains(e.target as Node) && !this.titleSuggestionsContainer.contains(e.target as Node)) {
        this.hideTitleSuggestions();
      }
    });
  }

  private setupUrlTypeDetection() {
    const url = this.urlInput.value.toLowerCase();
    
    // Auto-detect type based on URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      if (this.typeSelect.value !== 'video') {
        this.typeSelect.value = 'video';
        this.typeSelect.dispatchEvent(new Event('change'));
      }
    } else if (url.includes('github.com') || url.includes('gitlab.com') || url.includes('bitbucket.org')) {
      if (this.typeSelect.value !== 'repository') {
        this.typeSelect.value = 'repository';
        this.typeSelect.dispatchEvent(new Event('change'));
      }
    } else if (url.includes('udemy.com') || url.includes('coursera.org') || url.includes('edx.org') || url.includes('skillshare.com')) {
      if (this.typeSelect.value !== 'course') {
        this.typeSelect.value = 'course';
        this.typeSelect.dispatchEvent(new Event('change'));
      }
    } else if (url.includes('amazon.com') || url.includes('goodreads.com') || url.includes('books.google.com')) {
      if (this.typeSelect.value !== 'textbook') {
        this.typeSelect.value = 'textbook';
        this.typeSelect.dispatchEvent(new Event('change'));
      }
    } else if (url.startsWith('http') && !url.includes('youtube') && !url.includes('github') && !url.includes('udemy')) {
      if (this.typeSelect.value !== 'web-page') {
        this.typeSelect.value = 'web-page';
        this.typeSelect.dispatchEvent(new Event('change'));
      }
    }
  }

  private showNoteSuggestions() {
    const query = this.urlInput.value.toLowerCase().trim();
    
    // Don't show suggestions if type is not plain-note
    if (this.typeSelect.value !== 'plain-note') {
      this.hideSuggestions();
      return;
    }
    
    // Show suggestions even with empty query to help user discover files
    if (query === '') {
      this.showAllNoteSuggestions();
      return;
    }

    // Get all markdown files from the vault
    const files = this.app.vault.getMarkdownFiles();
    const suggestions = files
      .filter(file => {
        const name = file.basename.toLowerCase();
        const path = file.path.toLowerCase();
        return name.includes(query) || path.includes(query);
      })
      .sort((a, b) => {
        // Prioritize exact matches and matches at the beginning
        const aName = a.basename.toLowerCase();
        const bName = b.basename.toLowerCase();
        
        const aExact = aName === query;
        const bExact = bName === query;
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return aName.localeCompare(bName);
      })
      .slice(0, 8); // Limit to 8 suggestions to prevent menu size changes

    this.displaySuggestions(suggestions);
  }

  private showAllNoteSuggestions() {
    const files = this.app.vault.getMarkdownFiles();
    const suggestions = files.slice(0, 6); // Show fewer suggestions for empty query
    this.displaySuggestions(suggestions);
  }

  private displaySuggestions(suggestions: any[]) {
    this.suggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    suggestions.forEach(file => {
      const suggestion = this.suggestionsContainer.createEl('div');
      suggestion.style.padding = '12px 16px';
      suggestion.style.cursor = 'pointer';
      suggestion.style.borderBottom = '1px solid var(--background-modifier-border)';
      suggestion.style.fontSize = '14px';
      suggestion.style.transition = 'background-color 0.2s ease';
      suggestion.style.minHeight = '44px';
      suggestion.style.display = 'flex';
      suggestion.style.flexDirection = 'column';
      suggestion.style.justifyContent = 'center';
      
      const fileName = suggestion.createEl('div', { text: file.basename });
      fileName.style.fontWeight = '600';
      fileName.style.color = 'var(--text-normal)';
      fileName.style.lineHeight = '1.3';
      
      const filePath = suggestion.createEl('div', { text: file.path });
      filePath.style.fontSize = '12px';
      filePath.style.color = 'var(--text-muted)';
      filePath.style.marginTop = '2px';
      filePath.style.lineHeight = '1.2';

      suggestion.onclick = () => {
        this.urlInput.value = file.path;
        this.titleInput.value = file.basename;
        this.hideSuggestions();
      };

      suggestion.onmouseenter = () => {
        suggestion.style.backgroundColor = 'var(--background-secondary)';
      };

      suggestion.onmouseleave = () => {
        suggestion.style.backgroundColor = 'var(--background-primary)';
      };
    });

    this.suggestionsContainer.style.display = 'block';
  }

  private hideSuggestions() {
    this.suggestionsContainer.style.display = 'none';
  }

  private showTitleSuggestions() {
    const query = this.titleInput.value.toLowerCase().trim();
    
    // Don't show suggestions if type is not plain-note
    if (this.typeSelect.value !== 'plain-note') {
      this.hideTitleSuggestions();
      return;
    }
    
    // Show suggestions even with empty query to help user discover files
    if (query === '') {
      this.showAllTitleSuggestions();
      return;
    }

    // Get all markdown files from the vault
    const files = this.app.vault.getMarkdownFiles();
    const suggestions = files
      .filter(file => {
        const name = file.basename.toLowerCase();
        return name.includes(query);
      })
      .sort((a, b) => {
        const aName = a.basename.toLowerCase();
        const bName = b.basename.toLowerCase();
        
        const aExact = aName === query;
        const bExact = bName === query;
        const aStarts = aName.startsWith(query);
        const bStarts = bName.startsWith(query);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return aName.localeCompare(bName);
      })
      .slice(0, 8); // Limit to 8 suggestions to prevent menu size changes

    this.displayTitleSuggestions(suggestions);
  }

  private showAllTitleSuggestions() {
    const files = this.app.vault.getMarkdownFiles();
    const suggestions = files.slice(0, 6); // Show fewer suggestions for empty query
    this.displayTitleSuggestions(suggestions);
  }

  private displayTitleSuggestions(suggestions: any[]) {
    this.titleSuggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
      this.hideTitleSuggestions();
      return;
    }

    suggestions.forEach(file => {
      const suggestion = this.titleSuggestionsContainer.createEl('div');
      suggestion.style.padding = '12px 16px';
      suggestion.style.cursor = 'pointer';
      suggestion.style.borderBottom = '1px solid var(--background-modifier-border)';
      suggestion.style.fontSize = '14px';
      suggestion.style.transition = 'background-color 0.2s ease';
      suggestion.style.minHeight = '44px';
      suggestion.style.display = 'flex';
      suggestion.style.flexDirection = 'column';
      suggestion.style.justifyContent = 'center';
      
      const fileName = suggestion.createEl('div', { text: file.basename });
      fileName.style.fontWeight = '600';
      fileName.style.color = 'var(--text-normal)';
      fileName.style.lineHeight = '1.3';
      
      const filePath = suggestion.createEl('div', { text: file.path });
      filePath.style.fontSize = '12px';
      filePath.style.color = 'var(--text-muted)';
      filePath.style.marginTop = '2px';
      filePath.style.lineHeight = '1.2';

      suggestion.onclick = () => {
        this.titleInput.value = file.basename;
        this.urlInput.value = file.path;
        this.hideTitleSuggestions();
      };

      suggestion.onmouseenter = () => {
        suggestion.style.backgroundColor = 'var(--background-secondary)';
      };

      suggestion.onmouseleave = () => {
        suggestion.style.backgroundColor = 'var(--background-primary)';
      };
    });

    this.titleSuggestionsContainer.style.display = 'block';
  }

  private hideTitleSuggestions() {
    this.titleSuggestionsContainer.style.display = 'none';
  }

  private updateStarDisplay(stars: HTMLElement[], ratingText: HTMLElement, hoverRating?: number) {
    const rating = hoverRating !== undefined ? hoverRating : this.currentRating;
    
    stars.forEach((star, index) => {
      if (index < rating) {
        star.textContent = '★';
        star.style.color = '#ffd700'; // Gold color for filled stars
        star.style.transform = 'scale(1.1)';
      } else {
        star.textContent = '☆';
        star.style.color = '#ccc'; // Gray color for empty stars
        star.style.transform = 'scale(1)';
      }
    });
    
    // Update rating text
    if (rating === 0) {
      ratingText.textContent = 'Not Rated';
    } else {
      ratingText.textContent = `${rating}/5`;
    }
  }

  private starString(n: number) {
    return n === 0 ? '⚪ Not Rated' : '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  private buildLine(data: ReferenceData) {
    const typeInfo = getTypeInfo(data.type);
    const statusInfo = getStatusInfo(data.status);
    
    // Handle Obsidian note links differently
    let link: string;
    if (data.type === 'plain-note' && data.url) {
      // Check if the file exists
      const file = this.app.vault.getAbstractFileByPath(data.url);
      if (file instanceof TFile) {
        // Use Obsidian's internal link format for graph view visibility
        // Remove .md extension if present for cleaner links
        const linkPath = data.url.replace(/\.md$/, '');
        const noteName = file.basename;
        if (data.title.trim() === noteName) {
          link = `[[${linkPath}]]`;
        } else {
          link = `[[${linkPath}|${data.title}]]`;
        }
      } else {
        // Fallback to markdown link if file doesn't exist
        link = `[${data.title}](${data.url})`;
      }
    } else {
      link = data.url ? `[${data.title}](${data.url})` : data.title;
    }
    // Output: first line is the reference, second line is the details
    return `### ${link}\n${typeInfo.icon} ${typeInfo.label} | ${statusInfo.icon} **${statusInfo.label}** | ${this.starString(data.stars)}`;
  }

  private insertLine(data: ReferenceData) {
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
      // Also skip the next line (details) if it exists and is not a reference
      if (insertPos < lines.length && !lines[insertPos].startsWith('###') && lines[insertPos].trim() !== '') {
        insertPos++;
      }
    }
    const refLines = this.buildLine(data).split('\n');
    lines.splice(insertPos, 0, ...refLines);
    editor.setValue(lines.join('\n'));
    new Notice('Reference added.');
  }

  private replaceLine(lineNum: number, data: ReferenceData) {
    const editor = this.editor;
    const refLines = this.buildLine(data).split('\n');
    // Replace the reference line and the details line
    editor.setLine(lineNum, refLines[0]);
    if (refLines.length > 1) {
      if (editor.getLine(lineNum + 1) && !editor.getLine(lineNum + 1).startsWith('###')) {
        editor.setLine(lineNum + 1, refLines[1]);
      } else {
        editor.replaceRange('\n' + refLines[1], { line: lineNum, ch: Number.MAX_SAFE_INTEGER });
      }
    }
    new Notice('Reference updated.');
  }
}