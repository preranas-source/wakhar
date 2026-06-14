/**
 * Wakhar WMS — i18n setup using i18n-js + expo-localization.
 * Supports: English (en), Marathi (mr), Hindi (hi)
 */

import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

const i18n = new I18n({ en, mr, hi });

// Get device locale and set default
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = ['en', 'mr', 'hi'].includes(deviceLocale) ? deviceLocale : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

/**
 * Translate a key. Usage: t('common.hello')
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/**
 * Get the current locale.
 */
export function getLocale(): string {
  return i18n.locale;
}

/**
 * Set the locale. Triggers re-render if used with state.
 */
export function setLocale(locale: 'en' | 'mr' | 'hi'): void {
  i18n.locale = locale;
}

/**
 * Available locales for the language picker.
 */
export const AVAILABLE_LOCALES = [
  { code: 'en' as const, label: 'English', nativeLabel: 'English' },
  { code: 'mr' as const, label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'hi' as const, label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export default i18n;
