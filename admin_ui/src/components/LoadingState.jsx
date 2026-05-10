import { C } from '../constants/colors';

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '56px 0' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: `linear-gradient(135deg,${C.accent},#818cf8)`,
            animation: `pulse 1.3s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', style = {} }) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}

export function ApiError({ message }) {
  return (
    <div style={{
      padding: '13px 16px', borderRadius: 10,
      background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)',
      color: C.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 9,
      animation: 'fadeUp .3s cubic-bezier(.22,1,.36,1) both',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, flexShrink: 0 }} />
      {message || 'Failed to load data. Is the backend running?'}
    </div>
  );
}
