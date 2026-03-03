import { useState, useMemo } from 'react';
import { saints } from './data/saints';
import { themes } from './themes';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import SaintCard from './components/SaintCard';
import SaintModal from './components/SaintModal';
import Timeline from './components/Timeline';
import FindYourPatron from './components/FindYourPatron';
import './App.css';

export default function App() {
  const [themeName, setThemeName]   = useState('modern');
  const [view, setView]             = useState('browse'); // browse | timeline | patron
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ era: '', region: '', category: '', patronOf: '' });
  const [selectedSaint, setSelectedSaint] = useState(null);

  const theme = themes[themeName];

  const filtered = useMemo(() => {
    return saints.filter(s => {
      if (filters.era      && s.era      !== filters.era)      return false;
      if (filters.region   && s.region   !== filters.region)   return false;
      if (filters.category && !s.categories.includes(filters.category)) return false;
      if (filters.patronOf) {
        const q = filters.patronOf.toLowerCase();
        if (!s.patronOf.some(p => p.toLowerCase().includes(q))) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          (s.biography || '').toLowerCase().includes(q) ||
          s.patronOf.some(p => p.toLowerCase().includes(q)) ||
          s.categories.some(c => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, filters]);

  const eras       = [...new Set(saints.map(s => s.era))];
  const regions    = [...new Set(saints.map(s => s.region))];
  const categories = [...new Set(saints.flatMap(s => s.categories))].sort();

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.fontFamily, transition: 'all 0.3s' }}>
      <Header theme={theme} themeName={themeName} setThemeName={setThemeName} view={view} setView={setView} />

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 60px' }}>

        {view === 'patron' && (
          <FindYourPatron theme={theme} saints={saints} onSelect={setSelectedSaint} />
        )}

        {view === 'timeline' && (
          <Timeline theme={theme} saints={saints} onSelect={setSelectedSaint} />
        )}

        {view === 'browse' && (
          <>
            <div style={{ display: 'flex', gap: 16, margin: '28px 0 20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <SearchBar theme={theme} value={search} onChange={setSearch} />
              </div>
              <FilterPanel
                theme={theme}
                filters={filters}
                setFilters={setFilters}
                eras={eras}
                regions={regions}
                categories={categories}
              />
            </div>

            <div style={{ marginBottom: 12, color: theme.textMuted, fontSize: 13 }}>
              {filtered.length} saint{filtered.length !== 1 ? 's' : ''} found
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}>
              {filtered.map(saint => (
                <SaintCard key={saint.id} saint={saint} theme={theme} onClick={() => setSelectedSaint(saint)} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: theme.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✝</div>
                <div style={{ fontSize: 18 }}>No saints found</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Try adjusting your search or filters</div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedSaint && (
        <SaintModal saint={selectedSaint} theme={theme} onClose={() => setSelectedSaint(null)}
          onPatronClick={(patron) => {
            setView('browse');
            setFilters(f => ({ ...f, patronOf: patron }));
            setSelectedSaint(null);
          }}
        />
      )}
    </div>
  );
}