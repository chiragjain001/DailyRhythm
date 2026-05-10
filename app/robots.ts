import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mindsync-five.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/agenda/',
        '/habits/',
        '/wellness/',
        '/account/',
        '/setup-profile/',
        '/api/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
