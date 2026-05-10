import { useState, useCallback } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import PageHead from '../../components/PageHead';

const AUDIENCE = [
  { value: 'all',                label: 'All Faculty'        },
  { value: 'faculty',            label: 'Faculty'            },
  { value: 'hod',                label: 'HODs only'          },
  { value: 'dean',               label: 'Deans only'         },
  { value: 'non_teaching_staff', label: 'Non-teaching Staff' },
];

const EMPTY = { title: '', body: '', audience: 'all', is_active: true };

export default function AnnouncementsPage() {
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState(null);
  const [tick, setTick]         = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr]   = useState(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const { data: raw, loading, error } = useFetch(() => api.announcements.list(), [tick]);
  const notices = Array.isArray(raw) ? raw : (raw?.announcements ?? raw?.items ?? []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handlePublish = async () => {
    if (!form.title || !form.body) {
      setStatus({ ok: false, msg: 'Title and message are required.' });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      await api.announcements.create(form);
      setStatus({ ok: true, msg: 'Announcement published.' });
      setForm(EMPTY);
      refresh();
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    setDeleting(id);
    try {
      await api.announcements.remove(id);
      refresh();
    } finally {
      setDeleting(null);
    }
  };

  const saveEdit = async () => {
    setEditSaving(true); setEditErr(null);
    try {
      const { id, ...data } = editing;
      await api.announcements.update(id, data);
      setEditing(null);
      refresh();
    } catch (e) {
      setEditErr(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  const smAction = (extra = {}) => ({
    padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
    color: C.subtle, cursor: 'pointer', ...extra,
  });

  return (
    <div className="page-enter">
      <PageHead title="Announcements" sub="Create notices and broadcast messages to faculty" />

      {/* ── Edit modal ─────────────────────────────────────────────── */}
      {editing && (
        <Modal maxWidth={480} onClose={() => setEditing(null)}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>Edit Announcement</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Title</label>
              <input className="ifield" value={editing.title}
                onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Audience</label>
              <select className="ifield" value={editing.audience}
                onChange={e => setEditing(p => ({ ...p, audience: e.target.value }))} style={inp}>
                {AUDIENCE.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Message</label>
              <textarea className="ifield" value={editing.body} rows={4}
                onChange={e => setEditing(p => ({ ...p, body: e.target.value }))}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="edit-active" checked={editing.is_active}
                onChange={e => setEditing(p => ({ ...p, is_active: e.target.checked }))} />
              <label htmlFor="edit-active" style={{ ...lbl, marginBottom: 0, cursor: 'pointer' }}>
                Active (visible to recipients)
              </label>
            </div>

            {editErr && (
              <div style={{ marginBottom: 14, fontSize: 12, color: C.red }}>{editErr}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="act-btn" style={pBtn} onClick={saveEdit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="act-btn"
                style={{ padding: '9px 18px', background: 'transparent', color: C.muted,
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600 }}
                onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
        </Modal>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>

        {/* ── Compose ──────────────────────────────────────────────── */}
        <Card title="New Notice" delay={0}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Title</label>
            <input className="ifield" value={form.title} onChange={set('title')}
              placeholder="e.g. Submission window extended" style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Target Audience</label>
            <select className="ifield" value={form.audience} onChange={set('audience')} style={inp}>
              {AUDIENCE.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Message</label>
            <textarea className="ifield" value={form.body} onChange={set('body')}
              placeholder="Write your announcement here…" rows={5}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {status && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              color: status.ok ? C.green : C.red,
              background: status.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
              border: `1px solid ${status.ok ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}` }}>
              {status.msg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="act-btn" style={pBtn} onClick={handlePublish} disabled={saving}>
              <I.send size={13} /> {saving ? 'Publishing…' : 'Publish Notice'}
            </button>
            <button className="act-btn" style={oBtn}
              onClick={() => { setForm(EMPTY); setStatus(null); }}>
              Clear
            </button>
          </div>
        </Card>

        {/* ── Past notices ─────────────────────────────────────────── */}
        <Card title={`Past Notices${notices.length ? ` (${notices.length})` : ''}`} delay={60}>
          {loading && <Loading />}
          {error   && <ApiError message={error} />}

          {!loading && !error && notices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
              No notices yet
            </div>
          )}

          {!loading && !error && notices.map((n, i) => {
            const audienceLabel = AUDIENCE.find(o => o.value === n.audience)?.label ?? n.audience ?? '—';
            const date = n.created_at
              ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—';
            return (
              <div key={n.id} style={{ padding: '11px 0',
                borderBottom: i < notices.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600, flex: 1,
                    lineHeight: 1.4 }}>{n.title}</span>
                  <Badge color={n.is_active ? 'green' : 'red'}>{n.is_active ? 'Live' : 'Off'}</Badge>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                  {audienceLabel} · {date}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="act-btn" style={smAction()}
                    onClick={() => setEditing({
                      id: n.id, title: n.title, body: n.body ?? '',
                      audience: n.audience ?? 'all', is_active: n.is_active ?? true,
                    })}>
                    Edit
                  </button>
                  <button className="act-btn"
                    onClick={() => handleDelete(n.id)}
                    disabled={deleting === n.id}
                    style={smAction({
                      color: C.red, background: 'rgba(248,113,113,.06)',
                      borderColor: 'rgba(248,113,113,.2)',
                      opacity: deleting === n.id ? .5 : 1,
                    })}>
                    {deleting === n.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
