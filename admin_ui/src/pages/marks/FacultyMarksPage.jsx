import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { SCHOOLS } from '../../constants/schools';
import { api } from '../../api/client';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

const AUTHORITIES = [
  { role: 'hod',      label: 'HOD',      color: '#a78bfa' },
  { role: 'director', label: 'Director',  color: '#fbbf24' },
  { role: 'dean',     label: 'Dean',      color: '#34d399' },
  { role: 'vc',       label: 'VC',        color: '#3b82f6' },
];

function ScoreBadge({ total, partA, partB, color }) {
  if (!total) return <span style={{ fontSize: 11, color: 'rgba(255,255,255,.15)' }}>—</span>;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 800, color }}>
        {total.toFixed(1)}
      </div>
      <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
        {partA.toFixed(1)} + {partB.toFixed(1)}
      </div>
    </div>
  );
}

function RemarksPanel({ row }) {
  const hasAny = AUTHORITIES.some(a => row[`${a.role}_remarks`]);
  if (!hasAny) {
    return (
      <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', padding: '4px 0' }}>
        No remarks submitted by any authority yet.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {AUTHORITIES.map(a => {
        const remark = row[`${a.role}_remarks`];
        const total  = row[`${a.role}_total`];
        return (
          <div key={a.role} style={{
            padding: '12px 14px', borderRadius: 10,
            background: remark ? `${a.color}08` : 'rgba(255,255,255,.02)',
            border: `1px solid ${remark ? `${a.color}22` : 'rgba(255,255,255,.05)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .6,
                textTransform: 'uppercase', color: a.color }}>
                {a.label}
              </span>
              {total > 0 && (
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  fontWeight: 700, color: a.color }}>
                  {total.toFixed(1)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: remark ? C.subtle : C.muted,
              fontStyle: remark ? 'normal' : 'italic', lineHeight: 1.55 }}>
              {remark || 'No remarks'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FacultyMarksPage() {
  const profile = api.getProfile();
  if (profile?.appraisal_role !== 'super_admin') return <Navigate to="/" replace />;

  const [year,    setYear]    = useState('2024-25');
  const [school,  setSchool]  = useState('');
  const [search,  setSearch]  = useState('');
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [expanded, setExpanded] = useState(null); // email of expanded row

  useEffect(() => {
    setLoading(true);
    setError(null);
    setExpanded(null);
    api.marks.list(year, school)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, school]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.name?.toLowerCase().includes(q)  ||
      r.email?.toLowerCase().includes(q) ||
      r.school?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const thStyle = {
    padding: '10px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .6,
    textTransform: 'uppercase', color: C.muted, textAlign: 'left',
    borderBottom: '1px solid var(--c-border)', whiteSpace: 'nowrap', background: 'var(--c-soft-bg)',
  };

  return (
    <div className="page-enter">
      <PageHead
        title="Faculty Marks"
        sub="All reviewer scores and remarks — super admin view"
      />

      {/* ── Filters ── */}
      <Card delay={0} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Academic Year</label>
            <select className="ifield" value={year} onChange={e => setYear(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }}>
              {['2024-25', '2023-24', '2022-23'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>School</label>
            <select className="ifield" value={school} onChange={e => setSchool(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)', color: C.text }}>
              <option value="">All Schools</option>
              {SCHOOLS.map(s => (
                <option key={s.code} value={s.code}>{s.code} — {s.full}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: .6,
              textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Search</label>
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

      {/* ── Hint ── */}
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>
        Click any row to expand and see written remarks from each authority.
      </div>

      {/* ── Table ── */}
      <Card delay={60}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 36 }}>#</th>
                <th style={thStyle}>Name / Email</th>
                <th style={thStyle}>School</th>
                <th style={thStyle}>Role</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                {AUTHORITIES.map(a => (
                  <th key={a.role} style={{ ...thStyle, textAlign: 'center', color: a.color }}>
                    {a.label}
                  </th>
                ))}
                <th style={{ ...thStyle, textAlign: 'center', color: C.accent }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7 + AUTHORITIES.length} style={{ padding: '40px 0',
                    textAlign: 'center', color: C.muted, fontSize: 13 }}>
                    Loading scores…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7 + AUTHORITIES.length} style={{ padding: '40px 0',
                    textAlign: 'center', color: C.muted, fontSize: 13 }}>
                    No records found
                  </td>
                </tr>
              )}

              {!loading && filtered.map((r, i) => {
                const isOpen    = expanded === r.email;
                const submitted = r.status === 'submitted' || r.status === 'Reviewed' ||
                                  r.status?.toLowerCase().includes('review');
                const hasRemarks = AUTHORITIES.some(a => r[`${a.role}_remarks`]);

                return [
                  /* ── Main row ── */
                  <tr
                    key={r.email}
                    onClick={() => setExpanded(isOpen ? null : r.email)}
                    className="tr-row"
                    style={{
                      borderBottom: isOpen ? 'none' : '1px solid var(--c-row-border)',
                      cursor: 'pointer',
                      background: isOpen ? 'rgba(59,130,246,.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '11px 12px', color: C.muted, fontSize: 11 }}>{i + 1}</td>

                    <td style={{ padding: '11px 12px', minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{r.name || '—'}</div>
                        {hasRemarks && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px',
                            borderRadius: 20, background: 'rgba(59,130,246,.12)',
                            color: C.accent, letterSpacing: .4 }}>
                            REMARKS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: C.muted,
                        fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
                        {r.email}
                      </div>
                    </td>

                    <td style={{ padding: '11px 12px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                        padding: '2px 8px', borderRadius: 20,
                        background: 'var(--c-soft-bg)', border: '1px solid var(--c-border)',
                        color: C.subtle }}>
                        {r.school || '—'}
                      </span>
                    </td>

                    <td style={{ padding: '11px 12px', fontSize: 11, color: C.muted,
                      textTransform: 'capitalize' }}>
                      {r.appraisal_role?.replace(/_/g, ' ') || '—'}
                    </td>

                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: submitted ? 'rgba(52,211,153,.12)' : 'rgba(251,191,36,.10)',
                        color: submitted ? C.green : C.yellow,
                        border: `1px solid ${submitted ? 'rgba(52,211,153,.25)' : 'rgba(251,191,36,.25)'}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {r.status || 'pending'}
                      </span>
                    </td>

                    {AUTHORITIES.map(a => (
                      <td key={a.role} style={{ padding: '11px 12px', textAlign: 'center' }}>
                        <ScoreBadge
                          total={r[`${a.role}_total`]}
                          partA={r[`${a.role}_part_a`]}
                          partB={r[`${a.role}_part_b`]}
                          color={a.color}
                        />
                      </td>
                    ))}

                    <td style={{ padding: '11px 12px', textAlign: 'center' }}>
                      {r.grand_total > 0
                        ? <span style={{ fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 14, fontWeight: 800, color: C.accent }}>
                            {r.grand_total.toFixed(1)}
                          </span>
                        : <span style={{ fontSize: 11, color: 'rgba(255,255,255,.15)' }}>—</span>
                      }
                    </td>
                  </tr>,

                  /* ── Expanded remarks row ── */
                  isOpen && (
                    <tr key={`${r.email}-remarks`}>
                      <td colSpan={7 + AUTHORITIES.length} style={{
                        padding: '0 16px 16px 52px',
                        borderBottom: '1px solid var(--c-row-border)',
                        background: 'rgba(59,130,246,.03)',
                      }}>
                        <div style={{ paddingTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: .7,
                            textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>
                            Authority Remarks
                          </div>
                          <RemarksPanel row={r} />
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
