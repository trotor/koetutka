import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['lib/tests/**/*.test.ts'],
    environment: 'node',
  },
});
