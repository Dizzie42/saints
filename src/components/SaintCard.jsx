const ERA_COLORS = {
  'Apostolic':     '#8b1a1a',
  'Early Church':  '#8b5a1a',
  'Medieval':      '#1a5c8b',
  'Early Modern':  '#1a8b5a',
  'Modern':        '#5a1a8b',
  'Contemporary':  '#8b1a6e',
};

export default function SaintCard({ saint, theme, onClick }) {
  return (
    <div
      className="saint-card"
      onClick={onClick}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
        e.currentTarget.style.borderColor = theme.accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = theme.cardBorder;
      }}
    >
      <div style={{ overflow: 'hidden', height: 200, background: theme.surfaceAlt, position: 'relative' }}>
        {saint.image ? (
          <img src={saint.image} alt={saint.name} className="saint-card-img"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: theme.border }}>✝</div>
        )}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: ERA_COLORS[saint.era] || '#555',
          color: '#fff', fontSize: 10, padding: '2px 8px',
          borderRadius: 12, letterSpacing: 1, fontWeight: 500,
        }}>{saint.era}</div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontSize: 16, fontFamily: theme.headingFamily, color: theme.accent, marginBottom: 4, lineHeight: 1.3 }}>
          {saint.name}
        </h3>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>
          {saint.feastDay && `Feast: ${saint.feastDay}`}
          {saint.feastDay && saint.deathYear && ' · '}
          {saint.deathYear && `d. ${saint.deathYear < 0 ? `${Math.abs(saint.deathYear)} BC` : saint.deathYear}`}
          {saint.region && ` · ${saint.region}`}
        </div>
        <p style={{ fontSize: 13, color: theme.text, lineHeight: 1.5, marginBottom: 10,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {saint.summary}
        </p>
        {saint.patronOf.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4, letterSpacing: 1 }}>PATRON OF</div>
            <div>
              {saint.patronOf.slice(0, 3).map(p => (
                <span key={p} className="tag" style={{ background: theme.tagBg, color: theme.tagText }}>{p}</span>
              ))}
              {saint.patronOf.length > 3 && (
                <span className="tag" style={{ background: theme.tagBg, color: theme.textMuted }}>+{saint.patronOf.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}