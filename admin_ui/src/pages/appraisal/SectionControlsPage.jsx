import { useState, useEffect } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import Toggle from '../../components/Toggle';

export default function SectionControlsPage() {
  const { data: configs, loading, error } = useFetch(() => api.cycle.list(), []);
  const current = Array.isArray(configs) ? configs[0] : null;

  const [windowOpen, setWindowOpen] = useState(false);
  const [s1, setS1] = useState(true);
  const [s3, setS3] = useState(true);
  const [s4, setS4] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (current) setWindowOpen(current.is_open ?? false);
  }, [current]);

  const handleWindowToggle = async (val) => {
    if (!current?.academic_year) return;
    setToggling(true); setMsg(null);
    try {
      await api.cycle.update(current.academic_year, { is_open: val });
      setWindowOpen(val);
      setMsg({ ok: true, text: val ? 'Submission window opened.' : 'Submission window closed.' });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setToggling(false);
    }
  };

  const toggles = [
    { l: 'Appraisal Module',       d: 'Master enable/disable switch',                v: s1,         s: setS1,              local: true },
    { l: 'Submission Window',      d: `Cycle: ${current?.academic_year ?? '—'}`,      v: windowOpen, s: handleWindowToggle, local: false },
    { l: 'Self-Appraisal Section', d: 'Enable self-assessment form',                 v: s3,         s: setS3,              local: true },
    { l: 'Peer Review',            d: 'Enable peer review feature',                  v: s4,         s: setS4,              local: true },
  ];

  const states = [
    { l: 'Module',    v: s1         ? 'Enabled'  : 'Disabled', color: s1         ? 'green' : 'red'  },
    { l: 'Window',    v: windowOpen ? 'Open'     : 'Closed',   color: windowOpen ? 'green' : 'red'  },
    { l: 'Self Form', v: s3         ? 'Active'   : 'Inactive', color: s3         ? 'green' : 'gray' },
    { l: 'Peer Rev',  v: s4         ? 'Active'   : 'Inactive', color: s4         ? 'green' : 'gray' },
  ];

  return (
    <div className="page-enter">
      <PageHead title="Section Controls" sub="Enable or disable appraisal modules globally" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {msg && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          color: msg.ok ? C.green : C.red,
          background: msg.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
          border: `1px solid ${msg.ok ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}` }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Module Toggles" delay={0}>
          {toggles.map((c, i) => (
            <div key={c.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 0', borderBottom: i < toggles.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{c.l}</span>
                  {c.local && (
                    <span style={{ fontSize: 9, color: C.muted, background: 'rgba(255,255,255,.06)',
                      padding: '2px 6px', borderRadius: 4, letterSpacing: .4 }}>UI only</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.d}</div>
              </div>
              <Toggle val={c.v} onChange={c.s} disabled={!c.local && (toggling || loading)} />
            </div>
          ))}
        </Card>

        <Card title="Current State" delay={60}>
          {states.map((x, i) => (
            <div key={x.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0', borderBottom: i < states.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
              fontSize: 13 }}>
              <span style={{ color: C.subtle }}>{x.l}</span>
              <Badge color={x.color}>{x.v}</Badge>
            </div>
          ))}
          <div style={{ marginTop: 16, fontSize: 11, color: C.muted, lineHeight: 1.6,
            padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.03)' }}>
            Toggles marked "UI only" are local state — contact the backend developer to add API support for module-level controls.
          </div>
        </Card>
      </div>
    </div>
  );
}
