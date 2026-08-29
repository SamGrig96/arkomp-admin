import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "../lib/api";
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
import { emptyTranslation, LOCALES, LOCALE_LABELS } from "../lib/types";
import { Field, MoveButtons, StringList, TextArea, TextField } from "./fields";
import { move } from "../lib/move";
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
    LOCALES.map((locale) => [
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
    LOCALES.map((locale) => [locale, emptyTranslation(locale)]),
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
      onError(e instanceof Error ? e.message : "Չհաջողվեց բեռնել ապրանքը։");
    }
  }, [slug, onError]);

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

  if (!draft) return <div className="empty">Բեռնվում է…</div>;

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
      const translations = LOCALES.map((l) => draft!.translations[l]).filter(
        (t) => t.title.trim() !== "",
      );

      if (translations.length === 0) {
        setFieldErrors({ title: ["Առնվազն մեկ լեզվով վերնագիր պետք է լինի։"] });
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
        onSaved("Ապրանքախումբը ստեղծվեց։");
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
      onSaved("Պահպանվեց։");
      if (draft!.slug.trim() !== slug) onDone();
    } catch (e) {
      if (e instanceof api.ApiError && Object.keys(e.fields).length > 0) {
        setFieldErrors(e.fields);
      }
      onError(e instanceof Error ? e.message : "Չհաջողվեց պահել։");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Ջնջե՞լ «${copy.title || draft!.slug}» ապրանքախումբը իր բոլոր նկարներով։ ` +
          "Գործողությունն անշրջելի է։",
      )
    )
      return;
    try {
      await api.deleteProduct(slug!);
      onSaved("Ջնջվեց։");
      onDone();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Չհաջողվեց ջնջել։");
    }
  }

  const firstError = (name: string) => fieldErrors[name]?.[0];

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{isNew ? "Նոր ապրանքախումբ" : copy.title || draft.slug}</h1>
          <p className="list__slug">{draft.slug || "slug դեռ լրացված չէ"}</p>
        </div>
        <div className="page__actions">
          {!isNew ? (
            <a
              className="btn btn--ghost"
              href={`${SITE_URL}/hy/products/${draft.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Տեսնել կայքում ↗
            </a>
          ) : null}
          <button className="btn btn--ghost" onClick={onDone}>
            ← Ցուցակ
          </button>
        </div>
      </div>

      {/* Settings ───────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2>Կարգավորումներ</h2>
            <p>Slug-ը կայքի հասցեն է — փոխելը փոխում է էջի URL-ը։</p>
          </div>
        </div>

        <div className="row">
          <TextField
            label="Slug"
            hint="լատինատառ, առանց բացատների"
            value={draft.slug}
            error={firstError("slug")}
            placeholder="rhetine-khoghovakner"
            onChange={(value) =>
              patch({ slug: value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
            }
          />

          <Field label="Ուղղություն" error={firstError("familySlug")}>
            <select
              value={draft.familySlug}
              onChange={(e) => patch({ familySlug: e.target.value })}
            >
              {families.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.labels.hy ?? f.slug}
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
            Հրապարակված է կայքում
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              onChange={(e) => patch({ isFeatured: e.target.checked })}
            />
            Ցույց տալ գլխավոր էջում
          </label>
        </div>
      </div>

      {/* Photos ─────────────────────────────────────────────────────────── */}
      {isNew ? (
        <div className="card">
          <div className="card__head">
            <div>
              <h2>Լուսանկարներ</h2>
              <p>Նախ պահիր ապրանքախումբը — հետո նկար ավելացնելը հասանելի կլինի։</p>
            </div>
          </div>
        </div>
      ) : (
        <Photos
          slug={slug!}
          images={images}
          onChanged={setImages}
          onError={onError}
        />
      )}

      {/* Copy ───────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card__head">
          <div>
            <h2>Տեքստեր</h2>
            <p>Դատարկ վերնագրով լեզուն կայք չի ուղարկվում։</p>
          </div>
        </div>

        <div className="tabs">
          {LOCALES.map((l) => (
            <button
              key={l}
              className={l === locale ? "tab tab--active" : "tab"}
              onClick={() => setLocale(l)}
            >
              {LOCALE_LABELS[l]}
              {draft.translations[l].title.trim() === "" ? " ·" : ""}
            </button>
          ))}
        </div>

        <TextField
          label="Վերնագիր"
          value={copy.title}
          error={firstError("title")}
          onChange={(title) => patchCopy({ title })}
        />

        <TextArea
          label="Կարճ նկարագրություն"
          hint="քարտի տեքստը՝ 1–2 նախադասություն"
          rows={2}
          value={copy.short ?? ""}
          onChange={(v) => patchCopy({ short: v || null })}
        />

        <TextField
          label="Քարտի ներքևի տողը"
          hint="ընտրության հուշում, օր․՝ «Ընտրություն ըստ բեռնվածության»"
          value={copy.benefit ?? ""}
          onChange={(v) => patchCopy({ benefit: v || null })}
        />

        <TextArea
          label="Ապրանքի էջի ներածական"
          rows={4}
          value={copy.lead ?? ""}
          onChange={(v) => patchCopy({ lead: v || null })}
        />

        <RowsEditor
          label="Ամփոփում"
          hint="«Ի՞նչ է լուծում», «Ո՞ւմ համար է», «Ինչպե՞ս ընտրել»"
          addLabel="Ավելացնել տող"
          rows={copy.overview}
          onChange={(overview) => patchCopy({ overview })}
        />

        <FeaturesEditor
          features={copy.features}
          onChange={(features) => patchCopy({ features })}
        />

        <StringList
          label="Բնութագրերի տողերը"
          hint="միայն անվանումները — արժեքները լրացնում է ընկերությունը"
          addLabel="Ավելացնել բնութագիր"
          placeholder="Տրամագիծ, մմ"
          items={copy.specs}
          onChange={(specs) => patchCopy({ specs })}
        />

        <StringList
          label="Մոդելներ"
          hint="կոնկրետ տեսակները, եթե կան"
          addLabel="Ավելացնել մոդել"
          placeholder="ՓՈԽԱՆՑՄԱՆ ՓՈԿ - A"
          items={copy.variants}
          onChange={(variants) => patchCopy({ variants })}
        />
      </div>

      <div className="savebar">
        <span className="savebar__status">
          {dirty ? "Չպահված փոփոխություններ կան։" : "Ամեն ինչ պահված է։"}
        </span>
        <div className="savebar__actions">
          {!isNew ? (
            <button className="btn btn--danger" onClick={() => void remove()}>
              Ջնջել
            </button>
          ) : null}
          <button
            className="btn btn--primary"
            disabled={busy || (!dirty && !isNew)}
            onClick={() => void save()}
          >
            {busy ? "Պահվում է…" : isNew ? "Ստեղծել" : "Պահել"}
          </button>
        </div>
      </div>
    </>
  );
}

/** The "what it solves / who it is for / how to choose" rows. */
function RowsEditor({
  label,
  hint,
  addLabel,
  rows,
  onChange,
}: {
  label: string;
  hint: string;
  addLabel: string;
  rows: OverviewRow[];
  onChange: (rows: OverviewRow[]) => void;
}) {
  const set = (i: number, changes: Partial<OverviewRow>) =>
    onChange(rows.map((row, at) => (at === i ? { ...row, ...changes } : row)));

  return (
    <div className="field">
      <span className="field__label">
        {label}
        <span className="field__hint">{hint}</span>
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
                onClick={() => onChange(rows.filter((_, at) => at !== i))}
              >
                ✕
              </button>
            </div>
          </div>
          <TextField
            label="Վերնագիր"
            value={row.title}
            onChange={(title) => set(i, { title })}
          />
          <TextArea
            label="Տեքստ"
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
        + {addLabel}
      </button>
    </div>
  );
}

/** Numbered advantage cards. */
function FeaturesEditor({
  features,
  onChange,
}: {
  features: FeatureCard[];
  onChange: (features: FeatureCard[]) => void;
}) {
  const set = (i: number, changes: Partial<FeatureCard>) =>
    onChange(features.map((f, at) => (at === i ? { ...f, ...changes } : f)));

  return (
    <div className="field">
      <span className="field__label">
        Առավելություններ
        <span className="field__hint">համարակալված քարտեր ապրանքի էջում</span>
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
                onClick={() => onChange(features.filter((_, at) => at !== i))}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="row">
            <TextField
              label="Համար"
              value={feature.number}
              onChange={(number) => set(i, { number })}
            />
            <TextField
              label="Վերնագիր"
              value={feature.title}
              onChange={(title) => set(i, { title })}
            />
          </div>
          <TextArea
            label="Տեքստ"
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
        + Ավելացնել առավելություն
      </button>
    </div>
  );
}
