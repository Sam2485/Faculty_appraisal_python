import { useState } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats, normalizeUsers } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { I } from '../../components/icons';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import LiveBadge from '../../components/LiveBadge';
import ProgressBar from '../../components/ProgressBar';
import { inp } from '../../constants/styleTokens';
import {
  ENGG_SCHOOL_CODES, NON_ENGG_SCHOOL_CODES, TEACHING_SCHOOL_CODES,
  SCHOOL_META, SOEMR_DEPTS,
} from '../../constants/schools';

// ── Stage maps (backend Declaration.status → pipeline key) ────────────────────

const STAGE_KEY = {
  'Pending Review':          'hod',
  'Submitted':               'hod',
  'Pending Director Review': 'director',
  'Pending Dean Review':     'dean',
  'Pending VC Review':       'vc',
  'Reviewed':                'done',
};

const NT_STAGE_KEY = {
  'Draft':                       'ro',
  'Reporting Officer Reviewed':  'registrar',
  'Registrar Reviewed':          'vc',
  'VC Approved':                 'done',
};

// ── Pipeline stage definitions ────────────────────────────────────────────────

const T_STAGES = [
  { key: 'not_submitted', label: 'Not Submitted', color: C.red,    icon: I.clock  },
  { key: 'hod',           label: 'HOD Queue',     color: '#a78bfa', icon: I.school },
  { key: 'director',      label: 'Director',      color: C.yellow,  icon: I.star   },
  { key: 'dean',          label: 'Dean',          color: C.green,   icon: I.shield },
  { key: 'vc',            label: 'VC Queue',      color: '#f472b6', icon: I.users  },
  { key: 'done',          label: 'Approved',      color: C.accent,  icon: I.check  },
];

const NT_STAGES = [
  { key: 'not_submitted', label: 'Not Submitted', color: C.red,    icon: I.clock  },
  { key: 'ro',            label: 'RO Queue',      color: '#a78bfa', icon: I.users  },
  { key: 'registrar',     label: 'Registrar',     color: C.yellow,  icon: I.star   },
  { key: 'vc',            label: 'VC Queue',      color: '#f472b6', icon: I.shield },
  { key: 'done',          label: 'Approved',      color: C.accent,  icon: I.check  },
];

// ── Transparency rules ────────────────────────────────────────────────────────

function getTransparency(schoolCode, role) {
  const track = SCHOOL_META[schoolCode]?.track;

  if (schoolCode === 'SoEMR') {
    if (role === 'faculty') return [
      { reviewer: 'HOD (dept-specific)',  sees: 'Faculty self-score',          hides: null },
      { reviewer: 'Director (SoEMR)',     sees: 'Faculty self-score only',     hides: 'HOD score hidden' },
      { reviewer: 'Dean of Engineering',  sees: 'Faculty self-score only',     hides: 'HOD + Director scores hidden' },
      { reviewer: 'VC',                   sees: 'All 4 scores (Faculty · HOD · Director · Dean)', hides: null },
    ];
    if (role === 'hod') return [
      { reviewer: 'Director (SoEMR)',    sees: 'HOD self-score',         hides: null },
      { reviewer: 'Dean of Engineering', sees: 'HOD self-score only',    hides: 'Director score hidden' },
      { reviewer: 'VC',                  sees: 'HOD + Director + Dean',  hides: null },
    ];
    if (role === 'director') return [
      { reviewer: 'Dean of Engineering', sees: 'Director self-score', hides: null },
      { reviewer: 'VC',                  sees: 'Director + Dean',     hides: null },
    ];
    if (role === 'dean') return [{ reviewer: 'VC', sees: 'Dean self-score', hides: null }];
  }

  if (track === 'engineering') {
    if (role === 'faculty') return [
      { reviewer: `Director (${schoolCode})`, sees: 'Faculty self-score',          hides: null },
      { reviewer: 'Dean of Engineering',      sees: 'Faculty self-score only',     hides: 'Director score hidden' },
      { reviewer: 'VC',                       sees: 'Faculty + Director + Dean',   hides: null },
    ];
    if (role === 'director') return [
      { reviewer: 'Dean of Engineering', sees: 'Director self-score', hides: null },
      { reviewer: 'VC',                  sees: 'Director + Dean',     hides: null },
    ];
    if (role === 'dean') return [{ reviewer: 'VC', sees: 'Dean self-score', hides: null }];
  }

  if (track === 'non_engineering') {
    if (role === 'faculty') return [
      { reviewer: `Director (${schoolCode})`,  sees: 'Faculty self-score',          hides: null },
      { reviewer: 'Dean of Non-Engineering',   sees: 'Faculty + Director scores',   hides: null },
      { reviewer: 'VC',                        sees: 'All scores',                  hides: null },
    ];
    if (role === 'director') return [
      { reviewer: 'Dean of Non-Engineering', sees: 'Director self-score', hides: null },
      { reviewer: 'VC',                      sees: 'Director + Dean',     hides: null },
    ];
    if (role === 'dean') return [{ reviewer: 'VC', sees: 'Dean self-score', hides: null }];
  }

  return [];
}

function getNTTransparency(role) {
  if (role === 'non_teaching_staff') return [
    { reviewer: 'Reporting Officer', sees: 'Staff self-score',          hides: null },
    { reviewer: 'Registrar',         sees: 'Staff self-score only',     hides: 'Reporting Officer score hidden' },
    { reviewer: 'VC',                sees: 'All 3 scores (Staff · RO · Registrar)', hides: null },
  ];
  if (role === 'reporting_officer') return [
    { reviewer: 'Registrar', sees: 'RO self-score',     hides: null },
    { reviewer: 'VC',        sees: 'RO + Registrar',    hides: null },
  ];
  if (role === 'registrar') return [
    { reviewer: 'VC', sees: 'Registrar self-score', hides: null },
  ];
  return [];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function stageCounts(pipeline, map) {
  const out = {};
  Object.entries(pipeline ?? {}).forEach(([stage, n]) => {
    const k = map[stage] ?? 'other';
    out[k] = (out[k] ?? 0) + (n ?? 0);
  });
  return out;
}

function routeLabel(schoolCode, role) {
  const isEng = ENGG_SCHOOL_CODES.includes(schoolCode);
  if (role === 'faculty' && schoolCode === 'SoEMR')  return 'Faculty → HOD (dept) → Director (SoEMR) → Dean (Eng) → VC';
  if (role === 'faculty' && isEng)                   return `Faculty → Director (${schoolCode}) → Dean (Eng) → VC`;
  if (role === 'faculty')                             return `Faculty → Director (${schoolCode}) → Dean (Non-Eng) → VC`;
  if (role === 'hod')                                return 'HOD → Director (SoEMR) → Dean (Eng) → VC';
  if (role === 'director' && isEng)                  return `Director → Dean (Eng) → VC`;
  if (role === 'director')                           return `Director → Dean (Non-Eng) → VC`;
  if (role === 'dean')                               return 'Dean → VC';
  return '';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Av({ name, color, size = 28 }) {
  const init = (name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}1a`, border: `1.5px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.32), fontWeight: 700, color,
    }}>{init}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
      color: C.muted, marginBottom: 8, paddingBottom: 6,
      borderBottom: '1px solid rgba(255,255,255,.05)',
    }}>{children}</div>
  );
}

function TransPanel({ nodes, role, school, route }) {
  const TCOLS = ['#a78bfa', C.yellow, C.green, '#f472b6', C.accent];
  return (
    <>
      {nodes.length === 0 ? (
        <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
          No transparency rules for this selection
        </div>
      ) : nodes.map((node, i) => {
        const col = TCOLS[i] ?? C.muted;
        const isLast = i === nodes.length - 1;
        return (
          <div key={i} style={{ display: 'flex', gap: 9 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, marginTop: 2, flexShrink: 0 }} />
              {!isLast && <div style={{ width: 1.5, flex: 1, background: 'rgba(255,255,255,.07)', marginTop: 4, minHeight: 20 }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 14, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{node.reviewer}</div>
              <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>✓ {node.sees}</div>
              {node.hides && <div style={{ fontSize: 10, color: C.red, marginTop: 1 }}>✕ {node.hides}</div>}
            </div>
          </div>
        );
      })}
      {route && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)',
          fontSize: 10, color: C.muted, lineHeight: 1.65 }}>
          <span style={{ fontWeight: 700, color: C.subtle }}>Route: </span>{route}
        </div>
      )}
    </>
  );
}

function PipelineStrip({ stages, counts, active, onSelect }) {
  return (
    <div style={{ display: 'flex', marginBottom: 18,
      background: 'rgba(255,255,255,.02)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
      {stages.map((s, i) => {
        const SIcon  = s.icon;
        const n      = counts[s.key] ?? 0;
        const isAct  = active === s.key;
        const isLast = i === stages.length - 1;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(isAct ? null : s.key)}
            className="act-btn"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 5, padding: '13px 6px', cursor: 'pointer',
              background: isAct ? `${s.color}0e` : 'transparent',
              borderRight: isLast ? 'none' : '1px solid rgba(255,255,255,.05)',
              borderBottom: `2px solid ${isAct ? s.color : 'transparent'}`,
              transition: 'all .15s ease',
            }}
          >
            <SIcon size={12} />
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: .4, textTransform: 'uppercase',
              color: isAct ? s.color : C.muted, whiteSpace: 'nowrap' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1,
              color: n > 0 ? s.color : 'rgba(255,255,255,.1)',
              fontFamily: "'JetBrains Mono',monospace" }}>{n}</div>
          </button>
        );
      })}
    </div>
  );
}

function FacList({ title, color, people, dept = false, badge, badgeColor }) {
  if (people.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: .5 }}>
          {title} ({people.length})
        </span>
      </div>
      {people.map((f, j) => (
        <div key={f.email ?? f.id ?? j} style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0',
          borderBottom: j < people.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
        }}>
          <Av name={f.name} color={color} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
              {[f.designation !== '—' ? f.designation : null, dept && f.dept !== '—' ? f.dept : null]
                .filter(Boolean).join(' · ') || f.email}
            </div>
          </div>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, flexShrink: 0,
              background: `${badgeColor ?? color}14`, color: badgeColor ?? color }}>
              {badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AppraisalCyclePage() {
  const [track,          setTrack]          = useState('teaching');
  const [selectedSchool, setSelectedSchool] = useState('SoCSEA');
  const [activeStage,    setActiveStage]    = useState(null);
  const [transRole,      setTransRole]      = useState('faculty');
  const [ntTransRole,    setNtTransRole]    = useState('non_teaching_staff');

  const { data: raw,      loading: sL, error: sErr, lastUpdated } = useFetch(() => api.stats.get(), [], { interval: 30_000 });
  const { data: rawUsers, loading: uL               } = useFetch(() => api.users.list(), [], { interval: 30_000 });
  const { data: rawPending, loading: pL             } = useFetch(
    () => raw?.academic_year
      ? api.pending.list({ academic_year: raw.academic_year })
      : Promise.resolve(null),
    [raw?.academic_year],
  );

  const stats    = normalizeStats(raw);
  const allUsers = normalizeUsers(rawUsers ?? []);
  const loading  = sL || uL || pL;

  const bySchoolPipeline = raw?.by_school_submitted  ?? {};
  const bySchoolReg      = raw?.by_school_registered ?? {};
  const byDept           = raw?.by_department_submitted ?? {};

  const pendingArr    = Array.isArray(rawPending) ? rawPending : [];
  const pendingEmails = new Set(pendingArr.map(f => f.email));

  // Group users by school
  const usersBySchool = {};
  allUsers.forEach(u => {
    const sc = u.school !== '—' ? u.school : '__none__';
    if (!usersBySchool[sc]) usersBySchool[sc] = [];
    usersBySchool[sc].push(u);
  });

  // ── Teaching pipeline totals ──────────────────────────────────────────────────
  const tCounts = stageCounts(stats.pipeline, STAGE_KEY);
  tCounts['not_submitted'] = stats.pending;

  // ── Non-teaching pipeline totals ──────────────────────────────────────────────
  const ntCounts = stageCounts(stats.nonTeachingPipeline, NT_STAGE_KEY);
  const ntTotal  = Object.values(stats.nonTeachingPipeline).reduce((s, n) => s + n, 0);
  const ntUsers  = allUsers.filter(u => ['non_teaching_staff', 'reporting_officer', 'registrar'].includes(u.role));
  const ntPending = ntUsers.filter(u => pendingEmails.has(u.email));
  ntCounts['not_submitted'] = ntPending.length;

  // ── Selected school data ──────────────────────────────────────────────────────
  const selMeta    = SCHOOL_META[selectedSchool] ?? {};
  const selUsers   = usersBySchool[selectedSchool] ?? [];
  const selFaculty = selUsers.filter(u => u.role === 'faculty');
  const selHODs    = selUsers.filter(u => u.role === 'hod');
  const selDirs    = selUsers.filter(u => u.role === 'director');

  const selNotSubmitted = selFaculty.filter(f =>  pendingEmails.has(f.email));
  const selSubmitted    = selFaculty.filter(f => !pendingEmails.has(f.email));

  const selPipeline  = bySchoolPipeline[selectedSchool] ?? {};
  const selStgCounts = stageCounts(selPipeline, STAGE_KEY);
  selStgCounts['not_submitted'] = selNotSubmitted.length;

  const selReg = bySchoolReg[selectedSchool] ?? selFaculty.length;
  const selSub = Object.values(selPipeline).reduce((s, n) => s + n, 0);
  const selPct = selReg ? Math.round(selSub / selReg * 100) : 0;
  const barCol = selPct >= 80 ? `linear-gradient(90deg,${C.green},#059669)`
               : selPct >= 60 ? `linear-gradient(90deg,${C.accent},#2563eb)`
               :                `linear-gradient(90deg,${C.yellow},#d97706)`;

  // Transparency roles available for selected school
  const transRoles = selectedSchool === 'SoEMR'
    ? [
        { k: 'faculty',  label: 'Faculty'   },
        { k: 'hod',      label: 'HOD'       },
        { k: 'director', label: 'Director'  },
        { k: 'dean',     label: 'Dean'      },
      ]
    : [
        { k: 'faculty',  label: 'Faculty'   },
        { k: 'director', label: 'Director'  },
        { k: 'dean',     label: 'Dean'      },
      ];
  const ROLE_COLORS = { faculty: C.accent, hod: '#a78bfa', director: C.yellow, dean: C.green };

  const transNodes = getTransparency(selectedSchool, transRole);
  const transRoute  = routeLabel(selectedSchool, transRole);

  // ── Filter faculty by active pipeline stage ───────────────────────────────────
  // "not_submitted" → show selNotSubmitted by name
  // any other stage → we have school-level counts, not per-faculty stage
  // So show submitted faculty grouped with "In Review" when no stage filter,
  // or show count info when a specific stage is active.
  const showNotSubmitted = !activeStage || activeStage === 'not_submitted';
  const showSubmitted    = !activeStage || activeStage !== 'not_submitted';

  // ── VC / Dean queue per Eng group ─────────────────────────────────────────────
  const schoolStgCount = (sc, stgKey) => {
    const counts = stageCounts(bySchoolPipeline[sc] ?? {}, STAGE_KEY);
    return counts[stgKey] ?? 0;
  };

  return (
    <div className="page-enter">
      <PageHead
        title="Appraisal Cycle"
        sub={`${stats.academicYear ?? 'Current cycle'} · ${stats.total} registered · ${stats.submitted} submitted`}
        action={<LiveBadge lastUpdated={lastUpdated} />}
      />

      {/* Track tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[
          { k: 'teaching',     label: 'Teaching Staff'     },
          { k: 'non_teaching', label: 'Non-Teaching Staff' },
        ].map(t => (
          <button key={t.k} className="act-btn" onClick={() => setTrack(t.k)} style={{
            padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: track === t.k ? `${C.accent}14` : 'rgba(255,255,255,.03)',
            border: `1px solid ${track === t.k ? `${C.accent}40` : 'rgba(255,255,255,.08)'}`,
            color: track === t.k ? C.accent : C.subtle,
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <Loading />}
      {sErr    && <ApiError message={sErr} />}

      {!loading && !sErr && (
        <div key={track} style={{ animation: 'fadeUp .3s cubic-bezier(.22,1,.36,1) both' }}>

          {/* ══════════ TEACHING ══════════ */}
          {track === 'teaching' && (
            <>
              {/* Overall stats chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { l: 'Total Faculty', v: stats.total,     c: C.subtle  },
                  { l: 'Submitted',     v: stats.submitted, c: C.green   },
                  { l: 'Not Submitted', v: stats.pending,   c: C.red     },
                  { l: 'Fully Approved', v: tCounts['done'] ?? 0, c: C.accent },
                ].map((s, i) => (
                  <div key={s.l} className="glass card-appear"
                    style={{ padding: '14px 18px', animationDelay: `${i * 45}ms` }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Pipeline strip */}
              <PipelineStrip stages={T_STAGES} counts={tCounts} active={activeStage} onSelect={setActiveStage} />

              {/* Main grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 14, alignItems: 'start' }}>

                {/* ── Left: School detail ── */}
                <div>
                  {/* School selector pills */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    {TEACHING_SCHOOL_CODES.map(code => {
                      const isEngg   = ENGG_SCHOOL_CODES.includes(code);
                      const tagCol   = isEngg ? C.accent : C.green;
                      const isActive = selectedSchool === code;
                      // Count for current active stage filter
                      const stageCnt = activeStage ? (stageCounts(bySchoolPipeline[code] ?? {}, STAGE_KEY)[activeStage] ?? 0) : null;
                      return (
                        <button key={code} onClick={() => setSelectedSchool(code)} className="act-btn" style={{
                          padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          fontFamily: "'JetBrains Mono',monospace",
                          border: `1px solid ${isActive ? tagCol : 'rgba(255,255,255,.08)'}`,
                          background: isActive ? `${tagCol}12` : 'rgba(255,255,255,.02)',
                          color: isActive ? tagCol : C.muted,
                        }}>
                          {code}
                          {stageCnt !== null && stageCnt > 0 && (
                            <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 800, color: isActive ? tagCol : C.muted }}>
                              {stageCnt}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* School card */}
                  <div className="glass" style={{ padding: '20px 22px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.accent,
                          fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>{selectedSchool}</div>
                        <div style={{ fontSize: 12, color: C.subtle }}>{selMeta.full}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          Reports to: <span style={{ color: C.green, fontWeight: 600 }}>{selMeta.dean}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>Submission Rate</div>
                        <div style={{ fontSize: 24, fontWeight: 800,
                          color: selPct >= 80 ? C.green : selPct >= 60 ? C.accent : C.yellow,
                          fontFamily: "'JetBrains Mono',monospace" }}>{selPct}%</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{selSub} / {selReg}</div>
                      </div>
                    </div>

                    <ProgressBar value={selPct} color={barCol} />

                    {/* Pipeline status for this school */}
                    <div style={{ marginTop: 16, marginBottom: 18 }}>
                      <SectionLabel>Application Status — {selectedSchool}</SectionLabel>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {T_STAGES.map(s => {
                          const n = selStgCounts[s.key] ?? 0;
                          if (n === 0 && s.key === 'not_submitted') return null;
                          return (
                            <div key={s.key} style={{
                              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20,
                              background: n > 0 ? `${s.color}12` : 'rgba(255,255,255,.03)',
                              border: `1px solid ${activeStage === s.key ? s.color : n > 0 ? `${s.color}2a` : 'rgba(255,255,255,.06)'}`,
                            }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: n > 0 ? s.color : 'rgba(255,255,255,.2)' }}>
                                {s.label}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 800,
                                color: n > 0 ? s.color : 'rgba(255,255,255,.15)',
                                fontFamily: "'JetBrains Mono',monospace" }}>{n}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SoEMR: Department breakdown */}
                    {selectedSchool === 'SoEMR' && (
                      <div style={{ marginBottom: 18 }}>
                        <SectionLabel>Departments (SoEMR)</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {SOEMR_DEPTS.map(dept => {
                            const deptFac     = selFaculty.filter(f => f.dept === dept);
                            const deptHOD     = selHODs.find(h => h.dept === dept);
                            const deptPending = deptFac.filter(f =>  pendingEmails.has(f.email));
                            const deptSub     = deptFac.filter(f => !pendingEmails.has(f.email));
                            const deptCounts  = stageCounts(byDept[dept] ?? {}, STAGE_KEY);
                            const hodQ = deptCounts['hod'] ?? 0;
                            const dirQ = deptCounts['director'] ?? 0;
                            const shortDept = dept.replace(' Engineering', '');
                            return (
                              <div key={dept} style={{ padding: '11px 13px', borderRadius: 9,
                                background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>{shortDept}</div>
                                {deptHOD ? (
                                  <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 6 }}>
                                    HOD: {deptHOD.name}
                                    <span style={{ marginLeft: 5, padding: '1px 5px', borderRadius: 8,
                                      background: pendingEmails.has(deptHOD.email) ? 'rgba(248,113,113,.12)' : 'rgba(52,211,153,.1)',
                                      color: pendingEmails.has(deptHOD.email) ? C.red : C.green, fontSize: 9 }}>
                                      {pendingEmails.has(deptHOD.email) ? 'pending' : 'submitted'}
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic', marginBottom: 6 }}>No HOD</div>
                                )}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {deptSub.length > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(52,211,153,.1)', color: C.green }}>{deptSub.length} submitted</span>
                                  )}
                                  {deptPending.length > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(248,113,113,.1)', color: C.red }}>{deptPending.length} not submitted</span>
                                  )}
                                  {hodQ > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(167,139,250,.12)', color: '#a78bfa' }}>{hodQ} @HOD</span>
                                  )}
                                  {dirQ > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                      background: 'rgba(251,191,36,.1)', color: C.yellow }}>{dirQ} @Director</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Director(s) */}
                    {selDirs.length > 0 && (
                      <div style={{ marginBottom: 18 }}>
                        <SectionLabel>Director{selDirs.length > 1 ? 's' : ''}</SectionLabel>
                        {selDirs.map((dir, j) => (
                          <div key={dir.email} style={{
                            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
                            borderBottom: j < selDirs.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                          }}>
                            <Av name={dir.name} color={C.yellow} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{dir.name}</div>
                              {dir.designation !== '—' && (
                                <div style={{ fontSize: 10, color: C.muted }}>{dir.designation}</div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .4 }}>Dir. Queue</div>
                              <div style={{ fontSize: 16, fontWeight: 800,
                                color: (selStgCounts['director'] ?? 0) > 0 ? C.yellow : C.muted,
                                fontFamily: "'JetBrains Mono',monospace" }}>
                                {selStgCounts['director'] ?? 0}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, marginLeft: 4,
                              background: pendingEmails.has(dir.email) ? 'rgba(248,113,113,.12)' : 'rgba(52,211,153,.1)',
                              color: pendingEmails.has(dir.email) ? C.red : C.green }}>
                              {pendingEmails.has(dir.email) ? 'Not Submitted' : 'Submitted'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Faculty list */}
                    <SectionLabel>
                      Faculty — {selectedSchool}
                      {activeStage ? ` · Filtered: ${T_STAGES.find(s => s.key === activeStage)?.label ?? activeStage}` : ''}
                    </SectionLabel>

                    {selFaculty.length === 0 ? (
                      <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                        No faculty registered for {selectedSchool}
                      </div>
                    ) : (
                      <>
                        {/* Not submitted */}
                        {showNotSubmitted && (
                          <FacList
                            title="Not Submitted — Form not yet filled"
                            color={C.red}
                            people={selNotSubmitted}
                            dept={selectedSchool === 'SoEMR'}
                            badge="Not Submitted"
                            badgeColor={C.red}
                          />
                        )}

                        {/* HOD Queue */}
                        {(activeStage === 'hod' || !activeStage) && (selStgCounts['hod'] ?? 0) > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: .5 }}>
                                HOD Queue ({selStgCounts['hod']}) — Pending HOD review
                              </span>
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 11, color: '#a78bfa',
                              background: 'rgba(167,139,250,.06)', border: '1px solid rgba(167,139,250,.15)' }}>
                              {selStgCounts['hod']} form{(selStgCounts['hod'] ?? 0) !== 1 ? 's are' : ' is'} awaiting HOD review.
                              {selectedSchool === 'SoEMR' && ' Each form routes to the HOD of the faculty\'s department.'}
                            </div>
                          </div>
                        )}

                        {/* Director Queue */}
                        {(activeStage === 'director' || !activeStage) && (selStgCounts['director'] ?? 0) > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.yellow }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: C.yellow, textTransform: 'uppercase', letterSpacing: .5 }}>
                                Director Queue ({selStgCounts['director']}) — Pending Director review
                              </span>
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 11, color: C.yellow,
                              background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)' }}>
                              {selStgCounts['director']} form{(selStgCounts['director'] ?? 0) !== 1 ? 's are' : ' is'} with the Director of {selectedSchool} for review.
                              {selMeta.track === 'engineering' && ' Director sees faculty self-score only (HOD score hidden).'}
                              {selMeta.track === 'non_engineering' && ' Director sees faculty self-score.'}
                            </div>
                          </div>
                        )}

                        {/* Dean Queue */}
                        {(activeStage === 'dean' || !activeStage) && (selStgCounts['dean'] ?? 0) > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: .5 }}>
                                Dean Queue ({selStgCounts['dean']}) — Pending Dean review
                              </span>
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 11, color: C.green,
                              background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.15)' }}>
                              {selStgCounts['dean']} form{(selStgCounts['dean'] ?? 0) !== 1 ? 's are' : ' is'} with the {selMeta.dean} for review.
                              {selMeta.track === 'engineering' && ' Dean sees faculty self-score only (Director score hidden).'}
                              {selMeta.track === 'non_engineering' && ' Dean sees faculty + Director scores.'}
                            </div>
                          </div>
                        )}

                        {/* VC Queue */}
                        {(activeStage === 'vc' || !activeStage) && (selStgCounts['vc'] ?? 0) > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f472b6' }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: .5 }}>
                                VC Queue ({selStgCounts['vc']}) — Pending VC review
                              </span>
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 11, color: '#f472b6',
                              background: 'rgba(244,114,182,.06)', border: '1px solid rgba(244,114,182,.15)' }}>
                              {selStgCounts['vc']} form{(selStgCounts['vc'] ?? 0) !== 1 ? 's are' : ' is'} with the VC.
                              VC sees all scores.
                            </div>
                          </div>
                        )}

                        {/* Approved */}
                        {(activeStage === 'done' || !activeStage) && (selStgCounts['done'] ?? 0) > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: .5 }}>
                                Approved ({selStgCounts['done']}) — Appraisal complete
                              </span>
                            </div>
                            <FacList
                              title="Submitted & Approved"
                              color={C.accent}
                              people={selSubmitted}
                              dept={selectedSchool === 'SoEMR'}
                              badge="Approved ✓"
                              badgeColor={C.green}
                            />
                          </div>
                        )}

                        {/* Submitted (in pipeline — no specific stage filter) */}
                        {!activeStage && selSubmitted.length > 0 && (selStgCounts['done'] ?? 0) === 0 && (
                          <FacList
                            title="Submitted — In Review Pipeline"
                            color={C.accent}
                            people={selSubmitted}
                            dept={selectedSchool === 'SoEMR'}
                            badge="In Review"
                            badgeColor={C.yellow}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ── Right: Transparency reference ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Quick school-level queues for Eng/Non-Eng */}
                  <Card title="Queue Overview" sub="Across all schools" delay={40}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 6,
                        textTransform: 'uppercase', letterSpacing: .5 }}>Engineering</div>
                      {ENGG_SCHOOL_CODES.map((sc, i) => {
                        const sPipeline = bySchoolPipeline[sc] ?? {};
                        const sCounts   = stageCounts(sPipeline, STAGE_KEY);
                        const sTot = Object.values(sPipeline).reduce((s, n) => s + n, 0);
                        const sReg = bySchoolReg[sc] ?? 0;
                        return (
                          <div key={sc} onClick={() => setSelectedSchool(sc)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '7px 8px', borderRadius: 7, marginBottom: 3, cursor: 'pointer',
                              background: selectedSchool === sc ? 'rgba(59,130,246,.08)' : 'rgba(255,255,255,.02)',
                              border: `1px solid ${selectedSchool === sc ? 'rgba(59,130,246,.25)' : 'rgba(255,255,255,.05)'}`,
                              transition: 'all .12s' }}>
                            <span style={{ fontSize: 11, fontWeight: selectedSchool === sc ? 700 : 500,
                              color: selectedSchool === sc ? C.accent : C.subtle,
                              fontFamily: "'JetBrains Mono',monospace" }}>{sc}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[
                                { k: 'not_submitted', n: (usersBySchool[sc] ?? []).filter(u => u.role === 'faculty' && pendingEmails.has(u.email)).length, c: C.red },
                                { k: 'hod',      n: sCounts['hod']      ?? 0, c: '#a78bfa' },
                                { k: 'director', n: sCounts['director'] ?? 0, c: C.yellow  },
                                { k: 'dean',     n: sCounts['dean']     ?? 0, c: C.green   },
                                { k: 'vc',       n: sCounts['vc']       ?? 0, c: '#f472b6' },
                              ].filter(x => x.n > 0).map(x => (
                                <span key={x.k} style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px',
                                  borderRadius: 8, background: `${x.c}15`, color: x.c,
                                  fontFamily: "'JetBrains Mono',monospace" }}>{x.n}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.green, marginBottom: 6,
                        textTransform: 'uppercase', letterSpacing: .5 }}>Non-Engineering</div>
                      {NON_ENGG_SCHOOL_CODES.map(sc => {
                        const sPipeline = bySchoolPipeline[sc] ?? {};
                        const sCounts   = stageCounts(sPipeline, STAGE_KEY);
                        return (
                          <div key={sc} onClick={() => setSelectedSchool(sc)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '7px 8px', borderRadius: 7, marginBottom: 3, cursor: 'pointer',
                              background: selectedSchool === sc ? 'rgba(52,211,153,.08)' : 'rgba(255,255,255,.02)',
                              border: `1px solid ${selectedSchool === sc ? 'rgba(52,211,153,.25)' : 'rgba(255,255,255,.05)'}`,
                              transition: 'all .12s' }}>
                            <span style={{ fontSize: 11, fontWeight: selectedSchool === sc ? 700 : 500,
                              color: selectedSchool === sc ? C.green : C.subtle,
                              fontFamily: "'JetBrains Mono',monospace" }}>{sc}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {[
                                { k: 'not_submitted', n: (usersBySchool[sc] ?? []).filter(u => u.role === 'faculty' && pendingEmails.has(u.email)).length, c: C.red },
                                { k: 'director', n: sCounts['director'] ?? 0, c: C.yellow  },
                                { k: 'dean',     n: sCounts['dean']     ?? 0, c: C.green   },
                                { k: 'vc',       n: sCounts['vc']       ?? 0, c: '#f472b6' },
                              ].filter(x => x.n > 0).map(x => (
                                <span key={x.k} style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px',
                                  borderRadius: 8, background: `${x.c}15`, color: x.c,
                                  fontFamily: "'JetBrains Mono',monospace" }}>{x.n}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Transparency reference */}
                  <Card title="Transparency Rules" sub={`Score visibility · ${selectedSchool}`} delay={80}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                      {transRoles.map(r => {
                        const col = ROLE_COLORS[r.k] ?? C.muted;
                        const isAct = transRole === r.k;
                        return (
                          <button key={r.k} onClick={() => setTransRole(r.k)} className="act-btn" style={{
                            padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${isAct ? col : 'rgba(255,255,255,.08)'}`,
                            background: isAct ? `${col}14` : 'transparent',
                            color: isAct ? col : C.muted,
                          }}>{r.label}</button>
                        );
                      })}
                    </div>
                    <TransPanel
                      nodes={transNodes}
                      role={transRole}
                      school={selectedSchool}
                      route={transRoute}
                    />
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* ══════════ NON-TEACHING ══════════ */}
          {track === 'non_teaching' && (
            <>
              {/* Stats chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { l: 'Total Staff',   v: ntUsers.length,           c: C.subtle  },
                  { l: 'Submitted',     v: ntUsers.length - ntPending.length, c: C.green },
                  { l: 'Not Submitted', v: ntPending.length,         c: C.red     },
                  { l: 'Approved',      v: ntCounts['done'] ?? 0,    c: C.accent  },
                ].map((s, i) => (
                  <div key={s.l} className="glass card-appear"
                    style={{ padding: '14px 18px', animationDelay: `${i * 45}ms` }}>
                    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* NT pipeline strip */}
              <PipelineStrip stages={NT_STAGES} counts={ntCounts} active={activeStage} onSelect={setActiveStage} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 268px', gap: 14, alignItems: 'start' }}>

                {/* NT pipeline stage cards */}
                <div className="glass" style={{ padding: '20px 22px' }}>
                  <SectionLabel>Non-Teaching Pipeline</SectionLabel>

                  {/* Stage breakdown */}
                  {NT_STAGES.filter(s => s.key !== 'not_submitted').map(s => {
                    const n = ntCounts[s.key] ?? 0;
                    return (
                      <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', borderRadius: 10, marginBottom: 8,
                        background: n > 0 ? `${s.color}0a` : 'rgba(255,255,255,.02)',
                        border: `1px solid ${activeStage === s.key ? s.color : n > 0 ? `${s.color}22` : 'rgba(255,255,255,.05)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n > 0 ? s.color : 'rgba(255,255,255,.12)',
                            boxShadow: n > 0 ? `0 0 6px ${s.color}60` : 'none' }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: n > 0 ? C.text : C.muted }}>{s.label}</div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                              {s.key === 'ro'        && 'Submitted by staff, awaiting Reporting Officer review'}
                              {s.key === 'registrar' && 'RO reviewed, awaiting Registrar review'}
                              {s.key === 'vc'        && 'Registrar reviewed, awaiting VC sign-off'}
                              {s.key === 'done'      && 'Fully approved by VC'}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 26, fontWeight: 800,
                          color: n > 0 ? s.color : 'rgba(255,255,255,.1)',
                          fontFamily: "'JetBrains Mono',monospace" }}>{n}</span>
                      </div>
                    );
                  })}

                  {/* Not submitted NT staff */}
                  {ntPending.length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <SectionLabel>Not Yet Submitted — {ntPending.length} staff</SectionLabel>
                      <FacList
                        title="Not Submitted"
                        color={C.red}
                        people={ntPending}
                        badge="Pending"
                        badgeColor={C.red}
                      />
                    </div>
                  )}

                  {/* Submitted NT staff */}
                  {ntUsers.filter(u => !pendingEmails.has(u.email)).length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <SectionLabel>Submitted Staff</SectionLabel>
                      <FacList
                        title="Submitted — In Review"
                        color={C.accent}
                        people={ntUsers.filter(u => !pendingEmails.has(u.email))}
                        badge="Submitted"
                        badgeColor={C.accent}
                      />
                    </div>
                  )}
                </div>

                {/* NT Transparency reference */}
                <Card title="Transparency Rules" sub="Score visibility · Non-Teaching" delay={60}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { k: 'non_teaching_staff', label: 'Staff'   },
                      { k: 'reporting_officer',  label: 'Rep. Officer' },
                      { k: 'registrar',          label: 'Registrar' },
                    ].map(r => {
                      const col = { non_teaching_staff: C.accent, reporting_officer: '#a78bfa', registrar: C.yellow }[r.k] ?? C.muted;
                      const isAct = ntTransRole === r.k;
                      return (
                        <button key={r.k} onClick={() => setNtTransRole(r.k)} className="act-btn" style={{
                          padding: '4px 10px', borderRadius: 14, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${isAct ? col : 'rgba(255,255,255,.08)'}`,
                          background: isAct ? `${col}14` : 'transparent',
                          color: isAct ? col : C.muted,
                        }}>{r.label}</button>
                      );
                    })}
                  </div>
                  <TransPanel
                    nodes={getNTTransparency(ntTransRole)}
                    role={ntTransRole}
                    school={null}
                    route={
                      ntTransRole === 'non_teaching_staff' ? 'Staff → Reporting Officer → Registrar → VC'
                      : ntTransRole === 'reporting_officer' ? 'Reporting Officer → Registrar → VC'
                      : 'Registrar → VC'
                    }
                  />
                </Card>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
