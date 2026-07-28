import StarterKit from '@tiptap/starter-kit';
import { BlogImage } from './blog-image-node';
import { ExcalidrawEmbed } from './excalidraw-node';

export const blogEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true },
  }),
  BlogImage,
  ExcalidrawEmbed,
];
