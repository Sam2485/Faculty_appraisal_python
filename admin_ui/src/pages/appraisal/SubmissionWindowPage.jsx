import { useState, useEffect } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function toDateInput(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export default function SubmissionWindowPage() {
  const [tick, setTick] = useState(0);
  const { data: configs, loading, error } = useFetch(() => api.cycle.list(), [tick]);
  const allConfigs = Array.isArray(configs) ? configs : [];
  const current    = allConfigs[0] ?? null;

  const [year,  setYear]  = useState('');
  const [start, setStart] = useState('');
  const [end,   setEnd]   = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  useEffect(() => {
    if (current) {
      setYear(current.academic_year ?? '');
      setStart(toDateInput(current.submission_start));
      setEnd(toDateInput(current.submission_end));
      setIsOpen(current.is_open ?? false);
    }
  }, [current]);

  const handleSave = async () => {
    if (!year.trim()) {
      setMsg({ ok: false, msg: 'Academic year is required.' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const payload = {
        is_open: isOpen,
        submission_start: start ? new Date(start).toISOString() : null,
        submission_end:   end   ? new Date(end).toISOString()   : null,
      };
      const exists = allConfigs.find(c => c.academic_year === year.trim());
      if (exists) {
        await api.cycle.update(year.trim(), payload);
      } else {
        await api.cycle.create({ academic_year: year.trim(), ...payload });
      }
      setMsg({ ok: true, msg: 'Window configuration saved.' });
      setTick(t => t + 1);
    } catch (e) {
      setMsg({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (open) => {
    if (!year.trim()) return;
    const exists = allConfigs.find(c => c.academic_year === year.trim());
    if (!exists) {
      setMsg({ ok: false, msg: `No config found for "${year}". Save the window first.` });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      await api.cycle.update(year.trim(), { is_open: open });
      setIsOpen(open);
      setMsg({ ok: true, msg: open ? 'Submission window opened.' : 'Submission window closed.' });
      setTick(t => t + 1);
    } catch (e) {
      setMsg({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const left = daysLeft(end);

  return (
    <div className="page-enter">
      <PageHead title="Submission Window" sub="Control when faculty can submit appraisals" />

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="Window Configuration" delay={0}>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Academic Year</label>
              <input className="ifield" value={year} onChange={e => setYear(e.target.value)}
                placeholder="e.g. 2025-26" style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Submission Opens</label>
              <input className="ifield" type="datetime-local" value={start}
                onChange={e => setStart(e.target.value)} style={inp} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Submission Closes</label>
              <input className="ifield" type="datetime-local" value={end}
                onChange={e => setEnd(e.target.value)} style={inp} />
            </div>

            {msg && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                color: msg.ok ? C.green : C.red,
                background: msg.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
                border: `1px solid ${msg.ok ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}` }}>
                {msg.msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="act-btn" style={pBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Window'}
              </button>
              <button className="act-btn"
                style={{ ...oBtn, color: isOpen ? C.red : C.green,
                  borderColor: isOpen ? 'rgba(248,113,113,.25)' : 'rgba(52,211,153,.25)' }}
                onClick={() => handleToggle(!isOpen)} disabled={saving || !year}>
                {isOpen ? 'Close Now' : 'Open Now'}
              </button>
            </div>
          </Card>

          <Card title="Current Status" delay={60}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{isOpen ? '🟢' : '🔴'}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isOpen ? C.green : C.red, marginBottom: 6 }}>
                Window {isOpen ? 'Open' : 'Closed'}
              </div>
              {year && (
                <Badge color={isOpen ? 'green' : 'red'}>{year}</Badge>
              )}
              {isOpen && end && left !== null && (
                <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{left}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>days remaining</div>
                </div>
              )}
              {!isOpen && (
                <div style={{ marginTop: 20, fontSize: 12, color: C.muted }}>
                  Faculty cannot submit appraisals while the window is closed.
                </div>
              )}

              {current && (
                <div style={{ marginTop: 20, textAlign: 'left' }}>
                  {[
                    { l: 'Opens',    v: current.submission_start ? new Date(current.submission_start).toLocaleDateString() : '—' },
                    { l: 'Closes',   v: current.submission_end   ? new Date(current.submission_end).toLocaleDateString()   : '—' },
                    { l: 'Updated',  v: current.updated_at       ? new Date(current.updated_at).toLocaleDateString()       : '—' },
                  ].map(x => (
                    <div key={x.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--c-row-border)', fontSize: 12 }}>
                      <span style={{ color: C.muted }}>{x.l}</span>
                      <span style={{ color: C.subtle, fontFamily: "'JetBrains Mono',monospace" }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
