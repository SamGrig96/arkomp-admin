import { useCallback, useEffect, useState } from "react";
import { ChangePassword } from "./components/ChangePassword";
import { Login } from "./components/Login";
import { ProductEditor } from "./components/ProductEditor";
import { ProductList } from "./components/ProductList";
import * as api from "./lib/api";
import { SITE_URL } from "./lib/site";
import type { AdminFamily, User } from "./lib/types";

/**
 * Routing is the URL hash: no router dependency for four screens, and the
 * address bar still points at the thing you are editing.
 */
type Route =
  | { name: "list" }
  | { name: "new" }
  | { name: "product"; slug: string }
  | { name: "password" };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "new") return { name: "new" };
  if (hash === "password") return { name: "password" };
  if (hash.startsWith("products/")) {
    return { name: "product", slug: decodeURIComponent(hash.slice("products/".length)) };
  }
  return { name: "list" };
}

const go = (hash: string) => {
  window.location.hash = hash;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  // Nothing to check when there is no stored token, so the gate starts open.
  const [checking, setChecking] = useState(() => api.getToken() !== null);
  const [route, setRoute] = useState<Route>(parseHash);
  const [families, setFamilies] = useState<AdminFamily[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setError(null);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const signedOut = () => {
      setUser(null);
      setError("Մուտքի ժամկետը լրացել է։ Մուտք գործեք նորից։");
    };
    window.addEventListener(api.SIGNED_OUT_EVENT, signedOut);
    return () => window.removeEventListener(api.SIGNED_OUT_EVENT, signedOut);
  }, []);

  // A token in storage still has to be checked: it may have expired, or the API
  // may have restarted with a new signing key.
  useEffect(() => {
    if (!api.getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => api.clearToken())
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .listFamilies()
      .then(setFamilies)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Ուղղությունները չբեռնվեցին։"),
      );
  }, [user]);

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 3000);
  }, []);

  if (checking) return <div className="empty">Ստուգվում է…</div>;

  if (!user) {
    return (
      <>
        {error ? (
          <div className="note note--error" style={{ margin: 16 }}>
            {error}
          </div>
        ) : null}
        <Login onSignedIn={setUser} />
      </>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <span className="topbar__brand">
          ԱՐԿՈՄՊ<span>կառավարում</span>
        </span>
        <a href="#/products">Տեսականի</a>
        <a href={SITE_URL} target="_blank" rel="noreferrer">
          Կայք ↗
        </a>
        <span className="topbar__spacer" />
        <span className="topbar__user">{user.displayName}</span>
        <a href="#/password">Գաղտնաբառ</a>
        <a
          href="#/products"
          onClick={() => {
            api.clearToken();
            setUser(null);
          }}
        >
          Ելք
        </a>
      </header>

      <main className="page">
        {user.mustChangePassword && route.name !== "password" ? (
          <div className="note note--warn">
            Դու դեռ օգտագործում ես սկզբնական գաղտնաբառը։{" "}
            <a href="#/password">Փոխիր այն</a>։
          </div>
        ) : null}

        {error ? <div className="note note--error">{error}</div> : null}
        {flash ? <div className="note note--ok">{flash}</div> : null}

        {route.name === "list" ? (
          <ProductList
            onOpen={(slug) => go(`#/products/${encodeURIComponent(slug)}`)}
            onCreate={() => go("#/new")}
            onError={setError}
          />
        ) : null}

        {route.name === "new" || route.name === "product" ? (
          <ProductEditor
            key={route.name === "product" ? route.slug : "new"}
            slug={route.name === "product" ? route.slug : null}
            families={families}
            onDone={() => go("#/products")}
            onError={setError}
            onSaved={showFlash}
          />
        ) : null}

        {route.name === "password" ? (
          <ChangePassword
            onDone={(updated) => {
              setUser(updated);
              showFlash("Գաղտնաբառը փոխվեց։");
              go("#/products");
            }}
            onError={setError}
          />
        ) : null}
      </main>
    </div>
  );
}
