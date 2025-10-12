/**
 * recordMX Advanced Markup Language Parser v2.0
 * Complete implementation with extensive features, plugins, and tools
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface RecordMXConfig {
  sanitize?: boolean;
  allowHtml?: boolean;
  smartQuotes?: boolean;
  autoLinks?: boolean;
  lineBreaks?: boolean;
  mathSupport?: boolean;
  diagramSupport?: boolean;
  emojiSupport?: boolean;
  customPlugins?: RecordMXPlugin[];
  tableOfContents?: boolean;
  syntaxHighlight?: boolean;
  maxNestingLevel?: number;
}

export interface RecordMXPlugin {
  name: string;
  parse: (content: string, metadata: RecordMXMetadata) => string;
  priority?: number;
}

export interface RecordMXMetadata {
  title?: string;
  author?: string;
  date?: string;
  tags?: string[];
  description?: string;
  images: Array<{ src: string; alt: string; title?: string; width?: string; height?: string }>;
  videos: Array<{ src: string; type: string; poster?: string }>;
  audio: string[];
  links: Array<{ url: string; text: string; internal: boolean }>;
  headings: Array<{ level: number; text: string; id: string }>;
  footnotes: Array<{ id: string; text: string }>;
  citations: Array<{ id: string; text: string; type: string }>;
  templates: Array<{ name: string; params: Record<string, string> }>;
  variables: Record<string, string>;
  tasks: Array<{ done: boolean; text: string }>;
  definitions: Array<{ term: string; definition: string }>;
  abbreviations: Record<string, string>;
  mathExpressions: string[];
  codeBlocks: Array<{ lang: string; code: string; filename?: string }>;
  diagrams: Array<{ type: string; content: string }>;
  embeds: Array<{ type: string; url: string }>;
  mentions: string[];
  hashtags: string[];
  wordCount: number;
  readingTime: number;
}

export interface RecordMXParseResult {
  html: string;
  metadata: RecordMXMetadata;
  styles: string;
  scripts: string;
  toc?: string;
  errors: Array<{ line: number; col: number; message: string; severity: 'error' | 'warning' | 'info' }>;
  warnings: string[];
}

// ============================================================================
// DEFAULT STYLES
// ============================================================================

export const RECORDMX_ADVANCED_STYLES = `
.recordmx-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: #2c3e50;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* Headings */
.recordmx-content h1, .recordmx-content h2, .recordmx-content h3,
.recordmx-content h4, .recordmx-content h5, .recordmx-content h6 {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #1a202c;
  position: relative;
}
.recordmx-content h1 { font-size: 2.5em; border-bottom: 3px solid #3498db; padding-bottom: 0.3em; }
.recordmx-content h2 { font-size: 2em; border-bottom: 2px solid #95a5a6; padding-bottom: 0.3em; }
.recordmx-content h3 { font-size: 1.5em; }
.recordmx-content h4 { font-size: 1.25em; }
.recordmx-content h5 { font-size: 1.1em; }
.recordmx-content h6 { font-size: 1em; color: #7f8c8d; }

/* Paragraphs & Text */
.recordmx-content p { margin: 1em 0; }
.recordmx-content hr { border: none; border-top: 2px solid #ecf0f1; margin: 2em 0; }

/* Formatting */
.recordmx-content strong { font-weight: 700; color: #2c3e50; }
.recordmx-content em { font-style: italic; color: #34495e; }
.recordmx-content mark { background: #fff59d; padding: 2px 4px; }
.recordmx-content del { text-decoration: line-through; color: #95a5a6; }
.recordmx-content ins { text-decoration: underline; color: #27ae60; }
.recordmx-content sub, .recordmx-content sup { font-size: 0.75em; }

/* Blockquotes & Callouts */
.recordmx-content blockquote {
  color: #555;
  border-left: 4px solid #3498db;
  margin: 1.5em 0;
  padding: 0.5em 1em;
  background: #f8f9fa;
  font-style: italic;
}
.recordmx-content .callout {
  padding: 1em;
  margin: 1em 0;
  border-radius: 6px;
  border-left: 4px solid;
}
.recordmx-content .callout-info { background: #e3f2fd; border-color: #2196f3; }
.recordmx-content .callout-warning { background: #fff3e0; border-color: #ff9800; }
.recordmx-content .callout-error { background: #ffebee; border-color: #f44336; }
.recordmx-content .callout-success { background: #e8f5e9; border-color: #4caf50; }

/* Code */
.recordmx-content pre, .recordmx-content code {
  font-family: "Fira Code", "Monaco", "Courier New", monospace;
  font-size: 0.9em;
}
.recordmx-content code {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #e74c3c;
}
.recordmx-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1.2em;
  border-radius: 6px;
  overflow-x: auto;
  position: relative;
}
.recordmx-content pre code {
  background: none;
  padding: 0;
  color: inherit;
}
.recordmx-content .code-header {
  background: #2d2d2d;
  color: #d4d4d4;
  padding: 0.5em 1em;
  border-radius: 6px 6px 0 0;
  font-size: 0.85em;
  font-weight: 600;
}
.recordmx-content .code-block { margin: 1.5em 0; }

/* Lists */
.recordmx-content ul, .recordmx-content ol { margin: 1em 0; padding-left: 2em; }
.recordmx-content li { margin: 0.5em 0; }
.recordmx-content ul ul, .recordmx-content ol ol { margin: 0.3em 0; }
.recordmx-content .task-list { list-style: none; padding-left: 0; }
.recordmx-content .task-list-item { position: relative; padding-left: 1.8em; }
.recordmx-content .task-list-item input[type="checkbox"] {
  position: absolute;
  left: 0;
  top: 0.35em;
  width: 1.2em;
  height: 1.2em;
}

/* Tables */
.recordmx-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.recordmx-content th, .recordmx-content td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}
.recordmx-content th {
  background: #3498db;
  color: white;
  font-weight: 600;
}
.recordmx-content tr:nth-child(even) { background: #f8f9fa; }
.recordmx-content tr:hover { background: #e9ecef; }

/* Links */
.recordmx-content a {
  color: #3498db;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;
}
.recordmx-content a:hover {
  color: #2980b9;
  border-bottom-color: #2980b9;
}
.recordmx-content a.internal { color: #9b59b6; }
.recordmx-content a.external::after {
  content: "↗";
  font-size: 0.8em;
  margin-left: 0.2em;
}

/* Media */
.recordmx-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  margin: 1.5em auto;
}
.recordmx-content figure {
  margin: 1.5em 0;
  text-align: center;
}
.recordmx-content figcaption {
  color: #7f8c8d;
  font-size: 0.9em;
  font-style: italic;
  margin-top: 0.5em;
}
.recordmx-content video, .recordmx-content audio {
  max-width: 100%;
  border-radius: 4px;
}

/* Footnotes & References */
.recordmx-content sup.reference {
  font-size: 0.8em;
  color: #3498db;
  cursor: pointer;
}
.recordmx-content .reflist {
  margin-top: 3em;
  padding-top: 2em;
  border-top: 2px solid #ecf0f1;
}
.recordmx-content .reflist h2 { font-size: 1.5em; }
.recordmx-content .reflist ol { font-size: 0.9em; }
.recordmx-content .reflist li { margin: 0.8em 0; }

/* Math */
.recordmx-content .math-inline { font-family: "Latin Modern Math", "Times New Roman", serif; }
.recordmx-content .math-display {
  display: block;
  text-align: center;
  margin: 1.5em 0;
  font-size: 1.2em;
  overflow-x: auto;
}

/* Diagrams */
.recordmx-content .diagram {
  margin: 1.5em 0;
  padding: 1em;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

/* Definitions */
.recordmx-content dl { margin: 1em 0; }
.recordmx-content dt {
  font-weight: 700;
  color: #2c3e50;
  margin-top: 1em;
}
.recordmx-content dd {
  margin-left: 2em;
  margin-bottom: 0.5em;
  color: #555;
}

/* Table of Contents */
.recordmx-toc {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1.5em;
  margin: 2em 0;
}
.recordmx-toc h2 {
  margin-top: 0;
  font-size: 1.3em;
  color: #2c3e50;
}
.recordmx-toc ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.recordmx-toc li { margin: 0.5em 0; }
.recordmx-toc a {
  color: #3498db;
  text-decoration: none;
}
.recordmx-toc .toc-level-1 { font-weight: 600; }
.recordmx-toc .toc-level-2 { padding-left: 1em; }
.recordmx-toc .toc-level-3 { padding-left: 2em; }
.recordmx-toc .toc-level-4 { padding-left: 3em; }

/* Badges & Labels */
.recordmx-content .badge {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 0.85em;
  font-weight: 600;
  border-radius: 12px;
  margin: 0 0.2em;
}
.recordmx-content .badge-primary { background: #3498db; color: white; }
.recordmx-content .badge-success { background: #27ae60; color: white; }
.recordmx-content .badge-warning { background: #f39c12; color: white; }
.recordmx-content .badge-danger { background: #e74c3c; color: white; }

/* Spoilers */
.recordmx-content .spoiler {
  background: #2c3e50;
  color: #2c3e50;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s;
}
.recordmx-content .spoiler:hover,
.recordmx-content .spoiler.revealed {
  color: white;
  background: #34495e;
}

/* Containers */
.recordmx-content .container {
  padding: 1em;
  margin: 1em 0;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

/* Responsive */
@media (max-width: 768px) {
  .recordmx-content { padding: 10px; font-size: 14px; }
  .recordmx-content h1 { font-size: 2em; }
  .recordmx-content h2 { font-size: 1.5em; }
  .recordmx-content pre { padding: 0.8em; }
}
`;

// ============================================================================
// UTILITY CLASS
// ============================================================================

export class RecordMXUtils {
  static escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', 
      "'": '&#39;', '`': '&#96;', '/': '&#x2F;'
    };
    return str.replace(/[&<>"'`\/]/g, c => map[c]);
  }

  static unescapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
      '&#39;': "'", '&#96;': '`', '&#x2F;': '/'
    };
    return str.replace(/&(?:amp|lt|gt|quot|#39|#96|#x2F);/g, m => map[m]);
  }

  static generateAnchorId(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  static slugify(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  static smartQuotes(text: string): string {
    return text
      .replace(/(\W|^)"(\S)/g, '$1"$2')
      .replace(/(\S)"(\W|$)/g, '$1"$2')
      .replace(/(\W|^)'(\S)/g, '$1','$2')
      .replace(/(\S)'(\W|$)/g, '$1','$2');
  }

  static convertEmojis(text: string): string {
    const emojiMap: Record<string, string> = {
      ':)': '😊', ':D': '😃', ':(': '☹️', ';)': '😉',
      ':P': '😛', '<3': '❤️', ':heart:': '❤️', ':star:': '⭐',
      ':check:': '✓', ':x:': '✗', ':arrow:': '→'
    };
    let result = text;
    Object.entries(emojiMap).forEach(([code, emoji]) => {
      result = result.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
    });
    return result;
  }
}

// ============================================================================
// MAIN PARSER CLASS
// ============================================================================

export class RecordMXParser {
  private config: Required<RecordMXConfig>;
  private metadata: RecordMXMetadata;
  private errors: RecordMXParseResult['errors'] = [];
  private warnings: string[] = [];
  private nestingLevel = 0;

  constructor(config: RecordMXConfig = {}) {
    this.config = {
      sanitize: config.sanitize ?? true,
      allowHtml: config.allowHtml ?? false,
      smartQuotes: config.smartQuotes ?? true,
      autoLinks: config.autoLinks ?? true,
      lineBreaks: config.lineBreaks ?? false,
      mathSupport: config.mathSupport ?? true,
      diagramSupport: config.diagramSupport ?? true,
      emojiSupport: config.emojiSupport ?? true,
      customPlugins: config.customPlugins ?? [],
      tableOfContents: config.tableOfContents ?? true,
      syntaxHighlight: config.syntaxHighlight ?? true,
      maxNestingLevel: config.maxNestingLevel ?? 10
    };

    this.metadata = this.initMetadata();
  }

  private initMetadata(): RecordMXMetadata {
    return {
      images: [], videos: [], audio: [], links: [], headings: [],
      footnotes: [], citations: [], templates: [], variables: {},
      tasks: [], definitions: [], abbreviations: {}, mathExpressions: [],
      codeBlocks: [], diagrams: [], embeds: [], mentions: [],
      hashtags: [], wordCount: 0, readingTime: 0
    };
  }

  parse(markup: string): RecordMXParseResult {
    this.errors = [];
    this.warnings = [];
    this.metadata = this.initMetadata();

    try {
      let html = markup;

      // Extract front matter (YAML-style metadata)
      html = this.parseFrontMatter(html);

      // Remove comments
      html = this.removeComments(html);

      // Process custom plugins (pre-processing)
      html = this.applyPlugins(html, 'pre');

      // Parse all syntax elements
      html = this.parseVariables(html);
      html = this.parseCodeBlocks(html);
      html = this.parseMath(html);
      html = this.parseDiagrams(html);
      html = this.parseTemplates(html);
      html = this.parseCallouts(html);
      html = this.parseDefinitionLists(html);
      html = this.parseTables(html);
      html = this.parseTaskLists(html);
      html = this.parseBlockquotes(html);
      html = this.parseHeadings(html);
      html = this.parseHorizontalRules(html);
      html = this.parseLists(html);
      html = this.parseMedia(html);
      html = this.parseLinks(html);
      html = this.parseFootnotes(html);
      html = this.parseInlineFormatting(html);
      html = this.parseEmojis(html);
      html = this.parseAutoLinks(html);
      html = this.parseMentionsAndHashtags(html);
      html = this.parseParagraphs(html);

      // Apply custom plugins (post-processing)
      html = this.applyPlugins(html, 'post');

      // Add footnotes/references section
      html = this.addReferencesSection(html);

      // Wrap in container
      html = `<div class="recordmx-content">${html}</div>`;

      // Calculate metadata
      this.metadata.wordCount = RecordMXUtils.countWords(markup);
      this.metadata.readingTime = RecordMXUtils.calculateReadingTime(markup);

      // Generate table of contents
      const toc = this.config.tableOfContents ? this.generateTOC() : undefined;

      return {
        html,
        metadata: this.metadata,
        styles: RECORDMX_ADVANCED_STYLES,
        scripts: this.generateScripts(),
        toc,
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error: any) {
      this.errors.push({
        line: 0,
        col: 0,
        message: error?.message || 'Unknown parsing error',
        severity: 'error'
      });
      return {
        html: '<div class="recordmx-content"><p>Error parsing markup</p></div>',
        metadata: this.metadata,
        styles: RECORDMX_ADVANCED_STYLES,
        scripts: '',
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  private parseFrontMatter(content: string): string {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);
    
    if (match) {
      const yamlContent = match[1];
      yamlContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          const value = valueParts.join(':').trim();
          const cleanKey = key.trim();
          
          if (cleanKey === 'tags') {
            this.metadata.tags = value.split(',').map(t => t.trim());
          } else if (cleanKey === 'title') {
            this.metadata.title = value;
          } else if (cleanKey === 'author') {
            this.metadata.author = value;
          } else if (cleanKey === 'date') {
            this.metadata.date = value;
          } else if (cleanKey === 'description') {
            this.metadata.description = value;
          }
        }
      });
      return content.replace(frontMatterRegex, '');
    }
    return content;
  }

  private removeComments(content: string): string {
    return content.replace(/<!--[\s\S]*?-->/g, '').replace(/%%.*?%%/g, '');
  }

  private parseVariables(content: string): string {
    // Define variables: {{var:name=value}}
    content = content.replace(/\{\{var:(\w+)=([^}]+)\}\}/g, (m, name, value) => {
      this.metadata.variables[name] = value;
      return '';
    });
    
    // Use variables: {{name}}
    return content.replace(/\{\{(\w+)\}\}/g, (m, name) => {
      return this.metadata.variables[name] || m;
    });
  }

  private parseCodeBlocks(content: string): string {
    // Fenced code blocks with optional filename
    return content.replace(/```(\w+)?(?:\s+file:([^\n]+))?\n([\s\S]*?)```/g, (m, lang, filename, code) => {
      const validLang = lang || 'text';
      const cleanCode = RecordMXUtils.escapeHtml(code.trim());
      
      this.metadata.codeBlocks.push({
        lang: validLang,
        code: code.trim(),
        filename: filename?.trim()
      });

      let header = '';
      if (filename) {
        header = `<div class="code-header">${RecordMXUtils.escapeHtml(filename.trim())}</div>`;
      }

      return `<div class="code-block">${header}<pre class="language-${RecordMXUtils.escapeHtml(validLang)}"><code>${cleanCode}</code></pre></div>`;
    });
  }

  private parseMath(content: string): string {
    if (!this.config.mathSupport) return content;

    // Display math: $$...$$ or \[...\]
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (m, math) => {
      this.metadata.mathExpressions.push(math.trim());
      return `<div class="math-display">${RecordMXUtils.escapeHtml(math.trim())}</div>`;
    });

    content = content.replace(/\\\[([\s\S]+?)\\\]/g, (m, math) => {
      this.metadata.mathExpressions.push(math.trim());
      return `<div class="math-display">${RecordMXUtils.escapeHtml(math.trim())}</div>`;
    });

    // Inline math: $...$ or \(...\)
    content = content.replace(/\$([^\$\n]+?)\$/g, (m, math) => {
      return `<span class="math-inline">${RecordMXUtils.escapeHtml(math)}</span>`;
    });

    content = content.replace(/\\\(([^)]+?)\\\)/g, (m, math) => {
      return `<span class="math-inline">${RecordMXUtils.escapeHtml(math)}</span>`;
    });

    return content;
  }

  private parseDiagrams(content: string): string {
    if (!this.config.diagramSupport) return content;

    // Mermaid diagrams
    content = content.replace(/```mermaid\n([\s\S]*?)```/g, (m, diagram) => {
      this.metadata.diagrams.push({ type: 'mermaid', content: diagram.trim() });
      return `<div class="diagram mermaid">${diagram.trim()}</div>`;
    });

    return content;
  }

  private parseTemplates(content: string): string {
    return content.replace(/\{%\s*(\w+)((?:\s+\w+=\S+)*)\s*%\}/g, (m, name, params) => {
      const paramObj: Record<string, string> = {};
      if (params) {
        params.trim().split(/\s+/).forEach((pair: string) => {
          const [k, v] = pair.split('=');
          if (k && v) paramObj[k] = v;
        });
      }
      this.metadata.templates.push({ name, params: paramObj });
      
      return `<div class="template" data-template="${RecordMXUtils.escapeHtml(name)}">${
        Object.entries(paramObj)
          .map(([k, v]) => `<span class="template-param"><strong>${RecordMXUtils.escapeHtml(k)}:</strong> ${RecordMXUtils.escapeHtml(v)}</span>`)
          .join(' ')
      }</div>`;
    });
  }

  private parseCallouts(content: string): string {
    // Callouts: :::type\ncontent\n:::
    return content.replace(/:::(info|warning|error|success)\n([\s\S]*?):::/g, (m, type, text) => {
      return `<div class="callout callout-${type}">${text.trim()}</div>`;
    });
  }

  private parseDefinitionLists(content: string): string {
    // Definition lists: term\n: definition
    return content.replace(/^(\w[^\n]+)\n:\s+(.+)$/gm, (m, term, def) => {
      this.metadata.definitions.push({ term, definition: def });
      return `<dl><dt>${RecordMXUtils.escapeHtml(term)}</dt><dd>${RecordMXUtils.escapeHtml(def)}</dd></dl>`;
    });
  }

  private parseTables(content: string): string {
    return content.replace(/((?:\|.+\|[\n\r]+)+)/g, (match) => {
      const lines = match.trim().split(/[\n\r]+/);
      if (lines.length < 2) return match;

      let html = '<table>';
      lines.forEach((line, idx) => {
        if (idx === 1 && line.match(/^\|[\s:-]+\|/)) return; // Skip separator line
        
        const cells = line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        
        html += '<tr>';
        cells.forEach(cell => {
          html += `<${tag}>${RecordMXUtils.escapeHtml(cell)}</${tag}>`;
        });
        html += '</tr>';
      });
      html += '</table>';
      return html;
    });
  }

  private parseTaskLists(content: string): string {
    return content.replace(/^- \[([ x])\] (.+)$/gm, (m, checked, text) => {
      const isChecked = checked === 'x';
      this.metadata.tasks.push({ done: isChecked, text });
      return `<ul class="task-list"><li class="task-list-item"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${RecordMXUtils.escapeHtml(text)}</li></ul>`;
    });
  }

  private parseBlockquotes(content: string): string {
    return content.replace(/^> (.+)$/gm, (_, text) => {
      return `<blockquote>${text}</blockquote>`;
    });
  }

  private parseHeadings(content: string): string {
    return content.replace(/^(#{1,6})\s+(.+)$/gm, (m, hashes, text) => {
      const level = hashes.length;
      const anchorId = RecordMXUtils.generateAnchorId(text);
      
      this.metadata.headings.push({ level, text, id: anchorId });
      
      return `<h${level} id="${anchorId}">${RecordMXUtils.escapeHtml(text)}</h${level}>`;
    });
  }

  private parseHorizontalRules(content: string): string {
    return content.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');
  }

  private parseLists(content: string): string {
    // Ordered lists
    content = content.replace(/^(?:\d+\.\s+.+(?:\n\d+\.\s+.+)*)/gm, (match) => {
      const items = match.split('\n')
        .map(line => line.replace(/^\d+\.\s+/, ''))
        .map(item => `<li>${item}</li>`)
        .join('');
      return `<ol>${items}</ol>`;
    });

    // Unordered lists
    content = content.replace(/^(?:[-*+]\s+.+(?:\n[-*+]\s+.+)*)/gm, (match) => {
      const items = match.split('\n')
        .map(line => line.replace(/^[-*+]\s+/, ''))
        .map(item => `<li>${item}</li>`)
        .join('');
      return `<ul>${items}</ul>`;
    });

    return content;
  }

  private parseMedia(content: string): string {
    // Images with optional attributes: ![alt](src "title"){width height}
    content = content.replace(/!\[([^\]]*)\]\(([^\)]+?)(?:\s+"([^"]+)")?\)(?:\{(\d+)(?:x(\d+))?\})?/g, 
      (m, alt, src, title, width, height) => {
        this.metadata.images.push({ src, alt, title, width, height });
        
        let attrs = `src="${RecordMXUtils.escapeHtml(src)}" alt="${RecordMXUtils.escapeHtml(alt)}"`;
        if (title) attrs += ` title="${RecordMXUtils.escapeHtml(title)}"`;
        if (width) attrs += ` width="${width}"`;
        if (height) attrs += ` height="${height}"`;
        
        const img = `<img ${attrs}>`;
        
        if (title) {
          return `<figure>${img}<figcaption>${RecordMXUtils.escapeHtml(title)}</figcaption></figure>`;
        }
        return img;
      });

    // Videos: @[video](src)
    content = content.replace(/@\[video\]\(([^\)]+)\)/g, (m, src) => {
      this.metadata.videos.push({ src, type: 'video/mp4' });
      return `<video controls src="${RecordMXUtils.escapeHtml(src)}"></video>`;
    });

    // Audio: @[audio](src)
    content = content.replace(/@\[audio\]\(([^\)]+)\)/g, (m, src) => {
      this.metadata.audio.push(src);
      return `<audio controls src="${RecordMXUtils.escapeHtml(src)}"></audio>`;
    });

    // YouTube embeds: @[youtube](videoId)
    content = content.replace(/@\[youtube\]\(([^\)]+)\)/g, (m, videoId) => {
      this.metadata.embeds.push({ type: 'youtube', url: videoId });
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${RecordMXUtils.escapeHtml(videoId)}" frameborder="0" allowfullscreen></iframe>`;
    });

    return content;
  }

  private parseLinks(content: string): string {
    // External links: [text](url)
    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (m, text, url) => {
      if (RecordMXUtils.isValidUrl(url)) {
        this.metadata.links.push({ url, text, internal: false });
      }
      return `<a href="${RecordMXUtils.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="external">${RecordMXUtils.escapeHtml(text)}</a>`;
    });

    // Internal links: [[Page]] or [[Page|Text]]
    content = content.replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, (m, page, text) => {
      this.metadata.links.push({ url: page, text, internal: true });
      return `<a href="${RecordMXUtils.escapeHtml(page)}" class="internal">${RecordMXUtils.escapeHtml(text)}</a>`;
    });

    content = content.replace(/\[\[([^\]]+)\]\]/g, (m, page) => {
      this.metadata.links.push({ url: page, text: page, internal: true });
      return `<a href="${RecordMXUtils.escapeHtml(page)}" class="internal">${RecordMXUtils.escapeHtml(page)}</a>`;
    });

    return content;
  }

  private parseFootnotes(content: string): string {
    const footnotes: Record<string, string> = {};

    // Footnote definitions: [^id]: text
    content = content.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (m, id, text) => {
      footnotes[id] = text;
      this.metadata.footnotes.push({ id, text });
      return '';
    });

    // Citation definitions: [@id]: text {type}
    content = content.replace(/^\[@([^\]]+)\]:\s*(.+?)(?:\s+\{(\w+)\})?$/gm, (m, id, text, type) => {
      this.metadata.citations.push({ id, text, type: type || 'general' });
      return '';
    });

    // Footnote references: [^id]
    content = content.replace(/\[\^([^\]]+)\]/g, (m, id) => {
      const idx = this.metadata.footnotes.findIndex(f => f.id === id) + 1;
      return `<sup class="reference" id="cite_ref-${id}"><a href="#cite_note-${id}">[${idx}]</a></sup>`;
    });

    // Citation references: [@id]
    content = content.replace(/\[@([^\]]+)\]/g, (m, id) => {
      const idx = this.metadata.citations.findIndex(c => c.id === id) + 1;
      return `<sup class="reference" id="cite_ref-${id}"><a href="#cite_note-${id}">[${idx}]</a></sup>`;
    });

    return content;
  }

  private parseInlineFormatting(content: string): string {
    // Spoilers: ||text||
    content = content.replace(/\|\|([^\|]+)\|\|/g, '<span class="spoiler">$1</span>');

    // Highlight: ==text==
    content = content.replace(/==([^=]+)==/g, '<mark>$1</mark>');

    // Strikethrough: ~~text~~
    content = content.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Underline: __text__
    content = content.replace(/__([^_]+)__/g, '<ins>$1</ins>');

    // Bold and italic: ***text***
    content = content.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

    // Bold: **text**
    content = content.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    content = content.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Subscript: ~text~
    content = content.replace(/~([^~]+)~/g, '<sub>$1</sub>');

    // Superscript: ^text^
    content = content.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');

    // Inline code: `code`
    content = content.replace(/`([^`]+)`/g, (_, code) => {
      return `<code>${RecordMXUtils.escapeHtml(code)}</code>`;
    });

    // Badges: {badge:text:type}
    content = content.replace(/\{badge:([^:]+):(\w+)\}/g, (m, text, type) => {
      return `<span class="badge badge-${type}">${RecordMXUtils.escapeHtml(text)}</span>`;
    });

    // Smart quotes
    if (this.config.smartQuotes) {
      content = RecordMXUtils.smartQuotes(content);
    }

    return content;
  }

  private parseEmojis(content: string): string {
    if (!this.config.emojiSupport) return content;
    return RecordMXUtils.convertEmojis(content);
  }

  private parseAutoLinks(content: string): string {
    if (!this.config.autoLinks) return content;

    // Auto-link URLs not already in markdown links
    return content.replace(/(?<!["'(])(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external">${url}</a>`;
    });
  }

  private parseMentionsAndHashtags(content: string): string {
    // Mentions: @username
    content = content.replace(/@(\w+)/g, (m, username) => {
      this.metadata.mentions.push(username);
      return `<a href="#user-${username}" class="mention">@${username}</a>`;
    });

    // Hashtags: #tag
    content = content.replace(/#(\w+)/g, (m, tag) => {
      this.metadata.hashtags.push(tag);
      return `<a href="#tag-${tag}" class="hashtag">#${tag}</a>`;
    });

    return content;
  }

  private parseParagraphs(content: string): string {
    return content.split(/\n\n+/).map(para => {
      para = para.trim();
      if (!para) return '';

      // Don't wrap block-level elements
      if (/^<(h\d|ol|ul|table|pre|blockquote|hr|img|div|figure|video|audio|iframe|dl)/i.test(para)) {
        return para;
      }

      // Handle line breaks
      if (this.config.lineBreaks) {
        para = para.replace(/\n/g, '<br>');
      }

      return `<p>${para}</p>`;
    }).join('\n');
  }

  private addReferencesSection(content: string): string {
    let refsHtml = '';

    if (this.metadata.footnotes.length > 0) {
      refsHtml += '<div class="reflist"><h2>Footnotes</h2><ol>';
      this.metadata.footnotes.forEach(f => {
        refsHtml += `<li id="cite_note-${f.id}"><a href="#cite_ref-${f.id}">↑</a> ${RecordMXUtils.escapeHtml(f.text)}</li>`;
      });
      refsHtml += '</ol></div>';
    }

    if (this.metadata.citations.length > 0) {
      refsHtml += '<div class="reflist"><h2>References</h2><ol>';
      this.metadata.citations.forEach(c => {
        refsHtml += `<li id="cite_note-${c.id}"><a href="#cite_ref-${c.id}">↑</a> ${RecordMXUtils.escapeHtml(c.text)} <em>(${c.type})</em></li>`;
      });
      refsHtml += '</ol></div>';
    }

    return content + refsHtml;
  }

  private generateTOC(): string {
    if (this.metadata.headings.length === 0) return '';

    let toc = '<div class="recordmx-toc"><h2>Table of Contents</h2><ul>';
    
    this.metadata.headings.forEach(heading => {
      toc += `<li class="toc-level-${heading.level}">
        <a href="#${heading.id}">${RecordMXUtils.escapeHtml(heading.text)}</a>
      </li>`;
    });
    
    toc += '</ul></div>';
    return toc;
  }

  private generateScripts(): string {
    let scripts = '';

    // Spoiler reveal functionality
    scripts += `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Spoiler clicks
        document.querySelectorAll('.spoiler').forEach(el => {
          el.addEventListener('click', function() {
            this.classList.toggle('revealed');
          });
        });

        // Smooth scroll for TOC links
        document.querySelectorAll('.recordmx-toc a, sup.reference a').forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        });
      });
    </script>`;

    return scripts;
  }

  private applyPlugins(content: string, phase: 'pre' | 'post'): string {
    const plugins = this.config.customPlugins
      .filter(p => !p.priority || (phase === 'pre' ? p.priority < 50 : p.priority >= 50))
      .sort((a, b) => (a.priority || 50) - (b.priority || 50));

    plugins.forEach(plugin => {
      try {
        content = plugin.parse(content, this.metadata);
      } catch (error: any) {
        this.warnings.push(`Plugin "${plugin.name}" failed: ${error?.message}`);
      }
    });

    return content;
  }
}

// ============================================================================
// REVERSE PARSER: HTML to recordMX
// ============================================================================

export class RecordMXReverseParser {
  static htmlToMarkup(html: string): string {
    let markup = html;

    // Remove wrapper
    markup = markup.replace(/<div class="recordmx-content">([\s\S]*?)<\/div>/, '$1');

    // Remove scripts
    markup = markup.replace(/<script[\s\S]*?<\/script>/g, '');

    // References section
    markup = markup.replace(/<div class="reflist"><h2>Footnotes<\/h2><ol>([\s\S]*?)<\/ol><\/div>/g, (m, items) => {
      return items.replace(/<li id="cite_note-([^"]+)"><a[^>]*>↑<\/a>\s*(.*?)<\/li>/g, 
        (_, id, text) => `[^${id}]: ${RecordMXUtils.unescapeHtml(text)}\n`);
    });

    markup = markup.replace(/<div class="reflist"><h2>References<\/h2><ol>([\s\S]*?)<\/ol><\/div>/g, (m, items) => {
      return items.replace(/<li id="cite_note-([^"]+)"><a[^>]*>↑<\/a>\s*(.*?)\s*<em>\((\w+)\)<\/em><\/li>/g,
        (_, id, text, type) => `[@${id}]: ${RecordMXUtils.unescapeHtml(text)} {${type}}\n`);
    });

    // Footnote/citation references
    markup = markup.replace(/<sup class="reference"[^>]*><a href="#cite_note-([^"]+)">\[(\d+)\]<\/a><\/sup>/g, '[@$1]');

    // Headings
    for (let i = 6; i >= 1; i--) {
      markup = markup.replace(new RegExp(`<h${i}[^>]*>([^<]+)<\\/h${i}>`, 'g'), 
        (_, text) => '#'.repeat(i) + ' ' + text);
    }

    // Tables
    markup = markup.replace(/<table>([\s\S]*?)<\/table>/g, (m, content) => {
      const rows = content.match(/<tr>([\s\S]*?)<\/tr>/g);
      if (!rows) return m;
      
      let result = '';
      rows.forEach((row, idx) => {
        const cells = row.match(/<(th|td)[^>]*>(.*?)<\/(th|td)>/g);
        if (!cells) return;
        
        const line = '|' + cells.map(cell => 
          cell.replace(/<(th|td)[^>]*>(.*?)<\/(th|td)>/, (_, __, text) => 
            RecordMXUtils.unescapeHtml(text.trim())
          )
        ).join('|') + '|';
        
        result += line + '\n';
        if (idx === 0) {
          result += '|' + cells.map(() => '---').join('|') + '|\n';
        }
      });
      return result;
    });

    // Task lists
    markup = markup.replace(/<ul class="task-list">[\s\S]*?<li class="task-list-item"><input type="checkbox"( checked)? disabled>\s*(.*?)<\/li>[\s\S]*?<\/ul>/g,
      (m, checked, text) => `- [${checked ? 'x' : ' '}] ${RecordMXUtils.unescapeHtml(text)}\n`);

    // Lists
    markup = markup.replace(/<ol>([\s\S]*?)<\/ol>/g, (m, items) => {
      let idx = 0;
      return items.replace(/<li>(.*?)<\/li>/g, () => `${++idx}. ${RecordMXUtils.unescapeHtml(RegExp.$1)}\n`);
    });

    markup = markup.replace(/<ul>([\s\S]*?)<\/ul>/g, (m, items) => {
      return items.replace(/<li>(.*?)<\/li>/g, (_, item) => `- ${RecordMXUtils.unescapeHtml(item)}\n`);
    });

    // Media
    markup = markup.replace(/<figure>([\s\S]*?)<\/figure>/g, (m, content) => {
      const img = content.match(/<img ([^>]+)>/);
      const caption = content.match(/<figcaption>(.*?)<\/figcaption>/);
      if (!img) return m;
      
      const src = img[1].match(/src="([^"]+)"/)?.[1] || '';
      const alt = img[1].match(/alt="([^"]+)"/)?.[1] || '';
      const title = caption ? caption[1] : '';
      
      return `![${alt}](${src}${title ? ` "${title}"` : ''})`;
    });

    markup = markup.replace(/<img ([^>]+)>/g, (m, attrs) => {
      const src = attrs.match(/src="([^"]+)"/)?.[1] || '';
      const alt = attrs.match(/alt="([^"]+)"/)?.[1] || '';
      const width = attrs.match(/width="([^"]+)"/)?.[1];
      const height = attrs.match(/height="([^"]+)"/)?.[1];
      
      let result = `![${alt}](${src})`;
      if (width || height) {
        result += `{${width || ''}${height ? 'x' + height : ''}}`;
      }
      return result;
    });

    markup = markup.replace(/<video[^>]*src="([^"]+)"[^>]*><\/video>/g, '@[video]($1)');
    markup = markup.replace(/<audio[^>]*src="([^"]+)"[^>]*><\/audio>/g, '@[audio]($1)');

    // Code blocks
    markup = markup.replace(/<div class="code-block">(?:<div class="code-header">([^<]+)<\/div>)?<pre class="language-([^"]+)"><code>([\s\S]*?)<\/code><\/pre><\/div>/g,
      (m, filename, lang, code) => {
        const file = filename ? ` file:${filename}` : '';
        return '```' + lang + file + '\n' + RecordMXUtils.unescapeHtml(code) + '\n```';
      });

    // Inline code
    markup = markup.replace(/<code>(.*?)<\/code>/g, (_, code) => '`' + RecordMXUtils.unescapeHtml(code) + '`');

    // Formatting
    markup = markup.replace(/<mark>(.*?)<\/mark>/g, '==$1==');
    markup = markup.replace(/<del>(.*?)<\/del>/g, '~~$1~~');
    markup = markup.replace(/<ins>(.*?)<\/ins>/g, '__$1__');
    markup = markup.replace(/<strong><em>(.*?)<\/em><\/strong>/g, '***$1***');
    markup = markup.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markup = markup.replace(/<em>(.*?)<\/em>/g, '*$1*');
    markup = markup.replace(/<sub>(.*?)<\/sub>/g, '~$1~');
    markup = markup.replace(/<sup>(.*?)<\/sup>/g, '^$1^');
    markup = markup.replace(/<span class="spoiler">(.*?)<\/span>/g, '||$1||');

    // Badges
    markup = markup.replace(/<span class="badge badge-(\w+)">(.*?)<\/span>/g, '{badge:$2:$1}');

    // Blockquotes
    markup = markup.replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1');

    // Callouts
    markup = markup.replace(/<div class="callout callout-(\w+)">([\s\S]*?)<\/div>/g, ':::$1\n$2\n:::');

    // Links
    markup = markup.replace(/<a href="([^"]+)"[^>]*class="internal"[^>]*>(.*?)<\/a>/g, (m, url, text) => {
      return url === text ? `[[${text}]]` : `[[${url}|${text}]]`;
    });

    markup = markup.replace(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)');

    // Math
    markup = markup.replace(/<div class="math-display">(.*?)<\/div>/g, (_, math) => '$' + RecordMXUtils.unescapeHtml(math) + '$');
    markup = markup.replace(/<span class="math-inline">(.*?)<\/span>/g, (_, math) => ' + RecordMXUtils.unescapeHtml(math) + ');

    // Diagrams
    markup = markup.replace(/<div class="diagram mermaid">([\s\S]*?)<\/div>/g, '```mermaid\n$1\n```');

    // Templates
    markup = markup.replace(/<div class="template" data-template="([^"]+)">([\s\S]*?)<\/div>/g, (m, name, params) => {
      if (!params.trim()) return `{% ${name} %}`;
      
      const paramPairs = params
        .match(/<span class="template-param"><strong>([^<]+):<\/strong>\s*([^<]*)<\/span>/g)
        ?.map(p => {
          const match = p.match(/<strong>([^<]+):<\/strong>\s*([^<]*)/);
          return match ? `${match[1]}=${match[2].trim()}` : '';
        })
        .filter(Boolean)
        .join(' ');
      
      return `{% ${name} ${paramPairs} %}`;
    });

    // Horizontal rules
    markup = markup.replace(/<hr\s*\/?>/g, '---');

    // Paragraphs
    markup = markup.replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n');

    // Clean up
    markup = markup.replace(/<br\s*\/?>/g, '\n');
    markup = markup.replace(/\n{3,}/g, '\n\n');
    markup = markup.trim();

    return markup;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function parseRecordMX(markup: string, config?: RecordMXConfig): RecordMXParseResult {
  const parser = new RecordMXParser(config);
  return parser.parse(markup);
}

export function convertHtmlToRecordMX(html: string): string {
  return RecordMXReverseParser.htmlToMarkup(html);
}

// ============================================================================
// EXAMPLE PLUGINS
// ============================================================================

export const ColorTextPlugin: RecordMXPlugin = {
  name: 'ColorText',
  parse: (content) => {
    // {color:red}text{/color}
    return content.replace(/\{color:(\w+)\}(.*?)\{\/color\}/g, 
      '<span style="color: $1">$2</span>');
  },
  priority: 45
};

export const AbbreviationPlugin: RecordMXPlugin = {
  name: 'Abbreviations',
  parse: (content, metadata) => {
    // *[abbr]: definition
    content = content.replace(/^\*\[([^\]]+)\]:\s*(.+)$/gm, (m, abbr, def) => {
      metadata.abbreviations[abbr] = def;
      return '';
    });

    // Replace abbreviations with <abbr> tags
    Object.entries(metadata.abbreviations).forEach(([abbr, def]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      content = content.replace(regex, `<abbr title="${def}">${abbr}</abbr>`);
    });

    return content;
  },
  priority: 40
};

export const KeyboardPlugin: RecordMXPlugin = {
  name: 'Keyboard',
  parse: (content) => {
    // [[Ctrl+C]] or [[Enter]]
    return content.replace(/\[\[([A-Z][a-z]+(?:\+[A-Z][a-z]+)*)\]\]/g, 
      '<kbd>$1</kbd>');
  },
  priority: 30
};

// Export everything
export default {
  RecordMXParser,
  RecordMXReverseParser,
  RecordMXUtils,
  parseRecordMX,
  convertHtmlToRecordMX,
  RECORDMX_ADVANCED_STYLES,
  ColorTextPlugin,
  AbbreviationPlugin,
  KeyboardPlugin
};