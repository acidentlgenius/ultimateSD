/**
 * Minimal, dependency-free markdown-to-HTML converter for guide content.
 * Supports: paragraphs, ###/#### headings, -/1. lists, `code`, **bold**,
 * *italic*, and [text](url) links. Input is escaped, so authored content
 * cannot inject raw HTML.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

export function markdownToHtml(markdown: string): string {
  const blocks = markdown.trim().split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) return '';
      if (lines.every((line) => line.startsWith('- '))) {
        return `<ul>${lines.map((line) => `<li>${renderInline(line.slice(2))}</li>`).join('')}</ul>`;
      }
      if (lines.every((line) => /^\d+\.\s/.test(line))) {
        return `<ol>${lines.map((line) => `<li>${renderInline(line.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>`;
      }
      if (lines.length === 1 && lines[0].startsWith('#### ')) {
        return `<h4>${renderInline(lines[0].slice(5))}</h4>`;
      }
      if (lines.length === 1 && lines[0].startsWith('### ')) {
        return `<h3>${renderInline(lines[0].slice(4))}</h3>`;
      }
      return `<p>${lines.map(renderInline).join('<br />')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}
