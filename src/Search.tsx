// Recherche jurisprudentielle (RAG) — trouver et lire les décisions. Réponse sourcée +
// citations ouvrant le PDF de la décision. Complète l'analytics (must-have : accès aux textes).
import { useState } from 'react';
import { ask, citationPdf, type AskResponse } from './api';
import { juridictionLabel, jurisCourt, jurisDate, jurisRef, lawTitle } from './juridictions';

export function Search() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<AskResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (question: string) => {
    const text = question.trim();
    if (!text) return;
    setBusy(true); setErr(null); setRes(null);
    try { setRes(await ask(text)); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <div className="view">
      <header className="view-head">
        <h1>Recherche jurisprudentielle</h1>
        <p className="muted">Interrogez le corpus luxembourgeois — réponse sourcée, chaque citation ouvre la décision.</p>
      </header>

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); run(q); }}>
        <input className="search" placeholder="Ex. : préavis de licenciement pour faute grave" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Question juridique" />
        <button className="btn" type="submit" disabled={busy}>{busy ? '…' : 'Rechercher'}</button>
      </form>

      {err && <p className="warn">⚠ {err}</p>}
      {busy && <p className="muted">Recherche dans le corpus…</p>}

      {res && (
        <div className="card">
          {res.refused || !res.answer ? (
            <p className="muted">Aucune réponse fondée sur le corpus pour cette question. Reformulez ou précisez.</p>
          ) : (
            <>
              {res.status === 'partial' && <span className="badge-soft">réponse partielle</span>}
              <div className="answer">{res.answer}</div>

              {res.citations.length > 0 && (
                <section className="pf-sec">
                  <h3>Sources ({res.citations.length})</h3>
                  <ul className="caselist">
                    {res.citations.map((c, i) => {
                      const pdf = citationPdf(c);
                      const label = c.source_type === 'law'
                        ? lawTitle(c.doc_id || c.title)
                        : (jurisRef(c.doc_id) || jurisCourt(c.doc_id, c.juridiction_key));
                      return (
                        <li key={i}>
                          {pdf ? <a href={pdf} target="_blank" rel="noreferrer">{label}</a> : <span>{label}</span>}
                          <span className="muted small"> · {c.source_type === 'law' ? 'Législation' : juridictionLabel(c.juridiction_key)}
                            {jurisDate(c.doc_id) ? ` · ${jurisDate(c.doc_id)}` : (c.year ? ` · ${c.year}` : '')}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {res.follow_ups && res.follow_ups.length > 0 && (
                <section className="pf-sec">
                  <h3>Pour aller plus loin</h3>
                  <div className="tagrow">
                    {res.follow_ups.map((f, i) => (
                      <button key={i} className="tag tag-btn" onClick={() => { setQ(f); run(f); }}>{f}</button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          <p className="disclaimer">Réponse générée à partir du corpus — à vérifier ; ne constitue pas un avis juridique.</p>
        </div>
      )}
    </div>
  );
}
