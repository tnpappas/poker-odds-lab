import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // The engine package uses NodeNext-style '.js' import specifiers that point
    // at '.ts' source files. Let Vite resolve those during dev/build.
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  worker: {
    format: 'es',
  },
});
