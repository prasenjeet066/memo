import "server-only";

// Define the Locale type
export type Locale = 'en' | 'bn';

// We enumerate all dictionaries here for better linting and typescript support
// We also get the default import for cleaner types
const dictionaries = {
  en: () => import("@/lib/dictionary/en.json").then((module) => module.default),
  bn: () => import("@/lib/dictionary/bn.json").then((module) => module.default), // ✅ added Bengali
} as const;

// This is the function you call anywhere in your app to get translations
export const getDictionary = async (locale: Locale) =>
  dictionaries[locale]?.() ?? dictionaries.en();