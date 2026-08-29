/** Mirrors Arkomp.Api/Contracts/Dtos.cs and the auth endpoints. */

export type Locale = "hy" | "ru";

export const LOCALES: Locale[] = ["hy", "ru"];

export const LOCALE_LABELS: Record<Locale, string> = {
  hy: "Հայերեն",
  ru: "Русский",
};

export type User = {
  username: string;
  displayName: string;
  mustChangePassword: boolean;
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  user: User;
};

export type OverviewRow = { title: string; text: string };
export type FeatureCard = { number: string; title: string; text: string };

export type AdminImage = {
  id: number;
  url: string;
  alt: Record<string, string>;
  byteSize: number;
  sortOrder: number;
};

export type AdminTranslation = {
  locale: string;
  title: string;
  short: string | null;
  benefit: string | null;
  lead: string | null;
  overview: OverviewRow[];
  features: FeatureCard[];
  specs: string[];
  variants: string[];
};

export type AdminProduct = {
  slug: string;
  familySlug: string;
  sortOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  translations: AdminTranslation[];
  images: AdminImage[];
  updatedAt: string;
};

export type AdminFamily = {
  slug: string;
  sortOrder: number;
  labels: Record<string, string>;
  productCount: number;
};

/** A row in the product list. */
export type AdminProductRow = {
  product: {
    slug: string;
    family: { slug: string; label: string };
    title: string;
    short: string | null;
    benefit: string | null;
    featured: boolean;
    image: { id: number; url: string; alt: string } | null;
  };
  isPublished: boolean;
  sortOrder: number;
  locales: string[];
  images: number;
};

/** An empty translation, so a new language starts from blank fields. */
export const emptyTranslation = (locale: string): AdminTranslation => ({
  locale,
  title: "",
  short: null,
  benefit: null,
  lead: null,
  overview: [],
  features: [],
  specs: [],
  variants: [],
});
