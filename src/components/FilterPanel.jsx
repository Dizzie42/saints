export default function FilterPanel({ theme, filters, setFilters, eras, regions, categories }) {
  const set = (key, val) => setFilters(f => ({ ...f, [key]: val === f[key] ? '' : val }));
  const hasFilters = Object.values(filters).some(Boolean);

  const sel = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    color: theme.text,
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 13,
    minWidth: 130,
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={filters.era} onChange={e => setFilters(f => ({ ...f, era: e.target.value }))} style={sel}>
        <option value="">All Eras</option>
        {['Apostolic','Early Church','Medieval','Early Modern','Modern','Contemporary'].map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      <select value={filters.region} onChange={e => setFilters(f => ({ ...f, region: e.target.value }))} style={sel}>
        <option value="">All Regions</option>
        {regions.sort().map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={sel}>
        <option value="">All Types</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Patron of..."
          value={filters.patronOf}
          onChange={e => setFilters(f => ({ ...f, patronOf: e.target.value }))}
          style={{ ...sel, minWidth: 150 }}
        />
      </div>

      {hasFilters && (
        <button
          onClick={() => setFilters({ era: '', region: '', category: '', patronOf: '' })}
          style={{ color: theme.accent, fontSize: 12, padding: '8px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, background: theme.surface }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}