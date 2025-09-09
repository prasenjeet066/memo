// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'bn',
    locales: ['en', 'bn', 'fr', 'de'],
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};