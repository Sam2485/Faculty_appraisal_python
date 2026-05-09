import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeFeedback } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { smBtn } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

const catColor = { Bug: 'red', Query: 'yellow' };
const stColor  = { Open: 'red', 'In review': 'yellow', Resolved: 'green', Planned: 'blue' };

export default function FeedbackPage() {
  const { data: raw, loading, error } = useFetch(() => api.feedback.list(), []);
  const items = normalizeFeedback(raw);
  const open  = items.filter(b => b.status === 'Open');

  return (
    <div className="page-enter">
      <PageHead title="Feedback &amp; Support" sub="Queries and bug reports from faculty" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <Card title="Queries & Bugs" action={<Badge color="red" dot>{open.length} open</Badge>} delay={0}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No feedback yet</div>
          ) : items.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
              <Av init={b.av} color={b.cat === 'Bug' ? C.red : C.yellow} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4 }}>{b.msg}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{b.user} · {b.date}</span>
                  <Badge color={catColor[b.cat] || 'gray'}>{b.cat}</Badge>
                  <Badge color={stColor[b.status] || 'gray'} dot>{b.status}</Badge>
                </div>
              </div>
              <button className="act-btn" style={smBtn}>View</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
