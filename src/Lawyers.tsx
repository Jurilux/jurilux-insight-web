// Avocats — recherche/tri/filtre, liste, et fiche profil détaillée (décisions, côté,
// issue estimée, matières, réseau de confrères). Bouton « + benchmark » et export CSV.
import { useEffect, useState } from 'react';
import {
  estSignificatif, euro, exportLawyersUrl, lawyer, lawyers, matters, pct, sensLabel, TAUX_ESTIME,
  type Lawyer, type Matter, type Profile,
} from './api';
import { RateBar } from './charts';
import { Drawer, Err, Loader, useAsync } from './ui';
import { juridictionLabel, jurisCourt, jurisDate, jurisRef } from './juridictions';

const SORTS: { key: string; label: string }[] = [
  { key: 'cases', label: 'Volume' },
  { key: 'recent', label: 'Récence' },
  { key: 'winrate', label: 'Taux estimé' },
];

export function Lawyers({ matterFilter, onBenchmark, benchmark }:
  { matterFilter: string; onBenchmark: (key: string) => void; benchmark: string[] }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('cases');
  const [matter, setMatter] = useState(matterFilter);
  const [allMatters, setAllMatters] = useState<Matter[]>([]);
  const [items, setItems] = useState<Lawyer[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { matters().then(setAllMatters).catch(() => {}); }, []);
  useEffect(() => { setMatter(matterFilter); }, [matterFilter]);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      lawyers(q, 60, sort, matter)
        .then((r) => { if (live) { setItems(r); setErr(null); } })
        .catch((e) => { if (live) setErr(e.message); });
    }, 220);
    return () => { live = false; clearTimeout(t); };
  }, [q, sort, matter]);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Avocats</h1>
        <p className="muted">Profils construits à partir des mentions « Maître X » dans la jurisprudence publique.</p>
      </header>

      <div className="toolbar">
        <input className="search" placeholder="Rechercher un avocat…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un avocat" />
        <select value={matter} onChange={(e) => setMatter(e.target.value)} aria-label="Filtrer par matière">
          <option value="">Toutes matières</option>
          {allMatters.map((m) => <option key={m.name} value={m.name}>{m.name} ({m.count})</option>)}
        </select>
        <div className="segmented" role="tablist" aria-label="Tri">
          {SORTS.map((s) => (
            <button key={s.key} className={sort === s.key ? 'on' : ''} onClick={() => setSort(s.key)}>{s.label}</button>
          ))}
        </div>
        <a className="btn ghost" href={exportLawyersUrl(q, sort, matter)}>⬇ Export CSV</a>
      </div>

      {err && <p className="warn">⚠ {err}</p>}
      {!items && !err && <p className="muted">Chargement…</p>}
      {items && items.length === 0 && <p className="muted">Aucun avocat ne correspond.</p>}

      {items && items.length > 0 && (
        <table className="grid">
          <thead>
            <tr><th>Avocat</th><th className="num">Décisions</th><th className="num">Taux estimé</th><th>Période</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((l) => {
              const rate = l.decided ? (l.won || 0) / l.decided : null;
              const inBench = benchmark.includes(l.name_key);
              return (
                <tr key={l.name_key}>
                  <td><button className="linklike" onClick={() => setOpen(l.name_key)}>{l.name}</button></td>
                  <td className="num">{l.cases}</td>
                  <td className="num">{l.decided
                    ? <span title={estSignificatif(l.decided) ? '' : `Échantillon faible (${l.decided} issues estimables)`}>
                        {pct(rate)}{!estSignificatif(l.decided) && <span className="lowconf" aria-label="échantillon faible"> ~</span>}
                      </span>
                    : <span className="muted">n/a</span>}</td>
                  <td>{l.first_year ? (l.first_year === l.last_year ? l.first_year : `${l.first_year}–${l.last_year}`) : '—'}</td>
                  <td>
                    <button className={'chip' + (inBench ? ' chip-on' : '')} disabled={inBench}
                      onClick={() => onBenchmark(l.name_key)}>{inBench ? '✓ benchmark' : '+ benchmark'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {open && <ProfileDrawer keyName={open} onClose={() => setOpen(null)} onBenchmark={onBenchmark} />}
    </div>
  );
}

function ProfileDrawer({ keyName, onClose, onBenchmark }:
  { keyName: string; onClose: () => void; onBenchmark: (key: string) => void }) {
  const { data: p, error: err } = useAsync<Profile>(() => lawyer(keyName), [keyName]);
  const rate = p && p.decided ? p.won / p.decided : null;
  return (
    <Drawer onClose={onClose}>
        {err && <Err message={err} />}
        {!p && !err && <Loader label="Chargement du profil…" />}
        {p && (
          <>
            <h2 className="profile-name">Maître {p.name}</h2>
            {p.firm && <p className="muted small profile-firm">🏛 {p.firm}</p>}
            <div className="kpi-row tight">
              <div className="kpi"><div className="kpi-value">{p.cases_count}</div><div className="kpi-label">décisions</div></div>
              <div className="kpi"><div className="kpi-value">{pct(rate)}</div><div className="kpi-label">taux estimé</div></div>
              <div className="kpi"><div className="kpi-value">{p.as_demandeur}/{p.as_defendeur}</div><div className="kpi-label">dem. / déf.</div></div>
              {(p.amount_n ?? 0) > 0 && (
                <div className="kpi" title={`Médiane sur ${p.amount_n} décisions chiffrées`}>
                  <div className="kpi-value">{euro(p.amount_median)}</div><div className="kpi-label">montant médian</div></div>
              )}
            </div>
            <RateBar rate={rate} />
            <button className="btn" onClick={() => onBenchmark(p.name_key)}>+ Ajouter au benchmark</button>

            {p.matters.length > 0 && (
              <section className="pf-sec">
                <h3>Matières</h3>
                <div className="tagrow">{p.matters.map((m) => <span key={m.name} className="tag">{m.name} <b>{m.count}</b></span>)}</div>
              </section>
            )}

            {p.cocounsel.length > 0 && (
              <section className="pf-sec">
                <h3>Réseau de confrères</h3>
                <div className="tagrow">
                  {p.cocounsel.map((c) => (
                    <button key={c.name_key} className="tag tag-btn" onClick={() => onBenchmark(c.name_key)}>
                      {c.name} <span className={'rel rel-' + c.relation}>{c.relation}</span> <b>{c.count}</b>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="pf-sec">
              <h3>Décisions ({p.cases.length})</h3>
              <ul className="caselist">
                {p.cases.slice(0, 40).map((c, i) => (
                  <li key={i}>
                    <a href={`/docs/${encodeURIComponent(c.doc_id)}.pdf`} target="_blank" rel="noreferrer">
                      {jurisRef(c.doc_id) || jurisCourt(c.doc_id, c.juridiction_key)}
                    </a>
                    <span className="muted small"> · {juridictionLabel(c.juridiction_key)}{jurisDate(c.doc_id) ? ` · ${jurisDate(c.doc_id)}` : (c.year ? ` · ${c.year}` : '')}</span>
                    {c.side && <span className={'sidetag side-' + c.side}>{c.side === 'A' ? 'demandeur' : 'défendeur'}</span>}
                    {c.won === 1 && <span className="out out-w">issue estimée : gagné</span>}
                    {c.won === 0 && <span className="out out-l">issue estimée : perdu</span>}
                    {c.sens && <span className="sens-tag">{sensLabel(c.sens)}</span>}
                    {c.articles && <span className="muted small arts"> · art. {c.articles.split(';').slice(0, 4).join(', ')}</span>}
                  </li>
                ))}
              </ul>
            </section>
            <p className="disclaimer">{TAUX_ESTIME}</p>
          </>
        )}
    </Drawer>
  );
}
