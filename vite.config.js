import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const localUrl = env.VITE_API_URL_LOCAL || 'http://localhost:5000';
  const cloudUrl = env.VITE_API_URL_CLOUD || 'https://kinetoscope-backend-tau.vercel.app';

  // Auto-detect which backend is available
  let target = cloudUrl;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${localUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      target = localUrl;
      console.log('Local backend available → using', localUrl);
    } else {
      console.log('Local backend responded but unhealthy → using cloud', cloudUrl);
    }
  } catch {
    console.log('Local backend unavailable → using cloud', cloudUrl);
  }

  return {
    plugins: [react()],
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger']
    } : {},
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
