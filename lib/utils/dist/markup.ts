interface ParseResult {
  html: string;
  metadata: {
    images: Array < { src: string;alt: string } > ;
    videos: string[];
    links: string[];
    headings: Array < { level: number;text: string;id: string } > ;
    footnotes: Array < { id: string;text: string } > ;
    templates: Array < { name: string;params: Record < string, string > } > ;
  };
  styles: string;
}

interface EditorCommand {
  name: string;
  execute: (selection: string, ...args: any[]) => string;
}
// Default CSS styles for parsed content
const DEFAULT_STYLES = `
/* Base Styles */
.markup-content {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
  font-family: "Linux Libertine", Georgia, Times, serif;
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

.markup-content a.internal:hover {
  text-decoration: underline;
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

.markup-content .code-block code {
  background: none;
  border: none;
  padding: 0;
}

/* Lists */
.markup-content ul, .markup-content ol {
  margin: 0.5em 0 1em 1.6em;
  padding: 0;
}

.markup-content li {
  margin: 0.3em 0;
}

.markup-content .list-item {
  list-style-type: disc;
}

.markup-content .list-item.ordered {
  list-style-type: decimal;
}

.markup-content .list-item[data-level="1"] {
  margin-left: 1.6em;
}

.markup-content .list-item[data-level="2"] {
  margin-left: 3.2em;
}

.markup-content dl {
  margin: 1em 0;
}

.markup-content .definition-term {
  font-weight: bold;
  margin-top: 0.5em;
}

.markup-content .definition-desc {
  margin-left: 1.6em;
  margin-bottom: 0.5em;
}

.markup-content .definition-desc[data-level="1"] {
  margin-left: 3.2em;
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

.markup-content .wikitable tr:nth-child(even) {
  background-color: #fff;
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

.markup-content .thumb[align="left"] {
  float: left;
  margin-right: 1.4em;
  margin-left: 0;
}

.markup-content .thumb[align="right"] {
  float: right;
  margin-left: 1.4em;
  margin-right: 0;
}

.markup-content .thumb[align="center"] {
  display: block;
  margin-left: auto;
  margin-right: auto;
  float: none;
}

.markup-content .thumb img {
  display: block;
}

.markup-content figcaption {
  padding: 6px;
  font-size: 0.9em;
  color: #54595d;
  text-align: left;
}

.markup-content .media-video,
.markup-content .media-audio {
  max-width: 100%;
  margin: 1em 0;
  display: block;
}

/* Math */
.markup-content .math-inline {
  font-family: "Latin Modern Math", "STIX Two Math", "Cambria Math", serif;
  font-style: italic;
  padding: 0 2px;
}

/* Horizontal Rule */
.markup-content .divider {
  border: 0;
  border-top: 1px solid #a2a9b1;
  margin: 1.5em 0;
}

/* References */
.markup-content .reference {
  font-size: 0.8em;
  line-height: 1;
}

.markup-content .reference a {
  color: #0645ad;
  text-decoration: none;
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

.markup-content .reflist ol {
  margin: 0.5em 0 0 1.6em;
  padding: 0;
}

.markup-content .reflist li {
  margin: 0.5em 0;
}

/* Table of Contents */
.markup-content #toc {
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

.markup-content #toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.markup-content #toc li {
  margin: 4px 0;
}

.markup-content #toc a {
  color: #0645ad;
  text-decoration: none;
}

.markup-content #toc a:hover {
  text-decoration: underline;
}

.markup-content .toc-level-1 {
  padding-left: 0;
}

.markup-content .toc-level-2 {
  padding-left: 1em;
}

.markup-content .toc-level-3 {
  padding-left: 2em;
}

.markup-content .toc-level-4 {
  padding-left: 3em;
}

.markup-content .toc-level-5 {
  padding-left: 4em;
}

.markup-content .toc-level-6 {
  padding-left: 5em;
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

.markup-content .mw-box {
  background-color: #f8f9fa;
  border: 1px solid #a2a9b1;
  padding: 12px;
  margin: 1em 0;
}

/* Responsive */
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
  
  .markup-content #toc {
    width: 100%;
    box-sizing: border-box;
  }
}

/* Accessibility */
.markup-content :focus {
  outline: 2px solid #36c;
  outline-offset: 2px;
}

/* Print Styles */
@media print {
  .markup-content {
    max-width: 100%;
  }
  
  .markup-content a {
    color: #000;
    text-decoration: underline;
  }
  
  .markup-content .thumb {
    border: 1px solid #000;
  }
}
`;

const parseMarkup = (text: string): ParseResult => {
  let html = text;
  const metadata = {
    images: [] as Array<{ src: string; alt: string }>,
    videos: [] as string[],
    links: [] as string[],
    headings: [] as Array<{ level: number; text: string; id: string }>,
    footnotes: [] as Array<{ id: string; text: string }>,
    templates: [] as Array<{ name: string; params: Record<string, string> }>
  };
  
  // Enhanced HTML escape with all necessary characters
  const escapeHtml = (str: string): string =>
    str.replace(/[&<>"'`]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    }[tag] || tag));
  
  // ========== COMMENTS ==========
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // ========== TEMPLATES (before other processing) ==========
  html = html.replace(/\{\{([^|}\n]+)(?:\|([^}]+))?\}\}/g, (m, name, params) => {
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
    
    metadata.templates.push({ name: templateName, params: templateParams });
    
    // Handle common templates
    if (templateName.toLowerCase() === 'reflist') {
      return '<div class="reflist-placeholder"></div>';
    }
    
    return `<div class="template" data-template="${escapeHtml(templateName)}">${Object.entries(templateParams).map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`).join(', ')}</div>`;
  });
  
  // ========== CODE BLOCKS (before inline processing) ==========
  const codeBlockPlaceholders: string[] = [];
  
  // <syntaxhighlight lang="python">code</syntaxhighlight>
  html = html.replace(/<syntaxhighlight(?:\s+lang="(\w+)")?\s*>([\s\S]*?)<\/syntaxhighlight>/gi, (m, lang, code) => {
    const idx = codeBlockPlaceholders.length;
    codeBlockPlaceholders.push(`<pre class="code-block language-${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`);
    return `__CODE_BLOCK_${idx}__`;
  });
  
  // <source lang="python">code</source>
  html = html.replace(/<source(?:\s+lang="(\w+)")?\s*>([\s\S]*?)<\/source>/gi, (m, lang, code) => {
    const idx = codeBlockPlaceholders.length;
    codeBlockPlaceholders.push(`<pre class="code-block language-${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`);
    return `__CODE_BLOCK_${idx}__`;
  });
  
  // ========== INLINE CODE (before other inline formatting) ==========
  const inlineCodePlaceholders: string[] = [];
  html = html.replace(/<code>([^<]+)<\/code>/g, (m, code) => {
    const idx = inlineCodePlaceholders.length;
    inlineCodePlaceholders.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_${idx}__`;
  });
  
  // ========== MATH ==========
  const mathBlockPlaceholders: string[] = [];
  html = html.replace(/<math>([\s\S]+?)<\/math>/g, (m, tex) => {
    const idx = mathBlockPlaceholders.length;
    mathBlockPlaceholders.push(`<span class="math-inline" data-tex="${escapeHtml(tex.trim())}">${escapeHtml(tex.trim())}</span>`);
    return `__MATH_BLOCK_${idx}__`;
  });
  
  // ========== HEADINGS (MediaWiki style: ==Title==) ==========
  for (let i = 6; i >= 1; i--) {
    const equals = '='.repeat(i);
    const pattern = new RegExp(`^${equals}\\s*([^=]+?)\\s*${equals}\\s*$`, 'gm');
    html = html.replace(pattern, (m, text) => {
      const trimmedText = text.trim();
      const anchorId = trimmedText.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\u00C0-\u024F_-]/g, '');
      metadata.headings.push({ level: i, text: trimmedText, id: anchorId });
      return `<h${i} id="${anchorId}">${trimmedText}</h${i}>`;
    });
  }
  
  // ========== TABLES ==========
  html = html.replace(/\{\|([^\n]*)\n([\s\S]*?)\n\|\}/gm, (m, tableAttrs, content) => {
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
    
    let tableHtml = `<table class="wikitable ${tableAttrs.trim()}">`;
    
    if (caption) {
      tableHtml += `<caption>${caption}</caption>`;
    }
    
    if (headers.length > 0) {
      tableHtml += '<thead><tr>';
      tableHtml += headers.map(h => `<th>${h}</th>`).join('');
      tableHtml += '</tr></thead>';
    }
    
    if (rows.length > 0) {
      tableHtml += '<tbody>';
      for (const row of rows) {
        tableHtml += '<tr>';
        tableHtml += row.map(cell => `<td>${cell}</td>`).join('');
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody>';
    }
    
    tableHtml += '</table>';
    return tableHtml;
  });
  
  // ========== CALLOUTS/BOXES ==========
  html = html.replace(/\{\|([^}]+)\|\}/gs, (m, content) => {
    return `<div class="mw-box">${content.trim()}</div>`;
  });
  
  // ========== MEDIA ==========
  // [[File:image.jpg|thumb|Caption]]
  html = html.replace(/\[\[File:([^|\]]+)(?:\|([^\]]+))?\]\]/gi, (m, filename, options) => {
    let caption = '';
    let align = '';
    let isThumb = false;
    let size = '';
    
    if (options) {
      const parts = options.split('|').map(p => p.trim());
      for (const part of parts) {
        if (part === 'thumb' || part === 'thumbnail') {
          isThumb = true;
        } else if (part === 'left' || part === 'right' || part === 'center') {
          align = part;
        } else if (/^\d+px$/.test(part)) {
          size = part;
        } else {
          caption = part;
        }
      }
    }
    
    metadata.images.push({ src: filename, alt: caption || filename });
    
    const alignAttr = align ? ` align="${align}"` : '';
    const sizeAttr = size ? ` width="${size.replace('px', '')}"` : '';
    
    if (isThumb) {
      return `<figure class="thumb"${alignAttr}><img src="${filename}" alt="${escapeHtml(caption)}"${sizeAttr} class="media-image" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
    }
    
    return `<img src="${filename}" alt="${escapeHtml(caption)}"${alignAttr}${sizeAttr} class="media-image" loading="lazy">`;
  });
  
  // [[Media:video.mp4]]
  html = html.replace(/\[\[Media:([^|\]]+\.(?:mp4|webm|ogv))(?:\|([^\]]+))?\]\]/gi, (m, filename, caption) => {
    metadata.videos.push(filename);
    return `<video src="${filename}" controls class="media-video">${caption ? `<p>${caption}</p>` : ''}</video>`;
  });
  
  // [[Media:audio.mp3]]
  html = html.replace(/\[\[Media:([^|\]]+\.(?:mp3|ogg|wav))(?:\|([^\]]+))?\]\]/gi, (m, filename, caption) => {
    return `<audio src="${filename}" controls class="media-audio">${caption ? `<p>${caption}</p>` : ''}</audio>`;
  });
  
  // ========== HORIZONTAL RULES ==========
  html = html.replace(/^----+$/gm, '<hr class="divider">');
  
  // ========== LISTS ==========
  const processLists = (text: string): string => {
    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([\*#:;]+)\s*(.*)$/);
      
      if (match) {
        const [, markers, content] = match;
        const level = markers.length - 1;
        const lastMarker = markers[markers.length - 1];
        
        if (lastMarker === '*') {
          result.push(`<li class="list-item" data-level="${level}">${content}</li>`);
          inList = true;
        } else if (lastMarker === '#') {
          result.push(`<li class="list-item ordered" data-level="${level}">${content}</li>`);
          inList = true;
        } else if (lastMarker === ';') {
          result.push(`<dt class="definition-term">${content}</dt>`);
          inList = true;
        } else if (lastMarker === ':') {
          result.push(`<dd class="definition-desc" data-level="${level}">${content}</dd>`);
          inList = true;
        }
      } else {
        if (inList && line.trim()) {
          inList = false;
        }
        result.push(line);
      }
    }
    
    return result.join('\n');
  };
  
  html = processLists(html);
  
  // ========== LINKS ==========
  // External: [http://example.com Link text]
  html = html.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g, (m, url, text) => {
    metadata.links.push(url);
    return `<a href="${url}" class="external" target="_blank" rel="noopener">${text || url}</a>`;
  });
  
  // Internal: [[Page]] or [[Page|Display text]]
  html = html.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (m, page, text) => {
    const displayText = text || page;
    const pageUrl = page.replace(/\s+/g, '_');
    metadata.links.push(pageUrl);
    return `<a href="${pageUrl}" class="internal">${displayText}</a>`;
  });
  
  // ========== INLINE FORMATTING ==========
  // '''''bold italic'''''
  html = html.replace(/'''''(.+?)'''''/g, '<strong><em>$1</em></strong>');
  
  // '''bold'''
  html = html.replace(/'''(.+?)'''/g, '<strong>$1</strong>');
  
  // ''italic''
  html = html.replace(/''(.+?)''/g, '<em>$1</em>');
  
  // <s>strikethrough</s>
  html = html.replace(/<s>(.+?)<\/s>/g, '<del>$1</del>');
  
  // <u>underline</u>
  html = html.replace(/<u>(.+?)<\/u>/g, '<ins>$1</ins>');
  
  // <sup>superscript</sup> and <sub>subscript</sub> (preserved as-is)
  // <small>small</small> (preserved as-is)
  
  // ========== REFERENCES/FOOTNOTES ==========
  // <ref name="refname">Reference text</ref>
  html = html.replace(/<ref(?:\s+name="([^"]+)")?\s*>([\s\S]*?)<\/ref>/g, (m, name, text) => {
    const id = name || `ref-${metadata.footnotes.length + 1}`;
    const existingIndex = metadata.footnotes.findIndex(f => f.id === id);
    
    if (existingIndex === -1) {
      metadata.footnotes.push({ id, text: text.trim() });
      const idx = metadata.footnotes.length;
      return `<sup class="reference"><a href="#cite_note-${id}" id="cite_ref-${id}">[${idx}]</a></sup>`;
    } else {
      return `<sup class="reference"><a href="#cite_note-${id}" id="cite_ref-${id}">[${existingIndex + 1}]</a></sup>`;
    }
  });
  
  // <ref name="refname" />
  html = html.replace(/<ref\s+name="([^"]+)"\s*\/>/g, (m, name) => {
    const idx = metadata.footnotes.findIndex(f => f.id === name);
    return idx !== -1 
      ? `<sup class="reference"><a href="#cite_note-${name}" id="cite_ref-${name}">[${idx + 1}]</a></sup>`
      : m;
  });
  
  // ========== SPECIAL CHARACTERS ==========
  html = html.replace(/&mdash;/g, '—');
  html = html.replace(/&ndash;/g, '–');
  html = html.replace(/&hellip;/g, '…');
  html = html.replace(/&rarr;/g, '→');
  html = html.replace(/&larr;/g, '←');
  html = html.replace(/&copy;/g, '©');
  html = html.replace(/&reg;/g, '®');
  html = html.replace(/&trade;/g, '™');
  
  // Restore placeholders
  inlineCodePlaceholders.forEach((code, idx) => {
    html = html.replace(`__INLINE_CODE_${idx}__`, code);
  });
  
  mathBlockPlaceholders.forEach((math, idx) => {
    html = html.replace(`__MATH_BLOCK_${idx}__`, math);
  });
  
  codeBlockPlaceholders.forEach((code, idx) => {
    html = html.replace(`__CODE_BLOCK_${idx}__`, code);
  });
  
  // ========== PARAGRAPHS ==========
  html = html
    .split(/\n{2,}/)
    .map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      // Don't wrap block-level elements
      if (trimmed.match(/^<(h[1-6]|table|pre|div|blockquote|hr|figure|ul|ol|dl|li|dt|dd)/i)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join('\n');
  
  // ========== TABLE OF CONTENTS ==========
  if (metadata.headings.length >= 3) {
    const toc = metadata.headings.map(h =>
      `<li class="toc-level-${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`
    ).join('');
    html = `<div id="toc" class="toc"><div class="toc-title">Contents</div><ul>${toc}</ul></div>\n${html}`;
  }
  
  // ========== REFERENCES SECTION ==========
  if (metadata.footnotes.length) {
    const refHtml = metadata.footnotes.map((f, i) =>
      `<li id="cite_note-${f.id}"><a href="#cite_ref-${f.id}">↑</a> ${f.text}</li>`
    ).join('');
    
    // Replace placeholder or append
    if (html.includes('<div class="reflist-placeholder"></div>')) {
      html = html.replace('<div class="reflist-placeholder"></div>', 
        `<div class="reflist"><h2>References</h2><ol>${refHtml}</ol></div>`);
    } else {
      html += `\n<div class="reflist"><h2>References</h2><ol>${refHtml}</ol></div>`;
    }
  }
  
  // Wrap in content container
  html = `<div class="markup-content">${html}</div>`;
  
  return { html, metadata, styles: DEFAULT_STYLES };
};

// ========== VISUAL EDITOR COMMANDS ==========
const EditorCommands: Record < string, EditorCommand > = {
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
    execute: (selection: string, page ? : string) => {
      if (page && page !== selection) {
        return `[[${page}|${selection}]]`;
      }
      return `[[${selection}]]`;
    }
  },
  externalLink: {
    name: 'externalLink',
    execute: (url: string, text ? : string) => {
      if (text) return `[${url} ${text}]`;
      return `[${url}]`;
    }
  },
  image: {
    name: 'image',
    execute: (filename: string, options ? : string) => {
      if (options) return `[[File:${filename}|${options}]]`;
      return `[[File:${filename}]]`;
    }
  },
  thumbnail: {
    name: 'thumbnail',
    execute: (filename: string, caption ? : string, size ? : string) => {
      const opts = ['thumb'];
      if (size) opts.push(size);
      if (caption) opts.push(caption);
      return `[[File:${filename}|${opts.join('|')}]]`;
    }
  },
  video: {
    name: 'video',
    execute: (filename: string, caption ? : string) => {
      if (caption) return `[[Media:${filename}|${caption}]]`;
      return `[[Media:${filename}]]`;
    }
  },
  audio: {
    name: 'audio',
    execute: (filename: string, caption ? : string) => {
      if (caption) return `[[Media:${filename}|${caption}]]`;
      return `[[Media:${filename}]]`;
    }
  },
  codeBlock: {
    name: 'codeBlock',
    execute: (code: string, language ? : string) => {
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
  nestedList: {
    name: 'nestedList',
    execute: (items: Array < { text: string;level: number;ordered ? : boolean } > ) => {
      return items.map(item => {
        const marker = item.ordered ? '#' : '*';
        const prefix = marker.repeat(item.level + 1);
        return `${prefix} ${item.text}`;
      }).join('\n');
    }
  },
  definitionList: {
    name: 'definitionList',
    execute: (items: Array < { term: string;desc: string } > ) =>
      items.map(item => `; ${item.term}\n: ${item.desc}`).join('\n')
  },
  table: {
    name: 'table',
    execute: (headers: string[], rows: string[][], caption ? : string, cssClass ? : string) => {
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
    execute: (name: string, params ? : Record < string, string > ) => {
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
  superscript: {
    name: 'superscript',
    execute: (selection: string) => `<sup>${selection}</sup>`
  },
  subscript: {
    name: 'subscript',
    execute: (selection: string) => `<sub>${selection}</sub>`
  },
  small: {
    name: 'small',
    execute: (selection: string) => `<small>${selection}</small>`
  },
  reference: {
    name: 'reference',
    execute: (text: string, name ? : string) => {
      if (name) return `<ref name="${name}">${text}</ref>`;
      return `<ref>${text}</ref>`;
    }
  },
  referenceReuse: {
    name: 'referenceReuse',
    execute: (name: string) => `<ref name="${name}" />`
  },
  refList: {
    name: 'refList',
    execute: () => '{{reflist}}'
  },
  comment: {
    name: 'comment',
    execute: (text: string) => `<!-- ${text} -->`
  }
};

// Apply editor command to text
const applyEditorCommand = (
  text: string,
  command: string,
  selectionStart: number,
  selectionEnd: number,
  ...args: any[]
): { text: string;newSelectionStart: number;newSelectionEnd: number } => {
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

// Utility: Generate anchor ID from text
const generateAnchorId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F_-]/g, '');
};

// Utility: Strip markup from text (for plaintext extraction)
const stripMarkup = (text: string): string => {
  let plain = text;
  
  // Remove comments
  plain = plain.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove templates
  plain = plain.replace(/\{\{[^}]+\}\}/g, '');
  
  // Remove references
  plain = plain.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '');
  plain = plain.replace(/<ref[^>]*\/>/g, '');
  
  // Remove code blocks
  plain = plain.replace(/<syntaxhighlight[^>]*>[\s\S]*?<\/syntaxhighlight>/gi, '');
  plain = plain.replace(/<source[^>]*>[\s\S]*?<\/source>/gi, '');
  
  // Remove media
  plain = plain.replace(/\[\[File:[^\]]+\]\]/gi, '');
  plain = plain.replace(/\[\[Media:[^\]]+\]\]/gi, '');
  
  // Remove links but keep text
  plain = plain.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
  plain = plain.replace(/\[\[([^\]]+)\]\]/g, '$1');
  plain = plain.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2');
  plain = plain.replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1');
  
  // Remove formatting
  plain = plain.replace(/'''''(.+?)'''''/g, '$1');
  plain = plain.replace(/'''(.+?)'''/g, '$1');
  plain = plain.replace(/''(.+?)''/g, '$1');
  plain = plain.replace(/<[^>]+>/g, '');
  
  // Remove headings markers
  plain = plain.replace(/^={1,6}\s*(.+?)\s*={1,6}$/gm, '$1');
  
  // Remove list markers
  plain = plain.replace(/^[\*#:;]+\s*/gm, '');
  
  // Remove horizontal rules
  plain = plain.replace(/^----+$/gm, '');
  
  return plain.trim();
};

// Utility: Count words in markup
const countWords = (text: string): number => {
  const plain = stripMarkup(text);
  return plain.split(/\s+/).filter(word => word.length > 0).length;
};

// Utility: Validate markup syntax
const validateMarkup = (text: string): Array<{ line: number; message: string; severity: 'error' | 'warning' }> => {
  const issues: Array<{ line: number; message: string; severity: 'error' | 'warning' }> = [];
  const lines = text.split('\n');
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    // Check for unclosed tags
    const openTags = line.match(/<(code|math|ref|syntaxhighlight|source)(?:\s[^>]*)?>(?![\s\S]*<\/\1>)/g);
    if (openTags) {
      issues.push({
        line: lineNum,
        message: `Unclosed tag detected: ${openTags[0]}`,
        severity: 'error'
      });
    }
    
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

// Export functions and constants

// Export functions and constants
export {
  parseMarkup,
  EditorCommands,
  applyEditorCommand,
  generateAnchorId,
  stripMarkup,
  countWords,
  validateMarkup,
  DEFAULT_STYLES,
  type ParseResult,
  type EditorCommand
};