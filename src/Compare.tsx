// Comparateur — benchmark côte à côte de 2 à 6 avocats (endpoint /api/insight/compare).
import { useEffect, useState } from 'react';
import { compare, euro, TAUX_ESTIME, type CompareProfile } from './api';
import { RateBar } from './charts';

export function Compare({ keys, onRemove, onClear, onGoLawyers }:
  { keys: string[]; onRemove: (key: string) => void; onClear: () => void; onGoLawyers: () => void }) {
  const [profiles, setProfiles] = useState<CompareProfile[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (keys.length < 2) { setProfiles(null); return; }
    let live = true;
    compare(keys).then((p) => { if (live) { setProfiles(p); setErr(null); } })
      .catch((e) => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [keys.join(',')]);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Comparateur</h1>
        <p className="muted">Benchmark côte à côte de 2 à 6 avocats. Ajoutez-les depuis l'onglet <b>Avocats</b> ou une fiche.</p>
      </header>

      {keys.length > 0 && (
        <div className="toolbar">
          <span className="muted">{keys.length} sélectionné{keys.length > 1 ? 's' : ''} (max 6)</span>
          <button className="btn ghost" onClick={onClear}>Tout retirer</button>
        </div>
      )}

      {keys.length < 2 && (
        <div className="empty-cta">
          <p>Sélectionnez au moins <b>2 avocats</b> pour lancer un benchmark.</p>
          <button className="btn" onClick={onGoLawyers}>→ Choisir des avocats</button>
        </div>
      )}

      {err && <p className="warn">⚠ {err}</p>}

      {profiles && profiles.length >= 2 && (
        <div className="compare-scroll">
          <div className="compare-grid" style={{ gridTemplateColumns: `160px repeat(${profiles.length}, minmax(150px, 1fr))` }}>
            <div className="cmp-row-label" />
            {profiles.map((p) => (
              <div key={p.name_key} className="cmp-head">
                <strong>{p.name}</strong>
                <button className="cmp-x" onClick={() => onRemove(p.name_key)} aria-label="Retirer">✕</button>
              </div>
            ))}

            <Metric label="Décisions" cells={profiles.map((p) => p.cases.toLocaleString('fr'))} best={idxMax(profiles.map((p) => p.cases))} />
            <div className="cmp-row-label">Taux estimé</div>
            {profiles.map((p) => (
              <div key={p.name_key} className="cmp-cell"><RateBar rate={p.win_rate} /></div>
            ))}
            <Metric label="Issues estimables" cells={profiles.map((p) => String(p.decided))} />
            <Metric label="Montant médian estimé" cells={profiles.map((p) => (p.amount_n ?? 0) > 0 ? euro(p.amount_median) : '—')}
              best={idxMax(profiles.map((p) => p.amount_median ?? -1))} />
            <Metric label="Demandeur / Défendeur" cells={profiles.map((p) => `${p.as_demandeur} / ${p.as_defendeur}`)} />
            <Metric label="Période" cells={profiles.map((p) => p.first_year ? (p.first_year === p.last_year ? `${p.first_year}` : `${p.first_year}–${p.last_year}`) : '—')} />
            <div className="cmp-row-label">Matières</div>
            {profiles.map((p) => (
              <div key={p.name_key} className="cmp-cell">
                <div className="tagrow tight">{p.matters.slice(0, 3).map((m) => <span key={m.name} className="tag small">{m.name}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profiles && profiles.length >= 2 && (
        <p className="disclaimer">{TAUX_ESTIME} Les volumes sont des occurrences dans le corpus, pas un palmarès.</p>
      )}
    </div>
  );
}

function Metric({ label, cells, best }: { label: string; cells: string[]; best?: number }) {
  return (
    <>
      <div className="cmp-row-label">{label}</div>
      {cells.map((c, i) => (
        <div key={i} className={'cmp-cell' + (best === i ? ' cmp-best' : '')}>{c}</div>
      ))}
    </>
  );
}

function idxMax(vals: number[]): number {
  let bi = 0;
  vals.forEach((v, i) => { if (v > vals[bi]) bi = i; });
  return bi;
}
