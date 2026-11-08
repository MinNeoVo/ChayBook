import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const local = p => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  root: local('./'),
  base: '/',
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { outDir: 'dist', emptyOutDir: false }
});
