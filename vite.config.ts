import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '雀カル - 麻雀点数計算トレーニング',
        short_name: '雀カル',
        description: '麻雀の点数計算をクイズ形式で練習するアプリ',
        theme_color: '#0C1222',
        background_color: '#0C1222',
        display: 'standalone',
        scope: '/jancal/',
        start_url: '/jancal/',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: '/jancal/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
