// Méthodologie & conformité (must-have RGPD/CNPD). Explique la jurimétrie (statistique,
// pas prédiction), l'exclusion des magistrats, et offre le canal d'exercice des droits
// (accès / rectification / opposition) pour tout avocat profilé.
import { useState, FormEvent } from 'react';
import { rgpdRequest } from './api';

export function Methodology() {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'acces' | 'rectification' | 'opposition'>('opposition');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try { await rgpdRequest(name.trim(), kind, email.trim() || undefined, message.trim() || undefined); setDone(true); }
    catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <div className="view">
      <header className="view-head">
        <h1>Méthodologie & conformité</h1>
        <p className="muted">Comment les indicateurs sont produits, et vos droits.</p>
      </header>

      <section className="card">
        <h2>Jurimétrie, pas « justice prédictive »</h2>
        <p>Les indicateurs sont des <strong>statistiques descriptives</strong> calculées sur des décisions
          publiques de jurisprudence luxembourgeoise. Ils décrivent des tendances passées ;
          ils ne <strong>prédisent</strong> aucune décision et ne constituent pas un avis juridique.</p>
        <ul className="bullets">
          <li><strong>Taux de succès « estimé »</strong> : déduit par heuristique du dispositif de la décision
            (qui obtient gain de cause). Indicatif, jamais une certitude.</li>
          <li><strong>Extraction locale et déterministe</strong> : aucune IA générative n'intervient dans le
            calcul des profils — uniquement des règles reproductibles sur le texte public.</li>
          <li><strong>Significativité</strong> : un taux n'est affiché comme fiable qu'à partir de 10 issues
            estimables ; en dessous, il est signalé comme échantillon faible.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Périmètre : avocats et parties uniquement</h2>
        <p>Conformément au cadre RGPD/CNPD (et à l'interdiction, en droit voisin, du profilage des magistrats),
          Jurilux Insight ne profile <strong>jamais les magistrats ni les greffiers</strong>. Seuls les avocats
          (« Maître X ») et les parties, mentionnés dans des décisions publiques, sont analysés.</p>
      </section>

      <section className="card">
        <h2>Exercer vos droits (avocat profilé)</h2>
        <p className="muted small">Vous êtes avocat et une décision vous mentionne ? Demandez l'accès à vos données,
          leur rectification, ou opposez-vous à votre profilage. Toute demande est enregistrée et traitée.</p>
        {done ? (
          <p className="notice">✓ Demande enregistrée. Nous la traiterons et vous recontacterons si un e-mail a été fourni.</p>
        ) : (
          <form onSubmit={submit} className="rgpd-form">
            <label>Nom de l'avocat concerné
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Maître Prénom NOM" />
            </label>
            <label>Type de demande
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="acces">Accès à mes données</option>
                <option value="rectification">Rectification</option>
                <option value="opposition">Opposition au profilage</option>
              </select>
            </label>
            <label>E-mail de contact (optionnel)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@cabinet.lu" />
            </label>
            <label>Précisions (optionnel)
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </label>
            {err && <p className="warn">⚠ {err}</p>}
            <button className="btn" type="submit" disabled={busy}>{busy ? '…' : 'Envoyer la demande'}</button>
          </form>
        )}
      </section>
    </div>
  );
}
