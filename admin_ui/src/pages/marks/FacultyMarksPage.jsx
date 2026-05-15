import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { SCHOOLS } from '../../constants/schools';
import { api } from '../../api/client';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

const NT_ROLES = new Set(['non_teaching_staff', 'reporting_officer', 'registrar']);

/* ── Authority definitions (building blocks) ── */
const A = {
  self: { role: 'self',               label: 'Self',      color: '#94a3b8', partA: 'part_a_total',              partB: 'part_b_total',              total: 'grand_total'              },
  hod:  { role: 'hod',               label: 'HOD',       color: '#a78bfa', partA: 'hod_part_a',                partB: 'hod_part_b',                total: 'hod_total'                },
  ctr:  { role: 'center_head',       label: 'Ctr Head',  color: '#e879f9', partA: 'center_head_part_a',        partB: 'center_head_part_b',        total: 'center_head_total'        },
  dir:  { role: 'director',          label: 'Director',  color: '#fbbf24', partA: 'director_part_a',           partB: 'director_part_b',           total: 'director_total'           },
  dean: { role: 'dean',              label: 'Dean',      color: '#34d399', partA: 'dean_part_a',               partB: 'dean_part_b',               total: 'dean_total'               },
  vc:   { role: 'vc',                label: 'VC',        color: '#3b82f6', partA: 'vc_part_a',                 partB: 'vc_part_b',                 total: 'vc_total'                 },
  ro:   { role: 'reporting_officer', label: 'Rep. Off',  color: '#a78bfa', partA: 'reporting_officer_part_a',  partB: 'reporting_officer_part_b',  total: 'reporting_officer_total'  },
  reg:  { role: 'registrar',         label: 'Registrar', color: '#fbbf24', partA: 'registrar_part_a',          partB: 'registrar_part_b',          total: 'registrar_total'          },
};

/* ── Returns the reviewer authority list for a given faculty member ── */
function getAuthorities(school, appraisalRole) {
  const role = appraisalRole || 'faculty';

  if (role === 'non_teaching_staff' || role === 'staff')
    return [A.self, A.ro, A.reg, A.vc];

  if (school === 'CISR')
    return role === 'center_head' ? [A.self, A.vc] : [A.self, A.ctr, A.vc];

  if (role === 'vc')       return [A.self];
  if (role === 'dean')     return [A.self, A.vc];
  if (role === 'director') return [A.self, A.dean, A.vc];
  if (role === 'hod')      return [A.self, A.dir, A.dean, A.vc];

  // Faculty
  if (school === 'SoEMR')  return [A.self, A.hod, A.dir, A.dean, A.vc];
  return [A.self, A.dir, A.dean, A.vc];   // SoCSEA, SoBB, SoCE, SoCM, SoMCS, SoD, SoAA
}

/* ── Pipeline stage config ── */
const PS = {
  hod:               { label: 'HOD',      color: '#a78bfa' },
  center_head:       { label: 'Ctr Head', color: '#e879f9' },
  director:          { label: 'Director', color: '#fbbf24' },
  dean:              { label: 'Dean',     color: '#34d399' },
  reporting_officer: { label: 'Rep.Off',  color: '#a78bfa' },
  registrar:         { label: 'Registrar',color: '#fbbf24' },
  vc:                { label: 'VC',       color: '#3b82f6' },
  final:             { label: 'Final',    color: '#10b981' },
};

/* ── Returns the ordered pipeline keys for a given faculty member ── */
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

  // Faculty
  if (school === 'SoEMR')  return ['hod', 'director', 'dean', 'vc', 'final'];
  return ['director', 'dean', 'vc', 'final'];
}

/* ── Maps a status string → the role that currently holds the form ── */
function getWaitingRole(status) {
  const s = (status || '').toLowerCase().trim();
  if (!s || s === 'pending') return null;

  if (s === 'reviewed' || s === 'vc reviewed') return 'final';

  // "X Reviewed" — X is DONE, next stage is active
  if (s.includes('dean reviewed'))              return 'vc';
  if (s.includes('director reviewed'))          return 'dean';
  if (s.includes('hod reviewed'))               return 'director';
  if (s.includes('center head reviewed'))       return 'vc';
  if (s.includes('registrar reviewed'))         return 'final';
  if (s.includes('reporting officer reviewed')) return 'registrar';

  // "Pending X Review" — X is currently active
  if (s.includes('vc'))                          return 'vc';
  if (s.includes('dean'))                        return 'dean';
  if (s.includes('director'))                    return 'director';
  if (s.includes('center head') || s.includes('center_head')) return 'center_head';
  if (s.includes('registrar'))                   return 'registrar';
  if (s.includes('reporting'))                   return 'reporting_officer';
  if (s.includes('hod'))                         return 'hod';

  // Submitted, waiting at first reviewer
  if (s.includes('submitted') || s.includes('pending')) return '__first__';
  return null;
}

function statusStyle(status = '') {
  const s = status.toLowerCase();
  if (s.includes('vc') || s === 'reviewed')   return { color: '#34d399', bg: 'rgba(52,211,153,.12)',  border: 'rgba(52,211,153,.25)'  };
  if (s.includes('dean'))                      return { color: '#3b82f6', bg: 'rgba(59,130,246,.12)',  border: 'rgba(59,130,246,.25)'  };
  if (s.includes('director'))                  return { color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.25)'  };
  if (s.includes('hod'))                       return { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.25)' };
  if (s.includes('submitted') || s.includes('pending review'))
                                               return { color: '#fb923c', bg: 'rgba(251,146,60,.10)',  border: 'rgba(251,146,60,.25)'  };
  return { color: C.muted, bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.1)' };
}

/* ── Score block for one authority ── */
function ScoreBlock({ auth, row }) {
  const total = row[auth.total] || 0;
  const partA = row[auth.partA] || 0;
  const partB = row[auth.partB] || 0;
  const empty = !total;

  return (
    <div style={{
      flex: 1, minWidth: 0,
      padding: '10px 8px', borderRadius: 10, textAlign: 'center',
      background: empty ? 'rgba(255,255,255,.02)' : `${auth.color}0d`,
      border: `1px solid ${empty ? 'rgba(255,255,255,.06)' : `${auth.color}25`}`,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .7,
        textTransform: 'uppercase', color: empty ? C.muted : auth.color, marginBottom: 6 }}>
        {auth.label}
      </div>

      {empty ? (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.15)' }}>—</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: C.muted }}>A</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: `${auth.color}cc` }}>
              {partA.toFixed(1)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: C.muted }}>B</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: `${auth.color}cc` }}>
              {partB.toFixed(1)}
            </span>
          </div>
          <div style={{ height: 1, background: `${auth.color}20`, marginBottom: 5 }} />
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 800, color: auth.color }}>
            {total.toFixed(1)}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Remarks panel ── */
function RemarksPanel({ row, authorities }) {
  const reviewers = authorities.filter(a => a.role !== 'self' && row[`${a.role}_remarks`]);
  if (!reviewers.length)
    return <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>No remarks submitted yet.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
      {reviewers.map(a => (
        <div key={a.role} style={{
          padding: '10px 12px', borderRadius: 9,
          background: `${a.color}08`, border: `1px solid ${a.color}22`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .6,
            textTransform: 'uppercase', color: a.color, marginBottom: 5 }}>
            {a.label}
          </div>
          <div style={{ fontSize: 12, color: C.subtle, lineHeight: 1.55 }}>
            {row[`${a.role}_remarks`]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Pipeline queue bar ── */
function PipelineBar({ status, school, appraisalRole }) {
  const waitingRole = getWaitingRole(status);
  if (waitingRole === null) return null;

  const keys = getPipelineKeys(school, appraisalRole);
  let activeIdx = waitingRole === '__first__'  ? 0
    : waitingRole === 'final'                  ? keys.length - 1
    : keys.indexOf(waitingRole);
  if (activeIdx === -1) activeIdx = 0;

  return (
    <div style={{
      padding: '8px 16px 10px',
      borderTop: '1px solid rgba(255,255,255,.04)',
      display: 'flex', alignItems: 'center',
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .5,
        textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginRight: 10, flexShrink: 0 }}>
        Queue
      </span>
      {keys.map((key, i) => {
        const stage  = PS[key];
        const done   = i < activeIdx;
        const active = i === activeIdx;
        const color  = active ? stage.color : done ? '#10b981' : 'rgba(255,255,255,.12)';

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', flex: i < keys.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <div style={{
                width: active ? 8 : 6, height: active ? 8 : 6, borderRadius: '50%',
                background: done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.1)',
                border: `1.5px solid ${color}`,
                boxShadow: active ? `0 0 6px ${stage.color}80` : 'none',
              }} />
              <span style={{
                fontSize: 8, fontWeight: active ? 800 : done ? 600 : 400,
                color: done ? '#10b981' : active ? stage.color : 'rgba(255,255,255,.2)',
                letterSpacing: .3, whiteSpace: 'nowrap',
              }}>
                {done ? '✓' : stage.label}
              </span>
            </div>
            {i < keys.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: '0 2px', marginBottom: 10,
                background: done
                  ? 'linear-gradient(90deg,#10b981,#10b98180)'
                  : active
                    ? `linear-gradient(90deg,${stage.color}60,rgba(255,255,255,.06))`
                    : 'rgba(255,255,255,.06)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Faculty card ── */
function FacultyCard({ r, index }) {
  const [open, setOpen] = useState(false);

  const authorities = getAuthorities(r.school, r.appraisal_role);
  const reviewers   = authorities.filter(a => a.role !== 'self');
  const hasRemarks  = reviewers.some(a => r[`${a.role}_remarks`]);
  const ss          = statusStyle(r.status);

  const bestTotal = Math.max(0, ...reviewers.map(a => r[a.total] || 0));

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      background: 'var(--c-card)', border: '1px solid var(--c-border)', marginBottom: 10,
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start',
        gap: 12, borderBottom: '1px solid rgba(255,255,255,.05)' }}>

        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: C.muted,
        }}>
          {index}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.name || '—'}</span>
            {hasRemarks && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px',
                borderRadius: 20, background: 'rgba(59,130,246,.12)',
                color: C.accent, letterSpacing: .4 }}>
                REMARKS
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
            {r.email}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {r.school && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)',
                color: C.subtle, fontFamily: "'JetBrains Mono',monospace" }}>
                {r.school}
              </span>
            )}
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'capitalize' }}>
              {r.appraisal_role?.replace(/_/g, ' ')}
              {r.department ? ` · ${r.department}` : ''}
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, whiteSpace: 'nowrap',
          }}>
            {r.status || 'Not Submitted'}
          </span>
          {bestTotal > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: .4, textTransform: 'uppercase', marginBottom: 1 }}>
                Latest Score
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 800, color: C.accent, lineHeight: 1 }}>
                {bestTotal.toFixed(1)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Score blocks (only applicable authorities) ── */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        {authorities.map(a => <ScoreBlock key={a.role} auth={a} row={r} />)}
      </div>

      {/* ── Pipeline queue (school/role-aware) ── */}
      <PipelineBar status={r.status} school={r.school} appraisalRole={r.appraisal_role} />

      {/* ── Remarks toggle ── */}
      {hasRemarks && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            className="act-btn"
            style={{
              width: '100%', padding: '8px 16px', fontSize: 11, fontWeight: 600,
              color: open ? C.accent : C.muted,
              background: open ? 'rgba(59,130,246,.04)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit', borderTop: '1px solid rgba(255,255,255,.04)',
            }}
          >
            <span style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', fontSize: 10 }}>▾</span>
            {open ? 'Hide Remarks' : 'View Authority Remarks'}
          </button>
          {open && (
            <div style={{ padding: '0 16px 14px' }}>
              <RemarksPanel row={r} authorities={authorities} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function FacultyMarksPage() {
  const profile = api.getProfile();
  if (profile?.appraisal_role !== 'super_admin') return <Navigate to="/" replace />;

  const [year,    setYear]    = useState('2024-25');
  const [school,  setSchool]  = useState('');
  const [search,  setSearch]  = useState('');
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // NT staff span multiple schools — fetch all and filter client-side
    const schoolParam = school === '__nt__' ? '' : school;
    api.marks.list(year, schoolParam)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, school]);

  const filtered = useMemo(() => {
    let result = rows;
    if (school === '__nt__')
      result = result.filter(r => NT_ROLES.has(r.appraisal_role));
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(r =>
      r.name?.toLowerCase().includes(q)  ||
      r.email?.toLowerCase().includes(q) ||
      r.school?.toLowerCase().includes(q)
    );
  }, [rows, search, school]);

  return (
    <div className="page-enter">
      <PageHead
        title="Faculty Marks"
        sub="Teaching & non-teaching scores — pipeline adapts per school and role"
      />

      <Card delay={0} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Academic Year
            </label>
            <select className="ifield" value={year} onChange={e => setYear(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }}>
              {['2024-25', '2023-24', '2022-23'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Filter
            </label>
            <select className="ifield" value={school} onChange={e => setSchool(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }}>
              <option value="">All Teaching Staff</option>
              {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
              <option disabled>──────────────</option>
              <option value="__nt__">Non-Teaching Staff</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Search
            </label>
            <input className="ifield" type="text" placeholder="Name, email or school…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }} />
          </div>

          <div style={{ fontSize: 11, color: C.muted, paddingBottom: 2 }}>
            {loading ? 'Loading…' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, fontSize: 13,
          color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 13 }}>
          Loading scores…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 13 }}>
          No records found
        </div>
      ) : (
        filtered.map((r, i) => <FacultyCard key={r.email} r={r} index={i + 1} />)
      )}
    </div>
  );
}
