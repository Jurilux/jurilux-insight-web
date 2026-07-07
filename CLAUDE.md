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
- **Public, sans auth** : les endpoints `/api/insight/*` sont publics. Pas de mur de login ici.
- **Navigation par onglets** dans `src/App.tsx` (état local, pas de routeur) : Vue d'ensemble
  (`Dashboard.tsx`), Avocats (`Lawyers.tsx`), Comparateur (`Compare.tsx`). Benchmark = état
  partagé remonté dans `App`.

## Contrat backend consommé (`/api/insight/*`)
`overview`, `analytics`, `lawyers`, `lawyers/{key}`, `compare?keys=`, `export/lawyers.csv`,
`matters`. Toute évolution doit rester alignée sur `jurilux-insight/app/insight.py`.

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
node e2e/journeys.mjs    # Chromium : pilote les 3 vues + une fiche, gate sur erreurs page
```
Toujours `npm run build` (typecheck strict : `noUnusedLocals`/`noUnusedParameters`) avant de pousser.
