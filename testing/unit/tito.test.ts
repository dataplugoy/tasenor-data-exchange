import { describe, expect, test } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getDriver } from '../../backend/src/driver'
import { InputDriver } from '../../backend/src/driver/InputDriver'
import { parseTitoRecords, titoItems } from '../../backend/src/lib/tito'
import { analyzeItems, createBatchFrom, unifyItems } from '../lib/unit-testing'
import { NoMatchingRuleError } from '../../backend/src/lib/rules'
import { Setup } from '../../backend/src/types/API/Setup'

const sample = fs.readFileSync(path.join(__dirname, 'data', 'Nordea-tito.nda')).toString('latin1')

describe('Nordea TITO', () => {

  const projectSettings = { currency: 'EUR', language: 'en' }

  test('records are parsed', () => {
    const records = parseTitoRecords(sample)
    expect(records.map(r => r.type)).toStrictEqual([
      '00', '10', '11', '10', '11', '10', '11', '40', '10', '11', '11', '11', '10', '10', '11', '10', '11', '40', '50', '51', '70',
      '00', '10', '40'
    ])
    expect(records[0].fields['Tilin nimi']).toBe('KÄYTTÖTILI')
    expect(records[0].fields['Tiliotteen alkusaldo']).toBe('1000')
    expect(records[5].fields.Viite).toBe('1041')
  })

  test('transactions are combined with additional information', () => {
    const items = titoItems(parseTitoRecords(sample))
    expect(items.length).toBe(6)
    expect(items.map(i => [i.time, i.text, i.total, i.fields['Saaja/Maksaja'], i.fields.Tilinumero])).toStrictEqual([
      ['2023-01-03', 'e-maksu', -100, 'NORDNET BANK AB', 'FI001234560000'],
      ['2023-01-03', 'Pano', 234.65, 'VEROHALLINTO', 'FI001234560000'],
      ['2023-01-03', 'Viitemaksu', 100, 'MEIKÄLÄINEN MATTI', 'FI001234560000'],
      ['2023-01-15', 'Korttiosto', -100.8, 'OVHcloud', 'FI001234560000'],
      ['2023-01-31', 'Palvelumaksu', -19.65, 'NORDEA BANK ABP', 'FI001234560000'],
      ['2023-01-20', 'Tilisiirto', -25, 'TESTIYHTIÖ OY', 'FI006543210000'],
    ])

    const [emaksu, pano, viitemaksu, korttiosto, palvelumaksu, tilisiirto] = items
    expect(emaksu.fields['Toimeksiantajan tieto-1']).toBe('12345')
    expect(emaksu.fields['Saajan tili']).toBe('18203000000001')
    expect(pano.fields.Viesti).toBe('Oma-aloitteiset verot\npalautus 234,65 euroa')
    expect(viitemaksu.fields['Maksajan viite']).toBe('RF18539007547034')
    expect(korttiosto.fields['Kortin numero']).toBe('492500******1234')
    expect(korttiosto.fields['Kaupan arkistoviite']).toBe('12345678901234')
    expect(korttiosto.fields.Viesti).toBe('EUR 100,80 Dublin')
    expect(korttiosto.fields['Lisätieto']).toBe('Lisätietoa\nostosta')
    expect(palvelumaksu.fields.Erittely).toBe('Palvelumaksu -3.95\nTapahtumamaksut\nPalvelumaksu -15.70\nKuukausimaksu\nalv rek. 24% vero e 0,80')
    expect(palvelumaksu.fields.Viesti).toBeUndefined()
    expect(palvelumaksu.original.split('\n').length).toBe(5)
    expect(tilisiirto.fields['Tilin nimi']).toBe('SÄÄSTÖTILI')
    expect(tilisiirto.fields.Valuutta).toBe('EUR')
  })

  test('closing balance must match transactions', () => {
    const broken = sample.replace('T40050230103+000000000000123465', 'T40050230103+000000000000123466')
    expect(() => titoItems(parseTitoRecords(broken))).toThrow('Closing balance of FI001234560000 on 2023-01-03 is 1234.66 but transactions sum to 1234.65.')
  })

  test('itemization must sum to the transaction', () => {
    const broken = sample.replace('Palvelumaksu                       -000000000000000395', 'Palvelumaksu                       -000000000000000396')
    expect(() => titoItems(parseTitoRecords(broken))).toThrow('Itemization of the transaction 2301310005 sums to -19.66 instead of -19.65.')
  })

  test('unknown records are rejected', () => {
    expect(() => parseTitoRecords('T99010ABCD')).toThrow("Parsing a record of type 'T99' is not implemented.")
    expect(() => parseTitoRecords('T11010XX  ')).toThrow("Parsing a record of subtype 'XX' is not implemented for record type 'T11'.")
    expect(() => parseTitoRecords('X00010ABCD')).toThrow("Parsing TITO failed: missing 'T' at the beginning of record 1.")
  })

  test('driver itemizes uploaded statement', async () => {
    const driver = getDriver('NORDEA_TITO', {}, projectSettings, {}) as InputDriver
    const batch = createBatchFrom('Nordea-tito.nda')
    const items = await driver.itemizeInput(batch)
    expect(items.length).toBe(6)
    expect(items[1].fields.Viesti).toBe('Oma-aloitteiset verot\npalautus 234,65 euroa')
  })

  test('one-off answers are used for lines no rule matches', async () => {
    const items = titoItems(parseTitoRecords(sample))
    const setup: Setup = {
      answers: {
        2301030002: { type: 'income', value: 234.65, account: 'INCOME_TAX_REFUND', text: 'Veronpalautus' },
        2301150004: { type: 'expense', value: 100.8, account: 'EXPENSE_SOFTWARE', text: 'Palvelin' },
        2301200006: { type: 'skip' },
      }
    }
    const driver = getDriver('NORDEA_TITO', {}, projectSettings, setup) as InputDriver

    const unified = await unifyItems(driver, [items[1], items[3], items[5]], 'NordeaTitoDriver.json')
    expect(unified.map(u => u.data.data)).toStrictEqual([
      { type: 'income', value: 234.65, account: 'INCOME_TAX_REFUND', text: 'Veronpalautus', bankAccount: 'FI001234560000' },
      { type: 'expense', value: 100.8, account: 'EXPENSE_SOFTWARE', text: 'Palvelin', bankAccount: 'FI001234560000' },
      { type: 'skip' },
    ])

    await expect(unifyItems(driver, [items[0]], 'NordeaTitoDriver.json')).rejects.toThrow(NoMatchingRuleError)

    const txs = await analyzeItems(unified.slice(0, 2), projectSettings)
    expect(txs.map(tx => tx.lines.map(l => [l.account, l.amount]))).toStrictEqual([
      [['BANK_FI001234560000', '234.65'], ['INCOME_TAX_REFUND', '-234.65']],
      [['BANK_FI001234560000', '-100.8'], ['EXPENSE_SOFTWARE', '100.8']],
    ])
  })
})
