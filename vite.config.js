import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/Flag_Guesser/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
