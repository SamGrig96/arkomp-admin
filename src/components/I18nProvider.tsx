import { useEffect, useState, type ReactNode } from "react";
import {
  dictionaries,
  I18nContext,
  initialLocale,
  LOCALE_STORAGE_KEY,
  type UiLocale,
} from "../lib/i18n";

/** Holds the panel's language and remembers it between visits. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<UiLocale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    // index.html can only carry one language; the tab should follow the choice.
    document.title = dictionaries[locale].login.title;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Not being able to remember the choice is not worth an error.
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}
