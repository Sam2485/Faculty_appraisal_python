import { C } from '../constants/colors';

export default function Card({ title, sub, action, children, style = {}, delay = 0 }) {
  return (
    <div className="glass card-appear" style={{ padding: '20px 22px', animationDelay: `${delay}ms`, ...style }}>
      {(title || action) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, paddingBottom: 13,
          borderBottom: '1px solid var(--c-divider)',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
