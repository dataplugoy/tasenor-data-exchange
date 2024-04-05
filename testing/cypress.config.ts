/// <reference types="node" />
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_URL,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
