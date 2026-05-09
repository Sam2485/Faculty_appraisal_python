import { C } from '../constants/colors';

export default function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1420", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: C.subtle, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: "flex", gap: 8 }}>
          <span>{p.name}:</span><strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}
