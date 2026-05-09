import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';

export default function SchoolStatisticsPage() {
  const { data: raw, loading, error } = useFetch(() => api.stats.get(), []);
  const { bySchool } = normalizeStats(raw);

  return (
    <div className="page-enter">
      <PageHead title="School Statistics" sub="Submission breakdown by school" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="Bar Comparison" delay={0}>
            {bySchool.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No data</div>
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

          <Card title="Completion Rates" delay={60}>
            {bySchool.map((s, i) => {
              const pct = s.total ? s.sub / s.total : 0;
              const bc  = pct >= .8 ? 'green' : pct >= .6 ? 'blue' : 'yellow';
              const col = pct >= .8 ? `linear-gradient(90deg,${C.green},#059669)` : pct >= .6 ? `linear-gradient(90deg,${C.accent},#2563eb)` : `linear-gradient(90deg,${C.yellow},#d97706)`;
              return (
                <div key={s.name} style={{ marginBottom: i < bySchool.length - 1 ? 13 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.subtle }}>{s.name}</span>
                    <Badge color={bc}>{Math.round(pct * 100)}%</Badge>
                  </div>
                  <ProgressBar value={pct * 100} color={col} />
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
