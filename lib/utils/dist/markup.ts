interface ParseResult {
  html: string;
  metadata: {
    images: Array<{ src: string; alt: string }>;
    videos: string[];
    links: string[];
    headings: Array<{ level: number; text: string; id: string }>;
    footnotes: Array<{ id: string; text: string }>;
    templates: Array<{ name: string; params: Record<string, string> }>;
  };
  styles: string;
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
}

interface EditorCommand {
  name: string;
  execute: (selection: string, ...args: any[]) => string;
}

interface ListNode {
  type: 'ul' | 'ol' | 'dl';
  level: number;
  items: Array<{ content: string; children?: ListNode[] }>;
}

// Default CSS styles for parsed content
const DEFAULT_STYLES = `
/* Base Styles */
.markup-content {
  font-size: 16px;
  line-height: 1.6;
  color: #202122;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* Headings */
.markup-content h1, .markup-content h2, .markup-content h3, 
.markup-content h4, .markup-content h5, .markup-content h6 {
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #000;
  border: 0;
  overflow-wrap: break-word;
}

.markup-content h1 { font-size: 2em; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.25em; }
.markup-content h2 { font-size: 1.7em; border-bottom: 1px solid #a2a9b1; padding-bottom: 0.25em; }
.markup-content h3 { font-size: 1.4em; }
.markup-content h4 { font-size: 1.2em; }
.markup-content h5 { font-size: 1.1em; }
.markup-content h6 { font-size: 1em; font-weight: bold; }

/* Paragraphs */
.markup-content p {
  margin: 0.5em 0 1em 0;
}

/* Links */
.markup-content a {
  color: #0645ad;
  text-decoration: none;
}

.markup-content a:hover {
  text-decoration: underline;
}

.markup-content a:visited {
  color: #0b0080;
}

.markup-content a.external::after {
  content: "↗";
  font-size: 0.8em;
  margin-left: 0.2em;
  opacity: 0.6;
}

.markup-content a.internal {
  color: #0645ad;
}

/* Inline Formatting */
.markup-content strong {
  font-weight: 700;
}

.markup-content em {
  font-style: italic;
}

.markup-content del {
  text-decoration: line-through;
}

.markup-content ins {
  text-decoration: underline;
  text-decoration-color: #202122;
}

.markup-content sup {
  font-size: 0.75em;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
  top: -0.5em;
}

.markup-content sub {
  font-size: 0.75em;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
  bottom: -0.25em;
}

.markup-content small {
  font-size: 0.85em;
}

/* Code */
.markup-content .inline-code {
  background-color: #f8f9fa;
  border: 1px solid #eaecf0;
  border-radius: 2px;
  padding: 1px 4px;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
}

.markup-content .code-block {
  background-color: #f8f9fa;
  border: 1px solid #eaecf0;
  border-radius: 4px;
  padding: 12px 16px;
  margin: 1em 0;
  overflow-x: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
  line-height: 1.4;
}

/* Lists */
.markup-content ul, .markup-content ol {
  margin: 0.5em 0 1em 0;
  padding-left: 1.6em;
}

.markup-content dl {
  margin: 1em 0;
}

.markup-content dt {
  font-weight: bold;
  margin-top: 0.5em;
}

.markup-content dd {
  margin-left: 1.6em;
  margin-bottom: 0.5em;
}

.markup-content li {
  margin: 0.3em 0;
}

/* Tables */
.markup-content .wikitable {
  background-color: #f8f9fa;
  border: 1px solid #a2a9b1;
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

.markup-content .wikitable caption {
  font-weight: bold;
  padding: 8px;
  background-color: #eaecf0;
}

.markup-content .wikitable th {
  background-color: #eaecf0;
  border: 1px solid #a2a9b1;
  padding: 8px;
  font-weight: bold;
  text-align: left;
}

.markup-content .wikitable td {
  border: 1px solid #a2a9b1;
  padding: 8px;
}

/* Images and Media */
.markup-content .media-image {
  max-width: 100%;
  height: auto;
  display: inline-block;
  vertical-align: middle;
}

.markup-content .thumb {
  background-color: #f8f9fa;
  border: 1px solid #c8ccd1;
  padding: 4px;
  margin: 0.5em 0 1em 1em;
  display: inline-block;
  max-width: 100%;
}

.markup-content .thumb.thumb-left {
  float: left;
  margin-right: 1.4em;
  margin-left: 0;
}

.markup-content .thumb.thumb-right {
  float: right;
  margin-left: 1.4em;
  margin-right: 0;
}

.markup-content .thumb.thumb-center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  float: none;
}

.markup-content figcaption {
  padding: 6px;
  font-size: 0.9em;
  color: #54595d;
  text-align: left;
}

/* Math */
.markup-content .math-inline {
  font-family: "Latin Modern Math", "STIX Two Math", "Cambria Math", serif;
  font-style: italic;
  padding: 0 2px;
}

/* Horizontal Rule */
.markup-content hr {
  border: 0;
  border-top: 1px solid #a2a9b1;
  margin: 1.5em 0;
}

/* References */
.markup-content .reference {
  font-size: 0.8em;
  line-height: 1;
}

.markup-content .reflist {
  background-color: #f8f9fa;
  border: 1px solid #a2a9b1;
  padding: 16px;
  margin: 2em 0;
  font-size: 0.9em;
}

.markup-content .reflist h2 {
  font-size: 1.3em;
  margin-top: 0;
  border: none;
}

/* Table of Contents */
.markup-content .toc {
  background-color: #f8f9fa;
  border: 1px solid #a2a9b1;
  padding: 12px 16px;
  margin: 1em 0 2em 0;
  display: inline-block;
  min-width: 200px;
}

.markup-content .toc-title {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 8px;
  text-align: center;
}

.markup-content .toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.markup-content .toc li {
  margin: 4px 0;
}

.markup-content .toc-level-2 {
  padding-left: 1em;
}

.markup-content .toc-level-3 {
  padding-left: 2em;
}

/* Templates */
.markup-content .template {
  background-color: #f8f9fa;
  border: 1px solid #c8ccd1;
  border-left: 4px solid #54595d;
  padding: 12px;
  margin: 1em 0;
  font-size: 0.9em;
}

/* Accessibility */
.markup-content :focus {
  outline: 2px solid #36c;
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .markup-content {
    padding: 12px;
    font-size: 14px;
  }
  
  .markup-content .thumb {
    float: none !important;
    margin: 1em auto !important;
    display: block;
  }
}

@media print {
  .markup-content a {
    color: #000;
    text-decoration: underline;
  }
}
`;

// Utility Functions
class MarkupUtils {
  static escapeHtml(str: string): string {
    return str.replace(/[&<>"'`]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    }[tag] || tag));
  }

  static unescapeHtml(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#96;/g, '`');
  }

  static generateAnchorId(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u00C0-\u024F_-]/g, '');
  }

  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static validateLanguage(lang: string): string {
    const validLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'ruby', 'go', 'rust', 'php', 'html', 'css', 'sql', 'bash', 'typescript', 'json', 'xml', 'yaml', 'text'];
    return validLanguages.includes(lang.toLowerCase()) ? lang.toLowerCase() : 'text';
  }

  static stripMarkup(text: string): string {
    let plain = text;
    plain = plain.replace(/<!--[\s\S]*?-->/g, '');
    plain = plain.replace(/\{\{[^}]+\}\}/g, '');
    plain = plain.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
    plain = plain.replace(/<ref[^>]*\/>/g, '');
    plain = plain.replace(/<syntaxhighlight[^>]*>[\s\S]*?<\/syntaxhighlight>/gi, '');
    plain = plain.replace(/<source[^>]*>[\s\S]*?<\/source>/gi, '');
    plain = plain.replace(/\[\[File:[^\]]+\]\]/gi, '');
    plain = plain.replace(/\[\[Media:[^\]]+\]\]/gi, '');
    plain = plain.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
    plain = plain.replace(/\[\[([^\]]+)\]\]/g, '$1');
    plain = plain.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2');
    plain = plain.replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1');
    plain = plain.replace(/'''''(.+?)'''''/g, '$1');
    plain = plain.replace(/'''(.+?)'''/g, '$1');
    plain = plain.replace(/''(.+?)''/g, '$1');
    plain = plain.replace(/<[^>]+>/g, '');
    plain = plain.replace(/^={1,6}\s*(.+?)\s*={1,6}$/gm, '$1');
    plain = plain.replace(/^[\*#:;]+\s*/gm, '');
    plain = plain.replace(/^----+$/gm, '');
    return plain.trim();
  }

  static countWords(text: string): number {
    const plain = this.stripMarkup(text);
    return plain.split(/\s+/).filter(word => word.length > 0).length;
  }
}

// Main Parser Class
class WikiMarkupParser {
  private html: string;
  private metadata: ParseResult['metadata'];
  private errors: ParseResult['errors'];
  private placeholders: Map<string, string>;

  constructor(private text: string) {
    this.html = text;
    this.metadata = {
      images: [],
      videos: [],
      links: [],
      headings: [],
      footnotes: [],
      templates: []
    };
    this.errors = [];
    this.placeholders = new Map();
  }

  parse(): ParseResult {
    try {
      this.removeComments();
      this.processTemplates();
      this.processCodeBlocks();
      this.processInlineCode();
      this.processMath();
      this.processInlineFormatting();
      this.processHeadings();
      this.processTables();
      this.processMedia();
      this.processHorizontalRules();
      this.processLists();
      this.processLinks();
      this.processReferences();
      this.processSpecialCharacters();
      this.restorePlaceholders();
      this.processParagraphs();
      this.generateTableOfContents();
      this.generateReferencesSection();
      this.wrapContent();
      
      return {
        html: this.html,
        metadata: this.metadata,
        styles: DEFAULT_STYLES,
        errors: this.errors
      };
    } catch (error) {
      this.errors.push({
        line: 0,
        message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
      return {
        html: `<div class="markup-content"><p>Error parsing markup</p></div>`,
        metadata: this.metadata,
        styles: DEFAULT_STYLES,
        errors: this.errors
      };
    }
  }

  private addPlaceholder(key: string, value: string): string {
    this.placeholders.set(key, value);
    return key;
  }

  private removeComments(): void {
    this.html = this.html.replace(/<!--[\s\S]*?-->/g, '');
  }

  private processTemplates(): void {
    this.html = this.html.replace(/\{\{([^|}\n]+)(?:\|([^}]+))?\}\}/g, (m, name, params) => {
      const templateName = name.trim();
      const templateParams: Record<string, string> = {};
      
      if (params) {
        params.split('|').forEach((param: string, idx: number) => {
          const trimmed = param.trim();
          if (trimmed.includes('=')) {
            const [key, ...valParts] = trimmed.split('=');
            templateParams[key.trim()] = valParts.join('=').trim();
          } else {
            templateParams[idx.toString()] = trimmed;
          }
        });
      }
      
      this.metadata.templates.push({ name: templateName, params: templateParams });
      
      if (templateName.toLowerCase() === 'reflist') {
        return this.addPlaceholder('__REFLIST__', '<div class="reflist-placeholder"></div>');
      }
      
      const paramStr = Object.entries(templateParams)
        .map(([k, v]) => `${MarkupUtils.escapeHtml(k)}: ${MarkupUtils.escapeHtml(v)}`)
        .join(', ');
      
      return this.addPlaceholder(
        `__TEMPLATE_${this.placeholders.size}__`,
        `<div class="template" data-template="${MarkupUtils.escapeHtml(templateName)}">${paramStr}</div>`
      );
    });
  }

  private processCodeBlocks(): void {
    // <syntaxhighlight lang="python">code</syntaxhighlight>
    this.html = this.html.replace(/<syntaxhighlight(?:\s+lang="(\w+)")?\s*>([\s\S]*?)<\/syntaxhighlight>/gi, (m, lang, code) => {
      const validLang = MarkupUtils.validateLanguage(lang || 'text');
      const placeholder = `__CODE_BLOCK_${this.placeholders.size}__`;
      return this.addPlaceholder(
        placeholder,
        `<pre class="code-block language-${validLang}"><code>${MarkupUtils.escapeHtml(code.trim())}</code></pre>`
      );
    });
    
    // <source lang="python">code</source>
    this.html = this.html.replace(/<source(?:\s+lang="(\w+)")?\s*>([\s\S]*?)<\/source>/gi, (m, lang, code) => {
      const validLang = MarkupUtils.validateLanguage(lang || 'text');
      const placeholder = `__CODE_BLOCK_${this.placeholders.size}__`;
      return this.addPlaceholder(
        placeholder,
        `<pre class="code-block language-${validLang}"><code>${MarkupUtils.escapeHtml(code.trim())}</code></pre>`
      );
    });
  }

  private processInlineCode(): void {
    this.html = this.html.replace(/<code>([^<]+)<\/code>/g, (m, code) => {
      const placeholder = `__INLINE_CODE_${this.placeholders.size}__`;
      return this.addPlaceholder(
        placeholder,
        `<code class="inline-code">${MarkupUtils.escapeHtml(code)}</code>`
      );
    });
  }

  private processMath(): void {
    this.html = this.html.replace(/<math>([\s\S]+?)<\/math>/g, (m, tex) => {
      const placeholder = `__MATH_${this.placeholders.size}__`;
      return this.addPlaceholder(
        placeholder,
        `<span class="math-inline" data-tex="${MarkupUtils.escapeHtml(tex.trim())}">${MarkupUtils.escapeHtml(tex.trim())}</span>`
      );
    });
  }

  private processInlineFormatting(): void {
    // '''''bold italic'''''
    this.html = this.html.replace(/'''''(.+?)'''''/g, '<strong><em>$1</em></strong>');
    // '''bold'''
    this.html = this.html.replace(/'''(.+?)'''/g, '<strong>$1</strong>');
    // ''italic''
    this.html = this.html.replace(/''(.+?)''/g, '<em>$1</em>');
    // <s>strikethrough</s>
    this.html = this.html.replace(/<s>(.+?)<\/s>/g, '<del>$1</del>');
    // <u>underline</u>
    this.html = this.html.replace(/<u>(.+?)<\/u>/g, '<ins>$1</ins>');
  }

  private processHeadings(): void {
    const headingPattern = /^(={1,6})\s*(.+?)\s*\1\s*$/gm;
    
    this.html = this.html.replace(headingPattern, (m, equals, text) => {
      const level = equals.length;
      const trimmedText = text.trim();
      const anchorId = MarkupUtils.generateAnchorId(trimmedText);
      
      this.metadata.headings.push({ level, text: trimmedText, id: anchorId });
      
      return `<h${level} id="${anchorId}">${trimmedText}</h${level}>`;
    });
  }

  private processTables(): void {
    this.html = this.html.replace(/\{\|([^\n]*)\n([\s\S]*?)\n\|\}/gm, (m, tableAttrs, content) => {
      let caption = '';
      let headers: string[] = [];
      const rows: string[][] = [];
      let currentRow: string[] = [];
      
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('|+')) {
          caption = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('!')) {
          const headerContent = trimmed.substring(1).trim();
          headers = headerContent.split(/\s*!!\s*/).map(h => h.trim());
        } else if (trimmed === '|-') {
          if (currentRow.length > 0) {
            rows.push([...currentRow]);
            currentRow = [];
          }
        } else if (trimmed.startsWith('|') && !trimmed.startsWith('|+') && !trimmed.startsWith('|}')) {
          const cellContent = trimmed.substring(1).trim();
          const cells = cellContent.split(/\s*\|\|\s*/).map(c => c.trim());
          currentRow.push(...cells);
        }
      }
      
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      
      let tableHtml = `<table class="wikitable ${MarkupUtils.escapeHtml(tableAttrs.trim())}">`;
      
      if (caption) {
        tableHtml += `<caption>${MarkupUtils.escapeHtml(caption)}</caption>`;
      }
      
      if (headers.length > 0) {
        tableHtml += '<thead><tr>';
        tableHtml += headers.map(h => `<th scope="col">${MarkupUtils.escapeHtml(h)}</th>`).join('');
        tableHtml += '</tr></thead>';
      }
      
      if (rows.length > 0) {
        tableHtml += '<tbody>';
        for (const row of rows) {
          tableHtml += '<tr>';
          tableHtml += row.map(cell => `<td>${MarkupUtils.escapeHtml(cell)}</td>`).join('');
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody>';
      }
      
      tableHtml += '</table>';
      return tableHtml;
    });
  }

  private processMedia(): void {
    // [[File:image.jpg|thumb|Caption]]
    this.html = this.html.replace(/\[\[File:([^|\]]+)(?:\|([^\]]+))?\]\]/gi, (m, filename, options) => {
      let caption = '';
      let align = '';
      let isThumb = false;
      let size = '';
      let isDecorative = false;
      
      if (options) {
        const parts = options.split('|').map(p => p.trim());
        for (const part of parts) {
          if (part === 'thumb' || part === 'thumbnail') {
            isThumb = true;
          } else if (part === 'left' || part === 'right' || part === 'center') {
            align = part;
          } else if (/^\d+px$/.test(part)) {
            size = part;
          } else if (part !== '') {
            caption = part;
          }
        }
      }
      
      isDecorative = !caption;
      this.metadata.images.push({ src: filename, alt: caption || filename });
      
      const sizeAttr = size ? ` width="${size.replace('px', '')}"` : '';
      const altText = isDecorative ? '' : MarkupUtils.escapeHtml(caption || filename);
      
      if (isThumb) {
        const alignClass = align ? ` thumb-${align}` : '';
        return `<figure class="thumb${alignClass}"><img src="${MarkupUtils.escapeHtml(filename)}" alt="${altText}"${sizeAttr} class="media-image" loading="lazy"><figcaption>${MarkupUtils.escapeHtml(caption)}</figcaption></figure>`;
      }
      
      return `<img src="${MarkupUtils.escapeHtml(filename)}" alt="${altText}"${sizeAttr} class="media-image" loading="lazy">`;
    });
    
    // [[Media:video.mp4]]
    this.html = this.html.replace(/\[\[Media:([^|\]]+\.(?:mp4|webm|ogv))(?:\|([^\]]+))?\]\]/gi, (m, filename, caption) => {
      this.metadata.videos.push(filename);
      return `<video src="${MarkupUtils.escapeHtml(filename)}" controls class="media-video">${caption ? `<p>${MarkupUtils.escapeHtml(caption)}</p>` : ''}</video>`;
    });
    
    // [[Media:audio.mp3]]
    this.html = this.html.replace(/\[\[Media:([^|\]]+\.(?:mp3|ogg|wav))(?:\|([^\]]+))?\]\]/gi, (m, filename, caption) => {
      return `<audio src="${MarkupUtils.escapeHtml(filename)}" controls class="media-audio">${caption ? `<p>${MarkupUtils.escapeHtml(caption)}</p>` : ''}</audio>`;
    });
  }

  private processHorizontalRules(): void {
    this.html = this.html.replace(/^----+$/gm, '<hr>');
  }

  private processLists(): void {
    const lines = this.html.split('\n');
    const result: string[] = [];
    const stack: Array<{ type: 'ul' | 'ol' | 'dl'; level: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([\*#:;]+)\s*(.*)$/);
      
      if (match) {
        const [, markers, content] = match;
        const level = markers.length;
        const lastMarker = markers[markers.length - 1];
        
        let listType: 'ul' | 'ol' | 'dl';
        if (lastMarker === '*') listType = 'ul';
        else if (lastMarker === '#') listType = 'ol';
        else listType = 'dl';
        
        // Close lists that are deeper or different type
        while (stack.length > 0 && (stack[stack.length - 1].level >= level || stack[stack.length - 1].type !== listType)) {
          const closed = stack.pop()!;
          result.push(`</${closed.type}>`);
        }
        
        // Open new list if needed
        if (stack.length === 0 || stack[stack.length - 1].level < level) {
          result.push(`<${listType}>`);
          stack.push({ type: listType, level });
        }
        
        // Add list item
        if (lastMarker === ';') {
          result.push(`<dt>${content}</dt>`);
        } else if (lastMarker === ':') {
          result.push(`<dd>${content}</dd>`);
        } else {
          result.push(`<li>${content}</li>`);
        }
      } else {
        // Close all open lists
        while (stack.length > 0) {
          const closed = stack.pop()!;
          result.push(`</${closed.type}>`);
        }
        result.push(line);
      }
    }
    
    // Close any remaining open lists
    while (stack.length > 0) {
      const closed = stack.pop()!;
      result.push(`</${closed.type}>`);
    }
    
    this.html = result.join('\n');
  }

  private processLinks(): void {
    // External: [http://example.com Link text]
    this.html = this.html.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g, (m, url, text) => {
      if (!MarkupUtils.isValidUrl(url)) {
        return m; // Return original if invalid URL
      }
      this.metadata.links.push(url);
      return `<a href="${MarkupUtils.escapeHtml(url)}" class="external" target="_blank" rel="noopener noreferrer">${MarkupUtils.escapeHtml(text || url)}</a>`;
    });
    
    // Internal: [[Page]] or [[Page|Display text]]
    this.html = this.html.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (m, page, text) => {
      const displayText = text || page;
      const pageUrl = page.replace(/\s+/g, '_');
      this.metadata.links.push(pageUrl);
      return `<a href="${MarkupUtils.escapeHtml(pageUrl)}" class="internal">${MarkupUtils.escapeHtml(displayText)}</a>`;
    });
  }

  private processReferences(): void {
    // <ref name="refname">Reference text</ref>
    this.html = this.html.replace(/<ref(?:\s+name="([^"]+)")?\s*>([\s\S]*?)<\/ref>/g, (m, name, text) => {
      const id = name || `ref-${this.metadata.footnotes.length + 1}`;
      const existingIndex = this.metadata.footnotes.findIndex(f => f.id === id);
      
      if (existingIndex === -1) {
        this.metadata.footnotes.push({ id, text: text.trim() });
        const idx = this.metadata.footnotes.length;
        return `<sup class="reference"><a href="#cite_note-${id}" id="cite_ref-${id}">[${idx}]</a></sup>`;
      } else {
        // Update existing reference text if provided
        if (text.trim()) {
          this.metadata.footnotes[existingIndex].text = text.trim();
        }
        return `<sup class="reference"><a href="#cite_note-${id}" id="cite_ref-${id}">[${existingIndex + 1}]</a></sup>`;
      }
    });
    
    // <ref name="refname" />
    this.html = this.html.replace(/<ref\s+name="([^"]+)"\s*\/>/g, (m, name) => {
      const idx = this.metadata.footnotes.findIndex(f => f.id === name);
      return idx !== -1 
        ? `<sup class="reference"><a href="#cite_note-${name}" id="cite_ref-${name}">[${idx + 1}]</a></sup>`
        : m;
    });
  }

  private processSpecialCharacters(): void {
    this.html = this.html.replace(/&mdash;/g, '—');
    this.html = this.html.replace(/&ndash;/g, '–');
    this.html = this.html.replace(/&hellip;/g, '…');
    this.html = this.html.replace(/&rarr;/g, '→');
    this.html = this.html.replace(/&larr;/g, '←');
    this.html = this.html.replace(/&copy;/g, '©');
    this.html = this.html.replace(/&reg;/g, '®');
    this.html = this.html.replace(/&trade;/g, '™');
  }

  private restorePlaceholders(): void {
    for (const [key, value] of this.placeholders) {
      this.html = this.html.replace(key, value);
    }
    this.placeholders.clear();
  }

  private processParagraphs(): void {
    this.html = this.html
      .split(/\n{2,}/)
      .map(para => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        // Don't wrap block-level elements
        if (trimmed.match(/^<(h[1-6]|table|pre|div|blockquote|hr|figure|ul|ol|dl|video|audio)/i)) {
          return trimmed;
        }
        return `<p>${trimmed}</p>`;
      })
      .join('\n');
  }

  private generateTableOfContents(): void {
    if (this.metadata.headings.length >= 3) {
      const toc = this.metadata.headings.map(h =>
        `<li class="toc-level-${h.level}"><a href="#${h.id}">${MarkupUtils.escapeHtml(h.text)}</a></li>`
      ).join('');
      this.html = `<div class="toc"><div class="toc-title">Contents</div><ul>${toc}</ul></div>\n${this.html}`;
    }
  }

  private generateReferencesSection(): void {
    if (this.metadata.footnotes.length) {
      const refHtml = this.metadata.footnotes.map((f, i) =>
        `<li id="cite_note-${f.id}"><a href="#cite_ref-${f.id}">↑</a> ${f.text}</li>`
      ).join('');
      
      const referencesHtml = `<div class="reflist"><h2>References</h2><ol>${refHtml}</ol></div>`;
      
      if (this.html.includes('__REFLIST__')) {
        this.html = this.html.replace('__REFLIST__', referencesHtml);
      } else if (this.html.includes('<div class="reflist-placeholder"></div>')) {
        this.html = this.html.replace('<div class="reflist-placeholder"></div>', referencesHtml);
      } else {
        this.html += `\n${referencesHtml}`;
      }
    }
  }

  private wrapContent(): void {
    this.html = `<div class="markup-content">${this.html}</div>`;
  }
}

// HTML to WikiText Converter
class HtmlToWikiTextConverter {
  private wikitext: string;

  constructor(private html: string) {
    this.wikitext = html;
  }

  convert(): string {
    try {
      // Remove markup-content wrapper
      this.wikitext = this.wikitext.replace(/<div class="markup-content">([\s\S]*)<\/div>/, '$1');
      
      // Process in reverse order of parsing
      this.convertReferences();
      this.convertToc();
      this.convertParagraphs();
      this.convertHorizontalRules();
      this.convertMedia();
      this.convertTables();
      this.convertHeadings();
      this.convertLists();
      this.convertLinks();
      this.convertInlineFormatting();
      this.convertCode();
      this.convertMath();
      this.convertTemplates();
      this.cleanupWhitespace();
      
      return this.wikitext;
    } catch (error) {
      throw new Error(`Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertReferences(): void {
    // Convert reference list
    this.wikitext = this.wikitext.replace(
      /<div class="reflist"><h2>References<\/h2><ol>([\s\S]*?)<\/ol><\/div>/g,
      '{{reflist}}'
    );
    
    // Convert individual references
    this.wikitext = this.wikitext.replace(
      /<li id="cite_note-([^"]+)"><a[^>]*>↑<\/a>\s*([\s\S]*?)<\/li>/g,
      '' // Remove reference items (they're regenerated from ref tags)
    );
    
    // Convert reference citations back to <ref> tags
    this.wikitext = this.wikitext.replace(
      /<sup class="reference"><a href="#cite_note-([^"]+)"[^>]*>\[(\d+)\]<\/a><\/sup>/g,
      '<ref name="$1" />'
    );
  }

  private convertToc(): void {
    this.wikitext = this.wikitext.replace(
      /<div class="toc">[\s\S]*?<\/div>/g,
      '' // TOC is auto-generated
    );
  }

  private convertParagraphs(): void {
    this.wikitext = this.wikitext.replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n');
  }

  private convertHorizontalRules(): void {
    this.wikitext = this.wikitext.replace(/<hr\s*\/?>/g, '----');
  }

  private convertMedia(): void {
    // Convert figures with captions
    this.wikitext = this.wikitext.replace(
      /<figure class="thumb(?:\s+thumb-(left|right|center))?"><img src="([^"]+)" alt="[^"]*"(?:\s+width="(\d+)")?\s+class="media-image"[^>]*><figcaption>([^<]*)<\/figcaption><\/figure>/g,
      (m, align, src, width, caption) => {
        const options = ['thumb'];
        if (align) options.push(align);
        if (width) options.push(`${width}px`);
        if (caption) options.push(caption);
        return `[[File:${src}|${options.join('|')}]]`;
      }
    );
    
    // Convert simple images
    this.wikitext = this.wikitext.replace(
      /<img src="([^"]+)" alt="[^"]*"(?:\s+width="(\d+)")?\s+class="media-image"[^>]*>/g,
      (m, src, width) => {
        if (width) {
          return `[[File:${src}|${width}px]]`;
        }
        return `[[File:${src}]]`;
      }
    );
    
    // Convert videos
    this.wikitext = this.wikitext.replace(
      /<video src="([^"]+)" controls class="media-video">(?:<p>([^<]*)<\/p>)?<\/video>/g,
      (m, src, caption) => caption ? `[[Media:${src}|${caption}]]` : `[[Media:${src}]]`
    );
    
    // Convert audio
    this.wikitext = this.wikitext.replace(
      /<audio src="([^"]+)" controls class="media-audio">(?:<p>([^<]*)<\/p>)?<\/audio>/g,
      (m, src, caption) => caption ? `[[Media:${src}|${caption}]]` : `[[Media:${src}]]`
    );
  }

  private convertTables(): void {
    this.wikitext = this.wikitext.replace(
      /<table class="wikitable([^"]*)">[\s\S]*?<\/table>/g,
      (match) => {
        let result = '{|' + match.match(/class="wikitable([^"]*)"/)![1] + '\n';
        
        // Extract caption
        const captionMatch = match.match(/<caption>([^<]*)<\/caption>/);
        if (captionMatch) {
          result += `|+ ${MarkupUtils.unescapeHtml(captionMatch[1])}\n`;
        }
        
        // Extract headers
        const headersMatch = match.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/);
        if (headersMatch) {
          const headers = headersMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/g);
          if (headers) {
            const headerTexts = headers.map(h => MarkupUtils.unescapeHtml(h.replace(/<\/?th[^>]*>/g, '')));
            result += `! ${headerTexts.join(' !! ')}\n`;
          }
        }
        
        // Extract rows
        const bodyMatch = match.match(/<tbody>([\s\S]*?)<\/tbody>/);
        if (bodyMatch) {
          const rows = bodyMatch[1].match(/<tr>([\s\S]*?)<\/tr>/g);
          if (rows) {
            rows.forEach(row => {
              result += '|-\n';
              const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
              if (cells) {
                const cellTexts = cells.map(c => MarkupUtils.unescapeHtml(c.replace(/<\/?td[^>]*>/g, '')));
                result += `| ${cellTexts.join(' || ')}\n`;
              }
            });
          }
        }
        
        result += '|}';
        return result;
      }
    );
  }

  private convertHeadings(): void {
    for (let i = 6; i >= 1; i--) {
      const pattern = new RegExp(`<h${i}[^>]*>([^<]*)<\/h${i}>`, 'g');
      const equals = '='.repeat(i);
      this.wikitext = this.wikitext.replace(pattern, `${equals} $1 ${equals}`);
    }
  }

  private convertLists(): void {
    // Convert unordered lists
    this.wikitext = this.wikitext.replace(/<ul>\s*<li>([\s\S]*?)<\/li>\s*<\/ul>/g, (match) => {
      const items = match.match(/<li>([^<]*)<\/li>/g);
      if (items) {
        return items.map(item => `* ${item.replace(/<\/?li>/g, '')}`).join('\n') + '\n';
      }
      return match;
    });
    
    // Convert ordered lists
    this.wikitext = this.wikitext.replace(/<ol>\s*<li>([\s\S]*?)<\/li>\s*<\/ol>/g, (match) => {
      const items = match.match(/<li>([^<]*)<\/li>/g);
      if (items) {
        return items.map(item => `# ${item.replace(/<\/?li>/g, '')}`).join('\n') + '\n';
      }
      return match;
    });
    
    // Convert definition lists
    this.wikitext = this.wikitext.replace(/<dl>([\s\S]*?)<\/dl>/g, (match) => {
      let result = '';
      const dtMatches = match.match(/<dt>([^<]*)<\/dt>/g);
      const ddMatches = match.match(/<dd>([^<]*)<\/dd>/g);
      
      if (dtMatches && ddMatches) {
        const minLength = Math.min(dtMatches.length, ddMatches.length);
        for (let i = 0; i < minLength; i++) {
          const term = dtMatches[i].replace(/<\/?dt>/g, '');
          const desc = ddMatches[i].replace(/<\/?dd>/g, '');
          result += `; ${term}\n: ${desc}\n`;
        }
      }
      return result;
    });
  }

  private convertLinks(): void {
    // Convert external links
    this.wikitext = this.wikitext.replace(
      /<a href="([^"]+)" class="external"[^>]*>([^<]*)<\/a>/g,
      (m, url, text) => {
        const unescapedUrl = MarkupUtils.unescapeHtml(url);
        const unescapedText = MarkupUtils.unescapeHtml(text);
        return unescapedText === unescapedUrl ? `[${unescapedUrl}]` : `[${unescapedUrl} ${unescapedText}]`;
      }
    );
    
    // Convert internal links
    this.wikitext = this.wikitext.replace(
      /<a href="([^"]+)" class="internal">([^<]*)<\/a>/g,
      (m, page, text) => {
        const unescapedPage = MarkupUtils.unescapeHtml(page);
        const unescapedText = MarkupUtils.unescapeHtml(text);
        return unescapedText === unescapedPage ? `[[${unescapedPage}]]` : `[[${unescapedPage}|${unescapedText}]]`;
      }
    );
  }

  private convertInlineFormatting(): void {
    // Convert bold italic
    this.wikitext = this.wikitext.replace(/<strong><em>([^<]*)<\/em><\/strong>/g, "'''''$1'''''");
    this.wikitext = this.wikitext.replace(/<em><strong>([^<]*)<\/strong><\/em>/g, "'''''$1'''''");
    
    // Convert bold
    this.wikitext = this.wikitext.replace(/<strong>([^<]*)<\/strong>/g, "'''$1'''");
    
    // Convert italic
    this.wikitext = this.wikitext.replace(/<em>([^<]*)<\/em>/g, "''$1''");
    
    // Convert strikethrough
    this.wikitext = this.wikitext.replace(/<del>([^<]*)<\/del>/g, '<s>$1</s>');
    
    // Convert underline
    this.wikitext = this.wikitext.replace(/<ins>([^<]*)<\/ins>/g, '<u>$1</u>');
    
    // Convert superscript
    this.wikitext = this.wikitext.replace(/<sup>([^<]*)<\/sup>/g, '<sup>$1</sup>');
    
    // Convert subscript
    this.wikitext = this.wikitext.replace(/<sub>([^<]*)<\/sub>/g, '<sub>$1</sub>');
    
    // Convert small
    this.wikitext = this.wikitext.replace(/<small>([^<]*)<\/small>/g, '<small>$1</small>');
  }

  private convertCode(): void {
    // Convert code blocks
    this.wikitext = this.wikitext.replace(
      /<pre class="code-block language-(\w+)"><code>([^<]*)<\/code><\/pre>/g,
      (m, lang, code) => {
        const unescapedCode = MarkupUtils.unescapeHtml(code);
        return lang === 'text' 
          ? `<syntaxhighlight>\n${unescapedCode}\n</syntaxhighlight>`
          : `<syntaxhighlight lang="${lang}">\n${unescapedCode}\n</syntaxhighlight>`;
      }
    );
    
    // Convert inline code
    this.wikitext = this.wikitext.replace(
      /<code class="inline-code">([^<]*)<\/code>/g,
      (m, code) => `<code>${MarkupUtils.unescapeHtml(code)}</code>`
    );
  }

  private convertMath(): void {
    this.wikitext = this.wikitext.replace(
      /<span class="math-inline" data-tex="([^"]+)">[\s\S]*?<\/span>/g,
      (m, tex) => `<math>${MarkupUtils.unescapeHtml(tex)}</math>`
    );
  }

  private convertTemplates(): void {
    this.wikitext = this.wikitext.replace(
      /<div class="template" data-template="([^"]+)">([^<]*)<\/div>/g,
      (m, name, params) => {
        const unescapedName = MarkupUtils.unescapeHtml(name);
        if (!params.trim()) {
          return `{{${unescapedName}}}`;
        }
        
        const paramPairs = params.split(', ').map(p => {
          const [key, val] = p.split(': ');
          return `${MarkupUtils.unescapeHtml(key)}=${MarkupUtils.unescapeHtml(val)}`;
        }).join('|');
        
        return `{{${unescapedName}|${paramPairs}}}`;
      }
    );
  }

  private cleanupWhitespace(): void {
    // Remove excessive newlines
    this.wikitext = this.wikitext.replace(/\n{3,}/g, '\n\n');
    // Trim whitespace
    this.wikitext = this.wikitext.trim();
  }
}

// Editor Commands
const EditorCommands: Record<string, EditorCommand> = {
  bold: {
    name: 'bold',
    execute: (selection: string) => `'''${selection}'''`
  },
  italic: {
    name: 'italic',
    execute: (selection: string) => `''${selection}''`
  },
  boldItalic: {
    name: 'boldItalic',
    execute: (selection: string) => `'''''${selection}'''''`
  },
  strikethrough: {
    name: 'strikethrough',
    execute: (selection: string) => `<s>${selection}</s>`
  },
  underline: {
    name: 'underline',
    execute: (selection: string) => `<u>${selection}</u>`
  },
  inlineCode: {
    name: 'inlineCode',
    execute: (selection: string) => `<code>${selection}</code>`
  },
  heading: {
    name: 'heading',
    execute: (selection: string, level: number = 2) => {
      const clampedLevel = Math.max(1, Math.min(6, level));
      const equals = '='.repeat(clampedLevel);
      return `${equals} ${selection} ${equals}`;
    }
  },
  internalLink: {
    name: 'internalLink',
    execute: (selection: string, page?: string) => {
      if (page && page !== selection) {
        return `[[${page}|${selection}]]`;
      }
      return `[[${selection}]]`;
    }
  },
  externalLink: {
    name: 'externalLink',
    execute: (url: string, text?: string) => {
      if (text) return `[${url} ${text}]`;
      return `[${url}]`;
    }
  },
  image: {
    name: 'image',
    execute: (filename: string, options?: string) => {
      if (options) return `[[File:${filename}|${options}]]`;
      return `[[File:${filename}]]`;
    }
  },
  thumbnail: {
    name: 'thumbnail',
    execute: (filename: string, caption?: string, size?: string) => {
      const opts = ['thumb'];
      if (size) opts.push(size);
      if (caption) opts.push(caption);
      return `[[File:${filename}|${opts.join('|')}]]`;
    }
  },
  video: {
    name: 'video',
    execute: (filename: string, caption?: string) => {
      if (caption) return `[[Media:${filename}|${caption}]]`;
      return `[[Media:${filename}]]`;
    }
  },
  codeBlock: {
    name: 'codeBlock',
    execute: (code: string, language?: string) => {
      if (language) return `<syntaxhighlight lang="${language}">\n${code}\n</syntaxhighlight>`;
      return `<syntaxhighlight>\n${code}\n</syntaxhighlight>`;
    }
  },
  math: {
    name: 'math',
    execute: (latex: string) => `<math>${latex}</math>`
  },
  unorderedList: {
    name: 'unorderedList',
    execute: (items: string | string[]) => {
      const itemArray = Array.isArray(items) ? items : [items];
      return itemArray.map(item => `* ${item}`).join('\n');
    }
  },
  orderedList: {
    name: 'orderedList',
    execute: (items: string | string[]) => {
      const itemArray = Array.isArray(items) ? items : [items];
      return itemArray.map(item => `# ${item}`).join('\n');
    }
  },
  table: {
    name: 'table',
    execute: (headers: string[], rows: string[][], caption?: string, cssClass?: string) => {
      let table = `{|${cssClass ? ` class="${cssClass}"` : ' class="wikitable"'}\n`;
      if (caption) table += `|+ ${caption}\n`;
      if (headers.length > 0) {
        table += `! ${headers.join(' !! ')}\n`;
      }
      table += '|-\n';
      table += rows.map(row => `| ${row.join(' || ')}`).join('\n|-\n');
      table += '\n|}';
      return table;
    }
  },
  template: {
    name: 'template',
    execute: (name: string, params?: Record<string, string>) => {
      if (!params || Object.keys(params).length === 0) {
        return `{{${name}}}`;
      }
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join('|');
      return `{{${name}|${paramStr}}}`;
    }
  },
  horizontalRule: {
    name: 'horizontalRule',
    execute: () => '----'
  },
  reference: {
    name: 'reference',
    execute: (text: string, name?: string) => {
      if (name) return `<ref name="${name}">${text}</ref>`;
      return `<ref>${text}</ref>`;
    }
  },
  refList: {
    name: 'refList',
    execute: () => '{{reflist}}'
  }
};

// Apply editor command to text
const applyEditorCommand = (
  text: string,
  command: string,
  selectionStart: number,
  selectionEnd: number,
  ...args: any[]
): { text: string; newSelectionStart: number; newSelectionEnd: number } => {
  const cmd = EditorCommands[command];
  if (!cmd) throw new Error(`Unknown command: ${command}`);
  
  const before = text.substring(0, selectionStart);
  const selection = text.substring(selectionStart, selectionEnd);
  const after = text.substring(selectionEnd);
  
  const transformed = cmd.execute(selection, ...args);
  const newText = before + transformed + after;
  
  return {
    text: newText,
    newSelectionStart: before.length,
    newSelectionEnd: before.length + transformed.length
  };
};

// Validation
const validateMarkup = (text: string): Array<{ line: number; message: string; severity: 'error' | 'warning' }> => {
  const issues: Array<{ line: number; message: string; severity: 'error' | 'warning' }> = [];
  const lines = text.split('\n');
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Check for unclosed tags
    const tags = ['code', 'math', 'ref', 'syntaxhighlight', 'source', 's', 'u', 'sup', 'sub', 'small'];
    tags.forEach(tag => {
      const openCount = (line.match(new RegExp(`<${tag}(?:\\s[^>]*)?>`, 'g')) || []).length;
      const closeCount = (line.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      const selfCloseCount = (line.match(new RegExp(`<${tag}[^>]*/>`, 'g')) || []).length;
      
      if (openCount > closeCount + selfCloseCount) {
        issues.push({
          line: lineNum,
          message: `Unclosed <${tag}> tag detected`,
          severity: 'error'
        });
      }
    });
    
    // Check for mismatched brackets
    const openBrackets = (line.match(/\[\[/g) || []).length;
    const closeBrackets = (line.match(/\]\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push({
        line: lineNum,
        message: `Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`,
        severity: 'warning'
      });
    }
    
    // Check for mismatched templates
    const openTemplates = (line.match(/\{\{/g) || []).length;
    const closeTemplates = (line.match(/\}\}/g) || []).length;
    if (openTemplates !== closeTemplates) {
      issues.push({
        line: lineNum,
        message: `Mismatched template brackets: ${openTemplates} opening, ${closeTemplates} closing`,
        severity: 'warning'
      });
    }
  });
  
  return issues;
};

// Main parsing function
const parseMarkup = (text: string): ParseResult => {
  const parser = new WikiMarkupParser(text);
  return parser.parse();
};

// HTML to WikiText conversion function
const htmlToWikitext = (html: string): string => {
  const converter = new HtmlToWikiTextConverter(html);
  return converter.convert();
};

// Export all functions
export {
  parseMarkup,
  htmlToWikitext,
  EditorCommands,
  applyEditorCommand,
  validateMarkup,
  MarkupUtils,
  DEFAULT_STYLES,
  type ParseResult,
  type EditorCommand
};