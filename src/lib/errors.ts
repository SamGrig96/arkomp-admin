import { API_URL, ApiError } from "./api";
import type { Strings } from "./i18n";

/**
 * Turns anything a screen catches into a sentence in the panel's language.
 *
 * The API's own wording is English and aimed at whoever wired it up, so it is
 * used only when nothing better is known — and `fallback` covers the rest, which
 * is where each screen says what it was trying to do.
 */
export function describeError(error: unknown, t: Strings, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "offline") return t.api.offline(API_URL);
    if (error.code === "unauthorized") return t.app.sessionExpired;

    // Validation problems carry the useful text per field; a bare status is all
    // the rest of them offer.
    const field = Object.values(error.fields)[0]?.[0];
    if (field) return field;
    if (error.message) return error.message;
    return t.api.status(error.status);
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
