# ⚠️ DÉPÔT ARCHIVÉ — produit fusionné dans Jurilux

> **Ce front est terminé.** Ses vues (dashboard, cabinets, comparateur, rapport, méthodologie/RGPD)
> ont été **intégrées à la page Insight de [`jurilux-web`](https://github.com/Jurilux/jurilux-web)**
> dans le design jurilux (décision produit : un seul produit). Ne plus rien développer ici.

# jurilux-insight-web

Frontend du **dashboard d'intelligence contentieux** Jurilux Insight. Surface publique
d'analytics de jurisprudence luxembourgeoise, centrée sur le **profilage d'avocats**
(données publiques, extraction locale/déterministe côté backend `jurilux-insight`).

## Fonctionnalités
- **Vue d'ensemble** — KPIs globaux (avocats, décisions, issues estimables, taux de succès
  estimé), répartition par matière / juridiction, évolution par année.
- **Avocats** — recherche, tri (volume / récence / taux estimé), filtre par matière, fiche
  profil détaillée (décisions, côté demandeur/défendeur, issue estimée, matières, réseau de
  confrères), **export CSV**.
- **Comparateur** — benchmark côte à côte de 2 à 6 avocats.

> ⚠️ Taux de succès **estimés** (heuristique, jamais une certitude). Profilage limité aux
> **avocats et parties** — jamais de magistrats (règle RGPD/CNPD).

## Stack
React 18 + Vite 5 + TypeScript, **zéro dépendance de charting** (barres CSS, courbes SVG inline).
Consomme les endpoints publics `/api/insight/*` du backend `jurilux-insight` (same-origin ;
proxy Vite en dev, Caddy en prod).

## Dev local
```bash
npm install
# backend jurilux-insight sur :8088 (uvicorn app.main:app --port 8088)
API_TARGET=http://127.0.0.1:8088 npm run dev   # http://127.0.0.1:5173
npm run build                                   # typecheck (tsc) + build vite
```

## Tests E2E (Chromium)
```bash
node e2e/journeys.mjs      # pilote les 3 vues + une fiche, échoue sur toute erreur page
```
Voir `e2e/README.md`.
