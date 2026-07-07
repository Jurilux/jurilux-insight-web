// Parcours E2E Chromium du dashboard Jurilux Insight. Pilote les 3 vues + une fiche profil,
// vérifie des résultats (pas juste des screenshots) et échoue (exitCode=1) sur toute erreur page.
// Prérequis : backend jurilux-insight seedé sur :8088 + `npm run dev` (front) accessibles.
//   FRONT_URL (défaut http://127.0.0.1:5173) · PW_CHROME (chemin Chromium) · OUT_DIR (artifacts)
import { mkdirSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = (await import('/opt/node22/lib/node_modules/playwright/index.js')).default); }

const FRONT = process.env.FRONT_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || new URL('./artifacts', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const opts = { args: ['--no-sandbox'] };
if (process.env.PW_CHROME) opts.executablePath = process.env.PW_CHROME;
const browser = await chromium.launch(opts);
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });

const results = [];
async function step(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log(`✓ ${name}`); }
  catch (e) { results.push({ name, ok: false, err: String(e.message || e).split('\n')[0] }); console.log(`✗ ${name} — ${e.message?.split('\n')[0]}`); }
}
const seeText = (t) => page.getByText(t, { exact: false }).first().waitFor({ state: 'visible', timeout: 8000 });

await step("Vue d'ensemble — KPIs et répartitions", async () => {
  await page.goto(FRONT, { waitUntil: 'networkidle' });
  await seeText("Vue d'ensemble");
  await seeText('Avocats profilés');
  await seeText('Par matière');
  await seeText('Par juridiction');
  await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });
});

await step('Avocats — liste + fiche profil', async () => {
  await page.getByRole('button', { name: /Avocats/ }).first().click();
  await page.getByPlaceholder(/Rechercher un avocat/).waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('table.grid tbody tr').first().waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('table.grid tbody tr .linklike').first().click();
  await seeText('taux estimé');
  await seeText('Décisions (');
  await page.screenshot({ path: `${OUT}/profile.png`, fullPage: true });
  await page.getByRole('button', { name: /Ajouter au benchmark/ }).click();
  await page.locator('.drawer-close').click();
});

await step('Benchmark — comparateur 2 avocats', async () => {
  await page.locator('table.grid tbody tr .chip').nth(1).click();  // 2e avocat
  await page.getByRole('button', { name: /Comparateur/ }).first().click();
  await seeText('Taux estimé');
  await page.locator('.compare-grid').waitFor({ state: 'visible', timeout: 8000 });
  await page.screenshot({ path: `${OUT}/compare.png`, fullPage: true });
});

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} parcours OK · ${errors.length} erreur(s) page`);
if (errors.length) console.log('ERREURS PAGE:\n' + errors.slice(0, 8).join('\n'));
if (failed.length || errors.length) process.exitCode = 1;
