import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { C } from '../../constants/colors';
import { trendData } from '../../constants/mockData';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';
import { Loading, ApiError } from '../../components/LoadingState';
import { useFetch } from '../../hooks/useFetch';
import { normalizeStats } from '../../api/normalizers';
import { api } from '../../api/client';

export default function OverviewPage() {
  const { data: raw, loading, error } = useFetch(() => api.stats.get(), []);
  const stats = normalizeStats(raw);

  const pieData = [
    { name: 'Submitted', value: stats.submitted, color: C.green },
    { name: 'Pending',   value: stats.pending,   color: C.red   },
  ];

  return (
    <div className="page-enter">
      <PageHead title="Overview" sub="Real-time snapshot of the appraisal system · Cycle 2024–25" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
            <StatCard label="Total Faculty" value={stats.total}     delta="Faculty registered"  color={C.accent} IconC={I.users}   delay={0}   />
            <StatCard label="Submitted"     value={stats.submitted} delta={`${stats.total ? Math.round(stats.submitted/stats.total*100) : 0}% completion`} color={C.green}  IconC={I.check}   delay={60}  />
            <StatCard label="Pending"       value={stats.pending}   delta="Yet to submit"       color={C.red}    IconC={I.clock}   delay={120} />
            <StatCard label="Schools"       value={stats.bySchool.length || '—'} delta="Tracked"  color={C.yellow} IconC={I.school}  delay={180} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Submission Trend" sub="Placeholder — no monthly trend endpoint yet" delay={100}>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.accent} stopOpacity={.28} />
                      <stop offset="95%" stopColor={C.accent} stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.red} stopOpacity={.22} />
                      <stop offset="95%" stopColor={C.red} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="m"  tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis              tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="sub"  name="Submitted" stroke={C.accent} fill="url(#gS)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="pend" name="Pending"   stroke={C.red}    fill="url(#gP)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Cycle Split" sub="Current year" delay={140}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={66} strokeWidth={0} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                {pieData.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: C.subtle }}>{p.name}</span>
                    <span style={{ color: C.text, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="School-wise Progress" delay={180}>
            {stats.bySchool.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No school breakdown available</div>
            ) : stats.bySchool.map((s, i) => {
              const pct = s.total ? s.sub / s.total : 0;
              const col = pct >= .8 ? `linear-gradient(90deg,${C.green},#059669)` : pct >= .6 ? `linear-gradient(90deg,${C.accent},#2563eb)` : `linear-gradient(90deg,${C.yellow},#d97706)`;
              const bc  = pct >= .8 ? 'green' : pct >= .6 ? 'blue' : 'yellow';
              return (
                <div key={s.name} style={{ marginBottom: i < stats.bySchool.length - 1 ? 13 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.subtle, fontWeight: 500 }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}/{s.total}</span>
                      <Badge color={bc}>{Math.round(pct * 100)}%</Badge>
                    </div>
                  </div>
                  <ProgressBar value={pct * 100} color={col} />
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
