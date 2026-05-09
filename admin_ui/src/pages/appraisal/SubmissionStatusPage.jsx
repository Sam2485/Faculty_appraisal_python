import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import PageHead from '../../components/PageHead';
import ProgressBar from '../../components/ProgressBar';

export default function SubmissionStatusPage() {
  const { data: raw, loading, error } = useFetch(() => api.stats.get(), []);
  const stats = normalizeStats(raw);
  const rate  = stats.total ? Math.round(stats.submitted / stats.total * 100) : 0;

  return (
    <div className="page-enter">
      <PageHead title="Submission Status" sub="Quick overview of submission completion" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label="Submitted" value={loading ? '…' : stats.submitted} color={C.green}  IconC={I.check} delay={0}   />
        <StatCard label="Pending"   value={loading ? '…' : stats.pending}   color={C.red}    IconC={I.clock} delay={60}  />
        <StatCard label="Rate"      value={loading ? '…' : `${rate}%`}      color={C.accent} IconC={I.bar}   delay={120} />
      </div>

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <Card title="School-wise Status" delay={100}>
          {stats.bySchool.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No school data available</div>
          ) : stats.bySchool.map((s, i) => {
            const pct = s.total ? s.sub / s.total : 0;
            const bc  = pct >= .8 ? 'green' : pct >= .6 ? 'blue' : 'yellow';
            const col = pct >= .8 ? `linear-gradient(90deg,${C.green},#059669)` : pct >= .6 ? `linear-gradient(90deg,${C.accent},#2563eb)` : `linear-gradient(90deg,${C.yellow},#d97706)`;
            return (
              <div key={s.name} style={{ marginBottom: i < stats.bySchool.length - 1 ? 14 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}/{s.total}</span>
                    <Badge color={bc}>{Math.round(pct * 100)}%</Badge>
                  </div>
                </div>
                <ProgressBar value={pct * 100} color={col} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
