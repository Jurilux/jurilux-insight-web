// Client API Jurilux Insight — same-origin (proxy Vite en dev, Caddy en prod).
// Le cœur produit = les endpoints PUBLICS /api/insight/* (aucune auth requise) :
// analytics contentieux, profilage d'avocats, benchmark, export. Extraction locale
// et déterministe côté backend (données publiques de jurisprudence, avocats uniquement).

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const d = await res.json().catch(() => ({} as { detail?: string }));
    throw new HttpError(res.status, d.detail || `Erreur (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

// ---------- types (miroir des formes backend, cf. app/insight.py) ----------
export interface Row { cle: string | number; cases: number; decided: number; won: number; win_rate: number | null; }

export interface Overview {
  lawyers: number; cases: number; decided: number; won: number; win_rate: number | null;
  first_year: number | null; last_year: number | null;
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
}

export interface Profile {
  name_key: string; name: string; cases_count: number;
  first_year: number | null; last_year: number | null;
  as_demandeur: number; as_defendeur: number; won: number; lost: number; decided: number;
  matters: Matter[]; cocounsel: CoCounsel[]; cases: Case[];
}

export interface CompareProfile {
  name_key: string; name: string; cases: number; won: number; lost: number; decided: number;
  win_rate: number | null; as_demandeur: number; as_defendeur: number;
  first_year: number | null; last_year: number | null; matters: Matter[];
}

// ---------- appels ----------
export const overview = () => get<Overview>('/api/insight/overview');

export const analytics = (matter = '', juridiction = '') =>
  get<Analytics>('/api/insight/analytics'
    + (matter ? `?matter=${encodeURIComponent(matter)}` : '')
    + (juridiction ? `${matter ? '&' : '?'}juridiction=${encodeURIComponent(juridiction)}` : ''));

export const matters = () => get<{ items: Matter[] }>('/api/insight/matters').then((d) => d.items);

export const lawyers = (q = '', limit = 50, sort = 'cases', matter = '') =>
  get<{ items: Lawyer[] }>(
    `/api/insight/lawyers?limit=${limit}&sort=${sort}`
    + (q ? `&q=${encodeURIComponent(q)}` : '')
    + (matter ? `&matter=${encodeURIComponent(matter)}` : ''),
  ).then((d) => d.items);

export const lawyer = (key: string) =>
  get<Profile>(`/api/insight/lawyers/${encodeURIComponent(key)}`);

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

// Le taux de succès est ESTIMÉ (heuristique sur le dispositif) → jamais présenté comme certain.
export const TAUX_ESTIME = 'Taux de succès estimé (indicatif) — heuristique sur le dispositif, jamais une certitude.';
