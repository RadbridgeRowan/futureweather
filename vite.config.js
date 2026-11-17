import { defineConfig } from 'vite';
import sitePlugin from './scripts/site-plugin.js';

// https://vitejs.dev/config/
//
// Pages are found automatically by scripts/site-plugin.js (every folder index.html plus root .html
// files), which also adds canonical/Open Graph tags and writes sitemap.xml and llms.txt.
// See SEO.md.
export default defineConfig({
  base: '/',
  plugins: [sitePlugin()],
});
