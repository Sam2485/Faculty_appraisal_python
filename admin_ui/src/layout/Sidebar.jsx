import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { C } from '../constants/colors';
import { NAV } from '../constants/nav';
import { I } from '../components/icons';
import { api } from '../api/client';

// One accent colour per nav section
const SEC_COLORS = [
  '#3b82f6', // Dashboard     — blue
  '#a78bfa', // Faculty       — purple
  '#34d399', // Appraisal     — green
  '#fbbf24', // Tracking      — amber
  '#22d3ee', // Analytics     — cyan
  '#fb923c', // Feedback      — orange
  '#818cf8', // Announcements — indigo
  '#94a3b8', // Settings      — slate
];

function NavSection({ section, defaultOpen, colorIdx }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isChildActive = section.children.some(c => c.path === location.pathname);
  const [open, setOpen] = useState(defaultOpen || isChildActive);
  const Icon = section.icon;
  const col  = SEC_COLORS[colorIdx % SEC_COLORS.length];

  return (
    <div style={{ marginBottom: 3 }}>
      {/* Section header */}
      <button
        className="nav-sec-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', background: isChildActive ? `${col}12` : 'transparent',
          border: `1px solid ${isChildActive ? `${col}25` : 'transparent'}`,
          borderRadius: 10, cursor: 'pointer',
          color: isChildActive ? C.text : C.subtle,
          fontFamily: 'inherit', fontSize: 10.5, fontWeight: 700,
          letterSpacing: .7, textTransform: 'uppercase',
          transition: 'all .15s ease',
        }}
      >
        {/* Icon box */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isChildActive ? `${col}22` : 'rgba(255,255,255,.05)',
          border: `1px solid ${isChildActive ? `${col}35` : 'rgba(255,255,255,.07)'}`,
          boxShadow: isChildActive ? `0 0 10px ${col}25` : 'none',
          transition: 'all .15s ease',
        }}>
          <Icon size={14} stroke={isChildActive ? col : C.muted} />
        </div>

        <span style={{ flex: 1, textAlign: 'left' }}>{section.label}</span>

        <div style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .2s ease', opacity: .4,
        }}>
          <I.chevron size={10} />
        </div>
      </button>

      {/* Children */}
      {open && (
        <div className="nav-children" style={{ marginTop: 2, marginLeft: 8, marginBottom: 4, paddingLeft: 12, borderLeft: `1.5px solid rgba(255,255,255,.06)` }}>
          {section.children.map(child => {
            const active = location.pathname === child.path;
            const CIcon  = child.icon;
            return (
              <button
                key={child.label}
                className="nav-child-btn"
                onClick={() => navigate(child.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 11px 8px 13px',
                  background: active ? `${col}14` : 'transparent',
                  border: 'none',
                  borderLeft: active ? `2.5px solid ${col}` : '2.5px solid transparent',
                  borderRadius: '0 8px 8px 0',
                  cursor: 'pointer',
                  color: active ? col : '#64748b',
                  fontFamily: 'inherit', fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
                  marginBottom: 2, textAlign: 'left',
                  transition: 'all .12s ease',
                  letterSpacing: active ? 0 : 0,
                }}
              >
                <CIcon size={13} stroke="currentColor" />
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const profile  = api.getProfile();
  const initials = profile?.full_name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'AD';

  function handleLogout() {
    api.logout();
    navigate('/login');
  }

  return (
    <aside style={{
      width: 264, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: 'linear-gradient(180deg,#070c15 0%,#050a11 100%)',
      borderRight: '1px solid rgba(255,255,255,.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '22px 18px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {/* Logo mark */}
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6 0%,#818cf8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(59,130,246,.4), 0 4px 12px rgba(0,0,0,.4)',
          }}>
            <I.school size={20} stroke="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: -.5, lineHeight: 1 }}>DYP Admin</div>
            <div style={{ fontSize: 9.5, color: '#475569', letterSpacing: .9, textTransform: 'uppercase', marginTop: 4 }}>
              Faculty Appraisal
            </div>
          </div>
        </div>

        {/* Gradient divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(59,130,246,.25),rgba(129,140,248,.25),transparent)' }} />
      </div>

      {/* ── Cycle badge ───────────────────────────────────────────────────── */}
      <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: 9,
          background: 'rgba(59,130,246,.07)',
          border: '1px solid rgba(59,130,246,.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 11, color: C.subtle, fontWeight: 500 }}>Cycle 2024–25</span>
          </div>
          <span style={{ fontSize: 9.5, color: '#3b82f6', fontWeight: 700, letterSpacing: .4, textTransform: 'uppercase' }}>Live</span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 8px', scrollbarWidth: 'none' }}>
        {NAV.map((section, i) => (
          <NavSection key={section.label} section={section} defaultOpen={i === 0} colorIdx={i} />
        ))}
      </nav>


      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 14px 16px', flexShrink: 0 }}>
        {/* Top divider */}
        <div style={{ height: 1, marginBottom: 12, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)' }} />

        {/* Profile row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 11, marginBottom: 9,
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.07)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            fontFamily: "'JetBrains Mono',monospace",
            boxShadow: '0 0 14px rgba(59,130,246,.35)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Admin'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, boxShadow: `0 0 5px ${C.green}80` }} />
              <span style={{ fontSize: 10, color: '#475569', letterSpacing: .3 }}>Administrator</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="signout-btn"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 12px',
            background: 'rgba(248,113,113,.06)',
            border: '1px solid rgba(248,113,113,.15)',
            borderRadius: 9, cursor: 'pointer',
            color: C.red, fontSize: 12, fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          <I.lock size={13} stroke={C.red} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
