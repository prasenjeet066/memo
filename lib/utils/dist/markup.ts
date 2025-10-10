const parseMarkup = (text) => {
    let html = text;
    const metadata = {
        images: [],
        videos: [],
        links: [],
        headings: []
    };
    
    // Escape HTML helper
    const escapeHtml = (str) =>
        str.replace(/[&<>'"]/g, (tag) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        } [tag]));
    
    // ========== HEADINGS ==========
    for (let i = 6; i >= 1; i--) {
        const pattern = new RegExp(`^#{${i}}\\s+(.+?)(?:\\s+\\{#(.+?)\\})?$`, "gm");
        html = html.replace(pattern, (m, text, id) => {
            const anchorId = id || text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            metadata.headings.push({ level: i, text, id: anchorId });
            return `<h${i} id="${anchorId}">${text}</h${i}>`;
        });
    }
    
    // ========== MEDIA ==========
    html = html.replace(/!\[video\]\((.+?)\)(?:\{(.+?)\})?/g, (m, src, attrs) => {
        metadata.videos.push(src);
        const attributes = parseAttributes(attrs);
        return `<video src="${src}" controls ${attributes} class="media-video"></video>`;
    });
    
    html = html.replace(/!\[audio\]\((.+?)\)(?:\{(.+?)\})?/g, (m, src, attrs) => {
        const attributes = parseAttributes(attrs);
        return `<audio src="${src}" controls ${attributes} class="media-audio"></audio>`;
    });
    
    // YouTube Embed: [!youtube](VIDEO_ID)
    html = html.replace(/\[!youtube\]\(([^)]+)\)/g, (m, id) => {
        return `<iframe class="youtube-embed" width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
    });
    
    // Figure images
    html = html.replace(/!\[([^\]]*)\]\((.+?)\)\{figure\}/g, (m, alt, src) => {
        metadata.images.push({ src, alt });
        return `<figure><img src="${src}" alt="${alt}" class="media-image" loading="lazy"><figcaption>${alt}</figcaption></figure>`;
    });
    
    // Normal images
    html = html.replace(/!\[([^\]]*)\]\((.+?)\)(?:\{(.+?)\})?/g, (m, alt, src, attrs) => {
        metadata.images.push({ src, alt });
        const attributes = parseAttributes(attrs);
        return `<img src="${src}" alt="${alt}" ${attributes} class="media-image" loading="lazy">`;
    });
    
    // ========== CALLOUTS ==========
    html = html.replace(/!!!\s*(info|warning|success|error|note|tip)\n([\s\S]*?)\n!!!/g, (m, type, content) => {
        const colors = {
            info: 'bg-blue-50 border-blue-400 text-blue-900',
            warning: 'bg-yellow-50 border-yellow-400 text-yellow-900',
            success: 'bg-green-50 border-green-400 text-green-900',
            error: 'bg-red-50 border-red-400 text-red-900',
            note: 'bg-purple-50 border-purple-400 text-purple-900',
            tip: 'bg-teal-50 border-teal-400 text-teal-900'
        };
        const icons = { info: 'ℹ️', warning: '⚠️', success: '✅', error: '❌', note: '📝', tip: '💡' };
        return `<div class="alert ${colors[type]} border-l-4 p-4 my-4" role="alert"><strong>${icons[type]} ${type.toUpperCase()}</strong><br>${content.trim()}</div>`;
    });
    
    // ========== SPOILER / DETAILS ==========
    html = html.replace(/\?\?\?\s*(.+)\n([\s\S]*?)\n\?\?\?/g, (m, summary, body) => {
        return `<details class="spoiler"><summary>${summary}</summary><div>${body.trim()}</div></details>`;
    });
    
    // ========== CODE BLOCKS ==========
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) =>
        `<pre class="code-block language-${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`
    );
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // ========== TABLES ==========
    html = html.replace(/^\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm, (m, header, rows) => {
        const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
        const rowsHtml = rows.trim().split('\n').map(row => {
            const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<table class="markup-table"><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });
    
    // ========== MATH ==========
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, '<div class="math-block">$1</div>');
    html = html.replace(/\$([^\$\n]+)\$/g, '<span class="math-inline">$1</span>');
    
    // ========== QUOTES ==========
    html = html.replace(/^(>+)\s+(.+?)(?:\n>\s*--\s*(.+))?$/gm, (m, arrows, text, cite) => {
        const level = arrows.length;
        if (cite) return `<blockquote cite="${cite}" style="margin-left:${(level - 1) * 20}px"><p>${text}</p><footer>— ${cite}</footer></blockquote>`;
        return `<blockquote style="margin-left:${(level - 1) * 20}px"><p>${text}</p></blockquote>`;
    });
    
    // ========== HORIZONTAL RULES ==========
    html = html.replace(/^(---+|\*\*\*+|___+)$/gm, '<hr class="divider">');
    
    // ========== LINKS ==========
    html = html.replace(/\[([^\]]+)\]\(([^)]+?)\s*"([^"]+)"\s*\{([^}]+)\}\)/g, (m, text, url, title, attrs) => {
        metadata.links.push(url);
        return `<a href="${url}" title="${title}" ${attrs}>${text}</a>`;
    });
    html = html.replace(/\[([^\]]+)\]\(([^)]+?)\s*"([^"]+)"\)/g, (m, text, url, title) => {
        metadata.links.push(url);
        return `<a href="${url}" title="${title}">${text}</a>`;
    });
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, url) => {
        metadata.links.push(url);
        return `<a href="${url}">${text}</a>`;
    });
    html = html.replace(/<(https?:\/\/[^>]+)>/g, (m, url) => {
        metadata.links.push(url);
        return `<a href="${url}">${url}</a>`;
    });
    
    // ========== INLINE FORMATTING ==========
    html = html
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/==(.+?)==/g, '<mark>$1</mark>')
        .replace(/%%(.+?)%%/g, '<span class="highlight">$1</span>')
        .replace(/\+\+(.+?)\+\+/g, '<ins>$1</ins>')
        .replace(/\^(.+?)\^/g, '<sup>$1</sup>')
        .replace(/~(.+?)~/g, '<sub>$1</sub>')
        .replace(/::(.+?)::/g, '<small>$1</small>')
        .replace(/\{\{(.+?)\}\}/g, '<kbd>$1</kbd>');
    
    // ========== EMOJIS ==========
    const emojiMap = { smile: '😄', rocket: '🚀', heart: '❤️', fire: '🔥', star: '⭐', thumbs_up: '👍' };
    html = html.replace(/:([a-z_]+):/g, (m, name) => `<span class="emoji">${emojiMap[name] || name}</span>`);
    
    // ========== FOOTNOTES ==========
    const footnotes = [];
    html = html.replace(/^\[\^(\w+)\]:\s+(.+)$/gm, (m, id, text) => {
        footnotes.push({ id, text });
        return '';
    });
    html = html.replace(/\[\^(\w+)\]/g, (m, id) => {
        const idx = footnotes.findIndex(f => f.id === id);
        return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">[${idx + 1}]</a></sup>`;
    });
    
    // ========== REFERENCES ==========
    html = html.replace(/\[@(.+?)\]/g, '<cite>$1</cite>');
    
    // ========== PARAGRAPHS ==========
    html = html
        .split(/\n{2,}/)
        .map(para => {
            if (!para.trim()) return '';
            if (para.match(/^<(h[1-6]|table|pre|div|blockquote|hr|ul|ol|dl|figure|details)/)) return para;
            return `<p>${para.trim()}</p>`;
        })
        .join('\n');
    
    // ========== FOOTNOTE SECTION ==========
    if (footnotes.length) {
        const fhtml = footnotes.map((f, i) =>
            `<li id="fn-${f.id}">${f.text} <a href="#fnref-${f.id}" class="footnote-backref">↩</a></li>`).join('');
        html += `<section class="footnotes"><h2>Footnotes</h2><ol>${fhtml}</ol></section>`;
    }
    
    // ========== TABLE OF CONTENTS ==========
    if (metadata.headings.length > 0) {
        const toc = metadata.headings.map(h => `<li class="toc-level-${h.level}"><a href="#${h.id}">${h.text}</a></li>`).join('');
        html = `<nav class="table-of-contents"><strong>Table of Contents</strong><ul>${toc}</ul></nav>\n${html}`;
    }
    
    return { html, metadata };
};

// Attribute parser helper
const parseAttributes = (attrs) => {
    if (!attrs) return '';
    return attrs.split(/\s+/).map(pair => {
        const [key, val] = pair.split('=');
        return val ? `${key}="${val.replace(/"/g, '')}"` : key;
    }).join(' ');
};
