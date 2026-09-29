import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Model tests reload the shared test database, so test files cannot run in parallel.
    fileParallelism: false,
  },
})
