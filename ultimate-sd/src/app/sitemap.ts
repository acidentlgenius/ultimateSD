import { MetadataRoute } from 'next'
import { PROBLEMS } from '@/lib/problems'
import { getAllGuides } from '@/content/guides'
import { getPublishedBlogPosts } from '@/lib/blog-posts'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const problemUrls = PROBLEMS.map((problem) => ({
        url: `${SITE_URL}/practice/${problem.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const guideUrls = getAllGuides().map((guide) => ({
        url: `${SITE_URL}/guides/${guide.metadata.slug}`,
        lastModified: new Date(guide.metadata.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    const blogPosts = await getPublishedBlogPosts()
    const blogUrls = blogPosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${SITE_URL}/roadmap`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/problems`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/guides`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...guideUrls,
        ...blogUrls,
        ...problemUrls,
    ]
}
export const dynamic = 'force-dynamic';
