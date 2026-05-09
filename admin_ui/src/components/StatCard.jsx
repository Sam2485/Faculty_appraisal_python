import { C } from '../constants/colors';

export default function StatCard({ label, value, delta, color, IconC, delay = 0 }) {
  return (
    <div className="glass stat-card card-appear" style={{ padding: "20px 22px", position: "relative", overflow: "hidden", animationDelay: `${delay}ms` }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
      <div style={{ position: "absolute", top: -16, right: -16, opacity: .055 }}><IconC size={80} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: .7, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 31, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
          {delta && <div style={{ fontSize: 11, color, marginTop: 7, fontWeight: 500 }}>{delta}</div>}
        </div>
        <div style={{ padding: 10, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}20` }}>
          <IconC size={17} stroke={color} />
        </div>
      </div>
    </div>
  );
}
