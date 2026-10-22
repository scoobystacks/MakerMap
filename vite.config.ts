import { defineConfig } from 'vite';

// On GitHub Pages the site is served from /<repo-name>/ unless a custom
// domain is configured. Override with BASE_PATH=/ for a root deploy.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/MakerMap/',
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
