// Build both ESM and UMD from a single source
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'btoast', // UMD global name
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'btoast.esm.js' : 'btoast.umd.js'
    },
    rollupOptions: {
      // We reference window.bootstrap at runtime; no direct import here.
      // If you later import 'bootstrap' in code, add it to 'external' and 'globals'.
      // external: ['bootstrap'],
      // output: { globals: { bootstrap: 'bootstrap' } }
    },
    minify: true,
    sourcemap: true
  }
});