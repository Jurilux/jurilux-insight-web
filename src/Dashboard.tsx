// Vue d'ensemble — accueil analytics. KPIs globaux + répartition par matière /
// juridiction / année (données publiques, avocats/parties uniquement).
import { useEffect, useState } from 'react';
import { analytics, euro, overview, pct, TAUX_ESTIME, type Analytics, type Overview } from './api';
import { BarList, Kpi, YearTrend } from './charts';
import { juridictionLabel } from './juridictions';

export function Dashboard({ onPickMatter }: { onPickMatter: (m: string) => void }) {
  const [ov, setOv] = useState<Overview | null>(null);
  const [an, setAn] = useState<Analytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([overview(), analytics()])
      .then(([o, a]) => { setOv(o); setAn(a); })
      .catch((e) => setErr(e.message || 'Erreur de chargement'));
  }, []);

  if (err) return <p className="warn">⚠ {err}</p>;
  if (!ov || !an) return <p className="muted">Chargement des tableaux de bord…</p>;

  const empty = ov.cases === 0;
  const years = an.by_year
    .filter((r) => typeof r.cle === 'number')
    .map((r) => ({ year: r.cle as number, value: r.cases }))
    .sort((a, b) => a.year - b.year);
  const period = ov.first_year && ov.last_year
    ? (ov.first_year === ov.last_year ? `${ov.first_year}` : `${ov.first_year}–${ov.last_year}`) : '—';

  return (
    <div className="view">
      <header className="view-head">
        <h1>Vue d'ensemble</h1>
        <p className="muted">Intelligence contentieux — jurisprudence luxembourgeoise (données publiques). {period !== '—' && <>Période&nbsp;: {period}.</>}</p>
      </header>

      {empty && (
        <div className="notice">
          Le corpus analytique est vide pour l'instant. Les tableaux de bord se remplissent au premier
          <em> build insight</em> (extraction locale et déterministe sur la jurisprudence).
        </div>
      )}

      <div className="kpi-row">
        <Kpi label="Avocats profilés" value={ov.lawyers.toLocaleString('fr')} />
        <Kpi label="Décisions analysées" value={ov.cases.toLocaleString('fr')} />
        <Kpi label="Issues estimables" value={ov.decided.toLocaleString('fr')} hint="Décisions dont l'issue est estimable par heuristique." />
        <Kpi label="Taux de succès global" value={pct(ov.win_rate)} hint={TAUX_ESTIME} />
        {(ov.amount_n ?? 0) > 0 && (
          <Kpi label="Montant médian estimé" value={euro(ov.amount_median)}
            hint={`Médiane des montants du dispositif sur ${ov.amount_n} décisions chiffrées (indicatif).`} />
        )}
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Par matière</h2>
          <p className="muted small">Volume et taux de succès estimé. Cliquez pour filtrer les avocats.</p>
          <BarList rows={an.by_matter.slice(0, 10).map((r) => ({
            label: String(r.cle), value: r.cases, rate: r.win_rate,
            note: (r.amount_n ?? 0) > 0 ? euro(r.amount_median) : null,
            onClick: () => onPickMatter(String(r.cle)),
          }))} />
        </section>

        <section className="card">
          <h2>Par juridiction</h2>
          <p className="muted small">Où se concentre le contentieux analysé.</p>
          <BarList rows={an.by_juridiction.slice(0, 10).map((r) => ({
            label: juridictionLabel(String(r.cle)), value: r.cases, rate: r.win_rate,
          }))} />
        </section>
      </div>

      <section className="card">
        <h2>Évolution par année</h2>
        <p className="muted small">Nombre de décisions analysées par millésime.</p>
        <YearTrend points={years} />
      </section>

      <p className="disclaimer">{TAUX_ESTIME} Profilage limité aux avocats et parties — aucune donnée sur les magistrats.</p>
    </div>
  );
}
