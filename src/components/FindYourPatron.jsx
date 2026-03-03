import { useState, useMemo } from 'react';
import { patronCategories } from '../data/patronCategories';

export default function FindYourPatron({ theme, saints, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const results = useMemo(() => {
    if (!search && !activeCategory) return [];
    return saints.filter(s => {
      const patronLower = s.patronOf.map(p => p.toLowerCase());
      if (search) {
        const q = search.toLowerCase();
        return patronLower.some(p => p.includes(q));
      }
      if (activeCategory) {
        const cat = patronCategories.find(c => c.id === activeCategory);
        return cat && patronLower.some(p => cat.keywords.some(k => p.includes(k)));
      }
      return false;
    });
  }, [search, activeCategory, saints]);

  const featured = useMemo(() => {
    // Pick saints with rich patron data for the home screen
    return saints
      .filter(s => s.patronOf.length >= 3 && s.image)
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  }, [saints]);

  return (
    <div style={{ padding: '32px 0' }}>
      <h2 style={{ fontFamily: theme.headingFamily, fontSize: 24, color: theme.accent, marginBottom: 8 }}>
        ✝ Find Your Patron Saint
      </h2>
      <p style={{ color: theme.textMuted, fontSize: 14, marginBottom: 32 }}>
        Search by your profession, cause, ailment, or situation to find your patron saint.
      </p>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 500, marginBottom: 32 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>⌕</span>
        <input
          type="text"
          placeholder="e.g. doctors, lost items, anxiety, sailors..."
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCategory(null); }}
          style={{
            width: '100%', padding: '14px 14px 14px 42px',
            background: theme.surface, border: `2px solid ${search ? theme.accent : theme.border}`,
            borderRadius: 8, color: theme.text, fontSize: 15, outline: 'none', transition: 'border-color 0.15s',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: 20 }}>×</button>
        )}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
        {patronCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(activeCategory === cat.id ? null : cat.id); setSearch(''); }}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13,
              background: activeCategory === cat.id ? theme.accent : theme.surface,
              color: activeCategory === cat.id ? theme.textDark : theme.text,
              border: `1px solid ${activeCategory === cat.id ? theme.accent : theme.border}`,
              transition: 'all 0.15s',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h3 style={{ fontSize: 16, color: theme.textMuted, marginBottom: 16 }}>
            {results.length} patron saint{results.length !== 1 ? 's' : ''} found
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {results.map(saint => (
              <PatronResult key={saint.id} saint={saint} theme={theme} search={search} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {(search || activeCategory) && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✝</div>
          <div>No patron saints found for that search.</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Try different keywords or browse by category above.</div>
        </div>
      )}

      {/* Featured saints when no search */}
      {!search && !activeCategory && (
        <div>
          <h3 style={{ fontFamily: theme.headingFamily, fontSize: 18, color: theme.accent, marginBottom: 20 }}>
            Featured Patron Saints
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {featured.map(saint => (
              <PatronResult key={saint.id} saint={saint} theme={theme} search="" onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PatronResult({ saint, theme, search, onSelect }) {
  const highlight = (text) => {
    if (!search) return text;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark style={{ background: theme.accentSoft, color: theme.accent, borderRadius: 2 }}>{text.slice(idx, idx + search.length)}</mark>{text.slice(idx + search.length)}</>;
  };

  return (
    <div
      onClick={() => onSelect(saint)}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = theme.accent; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = theme.cardBorder; }}
    >
      {saint.image && (
        <img src={saint.image} alt={saint.name}
          style={{ width: 80, height: 80, objectFit: 'cover', flexShrink: 0 }}
          onError={e => e.target.style.display = 'none'} />
      )}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ fontSize: 14, fontFamily: theme.headingFamily, color: theme.accent, marginBottom: 4 }}>{saint.name}</div>
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{saint.era} · {saint.region}</div>
        <div style={{ fontSize: 12, color: theme.text }}>
          {saint.patronOf.map((p, i) => (
            <span key={p}>
              {i > 0 && <span style={{ color: theme.border }}> · </span>}
              {highlight(p)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}