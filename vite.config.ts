import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Add your live URLs here so they appear in the sitemap
    const routes = ['/', '/products', '/booking', '/contact']; 

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        },
      },
      plugins: [
        react(),
        Sitemap({ 
            hostname: 'https://e-bricks.vercel.app', // Your Vercel URL
            dynamicRoutes: routes,
            generateRobotsTxt: true, // This creates robots.txt for you too!
            readable: true 
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Fixed to point to ./src for better practice
        }
      }
    };
});