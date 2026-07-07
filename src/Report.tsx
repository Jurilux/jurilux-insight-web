// Rapport imprimable (must-have H) — livrable cabinet/client. Génération PDF SANS dépendance :
// mise en page « print » + window.print() (l'utilisateur enregistre en PDF depuis le navigateur).
import { useEffect, useState } from 'react';
import { analytics, euro, firms, lawyers, overview, pct, type Analytics, type Firm, type Lawyer, type Overview } from './api';
import { juridictionLabel } from './juridictions';

export function Report() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [an, setAn] = useState<Analytics | null>(null);
  const [tops, setTops] = useState<Lawyer[]>([]);
  const [fs, setFs] = useState<Firm[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([overview(), analytics(), lawyers('', 10, 'cases'), firms('', 8, 'cases')])
      .then(([o, a, l, f]) => { setOv(o); setAn(a); setTops(l); setFs(f); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="warn">⚠ {err}</p>;
  if (!ov || !an) return <p className="muted">Préparation du rapport…</p>;

  return (
    <div className="view">
      <div className="report-bar no-print">
        <h1>Rapport</h1>
        <button className="btn" onClick={() => window.print()}>⬇ Imprimer / Enregistrer en PDF</button>
      </div>

      <article className="report">
        <header className="report-head">
          <div className="report-brand">⚖ Jurilux <em>Insight</em></div>
          <h2>Rapport d'intelligence contentieux</h2>
          <p className="muted">Jurisprudence luxembourgeoise — données publiques.
            {ov.first_year && ov.last_year && <> Période&nbsp;: {ov.first_year}–{ov.last_year}.</>}</p>
        </header>

        <section>
          <h3>Synthèse</h3>
          <div className="report-kpis">
            <div><b>{ov.lawyers.toLocaleString('fr')}</b><span>avocats profilés</span></div>
            <div><b>{ov.cases.toLocaleString('fr')}</b><span>décisions analysées</span></div>
            <div><b>{pct(ov.win_rate)}</b><span>taux de succès estimé</span></div>
            {(ov.amount_n ?? 0) > 0 && <div><b>{euro(ov.amount_median)}</b><span>montant médian estimé</span></div>}
          </div>
        </section>

        <section>
          <h3>Par matière</h3>
          <table className="report-table">
            <thead><tr><th>Matière</th><th>Décisions</th><th>Taux estimé</th><th>Montant médian</th></tr></thead>
            <tbody>
              {an.by_matter.slice(0, 10).map((r) => (
                <tr key={String(r.cle)}><td>{String(r.cle)}</td><td>{r.cases}</td><td>{pct(r.win_rate)}</td>
                  <td>{(r.amount_n ?? 0) > 0 ? euro(r.amount_median) : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Par juridiction</h3>
          <table className="report-table">
            <thead><tr><th>Juridiction</th><th>Décisions</th><th>Taux estimé</th></tr></thead>
            <tbody>
              {an.by_juridiction.slice(0, 8).map((r) => (
                <tr key={String(r.cle)}><td>{juridictionLabel(String(r.cle))}</td><td>{r.cases}</td><td>{pct(r.win_rate)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h3>Avocats les plus présents</h3>
          <table className="report-table">
            <thead><tr><th>Avocat</th><th>Décisions</th><th>Taux estimé</th></tr></thead>
            <tbody>
              {tops.map((l) => (
                <tr key={l.name_key}><td>{l.name}</td><td>{l.cases}</td>
                  <td>{l.decided ? pct((l.won || 0) / l.decided) : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {fs.length > 0 && (
          <section>
            <h3>Cabinets nommés</h3>
            <table className="report-table">
              <thead><tr><th>Cabinet</th><th>Avocats</th><th>Décisions</th><th>Taux estimé</th></tr></thead>
              <tbody>
                {fs.map((f) => (
                  <tr key={f.firm}><td>{f.firm}</td><td>{f.lawyers}</td><td>{f.cases}</td><td>{pct(f.win_rate)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="report-foot">
          Taux de succès et montants <b>estimés</b> (jurimétrie indicative, heuristique) — ne constituent pas un avis
          juridique. Profilage limité aux avocats et parties ; aucune donnée sur les magistrats. Rattachement aux
          cabinets partiel (mentions « Étude X »).
        </footer>
      </article>
    </div>
  );
}
