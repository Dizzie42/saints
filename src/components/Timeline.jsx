const ERA_COLORS = {
  'Apostolic':     '#8b1a1a',
  'Early Church':  '#8b5a1a',
  'Medieval':      '#1a5c8b',
  'Early Modern':  '#1a8b5a',
  'Modern':        '#5a1a8b',
  'Contemporary':  '#8b1a6e',
};

export default function Timeline({ theme, saints, onSelect }) {
  const sorted = [...saints].filter(s => s.deathYear != null).sort((a, b) => a.deathYear - b.deathYear);

  const grouped = sorted.reduce((acc, s) => {
    const era = s.era || 'Unknown';
    if (!acc[era]) acc[era] = [];
    acc[era].push(s);
    return acc;
  }, {});

  const eraOrder = ['Apostolic','Early Church','Medieval','Early Modern','Modern','Contemporary','Unknown'];

  return (
    <div style={{ padding: '32px 0' }}>
      <h2 style={{ fontFamily: theme.headingFamily, fontSize: 24, color: theme.accent, marginBottom: 8 }}>
        Chronological Timeline
      </h2>
      <p style={{ color: theme.textMuted, fontSize: 14, marginBottom: 40 }}>
        {saints.filter(s => s.deathYear).length} saints ordered through history
      </p>

      {eraOrder.filter(era => grouped[era]).map(era => (
        <div key={era} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: ERA_COLORS[era] || '#555', flexShrink: 0 }} />
            <h3 style={{ fontFamily: theme.headingFamily, fontSize: 20, color: ERA_COLORS[era] || theme.accent, margin: 0 }}>{era}</h3>
            <div style={{ flex: 1, height: 1, background: ERA_COLORS[era] || theme.border, opacity: 0.3 }} />
            <span style={{ fontSize: 12, color: theme.textMuted }}>{grouped[era].length} saints</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {grouped[era].map(saint => (
              <div
                key={saint.id}
                onClick={() => onSelect(saint)}
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  borderLeft: `3px solid ${ERA_COLORS[era] || theme.accent}`,
                  borderRadius: 6,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = theme.cardHover; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = theme.cardBg; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <div style={{ fontSize: 14, fontFamily: theme.headingFamily, color: theme.accent, marginBottom: 2 }}>{saint.name}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>
                  {saint.deathYear && `d. ${saint.deathYear < 0 ? `${Math.abs(saint.deathYear)} BC` : saint.deathYear} AD`}
                  {saint.region && ` · ${saint.region}`}
                </div>
                {saint.patronOf.length > 0 && (
                  <div style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>
                    Patron of {saint.patronOf.slice(0, 2).join(', ')}{saint.patronOf.length > 2 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}