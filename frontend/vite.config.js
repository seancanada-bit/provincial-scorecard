import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/provincial-scorecard/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
