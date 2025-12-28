import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultimatesd.ai'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/settings/', '/admin/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
