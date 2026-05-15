// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

export const colors = {
  accent:   '#4f46e5',
  green:    '#059669',
  amber:    '#d97706',
  purple:   '#7c3aed',
  red:      '#dc2626',
  dark:     '#1a1a1a',
  mid:      '#555555',
  muted:    '#888888',
  border:   '#e8e6e0',
  bg:       '#f7f6f2',
  surface:  '#ffffff',
  altRow:   '#fafaf8',
};

const BADGE_COLORS = {
  green:  { bg: '#e6f4ea', fg: '#166534' },
  amber:  { bg: '#fef3c7', fg: '#78350f' },
  purple: { bg: '#ede9fe', fg: '#4c1d95' },
  blue:   { bg: '#dbeafe', fg: '#1e3a8a' },
  gray:   { bg: '#f1f0ed', fg: '#374151' },
  red:    { bg: '#fee2e2', fg: '#991b1b' },
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

export function Badge({ children, color = 'gray' }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.gray;
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 99,
      background: c.bg, color: c.fg, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, color = colors.accent }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: '#ede8e0', borderRadius: 99, height: 5, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 0.5s ease' }} />
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      borderTop: `3px solid ${accent}`,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: colors.dark, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function Button({ children, onClick, disabled, variant = 'primary', style: extraStyle }) {
  const base = {
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
    padding: '11px 20px', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
  const variants = {
    primary:   { background: colors.dark, color: '#fff' },
    secondary: { background: '#fff', color: colors.dark, border: `1px solid ${colors.border}` },
    danger:    { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...extraStyle }}>
      {children}
    </button>
  );
}

export function FormField({ label, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 12, color: colors.red, marginTop: 5, fontWeight: 500 }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${colors.border}`, fontSize: 14,
  background: '#fff', boxSizing: 'border-box', outline: 'none',
};

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

export function Input({ value, onChange, type = 'text', placeholder, min, max }) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} max={max}
      style={inputStyle}
    />
  );
}

export function Toast({ toast, onDismiss }) {
  const TOAST_STYLES = {
    success: { bg: '#dcfce7', fg: '#14532d', icon: '✅' },
    error:   { bg: '#fee2e2', fg: '#7f1d1d', icon: '❌' },
    info:    { bg: '#dbeafe', fg: '#1e3a8a', icon: 'ℹ️' },
  };
  const t = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: t.bg, color: t.fg,
      padding: '12px 16px', borderRadius: 10,
      fontSize: 13, fontWeight: 500, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      maxWidth: 360, animation: 'slideIn 0.2s ease',
    }}>
      <span>{t.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fg, fontSize: 16, lineHeight: 1, opacity: 0.6 }}>×</button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 1000,
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'inline-block', width: 16, height: 16 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.muted, fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
      {message}
    </div>
  );
}

export function SectionTitle({ children }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>{children}</div>;
}
