# Parcours E2E — Chromium (Playwright)

`journeys.mjs` pilote le dashboard avec un vrai navigateur et **vérifie des résultats**
(présence de KPIs, ouverture de fiche, benchmark rendu), pas seulement des screenshots. Il
**échoue** (`exitCode=1`) dès qu'une page émet une erreur JS ou qu'un parcours casse.

## Prérequis
1. **Backend** `jurilux-insight` seedé sur `:8088` (table `insight_appearances` peuplée, sinon
   les vues sont vides mais valides).
2. **Front** lancé : `API_TARGET=http://127.0.0.1:8088 npm run dev`.

## Lancer
```bash
FRONT_URL=http://127.0.0.1:5173 \
PW_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node e2e/journeys.mjs
```
Résolution de Playwright : module local (`npm i -D playwright`) sinon installation globale du
conteneur. `PW_CHROME` force le binaire Chromium. Screenshots dans `e2e/artifacts/`.
