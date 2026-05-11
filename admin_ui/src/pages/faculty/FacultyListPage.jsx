import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeUsers } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, tdS, pBtn, smBtn } from '../../constants/styleTokens';
import { SCHOOLS } from '../../constants/schools';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import PageHead from '../../components/PageHead';
import TH from '../../components/TH';

export default function FacultyListPage() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('All');
  const [school, setSchool]   = useState('All');
  const [tick, setTick]       = useState(0);
  const [removing, setRemoving]   = useState(null);
  const [removeErr, setRemoveErr] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [editing, setEditing]     = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  const { data: raw, loading, error } = useFetch(() => api.users.list(), [tick]);
  const users = normalizeUsers(raw);

  const rows = users.filter(f =>
    (school === 'All' || f.school === school) &&
    (filter === 'All' || f.status === filter) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (f) => {
    setEditing(f); setSaveErr(null);
    setEditForm({
      full_name:   f.name === f.email ? '' : f.name,
      department:  f.dept        === '—' ? '' : f.dept,
      school:      f.school      === '—' ? '' : f.school,
      designation: f.designation === '—' ? '' : f.designation,
      phone:       f.phone       === '—' ? '' : f.phone,
    });
  };

  const saveEdit = async () => {
    setSaving(true); setSaveErr(null);
    try {
      await api.users.update(editing.email, editForm);
      setEditing(null); refresh();
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (f, value) => {
    setVerifying(f.email);
    try {
      await api.users.update(f.email, { is_verified: value });
      refresh();
    } catch (e) {
      setRemoveErr(e.message);
    } finally {
      setVerifying(null);
    }
  };

  const handleRemove = async (f) => {
    if (!window.confirm(`Remove ${f.name} (${f.email})?\n\nThis will permanently delete the faculty account AND all their submitted appraisal forms.\n\nThis cannot be undone.`)) return;
    setRemoving(f.email); setRemoveErr(null);
    try {
      await api.users.remove(f.email); refresh();
    } catch (e) {
      setRemoveErr(e.message);
    } finally {
      setRemoving(null);
    }
  };

  const activeCount      = users.filter(f => f.status === 'Active').length;
  const unverifiedCount  = users.filter(f => f.status !== 'Active').length;
  const selectedSchool   = SCHOOLS.find(s => s.code === school);

  return (
    <div className="page-enter">
      <PageHead
        title="Faculty List"
        sub={selectedSchool ? selectedSchool.full : 'All Schools'}
      />

      {removeErr && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
          {removeErr}
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────────────── */}
      {editing && (
        <Modal maxWidth={480} onClose={() => setEditing(null)}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Edit Faculty</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{editing.email}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { l: 'Full Name',   k: 'full_name'   },
                { l: 'Designation', k: 'designation' },
                { l: 'Department',  k: 'department'  },
                { l: 'Phone',       k: 'phone'       },
              ].map(f => (
                <div key={f.k}>
                  <label style={lbl}>{f.l}</label>
                  <input className="ifield" value={editForm[f.k] ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, [f.k]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>School</label>
              <select className="ifield" value={editForm.school ?? ''}
                onChange={e => setEditForm(p => ({ ...p, school: e.target.value }))} style={inp}>
                <option value="">— Select —</option>
                {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.full} ({s.code})</option>)}
              </select>
            </div>

            {saveErr && <div style={{ marginBottom: 14, fontSize: 12, color: C.red }}>{saveErr}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="act-btn" style={pBtn} onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="act-btn"
                style={{ padding: '9px 18px', background: 'transparent', color: C.muted,
                  border: '1px solid var(--c-btn-border)', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600 }}
                onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
        </Modal>
      )}

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <Card>
          {/* ── Row 1: Search + Add ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: .35 }}>
                <I.search size={13} />
              </div>
              <input className="ifield" placeholder="Search by name…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 34 }} />
            </div>
            <button className="act-btn" style={pBtn} onClick={() => navigate('/faculty/add')}>
              <I.addUser size={13} /> Add Faculty
            </button>
          </div>

          {/* ── Row 2: School + Status filters ───────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={school} onChange={e => setSchool(e.target.value)}
              style={{ ...inp, width: 'auto', minWidth: 160, cursor: 'pointer', flex: '0 0 auto' }}>
              <option value="All">All Schools</option>
              {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.full} ({s.code})</option>)}
            </select>

            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'All',        label: `All (${users.length})`            },
                { key: 'Active',     label: `Active (${activeCount})`           },
                { key: 'Unverified', label: `Unverified (${unverifiedCount})`   },
              ].map(f => (
                <button key={f.key} className="act-btn" onClick={() => setFilter(f.key)}
                  style={{ padding: '6px 12px', borderRadius: 7, whiteSpace: 'nowrap',
                    border: `1px solid ${filter === f.key ? C.accent : 'rgba(255,255,255,.08)'}`,
                    background: filter === f.key ? `${C.accent}18` : 'transparent',
                    color: filter === f.key ? C.accent : C.subtle,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {f.label}
                </button>
              ))}
            </div>

            <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>
              {rows.length} {rows.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {/* ── Table ─────────────────────────────────────────────── */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Faculty', 'School / Dept', 'Designation', 'Since', 'Status', 'Actions'].map(h => <TH key={h}>{h}</TH>)}</tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdS, textAlign: 'center', padding: '28px 0', color: C.muted }}>
                      {search || school !== 'All' || filter !== 'All' ? 'No records match the filter' : 'No faculty added yet'}
                    </td>
                  </tr>
                ) : rows.map((f, i) => (
                  <tr key={f.id} className="tr-row" style={{ animationDelay: `${i * 30}ms` }}>

                    {/* Name + email */}
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Av init={f.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                            color={f.status === 'Active' ? C.accent : C.muted} size={32} />
                        <div>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{f.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* School code + dept */}
                    <td style={tdS}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.accent,
                        fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>
                        {f.school !== '—' ? f.school : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {f.dept !== '—' ? f.dept : '—'}
                      </div>
                    </td>

                    {/* Designation */}
                    <td style={{ ...tdS, fontSize: 12, color: C.subtle }}>
                      {f.designation !== '—' ? f.designation : <span style={{ color: C.muted }}>—</span>}
                    </td>

                    {/* Year joined */}
                    <td style={{ ...tdS, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.muted }}>
                      {f.yr}
                    </td>

                    {/* Status */}
                    <td style={tdS}>
                      <Badge color={f.status === 'Active' ? 'green' : 'red'} dot>{f.status}</Badge>
                    </td>

                    {/* Actions */}
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="act-btn" style={smBtn} onClick={() => startEdit(f)}>Edit</button>
                        {f.status === 'Active' && (
                          <button className="act-btn"
                            onClick={() => handleVerify(f, false)}
                            disabled={verifying === f.email}
                            style={{ ...smBtn, color: C.yellow, borderColor: 'rgba(251,191,36,.2)',
                              background: 'rgba(251,191,36,.06)', opacity: verifying === f.email ? .5 : 1 }}>
                            {verifying === f.email ? '…' : 'Deactivate'}
                          </button>
                        )}
                        <button className="act-btn"
                          onClick={() => handleRemove(f)}
                          disabled={removing === f.email}
                          style={{ ...smBtn, color: C.red, borderColor: 'rgba(248,113,113,.2)',
                            background: 'rgba(248,113,113,.06)', opacity: removing === f.email ? .5 : 1 }}>
                          {removing === f.email ? '…' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
