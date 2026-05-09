import { C } from '../constants/colors';

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0', color: C.muted, fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, opacity: .4, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
      </div>
    </div>
  );
}

export function ApiError({ message }) {
  return (
    <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', color: C.red, fontSize: 13 }}>
      {message || 'Failed to load data. Is the backend running?'}
    </div>
  );
}
