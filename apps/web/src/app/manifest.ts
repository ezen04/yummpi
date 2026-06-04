import type { MetadataRoute } from 'next';

// PWA manifest — display:standalone, 홈 화면 설치
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GatherFlow',
    short_name: 'GatherFlow',
    description: '모임 장소 선정·투표·정산을 한 번에',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b5bdb',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
