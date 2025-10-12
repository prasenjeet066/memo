/**
 * recordMX Markup Language Parser & Converter (TypeScript, Modular)
 * Modern syntax, metadata extraction, validation, error handling, default styles
 */

export interface RecordMXParseResult {
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

// Default CSS for recordMX
export const RECORDMX_DEFAULT_STYLES = `
.recordmx-content {
  font-size: 16px;
  line-height: 1.6;
  color: #222;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.recordmx-content h1, .recordmx-content h2, .recordmx-content h3,
.recordmx-content h4, .recordmx-content h5, .recordmx-content h6 {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #111;
}
.recordmx-content hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }
.recordmx-content blockquote { color: #555; border-left: 4px solid #ccc; margin: 1em 0; padding-left: 1em; }
.recordmx-content pre, .recordmx-content code {
  font-family: "Fira Mono", "Courier New", Courier, monospace;
  background: #f8f8fa;
  border-radius: 4px;
}
.recordmx-content pre { padding: 1em; }
.recordmx-content img { max-width: 100%; height: auto; }
.recordmx-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.recordmx-content th, .recordmx-content td { border: 1px solid #ccc; padding: 8px; }
.recordmx-content sup.reference { font-size: 0.8em; }
`;

// Utility functions
export class RecordMXUtils {
  static escapeHtml(str: string): string {
    return str.replace(/[&<>"'`]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
    }[c]!));
  }
  static unescapeHtml(str: string): string {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#96;/g, '`');
  }
  static generateAnchorId(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  static isValidUrl(url: string): boolean {
    try { const u = new URL(url); return !!u; } catch { return false; }
  }
}

// Main parser: recordMX markup to HTML
export function RecordMXtoHTML(markup: string): RecordMXParseResult {
  let html = markup, errors: RecordMXParseResult['errors'] = [];
  const metadata: RecordMXParseResult['metadata'] = {
    images: [], videos: [], links: [], headings: [], footnotes: [], templates: []
  };

  try {
    // Remove comments: <!-- ... -->
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    // Templates: {% templateName param1=value1 param2=value2 %}
    html = html.replace(/\{%\s*(\w+)((?:\s+\w+=\S+)*)\s*%\}/g, (m, name, params) => {
      const paramObj: Record<string, string> = {};
      if (params) {
        params.trim().split(/\s+/).forEach(pair => {
          const [k, v] = pair.split('='); if (k && v) paramObj[k] = v;
        });
      }
      metadata.templates.push({ name, params: paramObj });
      return `<div class="template" data-template="${RecordMXUtils.escapeHtml(name)}">${Object.entries(paramObj)
        .map(([k, v]) => `${RecordMXUtils.escapeHtml(k)}: ${RecordMXUtils.escapeHtml(v)}`).join(', ')}</div>`;
    });

    // Code blocks: triple backticks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
      const validLang = lang || 'text';
      return `<pre class="code-block language-${RecordMXUtils.escapeHtml(validLang)}"><code>${RecordMXUtils.escapeHtml(code.trim())}</code></pre>`;
    });
    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${RecordMXUtils.escapeHtml(code)}</code>`);

    // Blockquote: > quote
    html = html.replace(/^> (.+)$/gm, (_, text) => `<blockquote>${RecordMXUtils.escapeHtml(text)}</blockquote>`);

    // Headings: ## Heading
    html = html.replace(/^(#{1,6})\s*(.+)$/gm, (m, hashes, text) => {
      const level = hashes.length;
      const anchorId = RecordMXUtils.generateAnchorId(text);
      metadata.headings.push({ level, text, id: anchorId });
      return `<h${level} id="${anchorId}">${RecordMXUtils.escapeHtml(text)}</h${level}>`;
    });

    // Horizontal rules: ---
    html = html.replace(/^\s*---+\s*$/gm, '<hr>');

    // Bold/Italic: **bold**, *italic*
    html = html.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Images: ![alt](src)
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (m, alt, src) => {
      metadata.images.push({ src, alt });
      return `<img src="${RecordMXUtils.escapeHtml(src)}" alt="${RecordMXUtils.escapeHtml(alt)}">`;
    });

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (m, text, url) => {
      if (RecordMXUtils.isValidUrl(url)) metadata.links.push(url);
      return `<a href="${RecordMXUtils.escapeHtml(url)}" target="_blank" rel="noopener">${RecordMXUtils.escapeHtml(text)}</a>`;
    });

    // Internal links: [[Page]] or [[Page|Text]]
    html = html.replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, (m, page, text) => {
      metadata.links.push(page);
      return `<a href="${RecordMXUtils.escapeHtml(page)}" class="internal">${RecordMXUtils.escapeHtml(text)}</a>`;
    });
    html = html.replace(/\[\[([^\]]+)\]\]/g, (m, page) => {
      metadata.links.push(page);
      return `<a href="${RecordMXUtils.escapeHtml(page)}" class="internal">${RecordMXUtils.escapeHtml(page)}</a>`;
    });

    // Ordered list: 1. item
    html = html.replace(/^(?:\d+\.\s.*(?:\n\d+\.\s.*)*)/gm, (m) => {
      const items = m.split('\n').map(line => line.replace(/^\d+\.\s/, '')).map(item => `<li>${item}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // Unordered list: - item
    html = html.replace(/^(?:-\s.*(?:\n-\s.*)*)/gm, (m) => {
      const items = m.split('\n').map(line => line.replace(/^-+\s/, '')).map(item => `<li>${item}</li>`).join('');
      return `<ul>${items}</ul>`;
    });

    // Block-level tables (markdown style)
    html = html.replace(/((?:\|.+\|\n)+)/g, (m) => {
      const rows = m.trim().split('\n').map(row => row.replace(/^\|/, '').replace(/\|$/, '').split('|'));
      let table = '<table>';
      rows.forEach((cells, i) => {
        table += '<tr>' + cells.map(cell => i === 0 ? `<th>${RecordMXUtils.escapeHtml(cell.trim())}</th>` : `<td>${RecordMXUtils.escapeHtml(cell.trim())}</td>`).join('') + '</tr>';
      });
      table += '</table>';
      return table;
    });

    // Footnotes: [^id]: text (definition), [ref^id] (reference)
    const footnotes: Record<string, string> = {};
    html = html.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm, (m, id, text) => {
      footnotes[id] = text;
      metadata.footnotes.push({ id, text });
      return '';
    });
    html = html.replace(/\[ref\^([^\]]+)\]/g, (m, id) => {
      const idx = metadata.footnotes.findIndex(f => f.id === id) + 1;
      return `<sup class="reference" id="cite_ref-${id}"><a href="#cite_note-${id}">[${idx}]</a></sup>`;
    });

    // Paragraphs: wrap plain text in <p>
    html = html.split(/\n{2,}/).map(para => {
      para = para.trim();
      if (!para) return '';
      // Don't wrap block-level
      if (/^<(h\d|ol|ul|table|pre|blockquote|hr|img|div|figure)/i.test(para)) return para;
      return `<p>${para}</p>`;
    }).join('\n');

    // References section (if any footnotes)
    if (metadata.footnotes.length) {
      html += `<div class="reflist"><h2>References</h2><ol>${
        metadata.footnotes.map((f, i) =>
          `<li id="cite_note-${f.id}"><a href="#cite_ref-${f.id}">↑</a> ${RecordMXUtils.escapeHtml(f.text)}</li>`
        ).join('')
      }</ol></div>`;
    }

    html = `<div class="recordmx-content">${html}</div>`;

  } catch (error: any) {
    errors.push({ line: 0, message: error?.message || 'Unknown error', severity: 'error' });
    html = `<div class="recordmx-content"><p>Error parsing markup</p></div>`;
  }

  return { html, metadata, styles: RECORDMX_DEFAULT_STYLES, errors };
}

// HTML to recordMX markup
export function HtmlToRecordMX(html: string): string {
  let markup = html;
  // Remove wrapper
  markup = markup.replace(/<div class="recordmx-content">([\s\S]*)<\/div>/, '$1');

  // References: <sup class="reference"><a ...>[n]</a></sup> => [ref^id]
  markup = markup.replace(/<sup class="reference" id="cite_ref-([^"]+)"><a[^>]*>\[(\d+)\]<\/a><\/sup>/g, '[ref^$1]');

  // Headings: <h1>Text</h1> => # Text
  for (let i = 6; i >= 1; i--) {
    markup = markup.replace(new RegExp(`<h${i}[^>]*>([^<]+)<\/h${i}>`, 'g'), `${'#'.repeat(i)} $1`);
  }

  // Bold/italic
  markup = markup.replace(/<strong><em>([^<]*)<\/em><\/strong>/g, '***$1***');
  markup = markup.replace(/<strong>([^<]*)<\/strong>/g, '**$1**');
  markup = markup.replace(/<em>([^<]*)<\/em>/g, '*$1*');

  // Blockquote
  markup = markup.replace(/<blockquote>([^<]*)<\/blockquote>/g, '> $1');

  // Code blocks
  markup = markup.replace(/<pre class="code-block language-([^"]+)"><code>([\s\S]*?)<\/code><\/pre>/g,
    (m, lang, code) => '```' + lang + '\n' + RecordMXUtils.unescapeHtml(code) + '\n```');
  markup = markup.replace(/<code>([^<]*)<\/code>/g, (m, code) => '`' + RecordMXUtils.unescapeHtml(code) + '`');

  // Images
  markup = markup.replace(/<img src="([^"]+)" alt="([^"]*)">/g, (m, src, alt) => `![${alt}](${src})`);

  // Links
  markup = markup.replace(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g, (m, url, text) => `[${text}](${url})`);

  // Ordered list
  markup = markup.replace(/<ol>([\s\S]*?)<\/ol>/g, (m, items) =>
    items.replace(/<li>([^<]*)<\/li>/g, (m, item, idx) => `${idx + 1}. ${item}\n`));

  // Unordered list
  markup = markup.replace(/<ul>([\s\S]*?)<\/ul>/g, (m, items) =>
    items.replace(/<li>([^<]*)<\/li>/g, (m, item) => `- ${item}\n`));

  // Table: markdown style
  markup = markup.replace(/<table>([\s\S]*?)<\/table>/g, (m, tableHtml) => {
    // extract rows
    const rows = tableHtml.match(/<tr>([\s\S]*?)<\/tr>/g);
    if (!rows) return m;
    let result = '';
    rows.forEach((row, i) => {
      const cells = row.match(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/g);
      if (!cells) return;
      const line = '|' + cells.map(cell =>
        cell.replace(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/, (_, __, text) => text.trim())
      ).join('|') + '|';
      result += line + '\n';
    });
    return result;
  });

  // Horizontal rule
  markup = markup.replace(/<hr\s*\/?>/g, '---');

  // Block-level templates
  markup = markup.replace(/<div class="template" data-template="([^"]+)">([^<]*)<\/div>/g, (m, name, params) => {
    if (!params.trim()) return `{% ${name} %}`;
    const paramPairs = params.split(', ').map(pair => pair.replace(/: /, '=')).join(' ');
    return `{% ${name} ${paramPairs} %}`;
  });

  // References section
  markup = markup.replace(/<div class="reflist"><h2>References<\/h2><ol>([\s\S]*?)<\/ol><\/div>/g, (m, items) => {
    // Convert <li id="cite_note-id"><a ...>↑</a> text</li> => [^id]: text
    return items.replace(/<li id="cite_note-([^"]+)"><a[^>]*>↑<\/a>\s*([^<]*)<\/li>/g, (m, id, text) => `[^${id}]: ${text}\n`);
  });

  // Paragraphs
  markup = markup.replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n');

  // Clean whitespace
  markup = markup.replace(/\n{3,}/g, '\n\n').trim();

  return markup;
}
