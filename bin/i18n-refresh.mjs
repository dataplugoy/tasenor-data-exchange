#!/usr/bin/env -S npx tsx
import fs from 'fs'
import glob from 'fast-glob'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const I18N_DIR = path.join(ROOT, 'backend', 'src', 'lib', 'i18n')
const IGNORE_FILES = [`!${ROOT}/ui/node_modules`, `!${ROOT}/backend/node_modules`, '!**/*.d.ts']
const PATTERNS = {
  'ui/**/*.ts': [
    /\bt\('(.*?)'[) ,]/,
    /\bt\("(.*?)"[) ,]/,
  ],
  'ui/**/*.tsx': [
    /\bt\('(.*?)'[) ,]/,
    /\bt\("(.*?)"[) ,]/,
    /<Trans>(.*?)<\/Trans>/,
  ]
}
const CODE_PATTERN = /^[A-Z_]+( - [A-Z_]+)?$/
const IGNORE_SENTENCES = new Set([])
const FIXED_ENTRIES = new Set([
  'Bought {{amount}} {{asset}}',
  'Sold {{amount}} {{asset}}',
  'All Success',
  'Partly Skipped Success',
  'All Skipped',
  'Partly Fail',
  'All Failed',
  'No Progress',
])

const sentences = new Set()
const codes = new Set()

/**
 * Read in a file and find matches.
 */
function scanFile(file, regexes) {
  const text = fs.readFileSync(file).toString('utf-8')
  let idx = 0
  for (let line of text.split('\n')) {
    idx++
    for (const regex of regexes) {
      while (true) {
        const match = regex.exec(line)
        if (!match) {
          break
        }
        const sentence = match[1]
        line = line.replace(match[0], '')
        if (!IGNORE_SENTENCES.has(sentence)) {
          if (CODE_PATTERN.test(sentence)) {
            codes.add(sentence)
          } else {
            sentences.add(sentence)
          }
        }
      }
    }
  }
}

/**
 * Rebuild translation.
 */
function updateTranslation(file, lang) {
  const current = JSON.parse(fs.readFileSync(file).toString('utf-8'))
  const old = new Set(Object.keys(current))
  const updated = {}

  const missing = new Set()
  const created = new Set()
  const unused = new Set()
  const existing = new Set()

  // Helper to check a set of texts.
  function check(set) {
    for (const text of [...set].sort()) {
      if (old.has(text)) {
        existing.add(text)
        updated[text] = current[text]
      } else {
        missing.add(text)
        updated[text] = null
      }
    }
  }

  check(codes)
  if (lang !== 'en') {
    check(sentences)
  }

  for (const existing of old) {
    if (!(existing in updated) && !CODE_PATTERN.test(existing) && !FIXED_ENTRIES.has(existing)) {
      unused.add(existing)
      updated[`UNUSED - ${existing}`] = current[existing]
    } else {
      updated[existing] = current[existing]
    }
  }

  // Save file.
  fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n')

  console.log(file)
  console.log(`  Existing: ${existing.size}  Missing: ${missing.size}  Created: ${created.size}  Unused: ${unused.size}`)
}

/**
 * Update all translation files.
 */
async function main() {
  const en = JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'en.json')).toString('utf-8'))

  for (const [pattern, regexes] of Object.entries(PATTERNS)) {
    for (const file of await glob([path.join(ROOT, pattern)].concat(IGNORE_FILES))) {
      scanFile(file, regexes)
    }
  }

  for (const file of await glob(path.join(I18N_DIR, '[a-z][a-z].json'))) {
    updateTranslation(file, path.basename(file, '.json'))
  }
}

main()
