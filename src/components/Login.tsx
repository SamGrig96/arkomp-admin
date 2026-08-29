import { useState } from "react";
import * as api from "../lib/api";
import type { User } from "../lib/types";
import { Field } from "./fields";

export function Login({ onSignedIn }: { onSignedIn: (user: User) => void }) {
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
      setError(e instanceof Error ? e.message : "Մուտքը չհաջողվեց։");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <h1>ԱՐԿՈՄՊ · կառավարում</h1>
        <p>Տեսականու խմբագրման վահանակ</p>

        {error ? <div className="note note--error">{error}</div> : null}

        <Field label="Օգտանուն">
          <input
            type="text"
            value={username}
            autoComplete="username"
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>

        <Field label="Գաղտնաբառ">
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
          {busy ? "Մուտք…" : "Մուտք"}
        </button>
      </form>
    </div>
  );
}
