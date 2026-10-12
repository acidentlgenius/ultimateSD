"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  PencilRuler,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { blogEditorExtensions } from "./extensions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload-client";

export type BlogEditorHandle = {
  getJSON: () => unknown;
};

interface BlogEditorProps {
  initialContent: unknown;
}

export const BlogEditor = forwardRef<BlogEditorHandle, BlogEditorProps>(
  function BlogEditor({ initialContent }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
      extensions: blogEditorExtensions,
      content: initialContent ?? { type: "doc", content: [] },
      immediatelyRender: false,
    });

    useImperativeHandle(ref, () => ({
      getJSON: () => editor?.getJSON() ?? { type: "doc", content: [] },
    }));

    if (!editor) return null;

    const insertImage = async (file: File) => {
      try {
        const alt =
          window.prompt(
            "Describe this image for accessibility (alt text):",
            "",
          ) ?? "";
        const { url } = await uploadImageToCloudinary(file);
        editor.chain().focus().setImage({ src: url, alt }).run();
      } catch {
        toast.error("Image upload failed. Please try again.");
      }
    };

    return (
      <div className="rounded-lg border transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await insertImage(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-1 border-b p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Heading 2"
            title="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Heading 3"
            title="Heading 3"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Bold"
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Italic"
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Bullet List"
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Ordered List"
            title="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Blockquote"
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Code Block"
            title="Code Block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Insert Image"
            title="Insert Image"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Insert Excalidraw"
            title="Insert Excalidraw"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "excalidrawEmbed",
                  attrs: { scene: null },
                })
                .run()
            }
          >
            <PencilRuler className="h-4 w-4" />
          </Button>
        </div>
        <EditorContent
          editor={editor}
          className="prose prose-zinc max-w-none px-4 py-3 dark:prose-invert [&_.ProseMirror]:outline-none"
        />
      </div>
    );
  },
);
