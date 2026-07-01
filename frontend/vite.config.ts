import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCALHOST_PROXY_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function assertLocalProxyTarget(target: string) {
  if (!LOCALHOST_PROXY_RE.test(target)) {
    throw new Error('VITE_DEV_API_PROXY must point to localhost in development.');
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const apiProxyTarget = env.VITE_DEV_API_PROXY || 'http://localhost:9000';

  if (mode === 'development') {
    assertLocalProxyTarget(apiProxyTarget);
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
    },
    server: {
      host: '127.0.0.1',
      port: Number(env.VITE_DEV_PORT || 5173),
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/storage': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
