import { useState } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

export default function PendingFacultyPage() {
  const [year, setYear] = useState('');

  const { data: raw, loading, error } = useFetch(
    () => api.stats.get(year || undefined),
    [year]
  );
  const stats = normalizeStats(raw);
  const totalPending = stats.bySchool.reduce((s, r) => s + r.pend, 0);

  return (
    <div className="page-enter">
      <PageHead title="Pending Faculty" sub="Faculty yet to submit — breakdown by school" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            {stats.availableYears.length > 0 && (
              <select value={year}
                onChange={e => setYear(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.09)',
                  background: 'rgba(255,255,255,.04)', color: C.text, fontSize: 12, cursor: 'pointer' }}>
                <option value="">Latest cycle</option>
                {stats.availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            <Badge color="red" dot>{totalPending} pending</Badge>
          </div>

          <Card>
            {stats.bySchool.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
                No data available
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['School', 'Pending', 'Submitted', 'Total', 'Progress'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700,
                        color: C.muted, textAlign: h === 'School' ? 'left' : 'center',
                        letterSpacing: .6, textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.bySchool.map((s, i) => {
                    const pct = s.total > 0 ? Math.round((s.sub / s.total) * 100) : 0;
                    return (
                      <tr key={s.name} className="tr-row" style={{ animationDelay: `${i * 40}ms` }}>
                        <td style={{ padding: '11px 12px', fontSize: 13, color: C.text,
                          fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                          {s.name}
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'center',
                          borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                          <Badge color={s.pend > 0 ? 'red' : 'green'}>{s.pend}</Badge>
                        </td>
                        <td style={{ padding: '11px 12px', textAlign: 'center',
                          borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                          <Badge color="green">{s.sub}</Badge>
                        </td>
                        <td style={{ padding: '11px 12px', fontSize: 12, color: C.muted,
                          textAlign: 'center', fontFamily: "'JetBrains Mono',monospace",
                          borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                          {s.total}
                        </td>
                        <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 5, borderRadius: 3,
                              background: 'rgba(255,255,255,.06)' }}>
                              <div style={{ height: '100%', borderRadius: 3,
                                width: `${pct}%`,
                                background: pct === 100 ? C.green : pct > 50 ? '#fbbf24' : C.red,
                                transition: 'width .4s ease' }} />
                            </div>
                            <span style={{ fontSize: 10, color: C.muted,
                              fontFamily: "'JetBrains Mono',monospace", minWidth: 28 }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
