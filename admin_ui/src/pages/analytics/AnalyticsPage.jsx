import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '../../constants/colors';
import { trendData } from '../../constants/mockData';
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

const EXPORTS = [
  { label: 'Submission Summary (PDF)',       size: '~240 KB', icon: I.dl },
  { label: 'Faculty Data Export (CSV)',       size: '~18 KB',  icon: I.dl },
  { label: 'School Performance Report (PDF)', size: '~180 KB', icon: I.dl },
  { label: 'Full Cycle Archive (ZIP)',         size: '~1.2 MB', icon: I.dl },
];

export default function AnalyticsPage() {
  const { data: raw, loading, error } = useFetch(() => api.stats.get(), []);
  const { bySchool } = normalizeStats(raw);

  return (
    <div className="page-enter">
      <PageHead title="Analytics &amp; Reports" sub="Submission trends, school performance, and data exports" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Submission Trends" sub="Monthly submitted vs pending (placeholder)" delay={0}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="m"  tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis              tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="sub"  name="Submitted" stroke={C.accent} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pend" name="Pending"   stroke={C.red}    strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="School Performance" sub="Submitted vs pending by school" delay={60}>
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

            <Card title="Export Reports" sub="Download data for the current cycle" delay={80}>
              {EXPORTS.map((e, i) => {
                const Icon = e.icon;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < EXPORTS.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{e.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.size}</div>
                    </div>
                    <button className="act-btn" style={{ ...smBtn, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon size={12} /> Download
                    </button>
                  </div>
                );
              })}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
