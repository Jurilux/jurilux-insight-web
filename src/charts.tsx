// Primitives de visualisation — 100 % maison (aucune dépendance de charting),
// fidèle à l'ethos « deps minimales » du projet. Barres en CSS, courbe en SVG inline.
import { pct } from './api';

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kpi" title={hint}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

export interface BarRow { label: string; value: number; rate?: number | null; note?: string | null; onClick?: () => void; }

// Liste de barres horizontales (volume), avec taux de succès estimé + note (ex. montant) optionnels.
export function BarList({ rows, unit = 'décisions' }: { rows: BarRow[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="muted">Aucune donnée.</p>;
  return (
    <div className="barlist">
      {rows.map((r, i) => (
        <div key={i} className={'barrow' + (r.onClick ? ' clickable' : '')}
          onClick={r.onClick} role={r.onClick ? 'button' : undefined} tabIndex={r.onClick ? 0 : undefined}
          onKeyDown={r.onClick ? (e) => { if (e.key === 'Enter') r.onClick!(); } : undefined}>
          <div className="barrow-label" title={r.label}>{r.label}</div>
          <div className="barrow-track">
            <div className="barrow-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <div className="barrow-val">
            {r.value.toLocaleString('fr')} <span className="muted">{unit}</span>
            {r.rate != null && <span className="rate-pill" title="Taux de succès estimé">{pct(r.rate)}</span>}
            {r.note && <span className="amount-pill" title="Montant médian estimé (indicatif)">{r.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Courbe (volume par année) en SVG inline. `points` triés par année croissante.
export function YearTrend({ points }: { points: { year: number; value: number }[] }) {
  if (points.length < 2) return <p className="muted">Pas assez d'années pour une tendance.</p>;
  const W = 640, H = 140, P = 24;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.value);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(1, ...ys);
  const px = (x: number) => P + ((x - minX) / Math.max(1, maxX - minX)) * (W - 2 * P);
  const py = (y: number) => H - P - (y / maxY) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(p.year).toFixed(1)},${py(p.value).toFixed(1)}`).join(' ');
  const area = `${d} L${px(maxX).toFixed(1)},${(H - P).toFixed(1)} L${px(minX).toFixed(1)},${(H - P).toFixed(1)} Z`;
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Volume par année">
      <path d={area} className="trend-area" />
      <path d={d} className="trend-line" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.year)} cy={py(p.value)} r={3} className="trend-dot" />
          {(i === 0 || i === points.length - 1 || p.value === maxY) && (
            <text x={px(p.year)} y={py(p.value) - 8} className="trend-tag" textAnchor="middle">{p.value}</text>
          )}
        </g>
      ))}
      {[minX, maxX].map((x) => (
        <text key={x} x={px(x)} y={H - 6} className="trend-axis" textAnchor="middle">{x}</text>
      ))}
    </svg>
  );
}

// Barre de taux (0–100 %) pour comparer visuellement deux profils.
export function RateBar({ rate }: { rate: number | null }) {
  return (
    <div className="ratebar" title="Taux de succès estimé (indicatif)">
      <div className="ratebar-fill" style={{ width: `${rate == null ? 0 : Math.round(rate * 100)}%` }} />
      <span className="ratebar-txt">{pct(rate)}</span>
    </div>
  );
}
