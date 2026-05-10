import { C } from '../constants/colors';

export default function PageHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 26, animation: 'fadeUp .35s cubic-bezier(.22,1,.36,1) both' }}>
      <h2 style={{
        fontSize: 23, fontWeight: 800, letterSpacing: -.6, lineHeight: 1.2,
        background: 'linear-gradient(135deg,#f1f5f9 30%,#94a3b8 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>{title}</h2>
      {sub && (
        <p style={{ fontSize: 12, color: C.muted, marginTop: 5, letterSpacing: .1 }}>{sub}</p>
      )}
      <div style={{
        marginTop: 10, height: 2, width: 40, borderRadius: 2,
        background: 'linear-gradient(90deg,#3b82f6,#818cf8)',
        animation: 'accentLine .5s cubic-bezier(.22,1,.36,1) .1s both',
      }} />
    </div>
  );
}
