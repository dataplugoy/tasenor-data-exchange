import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import fi from '../../backend/src/lib/i18n/fi.json'

/**
 * Find the source files of the UI.
 */
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? sources(file) : /\.tsx?$/.test(entry.name) ? [file] : []
  })
}

describe('UI translations', () => {

  it('translate every fixed text of the UI into Finnish', () => {
    const missing: string[] = []
    for (const file of sources(path.join(__dirname, '..', '..', 'ui', 'src'))) {
      const code = fs.readFileSync(file, 'utf-8')
      const texts = [
        ...[...code.matchAll(/<Trans[^>]*>([^<{]+)<\/Trans>/g)].map(m => m[1].trim()),
        ...[...code.matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g)].map(m => m[1]),
      ]
      for (const text of texts) {
        // Codes like ACCOUNT_FEE are composed and checked elsewhere.
        if (!/^[A-Z_]+$/.test(text) && !(text in fi)) {
          missing.push(`${path.basename(file)}: ${text}`)
        }
      }
    }
    expect(missing).toEqual([])
  })
})
