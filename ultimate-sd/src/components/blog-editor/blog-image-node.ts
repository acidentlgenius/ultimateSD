import Image from '@tiptap/extension-image';

export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: '',
        renderHTML: (attributes: { alt?: string }) => ({ alt: attributes.alt || '' }),
      },
    };
  },
});
