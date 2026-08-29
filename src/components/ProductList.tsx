import { useCallback, useEffect, useState } from "react";
import * as api from "../lib/api";
import { describeError } from "../lib/errors";
import { useI18n } from "../lib/i18n";
import { move } from "../lib/move";
import type { AdminFamily, AdminProductRow } from "../lib/types";

/**
 * The catalogue as the site prints it: one row per group, in site order, with
 * the cover photo so a missing one is obvious at a glance.
 */
export function ProductList({
  onOpen,
  onCreate,
  onError,
}: {
  onOpen: (slug: string) => void;
  onCreate: () => void;
  onError: (message: string) => void;
}) {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<AdminProductRow[] | null>(null);
  const [families, setFamilies] = useState<AdminFamily[]>([]);
  const [family, setFamily] = useState("");
  const [orderDirty, setOrderDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Product titles come from the API in one language; showing them in the one
  // the panel is set to is the least surprising choice.
  const load = useCallback(async () => {
    try {
      const [products, fams] = await Promise.all([
        api.listProducts(locale),
        api.listFamilies(),
      ]);
      setRows(products);
      setFamilies(fams);
      setOrderDirty(false);
    } catch (e) {
      onError(describeError(e, t, t.list.loadFailed));
    }
  }, [locale, onError, t]);

  // Fetching on mount: the setState calls inside load() happen after the await,
  // which the rule cannot see.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  if (!rows) return <div className="empty">{t.app.loading}</div>;

  const visible = family
    ? rows.filter((r) => r.product.family.slug === family)
    : rows;

  // Reordering is only meaningful over the whole list; a filtered view would
  // silently move products past the ones it hides.
  const canReorder = !family;

  async function saveOrder() {
    if (!rows) return;
    setSaving(true);
    try {
      await api.reorderProducts(rows.map((r) => r.product.slug));
      setOrderDirty(false);
    } catch (e) {
      onError(describeError(e, t, t.list.orderFailed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{t.list.title}</h1>
          <p>{t.list.summary(rows.length, families.length)}</p>
        </div>
        <div className="page__actions">
          <select
            value={family}
            style={{ width: 220 }}
            onChange={(e) => setFamily(e.target.value)}
          >
            <option value="">{t.list.allFamilies}</option>
            {families.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.labels[locale] ?? f.slug} ({f.productCount})
              </option>
            ))}
          </select>
          <button className="btn btn--primary" onClick={onCreate}>
            {t.list.create}
          </button>
        </div>
      </div>

      {orderDirty ? (
        <div className="savebar" style={{ marginBottom: 16 }}>
          <span className="savebar__status">{t.list.orderChanged}</span>
          <div className="savebar__actions">
            <button className="btn btn--ghost" onClick={() => void load()}>
              {t.list.cancel}
            </button>
            <button className="btn btn--primary" disabled={saving} onClick={saveOrder}>
              {saving ? t.list.savingOrder : t.list.saveOrder}
            </button>
          </div>
        </div>
      ) : null}

      <div className="list">
        <div className="list__row list__head">
          <span>{t.list.colImage}</span>
          <span>{t.list.colName}</span>
          <span>{t.list.colFamily}</span>
          <span>{t.list.colStatus}</span>
          <span>{t.list.colOrder}</span>
        </div>

        {visible.map((row) => {
          const at = rows.indexOf(row);
          return (
            <div className="list__row" key={row.product.slug}>
              {row.product.image ? (
                <img
                  className="list__thumb list__thumb--filled"
                  src={row.product.image.url}
                  alt=""
                />
              ) : (
                <span className="list__thumb" title={t.list.noImage} />
              )}

              <div>
                <button className="list__title" onClick={() => onOpen(row.product.slug)}>
                  {row.product.title}
                </button>
                <div className="list__slug">{row.product.slug}</div>
              </div>

              <span className="list__meta">{row.product.family.label}</span>

              <span>
                {row.isPublished ? null : (
                  <span className="badge badge--off">{t.list.hidden}</span>
                )}{" "}
                {row.product.featured ? (
                  <span className="badge badge--featured">{t.list.featured}</span>
                ) : null}{" "}
                <span className="badge">{t.list.imageCount(row.images)}</span>
              </span>

              <span className="list__order">
                <button
                  className="btn btn--ghost btn--icon"
                  title={t.common.up}
                  disabled={!canReorder || at === 0}
                  onClick={() => {
                    setRows(move(rows, at, at - 1));
                    setOrderDirty(true);
                  }}
                >
                  ↑
                </button>
                <button
                  className="btn btn--ghost btn--icon"
                  title={t.common.down}
                  disabled={!canReorder || at === rows.length - 1}
                  onClick={() => {
                    setRows(move(rows, at, at + 1));
                    setOrderDirty(true);
                  }}
                >
                  ↓
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {!canReorder ? (
        <p className="muted" style={{ marginTop: 12 }}>
          {t.list.reorderHint}
        </p>
      ) : null}
    </>
  );
}
