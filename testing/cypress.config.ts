/// <reference types="node" />
import { defineConfig } from 'cypress'
import { cwd } from 'process'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_URL,
    env: {
      CYPRESS_ROOT_PATH: cwd(),
      CYPRESS_URL: process.env.CYPRESS_URL,
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
