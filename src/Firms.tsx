// Cabinets — dimension B2B. Uniquement les cabinets EXPLICITEMENT nommés (« Étude X »)
// dans les décisions : couverture partielle assumée (jamais d'inférence). Fiche cabinet =
// avocats du cabinet + agrégats (décisions, taux estimé, matières, montant médian).
import { useEffect, useState } from 'react';
import { euro, estSignificatif, firm, firms, pct, type Firm, type FirmProfile } from './api';

const SORTS = [{ key: 'cases', label: 'Volume' }, { key: 'winrate', label: 'Taux estimé' }];

export function Firms() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('cases');
  const [items, setItems] = useState<Firm[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      firms(q, 60, sort).then((r) => { if (live) { setItems(r); setErr(null); } }).catch((e) => { if (live) setErr(e.message); });
    }, 220);
    return () => { live = false; clearTimeout(t); };
  }, [q, sort]);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Cabinets</h1>
        <p className="muted">Cabinets <b>explicitement nommés</b> dans les décisions (« Étude X »). Couverture partielle
          assumée : sans mention, un avocat n'est rattaché à aucun cabinet.</p>
      </header>

      <div className="toolbar">
        <input className="search" placeholder="Rechercher un cabinet…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un cabinet" />
        <div className="segmented" role="tablist" aria-label="Tri">
          {SORTS.map((s) => <button key={s.key} className={sort === s.key ? 'on' : ''} onClick={() => setSort(s.key)}>{s.label}</button>)}
        </div>
      </div>

      {err && <p className="warn">⚠ {err}</p>}
      {!items && !err && <p className="muted">Chargement…</p>}
      {items && items.length === 0 && <p className="muted">Aucun cabinet nommé détecté (couverture partielle).</p>}

      {items && items.length > 0 && (
        <table className="grid">
          <thead><tr><th>Cabinet</th><th className="num">Avocats</th><th className="num">Décisions</th><th className="num">Taux estimé</th></tr></thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.firm}>
                <td><button className="linklike" onClick={() => setOpen(f.firm)}>{f.firm}</button></td>
                <td className="num">{f.lawyers}</td>
                <td className="num">{f.cases}</td>
                <td className="num">{f.decided
                  ? <span title={estSignificatif(f.decided) ? '' : `Échantillon faible (${f.decided})`}>
                      {pct(f.win_rate)}{!estSignificatif(f.decided) && <span className="lowconf"> ~</span>}</span>
                  : <span className="muted">n/a</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open && <FirmDrawer name={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FirmDrawer({ name, onClose }: { name: string; onClose: () => void }) {
  const [p, setP] = useState<FirmProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setP(null); firm(name).then(setP).catch((e) => setErr(e.message)); }, [name]);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Fermer">✕</button>
        {err && <p className="warn">⚠ {err}</p>}
        {!p && !err && <p className="muted">Chargement…</p>}
        {p && (
          <>
            <h2 className="profile-name">{p.firm}</h2>
            <div className="kpi-row tight">
              <div className="kpi"><div className="kpi-value">{p.lawyers_count}</div><div className="kpi-label">avocats</div></div>
              <div className="kpi"><div className="kpi-value">{p.cases_count}</div><div className="kpi-label">décisions</div></div>
              <div className="kpi"><div className="kpi-value">{pct(p.win_rate)}</div><div className="kpi-label">taux estimé</div></div>
              {(p.amount_n ?? 0) > 0 && <div className="kpi"><div className="kpi-value">{euro(p.amount_median)}</div><div className="kpi-label">montant médian</div></div>}
            </div>

            {p.matters.length > 0 && (
              <section className="pf-sec"><h3>Matières</h3>
                <div className="tagrow">{p.matters.slice(0, 8).map((m) => <span key={m.name} className="tag">{m.name} <b>{m.count}</b></span>)}</div>
              </section>
            )}

            <section className="pf-sec">
              <h3>Avocats du cabinet ({p.lawyers.length})</h3>
              <div className="tagrow">{p.lawyers.map((l) => <span key={l.name_key} className="tag">{l.name} <b>{l.cases}</b></span>)}</div>
            </section>
            <p className="disclaimer">Rattachement au cabinet fondé sur les mentions « Étude X » du texte — couverture partielle, indicatif.</p>
          </>
        )}
      </aside>
    </div>
  );
}
