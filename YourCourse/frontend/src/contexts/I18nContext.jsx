/**
 * I18nContext.jsx — Sistema de internacionalización
 * Provee t(key, params) para traducir cadenas según el idioma activo.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import es from '../locales/es';
import en from '../locales/en';
import pt from '../locales/pt';
import fr from '../locales/fr';

const LOCALES = { es, en, pt, fr };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('yc_idioma') || 'es');

  // t('key') o t('key', { n: 5 }) → reemplaza {n} con 5
  const t = useCallback((key, params = {}) => {
    const dict = LOCALES[lang] || LOCALES.es;
    let str = dict[key] ?? LOCALES.es[key] ?? key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
    return str;
  }, [lang]);

  const changeLang = useCallback((newLang) => {
    if (!LOCALES[newLang]) return;
    setLang(newLang);
    localStorage.setItem('yc_idioma', newLang);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

// Shorthand para solo necesitar la función de traducción
export function useT() {
  return useI18n().t;
}
