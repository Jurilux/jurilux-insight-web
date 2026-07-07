// Shell du dashboard Jurilux Insight : navigation par onglets + état partagé du benchmark.
// Accès réservé (AuthGate en amont dans main.tsx) : produit B2B.
import { useState } from 'react';
import { Dashboard } from './Dashboard';
import { Lawyers } from './Lawyers';
import { Firms } from './Firms';
import { Compare } from './Compare';
import { Search } from './Search';
import { Alerts } from './Alerts';
import { Report } from './Report';
import { Methodology } from './Methodology';
import { getStoredEmail, logout } from './api';

type Tab = 'dashboard' | 'lawyers' | 'firms' | 'compare' | 'search' | 'alerts' | 'report' | 'methodology';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: "Vue d'ensemble", icon: '▤' },
  { key: 'lawyers', label: 'Avocats', icon: '⚖' },
  { key: 'firms', label: 'Cabinets', icon: '🏛' },
  { key: 'compare', label: 'Comparateur', icon: '⇄' },
  { key: 'search', label: 'Recherche', icon: '🔍' },
  { key: 'alerts', label: 'Veille', icon: '🔔' },
  { key: 'report', label: 'Rapport', icon: '📄' },
  { key: 'methodology', label: 'Méthodologie', icon: 'ⓘ' },
];

const MAX_BENCH = 6;

export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [matterFilter, setMatterFilter] = useState('');
  const [bench, setBench] = useState<string[]>([]);
  const email = getStoredEmail();

  const addBench = (key: string) => setBench((b) => (b.includes(key) || b.length >= MAX_BENCH ? b : [...b, key]));
  const doLogout = async () => { await logout(); window.location.href = '/'; };

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
        <div className="side-foot">
          {email && <div className="account"><span className="account-email" title={email}>{email}</span>
            <button className="linklike" onClick={doLogout}>Se déconnecter</button></div>}
          <p className="muted small">Données publiques de jurisprudence. Avocats et parties uniquement,
            jamais de magistrats. Taux de succès <b>estimés</b>.</p>
        </div>
      </aside>

      <main className="main">
        {tab === 'dashboard' && <Dashboard onPickMatter={(m) => { setMatterFilter(m); setTab('lawyers'); }} />}
        {tab === 'lawyers' && <Lawyers matterFilter={matterFilter} benchmark={bench} onBenchmark={addBench} />}
        {tab === 'firms' && <Firms />}
        {tab === 'compare' && (
          <Compare keys={bench}
            onRemove={(k) => setBench((b) => b.filter((x) => x !== k))}
            onClear={() => setBench([])}
            onGoLawyers={() => setTab('lawyers')} />
        )}
        {tab === 'search' && <Search />}
        {tab === 'alerts' && <Alerts />}
        {tab === 'report' && <Report />}
        {tab === 'methodology' && <Methodology />}
      </main>
    </div>
  );
}
