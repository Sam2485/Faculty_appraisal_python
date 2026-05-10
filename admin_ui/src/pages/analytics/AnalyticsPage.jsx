import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { I } from '../../components/icons';
import { smBtn } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [exportYear, setExportYear] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [downloadErr, setDownloadErr] = useState(null);

  const { data: raw, loading, error } = useFetch(() => api.stats.get(), []);
  const stats = normalizeStats(raw);
  const { bySchool } = stats;

  const pipelineData = Object.entries(stats.pipeline ?? {}).map(([status, count]) => ({
    status: status.replace('Pending ', '').replace('Reviewed by ', ''),
    fullStatus: status,
    count,
  }));

  const nonTeachingData = Object.entries(stats.nonTeachingPipeline ?? {}).map(([status, count]) => ({
    status, count,
  }));

  const handleExport = async (type) => {
    setDownloading(type); setDownloadErr(null);
    const params = exportYear ? { academic_year: exportYear } : {};
    const year = exportYear || 'latest';
    try {
      const blob = await api.export[type](params);
      triggerDownload(blob, `${type}-${year}.csv`);
    } catch (e) {
      setDownloadErr(e.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="page-enter">
      <PageHead title="Analytics &amp; Reports" sub="Submission trends, school performance, and data exports" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Teaching Review Pipeline" sub="Submissions by review stage" delay={0}>
              {pipelineData.length === 0 ? (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.muted, fontSize: 13 }}>No submissions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                    <XAxis dataKey="status" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis               tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} formatter={(v, n, p) => [v, p.payload.fullStatus]} />
                    <Bar dataKey="count" name="Submissions" fill={C.accent} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Non-Teaching Pipeline" sub="Non-teaching staff by review stage" delay={60}>
              {nonTeachingData.length === 0 ? (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.muted, fontSize: 13 }}>No non-teaching submissions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={nonTeachingData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                    <XAxis dataKey="status" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis              tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" name="Staff" fill={C.yellow} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="School Performance" sub="Submitted vs pending by school" delay={80}>
              {bySchool.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 13 }}>No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bySchool} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                    <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis              tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="sub"  name="Submitted" fill={C.accent} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pend" name="Pending"   fill={C.red}    radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Completion by School" delay={80}>
              {bySchool.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No data</div>
              ) : bySchool.map((s, i) => {
                const pct = s.total ? s.sub / s.total : 0;
                const bc  = pct >= .8 ? 'green' : pct >= .6 ? 'blue' : 'yellow';
                const col = pct >= .8 ? `linear-gradient(90deg,${C.green},#059669)` : pct >= .6 ? `linear-gradient(90deg,${C.accent},#2563eb)` : `linear-gradient(90deg,${C.yellow},#d97706)`;
                return (
                  <div key={s.name} style={{ marginBottom: i < bySchool.length - 1 ? 13 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: C.subtle }}>{s.name}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}/{s.total}</span>
                        <Badge color={bc}>{Math.round(pct * 100)}%</Badge>
                      </div>
                    </div>
                    <ProgressBar value={pct * 100} color={col} />
                  </div>
                );
              })}
            </Card>

            <Card title="Export Reports" sub="Download data as CSV" delay={80}>
              <div style={{ marginBottom: 16 }}>
                <select value={exportYear} onChange={e => setExportYear(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.09)',
                    background: 'rgba(255,255,255,.04)', color: C.text, fontSize: 12, cursor: 'pointer', width: '100%' }}>
                  <option value="">Latest cycle</option>
                  {(stats.availableYears ?? []).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {[
                { key: 'submissions', label: 'Submission Report', desc: 'All submissions with review status' },
                { key: 'faculty',     label: 'Faculty Export',    desc: 'Faculty list with school and role'  },
              ].map((e, i) => (
                <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{e.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.desc}</div>
                  </div>
                  <button className="act-btn"
                    style={{ ...smBtn, display: 'flex', alignItems: 'center', gap: 5, opacity: .4, cursor: 'not-allowed' }}
                    disabled title="Backend endpoint not yet available">
                    <I.dl size={12} /> CSV
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 7, fontSize: 11,
                color: '#fbbf24', background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.18)',
                lineHeight: 1.5 }}>
                Export endpoints not yet available — ask the backend developer to add
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  marginLeft: 4 }}>/admin/export/submissions</code> and
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  marginLeft: 4 }}>/admin/export/faculty</code>.
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
