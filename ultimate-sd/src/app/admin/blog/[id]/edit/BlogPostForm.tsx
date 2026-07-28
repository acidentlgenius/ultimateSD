'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BlogEditor, type BlogEditorHandle } from '@/components/blog-editor/BlogEditor';
import { uploadImageToCloudinary } from '@/lib/cloudinary-upload-client';
import { updateBlogPost, publishBlogPost } from '@/app/actions/blog';
import type { BlogPostDetail } from '@/lib/blog-posts';

export function BlogPostForm({ post }: { post: BlogPostDetail }) {
  const router = useRouter();
  const editorRef = useRef<BlogEditorHandle>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '');
  const [coverImage, setCoverImage] = useState<string | null>(post.coverImage);
  const [isPremium, setIsPremium] = useState(post.isPremium);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(post.seoDescription ?? '');
  const [isSaving, startSaving] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  const buildInput = () => ({
    title,
    excerpt,
    coverImage,
    content: editorRef.current?.getJSON() ?? post.content,
    isPremium,
    seoTitle,
    seoDescription,
  });

  const handleSaveDraft = () => {
    startSaving(async () => {
      const result = await updateBlogPost(post.id, buildInput());
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Draft saved');
        router.refresh();
      }
    });
  };

  const handlePublish = () => {
    startPublishing(async () => {
      const saveResult = await updateBlogPost(post.id, buildInput());
      if ('error' in saveResult) {
        toast.error(saveResult.error);
        return;
      }
      const publishResult = await publishBlogPost(post.id);
      if ('error' in publishResult) {
        toast.error(publishResult.error);
        return;
      }
      toast.success('Published');
      router.refresh();
    });
  };

  const handleCoverUpload = async (file: File) => {
    try {
      const { url } = await uploadImageToCloudinary(file);
      setCoverImage(url);
    } catch {
      toast.error('Cover image upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'outline'}>{post.status}</Badge>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isSaving} onClick={handleSaveDraft}>
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button disabled={isPublishing} onClick={handlePublish}>
            {isPublishing ? 'Publishing…' : post.status === 'PUBLISHED' ? 'Save & update' : 'Publish'}
          </Button>
        </div>
      </div>

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="text-xl font-semibold" />
      <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short excerpt for the listing card" />

      <div className="flex items-center gap-3">
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleCoverUpload(file);
            e.target.value = '';
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
          {coverImage ? 'Replace cover image' : 'Upload cover image'}
        </Button>
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="Cover preview" className="h-12 w-20 rounded object-cover" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isPremium} onCheckedChange={setIsPremium} id="is-premium" />
        <label htmlFor="is-premium" className="text-sm text-muted-foreground">
          Mark as premium (not yet enforced)
        </label>
      </div>

      <BlogEditor ref={editorRef} initialContent={post.content} />

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-semibold">SEO</p>
        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO title" />
        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO description" />
      </div>
    </div>
  );
}
