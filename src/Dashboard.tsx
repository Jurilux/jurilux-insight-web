// Vue d'ensemble — accueil analytics. KPIs globaux + répartition par matière /
// juridiction / année (données publiques, avocats/parties uniquement).
import { useEffect, useState } from 'react';
import { analytics, delai, euro, overview, pct, topArticles, TAUX_ESTIME, type Analytics, type ArticleCite, type Overview } from './api';
import { BarList, Kpi, YearTrend } from './charts';
import { Err, Loader, useAsync } from './ui';
import { juridictionLabel } from './juridictions';

export function Dashboard({ onPickMatter }: { onPickMatter: (m: string) => void }) {
  const { data, error } = useAsync<[Overview, Analytics]>(() => Promise.all([overview(), analytics()]), []);
  const [arts, setArts] = useState<ArticleCite[]>([]);
  useEffect(() => { topArticles(12).then(setArts).catch(() => {}); }, []);

  if (error) return <Err message={error} />;
  if (!data) return <Loader label="Chargement des tableaux de bord…" />;
  const [ov, an] = data;

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
        {(ov.delai_n ?? 0) > 0 && (
          <Kpi label="Délai médian estimé" value={delai(ov.delai_median)}
            hint={`Médiane des durées de procédure estimées sur ${ov.delai_n} décisions datées (indicatif).`} />
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
          <p className="muted small">Volume, taux estimé et délai de procédure médian estimé.</p>
          <BarList rows={an.by_juridiction.slice(0, 10).map((r) => ({
            label: juridictionLabel(String(r.cle)), value: r.cases, rate: r.win_rate,
            note: (r.delai_n ?? 0) > 0 ? delai(r.delai_median) : null,
          }))} />
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Évolution par année</h2>
          <p className="muted small">Nombre de décisions analysées par millésime.</p>
          <YearTrend points={years} />
        </section>

        {arts.length > 0 && (
          <section className="card">
            <h2>Textes les plus cités</h2>
            <p className="muted small">Articles de loi visés — nombre de décisions.</p>
            <BarList unit="décisions" rows={arts.map((a) => ({ label: 'Art. ' + a.article, value: a.decisions }))} />
          </section>
        )}
      </div>

      <p className="disclaimer">{TAUX_ESTIME} Profilage limité aux avocats et parties — aucune donnée sur les magistrats.</p>
    </div>
  );
}
