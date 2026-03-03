export default function Header({ theme, themeName, setThemeName, view, setView }) {
  const tabs = [
    { id: 'browse',   label: '✦ Browse' },
    { id: 'timeline', label: '◈ Timeline' },
    { id: 'patron',   label: '✝ Find Your Patron' },
  ];

  return (
    <header style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 0' }}>
          <div>
            <h1 style={{ fontFamily: theme.headingFamily, fontSize: 28, color: theme.accent, letterSpacing: 2, margin: 0 }}>
              ✝ Communio Sanctorum
            </h1>
            <p style={{ fontSize: 12, color: theme.textMuted, letterSpacing: 3, marginTop: 2 }}>
              THE COMMUNION OF SAINTS
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 12, color: theme.textMuted }}>Theme:</label>
            <select
              value={themeName}
              onChange={e => setThemeName(e.target.value)}
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
            >
              <option value="ornate">Ornate</option>
              <option value="modern">Modern</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                letterSpacing: 1,
                color: view === tab.id ? theme.accent : theme.textMuted,
                borderBottom: view === tab.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                borderRadius: 0,
                transition: 'all 0.15s',
                fontFamily: theme.fontFamily,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}