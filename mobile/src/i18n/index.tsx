/**
 * Wakhar WMS — i18n setup using i18n-js + expo-localization.
 * Supports: English (en), Marathi (mr), Hindi (hi)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

const i18n = new I18n({ en, mr, hi });

const LOCALE_STORAGE_KEY = '@wakhar_locale';

// Get device locale and set default initially
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const initialLocale = ['en', 'mr', 'hi'].includes(deviceLocale) ? deviceLocale : 'en';

i18n.locale = initialLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

/**
 * Translate a key statically.
 * Note: Use the useTranslation hook in React components for reactivity!
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/**
 * Get the current static locale.
 */
export function getLocale(): string {
  return i18n.locale;
}

/**
 * Available locales for the language picker.
 */
export const AVAILABLE_LOCALES = [
  { code: 'en' as const, label: 'English', nativeLabel: 'English' },
  { code: 'mr' as const, label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'hi' as const, label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export type LocaleType = 'en' | 'mr' | 'hi';

interface LanguageContextProps {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  locale: initialLocale as LocaleType,
  setLocale: async () => {},
  t: t,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LocaleType>(initialLocale as LocaleType);

  useEffect(() => {
    // Hydrate locale from storage
    const loadLocale = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored && ['en', 'mr', 'hi'].includes(stored)) {
          i18n.locale = stored;
          setLocaleState(stored as LocaleType);
        }
      } catch (err) {
        console.error('Failed to load locale from storage', err);
      }
    };
    loadLocale();
  }, []);

  const setLocale = async (newLocale: LocaleType) => {
    try {
      i18n.locale = newLocale;
      setLocaleState(newLocale);
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch (err) {
      console.error('Failed to save locale to storage', err);
    }
  };

  // Provide a reactive t function that depends on the current locale state
  const reactiveT = (key: string, options?: Record<string, unknown>) => {
    return i18n.t(key, { locale, ...options });
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: reactiveT }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  return useContext(LanguageContext);
}

// Keep static setLocale for backward compatibility if needed, though useTranslation().setLocale should be preferred.
export function setLocale(newLocale: 'en' | 'mr' | 'hi'): void {
  i18n.locale = newLocale;
}

export default i18n;
