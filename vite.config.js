import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react({
          include: "**/*.{jsx,tsx,js,ts}",
        })
      ],
      esbuild: {
        loader: 'jsx',
        include: /.*\.[jt]sx?$/,
        exclude: []
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            '.js': 'jsx',
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        }
      }
    };
});