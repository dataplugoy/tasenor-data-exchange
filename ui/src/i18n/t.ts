import i18next from 'i18next'
import en from './en.json'
import fi from './fi.json'
import { Language } from '@tasenor/common'

let initialized = false

export async function initI18N(): Promise<void> {
  if (initialized) {
    return
  }

  const t = await i18next.init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translations'],
    defaultNS: 'translations',
    keySeparator: false,
    resources: {
      en: {
        translations: en
      },
      fi: {
        translations: fi
      }
    }
  })

  initialized = true
}

/**
 * Change the language.
 * @param lang
 */
export async function changeLanguage(lang: Language): Promise<void> {
  await i18next.changeLanguage(lang)
}

/**
 * Translate with optional values.
 * @param s
 * @param values
 * @returns
 */
export function t(s: string, values: Record<string, string> = {}): string {
  return i18next.t(s, values)
}
