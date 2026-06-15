import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    alias: [
      // Stub static asset imports (SVG, images) in test environment
      { find: /\.(svg|png|jpg|jpeg|gif|webp)$/, replacement: '/src/test/__mocks__/fileMock.ts' },
    ],
  },
} as Parameters<typeof defineConfig>[0]);
