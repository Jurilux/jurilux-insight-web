# CLAUDE.md — jurilux-insight-web

Frontend du **dashboard d'intelligence contentieux** Jurilux Insight (backend :
`jurilux-insight`). Produit **public** : la surface est l'analytics de jurisprudence,
centrée **profilage d'avocats**. Code et commentaires en **français** : garder cette langue.

## Architecture (respecter ces choix)
- **React 18 + Vite 5 + TypeScript strict**, **zéro dépendance de charting** (barres CSS,
  courbes SVG inline dans `src/charts.tsx`). Ne pas ajouter de lib de graphes sans nécessité.
- **Same-origin** : appels `fetch('/api/insight/*')` relayés par le proxy Vite en dev
  (`vite.config.ts`, `API_TARGET`) et par Caddy en prod. Client dans `src/api.ts` (types =
  miroir des formes backend `app/insight.py`).
- **Accès réservé (B2B)** : mur d'authentification `src/AuthGate.tsx` en amont dans `main.tsx`
  (login/inscription, SSO si configuré). Les endpoints `/api/insight/*` restent publics côté API,
  mais l'app n'est rendue qu'une fois connecté.
- **Navigation par onglets** dans `src/App.tsx` (état local, pas de routeur) : Vue d'ensemble
  (`Dashboard.tsx`), Avocats (`Lawyers.tsx`), **Cabinets** (`Firms.tsx`), Comparateur
  (`Compare.tsx`), **Recherche** (`Search.tsx`), **Veille** (`Alerts.tsx`), **Rapport**
  (`Report.tsx`, imprimable/PDF), **Méthodologie** (`Methodology.tsx`, conformité + droits RGPD).
  Benchmark = état partagé remonté dans `App`. Composants transverses dans `src/ui.tsx`.

## Contrat backend consommé (`/api/insight/*`)
`overview`, `analytics` (avec `amount_median`/`delai_median`), `lawyers`, `lawyers/{key}`,
`firms`, `firms/{name}`, `compare?keys=`, `articles`, `export/lawyers.csv`, `matters`, `stats`,
`rgpd-request` (POST). Types = miroir des formes backend ; rester aligné sur
`jurilux-insight/app/insight.py` (helpers `pct`/`euro`/`delai`/`estSignificatif` dans `api.ts`).

## Règles produit NON NÉGOCIABLES
- Taux de succès toujours affichés comme **estimés / indicatifs** (jamais une certitude) —
  bandeau `TAUX_ESTIME` présent sur chaque vue.
- Profilage **avocats et parties uniquement**, **jamais de magistrats** (RGPD/CNPD). Ne pas
  ajouter d'écran qui exposerait des magistrats.

## Dev & tests
```bash
npm install
API_TARGET=http://127.0.0.1:8088 npm run dev
npm run build            # tsc --noEmit + vite build (doit passer avant push)
node e2e/journeys.mjs    # Chromium : login (demo/demo) + pilote les 9 vues, gate sur erreurs page
```
Toujours `npm run build` (typecheck strict : `noUnusedLocals`/`noUnusedParameters`) avant de pousser.
