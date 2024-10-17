#!/usr/bin/env -S npx tsx
import fs from 'fs'
import glob from 'fast-glob'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import AnswersRequired from '../backend/src/exceptions/AnswersRequired'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const I18N_DIR = path.join(ROOT, 'backend', 'src', 'lib', 'i18n')
const IGNORE_FILES = [`!${ROOT}/ui/node_modules`, `!${ROOT}/backend/node_modules`, '!**/*.d.ts']
const PATTERNS = {
  'backend/**/*.ts': [
    /\bt\([a-zA-Z. ]+, '(.*?)'[) ,]/,
    /\bt\([a-zA-Z. ]+, "(.*?)"[) ,]/,
    /\bvalidateText\('(.*?)'[) ,]/,
    /\bvalidateText\("(.*?)"[) ,]/,
  ],
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
const PREFIXED_PATTERN = /^(Option)-/
const IGNORE_SENTENCES = new Set([])
const FIXED_ENTRIES = new Set([
  'Bought {{amount}} {{asset}}',
  'Sold {{amount}} {{asset}}',
  'All Success',
  'Partly Skipped',
  'All Skipped',
  'Partly Fail',
  'All Failed',
  'No Progress',
])

const sentences = new Set()
const codes = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(I18N_DIR, 'en.json')).toString('utf-8'))))

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
          if (CODE_PATTERN.test(sentence) || PREFIXED_PATTERN.test(sentence)) {
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
    if (!(existing in updated) && !CODE_PATTERN.test(existing) && !PREFIXED_PATTERN.test(existing) && !FIXED_ENTRIES.has(existing)) {
      unused.add(existing)
      updated[`UNUSED - ${existing}`] = current[existing]
    } else {
      updated[existing] = current[existing]
    }
  }

  // Save file.
  fs.writeFileSync(file, JSON.stringify(updated, null, 2) + '\n')

  console.log(file)
  console.log(`  Existing: ${existing.size}  Missing: ${missing.size} Unused: ${unused.size}`)
}

/**
 * Update all translation files.
 */
async function main() {
  for (const [pattern, regexes] of Object.entries(PATTERNS)) {
    for (const file of await glob([path.join(ROOT, pattern)].concat(IGNORE_FILES))) {
      scanFile(file, regexes)
    }
  }

  Object.values(AnswersRequired.VARIABLES).forEach(varSpec => {
    sentences.add(varSpec.help)
    sentences.add(varSpec.label)
  })

  for (const file of await glob(path.join(I18N_DIR, '[a-z][a-z].json'))) {
    updateTranslation(file, path.basename(file, '.json'))
  }
}

main()
