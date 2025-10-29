// Editor Utility Functions

import DOMPurify from 'dompurify';
import { Citation } from '@/types/editor.types';

// Sanitize HTML
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'div', 'span', 'iframe', 'sup',
      'style', 'link', 'sub', 'hr', 'blockquote', 'cite', 'abbr', 'mark'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'width', 'height', 'style', 'class',
      'contenteditable', 'data-table-id', 'colspan', 'border',
      'frameborder', 'allowfullscreen', 'id', 'title',
      'data-cite-id', 'data-footnote-id'
    ],
    ALLOW_DATA_ATTR: true,
  });
};

// Calculate text statistics
export const calculateTextStats = (content: string) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const chars = text.length;
  const readTime = Math.ceil(words.length / 200);
  
  return {
    wordCount: words.length,
    characterCount: chars,
    readingTime: readTime,
  };
};

// Generate references section from citations
export const generateReferencesSection = (citations: Citation[]): string => {
  if (citations.length === 0) return '';
  
  const refsHTML = citations.map((cite, index) => {
    let refText = `<li id="cite-${cite.id}">`;
    
    if (cite.author) refText += `${sanitizeHTML(cite.author)}. `;
    if (cite.title) refText += `"${sanitizeHTML(cite.title)}". `;
    if (cite.url) refText += `<a href="${encodeURI(cite.url)}" target="_blank">${sanitizeHTML(cite.url)}</a>. `;
    if (cite.date) refText += `Retrieved ${sanitizeHTML(cite.date)}.`;
    
    refText += `</li>`;
    return refText;
  }).join('');
  
  return `
    <h2>References</h2>
    <ol class="references-list" style="font-size: 0.9em; line-height: 1.6;">
      ${refsHTML}
    </ol>
  `;
};

// Generate unique citation ID
export const generateCitationId = (): string => {
  return `cite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};