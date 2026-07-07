// Shell du dashboard Jurilux Insight : navigation par onglets + état partagé du benchmark.
// Produit PUBLIC (aucune auth) : la surface est l'analytics contentieux.
import { useState } from 'react';
import { Dashboard } from './Dashboard';
import { Lawyers } from './Lawyers';
import { Compare } from './Compare';

type Tab = 'dashboard' | 'lawyers' | 'compare';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: "Vue d'ensemble", icon: '▤' },
  { key: 'lawyers', label: 'Avocats', icon: '⚖' },
  { key: 'compare', label: 'Comparateur', icon: '⇄' },
];

const MAX_BENCH = 6;

export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [matterFilter, setMatterFilter] = useState('');
  const [bench, setBench] = useState<string[]>([]);

  const addBench = (key: string) => {
    setBench((b) => (b.includes(key) || b.length >= MAX_BENCH ? b : [...b, key]));
  };

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="brand-mark">⚖</span> Jurilux <em>Insight</em></div>
        <nav className="nav">
          {TABS.map((t) => (
            <button key={t.key} className={'nav-item' + (tab === t.key ? ' on' : '')} onClick={() => setTab(t.key)}>
              <span className="nav-ic" aria-hidden>{t.icon}</span> {t.label}
              {t.key === 'compare' && bench.length > 0 && <span className="badge">{bench.length}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot muted small">
          Intelligence contentieux — données publiques de jurisprudence. Avocats et parties uniquement,
          jamais de magistrats. Taux de succès <b>estimés</b>.
        </div>
      </aside>

      <main className="main">
        {tab === 'dashboard' && (
          <Dashboard onPickMatter={(m) => { setMatterFilter(m); setTab('lawyers'); }} />
        )}
        {tab === 'lawyers' && (
          <Lawyers matterFilter={matterFilter} benchmark={bench}
            onBenchmark={(k) => { addBench(k); }} />
        )}
        {tab === 'compare' && (
          <Compare keys={bench}
            onRemove={(k) => setBench((b) => b.filter((x) => x !== k))}
            onClear={() => setBench([])}
            onGoLawyers={() => setTab('lawyers')} />
        )}
      </main>
    </div>
  );
}
