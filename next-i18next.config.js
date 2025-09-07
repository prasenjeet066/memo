/** @type {import('next-i18next').UserConfig} */
const nextI18NextConfig = {
  i18n: {
    defaultLocale: 'bn', // This matches the fallback in i18n.ts now
    locales: ['en', 'bn']
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Optional: Add these for better performance and debugging
  localePath: './public/locales',
  defaultNS: 'lang'
}

module.exports = nextI18NextConfig
