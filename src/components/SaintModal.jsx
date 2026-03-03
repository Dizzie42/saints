import { useEffect } from 'react';

export default function SaintModal({ saint, theme, onClose, onPatronClick }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 11, letterSpacing: 2, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${theme.border}` }}>
        {title}
      </h4>
      {children}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ background: theme.modalBg, border: `1px solid ${theme.border}` }}>
        {/* Hero */}
        <div style={{ position: 'relative' }}>
          {saint.image && (
            <img src={saint.image} alt={saint.name}
              style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: '20px 24px',
          }}>
            <h2 style={{ fontFamily: theme.headingFamily, fontSize: 26, color: '#ffffff', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {saint.name}
            </h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {[saint.era, saint.region, saint.feastDay && `Feast: ${saint.feastDay}`].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.5)', color: '#fff',
            width: 32, height: 32, borderRadius: '50%', fontSize: 18, lineHeight: '32px', textAlign: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Summary */}
          <p style={{ fontSize: 15, color: theme.text, lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>
            {saint.summary}
          </p>

          {/* Categories */}
          <div style={{ marginBottom: 20 }}>
            {saint.categories.map(c => (
              <span key={c} className="tag" style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accent}`, marginRight: 4 }}>{c}</span>
            ))}
          </div>

          {/* Patron of */}
          {saint.patronOf.length > 0 && (
            <Section title="Patron Of">
              <div>
                {saint.patronOf.map(p => (
                  <span key={p} className="tag tag-clickable" onClick={() => onPatronClick(p)}
                    style={{ background: theme.tagBg, color: theme.tagText, border: `1px solid ${theme.border}` }}>
                    {p}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>Click a patronage to find all saints with that role</div>
            </Section>
          )}

          {/* Biography */}
          {saint.biography && (
            <Section title="Life & Legacy">
              <p style={{ fontSize: 14, color: theme.text, lineHeight: 1.8 }}>{saint.biography}</p>
            </Section>
          )}

          {/* Path to sainthood */}
          {saint.pathToSainthood && (
            <Section title="Path to Sainthood">
              <p style={{ fontSize: 14, color: theme.text, lineHeight: 1.7 }}>{saint.pathToSainthood}</p>
            </Section>
          )}

          {/* Miracles */}
          {saint.miracles?.length > 0 && (
            <Section title="Miracles & Wonders">
              <ul style={{ paddingLeft: 20 }}>
                {saint.miracles.map((m, i) => (
                  <li key={i} style={{ fontSize: 14, color: theme.text, lineHeight: 1.7, marginBottom: 6 }}>{m}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Martyrdom */}
          {saint.martyrdom && (
            <Section title="Martyrdom">
              <p style={{ fontSize: 14, color: theme.text, lineHeight: 1.7 }}>{saint.martyrdom}</p>
            </Section>
          )}

          {/* Symbols */}
          {saint.symbols?.length > 0 && (
            <Section title="Symbols & Iconography">
              <div>
                {saint.symbols.map(s => (
                  <span key={s} className="tag" style={{ background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}>{s}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Quotes */}
          {saint.quotes?.length > 0 && (
            <Section title="Notable Quotes">
              {saint.quotes.map((q, i) => (
                <blockquote key={i} style={{
                  borderLeft: `3px solid ${theme.accent}`,
                  paddingLeft: 16, margin: '0 0 12px',
                  fontSize: 14, color: theme.text, fontStyle: 'italic', lineHeight: 1.7,
                }}>{q}</blockquote>
              ))}
            </Section>
          )}

          {saint._meta?.wikipedia && (
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <a href={saint._meta.wikipedia} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: theme.accent, textDecoration: 'none' }}>
                Read more on Wikipedia →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}