/** Where the public website runs, for the "view on the site" links. */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000"
).replace(/\/+$/, "");
