import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        index2: resolve(__dirname, 'index2.html'),
      },
    },
  },
  // You can add other Vite options here if needed
}); 