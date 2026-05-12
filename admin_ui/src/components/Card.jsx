import { useState } from 'react';
import { C } from '../constants/colors';

export default function Card({ title, sub, action, info, children, style = {}, delay = 0 }) {
  const [tip, setTip] = useState(false);

  return (
    <div className="glass card-appear" style={{ padding: '20px 22px', animationDelay: `${delay}ms`, ...style }}>
      {(title || action) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, paddingBottom: 13,
          borderBottom: '1px solid var(--c-divider)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
              {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
            </div>

            {info && (
              <div
                style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}
                onMouseEnter={() => setTip(true)}
                onMouseLeave={() => setTip(false)}
              >
                {/* Info icon */}
                <div style={{
                  width: 17, height: 17, borderRadius: '50%', cursor: 'help',
                  background: tip ? `${C.accent}18` : 'rgba(255,255,255,.06)',
                  border: `1px solid ${tip ? `${C.accent}40` : 'rgba(255,255,255,.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: tip ? C.accent : C.muted,
                  transition: 'all .15s',
                  userSelect: 'none',
                }}>
                  i
                </div>

                {/* Tooltip */}
                {tip && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 600,
                    width: 230, padding: '11px 13px', borderRadius: 10,
                    background: C.surf,
                    border: '1px solid rgba(255,255,255,.1)',
                    boxShadow: '0 16px 40px rgba(0,0,0,.7)',
                    fontSize: 11.5, color: C.subtle, lineHeight: 1.7,
                    animation: 'fadeIn .12s ease',
                    pointerEvents: 'none',
                  }}>
                    {/* Small arrow */}
                    <div style={{
                      position: 'absolute', top: -5, left: 7,
                      width: 8, height: 8, borderRadius: 1,
                      background: C.surf,
                      border: '1px solid rgba(255,255,255,.1)',
                      transform: 'rotate(45deg)',
                      borderBottom: 'none', borderRight: 'none',
                    }} />
                    {info}
                  </div>
                )}
              </div>
            )}
          </div>

          {action}
        </div>
      )}
      {children}
    </div>
  );
}
