import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "../lib/api";
import { describeError } from "../lib/errors";
import { useI18n, type Strings } from "../lib/i18n";
import { move } from "../lib/move";
import { SITE_URL } from "../lib/site";
import type {
  AdminFamily,
  AdminImage,
  AdminProduct,
  AdminTranslation,
  FeatureCard,
  Locale,
  OverviewRow,
} from "../lib/types";
import {
  CONTENT_LOCALES,
  CONTENT_LOCALE_LABELS,
  emptyTranslation,
} from "../lib/types";
import { Field, MoveButtons, StringList, TextArea, TextField } from "./fields";
import { Photos } from "./Photos";

type Draft = {
  slug: string;
  familySlug: string;
  isFeatured: boolean;
  isPublished: boolean;
  translations: Record<string, AdminTranslation>;
};

const toDraft = (product: AdminProduct): Draft => ({
  slug: product.slug,
  familySlug: product.familySlug,
  isFeatured: product.isFeatured,
  isPublished: product.isPublished,
  translations: Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [
      locale,
      product.translations.find((t) => t.locale === locale) ?? emptyTranslation(locale),
    ]),
  ),
});

const blankDraft = (familySlug: string): Draft => ({
  slug: "",
  familySlug,
  isFeatured: false,
  isPublished: true,
  translations: Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [locale, emptyTranslation(locale)]),
  ),
});

export function ProductEditor({
  slug,
  families,
  onDone,
  onError,
  onSaved,
}: {
  /** null while creating a new group. */
  slug: string | null;
  families: AdminFamily[];
  onDone: () => void;
  onError: (message: string) => void;
  onSaved: (message: string) => void;
}) {
  const { t, locale: uiLocale } = useI18n();
  const isNew = slug === null;

  const [draft, setDraft] = useState<Draft | null>(
    isNew ? blankDraft(families[0]?.slug ?? "") : null,
  );
  const [saved, setSaved] = useState<Draft | null>(
    isNew ? blankDraft(families[0]?.slug ?? "") : null,
  );
  const [images, setImages] = useState<AdminImage[]>([]);
  const [locale, setLocale] = useState<Locale>("hy");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    if (slug === null) return;
    try {
      const product = await api.getProduct(slug);
      setDraft(toDraft(product));
      setSaved(toDraft(product));
      setImages(product.images);
    } catch (e) {
      onError(describeError(e, t, t.editor.loadFailed));
    }
  }, [slug, onError, t]);

  // Fetching on mount: the setState calls inside load() happen after the await,
  // which the rule cannot see.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  // A half-finished edit is easy to lose to a stray tab close.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!draft) return <div className="empty">{t.app.loading}</div>;

  const patch = (changes: Partial<Draft>) => setDraft({ ...draft, ...changes });

  const patchCopy = (changes: Partial<AdminTranslation>) =>
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [locale]: { ...draft.translations[locale], ...changes },
      },
    });

  const copy = draft.translations[locale];

  async function save() {
    setBusy(true);
    setFieldErrors({});
    try {
      const translations = CONTENT_LOCALES.map((l) => draft!.translations[l]).filter(
        (item) => item.title.trim() !== "",
      );

      if (translations.length === 0) {
        setFieldErrors({ title: [t.editor.needTitle] });
        return;
      }

      if (isNew) {
        await api.createProduct({
          slug: draft!.slug.trim(),
          familySlug: draft!.familySlug,
          isFeatured: draft!.isFeatured,
          isPublished: draft!.isPublished,
          translations,
        });
        onSaved(t.editor.created);
        onDone();
        return;
      }

      await api.updateProduct(slug!, {
        slug: draft!.slug.trim(),
        familySlug: draft!.familySlug,
        isFeatured: draft!.isFeatured,
        isPublished: draft!.isPublished,
        translations,
      });
      setSaved(draft);
      onSaved(t.editor.saved);
      if (draft!.slug.trim() !== slug) onDone();
    } catch (e) {
      if (e instanceof api.ApiError && Object.keys(e.fields).length > 0) {
        setFieldErrors(e.fields);
      }
      onError(describeError(e, t, t.editor.saveFailed));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t.editor.confirmDelete(copy.title || draft!.slug))) return;
    try {
      await api.deleteProduct(slug!);
      onSaved(t.editor.deleted);
      onDone();
    } catch (e) {
      onError(describeError(e, t, t.editor.deleteFailed));
    }
  }

  const firstError = (name: string) => fieldErrors[name]?.[0];

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{isNew ? t.editor.newTitle : copy.title || draft.slug}</h1>
          <p className="list__slug">{draft.slug || t.editor.noSlug}</p>
        </div>
        <div className="page__actions">
          {!isNew ? (
            <a
              className="btn btn--ghost"
              href={`${SITE_URL}/${uiLocale}/products/${draft.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              {t.editor.viewOnSite}
            </a>
          ) : null}
          <button className="btn btn--ghost" onClick={onDone}>
            {t.editor.back}
          </button>
        </div>
      </div>

      {/* Settings ───────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2>{t.editor.settingsTitle}</h2>
            <p>{t.editor.settingsLead}</p>
          </div>
        </div>

        <div className="row">
          <TextField
            label={t.editor.slug}
            hint={t.editor.slugHint}
            value={draft.slug}
            error={firstError("slug")}
            placeholder="rhetine-khoghovakner"
            onChange={(value) =>
              patch({ slug: value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
            }
          />

          <Field label={t.editor.family} error={firstError("familySlug")}>
            <select
              value={draft.familySlug}
              onChange={(e) => patch({ familySlug: e.target.value })}
            >
              {families.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.labels[uiLocale] ?? f.slug}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => patch({ isPublished: e.target.checked })}
            />
            {t.editor.published}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              onChange={(e) => patch({ isFeatured: e.target.checked })}
            />
            {t.editor.featured}
          </label>
        </div>
      </div>

      {/* Photos ─────────────────────────────────────────────────────────── */}
      {isNew ? (
        <div className="card">
          <div className="card__head">
            <div>
              <h2>{t.photos.title}</h2>
              <p>{t.editor.photosLeadNew}</p>
            </div>
          </div>
        </div>
      ) : (
        <Photos slug={slug!} images={images} onChanged={setImages} onError={onError} />
      )}

      {/* Copy ───────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2>{t.editor.copyTitle}</h2>
            <p>{t.editor.copyLead}</p>
          </div>
        </div>

        <div className="tabs">
          {CONTENT_LOCALES.map((l) => (
            <button
              key={l}
              className={l === locale ? "tab tab--active" : "tab"}
              onClick={() => setLocale(l)}
            >
              {CONTENT_LOCALE_LABELS[l]}
              {draft.translations[l].title.trim() === "" ? " ·" : ""}
            </button>
          ))}
        </div>

        <TextField
          label={t.editor.fieldTitle}
          value={copy.title}
          error={firstError("title")}
          onChange={(title) => patchCopy({ title })}
        />

        <TextArea
          label={t.editor.fieldShort}
          hint={t.editor.fieldShortHint}
          rows={2}
          value={copy.short ?? ""}
          onChange={(v) => patchCopy({ short: v || null })}
        />

        <TextField
          label={t.editor.fieldBenefit}
          hint={t.editor.fieldBenefitHint}
          value={copy.benefit ?? ""}
          onChange={(v) => patchCopy({ benefit: v || null })}
        />

        <TextArea
          label={t.editor.fieldLead}
          rows={4}
          value={copy.lead ?? ""}
          onChange={(v) => patchCopy({ lead: v || null })}
        />

        <RowsEditor
          t={t}
          rows={copy.overview}
          onChange={(overview) => patchCopy({ overview })}
        />

        <FeaturesEditor
          t={t}
          features={copy.features}
          onChange={(features) => patchCopy({ features })}
        />

        <StringList
          label={t.editor.specs}
          hint={t.editor.specsHint}
          addLabel={t.editor.specsAdd}
          placeholder={t.editor.specsPlaceholder}
          items={copy.specs}
          onChange={(specs) => patchCopy({ specs })}
        />

        <StringList
          label={t.editor.variants}
          hint={t.editor.variantsHint}
          addLabel={t.editor.variantsAdd}
          placeholder={t.editor.variantsPlaceholder}
          items={copy.variants}
          onChange={(variants) => patchCopy({ variants })}
        />
      </div>

      <div className="savebar">
        <span className="savebar__status">
          {dirty ? t.editor.dirty : t.editor.clean}
        </span>
        <div className="savebar__actions">
          {!isNew ? (
            <button className="btn btn--danger" onClick={() => void remove()}>
              {t.editor.delete}
            </button>
          ) : null}
          <button
            className="btn btn--primary"
            disabled={busy || (!dirty && !isNew)}
            onClick={() => void save()}
          >
            {busy ? t.editor.saving : isNew ? t.editor.create : t.editor.save}
          </button>
        </div>
      </div>
    </>
  );
}

/** The "what it solves / who it is for / how to choose" rows. */
function RowsEditor({
  t,
  rows,
  onChange,
}: {
  t: Strings;
  rows: OverviewRow[];
  onChange: (rows: OverviewRow[]) => void;
}) {
  const set = (i: number, changes: Partial<OverviewRow>) =>
    onChange(rows.map((row, at) => (at === i ? { ...row, ...changes } : row)));

  return (
    <div className="field">
      <span className="field__label">
        {t.editor.overview}
        <span className="field__hint">{t.editor.overviewHint}</span>
      </span>

      {rows.map((row, i) => (
        <div className="group" key={i}>
          <div className="group__head">
            <span className="group__n">{i + 1}</span>
            <div className="group__actions">
              <MoveButtons
                index={i}
                count={rows.length}
                onMove={(from, to) => onChange(move(rows, from, to))}
              />
              <button
                className="btn btn--danger btn--icon"
                title={t.common.remove}
                onClick={() => onChange(rows.filter((_, at) => at !== i))}
              >
                ✕
              </button>
            </div>
          </div>
          <TextField
            label={t.editor.fieldTitle}
            value={row.title}
            onChange={(title) => set(i, { title })}
          />
          <TextArea
            label={t.editor.fieldText}
            rows={2}
            value={row.text}
            onChange={(text) => set(i, { text })}
          />
        </div>
      ))}

      <button
        className="btn btn--ghost btn--small"
        onClick={() => onChange([...rows, { title: "", text: "" }])}
      >
        + {t.editor.overviewAdd}
      </button>
    </div>
  );
}

/** Numbered advantage cards. */
function FeaturesEditor({
  t,
  features,
  onChange,
}: {
  t: Strings;
  features: FeatureCard[];
  onChange: (features: FeatureCard[]) => void;
}) {
  const set = (i: number, changes: Partial<FeatureCard>) =>
    onChange(features.map((f, at) => (at === i ? { ...f, ...changes } : f)));

  return (
    <div className="field">
      <span className="field__label">
        {t.editor.features}
        <span className="field__hint">{t.editor.featuresHint}</span>
      </span>

      {features.map((feature, i) => (
        <div className="group" key={i}>
          <div className="group__head">
            <span className="group__n">{feature.number || i + 1}</span>
            <div className="group__actions">
              <MoveButtons
                index={i}
                count={features.length}
                onMove={(from, to) => onChange(move(features, from, to))}
              />
              <button
                className="btn btn--danger btn--icon"
                title={t.common.remove}
                onClick={() => onChange(features.filter((_, at) => at !== i))}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="row">
            <TextField
              label={t.editor.fieldNumber}
              value={feature.number}
              onChange={(number) => set(i, { number })}
            />
            <TextField
              label={t.editor.fieldTitle}
              value={feature.title}
              onChange={(title) => set(i, { title })}
            />
          </div>
          <TextArea
            label={t.editor.fieldText}
            rows={2}
            value={feature.text}
            onChange={(text) => set(i, { text })}
          />
        </div>
      ))}

      <button
        className="btn btn--ghost btn--small"
        onClick={() =>
          onChange([
            ...features,
            {
              number: String(features.length + 1).padStart(2, "0"),
              title: "",
              text: "",
            },
          ])
        }
      >
        + {t.editor.featuresAdd}
      </button>
    </div>
  );
}
