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
}

interface EditorCommand {
  name: string;
  execute: (selection: string, ...args: any[]) => string;
}

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
  
  // Enhanced HTML escape
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
  
  // ========== HEADINGS (MediaWiki style: ==Title==) ==========
  for (let i = 6; i >= 1; i--) {
    const equals = '='.repeat(i);
    const pattern = new RegExp(`^${equals}([^=]+?)${equals}\\s*$`, 'gm');
    html = html.replace(pattern, (m, text) => {
      const trimmedText = text.trim();
      const anchorId = trimmedText.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\u00C0-\u024F-]/g, '');
      metadata.headings.push({ level: i, text: trimmedText, id: anchorId });
      return `<h${i} id="${anchorId}">${trimmedText}</h${i}>`;
    });
  }
  
  // ========== TEMPLATES ==========
  html = html.replace(/\{\{([^|}\n]+)(?:\|([^}]+))?\}\}/g, (m, name, params) => {
    const templateName = name.trim();
    const templateParams: Record<string, string> = {};
    
    if (params) {
      params.split('|').forEach((param: string, idx: number) => {
        const [key, val] = param.includes('=') 
          ? param.split('=').map(s => s.trim())
          : [idx.toString(), param.trim()];
        templateParams[key] = val;
      });
    }
    
    metadata.templates.push({ name: templateName, params: templateParams });
    
    // Handle common templates
    if (templateName.toLowerCase() === 'reflist') {
      return '<div class="reflist"></div>';
    }
    
    return `<div class="template" data-template="${templateName}">${Object.entries(templateParams).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>`;
  });
  
  // ========== MEDIA ==========
  // [[File:image.jpg|thumb|Caption]]
  html = html.replace(/\[\[File:([^|\]]+)(?:\|([^\]]+))?\]\]/gi, (m, filename, options) => {
    let alt = '';
    let attrs = '';
    let isThumb = false;
    let caption = '';
    let size = '';
    
    if (options) {
      const parts = options.split('|');
      parts.forEach(part => {
        const p = part.trim();
        if (p === 'thumb' || p === 'thumbnail') isThumb = true;
        else if (p === 'left' || p === 'right' || p === 'center') attrs += ` align="${p}"`;
        else if (p.match(/^\d+px$/)) size = p;
        else caption = p;
      });
    }
    
    metadata.images.push({ src: filename, alt: caption || filename });
    
    if (isThumb) {
      return `<figure class="thumb ${attrs}"><img src="${filename}" alt="${escapeHtml(caption)}" ${size ? `width="${size.replace('px', '')}"` : ''} class="media-image" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
    }
    
    return `<img src="${filename}" alt="${escapeHtml(caption)}" ${attrs} ${size ? `width="${size.replace('px', '')}"` : ''} class="media-image" loading="lazy">`;
  });
  
  // [[Media:video.mp4]]
  html = html.replace(/\[\[Media:([^|\]]+\.(?:mp4|webm|ogv))(?:\|([^\]]+))?\]\]/gi, (m, filename, caption) => {
    metadata.videos.push(filename);
    return `<video src="${filename}" controls class="media-video">${caption || ''}</video>`;
  });
  
  // [[Media:audio.mp3]]
  html = html.replace(/\[\[Media:([^|\]]+\.(?:mp3|ogg|wav))(?:\|([^\]]+))?\]\]/gi, (m, filename, caption) => {
    return `<audio src="${filename}" controls class="media-audio">${caption || ''}</audio>`;
  });
  
  // ========== CALLOUTS/BOXES ==========
  html = html.replace(/\{\|([^}]+)\|\}/gs, (m, content) => {
    // Simple box implementation
    return `<div class="mw-box">${content.trim()}</div>`;
  });
  
  // ========== CODE BLOCKS ==========
  // <syntaxhighlight lang="python">code</syntaxhighlight>
  html = html.replace(/<syntaxhighlight(?:\s+lang="(\w+)")?\s*>([\s\S]*?)<\/syntaxhighlight>/gi, (m, lang, code) => {
    return `<pre class="code-block language-${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // <source lang="python">code</source>
  html = html.replace(/<source(?:\s+lang="(\w+)")?\s*>([\s\S]*?)<\/source>/gi, (m, lang, code) => {
    return `<pre class="code-block language-${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // <code>inline</code>
  const inlineCodePlaceholders: string[] = [];
  html = html.replace(/<code>([^<]+)<\/code>/g, (m, code) => {
    const idx = inlineCodePlaceholders.length;
    inlineCodePlaceholders.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_${idx}__`;
  });
  
  // ========== TABLES ==========
  // {| class="wikitable"
  // |+ Caption
  // ! Header1 !! Header2
  // |-
  // | Cell1 || Cell2
  // |}
  html = html.replace(/\{\|([^\n]*)\n([\s\S]*?)\n\|\}/gm, (m, tableAttrs, content) => {
    let caption = '';
    let headers = '';
    let rows = '';
    
    const lines = content.split('\n');
    let currentRow: string[] = [];
    let isHeader = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('|+')) {
        caption = trimmed.substring(2).trim();
      } else if (trimmed.startsWith('!')) {
        isHeader = true;
        const cells = trimmed.substring(1).split(/\s*!!\s*/);
        headers = cells.map(c => `<th>${c.trim()}</th>`).join('');
      } else if (trimmed === '|-') {
        if (currentRow.length) {
          rows += `<tr>${currentRow.join('')}</tr>`;
          currentRow = [];
        }
      } else if (trimmed.startsWith('|')) {
        const cells = trimmed.substring(1).split(/\s*\|\|\s*/);
        currentRow.push(...cells.map(c => `<td>${c.trim()}</td>`));
      }
    }
    
    if (currentRow.length) {
      rows += `<tr>${currentRow.join('')}</tr>`;
    }
    
    const captionHtml = caption ? `<caption>${caption}</caption>` : '';
    const headersHtml = headers ? `<thead><tr>${headers}</tr></thead>` : '';
    
    return `<table class="wikitable ${tableAttrs.trim()}">${captionHtml}${headersHtml}<tbody>${rows}</tbody></table>`;
  });
  
  // ========== MATH ==========
  const mathBlockPlaceholders: string[] = [];
  html = html.replace(/<math>([\s\S]+?)<\/math>/g, (m, tex) => {
    const idx = mathBlockPlaceholders.length;
    mathBlockPlaceholders.push(`<span class="math-inline" data-tex="${escapeHtml(tex.trim())}">${escapeHtml(tex.trim())}</span>`);
    return `__MATH_BLOCK_${idx}__`;
  });
  
  // ========== HORIZONTAL RULES ==========
  html = html.replace(/^----+$/gm, '<hr class="divider">');
  
  // ========== LISTS ==========
  // * unordered
  // # ordered
  // : definition
  // ; definition term
  html = html.replace(/^([\*#:;]+)\s*(.+)$/gm, (m, markers, text) => {
    const level = markers.length - 1;
    const lastMarker = markers[markers.length - 1];
    
    if (lastMarker === '*') {
      return `<li class="list-item" data-level="${level}">${text}</li>`;
    } else if (lastMarker === '#') {
      return `<li class="list-item ordered" data-level="${level}">${text}</li>`;
    } else if (lastMarker === ';') {
      return `<dt class="definition-term">${text}</dt>`;
    } else if (lastMarker === ':') {
      return `<dd class="definition-desc" data-level="${level}">${text}</dd>`;
    }
    return m;
  });
  
  // ========== LINKS ==========
  // External: [http://example.com Link text]
  html = html.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g, (m, url, text) => {
    metadata.links.push(url);
    return `<a href="${url}" class="external">${text || url}</a>`;
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
  
  // <sup>superscript</sup>
  html = html.replace(/<sup>(.+?)<\/sup>/g, '<sup>$1</sup>');
  
  // <sub>subscript</sub>
  html = html.replace(/<sub>(.+?)<\/sub>/g, '<sub>$1</sub>');
  
  // <small>small</small>
  html = html.replace(/<small>(.+?)<\/small>/g, '<small>$1</small>');
  
  // ========== REFERENCES/FOOTNOTES ==========
  // <ref name="refname">Reference text</ref>
  html = html.replace(/<ref(?:\s+name="([^"]+)")?\s*>([\s\S]*?)<\/ref>/g, (m, name, text) => {
    const id = name || `ref-${metadata.footnotes.length + 1}`;
    metadata.footnotes.push({ id, text: text.trim() });
    const idx = metadata.footnotes.length;
    return `<sup class="reference"><a href="#cite_note-${id}" id="cite_ref-${id}">[${idx}]</a></sup>`;
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
  
  // Restore inline code placeholders
  inlineCodePlaceholders.forEach((code, idx) => {
    html = html.replace(`__INLINE_CODE_${idx}__`, code);
  });
  
  // Restore math placeholders
  mathBlockPlaceholders.forEach((math, idx) => {
    html = html.replace(`__MATH_BLOCK_${idx}__`, math);
  });
  
  // ========== PARAGRAPHS ==========
  html = html
    .split(/\n{2,}/)
    .map(para => {
      if (!para.trim()) return '';
      if (para.match(/^<(h[1-6]|table|pre|div|blockquote|hr|ul|ol|dl|figure|details)/)) return para;
      return `<p>${para.trim()}</p>`;
    })
    .join('\n');
  
  // ========== REFERENCES SECTION ==========
  if (metadata.footnotes.length) {
    const refHtml = metadata.footnotes.map((f, i) =>
      `<li id="cite_note-${f.id}"><a href="#cite_ref-${f.id}">↑</a> ${f.text}</li>`
    ).join('');
    html += `<div class="reflist"><h2>References</h2><ol>${refHtml}</ol></div>`;
  }
  
  // ========== TABLE OF CONTENTS ==========
  if (metadata.headings.length >= 3) {
    const toc = metadata.headings.map(h =>
      `<li class="toc-level-${h.level}"><a href="#${h.id}">${h.text}</a></li>`
    ).join('');
    html = `<div id="toc" class="toc"><div class="toc-title">Contents</div><ul>${toc}</ul></div>\n${html}`;
  }
  
  return { html, metadata };
};

// ========== VISUAL EDITOR COMMANDS ==========

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
      const equals = '='.repeat(Math.max(2, Math.min(6, level)));
      return `${equals} ${selection} ${equals}`;
    }
  },
  
  internalLink: {
    name: 'internalLink',
    execute: (selection: string, page?: string) => {
      if (page) return `[[${page}|${selection}]]`;
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
    execute: (items: string[]) => items.map(item => `* ${item}`).join('\n')
  },
  
  orderedList: {
    name: 'orderedList',
    execute: (items: string[]) => items.map(item => `# ${item}`).join('\n')
  },
  
  definitionList: {
    name: 'definitionList',
    execute: (items: Array<{ term: string; desc: string }>) =>
      items.map(item => `; ${item.term}\n: ${item.desc}`).join('\n')
  },
  
  table: {
    name: 'table',
    execute: (headers: string[], rows: string[][], caption?: string) => {
      let table = '{| class="wikitable"\n';
      if (caption) table += `|+ ${caption}\n`;
      table += `! ${headers.join(' !! ')}\n`;
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

// Export functions
export { parseMarkup, EditorCommands, applyEditorCommand, type ParseResult, type EditorCommand };