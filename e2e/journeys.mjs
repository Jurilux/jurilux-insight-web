// Parcours E2E Chromium du dashboard Jurilux Insight. Le produit est PRIVÉ (mur d'auth) :
// on se connecte d'abord (compte démo demo@demo.lu / demo semé par le backend), puis on
// pilote les vues + une fiche, en vérifiant des résultats (pas juste des screenshots).
// Échoue (exitCode=1) sur toute erreur page ou parcours cassé.
//   FRONT_URL (défaut http://127.0.0.1:5173) · PW_CHROME (chemin Chromium) · OUT_DIR (artifacts)
import { mkdirSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = (await import('/opt/node22/lib/node_modules/playwright/index.js')).default); }

const FRONT = process.env.FRONT_URL || 'http://127.0.0.1:5173';
const OUT = process.env.OUT_DIR || new URL('./artifacts', import.meta.url).pathname;
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@demo.lu';
const DEMO_PWD = process.env.DEMO_PWD || 'demo';
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
const clickNav = (label) => page.locator('.nav-item').filter({ hasText: label }).first().click();

await step('Mur d\'authentification → connexion (compte démo)', async () => {
  await page.goto(FRONT, { waitUntil: 'networkidle' });
  await page.locator('form.auth-form').waitFor({ state: 'visible', timeout: 8000 });
  await page.getByPlaceholder(/vous@cabinet/).fill(DEMO_EMAIL);
  await page.getByPlaceholder(/8 caractères/).fill(DEMO_PWD);
  await page.locator('form.auth-form button[type=submit]').click();
  await seeText("Vue d'ensemble");  // le dashboard s'affiche une fois connecté
});

await step("Vue d'ensemble — KPIs et répartitions", async () => {
  await seeText('Avocats profilés');
  await seeText('Par matière');
  await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true });
});

await step('Avocats — liste + fiche profil', async () => {
  await clickNav('Avocats');
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
  await page.locator('table.grid tbody tr .chip').nth(1).click();
  await clickNav('Comparateur');
  await seeText('Taux estimé');
  await page.locator('.compare-grid').waitFor({ state: 'visible', timeout: 8000 });
  await page.screenshot({ path: `${OUT}/compare.png`, fullPage: true });
});

await step('Recherche jurisprudentielle — soumission sans crash', async () => {
  await clickNav('Recherche');
  await page.getByPlaceholder(/préavis|Question|licenciement/).first().waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('.view input.search').fill('préavis de licenciement');
  await page.getByRole('button', { name: /Rechercher/ }).click();
  await page.waitForTimeout(1500);  // réponse OU refus gracieux — les deux valides
  await page.screenshot({ path: `${OUT}/search.png`, fullPage: true });
});

await step('Veille — créer une alerte', async () => {
  await clickNav('Veille');
  await page.getByPlaceholder(/licenciement cadre|sujet/).first().waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('.view input.search').fill('licenciement cadre dirigeant');
  await page.getByRole('button', { name: /Créer une alerte/ }).click();
  await page.waitForTimeout(800);
  await seeText('licenciement cadre dirigeant');
  await page.screenshot({ path: `${OUT}/alerts.png`, fullPage: true });
});

await step('Méthodologie & RGPD — demande d\'opposition', async () => {
  await clickNav('Méthodologie');
  await seeText('Jurimétrie');
  await page.locator('.rgpd-form input').first().fill('Maître Jean TESTUS');
  await page.getByRole('button', { name: /Envoyer la demande/ }).click();
  await seeText('Demande enregistrée');
  await page.screenshot({ path: `${OUT}/methodology.png`, fullPage: true });
});

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} parcours OK · ${errors.length} erreur(s) page`);
if (errors.length) console.log('ERREURS PAGE:\n' + errors.slice(0, 8).join('\n'));
if (failed.length || errors.length) process.exitCode = 1;
