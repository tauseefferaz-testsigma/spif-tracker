import React from 'react';

export const colors = {
  bg: '#faf9f6',
  surface: '#ffffff',
  dark: '#2d2c29',
  mid: '#73726c',
  muted: '#9c9a92',
  border: '#e6e4dd',
  accent: '#5046e5',
  green: '#16a34a',
  amber: '#d97706',
  purple: '#9333ea',
};

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 16,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, accent, sub }) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: 16,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: colors.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent || colors.dark, marginBottom: sub ? 4 : 0 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: colors.mid }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Badge({ children, color = 'blue' }) {
  const colorMap = {
    blue: { bg: '#dbeafe', text: '#1e40af' },
    green: { bg: '#dcfce7', text: '#166534' },
    purple: { bg: '#f3e8ff', text: '#7e22ce' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <span style={{
      background: c.bg,
      color: c.text,
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 99,
    }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, color = colors.accent }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: '#f0efe9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 0.5s' }} />
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', disabled = false }) {
  const styles = {
    primary: {
      background: colors.dark,
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: colors.surface,
      color: colors.dark,
      border: `1px solid ${colors.border}`,
    },
  };

  const s = styles[variant] || styles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s,
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.dark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {children}
    </h3>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: toast.type === 'error' ? '#7f1d1d' : '#14532d',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 280,
          }}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
