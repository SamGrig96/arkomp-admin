# ARKOMP admin

The panel the catalogue is edited from — product groups, their Armenian and
Russian copy, and their photos. It is a browser app with no backend of its own:
it signs in to [arkomp-api](https://github.com/SamGrig96/arkomp-api) and writes
there, and [arkomp-web](https://github.com/SamGrig96/arkomp-web) reads the same
database. That shared database is the whole connection between the two.

```
arkomp-admin  ──writes──>  arkomp-api  <──reads──  arkomp-web
    (this)                  (SQLite)                (the site)
```

React + Vite, TypeScript, no UI framework and no router — four screens do not
need one. The panel speaks Armenian and Russian, switched from the top bar and
remembered per browser.

## Run it

The API has to be running first (`cd arkomp-api/Arkomp.Api && dotnet run`).

```bash
npm install
cp .env.example .env
npm run dev
```

That opens <http://localhost:5173>. Sign in with the account the API created on
its first run — `admin`, with the password from its `Auth:SeedPassword`
(`arkomp-admin` in local development). The panel nags until you change it.

## What you can do

**Catalogue list** — every group in site order, with its cover photo, direction,
whether it is published, and whether it appears on the home page. The ↑↓ buttons
change the order the site prints, and one Save writes the whole order.

**Photos** — drag files onto the drop zone, or click it. The first photo is the
card cover; ← → move a photo, ✕ deletes it. Alt text is per language and saves
when you leave the field. Uploads, order and alt text save as they happen — there
is no Save button to forget.

**Copy** — a tab per language, with every field the site renders: title, card
summary, the card's bottom line, the product-page lead, the "what it solves /
who it is for / how to choose" rows, the numbered advantage cards, the spec
labels and the model names. A language with an empty title is not sent to the
site, so a half-translated group is fine.

The language of the panel and the language being edited are separate choices —
the Russian copy can perfectly well be written with Armenian buttons around it.
The copy tabs are therefore labelled in the languages themselves (Հայերեն,
Русский) and stay that way whichever language the panel is set to.

**Settings** — slug (the page's URL), direction, published, and shown on the home
page. Renaming a slug changes the address of the live page.

**New group** — creates it; photos become available once it is saved.

## When edits show up on the site

Straight away in development. In production the site prerenders and refreshes on
a five-minute window, so a change appears within five minutes rather than
instantly.

## Configuration

`VITE_*` values are inlined at build time, so a change means rebuilding — they
are not runtime settings.

| Variable | Default | What it is |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5080` | The catalogue API this writes to |
| `VITE_SITE_URL` | `http://localhost:3000` | Only for the "view on the site" links |

The panel picks its language from what you last chose, falling back to the
browser’s. Adding a third one means adding a block to `src/lib/i18n.ts`;
TypeScript then lists every string still missing from it.

The API must list this app's origin under `Cors__Origins` or the browser blocks
every call — `http://localhost:5173` is there by default.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on <http://localhost:5173> |
| `npm run build` | Type-checks and builds into `dist/` |
| `npm run preview` | Serves the built `dist/` |
| `npm run lint` | oxlint |

## Deploying

`npm run build` produces static files — any static host serves them. The
`Dockerfile` builds them and serves them with nginx:

```bash
docker build --build-arg VITE_API_URL=https://api.example.com -t arkomp-admin .
```

Two things to get right wherever it lands: the API needs the admin's origin in
`Cors__Origins`, and it needs a real `Auth__SigningKey` — otherwise every API
restart signs everyone out.

## Layout

```
src/
  App.tsx                 sign-in gate, hash routing, top bar
  components/
    Login.tsx             sign-in
    ChangePassword.tsx    password change
    ProductList.tsx       the catalogue, with reordering
    ProductEditor.tsx     settings, copy per language, repeating blocks
    Photos.tsx            upload, order, alt text, delete
    fields.tsx            the small form pieces shared by the screens
    I18nProvider.tsx      holds the panel's language
    LocaleSwitch.tsx      the ՀԱՅ / РУС switch
  lib/
    api.ts                every call to the API, plus token handling
    i18n.ts               every string in the panel, in both languages
    errors.ts             turns a failed call into a sentence
    types.ts              mirrors the API's DTOs
    site.ts               where the public site lives
```
