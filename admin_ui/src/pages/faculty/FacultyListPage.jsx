import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeUsers } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, tdS, pBtn, smBtn } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import TH from '../../components/TH';

const SCHOOLS = ['SoCSEA','SoBB','SoCE','SoEMR','SoC','CISR','SoMCS','CioD','SoAA'];

export default function FacultyListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [tick, setTick] = useState(0);
  const [removing, setRemoving] = useState(null);
  const [removeErr, setRemoveErr] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  const { data: raw, loading, error } = useFetch(() => api.users.list(), [tick]);
  const users = normalizeUsers(raw);

  const rows = users.filter(f =>
    (filter === 'All' || f.status === filter) &&
    (f.name.toLowerCase().includes(search.toLowerCase()) ||
     f.dept.toLowerCase().includes(search.toLowerCase()))
  );

  const startEdit = (f) => {
    setEditing(f);
    setSaveErr(null);
    setEditForm({
      full_name:   f.name === f.email ? '' : f.name,
      department:  f.dept  === '—' ? '' : f.dept,
      school:      f.school === '—' ? '' : f.school,
      designation: f.designation === '—' ? '' : f.designation,
      phone:       f.phone === '—' ? '' : f.phone,
    });
  };

  const saveEdit = async () => {
    setSaving(true); setSaveErr(null);
    try {
      await api.users.update(editing.email, editForm);
      setEditing(null);
      refresh();
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (f) => {
    if (!window.confirm(`Remove ${f.name} (${f.email})?\n\nThis cannot be undone.`)) return;
    setRemoving(f.email); setRemoveErr(null);
    try {
      await api.users.remove(f.email);
      refresh();
    } catch (e) {
      setRemoveErr(e.message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="page-enter">
      <PageHead title="Faculty List" sub={loading ? 'Loading…' : `${rows.length} records shown`} />

      {removeErr && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
          {removeErr}
        </div>
      )}
      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#1a1d2e', borderRadius: 14, padding: 28, width: '100%',
            maxWidth: 480, border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Edit Faculty</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>{editing.email}</div>

            {[
              { l: 'Full Name',   k: 'full_name'   },
              { l: 'Department',  k: 'department'  },
              { l: 'Designation', k: 'designation' },
              { l: 'Phone',       k: 'phone'       },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label style={lbl}>{f.l}</label>
                <input className="ifield" value={editForm[f.k] ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, [f.k]: e.target.value }))} style={inp} />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>School</label>
              <select className="ifield" value={editForm.school ?? ''}
                onChange={e => setEditForm(p => ({ ...p, school: e.target.value }))} style={inp}>
                <option value="">— Select —</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {saveErr && (
              <div style={{ marginBottom: 14, fontSize: 12, color: C.red }}>{saveErr}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="act-btn" style={pBtn} onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="act-btn"
                style={{ padding: '9px 18px', background: 'transparent', color: C.muted,
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600 }}
                onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <Card>
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: .35 }}>
                <I.search size={13} />
              </div>
              <input className="ifield" placeholder="Search faculty or department…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: 34 }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Active', 'Unverified'].map(f => (
                <button key={f} className="act-btn" onClick={() => setFilter(f)}
                  style={{ padding: '7px 14px', borderRadius: 7,
                    border: `1px solid ${filter === f ? C.accent : 'rgba(255,255,255,.08)'}`,
                    background: filter === f ? `${C.accent}18` : 'transparent',
                    color: filter === f ? C.accent : C.subtle,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {f}
                </button>
              ))}
            </div>
            <button className="act-btn" style={pBtn} onClick={() => navigate('/faculty/add')}>
              <I.addUser size={13} /> Add Faculty
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Faculty', 'Department', 'School', 'Since', 'Status', 'Actions'].map(h => <TH key={h}>{h}</TH>)}</tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdS, textAlign: 'center', padding: '20px 0', color: C.muted }}>No records found</td></tr>
                ) : rows.map((f, i) => (
                  <tr key={f.id} className="tr-row" style={{ animationDelay: `${i * 40}ms` }}>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Av init={f.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                            color={f.status === 'Active' ? C.accent : C.muted} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{f.name}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{f.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdS}>{f.dept}</td>
                    <td style={tdS}>{f.school}</td>
                    <td style={tdS}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{f.yr}</span>
                    </td>
                    <td style={tdS}>
                      <Badge color={f.status === 'Active' ? 'green' : 'red'} dot>{f.status}</Badge>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="act-btn" style={smBtn} onClick={() => startEdit(f)}>Edit</button>
                        <button className="act-btn"
                          onClick={() => handleRemove(f)}
                          disabled={removing === f.email}
                          style={{ ...smBtn, color: C.red,
                            borderColor: 'rgba(248,113,113,.2)',
                            background: 'rgba(248,113,113,.06)',
                            opacity: removing === f.email ? .5 : 1 }}>
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
