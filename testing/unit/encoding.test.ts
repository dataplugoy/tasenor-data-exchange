import { describe, expect, test } from 'vitest'
import { detectEncoding } from '../../backend/src/lib/utils'

describe('Detecting the encoding of the data', () => {
  test('UTF-8 text', () => {
    expect(detectEncoding(Buffer.from('Kirjauspäivä;Määrä\n01.02.2024;-12,50\n', 'utf-8'))).toBe('utf-8')
    expect(detectEncoding(Buffer.from('Date;Amount\n2024-02-01;-12.50\n', 'utf-8'))).toBe('utf-8')
  })

  test('Latin-1 text guessed to be another 8-bit encoding', () => {
    // Detected as windows-1257.
    expect(detectEncoding(Buffer.from('Kirjauspäivä;Arvopäivä;Määrä;Saaja/Maksaja;Selitys\n01.02.2024;01.02.2024;-12,50;Kauppa Öljy Oy;Pankkikortti\n', 'latin1'))).toBe('latin1')
    // Detected as ASCII.
    expect(detectEncoding(Buffer.from('Päivä;Määrä\n1.1.2024;5\n', 'latin1'))).toBe('latin1')
  })

  test('UTF-16 text', () => {
    expect(detectEncoding(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Päivä;Määrä\n1.1.2024;5\n', 'utf16le')]))).toBe('utf16le')
  })
})
