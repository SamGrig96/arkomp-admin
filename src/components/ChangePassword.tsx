import { useState } from "react";
import * as api from "../lib/api";
import { describeError } from "../lib/errors";
import { useT } from "../lib/i18n";
import type { User } from "../lib/types";
import { Field } from "./fields";

const MINIMUM = 8;

export function ChangePassword({
  onDone,
  onError,
}: {
  onDone: (user: User) => void;
  onError: (message: string) => void;
}) {
  const t = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = repeat !== "" && next !== repeat;
  const tooShort = next !== "" && next.length < MINIMUM;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      onDone(await api.changePassword(current, next));
    } catch (e) {
      onError(describeError(e, t, t.password.failed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{t.password.title}</h1>
          <p>{t.password.lead}</p>
        </div>
        <div className="page__actions">
          <a className="btn btn--ghost" href="#/products">
            {t.editor.back}
          </a>
        </div>
      </div>

      <form className="card" style={{ maxWidth: 460 }} onSubmit={submit}>
        <Field label={t.password.current}>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>

        <Field
          label={t.password.next}
          hint={t.password.minHint(MINIMUM)}
          error={tooShort ? t.password.tooShort(MINIMUM) : undefined}
        >
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>

        <Field
          label={t.password.repeat}
          error={mismatch ? t.password.mismatch : undefined}
        >
          <input
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </Field>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={busy || !current || tooShort || mismatch || !next || !repeat}
        >
          {busy ? t.password.submitting : t.password.submit}
        </button>
      </form>
    </>
  );
}
