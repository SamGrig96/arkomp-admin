import { useState } from "react";
import * as api from "../lib/api";
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
      onError(e instanceof Error ? e.message : "Չհաջողվեց փոխել գաղտնաբառը։");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page__head">
        <div>
          <h1>Գաղտնաբառ</h1>
          <p>Փոխիր քո մուտքի գաղտնաբառը։</p>
        </div>
        <div className="page__actions">
          <a className="btn btn--ghost" href="#/products">
            ← Ցուցակ
          </a>
        </div>
      </div>

      <form className="card" style={{ maxWidth: 460 }} onSubmit={submit}>
        <Field label="Ընթացիկ գաղտնաբառ">
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>

        <Field
          label="Նոր գաղտնաբառ"
          hint={`նվազագույնը ${MINIMUM} նիշ`}
          error={tooShort ? `Առնվազն ${MINIMUM} նիշ։` : undefined}
        >
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>

        <Field
          label="Կրկնիր նոր գաղտնաբառը"
          error={mismatch ? "Գաղտնաբառերը չեն համընկնում։" : undefined}
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
          {busy ? "Պահվում է…" : "Փոխել գաղտնաբառը"}
        </button>
      </form>
    </>
  );
}
