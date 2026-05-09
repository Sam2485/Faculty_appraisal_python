import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

const SCHOOLS = ['SoCSEA','SoBB','SoCE','SoEMR','SoC','CISR','SoMCS','CioD','SoAA'];
const ROLES   = ['faculty','hod','director','dean','registrar','vc','non_teaching_staff'];

const EMPTY = {
  full_name: '', email: '', password: '', department: '',
  school: '', appraisal_role: 'faculty', designation: '', phone: '',
  qualification: '', teaching_experience: '',
};

export default function AddFacultyPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(null); // { ok, msg }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.password) {
      setStatus({ ok: false, msg: 'Full name, email, and password are required.' });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      await api.users.create(form);
      setStatus({ ok: true, msg: `Account created for ${form.email}. Credentials ready.` });
      setForm(EMPTY);
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { l: 'Full Name *',    k: 'full_name',    type: 'text',     p: 'Dr. First Last'           },
    { l: 'Email Address *',k: 'email',         type: 'email',    p: 'faculty@dypiu.edu'        },
    { l: 'Password *',     k: 'password',      type: 'password', p: 'Temporary password'       },
    { l: 'Department',     k: 'department',    type: 'text',     p: 'e.g. Computer Science'    },
    { l: 'Designation',    k: 'designation',   type: 'text',     p: 'e.g. Assistant Professor' },
    { l: 'Phone',          k: 'phone',         type: 'text',     p: '+91 XXXXX XXXXX'          },
    { l: 'Qualification',  k: 'qualification', type: 'text',     p: 'e.g. Ph.D'                },
    { l: 'Experience',     k: 'teaching_experience', type: 'text', p: 'e.g. 8 years'          },
  ];

  return (
    <div className="page-enter">
      <PageHead title="Add Faculty" sub="Create a new faculty account and send login credentials" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, alignItems: 'start' }}>
        <Card title="Faculty Information" delay={0}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {fields.map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.l}</label>
                <input className="ifield" type={f.type} value={form[f.k]}
                  onChange={set(f.k)} placeholder={f.p} style={inp} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={lbl}>Role</label>
              <select className="ifield" value={form.appraisal_role} onChange={set('appraisal_role')} style={inp}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>School</label>
              <select className="ifield" value={form.school} onChange={set('school')} style={inp}>
                <option value="">— Select —</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
            <button className="act-btn" style={pBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Creating…' : 'Save Faculty'}
            </button>
            <button className="act-btn" style={oBtn} onClick={() => navigate('/faculty')}>Cancel</button>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Checklist" delay={60}>
            {['Verify email address','Assign correct school','Set accurate designation','Add temporary password'].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: C.muted }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: C.subtle }}>{c}</span>
              </div>
            ))}
          </Card>

          <Card title="On Save" delay={100}>
            {['Account created immediately','Email verification skipped (admin)','Faculty can log in right away'].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 12, color: C.subtle }}>
                <span style={{ color: C.green }}>✓</span> {a}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
