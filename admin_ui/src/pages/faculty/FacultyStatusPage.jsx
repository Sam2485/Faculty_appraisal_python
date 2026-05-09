import { useState, useCallback } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeUsers } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { smBtn } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

export default function FacultyStatusPage() {
  const [tick, setTick]         = useState(0);
  const [actioning, setActioning] = useState(null); // email being actioned
  const [err, setErr]           = useState(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  const { data: raw, loading, error } = useFetch(() => api.users.list(), [tick]);
  const users    = normalizeUsers(raw);
  const active   = users.filter(f => f.status === 'Active');
  const inactive = users.filter(f => f.status !== 'Active');

  const setVerified = async (email, value) => {
    setActioning(email); setErr(null);
    try {
      await api.users.update(email, { is_verified: value });
      refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setActioning(null);
    }
  };

  const Row = ({ f, actionLabel, actionColor, onAction }) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <Av init={f.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          color={actionLabel === 'Deactivate' ? C.green : C.muted} size={31} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{f.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{f.dept} · {f.school}</div>
      </div>
      <button className="act-btn"
        onClick={() => onAction(f.email)}
        disabled={actioning === f.email}
        style={{ ...smBtn, color: actionColor,
          borderColor: `${actionColor}30`,
          background: `${actionColor}08`,
          opacity: actioning === f.email ? .5 : 1 }}>
        {actioning === f.email ? '…' : actionLabel}
      </button>
    </div>
  );

  return (
    <div className="page-enter">
      <PageHead title="Faculty Status" sub="Active and inactive faculty management" />

      {err && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13, color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>{err}</div>}
      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="Active Faculty" action={<Badge color="green" dot>{active.length} active</Badge>} delay={0}>
            {active.length === 0
              ? <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>No active faculty</div>
              : active.map(f => (
                  <Row key={f.id} f={f} actionLabel="Deactivate" actionColor={C.red}
                    onAction={email => setVerified(email, false)} />
                ))}
          </Card>

          <Card title="Inactive / Unverified" action={<Badge color="red" dot>{inactive.length} inactive</Badge>} delay={60}>
            {inactive.length === 0
              ? <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted, fontSize: 13 }}>No inactive faculty</div>
              : inactive.map(f => (
                  <Row key={f.id} f={f} actionLabel="Activate" actionColor={C.green}
                    onAction={email => setVerified(email, true)} />
                ))}
          </Card>
        </div>
      )}
    </div>
  );
}
