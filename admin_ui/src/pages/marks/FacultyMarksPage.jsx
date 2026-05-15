import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { SCHOOLS } from '../../constants/schools';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';

const NT_ROLES = new Set(['non_teaching_staff', 'reporting_officer', 'registrar']);

/* ── Authority definitions ── */
const A = {
  self: { role: 'self',               label: 'Self',      color: '#94a3b8', partA: 'part_a_total',             partB: 'part_b_total',             total: 'grand_total'             },
  hod:  { role: 'hod',               label: 'HOD',       color: '#a78bfa', partA: 'hod_part_a',               partB: 'hod_part_b',               total: 'hod_total'               },
  ctr:  { role: 'center_head',       label: 'Ctr Head',  color: '#e879f9', partA: 'center_head_part_a',       partB: 'center_head_part_b',       total: 'center_head_total'       },
  dir:  { role: 'director',          label: 'Director',  color: '#fbbf24', partA: 'director_part_a',          partB: 'director_part_b',          total: 'director_total'          },
  dean: { role: 'dean',              label: 'Dean',      color: '#34d399', partA: 'dean_part_a',              partB: 'dean_part_b',              total: 'dean_total'              },
  vc:   { role: 'vc',                label: 'VC',        color: '#3b82f6', partA: 'vc_part_a',                partB: 'vc_part_b',                total: 'vc_total'                },
  ro:   { role: 'reporting_officer', label: 'Rep. Off',  color: '#a78bfa', partA: 'reporting_officer_part_a', partB: 'reporting_officer_part_b', total: 'reporting_officer_total' },
  reg:  { role: 'registrar',         label: 'Registrar', color: '#fbbf24', partA: 'registrar_part_a',         partB: 'registrar_part_b',         total: 'registrar_total'         },
};

function getAuthorities(school, appraisalRole) {
  const role = appraisalRole || 'faculty';
  if (role === 'non_teaching_staff' || role === 'staff') return [A.self, A.ro, A.reg, A.vc];
  if (role === 'reporting_officer') return [A.self, A.reg, A.vc];
  if (role === 'registrar')         return [A.self, A.vc];
  if (school === 'CISR')
    return role === 'center_head' ? [A.self, A.vc] : [A.self, A.ctr, A.vc];
  if (role === 'vc')       return [A.self];
  if (role === 'dean')     return [A.self, A.vc];
  if (role === 'director') return [A.self, A.dean, A.vc];
  if (role === 'hod')      return [A.self, A.dir, A.dean, A.vc];
  if (school === 'SoEMR')  return [A.self, A.hod, A.dir, A.dean, A.vc];
  return [A.self, A.dir, A.dean, A.vc];
}

const PS = {
  hod:               { label: 'HOD',       color: '#a78bfa' },
  center_head:       { label: 'Ctr Head',  color: '#e879f9' },
  director:          { label: 'Director',  color: '#fbbf24' },
  dean:              { label: 'Dean',      color: '#34d399' },
  reporting_officer: { label: 'Rep.Off',   color: '#a78bfa' },
  registrar:         { label: 'Registrar', color: '#fbbf24' },
  vc:                { label: 'VC',        color: '#3b82f6' },
  final:             { label: 'Final',     color: '#10b981' },
};

function getPipelineKeys(school, appraisalRole) {
  const role = appraisalRole || 'faculty';
  if (role === 'non_teaching_staff' || role === 'staff')
    return ['reporting_officer', 'registrar', 'vc', 'final'];
  if (school === 'CISR')
    return role === 'center_head' ? ['vc', 'final'] : ['center_head', 'vc', 'final'];
  if (role === 'vc')       return ['final'];
  if (role === 'dean')     return ['vc', 'final'];
  if (role === 'director') return ['dean', 'vc', 'final'];
  if (role === 'hod')      return ['director', 'dean', 'vc', 'final'];
  if (school === 'SoEMR')  return ['hod', 'director', 'dean', 'vc', 'final'];
  return ['director', 'dean', 'vc', 'final'];
}

function getWaitingRole(status) {
  const s = (status || '').toLowerCase().trim();
  if (!s || s === 'pending') return null;
  if (s === 'reviewed' || s === 'vc reviewed') return 'final';
  if (s.includes('dean reviewed'))              return 'vc';
  if (s.includes('director reviewed'))          return 'dean';
  if (s.includes('hod reviewed'))               return 'director';
  if (s.includes('center head reviewed'))       return 'vc';
  if (s.includes('registrar reviewed'))         return 'final';
  if (s.includes('reporting officer reviewed')) return 'registrar';
  if (s.includes('vc'))         return 'vc';
  if (s.includes('dean'))       return 'dean';
  if (s.includes('director'))   return 'director';
  if (s.includes('center head') || s.includes('center_head')) return 'center_head';
  if (s.includes('registrar'))  return 'registrar';
  if (s.includes('reporting'))  return 'reporting_officer';
  if (s.includes('hod'))        return 'hod';
  if (s.includes('submitted') || s.includes('pending')) return '__first__';
  return null;
}

function getStatusInfo(status = '') {
  const s = status.toLowerCase();
  if (s.includes('vc') || s === 'reviewed')
    return { color: '#34d399', bg: 'rgba(52,211,153,.12)',  border: 'rgba(52,211,153,.3)',  glow: 'rgba(52,211,153,.15)'  };
  if (s.includes('dean'))
    return { color: '#3b82f6', bg: 'rgba(59,130,246,.12)',  border: 'rgba(59,130,246,.3)',  glow: 'rgba(59,130,246,.12)'  };
  if (s.includes('director'))
    return { color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.3)',  glow: 'rgba(251,191,36,.1)'   };
  if (s.includes('hod'))
    return { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.3)', glow: 'rgba(167,139,250,.1)'  };
  if (s.includes('submitted') || s.includes('pending review'))
    return { color: '#fb923c', bg: 'rgba(251,146,60,.10)',  border: 'rgba(251,146,60,.3)',  glow: 'rgba(251,146,60,.08)'  };
  return { color: C.muted, bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.12)', glow: 'transparent' };
}

/* ────────────────────────────────────────────────────────────────
   SCORE BLOCK — premium glass card with Part A / Part B labels
──────────────────────────────────────────────────────────────── */
function ScoreBlock({ auth, row }) {
  const total = row[auth.total] || 0;
  const partA = row[auth.partA] || 0;
  const partB = row[auth.partB] || 0;
  const empty = !total;

  return (
    <div className="score-block" style={{
      flex: 1, minWidth: 82,
      borderRadius: 14, overflow: 'hidden',
      background: empty
        ? 'rgba(255,255,255,.02)'
        : `linear-gradient(160deg, ${auth.color}0f 0%, ${auth.color}05 100%)`,
      border: `1px solid ${empty ? 'rgba(255,255,255,.05)' : `${auth.color}22`}`,
      boxShadow: empty ? 'none' : `inset 0 1px 0 ${auth.color}15`,
    }}>
      {/* Authority label strip */}
      <div style={{
        padding: '7px 10px', textAlign: 'center',
        background: empty ? 'transparent' : `${auth.color}14`,
        borderBottom: `1px solid ${empty ? 'rgba(255,255,255,.04)' : `${auth.color}18`}`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: empty ? 'rgba(255,255,255,.15)' : auth.color,
        }}>
          {auth.label}
        </span>
      </div>

      <div style={{ padding: '10px 11px' }}>
        {empty ? (
          <div style={{
            textAlign: 'center', padding: '12px 0',
            fontSize: 20, color: 'rgba(255,255,255,.07)', lineHeight: 1,
            fontFamily: "'JetBrains Mono',monospace",
          }}>—</div>
        ) : (
          <>
            {[['Part A', partA], ['Part B', partB]].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '4px 0', marginBottom: 2,
              }}>
                <span style={{
                  fontSize: 9, color: 'rgba(255,255,255,.35)',
                  fontWeight: 600, letterSpacing: .3,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 700, color: `${auth.color}cc`,
                }}>
                  {val.toFixed(1)}
                </span>
              </div>
            ))}

            <div style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${auth.color}25, transparent)`,
              margin: '8px 0 7px',
            }} />

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 18, fontWeight: 800, color: auth.color, lineHeight: 1,
                textShadow: `0 0 20px ${auth.color}55`,
              }}>
                {total.toFixed(1)}
              </div>
              <div style={{
                fontSize: 8, color: `${auth.color}50`,
                letterSpacing: .9, textTransform: 'uppercase', marginTop: 4,
              }}>
                Total
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   REMARKS PANEL
──────────────────────────────────────────────────────────────── */
function RemarksPanel({ row, authorities }) {
  const reviewers = authorities.filter(a => a.role !== 'self' && row[`${a.role}_remarks`]);
  if (!reviewers.length)
    return (
      <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', padding: '4px 0' }}>
        No remarks submitted yet.
      </div>
    );

  return (
    <div className="remarks-expand" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 10,
    }}>
      {reviewers.map(a => (
        <div key={a.role} style={{
          padding: '12px 14px', borderRadius: 12,
          background: `${a.color}07`,
          border: `1px solid ${a.color}20`,
          boxShadow: `0 4px 16px ${a.color}08`,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: .9,
            textTransform: 'uppercase', color: a.color, marginBottom: 6,
          }}>
            {a.label}
          </div>
          <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.6 }}>
            {row[`${a.role}_remarks`]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PIPELINE BAR — animated review queue
──────────────────────────────────────────────────────────────── */
function PipelineBar({ status, school, appraisalRole }) {
  const waitingRole = getWaitingRole(status);
  if (waitingRole === null) return null;

  const keys = getPipelineKeys(school, appraisalRole);
  let activeIdx = waitingRole === '__first__' ? 0
    : waitingRole === 'final'                 ? keys.length - 1
    : keys.indexOf(waitingRole);
  if (activeIdx === -1) activeIdx = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: .6,
        textTransform: 'uppercase', color: 'rgba(255,255,255,.18)',
        marginRight: 8, flexShrink: 0,
      }}>
        Queue
      </span>

      {keys.map((key, i) => {
        const stage  = PS[key];
        const done   = i < activeIdx;
        const active = i === activeIdx;

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', flex: i < keys.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <div style={{
                width: active ? 10 : 7, height: active ? 10 : 7,
                borderRadius: '50%',
                background: done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.09)',
                border: `2px solid ${done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.12)'}`,
                boxShadow: active ? `0 0 10px ${stage.color}90, 0 0 20px ${stage.color}40` : 'none',
                transition: 'all .3s ease',
              }} />
              <span style={{
                fontSize: 8,
                fontWeight: active ? 800 : done ? 600 : 400,
                color: done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.18)',
                letterSpacing: .3, whiteSpace: 'nowrap',
              }}>
                {done ? '✓' : stage.label}
              </span>
            </div>

            {i < keys.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, margin: '0 3px', marginBottom: 12, borderRadius: 2,
                background: done
                  ? 'linear-gradient(90deg, #10b981, #10b98160)'
                  : active
                    ? `linear-gradient(90deg, ${stage.color}70, rgba(255,255,255,.05))`
                    : 'rgba(255,255,255,.05)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FACULTY CARD — premium glass card with hover lift + glow
──────────────────────────────────────────────────────────────── */
function FacultyCard({ r, index, animDelay }) {
  const [remarksOpen, setRemarksOpen] = useState(false);

  const authorities  = getAuthorities(r.school, r.appraisal_role);
  const reviewers    = authorities.filter(a => a.role !== 'self');
  const hasRemarks   = reviewers.some(a => r[`${a.role}_remarks`]);
  const hasPipeline  = getWaitingRole(r.status) !== null;
  const si           = getStatusInfo(r.status);
  const selfScore    = r.grand_total || 0;
  const bestTotal    = Math.max(0, ...reviewers.map(a => r[a.total] || 0));

  return (
    <div
      className="faculty-card"
      style={{
        borderRadius: 16, overflow: 'hidden',
        background: 'var(--c-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--c-border)',
        borderTop: `2px solid ${si.color}`,
        marginBottom: 12,
        boxShadow: `0 4px 24px rgba(0,0,0,.18), 0 0 0 0 ${si.glow}`,
        animation: `fadeUp .45s cubic-bezier(.22,1,.36,1) ${animDelay}ms both`,
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 14,
        borderBottom: '1px solid rgba(255,255,255,.045)',
        background: `linear-gradient(135deg, ${si.glow}, transparent 60%)`,
      }}>
        {/* Index circle */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: `${si.color}12`,
          border: `1px solid ${si.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: si.color,
        }}>
          {index}
        </div>

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: -.2 }}>
              {r.name || '—'}
            </span>
            {hasRemarks && (
              <span className="pill-pop" style={{
                fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                background: 'rgba(59,130,246,.15)', color: '#60a5fa',
                border: '1px solid rgba(59,130,246,.25)', letterSpacing: .6,
                animationDelay: `${animDelay + 200}ms`,
              }}>
                REMARKS
              </span>
            )}
          </div>

          <div style={{
            fontSize: 10, color: C.muted,
            fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, letterSpacing: .2,
          }}>
            {r.email}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            {r.school && (
              <span style={{
                fontSize: 10, padding: '2px 9px', borderRadius: 20,
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                color: C.subtle, fontFamily: "'JetBrains Mono',monospace",
              }}>
                {r.school}
              </span>
            )}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', textTransform: 'capitalize' }}>
              {r.appraisal_role?.replace(/_/g, ' ')}
              {r.department ? ` · ${r.department}` : ''}
            </span>
          </div>
        </div>

        {/* Status + score column */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            background: si.bg, color: si.color, border: `1px solid ${si.border}`,
            whiteSpace: 'nowrap', letterSpacing: .2,
            boxShadow: `0 2px 12px ${si.glow}`,
          }}>
            {r.status || 'Not Submitted'}
          </span>

          {(selfScore > 0 || bestTotal > 0) && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              {selfScore > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.25)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 1 }}>
                    Self
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,.35)', lineHeight: 1,
                  }}>
                    {selfScore.toFixed(1)}
                  </div>
                </div>
              )}
              {selfScore > 0 && bestTotal > 0 && (
                <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,.08)' }} />
              )}
              {bestTotal > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,.28)', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 1 }}>
                    Latest
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 20, fontWeight: 800, color: C.accent, lineHeight: 1,
                    textShadow: '0 0 16px rgba(59,130,246,.5)',
                  }}>
                    {bestTotal.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Score blocks ── */}
      <div style={{ padding: '14px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {authorities.map(a => <ScoreBlock key={a.role} auth={a} row={r} />)}
      </div>

      {/* ── Pipeline ── */}
      {hasPipeline && (
        <div style={{
          padding: '10px 18px 12px',
          borderTop: '1px solid rgba(255,255,255,.04)',
          background: 'rgba(255,255,255,.01)',
        }}>
          <PipelineBar status={r.status} school={r.school} appraisalRole={r.appraisal_role} />
        </div>
      )}

      {/* ── Remarks toggle ── */}
      {hasRemarks && (
        <>
          <button
            onClick={() => setRemarksOpen(o => !o)}
            className="act-btn"
            style={{
              width: '100%', padding: '9px 18px', fontSize: 11, fontWeight: 600,
              color: remarksOpen ? '#60a5fa' : 'rgba(255,255,255,.3)',
              background: remarksOpen ? 'rgba(59,130,246,.06)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 7,
              fontFamily: 'inherit',
              borderTop: '1px solid rgba(255,255,255,.04)',
              transition: 'color .2s ease, background .2s ease',
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: remarksOpen ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.05)',
              border: `1px solid ${remarksOpen ? 'rgba(59,130,246,.4)' : 'rgba(255,255,255,.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, flexShrink: 0,
              transition: 'all .2s ease',
            }}>
              <span style={{
                display: 'inline-block',
                transform: remarksOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform .25s cubic-bezier(.22,1,.36,1)',
              }}>▾</span>
            </span>
            {remarksOpen ? 'Hide Remarks' : 'View Authority Remarks'}
          </button>
          {remarksOpen && (
            <div style={{ padding: '4px 18px 16px' }}>
              <RemarksPanel row={r} authorities={authorities} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   STATS BAR — glowing summary cards
──────────────────────────────────────────────────────────────── */
const STAT_DEFS = [
  { key: 'showing',   label: 'Showing',     color: '#f1f5f9', icon: '⊟' },
  { key: 'filled',    label: 'Self-Filled',  color: '#fb923c', icon: '◎' },
  { key: 'approved',  label: 'VC Approved',  color: '#34d399', icon: '◈' },
];

function StatsBar({ rows, filteredCount }) {
  const filled   = rows.filter(r => r.grand_total > 0).length;
  const approved = rows.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s === 'reviewed' || s.includes('vc reviewed');
  }).length;

  const values = { showing: filteredCount, filled, approved };

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
      {STAT_DEFS.map(({ key, label, color, icon }, i) => (
        <div
          key={key}
          className="stat-enter"
          style={{
            flex: '1 1 120px', minWidth: 110,
            padding: '16px 20px', borderRadius: 16,
            background: `${color}07`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${color}18`,
            boxShadow: `0 4px 24px ${color}08, inset 0 1px 0 ${color}12`,
            animationDelay: `${i * 60}ms`,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Background glow orb */}
          <div style={{
            position: 'absolute', right: -10, top: -10,
            width: 60, height: 60, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          }}>
            <span style={{ fontSize: 12, color: `${color}70` }}>{icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: .8,
              textTransform: 'uppercase', color: `${color}70`,
            }}>
              {label}
            </span>
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 28, fontWeight: 800, color, lineHeight: 1,
            textShadow: `0 0 24px ${color}40`,
          }}>
            {values[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SKELETON LOADER — shimmer cards while loading
──────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: 'var(--c-card)', border: '1px solid var(--c-border)',
      borderTop: '2px solid rgba(255,255,255,.08)', marginBottom: 12, padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 7, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '55%', borderRadius: 5, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '25%', borderRadius: 5 }} />
        </div>
        <div className="skeleton" style={{ width: 110, height: 26, borderRadius: 20, flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="skeleton" style={{ flex: 1, height: 88, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   HERO HEADER — premium gradient title with year badge
──────────────────────────────────────────────────────────────── */
function HeroHeader({ year }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      padding: '28px 0 24px', marginBottom: 20,
    }}>
      {/* Decorative background orbs */}
      <div className="orb-float" style={{
        position: 'absolute', right: '8%', top: '10%',
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="orb-float-alt" style={{
        position: 'absolute', right: '25%', bottom: '0%',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="gradient-title" style={{
            fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Faculty Marks
          </h1>
          <p style={{
            fontSize: 13, color: C.muted, fontWeight: 500,
            animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) 100ms both',
          }}>
            Complete appraisal scores — teaching &amp; non-teaching staff
          </p>
        </div>

        {year && (
          <div className="pill-pop" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 24,
            background: 'rgba(59,130,246,.08)',
            border: '1px solid rgba(59,130,246,.2)',
            boxShadow: '0 4px 16px rgba(59,130,246,.1)',
            animationDelay: '200ms',
          }}>
            <div className="notif-dot" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#34d399', flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#93c5fd',
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: .4,
            }}>
              {year}
            </span>
          </div>
        )}
      </div>

      {/* Divider with gradient fade */}
      <div style={{
        marginTop: 20, height: 1,
        background: 'linear-gradient(90deg, rgba(59,130,246,.3), rgba(167,139,250,.2), transparent)',
      }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   FILTER BAR — glass morphism with frosted inputs
──────────────────────────────────────────────────────────────── */
function FilterBar({ school, setSchool, role, setRole, search, setSearch, count, loading }) {
  const labelStyle = {
    display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: .8,
    textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 6,
  };
  const inputStyle = {
    padding: '9px 13px', borderRadius: 10, fontSize: 13,
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.08)',
    color: C.text, fontFamily: 'inherit',
    outline: 'none', width: '100%',
    transition: 'border-color .18s ease, box-shadow .18s ease',
  };

  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16, marginBottom: 16,
      background: 'rgba(255,255,255,.025)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,.07)',
      boxShadow: '0 4px 24px rgba(0,0,0,.12)',
      animation: 'fadeUp .38s cubic-bezier(.22,1,.36,1) 80ms both',
    }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>

        {/* School */}
        <div style={{ minWidth: 180 }}>
          <label style={labelStyle}>School</label>
          <select className="ifield" value={school}
            onChange={e => { setSchool(e.target.value); setRole(''); }}
            style={inputStyle}>
            <option value="">All Teaching Staff</option>
            {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
            <option disabled>──────────────</option>
            <option value="__nt__">Non-Teaching Staff</option>
          </select>
        </div>

        {/* Role */}
        <div style={{ minWidth: 160 }}>
          <label style={labelStyle}>Role</label>
          <select className="ifield" value={role} onChange={e => setRole(e.target.value)}
            style={inputStyle}>
            <option value="">All Roles</option>
            <option value="faculty">Faculty</option>
            <option value="hod">HOD</option>
            <option value="director">Director</option>
            <option value="dean">Dean</option>
            <option value="center_head">Center Head</option>
            <option disabled>──────────</option>
            <option value="non_teaching_staff">Non-Teaching Staff</option>
            <option value="reporting_officer">Reporting Officer</option>
            <option value="registrar">Registrar</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Search</label>
          <input className="ifield" type="text"
            placeholder="Name, email or school…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, display: 'block' }} />
        </div>

        {/* Record count chip */}
        <div style={{
          padding: '9px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.06)',
          fontSize: 12, color: C.muted, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {loading ? (
            <>
              <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <span>Loading…</span>
            </>
          ) : (
            <>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: count > 0 ? '#34d399' : 'rgba(255,255,255,.2)',
                boxShadow: count > 0 ? '0 0 6px #34d39960' : 'none',
              }} />
              <span>
                <span style={{ fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>
                  {count}
                </span>
                {' '}record{count !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────── */
export default function FacultyMarksPage() {
  const profile = api.getProfile();
  if (profile?.appraisal_role !== 'super_admin') return <Navigate to="/" replace />;

  const [school, setSchool] = useState('');
  const [role,   setRole]   = useState('');
  const [search, setSearch] = useState('');
  const [rows,   setRows]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const { data: rawStats } = useFetch(() => api.stats.get(), []);
  const effectiveYear = useMemo(() => normalizeStats(rawStats).availableYears[0] ?? null, [rawStats]);

  useEffect(() => {
    if (!effectiveYear) return;
    setLoading(true);
    setError(null);
    const schoolParam = school === '__nt__' ? '' : school;
    api.marks.list(effectiveYear, schoolParam)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [effectiveYear, school]);

  const filtered = useMemo(() => {
    let result = rows;
    if (school === '__nt__')
      result = result.filter(r => NT_ROLES.has(r.appraisal_role));
    if (role)
      result = result.filter(r => r.appraisal_role === role);
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(r =>
      r.name?.toLowerCase().includes(q)  ||
      r.email?.toLowerCase().includes(q) ||
      r.school?.toLowerCase().includes(q)
    );
  }, [rows, search, school, role]);

  return (
    <div className="page-enter" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <HeroHeader year={effectiveYear} />

      <FilterBar
        school={school} setSchool={setSchool}
        role={role}     setRole={setRole}
        search={search} setSearch={setSearch}
        count={filtered.length}
        loading={loading}
      />

      {error && (
        <div style={{
          marginBottom: 14, padding: '14px 18px', borderRadius: 12, fontSize: 13,
          color: '#f87171',
          background: 'rgba(248,113,113,.07)',
          border: '1px solid rgba(248,113,113,.2)',
          backdropFilter: 'blur(12px)',
          animation: 'scaleIn .2s ease both',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <>
          {[1, 2, 3].map(n => <SkeletonCard key={n} />)}
        </>
      ) : (
        <>
          {rows.length > 0 && <StatsBar rows={rows} filteredCount={filtered.length} />}

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '64px 0',
              animation: 'fadeUp .4s ease both',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: 'rgba(255,255,255,.2)',
              }}>
                ◎
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 6 }}>
                {rows.length === 0 ? 'No records found' : 'No records match your filters'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
                {rows.length > 0 ? 'Try adjusting the school, role or search term' : 'Check the selected academic year'}
              </div>
            </div>
          ) : (
            filtered.map((r, i) => (
              <FacultyCard
                key={r.email}
                r={r}
                index={i + 1}
                animDelay={Math.min(i * 40, 400)}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
