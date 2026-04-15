import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/**/*edge-cases.test.ts', 'src/**/*edge-cases.test.tsx'],
    setupFiles: ['./src/test/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      all: false,
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '.next/**',
        'src/app/**',
        'src/components/**',
        'src/ui/**',
        'src/i18n/**',
        'src/types/**',
        'src/config/**',
        'src/instrumentation.ts',
        'src/index.ts',
        'src/proxy.ts',
        'scripts/**',
        'e2e/**',
        '**/*.stories.ts',
        '**/*.stories.tsx',
      ],
      thresholds: {
        lines: 35,
        statements: 35,
        functions: 70,
        branches: 65,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
