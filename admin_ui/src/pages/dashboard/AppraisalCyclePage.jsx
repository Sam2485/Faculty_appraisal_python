import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';

export default function AppraisalCyclePage() {
  const { data: raw, loading, error } = useFetch(() => api.stats.get(), []);
  const stats = normalizeStats(raw);
  const rate  = stats.total ? Math.round(stats.submitted / stats.total * 100) : 0;

  return (
    <div className="page-enter">
      <PageHead title="Appraisal Cycle" sub="Current cycle overview" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { l: 'Total Faculty', v: loading ? '…' : stats.total,     c: C.accent },
          { l: 'Submitted',     v: loading ? '…' : stats.submitted,  c: C.green  },
          { l: 'Pending',       v: loading ? '…' : stats.pending,    c: C.red    },
        ].map((s, i) => (
          <div key={s.l} className="glass card-appear" style={{ padding: '16px 18px', animationDelay: `${i * 60}ms` }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <Card title="Overall Progress" delay={80}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: C.subtle }}>
            <span>Submission completion</span>
            <span style={{ fontWeight: 700, color: C.text }}>{rate}% · {stats.submitted} of {stats.total}</span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <ProgressBar value={rate} color={`linear-gradient(90deg,${C.accent},${C.green})`} />
          </div>
          {stats.bySchool.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.bySchool} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis                tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="sub"  name="Submitted" fill={C.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pend" name="Pending"   fill={C.red}    radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      )}
    </div>
  );
}
