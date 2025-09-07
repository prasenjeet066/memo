import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

// Define fallback resources to prevent loading issues
const fallbackResources = {
  en: {
    lang: {
      "home": "Home",
      "explore": "Explore", 
      "notifications": "Notifications",
      "messages": "Messages",
      "bookmarks": "Bookmarks",
      "profile": "Profile",
      "settings": "Settings",
      "superAccess": "Super Access",
      "createPost": "Create Post",
      "signOut": "Sign Out"
    }
  },
  bn: {
    lang: {
      "home": "হোম",
      "explore": "অন্বেষণ",
      "notifications": "বিজ্ঞপ্তি",
      "messages": "বার্তা",
      "bookmarks": "বুকমার্ক",
      "profile": "প্রোফাইল",
      "settings": "সেটিংস",
      "superAccess": "সুপার অ্যাক্সেস",
      "createPost": "পোস্ট তৈরি করুন",
      "signOut": "সাইন আউট"
    }
  }
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'bn',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    // Add inline resources as fallback
    resources: fallbackResources,
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Add request timeout
      requestOptions: {
        cache: 'default'
      }
    },
    // Reduce initialization time
    load: 'languageOnly',
    supportedLngs: ['en', 'bn'],
    defaultNS: 'lang',
    ns: ['lang'],
    // Prevent hanging on missing resources
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation: ${key} for ${lng}`)
      return fallbackValue || key
    }
  })

export default i18n