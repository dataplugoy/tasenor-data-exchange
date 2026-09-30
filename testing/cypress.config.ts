/// <reference types="node" />
import { defineConfig } from 'cypress'
import { spawnSync } from 'child_process'
import path from 'path'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_URL,
    setupNodeEvents(on) {
      on('task', {
        // Reload the test database snapshot.
        loadDatabase() {
          const run = spawnSync('pnpm', ['-C', path.join(__dirname, '..', 'database'), 'load'], { encoding: 'utf-8' })
          if (run.status !== 0) {
            throw new Error(`Loading the database failed: ${run.stderr}`)
          }
          return null
        },
      })
    },
  },
});
