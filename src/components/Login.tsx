import { useState } from "react";
import * as api from "../lib/api";
import { describeError } from "../lib/errors";
import { useT } from "../lib/i18n";
import type { User } from "../lib/types";
import { Field } from "./fields";
import { LocaleSwitch } from "./LocaleSwitch";

export function Login({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.login(username.trim(), password);
      api.setToken(result.token);
      onSignedIn(result.user);
    } catch (e) {
      setError(describeError(e, t, t.login.failed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__lang">
          <LocaleSwitch />
        </div>

        <h1>{t.login.title}</h1>
        <p>{t.login.lead}</p>

        {error ? <div className="note note--error">{error}</div> : null}

        <Field label={t.login.username}>
          <input
            type="text"
            value={username}
            autoComplete="username"
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field label={t.login.password}>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={busy || !username || !password}
        >
          {busy ? t.login.submitting : t.login.submit}
        </button>
      </form>
    </div>
  );
}
