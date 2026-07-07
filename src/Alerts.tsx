// Veille — alertes sur un sujet / une partie adverse : nouvelles décisions du corpus.
// must-have B2B : suivre ses dossiers et adversaires. S'appuie sur /api/alerts (backend).
import { useEffect, useState } from 'react';
import { alertHits, checkAlert, createAlert, deleteAlert, listAlerts, type Alert, type AlertHit } from './api';
import { juridictionLabel, jurisDate, jurisRef } from './juridictions';

export function Alerts() {
  const [items, setItems] = useState<Alert[] | null>(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [hits, setHits] = useState<AlertHit[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => listAlerts().then(setItems).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(null);
    try { await createAlert(q.trim()); setQ(''); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(false); }
  };
  const check = async (id: number) => { await checkAlert(id).catch(() => {}); await load(); };
  const remove = async (id: number) => { await deleteAlert(id).catch(() => {}); if (open === id) setOpen(null); await load(); };
  const showHits = async (id: number) => { setOpen(id); setHits(null); setHits(await alertHits(id).catch(() => [])); };

  return (
    <div className="view">
      <header className="view-head">
        <h1>Veille</h1>
        <p className="muted">Soyez alerté des nouvelles décisions du corpus sur un sujet, une matière ou une partie adverse.</p>
      </header>

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input className="search" placeholder="Ex. : licenciement cadre dirigeant · ou un nom d'avocat" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Sujet de veille" />
        <button className="btn" type="submit" disabled={busy}>+ Créer une alerte</button>
      </form>

      {err && <p className="warn">⚠ {err}</p>}
      {!items && !err && <p className="muted">Chargement…</p>}
      {items && items.length === 0 && <p className="muted">Aucune alerte. Créez-en une ci-dessus.</p>}

      {items && items.length > 0 && (
        <table className="grid">
          <thead><tr><th>Sujet suivi</th><th className="num">Résultats</th><th className="num">Nouveaux</th><th></th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td><button className="linklike" onClick={() => showHits(a.id)}>{a.query}</button></td>
                <td className="num">{a.total}</td>
                <td className="num">{a.unseen > 0 ? <span className="badge">{a.unseen}</span> : <span className="muted">0</span>}</td>
                <td>
                  <button className="chip" onClick={() => check(a.id)}>Vérifier</button>{' '}
                  <button className="chip" onClick={() => remove(a.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {open != null && (
        <section className="card">
          <h2>Décisions correspondantes</h2>
          {!hits && <p className="muted">Chargement…</p>}
          {hits && hits.length === 0 && <p className="muted">Aucun résultat pour l'instant (« Vérifier » pour lancer une recherche).</p>}
          {hits && hits.length > 0 && (
            <ul className="caselist">
              {hits.map((h) => (
                <li key={h.id}>
                  <a href={h.pdf_url || `/docs/${encodeURIComponent(h.doc_id)}.pdf`} target="_blank" rel="noreferrer">
                    {h.title || jurisRef(h.doc_id) || h.doc_id}
                  </a>
                  <span className="muted small"> · {juridictionLabel(h.juridiction_key)}{jurisDate(h.doc_id) ? ` · ${jurisDate(h.doc_id)}` : (h.year ? ` · ${h.year}` : '')}</span>
                  {!h.seen && <span className="badge-soft">nouveau</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
