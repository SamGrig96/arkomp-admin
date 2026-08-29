import type { ReactNode } from "react";
import { useT } from "../lib/i18n";
import { move } from "../lib/move";

/** A labelled input with room for a hint and a validation message. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={error ? "field field--error" : "field"}>
      <span className="field__label">
        {label}
        {hint ? <span className="field__hint">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/**
 * An ordered list of plain strings — spec labels and model names. Rows can be
 * moved because the site prints them in this order.
 */
export function StringList({
  label,
  hint,
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel: string;
}) {
  const t = useT();
  const set = (i: number, value: string) =>
    onChange(items.map((item, at) => (at === i ? value : item)));

  return (
    <div className="field">
      <span className="field__label">
        {label}
        {hint ? <span className="field__hint">{hint}</span> : null}
      </span>

      {items.map((item, i) => (
        <div className="stringlist__item" key={i}>
          <input
            type="text"
            value={item}
            placeholder={placeholder}
            onChange={(e) => set(i, e.target.value)}
          />
          <MoveButtons
            index={i}
            count={items.length}
            onMove={(from, to) => onChange(move(items, from, to))}
          />
          <button
            type="button"
            className="btn btn--danger btn--icon"
            title={t.common.remove}
            onClick={() => onChange(items.filter((_, at) => at !== i))}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn--ghost btn--small"
        onClick={() => onChange([...items, ""])}
      >
        + {addLabel}
      </button>
    </div>
  );
}

export function MoveButtons({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
}) {
  const t = useT();
  return (
    <>
      <button
        type="button"
        className="btn btn--ghost btn--icon"
        title={t.common.up}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        className="btn btn--ghost btn--icon"
        title={t.common.down}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
    </>
  );
}
