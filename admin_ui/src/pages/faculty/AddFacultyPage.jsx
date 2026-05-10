import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

const SCHOOLS = [
  { code: 'SoCSEA', label: 'School of Computer Science Engineering & Applications (SoCSEA)' },
  { code: 'SoC',    label: 'School of Commerce & Management (SoC)'                          },
  { code: 'SoBB',   label: 'School of Bio-Engineering & Bio-Sciences (SoBB)'                },
  { code: 'SoMCS',  label: 'School of Media & Communication Studies (SoMCS)'                },
  { code: 'SoD',    label: 'School of Design (SoD)'                                         },
  { code: 'SoAA',   label: 'School of Applied Arts (SoAA)'                                  },
  { code: 'SoCE',   label: 'School of Continual Education (SoCE)'                           },
  { code: 'SoEMR',  label: 'School of Engineering, Management & Research (SoEMR)'           },
];

const SOEMR_DEPTS = [
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Semiconductor Engineering',
];

const ROLE_LABELS = {
  faculty: 'Faculty',
  hod: 'Head of Department (HOD)',
  director: 'Director',
  dean: 'Dean',
};

const getRoles = (school) =>
  school === 'SoEMR'
    ? ['faculty', 'hod', 'director', 'dean']
    : ['faculty', 'director', 'dean'];

const EMPTY = {
  full_name: '', email: '', password: '',
  school: '', department: '', appraisal_role: 'faculty',
  designation: '', phone: '', qualification: '', teaching_experience: '',
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
    color: C.muted, marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,.05)',
  }}>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label style={lbl}>{label}</label>
    {children}
  </div>
);

export default function AddFacultyPage() {
  const navigate  = useNavigate();
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSchoolChange = (e) => {
    const school = e.target.value;
    const validRoles = getRoles(school);
    setForm(p => ({
      ...p,
      school,
      department:     '',
      appraisal_role: validRoles.includes(p.appraisal_role) ? p.appraisal_role : 'faculty',
    }));
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.password) {
      setStatus({ ok: false, msg: 'Full name, email, and password are required.' });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      await api.users.create(form);
      setStatus({ ok: true, msg: `Account created for ${form.email}.` });
      setForm(EMPTY);
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };

  return (
    <div className="page-enter">
      <PageHead title="Add Faculty" sub="Create a new faculty account" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14, alignItems: 'start' }}>
        <Card title="Faculty Information" delay={0}>

          {/* ── Account ─────────────────────────────────────────────── */}
          <SectionLabel>Account</SectionLabel>
          <div style={{ marginBottom: 14 }}>
            <Field label="Full Name *">
              <input className="ifield" type="text" value={form.full_name}
                onChange={set('full_name')} placeholder="Dr. First Last" style={inp} />
            </Field>
          </div>
          <div style={{ ...grid2, marginBottom: 22 }}>
            <Field label="Email Address *">
              <input className="ifield" type="email" value={form.email}
                onChange={set('email')} placeholder="faculty@dypiu.edu" style={inp} />
            </Field>
            <Field label="Password *">
              <input className="ifield" type="password" value={form.password}
                onChange={set('password')} placeholder="Temporary password" style={inp} />
            </Field>
          </div>

          {/* ── School Assignment ───────────────────────────────────── */}
          <SectionLabel>School Assignment</SectionLabel>
          <div style={{ marginBottom: 14 }}>
            <Field label="School">
              <select className="ifield" value={form.school} onChange={handleSchoolChange} style={inp}>
                <option value="">— Select School —</option>
                {SCHOOLS.map(s => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ ...grid2, marginBottom: 22 }}>
            <Field label="Department">
              {form.school === 'SoEMR' ? (
                <select className="ifield" value={form.department}
                  onChange={set('department')} style={inp}>
                  <option value="">— Select Department —</option>
                  {SOEMR_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <input className="ifield" type="text" value={form.department}
                  onChange={set('department')} placeholder="e.g. Computer Science" style={inp} />
              )}
            </Field>
            <Field label="Role">
              <select className="ifield" value={form.appraisal_role}
                onChange={set('appraisal_role')} style={inp}>
                {getRoles(form.school).map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              {form.school && form.school !== 'SoEMR' && (
                <div style={{ marginTop: 4, fontSize: 10, color: C.muted }}>
                  HOD available for SoEMR only
                </div>
              )}
            </Field>
          </div>

          {/* ── Professional Details ────────────────────────────────── */}
          <SectionLabel>Professional Details</SectionLabel>
          <div style={{ ...grid2, marginBottom: 14 }}>
            <Field label="Designation">
              <input className="ifield" type="text" value={form.designation}
                onChange={set('designation')} placeholder="e.g. Assistant Professor" style={inp} />
            </Field>
            <Field label="Phone">
              <input className="ifield" type="text" value={form.phone}
                onChange={set('phone')} placeholder="+91 XXXXX XXXXX" style={inp} />
            </Field>
          </div>
          <div style={{ ...grid2, marginBottom: 22 }}>
            <Field label="Qualification">
              <input className="ifield" type="text" value={form.qualification}
                onChange={set('qualification')} placeholder="e.g. Ph.D" style={inp} />
            </Field>
            <Field label="Teaching Experience">
              <input className="ifield" type="text" value={form.teaching_experience}
                onChange={set('teaching_experience')} placeholder="e.g. 8 years" style={inp} />
            </Field>
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
            <button className="act-btn" style={oBtn} onClick={() => navigate('/faculty')}>
              Cancel
            </button>
          </div>
        </Card>

        {/* ── Side panel ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Checklist" delay={60}>
            {[
              'Verify email address',
              'Assign correct school',
              'Set accurate designation',
              'Add temporary password',
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center',
                padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,.13)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.muted }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, color: C.subtle }}>{c}</span>
              </div>
            ))}
          </Card>

          <Card title="On Save" delay={100}>
            {[
              'Account created immediately',
              'Email verification skipped',
              'Faculty can log in right away',
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center',
                padding: '6px 0', fontSize: 12, color: C.subtle }}>
                <span style={{ color: C.green }}>✓</span> {a}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
