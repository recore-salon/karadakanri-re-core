import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'あるもんメンテナンス Re:Stock',
    short_name: 'Re:Stock',
    description: '家にある食材で、今日のごはんを決める',
    start_url: '/home',
    display: 'standalone',
    background_color: '#F8F6F2',
    theme_color: '#E07B5A',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
