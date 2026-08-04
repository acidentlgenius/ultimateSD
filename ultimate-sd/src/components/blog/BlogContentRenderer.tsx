'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import { blogEditorExtensions } from '@/components/blog-editor/extensions';

export function BlogContentRenderer({ content }: { content: unknown }) {
  const editor = useEditor({
    extensions: blogEditorExtensions,
    content: content ?? { type: 'doc', content: [] },
    editable: false,
    immediatelyRender: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} className="prose prose-zinc max-w-none dark:prose-invert" />;
}
