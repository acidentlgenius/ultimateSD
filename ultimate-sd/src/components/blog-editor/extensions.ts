import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { BlogImage } from './blog-image-node';

export const blogEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({ openOnClick: false, autolink: true }),
  BlogImage,
];
