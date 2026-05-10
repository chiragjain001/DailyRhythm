import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the public site URL from env, falling back to the current Vercel domain
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mindsync-five.vercel.app';
  const currentDate = new Date();

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
