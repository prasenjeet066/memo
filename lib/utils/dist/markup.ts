interface ParseResult {
  html: string;
  metadata: {
    images: Array < { src: string;alt: string } > ;
    videos: string[];
    links: string[];
    headings: Array < { level: number;text: string;id: string } > ;
    footnotes: Array < { id: string;text: string } > ;
  };
}

interface EditorCommand {
  name: string;
  execute: (selection: string, ...args: any[]) => string;
}

const parseMarkup = (text: string): ParseResult => {
  let html = text;
  const metadata = {
    images: [] as Array < { src: string;alt: string } > ,
    videos: [] as string[],
    links: [] as string[],
    headings: [] as Array < { level: number;text: string;id: string } > ,
    footnotes: [] as Array < { id: string;text: string } >
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
    } [tag] || tag));
  
  // ========== COMMENTS (strip) ==========
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // ========== HEADINGS ==========
  for (let i = 6; i >= 1; i--) {
    const pattern = new RegExp(`^#{${i}}\\s+(.+?)(?:\\s+\\{#([\\w-]+)\\})?$`, 'gm');
    html = html.replace(pattern, (m, text, id) => {
      const anchorId = id || text.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u00C0-\u024F-]/g, '');
      metadata.headings.push({ level: i, text, id: anchorId });
      return `<h${i} id="${anchorId}">${text}</h${i}>`;
    });
  }
  
  // ========== MEDIA ==========
  html = html.replace(/!\[video\]\((.+?)\)(?:\{([^}]+)\})?/g, (m, src, attrs) => {
    metadata.videos.push(src);
    const attributes = parseAttributes(attrs);
    return `<video src="${src}" controls ${attributes} class="media-video"></video>`;
  });
  
  html = html.replace(/!\[audio\]\((.+?)\)(?:\{([^}]+)\})?/g, (m, src, attrs) => {
    const attributes = parseAttributes(attrs);
    return `<audio src="${src}" controls ${attributes} class="media-audio"></audio>`;
  });
  
  html = html.replace(/\[!youtube\]\(([^)]+)\)/g, (m, id) => {
    const videoId = id.includes('youtube.com') || id.includes('youtu.be') ?
      id.split(/[?&]v=|youtu\.be\//).pop()?.split(/[?&#]/)[0] :
      id;
    return `<iframe class="youtube-embed" width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
  });
  
  html = html.replace(/!\[([^\]]*)\]\((.+?)\)\{figure\}/g, (m, alt, src) => {
    metadata.images.push({ src, alt });
    return `<figure><img src="${src}" alt="${escapeHtml(alt)}" class="media-image" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
  });
  
  html = html.replace(/!\[([^\]]*)\]\((.+?)\)(?:\{([^}]+)\})?/g, (m, alt, src, attrs) => {
    if (attrs === 'figure') return m;
    metadata.images.push({ src, alt });
    const attributes = parseAttributes(attrs);
    return `<img src="${src}" alt="${escapeHtml(alt)}" ${attributes} class="media-image" loading="lazy">`;
  });
  
  // ========== CALLOUTS ==========
  html = html.replace(/!!!\s*(info|warning|success|error|note|tip|danger)\n([\s\S]*?)\n!!!/g, (m, type, content) => {
    const colors: Record < string, string > = {
      info: 'bg-blue-50 border-blue-400 text-blue-900',
      warning: 'bg-yellow-50 border-yellow-400 text-yellow-900',
      success: 'bg-green-50 border-green-400 text-green-900',
      error: 'bg-red-50 border-red-400 text-red-900',
      danger: 'bg-red-50 border-red-500 text-red-900',
      note: 'bg-purple-50 border-purple-400 text-purple-900',
      tip: 'bg-teal-50 border-teal-400 text-teal-900'
    };
    return `<div class="alert ${colors[type]} border-l-4 p-4 my-4" role="alert"><strong>${type.toUpperCase()}</strong><br>${content.trim()}</div>`;
  });
  
  // ========== DETAILS/SPOILER ==========
  html = html.replace(/\?\?\?\s*(.+?)\n([\s\S]*?)\n\?\?\?/g, (m, summary, body) => {
    return `<details class="spoiler"><summary>${summary.trim()}</summary><div class="spoiler-content">${body.trim()}</div></details>`;
  });
  
  // ========== CODE BLOCKS ==========
  html = html.replace(/```(\w+)?(?:\{([^}]+)\})?\n([\s\S]*?)```/g, (m, lang, attrs, code) => {
    const filename = attrs ? `data-filename="${attrs}"` : '';
    return `<pre class="code-block language-${lang || 'text'}" ${filename}><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  
  const inlineCodePlaceholders: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (m, code) => {
    const idx = inlineCodePlaceholders.length;
    inlineCodePlaceholders.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return `__INLINE_CODE_${idx}__`;
  });
  
  // ========== TABLES ==========
  html = html.replace(/^\|(.+)\|\n\|([-:\s|]+)\|\n((?:\|.+\|\n?)+)/gm, (m, header, alignment, rows) => {
    const alignments = alignment.split('|').filter(a => a.trim()).map(a => {
      const trimmed = a.trim();
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
      if (trimmed.endsWith(':')) return 'right';
      return 'left';
    });
    
    const headers = header.split('|').filter(h => h.trim()).map((h, i) =>
      `<th style="text-align:${alignments[i]}">${h.trim()}</th>`
    ).join('');
    
    const rowsHtml = rows.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map((c, i) =>
        `<td style="text-align:${alignments[i]}">${c.trim()}</td>`
      ).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    return `<table class="markup-table"><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
  });
  
  // ========== MATH (using KaTeX via CDN) ==========
  const mathBlockPlaceholders: string[] = [];
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => {
    const idx = mathBlockPlaceholders.length;
    mathBlockPlaceholders.push(`<div class="math-block" data-tex="${escapeHtml(tex.trim())}">${escapeHtml(tex.trim())}</div>`);
    return `__MATH_BLOCK_${idx}__`;
  });
  html = html.replace(/\\\[([\s\S]+?)\\\]/g, (m, tex) => {
    const idx = mathBlockPlaceholders.length;
    mathBlockPlaceholders.push(`<div class="math-block" data-tex="${escapeHtml(tex.trim())}">${escapeHtml(tex.trim())}</div>`);
    return `__MATH_BLOCK_${idx}__`;
  });
  
  const mathInlinePlaceholders: string[] = [];
  html = html.replace(/\$([^\$\n]+?)\$/g, (m, tex) => {
    const idx = mathInlinePlaceholders.length;
    mathInlinePlaceholders.push(`<span class="math-inline" data-tex="${escapeHtml(tex)}">${escapeHtml(tex)}</span>`);
    return `__MATH_INLINE_${idx}__`;
  });
  html = html.replace(/\\\(([^)]+?)\\\)/g, (m, tex) => {
    const idx = mathInlinePlaceholders.length;
    mathInlinePlaceholders.push(`<span class="math-inline" data-tex="${escapeHtml(tex)}">${escapeHtml(tex)}</span>`);
    return `__MATH_INLINE_${idx}__`;
  });
  
  // ========== QUOTES ==========
  html = html.replace(/^(>+)\s+(.+?)(?:\n>\s*--\s*(.+))?$/gm, (m, arrows, text, cite) => {
    const level = arrows.length;
    const margin = (level - 1) * 20;
    if (cite) {
      return `<blockquote cite="${cite}" style="margin-left:${margin}px"><p>${text}</p><footer>— ${cite}</footer></blockquote>`;
    }
    return `<blockquote style="margin-left:${margin}px"><p>${text}</p></blockquote>`;
  });
  
  // ========== HORIZONTAL RULES ==========
  html = html.replace(/^(---+|\*\*\*+|___+)$/gm, '<hr class="divider">');
  
  // ========== LISTS ==========
  html = html.replace(/^(\s*)([-*+])\s+(.+)$/gm, (m, indent, bullet, text) => {
    const level = Math.floor(indent.length / 2);
    return `<li class="list-item" data-level="${level}">${text}</li>`;
  });
  
  html = html.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (m, indent, num, text) => {
    const level = Math.floor(indent.length / 2);
    return `<li class="list-item ordered" data-level="${level}" value="${num}">${text}</li>`;
  });
  
  html = html.replace(/<li class="list-item"[^>]*>\[([ xX])\]\s+(.+)<\/li>/g, (m, check, text) => {
    const checked = check.toLowerCase() === 'x' ? 'checked' : '';
    return `<li class="task-item"><input type="checkbox" ${checked} disabled> ${text}</li>`;
  });
  
  // ========== LINKS ==========
  html = html.replace(/\[([^\]]+)\]\(([^)]+?)\s+"([^"]+)"\s*\{([^}]+)\}\)/g, (m, text, url, title, attrs) => {
    metadata.links.push(url);
    return `<a href="${url}" title="${escapeHtml(title)}" ${attrs}>${text}</a>`;
  });
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+?)\s+"([^"]+)"\)/g, (m, text, url, title) => {
    metadata.links.push(url);
    return `<a href="${url}" title="${escapeHtml(title)}">${text}</a>`;
  });
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
    metadata.links.push(url);
    return `<a href="${url}">${text}</a>`;
  });
  
  html = html.replace(/<(https?:\/\/[^>\s]+)>/g, (m, url) => {
    metadata.links.push(url);
    return `<a href="${url}">${url}</a>`;
  });
  
  // ========== INLINE FORMATTING ==========
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');
  html = html.replace(/%%(.+?)%%/g, '<span class="highlight">$1</span>');
  html = html.replace(/\+\+(.+?)\+\+/g, '<ins>$1</ins>');
  html = html.replace(/\^(.+?)\^/g, '<sup>$1</sup>');
  html = html.replace(/~(.+?)~/g, '<sub>$1</sub>');
  html = html.replace(/::(.+?)::/g, '<small>$1</small>');
  html = html.replace(/\{\{(.+?)\}\}/g, '<kbd>$1</kbd>');
  
  // ========== FOOTNOTES ==========
  html = html.replace(/^\[\^(\w+)\]:\s+(.+)$/gm, (m, id, text) => {
    metadata.footnotes.push({ id, text });
    return '';
  });
  
  html = html.replace(/\[\^(\w+)\]/g, (m, id) => {
    const idx = metadata.footnotes.findIndex(f => f.id === id);
    return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${idx + 1}]</a></sup>`;
  });
  
  // ========== REFERENCES ==========
  html = html.replace(/\[@(.+?)\]/g, '<cite>$1</cite>');
  
  // ========== TYPOGRAPHY ENHANCEMENTS ==========
  html = html.replace(/--/g, '–'); // en-dash
  html = html.replace(/---/g, '—'); // em-dash
  html = html.replace(/\.\.\./g, '…'); // ellipsis
  html = html.replace(/(^|[^\w])'([^']+)'([^\w]|$)/g, '$1'
    $2 '$3'); // smart quotes
  html = html.replace(/(^|[^\w])"([^"]+)"([^\w]|$)/g, '$1"$2"$3'); // smart quotes
  html = html.replace(/(\d+)\s*x\s*(\d+)/gi, '$1×$2'); // multiplication sign
  html = html.replace(/<->/g, '↔'); // bidirectional arrow
  html = html.replace(/->/g, '→'); // right arrow
  html = html.replace(/<-/g, '←'); // left arrow
  html = html.replace(/=>/g, '⇒'); // double right arrow
  html = html.replace(/<=/g, '⇐'); // double left arrow
  html = html.replace(/\(c\)/gi, '©'); // copyright
  html = html.replace(/\(r\)/gi, '®'); // registered
  html = html.replace(/\(tm\)/gi, '™'); // trademark
  
  // Restore inline code placeholders
  inlineCodePlaceholders.forEach((code, idx) => {
    html = html.replace(`__INLINE_CODE_${idx}__`, code);
  });
  
  // Restore math placeholders
  mathBlockPlaceholders.forEach((math, idx) => {
    html = html.replace(`__MATH_BLOCK_${idx}__`, math);
  });
  
  mathInlinePlaceholders.forEach((math, idx) => {
    html = html.replace(`__MATH_INLINE_${idx}__`, math);
  });
  
  // ========== PARAGRAPHS ==========
  html = html
    .split(/\n{2,}/)
    .map(para => {
      if (!para.trim()) return '';
      if (para.match(/^<(h[1-6]|table|pre|div|blockquote|hr|ul|ol|dl|figure|details|nav)/)) return para;
      return `<p>${para.trim()}</p>`;
    })
    .join('\n');
  
  // ========== FOOTNOTE SECTION ==========
  if (metadata.footnotes.length) {
    const fhtml = metadata.footnotes.map((f, i) =>
      `<li id="fn-${f.id}">${f.text} <a href="#fnref-${f.id}" class="footnote-backref">↩</a></li>`
    ).join('');
    html += `<section class="footnotes"><h2>Footnotes</h2><ol>${fhtml}</ol></section>`;
  }
  
  // ========== TABLE OF CONTENTS ==========
  if (metadata.headings.length > 0) {
    const toc = metadata.headings.map(h =>
      `<li class="toc-level-${h.level}"><a href="#${h.id}">${h.text}</a></li>`
    ).join('');
    html = `<nav class="table-of-contents"><strong>Table of Contents</strong><ul>${toc}</ul></nav>\n${html}`;
  }
  
  return { html, metadata };
};

// Helper: Parse attributes
const parseAttributes = (attrs ? : string): string => {
  if (!attrs) return '';
  return attrs.split(/\s+/).map(pair => {
    const [key, val] = pair.split('=');
    return val ? `${key}="${val.replace(/"/g, '')}"` : key;
  }).join(' ');
};

// ========== VISUAL EDITOR COMMANDS ==========

const EditorCommands: Record < string, EditorCommand > = {
  bold: {
    name: 'bold',
    execute: (selection: string) => `**${selection}**`
  },
  
  italic: {
    name: 'italic',
    execute: (selection: string) => `*${selection}*`
  },
  
  strikethrough: {
    name: 'strikethrough',
    execute: (selection: string) => `~~${selection}~~`
  },
  
  underline: {
    name: 'underline',
    execute: (selection: string) => `++${selection}++`
  },
  
  highlight: {
    name: 'highlight',
    execute: (selection: string) => `==${selection}==`
  },
  
  inlineCode: {
    name: 'inlineCode',
    execute: (selection: string) => `\`${selection}\``
  },
  
  heading: {
    name: 'heading',
    execute: (selection: string, level: number = 1) => {
      const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
      return `${hashes} ${selection}`;
    }
  },
  
  link: {
    name: 'link',
    execute: (selection: string, url: string = '', title ? : string) => {
      if (title) return `[${selection}](${url} "${title}")`;
      return `[${selection}](${url})`;
    }
  },
  
  image: {
    name: 'image',
    execute: (alt: string, src: string, attrs ? : string) => {
      if (attrs) return `![${alt}](${src}){${attrs}}`;
      return `![${alt}](${src})`;
    }
  },
  
  figure: {
    name: 'figure',
    execute: (alt: string, src: string) => `![${alt}](${src}){figure}`
  },
  
  video: {
    name: 'video',
    execute: (src: string, attrs ? : string) => {
      if (attrs) return `![video](${src}){${attrs}}`;
      return `![video](${src})`;
    }
  },
  
  audio: {
    name: 'audio',
    execute: (src: string, attrs ? : string) => {
      if (attrs) return `![audio](${src}){${attrs}}`;
      return `![audio](${src})`;
    }
  },
  
  youtube: {
    name: 'youtube',
    execute: (videoId: string) => `[!youtube](${videoId})`
  },
  
  blockquote: {
    name: 'blockquote',
    execute: (selection: string, cite ? : string) => {
      if (cite) return `> ${selection}\n> -- ${cite}`;
      return `> ${selection}`;
    }
  },
  
  codeBlock: {
    name: 'codeBlock',
    execute: (code: string, language: string = '', filename ? : string) => {
      if (filename) return `\`\`\`${language}{${filename}}\n${code}\n\`\`\``;
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }
  },
  
  mathBlock: {
    name: 'mathBlock',
    execute: (latex: string) => `$$\n${latex}\n$$`
  },
  
  mathInline: {
    name: 'mathInline',
    execute: (latex: string) => `$${latex}$`
  },
  
  unorderedList: {
    name: 'unorderedList',
    execute: (items: string[]) => items.map(item => `- ${item}`).join('\n')
  },
  
  orderedList: {
    name: 'orderedList',
    execute: (items: string[]) => items.map((item, i) => `${i + 1}. ${item}`).join('\n')
  },
  
  taskList: {
    name: 'taskList',
    execute: (items: Array < { text: string;checked: boolean } > ) =>
      items.map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`).join('\n')
  },
  
  table: {
    name: 'table',
    execute: (headers: string[], rows: string[][], alignments ? : ('left' | 'center' | 'right')[]) => {
      const headerRow = `| ${headers.join(' | ')} |`;
      const separatorRow = alignments ?
        `| ${alignments.map(a => a === 'center' ? ':---:' : a === 'right' ? '---:' : '---').join(' | ')} |` :
        `| ${headers.map(() => '---').join(' | ')} |`;
      const bodyRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
      return `${headerRow}\n${separatorRow}\n${bodyRows}`;
    }
  },
  
  callout: {
    name: 'callout',
    execute: (content: string, type: 'info' | 'warning' | 'success' | 'error' | 'note' | 'tip' | 'danger' = 'info') => {
      return `!!! ${type}\n${content}\n!!!`;
    }
  },
  
  spoiler: {
    name: 'spoiler',
    execute: (summary: string, content: string) => {
      return `??? ${summary}\n${content}\n???`;
    }
  },
  
  horizontalRule: {
    name: 'horizontalRule',
    execute: () => '---'
  },
  
  superscript: {
    name: 'superscript',
    execute: (selection: string) => `^${selection}^`
  },
  
  subscript: {
    name: 'subscript',
    execute: (selection: string) => `~${selection}~`
  },
  
  small: {
    name: 'small',
    execute: (selection: string) => `::${selection}::`
  },
  
  kbd: {
    name: 'kbd',
    execute: (selection: string) => `{{${selection}}}`
  },
  
  footnote: {
    name: 'footnote',
    execute: (id: string, text ? : string) => {
      if (text) return `[^${id}]\n\n[^${id}]: ${text}`;
      return `[^${id}]`;
    }
  },
  
  citation: {
    name: 'citation',
    execute: (reference: string) => `[@${reference}]`
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

// Export functions
export { parseMarkup, EditorCommands, applyEditorCommand, type ParseResult, type EditorCommand };