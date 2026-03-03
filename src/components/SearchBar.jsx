export default function SearchBar({ theme, value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: 16 }}>⌕</span>
      <input
        type="text"
        placeholder="Search saints by name, patronage, biography..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 14px 12px 40px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          color: theme.text,
          fontSize: 14,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = theme.accent}
        onBlur={e => e.target.style.borderColor = theme.border}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: 18, lineHeight: 1 }}
        >×</button>
      )}
    </div>
  );
}