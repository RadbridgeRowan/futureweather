import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        publicApiPage: resolve(__dirname, 'publicApiPage.html'),
        python: resolve(__dirname, 'python/index.html'),
        revit: resolve(__dirname, 'revit/index.html'),
        grasshopper: resolve(__dirname, 'grasshopper/index.html'),
      },
    },
  },
  // You can add other Vite options here if needed
}); 