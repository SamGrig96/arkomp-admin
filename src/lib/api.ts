import type {
  AdminFamily,
  AdminProduct,
  AdminProductRow,
  AdminTranslation,
  LoginResponse,
  User,
} from "./types";

export const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5080"
).replace(/\/+$/, "");

const TOKEN_KEY = "arkomp.admin.token";

/** Fired when the API rejects the stored token. */
export const SIGNED_OUT_EVENT = "arkomp:signed-out";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Thrown for anything the API refuses. `fields` carries per-field messages when
 * the API answered with a validation problem, so forms can show them in place.
 */
export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]>;

  constructor(message: string, status: number, fields: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** Raised on 401 so the app can send the editor back to the sign-in screen. */
export class SessionExpired extends ApiError {
  constructor() {
    super("Մուտքի ժամկետը լրացել է։ Մուտք գործեք նորից։", 401);
  }
}

type Options = {
  method?: string;
  body?: unknown;
  /** Multipart bodies are passed through untouched. */
  form?: FormData;
};

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form; // the browser sets the multipart boundary itself
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      `API-ն հասանելի չէ (${API_URL})։ Ստուգեք՝ գործարկվա՞ծ է։`,
      0,
    );
  }

  if (response.status === 401) {
    clearToken();
    // Any screen can be the one that finds out, so the app is told through an
    // event rather than every caller having to forward it.
    window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    throw new SessionExpired();
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? safeJson(text) : null;

  if (!response.ok) {
    const problem = payload as {
      title?: string;
      detail?: string;
      error?: string;
      errors?: Record<string, string[]>;
    } | null;

    throw new ApiError(
      problem?.error ??
        problem?.detail ??
        problem?.title ??
        `Սխալ ${response.status}`,
      response.status,
      problem?.errors ?? {},
    );
  }

  return payload as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });

export const me = () => request<User>("/api/auth/me");

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<User>("/api/auth/password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });

// ── Catalogue ────────────────────────────────────────────────────────────────

export const listProducts = (locale = "hy") =>
  request<AdminProductRow[]>(`/api/admin/products?locale=${locale}`);

export const getProduct = (slug: string) =>
  request<AdminProduct>(`/api/admin/products/${encodeURIComponent(slug)}`);

export const listFamilies = () => request<AdminFamily[]>("/api/admin/families");

export type ProductMeta = {
  slug?: string;
  familySlug?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
};

export const updateProduct = (
  slug: string,
  changes: ProductMeta & { translations?: AdminTranslation[] },
) =>
  request<{ slug: string }>(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: changes,
  });

export const createProduct = (body: {
  slug: string;
  familySlug: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  translations: AdminTranslation[];
}) => request<{ slug: string }>("/api/admin/products", { method: "POST", body });

export const deleteProduct = (slug: string) =>
  request<void>(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });

export const reorderProducts = (slugs: string[]) =>
  request<{ ordered: number }>("/api/admin/products/order", {
    method: "PUT",
    body: { slugs },
  });

// ── Photos ───────────────────────────────────────────────────────────────────

export const uploadImage = (slug: string, file: File, alt: Record<string, string>) => {
  const form = new FormData();
  form.append("file", file);
  if (alt.hy) form.append("altHy", alt.hy);
  if (alt.ru) form.append("altRu", alt.ru);
  return request<{ id: number; url: string }>(
    `/api/admin/products/${encodeURIComponent(slug)}/images`,
    { method: "POST", form },
  );
};

export const updateImage = (id: number, changes: { alt?: Record<string, string> }) =>
  request<unknown>(`/api/admin/images/${id}`, { method: "PUT", body: changes });

export const deleteImage = (id: number) =>
  request<void>(`/api/admin/images/${id}`, { method: "DELETE" });

export const reorderImages = (slug: string, imageIds: number[]) =>
  request<unknown>(`/api/admin/products/${encodeURIComponent(slug)}/images/order`, {
    method: "PUT",
    body: { imageIds },
  });
