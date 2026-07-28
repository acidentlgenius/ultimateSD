import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ExcalidrawEmbedNodeView } from './ExcalidrawEmbedNodeView';

export const ExcalidrawEmbed = Node.create({
  name: 'excalidrawEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      scene: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="excalidraw-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'excalidraw-embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawEmbedNodeView);
  },
});
