import type { AdminTranslation, Locale } from "./types";
import { CONTENT_LOCALES } from "./types";

/** The pieces of copy the bilingual rule looks at. */
export type CopyField =
  | "title"
  | "short"
  | "benefit"
  | "lead"
  | "overview"
  | "features"
  | "specs"
  | "variants";

export type Gap = { locale: Locale; field: CopyField };

const filled: Record<CopyField, (t: AdminTranslation) => boolean> = {
  title: (t) => t.title.trim() !== "",
  short: (t) => (t.short ?? "").trim() !== "",
  benefit: (t) => (t.benefit ?? "").trim() !== "",
  lead: (t) => (t.lead ?? "").trim() !== "",
  overview: (t) => t.overview.length > 0,
  features: (t) => t.features.length > 0,
  specs: (t) => t.specs.length > 0,
  variants: (t) => t.variants.length > 0,
};

const OPTIONAL: CopyField[] = [
  "short",
  "benefit",
  "lead",
  "overview",
  "features",
  "specs",
  "variants",
];

/**
 * What is missing before this product may be published — the same rule the API
 * enforces, checked here so the editor can say it before a save round trip and
 * in the language the panel is set to.
 *
 * A title is required outright. Everything else is checked for parity: written
 * in one language, it has to be written in the others too, or a visitor who
 * switches language lands on a thinner page.
 */
export function findGaps(
  translations: Record<string, AdminTranslation>,
): Gap[] {
  const gaps: Gap[] = [];

  for (const locale of CONTENT_LOCALES) {
    if (!filled.title(translations[locale])) gaps.push({ locale, field: "title" });
  }

  for (const field of OPTIONAL) {
    const written = CONTENT_LOCALES.filter((l) => filled[field](translations[l]));
    if (written.length === 0) continue;

    for (const locale of CONTENT_LOCALES) {
      if (!filled[field](translations[locale])) gaps.push({ locale, field });
    }
  }

  return gaps;
}

/** Gaps for one language, for the marker on its tab. */
export const gapsIn = (gaps: Gap[], locale: Locale) =>
  gaps.filter((gap) => gap.locale === locale);
