import { useState, useCallback, useRef, useEffect } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, pBtn } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import PageHead from '../../components/PageHead';
import { SCHOOLS } from '../../constants/schools';

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'all',                label: 'Everyone',     color: C.accent  },
  { value: 'faculty',            label: 'Faculty',      color: '#a78bfa' },
  { value: 'hod',                label: 'HOD',          color: C.yellow  },
  { value: 'director',           label: 'Director',     color: C.green   },
  { value: 'dean',               label: 'Dean',         color: '#22d3ee' },
  { value: 'non_teaching_staff', label: 'Non-Teaching', color: C.orange  },
  { value: 'registrar',          label: 'Registrar',    color: '#f472b6' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function toArr(str) {
  const parts = (str ?? 'all').split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : ['all'];
}
function toStr(arr) { return arr.length ? arr.join(',') : 'all'; }
function isSchoolCode(t) { return SCHOOLS.some(s => s.code === t); }
function tokenLabel(t) { return ROLE_OPTIONS.find(r => r.value === t)?.label ?? t; }
function tokenColor(t) {
  if (isSchoolCode(t)) return C.yellow;
  return ROLE_OPTIONS.find(r => r.value === t)?.color ?? C.accent;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── ToggleSwitch ───────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 38, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer',
      background: checked ? C.green : 'rgba(255,255,255,.1)',
      border: `1.5px solid ${checked ? C.green : 'rgba(255,255,255,.12)'}`,
      transition: 'all .2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: checked ? 17 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.35)',
      }} />
    </div>
  );
}

// ── AudiencePicker ─────────────────────────────────────────────────────────────

function AudiencePicker({ selected, onChange }) {
  const [schoolOpen, setSchoolOpen] = useState(false);
  const schoolRef = useRef(null);

  const selectedSchools = selected.filter(s => isSchoolCode(s));
  const selectedRoles   = selected.filter(s => !isSchoolCode(s));

  useEffect(() => {
    if (!schoolOpen) return;
    const h = (e) => { if (schoolRef.current && !schoolRef.current.contains(e.target)) setSchoolOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [schoolOpen]);

  const toggleRole = (v) => {
    if (v === 'all') { onChange([...selectedSchools, 'all']); return; }
    onChange([...selectedSchools, v]);
  };

  const toggleSchool = (code) => {
    const next = selectedSchools.includes(code)
      ? selectedSchools.filter(s => s !== code)
      : [...selectedSchools, code];
    onChange([...selectedRoles, ...next]);
  };

  const activeRole = selectedRoles.find(r => r !== 'all') ?? 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Role dropdown */}
      <div>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .6,
          textTransform: 'uppercase', marginBottom: 7 }}>By Role</div>
        <select
          className="ifield"
          value={activeRole}
          onChange={e => toggleRole(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', appearance: 'none',
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            color: C.text, outline: 'none',
          }}>
          {ROLE_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* School multi-select */}
      <div ref={schoolRef} style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .6,
          textTransform: 'uppercase', marginBottom: 7 }}>By School (optional)</div>
        <button type="button" className="act-btn" onClick={() => setSchoolOpen(o => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: selectedSchools.length ? `${C.yellow}0d` : 'rgba(255,255,255,.04)',
            border: `1px solid ${selectedSchools.length ? `${C.yellow}30` : 'rgba(255,255,255,.08)'}`,
            fontSize: 12, fontWeight: 600,
            color: selectedSchools.length ? C.yellow : C.muted,
          }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: selectedSchools.length ? "'JetBrains Mono',monospace" : 'inherit' }}>
            {selectedSchools.length === 0 ? 'No specific school' :
             selectedSchools.length === SCHOOLS.length ? 'All schools' :
             selectedSchools.join(', ')}
          </span>
          <span style={{ fontSize: 9, opacity: .45, flexShrink: 0,
            transform: schoolOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
            display: 'inline-block' }}>▼</span>
        </button>

        {schoolOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
            background: C.surf, border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,.7)',
            maxHeight: 240, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
              {[
                { label: 'All',  action: () => onChange([...selectedRoles, ...SCHOOLS.map(s => s.code)]) },
                { label: 'None', action: () => onChange(selectedRoles) },
              ].map(({ label, action }) => (
                <button key={label} type="button" className="act-btn" onClick={action}
                  style={{ flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600,
                    color: C.muted, background: 'none', border: 'none', cursor: 'pointer',
                    borderRight: label === 'All' ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', padding: '4px 0' }}>
              {SCHOOLS.map(s => {
                const on = selectedSchools.includes(s.code);
                return (
                  <label key={s.code} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', cursor: 'pointer',
                    background: on ? 'rgba(251,191,36,.07)' : 'transparent',
                  }}>
                    <input type="checkbox" checked={on} onChange={() => toggleSchool(s.code)}
                      style={{ accentColor: C.yellow, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: on ? C.yellow : C.subtle,
                      fontFamily: "'JetBrains Mono',monospace", minWidth: 52 }}>{s.code}</span>
                    <span style={{ fontSize: 11, color: C.muted, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AudienceTokens (read-only display) ────────────────────────────────────────

function AudienceTokens({ audience }) {
  const tokens = toArr(audience);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {tokens.map(t => {
        const color = tokenColor(t);
        return (
          <span key={t} style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            fontFamily: "'JetBrains Mono',monospace",
            background: `${color}14`, color,
            border: `1px solid ${color}25`,
          }}>{tokenLabel(t)}</span>
        );
      })}
    </div>
  );
}

// ── NoticeRow ──────────────────────────────────────────────────────────────────

function NoticeRow({ n, onEdit, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
      background: 'rgba(255,255,255,.025)',
      border: '1px solid rgba(255,255,255,.06)',
      transition: 'border-color .15s',
    }}>
      {/* Left accent bar */}
      <div style={{
        width: 3, flexShrink: 0,
        background: n.is_active
          ? 'linear-gradient(180deg,#34d399,#059669)'
          : 'rgba(255,255,255,.1)',
      }} />

      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
        {/* Top row: title + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, lineHeight: 1.35,
              marginBottom: 5 }}>
              {n.title}
            </div>
            <AudienceTokens audience={n.audience} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Badge color={n.is_active ? 'green' : 'red'} dot>
              {n.is_active ? 'Live' : 'Off'}
            </Badge>
          </div>
        </div>

        {/* Body */}
        {n.body && (
          <div
            onClick={() => setExpanded(e => !e)}
            style={{
              fontSize: 12, color: C.muted, lineHeight: 1.65, marginTop: 8,
              cursor: 'pointer',
              ...(expanded ? {} : {
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }),
            }}>
            {n.body}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: C.muted,
              fontFamily: "'JetBrains Mono',monospace" }}>{fmtDate(n.created_at)}</span>
            {n.created_by && (
              <span style={{ fontSize: 11, color: C.muted }}>by {n.created_by}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="act-btn" onClick={onEdit}
              style={{ width: 30, height: 28, borderRadius: 7, cursor: 'pointer',
                background: `${C.accent}10`, border: `1px solid ${C.accent}25`,
                color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.edit size={12} />
            </button>
            <button className="act-btn" onClick={onDelete} disabled={deleting}
              style={{ width: 30, height: 28, borderRadius: 7, cursor: 'pointer',
                color: C.red, background: 'rgba(248,113,113,.07)',
                border: '1px solid rgba(248,113,113,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: deleting ? .5 : 1 }}>
              {deleting ? <span style={{ fontSize: 11 }}>…</span> : <I.trash size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const EMPTY = { title: '', body: '', audiences: ['all'], is_active: true };

export default function AnnouncementsPage() {
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [status,      setStatus]      = useState(null);
  const [tick,        setTick]        = useState(0);
  const [deleting,    setDeleting]    = useState(null);
  const [editing,     setEditing]     = useState(null);
  const [editSaving,  setEditSaving]  = useState(false);
  const [editErr,     setEditErr]     = useState(null);
  const [filter,      setFilter]      = useState('all');

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const { data: raw, loading, error } = useFetch(() => api.announcements.list(), [tick]);
  const notices = Array.isArray(raw) ? raw : (raw?.announcements ?? raw?.items ?? []);

  const liveCount = notices.filter(n => n.is_active).length;
  const offCount  = notices.filter(n => !n.is_active).length;

  const visible = notices.filter(n => {
    if (filter === 'live' && !n.is_active) return false;
    if (filter === 'off'  &&  n.is_active) return false;
    return true;
  });

  const handlePublish = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setStatus({ ok: false, msg: 'Title and message are required.' });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      await api.announcements.create({
        title: form.title, body: form.body,
        audience: toStr(form.audiences), is_active: form.is_active,
      });
      setStatus({ ok: true, msg: 'Published successfully.' });
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
    try { await api.announcements.remove(id); refresh(); }
    finally { setDeleting(null); }
  };

  const saveEdit = async () => {
    setEditSaving(true); setEditErr(null);
    try {
      const { id, audiences, ...rest } = editing;
      await api.announcements.update(id, { ...rest, audience: toStr(audiences) });
      setEditing(null); refresh();
    } catch (e) {
      setEditErr(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      {/* ── Edit drawer ─────────────────────────────────────────────────── */}
      {editing && (
        <>
          <div onClick={() => setEditing(null)} style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
          }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh', width: 400, zIndex: 901,
            display: 'flex', flexDirection: 'column',
            background: C.surf, borderLeft: '1px solid rgba(255,255,255,.08)',
            boxShadow: '-24px 0 60px rgba(0,0,0,.6)',
            animation: 'drawerIn .2s ease',
          }}>
            {/* Drawer header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Edit Announcement</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2,
                  fontFamily: "'JetBrains Mono',monospace" }}>#{editing.id}</div>
              </div>
              <button className="act-btn" onClick={() => setEditing(null)} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)',
                background: 'transparent', cursor: 'pointer', color: C.muted, fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            {/* Drawer fields */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Title</label>
                <input className="ifield" value={editing.title} style={inp}
                  onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div>
                <label style={lbl}>Target Audience</label>
                <div style={{ padding: '14px', borderRadius: 10,
                  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                  <AudiencePicker
                    selected={editing.audiences}
                    onChange={audiences => setEditing(p => ({ ...p, audiences }))}
                  />
                </div>
              </div>

              <div>
                <label style={lbl}>Message</label>
                <textarea className="ifield" value={editing.body} rows={5}
                  onChange={e => setEditing(p => ({ ...p, body: e.target.value }))}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <div style={{
                padding: '12px 14px', borderRadius: 10, display: 'flex',
                alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
              }}>
                <ToggleSwitch
                  checked={editing.is_active}
                  onChange={() => setEditing(p => ({ ...p, is_active: !p.is_active }))}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600,
                    color: editing.is_active ? C.green : C.muted }}>
                    {editing.is_active ? 'Live — visible to recipients' : 'Hidden — draft only'}
                  </div>
                </div>
              </div>

              {editErr && (
                <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 12,
                  color: C.red, background: 'rgba(248,113,113,.08)',
                  border: '1px solid rgba(248,113,113,.2)' }}>
                  {editErr}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,.07)',
              display: 'flex', gap: 10, flexShrink: 0 }}>
              <button className="act-btn" style={{ ...pBtn, flex: 1 }}
                onClick={saveEdit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="act-btn" onClick={() => setEditing(null)} style={{
                padding: '9px 16px', background: 'transparent', color: C.muted,
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <PageHead
        title="Announcements"
        sub="Broadcast notices to faculty by role or school"
      />

      {/* ── Stats + search bar (always visible, never scrolls) ─────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14,
        alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Stats chips */}
        {[
          { label: 'Total',  value: notices.length, color: C.accent },
          { label: 'Live',   value: liveCount,       color: C.green  },
          { label: 'Hidden', value: offCount,         color: C.muted  },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 12px', borderRadius: 8,
            background: `${s.color}0d`, border: `1px solid ${s.color}22`,
            flexShrink: 0,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: 11, color: C.muted }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: s.color,
              fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</span>
          </div>
        ))}

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,.1)', flexShrink: 0 }} />

        {/* Filter tabs */}
        {[
          { key: 'all',  label: 'All',  count: notices.length },
          { key: 'live', label: 'Live', count: liveCount       },
          { key: 'off',  label: 'Off',  count: offCount        },
        ].map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} className="act-btn" onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                border: `1px solid ${active ? C.accent : 'rgba(255,255,255,.08)'}`,
                background: active ? `${C.accent}15` : 'transparent',
                color: active ? C.accent : C.subtle,
              }}>
              {f.label}
              <span style={{ opacity: .5, fontSize: 11, marginLeft: 4 }}>({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px minmax(0,1fr)', gap: 20, height: 'calc(100vh - 218px)' }}>

        {/* ══ Compose panel ════════════════════════════════════════════ */}
        <div style={{
          borderRadius: 14,
          background: 'rgba(255,255,255,.028)',
          border: '1px solid rgba(255,255,255,.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,.28)',
          overflow: 'visible',
        }}>
          {/* Compact header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <I.send size={13} stroke={C.accent} />
            <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>New Announcement</span>
          </div>

          {/* Compact form */}
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Title */}
            <div>
              <label style={lbl}>Title</label>
              <input className="ifield" value={form.title} style={inp}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Submission deadline extended to June 30" />
            </div>

            {/* Audience picker */}
            <div>
              <label style={lbl}>Audience</label>
              <div style={{ padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                <AudiencePicker
                  selected={form.audiences}
                  onChange={audiences => setForm(p => ({ ...p, audiences }))}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 4 }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Message</label>
                <span style={{ fontSize: 10,
                  color: form.body.length > 900 ? C.red : C.muted }}>
                  {form.body.length}/1000
                </span>
              </div>
              <textarea className="ifield" value={form.body} rows={3} maxLength={1000}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Write your announcement here…"
                style={{ ...inp, resize: 'none', lineHeight: 1.6 }} />
            </div>

            {/* Status message */}
            {status && (
              <div style={{ padding: '8px 11px', borderRadius: 7, fontSize: 12,
                color: status.ok ? C.green : C.red,
                background: status.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)',
                border: `1px solid ${status.ok ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}` }}>
                {status.msg}
              </div>
            )}

            {/* Toggle + actions combined row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1,
                padding: '7px 11px', borderRadius: 8,
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                <ToggleSwitch
                  checked={form.is_active}
                  onChange={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                />
                <span style={{ fontSize: 11, fontWeight: 600,
                  color: form.is_active ? C.green : C.muted }}>
                  {form.is_active ? 'Live' : 'Draft'}
                </span>
              </div>
              <button className="act-btn"
                style={{ ...pBtn, display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', flexShrink: 0 }}
                onClick={handlePublish} disabled={saving}>
                <I.send size={12} />{saving ? '…' : 'Publish'}
              </button>
              <button className="act-btn"
                onClick={() => { setForm(EMPTY); setStatus(null); }}
                style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  color: C.muted, background: 'transparent', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ══ Feed panel ═══════════════════════════════════════════════ */}
        <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', paddingRight: 2 }}>
            {loading && <Loading />}
            {error   && <ApiError message={error} />}

            {/* Empty state */}
            {!loading && !error && visible.length === 0 && (
              <div style={{
                borderRadius: 14, padding: '60px 24px', textAlign: 'center',
                background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
                  background: `${C.accent}10`, border: `1px solid ${C.accent}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <I.send size={24} stroke={C.accent} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  {filter !== 'all' ? 'No matches found' : 'No announcements yet'}
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, maxWidth: 260, margin: '0 auto' }}>
                  {filter !== 'all'
                    ? 'Try adjusting the filter above'
                    : 'Use the composer on the left to broadcast your first notice'}
                </div>
              </div>
            )}

            {/* Notice list */}
            {!loading && !error && visible.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
                {visible.map(n => (
                  <NoticeRow
                    key={n.id}
                    n={n}
                    deleting={deleting === n.id}
                    onDelete={() => handleDelete(n.id)}
                    onEdit={() => setEditing({
                      id: n.id, title: n.title, body: n.body ?? '',
                      audiences: toArr(n.audience), is_active: n.is_active ?? true,
                    })}
                  />
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
