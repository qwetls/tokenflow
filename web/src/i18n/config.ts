/*
Copyright (C) 2026 TokenFlow contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For licensing information, see the LICENSE and NOTICE files.
*/
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { convertDetectedLanguage } from './languages'

// Locale dictionaries are lazy-loaded: each language ships as its own async
// chunk instead of bloating the entry bundle (7 locales were ~3.9MB raw,
// most of the entry chunk).
const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('./locales/en.json'),
  zhCN: () => import('./locales/zh.json'),
  fr: () => import('./locales/fr.json'),
  ru: () => import('./locales/ru.json'),
  ja: () => import('./locales/ja.json'),
  vi: () => import('./locales/vi.json'),
  zhTW: () => import('./locales/zh-TW.json'),
}

type ReadCallback = (error: Error | null, data?: Record<string, unknown>) => void

const lazyLocaleBackend = {
  type: 'backend' as const,
  init() {
    /* no-op */
  },
  read(language: string, _namespace: string, callback: ReadCallback) {
    const loader = localeLoaders[language]
    if (!loader) {
      callback(new Error(`Unsupported locale: ${language}`))
      return
    }
    // i18next backend API is callback-based by design; bridge the dynamic
    // import promise into it.
    void loader().then(
      // eslint-disable-next-line promise/no-callback-in-promise
      (mod) => callback(null, mod.default),
      // eslint-disable-next-line promise/no-callback-in-promise
      (err: unknown) => callback(err instanceof Error ? err : new Error(String(err))),
    )
  },
}

i18n
  .use(lazyLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'zhCN', 'fr', 'ru', 'ja', 'vi', 'zhTW'],
    load: 'currentOnly',
    nsSeparator: false, // Allow literal colons in keys (e.g., URLs, labels)
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Browsers report `zh-CN`/`zh-TW`/`zh`; map them onto our `zhCN`/`zhTW`
      // codes (non-Chinese codes pass through for normal supportedLngs matching).
      convertDetectedLanguage,
    },
  })

export default i18n
