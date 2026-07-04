import { describe, expect, it } from 'vitest';
import { markdownToHtml } from '@/lib/markdown';

describe('markdownToHtml', () => {
  it('wraps plain text in a paragraph', () => {
    expect(markdownToHtml('Hello world')).toBe('<p>Hello world</p>');
  });

  it('escapes raw HTML so content cannot inject markup', () => {
    expect(markdownToHtml('<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'
    );
  });

  it('renders inline bold, italic, code, and links', () => {
    const html = markdownToHtml('Use **cache-aside** with a *jittered* `ttl` — see [docs](https://example.com)');
    expect(html).toContain('<strong>cache-aside</strong>');
    expect(html).toContain('<em>jittered</em>');
    expect(html).toContain('<code>ttl</code>');
    expect(html).toContain('<a href="https://example.com">docs</a>');
  });

  it('renders unordered lists', () => {
    const html = markdownToHtml('- first\n- second');
    expect(html).toBe('<ul><li>first</li><li>second</li></ul>');
  });

  it('renders ordered lists', () => {
    const html = markdownToHtml('1. first\n2. second');
    expect(html).toBe('<ol><li>first</li><li>second</li></ol>');
  });

  it('renders h3 and h4 headings', () => {
    expect(markdownToHtml('### Hot keys')).toBe('<h3>Hot keys</h3>');
    expect(markdownToHtml('#### Details')).toBe('<h4>Details</h4>');
  });

  it('splits paragraphs on blank lines and joins soft breaks', () => {
    const html = markdownToHtml('line one\nline two\n\nsecond para');
    expect(html).toBe('<p>line one<br />line two</p>\n<p>second para</p>');
  });

  it('handles mixed content blocks', () => {
    const html = markdownToHtml('### Title\n\nIntro text\n\n- a\n- b');
    expect(html).toBe('<h3>Title</h3>\n<p>Intro text</p>\n<ul><li>a</li><li>b</li></ul>');
  });
});
