import i18next from 'i18next'
import en from './en.json'
import fi from './fi.json'
import { Language, log } from '@tasenor/common'

let initialized = false

const translators = {
  fi: i18next.getFixedT('fi', 'translations', ''),
  en: i18next.getFixedT('en', 'translations', ''),
}

/**
 * Initialize i18n if not yet initialized.
 * @returns
 */
export async function initI18N(): Promise<void> {
  if (initialized) {
    return
  }

  await i18next.init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translations'],
    defaultNS: 'translations',
    keySeparator: false,
    interpolation: {
      escapeValue: false
    },
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

  log('I18N initialized.')
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
export function t(lang: Language, s: string, values: Record<string, string | number> = {}): string {
  const fn = translators[lang]
  if (!fn) {
    throw new Error(`There is no translator for language '${lang}'.`)
  }
  return fn(s, values)
}
