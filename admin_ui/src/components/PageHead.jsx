import { C } from '../constants/colors';

export default function PageHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -.5 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}
