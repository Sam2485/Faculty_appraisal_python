import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { C } from '../../constants/colors';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';
import SchoolProgress from '../../components/SchoolProgress';
import LiveBadge from '../../components/LiveBadge';
import { Loading, ApiError } from '../../components/LoadingState';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { normalizeStats } from '../../api/normalizers';
import { api } from '../../api/client';

export default function OverviewPage() {
  const { data: raw, loading, error, lastUpdated } = useFetch(() => api.stats.get(), [], { interval: AUTO_REFRESH_INTERVAL });
  const stats = normalizeStats(raw);

  const pieData = [
    { name: 'Submitted', value: stats.submitted, color: C.green },
    { name: 'Pending',   value: stats.pending,   color: C.red   },
  ];

  const pipelineData = Object.entries(stats.pipeline ?? {}).map(([status, count]) => ({
    status: status.replace('Pending ', '').replace('Reviewed by ', ''),
    fullStatus: status,
    count,
  }));

  return (
    <div className="page-enter">
      <PageHead title="Overview" sub="Real-time snapshot of the appraisal system · Cycle 2024–25" action={<LiveBadge lastUpdated={lastUpdated} />} />

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
            <Card title="Review Pipeline" sub="Submissions by review stage" delay={100}>
              {pipelineData.length === 0 ? (
                <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.muted, fontSize: 13 }}>No submissions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
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
            <SchoolProgress schools={stats.bySchool} emptyMsg="No school breakdown available" />
          </Card>
        </>
      )}
    </div>
  );
}
