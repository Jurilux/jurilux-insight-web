// Petits éléments d'UI mutualisés + hook de chargement async, pour éviter la répétition
// (tiroirs, états chargement/erreur) entre les vues.
import { useEffect, useState } from 'react';

export function Loader({ label = 'Chargement…' }: { label?: string }) {
  return <p className="muted">{label}</p>;
}

export function Err({ message }: { message: string }) {
  return <p className="warn">⚠ {message}</p>;
}

// Tiroir latéral (overlay + panneau + bouton fermer). Le contenu est passé en enfants.
export function Drawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose} aria-label="Fermer">✕</button>
        {children}
      </aside>
    </div>
  );
}

// Charge une valeur async et expose { data, error } ; annule proprement si les deps changent.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setData(null); setError(null);
    fn().then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setError(e instanceof Error ? e.message : 'Erreur'); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error };
}
