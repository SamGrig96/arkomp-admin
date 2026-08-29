import { UI_LOCALES, UI_LOCALE_LABELS, useI18n } from "../lib/i18n";

/**
 * Switches the language of the panel itself. It is deliberately not tied to the
 * language tab in the editor: you might well write the Russian copy with
 * Armenian buttons around it.
 */
export function LocaleSwitch({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={dark ? "langswitch langswitch--dark" : "langswitch"} role="group" aria-label={t.app.languageAria}>
      {UI_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className={option === locale ? "langswitch__btn langswitch__btn--on" : "langswitch__btn"}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          {UI_LOCALE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
