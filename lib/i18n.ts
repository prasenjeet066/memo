// lib/i18n.ts - App Router compatible i18n
import { createInstance, Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

export const defaultLocale = 'en'
export const locales = ['en', 'bn', 'fr', 'de'] as
const
export type Locale = typeof locales[number]

const initI18next = async (locale: string, ns ? : string | string[]) => {
  const i18nInstance = createInstance()
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) =>
      import(`../public/locales/${language}/${namespace}.json`)
    ))
    .init({
      lng: locale,
      fallbackLng: defaultLocale,
      supportedLngs: locales,
      defaultNS: 'common',
      fallbackNS: 'common',
      ns: ns || 'common',
      preload: typeof window === 'undefined' ? locales : [],
    })
  return i18nInstance
}

export async function getTranslation(
  locale: string,
  ns ? : string | string[]
) {
  const i18nextInstance = await initI18next(locale, ns)
  return {
    t: i18nextInstance.getFixedT(locale, ns || 'common'),
    i18n: i18nextInstance
  }
}