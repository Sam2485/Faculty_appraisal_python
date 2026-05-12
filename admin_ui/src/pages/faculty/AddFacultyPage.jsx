import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import { ENGG_SCHOOLS, NON_ENGG_SCHOOLS, SOEMR_DEPTS } from '../../constants/schools';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import PageHead from '../../components/PageHead';
import { I } from '../../components/icons';

const ENGG_ROLES = [
  { value: 'faculty',  label: 'Faculty',             color: C.accent,  icon: I.users,  flow: 'HOD/Director → Dean (Eng) → VC'          },
  { value: 'hod',      label: 'HOD',                 color: '#a78bfa', icon: I.school, flow: 'Director (SoEMR) → Dean (Eng) → VC', soEmrOnly: true },
  { value: 'director', label: 'Director',            color: C.yellow,  icon: I.star,   flow: 'Dean (Engineering) → VC'                  },
  { value: 'dean',     label: 'Dean of Engineering', color: C.green,   icon: I.shield, flow: 'VC only'                                  },
];
const NON_ENGG_ROLES = [
  { value: 'faculty',  label: 'Faculty',                 color: C.accent, icon: I.users,  flow: 'Director → Dean (Non-Eng) → VC' },
  { value: 'director', label: 'Director',                color: C.yellow, icon: I.star,   flow: 'Dean (Non-Engineering) → VC'    },
  { value: 'dean',     label: 'Dean of Non-Engineering', color: C.green,  icon: I.shield, flow: 'VC only'                        },
];
const CISR_ROLES = [
  { value: 'faculty',     label: 'Faculty',     color: C.accent,  icon: I.users,  flow: 'Center Head → VC' },
  { value: 'center_head', label: 'Center Head', color: '#a78bfa', icon: I.shield, flow: 'VC only'          },
];
const NT_ROLES = [
  { value: 'non_teaching_staff', label: 'Staff',             color: C.accent,  icon: I.users, flow: 'Reporting Officer → Registrar → VC' },
  { value: 'reporting_officer',  label: 'Reporting Officer', color: '#a78bfa', icon: I.doc,   flow: 'Registrar → VC'                     },
  { value: 'registrar',          label: 'Registrar',         color: C.yellow,  icon: I.star,  flow: 'VC only'                           },
];

const STEPS = [
  { label: 'Classification', sub: 'Staff type & academic track'   },
  { label: 'Role & School',  sub: 'Position, school & department' },
  { label: 'Account',        sub: 'Login credentials'             },
  { label: 'Profile',        sub: 'Professional details'          },
];

const EMPTY = {
  full_name: '', email: '', password: 'demo123',
  school: '', department: '', appraisal_role: '',
  designation: '', phone: '', qualification: '', teaching_experience: '',
  reports_to_registrar: false,
};

// ── Appraisal flow computation ─────────────────────────────────────────────────

function computeFlow(staffType, track, role, school, dept, reportsDirectly = false) {
  if (!staffType || !role) return [];
  const n = (label, sub, sees, hides) => ({ label, sub, sees, hides });

  if (staffType === 'non_teaching') {
    if (role === 'non_teaching_staff') {
      if (reportsDirectly) return [
        n('Staff', 'Fills and submits form', null, null),
        n('Registrar', 'Reviews & scores', 'Staff self-score', null),
        n('VC', 'Final review & scores', 'Staff + Registrar scores', null),
      ];
      return [
        n('Staff', 'Fills and submits form', null, null),
        n('Reporting Officer', 'Reviews & scores', 'Staff self-score only', null),
        n('Registrar', 'Reviews & scores', 'Staff self-score only', 'Reporting Officer score hidden'),
        n('VC', 'Final review & scores', 'All scores: Staff + RO + Registrar', null),
      ];
    }
    if (role === 'reporting_officer') return [
      n('Reporting Officer', 'Fills and submits form', null, null),
      n('Registrar', 'Reviews & scores', 'RO self-score', null),
      n('VC', 'Final review & scores', 'RO + Registrar scores', null),
    ];
    if (role === 'registrar') return [
      n('Registrar', 'Fills and submits form', null, null),
      n('VC', 'Reviews & scores', 'Registrar self-score', null),
    ];
    return [];
  }

  if (track === 'cisr') {
    if (role === 'faculty') return [
      n('Faculty (CISR)', 'Fills and submits form', null, null),
      n('Center Head', 'Reviews & scores', 'Faculty self-score', null),
      n('VC', 'Final review & scores', 'Faculty + Center Head scores', null),
    ];
    if (role === 'center_head') return [
      n('Center Head (CISR)', 'Fills and submits form', null, null),
      n('VC', 'Reviews & scores', 'Center Head self-score', null),
    ];
    return [];
  }

  const isEng = track === 'engineering';
  const dean  = isEng ? 'Dean (Engineering)' : 'Dean (Non-Engineering)';
  const sc    = school || '—';

  if (role === 'faculty') {
    if (school === 'SoEMR') {
      const hod = dept ? `HOD — ${dept}` : 'HOD (select dept below)';
      return [
        n('Faculty (SoEMR)', 'Fills and submits form', null, null),
        n(hod, 'Reviews & scores', 'Faculty self-score', null),
        n('Director (SoEMR)', 'Reviews & scores', 'Faculty self-score only', 'HOD score hidden'),
        n(dean, 'Reviews & scores', 'Faculty self-score only', 'HOD + Director scores hidden'),
        n('VC', 'Final review & scores', 'All 4 scores: Faculty + HOD + Director + Dean', null),
      ];
    }
    return [
      n(`Faculty (${sc})`, 'Fills and submits form', null, null),
      n(`Director (${sc})`, 'Reviews & scores', 'Faculty self-score', null),
      isEng
        ? n(dean, 'Reviews & scores', 'Faculty self-score only', 'Director score hidden')
        : n(dean, 'Reviews & scores', 'Faculty + Director scores', null),
      n('VC', 'Final review & scores', 'All scores: Faculty + Director + Dean', null),
    ];
  }
  if (role === 'hod') {
    const hod = dept ? `HOD — ${dept}` : 'HOD (select dept below)';
    return [
      n(hod, 'Fills and submits form', null, null),
      n('Director (SoEMR)', 'Reviews & scores', 'HOD self-score', null),
      n(dean, 'Reviews & scores', 'HOD self-score only', 'Director score hidden'),
      n('VC', 'Final review & scores', 'HOD + Director + Dean scores', null),
    ];
  }
  if (role === 'director') return [
    n(`Director (${sc})`, 'Fills and submits form', null, null),
    n(dean, 'Reviews & scores', 'Director self-score', null),
    n('VC', 'Final review & scores', 'Director + Dean scores', null),
  ];
  if (role === 'dean') return [
    n(dean, 'Fills and submits form', null, null),
    n('VC', 'Reviews & scores', 'Dean self-score', null),
  ];
  return [];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Stepper({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        const col    = done ? C.green : active ? C.accent : 'rgba(255,255,255,.2)';
        const isLast = i === STEPS.length - 1;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? 'none' : 1 }}>
            {/* Circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: `2px solid ${col}`,
                background: done ? C.green : active ? `${C.accent}1a` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: done ? '#fff' : col,
                transition: 'all .25s', flexShrink: 0,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: .5, textTransform: 'uppercase',
                color: col, whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {/* Connecting line — positioned at circle vertical center (14px from top) */}
            {!isLast && (
              <div style={{
                flex: 1, height: 1.5, marginTop: 13, marginLeft: 6, marginRight: 6,
                background: done ? C.green : 'rgba(255,255,255,.07)',
                transition: 'background .3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Large choice card (Teaching / Non-Teaching / tracks)
function ChoiceCard({ label, sub, icon: Icon, color, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="act-btn" style={{
      padding: '14px 16px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', width: '100%',
      border: `1.5px solid ${active ? color : 'rgba(255,255,255,.07)'}`,
      background: active ? `${color}12` : 'rgba(255,255,255,.02)',
      position: 'relative',
    }}>
      {Icon && (
        <div style={{ color: active ? color : C.muted, marginBottom: 8 }}>
          <Icon size={18} />
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 13, color: active ? color : C.text, marginBottom: sub ? 3 : 0 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.45 }}>{sub}</div>}
      {active && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: '50%', background: color }} />
      )}
    </button>
  );
}

// Compact track card (3 columns)
function TrackCard({ label, sub, icon: Icon, color, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="act-btn" style={{
      padding: '12px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', width: '100%',
      border: `1.5px solid ${active ? color : 'rgba(255,255,255,.07)'}`,
      background: active ? `${color}12` : 'rgba(255,255,255,.02)',
      position: 'relative',
    }}>
      {Icon && (
        <div style={{ color: active ? color : C.muted, marginBottom: 6 }}>
          <Icon size={15} />
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: 12, color: active ? color : C.text, marginBottom: sub ? 2 : 0 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{sub}</div>}
      {active && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: color }} />
      )}
    </button>
  );
}

// Journey flow panel
function FlowPreview({ nodes }) {
  if (!nodes.length) {
    return (
      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '12px 0', lineHeight: 1.7 }}>
        Select a role to see<br />the appraisal journey
      </div>
    );
  }
  const COLS = [C.accent, '#a78bfa', C.yellow, C.green, C.orange];
  return (
    <div>
      {nodes.map((node, i) => {
        const col    = COLS[i] ?? C.muted;
        const isLast = i === nodes.length - 1;
        return (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            {/* Timeline column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0, marginTop: 2 }} />
              {!isLast && (
                <div style={{ width: 1.5, flex: 1, background: 'rgba(255,255,255,.07)', marginTop: 4, minHeight: 16 }} />
              )}
            </div>
            {/* Content */}
            <div style={{ paddingBottom: isLast ? 0 : 14, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: col }}>{node.label}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{node.sub}</div>
              {node.sees && (
                <div style={{ marginTop: 3, fontSize: 9, fontWeight: 600, color: C.green }}>
                  ✓ {node.sees}
                </div>
              )}
              {node.hides && (
                <div style={{ marginTop: 1, fontSize: 9, fontWeight: 600, color: C.red }}>
                  ✕ {node.hides}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Section heading
function SL({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
      color: C.muted, marginBottom: 12, paddingBottom: 8,
      borderBottom: '1px solid rgba(255,255,255,.05)',
    }}>
      {children}
    </div>
  );
}

// Labelled field
function Field({ label, req, children }) {
  return (
    <div>
      <label style={lbl}>{label}{req && ' *'}</label>
      {children}
    </div>
  );
}

// Info banner
function InfoBox({ color, children }) {
  const rgb = color === 'green' ? '52,211,153' : color === 'purple' ? '167,139,250' : '251,191,36';
  return (
    <div style={{
      marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 11, lineHeight: 1.55,
      color: color === 'green' ? C.green : color === 'purple' ? '#a78bfa' : C.yellow,
      background: `rgba(${rgb},.06)`,
      border: `1px solid rgba(${rgb},.18)`,
    }}>
      {children}
    </div>
  );
}

// Reporting structure toggle (non-teaching staff only)
function ReportingToggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
      background: checked ? 'rgba(52,211,153,.07)' : 'rgba(255,255,255,.03)',
      border: `1.5px solid ${checked ? 'rgba(52,211,153,.3)' : 'rgba(255,255,255,.08)'}`,
      transition: 'all .2s',
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: checked ? C.green : C.text }}>
          Reports directly to Registrar
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
          {checked
            ? 'Skips Reporting Officer — form submitted directly to Registrar'
            : 'Standard flow: Staff → Reporting Officer → Registrar → VC'}
        </div>
      </div>
      <div style={{
        width: 40, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0, marginLeft: 16,
        background: checked ? C.green : 'rgba(255,255,255,.1)',
        border: `1.5px solid ${checked ? C.green : 'rgba(255,255,255,.12)'}`,
        transition: 'all .2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 19 : 2,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.35)',
        }} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AddFacultyPage() {
  const navigate = useNavigate();

  const [step,      setStep]      = useState(0);
  const [staffType, setStaffType] = useState('');   // 'teaching' | 'non_teaching'
  const [track,     setTrack]     = useState('');   // 'engineering' | 'non_engineering' | 'cisr'
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [receipt,   setReceipt]   = useState(null);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Derived flags
  const isTeaching    = staffType === 'teaching';
  const isNonTeaching = staffType === 'non_teaching';
  const isEngineering = track === 'engineering';
  const isNonEng      = track === 'non_engineering';
  const isCISR        = track === 'cisr';
  const role          = form.appraisal_role;
  const school        = form.school;
  const dept          = form.department;

  const availRoles = isCISR       ? CISR_ROLES
    : isNonTeaching               ? NT_ROLES
    : isEngineering               ? ENGG_ROLES
    : isNonEng                    ? NON_ENGG_ROLES
    : [];

  // Role grid: 3-col for exactly 3 items, 2-col for 2 or 4
  const roleGridCols = availRoles.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)';

  const groupSchools    = isEngineering ? ENGG_SCHOOLS : NON_ENGG_SCHOOLS;
  const showSchoolPicker = (isEngineering || isNonEng) && !!role && role !== 'dean' && role !== 'hod';
  const schoolLocked     = role === 'hod'; // auto-locked to SoEMR
  const showDeptFixed    = (role === 'faculty' || role === 'hod') && school === 'SoEMR';
  const showDeptText     = role === 'faculty' && !!school && school !== 'SoEMR' && (isEngineering || isNonEng);

  const flowNodes = computeFlow(staffType, track, role, school, dept, form.reports_to_registrar);

  // ── Print receipt ────────────────────────────────────────────────────────────

  const handlePrint = (r) => {
    const rows = [
      ['Full Name',    r.name],
      ['Email',        r.email],
      ['Role',         r.role],
      ['Staff Type',   r.staffType],
      r.school             && ['School',      r.school],
      r.department         && ['Department',  r.department],
      r.designation        && ['Designation', r.designation],
      r.phone              && ['Phone',       r.phone],
      r.qualification      && ['Qualification', r.qualification],
      r.teachingExperience && ['Experience',  r.teachingExperience],
    ].filter(Boolean);

    const w = window.open('', '_blank', 'width=640,height=860');
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Account Receipt — ${r.name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:48px 40px;color:#111;background:#fff}
        .hdr{display:flex;align-items:center;gap:14px;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
        .logo{width:44px;height:44px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
        h1{font-size:17px;font-weight:700}
        .sub{font-size:12px;color:#6b7280;margin-top:3px}
        .badge{display:inline-block;padding:3px 10px;border-radius:20px;background:#f0fdf4;color:#15803d;font-size:11px;font-weight:700;border:1px solid #bbf7d0}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        tr{border-bottom:1px solid #f3f4f6}
        td{padding:10px 4px;font-size:13px;vertical-align:top}
        td:first-child{color:#6b7280;width:150px;font-weight:500}
        td:last-child{font-weight:600;color:#111}
        .warn{padding:12px 14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;font-size:12px;color:#92400e;line-height:1.6}
        .footer{margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
        @media print{@page{margin:20mm}}
      </style>
    </head><body>
      <div class="hdr">
        <div class="logo">🎓</div>
        <div><h1>DYP Faculty Appraisal System</h1><div class="sub">New Account Receipt &middot; ${r.createdAt}</div></div>
        <div style="margin-left:auto"><span class="badge">✓ Active</span></div>
      </div>
      <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
      <div class="warn">⚠&nbsp; Password is <strong>not included</strong> in this receipt. Communicate login credentials to the user separately through a secure channel.</div>
      <div class="footer">Generated by DYP Faculty Appraisal Admin Panel &middot; ${r.createdAt}</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleStaffType = (type) => {
    setStaffType(type);
    setTrack('');
    setErr(null);
    setForm(p => ({ ...p, appraisal_role: '', school: '', department: '', reports_to_registrar: false }));
  };
  const handleTrack = (t) => {
    setTrack(t);
    setErr(null);
    // CISR has only one school — auto-assign it immediately
    setForm(p => ({ ...p, appraisal_role: '', school: t === 'cisr' ? 'CISR' : '', department: '' }));
  };
  const handleSchool = (code) => {
    setForm(p => ({
      ...p,
      school: code,
      department: '',
      // If switching away from SoEMR and role was HOD, revert to faculty
      appraisal_role: p.appraisal_role === 'hod' && code !== 'SoEMR' ? 'faculty' : p.appraisal_role,
    }));
  };
  const handleRole = (val) => {
    const update = { appraisal_role: val, department: '' };
    if (val === 'hod')  update.school = 'SoEMR';
    if (val === 'dean') update.school = '';
    if (val !== 'non_teaching_staff') update.reports_to_registrar = false;
    setForm(p => ({ ...p, ...update }));
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = () => {
    if (step === 0) {
      if (!staffType) return 'Please select Teaching or Non-Teaching.';
      if (isTeaching && !track) return 'Please select an academic track.';
    }
    if (step === 1) {
      if (!role) return 'Please select a role.';
      if ((isEngineering || isNonEng) && role !== 'dean' && role !== 'hod' && !school)
        return 'Please select a school.';
      if (role === 'hod' && !dept)
        return 'Please select a department for this HOD position.';
      if (role === 'faculty' && school === 'SoEMR' && !dept)
        return 'SoEMR faculty must be assigned to a department.';
    }
    if (step === 2) {
      if (!form.full_name.trim()) return 'Full name is required.';
      if (!form.email.trim())     return 'Email address is required.';
      if (!form.password.trim())  return 'Password is required.';
    }
    return null;
  };

  const handleNext = async () => {
    const msg = validate();
    if (msg) { setErr(msg); return; }
    setErr(null);
    if (step < 3) { setStep(s => s + 1); return; }

    // Final step — save
    setSaving(true); setSuccess(null);
    try {
      await api.users.create(form);
      const snap = {
        name:               form.full_name || form.email,
        email:              form.email,
        role:               roleMeta?.label ?? role,
        staffType:          staffType === 'teaching' ? 'Teaching' : 'Non-Teaching',
        school:             school             || null,
        department:         dept               || null,
        designation:        form.designation   || null,
        phone:              form.phone         || null,
        qualification:      form.qualification || null,
        teachingExperience: form.teaching_experience || null,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      };
      setReceipt(snap);
      setSuccess(form.email);
      setForm(EMPTY);
      setStaffType('');
      setTrack('');
      setStep(0);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Step renderers ───────────────────────────────────────────────────────────

  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

  const stepClassify = () => (
    <div>
      <SL>Staff Category</SL>
      <div style={{ ...g2, marginBottom: 22 }}>
        <ChoiceCard
          label="Teaching Staff"
          sub="Faculty · HOD · Director · Dean"
          icon={I.users} color={C.accent}
          active={staffType === 'teaching'}
          onClick={() => handleStaffType('teaching')}
        />
        <ChoiceCard
          label="Non-Teaching Staff"
          sub="Staff · Reporting Officer · Registrar"
          icon={I.doc} color="#a78bfa"
          active={staffType === 'non_teaching'}
          onClick={() => handleStaffType('non_teaching')}
        />
      </div>

      {isTeaching && (
        <div style={{ animation: 'fadeUp .2s cubic-bezier(.22,1,.36,1) both' }}>
          <SL>Academic Track</SL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <TrackCard
              label="Engineering"
              sub="SoCSEA · SoBB · SoCE · SoEMR"
              icon={I.bldg} color={C.yellow}
              active={track === 'engineering'}
              onClick={() => handleTrack('engineering')}
            />
            <TrackCard
              label="Non-Engineering"
              sub="SoC · SoMCS · SoD · SoAA"
              icon={I.school} color={C.green}
              active={track === 'non_engineering'}
              onClick={() => handleTrack('non_engineering')}
            />
            <TrackCard
              label="CISR"
              sub="Center for Interdisciplinary Studies & Research"
              icon={I.layers} color={C.orange}
              active={track === 'cisr'}
              onClick={() => handleTrack('cisr')}
            />
          </div>
        </div>
      )}
    </div>
  );

  const stepRoleSchool = () => (
    <div>
      {/* ── Role cards ── */}
      <SL>Role</SL>
      <div style={{ display: 'grid', gridTemplateColumns: roleGridCols, gap: 10, marginBottom: 20 }}>
        {availRoles.map(r => {
          const RIcon  = r.icon;
          const active = role === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRole(r.value)}
              className="act-btn"
              style={{
                padding: '12px 13px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                border: `1.5px solid ${active ? r.color : 'rgba(255,255,255,.07)'}`,
                background: active ? `${r.color}12` : 'rgba(255,255,255,.02)',
                position: 'relative',
              }}
            >
              <div style={{ color: active ? r.color : C.muted, marginBottom: 7 }}>
                <RIcon size={17} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, color: active ? r.color : C.text, marginBottom: 3 }}>
                {r.label}
              </div>
              <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>
                Flow: {r.flow}
              </div>
              {r.soEmrOnly && (
                <div style={{ marginTop: 3, fontSize: 9, color: '#a78bfa', fontWeight: 600 }}>
                  SoEMR only
                </div>
              )}
              {active && (
                <div style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: r.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Reporting structure — non-teaching staff only ── */}
      {isNonTeaching && role === 'non_teaching_staff' && (
        <div style={{ marginBottom: 20, animation: 'fadeUp .2s ease both' }}>
          <SL>Reporting Structure</SL>
          <ReportingToggle
            checked={form.reports_to_registrar}
            onChange={() => setForm(p => ({ ...p, reports_to_registrar: !p.reports_to_registrar }))}
          />
        </div>
      )}

      {/* ── Contextual notes ── */}
      {role === 'dean' && (isEngineering || isNonEng) && (
        <InfoBox color="green">
          {isEngineering
            ? 'Dean of Engineering oversees all 4 engineering schools (SoCSEA, SoBB, SoCE, SoEMR). No specific school or department is required.'
            : 'Dean of Non-Engineering oversees all 4 non-engineering schools (SoC, SoMCS, SoD, SoAA). No specific school or department is required.'}
        </InfoBox>
      )}
      {role === 'hod' && (
        <InfoBox color="purple">
          HOD exists only within SoEMR. The school is auto-assigned — just select the department below.
        </InfoBox>
      )}

      {/* ── School picker — dropdown (non-Dean, non-HOD) ── */}
      {showSchoolPicker && (
        <div style={{ marginBottom: 18 }}>
          <SL>{isEngineering ? 'Engineering School' : 'Non-Engineering School'}</SL>
          <select
            className="ifield"
            value={school}
            onChange={e => handleSchool(e.target.value)}
            style={inp}
          >
            <option value="">— Select School —</option>
            {groupSchools.map(s => (
              <option key={s.code} value={s.code}>
                {s.full} ({s.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── HOD: SoEMR locked display ── */}
      {schoolLocked && (
        <div style={{ marginBottom: 18 }}>
          <SL>School (auto-assigned)</SL>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 9,
            background: 'rgba(167,139,250,.07)', border: '1.5px solid rgba(167,139,250,.22)',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
              SoEMR
            </span>
            <span style={{ fontSize: 12, color: C.subtle }}>
              School of Engineering, Management & Research
            </span>
          </div>
        </div>
      )}

      {/* ── CISR: locked school display ── */}
      {isCISR && !!role && (
        <div style={{ marginBottom: 18 }}>
          <SL>School (auto-assigned)</SL>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 9,
            background: 'rgba(251,146,60,.07)', border: '1.5px solid rgba(251,146,60,.22)',
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: C.orange }}>
              CISR
            </span>
            <span style={{ fontSize: 12, color: C.subtle }}>
              Center for Interdisciplinary Studies & Research
            </span>
          </div>
        </div>
      )}

      {/* ── Department — SoEMR dropdown ── */}
      {showDeptFixed && (
        <div>
          <SL>Department</SL>
          <select
            className="ifield"
            value={dept}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            style={inp}
          >
            <option value="">— Select Department —</option>
            {SOEMR_DEPTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Department — free text for other schools ── */}
      {showDeptText && (
        <div>
          <label style={{ ...lbl, marginBottom: 5 }}>
            Department <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(optional)</span>
          </label>
          <input
            className="ifield"
            type="text"
            value={dept}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            placeholder="e.g. Computer Science"
            style={inp}
          />
        </div>
      )}
    </div>
  );

  const stepAccount = () => (
    <div>
      <SL>Login Credentials</SL>
      <div style={{ marginBottom: 14 }}>
        <Field label="Full Name" req>
          <input className="ifield" type="text" value={form.full_name}
            onChange={set('full_name')} placeholder="Dr. First Last" style={inp} />
        </Field>
      </div>
      <div style={{ ...g2, marginBottom: 16 }}>
        <Field label="Email Address" req>
          <input className="ifield" type="email" value={form.email}
            onChange={set('email')} placeholder="staff@dypiu.edu" style={inp} />
        </Field>
        <Field label="Password" req>
          <input className="ifield" type="text" value={form.password}
            onChange={set('password')} placeholder="Temporary password" style={inp} />
          <div style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
            Default temporary password is <span style={{ fontFamily: "'JetBrains Mono',monospace", color: C.yellow }}>demo123</span> — the user should change it on first login.
          </div>
        </Field>
      </div>
      <div style={{
        padding: '10px 14px', borderRadius: 8, fontSize: 11, color: C.muted, lineHeight: 1.6,
        background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)',
      }}>
        Account is created immediately. Staff can log in right away — email verification is skipped for admin-created accounts.
      </div>
    </div>
  );

  const stepProfile = () => (
    <div>
      <SL>Professional Details</SL>
      <div style={{ ...g2, marginBottom: 14 }}>
        <Field label="Designation">
          <input className="ifield" type="text" value={form.designation}
            onChange={set('designation')} placeholder="e.g. Assistant Professor" style={inp} />
        </Field>
        <Field label="Phone">
          <input className="ifield" type="text" value={form.phone}
            onChange={set('phone')} placeholder="+91 XXXXX XXXXX" style={inp} />
        </Field>
      </div>
      <div style={{ ...g2 }}>
        <Field label="Qualification">
          <input className="ifield" type="text" value={form.qualification}
            onChange={set('qualification')} placeholder="e.g. Ph.D" style={inp} />
        </Field>
        <Field label="Teaching Experience">
          <input className="ifield" type="text" value={form.teaching_experience}
            onChange={set('teaching_experience')} placeholder="e.g. 8 years" style={inp} />
        </Field>
      </div>
      <div style={{ marginTop: 14, fontSize: 11, color: C.muted }}>
        All fields on this step are optional and can be edited later from the Faculty List page.
      </div>
    </div>
  );

  const RENDERERS = [stepClassify, stepRoleSchool, stepAccount, stepProfile];

  // ── Summary rows ─────────────────────────────────────────────────────────────

  const roleMeta = availRoles.find(r => r.value === role);
  const summaryRows = [
    { k: 'Category', v: staffType === 'teaching' ? 'Teaching' : staffType === 'non_teaching' ? 'Non-Teaching' : null },
    { k: 'Track',    v: track === 'engineering' ? 'Engineering' : track === 'non_engineering' ? 'Non-Engineering' : track === 'cisr' ? 'CISR' : null },
    { k: 'Role',     v: roleMeta?.label ?? null },
    { k: 'School',   v: school || null },
    { k: 'Dept',     v: dept   || null },
    { k: 'Name',     v: form.full_name || null },
    { k: 'Email',    v: form.email     || null },
  ].filter(r => r.v);

  // ── Render ────────────────────────────────────────────────────────────────────

  // ── Receipt modal ─────────────────────────────────────────────────────────────

  const receiptFields = receipt ? [
    { k: 'Full Name',    v: receipt.name        },
    { k: 'Email',        v: receipt.email       },
    { k: 'Role',         v: receipt.role        },
    { k: 'Staff Type',   v: receipt.staffType   },
    receipt.school             && { k: 'School',       v: receipt.school             },
    receipt.department         && { k: 'Department',   v: receipt.department         },
    receipt.designation        && { k: 'Designation',  v: receipt.designation        },
    receipt.phone              && { k: 'Phone',        v: receipt.phone              },
    receipt.qualification      && { k: 'Qualification',v: receipt.qualification      },
    receipt.teachingExperience && { k: 'Experience',   v: receipt.teachingExperience },
  ].filter(Boolean) : [];

  return (
    <div className="page-enter">

      {/* ── Receipt modal ─────────────────────────────────────────── */}
      {receipt && (
        <Modal maxWidth={480} onClose={() => setReceipt(null)}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.check size={20} stroke={C.green} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Account Created</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{receipt.createdAt}</div>
            </div>
          </div>

          {/* Detail rows */}
          <div style={{ marginBottom: 16 }}>
            {receiptFields.map((row, i) => (
              <div key={row.k} style={{
                display: 'flex', gap: 12, padding: '8px 0',
                borderBottom: i < receiptFields.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none',
              }}>
                <span style={{ fontSize: 12, color: C.muted, width: 110, flexShrink: 0 }}>{row.k}</span>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 600, flex: 1,
                  wordBreak: 'break-all',
                  fontFamily: row.k === 'Email' ? "'JetBrains Mono',monospace" : 'inherit' }}>
                  {row.v}
                </span>
              </div>
            ))}
          </div>

          {/* Password notice */}
          <div style={{ marginBottom: 20, padding: '10px 12px', borderRadius: 8, fontSize: 11,
            lineHeight: 1.6, color: C.yellow,
            background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.18)' }}>
            Password is <strong>not included</strong> in this receipt. Share login credentials with the user separately through a secure channel.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="act-btn" style={{ ...pBtn, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => handlePrint(receipt)}>
              <I.dl size={13} /> Print Receipt
            </button>
            <button className="act-btn" style={oBtn} onClick={() => setReceipt(null)}>
              Add Another
            </button>
            <button className="act-btn"
              style={{ padding: '9px 14px', background: 'transparent', color: C.muted,
                border: '1px solid var(--c-btn-border)', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 600 }}
              onClick={() => navigate('/faculty')}>
              View User List
            </button>
          </div>
        </Modal>
      )}

      <PageHead
        title="Add User"
        sub="The appraisal routing is determined automatically from the role assigned here"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'start' }}>

        {/* ── Main form card ── */}
        <Card delay={0}>
          <Stepper current={step} />

          {/* Step heading */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
              {STEPS[step].label}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {STEPS[step].sub}
            </div>
          </div>

          {/* Animated step content */}
          <div key={step} style={{ animation: 'fadeUp .2s cubic-bezier(.22,1,.36,1) both' }}>
            {RENDERERS[step]()}
          </div>

          {/* Error */}
          {err && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)',
            }}>
              {err}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 8, fontSize: 13,
              color: C.green, background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)',
            }}>
              ✓ Account created for <strong>{success}</strong>. Form has been reset — you can add another.
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.05)',
          }}>
            <div>
              {step > 0 && (
                <button
                  className="act-btn"
                  style={oBtn}
                  onClick={() => { setErr(null); setStep(s => s - 1); }}
                >
                  ← Back
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="act-btn"
                style={{ ...oBtn, fontSize: 12 }}
                onClick={() => navigate('/faculty')}
              >
                Cancel
              </button>
              <button
                className="act-btn"
                style={pBtn}
                onClick={handleNext}
                disabled={saving}
              >
                {saving ? 'Creating…' : step === 3 ? 'Create Account' : 'Continue →'}
              </button>
            </div>
          </div>
        </Card>

        {/* ── Right panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Summary */}
          <Card title="Summary" delay={60}>
            {summaryRows.length === 0 ? (
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '8px 0' }}>
                Selections will appear here
              </div>
            ) : (
              summaryRows.map((r, i) => (
                <div
                  key={r.k}
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: 8,
                    padding: '6px 0',
                    borderBottom: i < summaryRows.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>{r.k}</span>
                  <span style={{ fontSize: 11, color: C.subtle, textAlign: 'right', wordBreak: 'break-all' }}>{r.v}</span>
                </div>
              ))
            )}
          </Card>

          {/* Appraisal Journey */}
          <Card title="Appraisal Journey" sub="Score visibility at each stage" delay={100}>
            <FlowPreview nodes={flowNodes} />
          </Card>

        </div>
      </div>
    </div>
  );
}
