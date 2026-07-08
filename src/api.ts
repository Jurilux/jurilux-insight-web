// Client API Jurilux Insight — same-origin (proxy Vite en dev, Caddy en prod).
// Le cœur produit = les endpoints PUBLICS /api/insight/* (aucune auth requise) :
// analytics contentieux, profilage d'avocats, benchmark, export. Extraction locale
// et déterministe côté backend (données publiques de jurisprudence, avocats uniquement).

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ---------- session (jeton opaque, en-tête Bearer) ----------
const TOKEN_KEY = 'jurilux_insight_token';
const EMAIL_KEY = 'jurilux_insight_email';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredEmail = () => localStorage.getItem(EMAIL_KEY);
function storeSession(token: string, email: string) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(EMAIL_KEY, email); }
export function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY); }
function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json', ...authHeaders() } });
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as { detail?: string }));
    throw new HttpError(res.status, d.detail || `Erreur (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method, headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as { detail?: string }));
    throw new HttpError(res.status, d.detail || `Erreur (HTTP ${res.status})`);
  }
  return (await res.json().catch(() => ({}))) as T;
}

// ---------- types (miroir des formes backend, cf. app/insight.py) ----------
export interface Row {
  cle: string | number; cases: number; decided: number; won: number; win_rate: number | null;
  amount_median?: number | null; amount_n?: number;
  delai_median?: number | null; delai_n?: number;
}

export interface Overview {
  lawyers: number; cases: number; decided: number; won: number; win_rate: number | null;
  first_year: number | null; last_year: number | null;
  amount_median?: number | null; amount_n?: number;
  delai_median?: number | null; delai_n?: number;
  top_matters: Row[]; top_juridictions: Row[];
}

export interface Analytics {
  overall: { cases: number; decided: number; won: number; win_rate: number | null; lawyers: number };
  by_matter: Row[]; by_juridiction: Row[]; by_year: Row[];
}

export interface Matter { name: string; count: number; }

export interface Lawyer {
  name_key: string; name: string; cases: number;
  first_year: number | null; last_year: number | null;
  won?: number; decided?: number;
}

export interface CoCounsel { name_key: string; name: string; count: number; relation: string; }

export interface Case {
  display_name: string; doc_id: string; year: number | null;
  juridiction_key: string | null; side?: string | null; won?: number | null; matter?: string | null;
  articles?: string | null; sens?: string | null;
}

export interface ArticleCite { article: string; decisions: number; }

export interface Profile {
  name_key: string; name: string; cases_count: number;
  first_year: number | null; last_year: number | null;
  as_demandeur: number; as_defendeur: number; won: number; lost: number; decided: number;
  amount_median?: number | null; amount_n?: number; firm?: string | null;
  matters: Matter[]; cocounsel: CoCounsel[]; cases: Case[];
}

export interface Firm { firm: string; cases: number; lawyers: number; won: number; decided: number; win_rate: number | null; }
export interface FirmProfile {
  firm: string; cases_count: number; lawyers_count: number;
  won: number; lost: number; decided: number; win_rate: number | null;
  amount_median?: number | null; amount_n?: number;
  first_year: number | null; last_year: number | null;
  matters: Matter[]; lawyers: { name_key: string; name: string; cases: number }[];
}

export interface CompareProfile {
  name_key: string; name: string; cases: number; won: number; lost: number; decided: number;
  win_rate: number | null; as_demandeur: number; as_defendeur: number;
  first_year: number | null; last_year: number | null;
  amount_median?: number | null; amount_n?: number; matters: Matter[];
}

// ---------- appels ----------
export const overview = () => get<Overview>('/api/insight/overview');

export const analytics = (matter = '', juridiction = '') =>
  get<Analytics>('/api/insight/analytics'
    + (matter ? `?matter=${encodeURIComponent(matter)}` : '')
    + (juridiction ? `${matter ? '&' : '?'}juridiction=${encodeURIComponent(juridiction)}` : ''));

export const matters = () => get<{ items: Matter[] }>('/api/insight/matters').then((d) => d.items);

export const topArticles = (limit = 12) => get<{ items: ArticleCite[] }>(`/api/insight/articles?limit=${limit}`).then((d) => d.items);

// Libellé lisible du sens du dispositif.
export const sensLabel = (s?: string | null): string => ({
  confirmation: 'confirmé', réformation: 'réformé', cassation: 'cassé', rejet: 'pourvoi rejeté', irrecevabilité: 'irrecevable',
} as Record<string, string>)[s || ''] || (s || '');

export const lawyers = (q = '', limit = 50, sort = 'cases', matter = '') =>
  get<{ items: Lawyer[] }>(
    `/api/insight/lawyers?limit=${limit}&sort=${sort}`
    + (q ? `&q=${encodeURIComponent(q)}` : '')
    + (matter ? `&matter=${encodeURIComponent(matter)}` : ''),
  ).then((d) => d.items);

export const lawyer = (key: string) =>
  get<Profile>(`/api/insight/lawyers/${encodeURIComponent(key)}`);

export const firms = (q = '', limit = 60, sort = 'cases') =>
  get<{ items: Firm[] }>(`/api/insight/firms?limit=${limit}&sort=${sort}${q ? `&q=${encodeURIComponent(q)}` : ''}`).then((d) => d.items);
export const firm = (name: string) =>
  get<FirmProfile>(`/api/insight/firms/${encodeURIComponent(name)}`);

export const compare = (keys: string[]) =>
  get<{ profiles: CompareProfile[] }>(`/api/insight/compare?keys=${encodeURIComponent(keys.join(','))}`)
    .then((d) => d.profiles);

// Export CSV : URL directe (téléchargement navigateur), mêmes filtres que la liste.
export const exportLawyersUrl = (q = '', sort = 'cases', matter = '', limit = 200) =>
  '/api/insight/export/lawyers.csv?limit=' + limit + '&sort=' + sort
  + (q ? `&q=${encodeURIComponent(q)}` : '')
  + (matter ? `&matter=${encodeURIComponent(matter)}` : '');

// ---------- helpers de présentation ----------
export function pct(v: number | null | undefined): string {
  return v == null ? '—' : `${Math.round(v * 100)} %`;
}

// Montant € (indicatif). Compact au-delà de 10 k (« 12,3 k € »), sinon entier groupé.
export function euro(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v >= 10000) return `${(v / 1000).toLocaleString('fr', { maximumFractionDigits: 1 })} k €`;
  return `${Math.round(v).toLocaleString('fr')} €`;
}

// Délai de procédure estimé (jours) → libellé lisible : « ~8 mois », « ~2,2 ans ».
export function delai(days: number | null | undefined): string {
  if (days == null) return '—';
  if (days < 60) return `~${days} j`;
  if (days < 545) return `~${Math.round(days / 30)} mois`;
  return `~${(days / 365).toLocaleString('fr', { maximumFractionDigits: 1 })} ans`;
}

// Le taux de succès est ESTIMÉ (heuristique sur le dispositif) → jamais présenté comme certain.
export const TAUX_ESTIME = 'Taux de succès estimé (indicatif) — heuristique sur le dispositif, jamais une certitude.';

// Seuil de significativité : sous ce nombre d'issues estimables, un taux n'est pas fiable.
export const SEUIL_SIGNIF = 10;
export const estSignificatif = (decided?: number | null) => (decided ?? 0) >= SEUIL_SIGNIF;

// ---------- comptes (must-have B2B : accès protégé) ----------
export interface AuthUser { email: string; plan?: string; is_admin?: boolean }
export interface Me { email: string; plan: string; is_admin: boolean; quota?: { limit: number | null; used: number; remaining: number | null } }

async function authCall(path: string, email: string, password: string): Promise<AuthUser> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json().catch(() => ({} as { detail?: string; token?: string; user?: { email: string } }));
  if (!res.ok) throw new HttpError(res.status, data.detail || `Erreur (HTTP ${res.status})`);
  storeSession(data.token!, data.user!.email);
  return data.user as AuthUser;
}
export const login = (email: string, password: string) => authCall('/api/auth/login', email, password);
export const register = (email: string, password: string) => authCall('/api/auth/register', email, password);
export async function logout(): Promise<void> {
  try { await fetch('/api/auth/logout', { method: 'POST', headers: { ...authHeaders() } }); } finally { clearSession(); }
}
export async function me(): Promise<Me | null> {
  try {
    const res = await fetch('/api/me', { headers: { ...authHeaders() } });
    if (!res.ok) return null;
    const d = await res.json();
    return { email: d.user.email, plan: d.user.plan, is_admin: !!d.user.is_admin, quota: d.quota };
  } catch { return null; }
}
export async function oidcEnabled(): Promise<boolean> {
  try { return (await (await fetch('/api/auth/oidc/enabled')).json()).enabled === true; } catch { return false; }
}
export const oidcLogin = () => { window.location.href = '/api/auth/oidc/login'; };
export function captureOidcToken(): void {
  const m = window.location.hash.match(/token=([^&]+)/);
  if (m) { storeSession(decodeURIComponent(m[1]), getStoredEmail() || ''); history.replaceState(null, '', window.location.pathname); }
}

// ---------- recherche jurisprudentielle (RAG — must-have : trouver/lire les décisions) ----------
export interface Citation {
  doc_id: string; url?: string; pdf_url?: string; year?: number | null;
  juridiction_key?: string | null; content?: string;
  source_type?: 'jurisprudence' | 'law' | 'projet_loi'; title?: string;
}
export interface AskResponse {
  answer: string | null; citations: Citation[]; refused: boolean;
  status?: 'ok' | 'partial'; suggested_question?: string | null; follow_ups?: string[] | null;
}
export async function ask(q: string, topK = 20): Promise<AskResponse> {
  const res = await fetch('/api/ask', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ q, topK, temperature: 0 }),
  });
  if (!res.ok) throw new HttpError(res.status, `Le serveur a répondu HTTP ${res.status}.`);
  return (await res.json()) as AskResponse;
}
export function citationPdf(c: Citation): string | null {
  if (c.source_type === 'law' && c.pdf_url) return c.pdf_url;
  if (c.doc_id) return `/docs/${encodeURIComponent(c.doc_id)}.pdf`;
  return c.pdf_url || c.url || null;
}

// ---------- veille / alertes (must-have B2B : suivre un sujet / une partie adverse) ----------
export interface Alert { id: number; query: string; source_type: string | null; unseen: number; total: number; }
export interface AlertHit {
  id: number; doc_id: string; source_type: string | null; title: string | null;
  year: number | null; juridiction_key: string | null; url: string | null; pdf_url: string | null; seen: number;
}
export const listAlerts = () => get<{ items: Alert[] }>('/api/alerts').then((d) => d.items);
export const createAlert = (query: string, source_type?: string) => send<Alert>('/api/alerts', 'POST', { query, source_type });
export const checkAlert = (id: number) => send<{ new: number }>(`/api/alerts/${id}/check`, 'POST');
export const alertHits = (id: number) => get<{ items: AlertHit[] }>(`/api/alerts/${id}/hits`).then((d) => d.items);
export const deleteAlert = (id: number) => send<{ ok: boolean }>(`/api/alerts/${id}`, 'DELETE');

// ---------- RGPD : exercice des droits sur un profil d'avocat (must-have conformité) ----------
export const rgpdRequest = (name: string, kind: 'acces' | 'rectification' | 'opposition', email?: string, message?: string) =>
  send<{ ok: boolean; id: number }>('/api/insight/rgpd-request', 'POST', { name, kind, email, message });
