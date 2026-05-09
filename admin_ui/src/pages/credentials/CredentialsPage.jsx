import { useState } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp, lbl, pBtn } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

const SCHOOLS = ['SoCSEA', 'SoBB', 'SoCE', 'SoEMR', 'SoC', 'CISR', 'SoMCS', 'CioD', 'SoAA'];
const ROLES   = ['faculty', 'hod', 'director', 'dean', 'registrar', 'vc', 'non_teaching_staff'];

const EMPTY = { full_name: '', email: '', password: '', appraisal_role: 'faculty', school: SCHOOLS[0] };

export default function CredentialsPage() {
  const [form, setForm]       = useState(EMPTY);
  const [status, setStatus]   = useState(null);
  const [creating, setCreating] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.email || !form.full_name || !form.password) {
      setStatus({ ok: false, msg: 'Name, email, and password are required.' });
      return;
    }
    setCreating(true); setStatus(null);
    try {
      await api.users.create(form);
      setStatus({ ok: true, msg: `Credentials created for ${form.email}` });
      setForm(EMPTY);
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHead title="Credentials" sub="Generate access credentials for faculty and staff" />

      <div style={{ maxWidth: 440 }}>
        <Card title="New Credentials" delay={0}>
          {[
            { l: 'Full Name', k: 'full_name', type: 'text',     p: 'Dr. Jane Doe'            },
            { l: 'Email',     k: 'email',     type: 'email',    p: 'faculty@university.edu'  },
            { l: 'Password',  k: 'password',  type: 'password', p: 'Temporary password'      },
          ].map(f => (
            <div key={f.k} style={{ marginBottom: 13 }}>
              <label style={lbl}>{f.l}</label>
              <input className="ifield" type={f.type} placeholder={f.p} value={form[f.k]} onChange={set(f.k)} style={inp} />
            </div>
          ))}

          <div style={{ marginBottom: 13 }}>
            <label style={lbl}>Role</label>
            <select className="ifield" value={form.appraisal_role} onChange={set('appraisal_role')} style={inp}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>School</label>
            <select className="ifield" value={form.school} onChange={set('school')} style={inp}>
              {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {status && (
            <div style={{ marginBottom: 14, fontSize: 12, padding: '8px 12px', borderRadius: 6, color: status.ok ? C.green : C.red, background: status.ok ? 'rgba(52,211,153,.08)' : 'rgba(248,113,113,.08)', border: `1px solid ${status.ok ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)'}` }}>
              {status.msg}
            </div>
          )}

          <button className="act-btn" style={{ ...pBtn, width: '100%', justifyContent: 'center' }}
            onClick={handleCreate} disabled={creating}>
            <I.layers size={13} /> {creating ? 'Creating…' : 'Generate & Send'}
          </button>
        </Card>
      </div>
    </div>
  );
}
