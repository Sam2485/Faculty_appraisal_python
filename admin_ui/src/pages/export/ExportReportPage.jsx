import { useState } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import { SCHOOLS } from '../../constants/schools';

// ── Total Score CSV builder ────────────────────────────────────────────────
function buildTotalScoreCSV(rows, includeHod) {
  const esc = (v) => {
    const s = String(v ?? '');
    if (!s.includes(',') && !s.includes('"') && !s.includes('\n')) return s;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const fmt    = (n) => (n > 0 ? n.toFixed(1) : '');
  const fmtPct = (n) => (n > 0 ? ((n / 575) * 100).toFixed(1) : '');

  const groups = [
    'Faculty Score',
    ...(includeHod ? ['Head of Department'] : []),
    'Director Score',
    'Dean Score',
    'Vice Chancellor',
    'Average Score',
    'Best Score',
  ];

  const row1 = [
    'Sr No', 'Name of the Faculty', 'Designation', 'Name of the School',
    ...groups.flatMap(g => [g, '', '', '']),
  ];
  const row2 = [
    '', '', '', '',
    ...groups.flatMap(() => ['Part A', 'Part B', 'Total', '%']),
  ];

  const dataRows = rows.map((r, i) => {
    const selfA = r.part_a_total || 0, selfB = r.part_b_total || 0, selfT = r.grand_total    || 0;
    const hodA  = r.hod_part_a   || 0, hodB  = r.hod_part_b   || 0, hodT  = r.hod_total      || 0;
    const dirA  = r.director_part_a || 0, dirB = r.director_part_b || 0, dirT = r.director_total || 0;
    const dnA   = r.dean_part_a  || 0, dnB   = r.dean_part_b  || 0, dnT   = r.dean_total     || 0;
    const vcA   = r.vc_part_a    || 0, vcB   = r.vc_part_b    || 0, vcT   = r.vc_total       || 0;

    const isEMR = r.school === 'SoEMR';
    const revs  = isEMR
      ? [[hodA, hodB, hodT], [dirA, dirB, dirT], [dnA, dnB, dnT], [vcA, vcB, vcT]]
      : [[dirA, dirB, dirT], [dnA, dnB, dnT], [vcA, vcB, vcT]];

    const nz   = revs.filter(([,, t]) => t > 0);
    const avgA = nz.length ? nz.reduce((s, [a])    => s + a, 0) / nz.length : 0;
    const avgB = nz.length ? nz.reduce((s, [, b])  => s + b, 0) / nz.length : 0;
    const avgT = nz.length ? nz.reduce((s, [,, t]) => s + t, 0) / nz.length : 0;

    let bestA = 0, bestB = 0, bestT = 0;
    revs.forEach(([a, b, t]) => { if (t > bestT) { bestT = t; bestA = a; bestB = b; } });

    const cells = [
      esc(i + 1), esc(r.name || ''), esc(r.department || ''), esc(r.school || ''),
      fmt(selfA), fmt(selfB), fmt(selfT), fmtPct(selfT),
    ];
    if (includeHod) {
      cells.push(
        isEMR ? fmt(hodA)    : '', isEMR ? fmt(hodB)    : '',
        isEMR ? fmt(hodT)    : '', isEMR ? fmtPct(hodT) : '',
      );
    }
    cells.push(fmt(dirA), fmt(dirB), fmt(dirT), fmtPct(dirT));
    cells.push(fmt(dnA),  fmt(dnB),  fmt(dnT),  fmtPct(dnT));
    cells.push(fmt(vcA),  fmt(vcB),  fmt(vcT),  fmtPct(vcT));
    cells.push(
      avgT > 0 ? avgA.toFixed(1) : '', avgT > 0 ? avgB.toFixed(1) : '',
      avgT > 0 ? avgT.toFixed(1) : '', avgT > 0 ? fmtPct(avgT)    : '',
    );
    cells.push(
      bestT > 0 ? bestA.toFixed(1) : '', bestT > 0 ? bestB.toFixed(1) : '',
      bestT > 0 ? bestT.toFixed(1) : '', bestT > 0 ? fmtPct(bestT)    : '',
    );
    return cells;
  });

  return [
    row1.map(esc).join(','),
    row2.join(','),
    ...dataRows.map(r => r.join(',')),
  ].join('\r\n');
}

// ── Constants ──────────────────────────────────────────────────────────────
const YEARS = ['2025-2026', '2024-2025', '2023-2024', '2022-2023'];

const ROLES = [
  { value: '',                   label: 'All Roles'          },
  { value: 'faculty',            label: 'Faculty'            },
  { value: 'hod',                label: 'HOD'                },
  { value: 'director',           label: 'Director'           },
  { value: 'dean',               label: 'Dean'               },
  { value: 'registrar',          label: 'Registrar'          },
  { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
];

const STATUSES = [
  { value: '',          label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted'    },
  { value: 'pending',   label: 'Pending'      },
  { value: 'reviewed',  label: 'Reviewed'     },
];

const SOEMR_DEPTS = [
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Semiconductor Engineering',
];

// ── Compact page header ────────────────────────────────────────────────────
function PageHeader({ error }) {
  return (
    <div style={{ flexShrink: 0, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: error ? 10 : 0 }}>
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: 'rgba(16,185,129,.13)', border: '1px solid rgba(16,185,129,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(16,185,129,.15)',
        }}>
          <I.dl size={17} stroke="#10b981" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 18, fontWeight: 800, color: C.text,
            letterSpacing: -.4, lineHeight: 1.1, margin: 0, marginBottom: 3,
          }}>
            Export Reports
          </h1>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            Download structured CSV files — open directly in Excel or Google Sheets
          </p>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {[
            { label: '3 export types',           color: '#3b82f6' },
            { label: 'School-wise filter',        color: '#8b5cf6' },
            { label: 'Excel & Sheets compatible', color: '#10b981' },
          ].map(c => (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 6,
              background: `${c.color}0e`, border: `1px solid ${c.color}22`,
              fontSize: 9.5, fontWeight: 600, color: `${c.color}cc`,
              whiteSpace: 'nowrap',
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8, fontSize: 12,
          color: C.red, background: 'rgba(248,113,113,.08)',
          border: '1px solid rgba(248,113,113,.18)',
          animation: 'scaleIn .2s ease both', marginTop: 10,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
          {error}
        </div>
      )}

      {/* Divider */}
      <div style={{
        height: 1, marginTop: 14,
        background: 'linear-gradient(90deg, rgba(16,185,129,.25), rgba(59,130,246,.12), transparent)',
      }} />
    </div>
  );
}

// ── Select field ───────────────────────────────────────────────────────────
function SelectField({ label: fieldLabel, value, onChange, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 9, fontWeight: 700,
        letterSpacing: .8, textTransform: 'uppercase',
        color: 'rgba(255,255,255,.28)', marginBottom: 5,
      }}>
        {fieldLabel}
      </label>
      <select
        className="ifield"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inp, appearance: 'none', cursor: 'pointer', fontSize: 12 }}
      >
        {children}
      </select>
    </div>
  );
}

// ── Column tag ─────────────────────────────────────────────────────────────
function ColTag({ label, accent }) {
  return (
    <span style={{
      fontSize:   accent ? 10  : 9,
      fontWeight: accent ? 800 : 600,
      padding:    accent ? '3px 9px' : '2px 7px',
      borderRadius: 5,
      background: accent ? `${accent}1c` : 'rgba(255,255,255,.04)',
      color:      accent ? accent        : 'rgba(255,255,255,.38)',
      border:     `1px solid ${accent ? accent + '38' : 'rgba(255,255,255,.07)'}`,
      whiteSpace: 'nowrap', letterSpacing: .2, flexShrink: 0,
      boxShadow:  accent ? `0 1px 6px ${accent}1e` : 'none',
    }}>
      {label}
    </span>
  );
}

// ── Export card ────────────────────────────────────────────────────────────
function ExportCard({ icon: Icon, title, subtitle, description, accent, columns, note, fields, onDownload, loading }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderRadius: 14,
      background: 'var(--c-card)',
      border: '1px solid rgba(255,255,255,.07)',
      boxShadow: '0 6px 24px rgba(0,0,0,.25)',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Accent gradient bar */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)`,
      }} />

      {/* Card header — fixed */}
      <div style={{
        padding: '13px 18px 11px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,.055)',
        background: `linear-gradient(135deg, ${accent}09, transparent 55%)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${accent}14`, border: `1px solid ${accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 3px 10px ${accent}1c`,
        }}>
          <Icon size={16} stroke={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: -.2 }}>
              {title}
            </span>
            <span style={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: .9, textTransform: 'uppercase',
              padding: '1px 6px', borderRadius: 3,
              background: `${accent}14`, color: accent, border: `1px solid ${accent}22`,
            }}>
              CSV
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.3 }}>{subtitle}</div>
        </div>
      </div>

      {/* Scrollable body — grows to fill remaining height */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: 'auto', overflowX: 'hidden',
        padding: '14px 18px',
        display: 'flex', flexDirection: 'column', gap: 13,
        scrollbarWidth: 'thin',
        scrollbarColor: `${accent}30 transparent`,
      }}>

        {/* Description */}
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.38)', lineHeight: 1.65, margin: 0 }}>
          {description}
        </p>

        {/* Columns included */}
        <div>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: .9, textTransform: 'uppercase',
            color: `${accent}70`, marginBottom: 7,
          }}>
            Columns included
          </div>
          <div style={{
            display: 'flex', gap: 5, flexWrap: 'wrap',
          }}>
            {columns.map(col => (
              <ColTag key={col.label ?? col} label={col.label ?? col} accent={col.accent} />
            ))}
          </div>
        </div>

        {/* Note banner */}
        {note && (
          <div style={{
            display: 'flex', gap: 7, padding: '8px 11px', borderRadius: 7, fontSize: 11,
            background: `${accent}0b`, border: `1px solid ${accent}20`,
            color: `${accent}aa`, lineHeight: 1.55,
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>ℹ</span>
            <span>{note}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.055)', flexShrink: 0 }} />

        {/* Filters */}
        <div>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: .9, textTransform: 'uppercase',
            color: `${accent}70`, marginBottom: 9,
          }}>
            Filters
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 9 }}>
            {fields}
          </div>
        </div>
      </div>

      {/* Download button — pinned footer */}
      <div style={{
        padding: '11px 18px 14px', flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,.055)',
        background: 'rgba(0,0,0,.08)',
      }}>
        <button
          className="act-btn"
          onClick={onDownload}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px 0', borderRadius: 9,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#fff',
            border: 'none', width: '100%',
            background: loading
              ? `${accent}45`
              : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow: loading ? 'none' : `0 3px 14px ${accent}38`,
            opacity: loading ? .7 : 1,
            transition: 'all .2s',
          }}
        >
          <I.dl size={13} stroke="#fff" />
          {loading ? 'Preparing…' : 'Download CSV'}
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ExportReportPage() {

  // Submissions export
  const [subYear,    setSubYear]    = useState(YEARS[0]);
  const [subSchool,  setSubSchool]  = useState('');
  const [subStatus,  setSubStatus]  = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subErr,     setSubErr]     = useState(null);

  // Faculty export
  const [facSchool,  setFacSchool]  = useState('');
  const [facRole,    setFacRole]    = useState('');
  const [facLoading, setFacLoading] = useState(false);
  const [facErr,     setFacErr]     = useState(null);

  // Total Score Report
  const [tsYear,     setTsYear]     = useState(YEARS[0]);
  const [tsSchool,   setTsSchool]   = useState('');
  const [tsDept,     setTsDept]     = useState('');
  const [tsLoading,  setTsLoading]  = useState(false);
  const [tsErr,      setTsErr]      = useState(null);

  const handleTsSchoolChange = (val) => {
    setTsSchool(val);
    if (val !== 'SoEMR') setTsDept('');
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmissions = async () => {
    setSubLoading(true); setSubErr(null);
    try {
      const params = { year: subYear };
      if (subSchool) params.school = subSchool;
      if (subStatus) params.status = subStatus;
      const blob = await api.export.submissions(params);
      triggerDownload(blob, `submissions_${subYear}${subSchool ? '_' + subSchool : ''}.csv`);
    } catch (e) {
      setSubErr(e.message);
    } finally {
      setSubLoading(false);
    }
  };

  const handleFaculty = async () => {
    setFacLoading(true); setFacErr(null);
    try {
      const params = {};
      if (facSchool) params.school = facSchool;
      if (facRole)   params.role   = facRole;
      const blob = await api.export.faculty(params);
      triggerDownload(blob, `faculty${facSchool ? '_' + facSchool : ''}${facRole ? '_' + facRole : ''}.csv`);
    } catch (e) {
      setFacErr(e.message);
    } finally {
      setFacLoading(false);
    }
  };

  const handleTotalScore = async () => {
    setTsLoading(true); setTsErr(null);
    try {
      const data = await api.marks.list(tsYear, tsSchool);
      const rows = Array.isArray(data) ? data : [];

      const faculty = rows
        .filter(r => r.appraisal_role === 'faculty')
        .filter(r => !tsDept || r.department === tsDept)
        .sort((a, b) => {
          if (!tsSchool) {
            const sc = (a.school || '').localeCompare(b.school || '');
            if (sc !== 0) return sc;
          }
          return (b.grand_total || 0) - (a.grand_total || 0);
        });

      if (!faculty.length) {
        setTsErr('No faculty records found for the selected filters.');
        return;
      }

      const includeHod = !tsSchool || tsSchool === 'SoEMR';
      const csv      = buildTotalScoreCSV(faculty, includeHod);
      const blob     = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const deptSlug = tsDept ? '_' + tsDept.replace(/\s+/g, '_') : '';
      triggerDownload(blob, `total_score_${tsYear}${tsSchool ? '_' + tsSchool : '_all'}${deptSlug}.csv`);
    } catch (e) {
      setTsErr(e.message);
    } finally {
      setTsLoading(false);
    }
  };

  const anyErr = subErr || facErr || tsErr;

  return (
    <div className="page-enter" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      <PageHeader error={anyErr} />

      {/* Card grid — fills remaining viewport height */}
      <div style={{
        height: 'calc(100vh - 155px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 16,
        overflow: 'hidden',
      }}>

        {/* ── Submissions Export ── */}
        <ExportCard
          icon={I.doc}
          title="Submissions Export"
          subtitle="Appraisal submission records by year, school & status"
          accent="#3b82f6"
          loading={subLoading}
          onDownload={handleSubmissions}
          description={
            'Full list of appraisal submission records for a selected academic year. ' +
            'Shows whether each faculty member has submitted, which review stage it is at, ' +
            'and when it was submitted. Use this to track completion progress across the ' +
            'university or a specific school.'
          }
          columns={[
            'Academic Year', 'Faculty Name', 'Email', 'School',
            'Department', 'Role', 'Status', 'Submitted At',
          ]}
          fields={[
            <SelectField key="year" label="Academic Year" value={subYear} onChange={setSubYear}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </SelectField>,
            <SelectField key="school" label="School" value={subSchool} onChange={setSubSchool}>
              <option value="">All Schools</option>
              {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
            </SelectField>,
            <SelectField key="status" label="Status" value={subStatus} onChange={setSubStatus}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </SelectField>,
          ]}
        />

        {/* ── Faculty Export ── */}
        <ExportCard
          icon={I.users}
          title="Faculty Export"
          subtitle="Registered user directory filtered by school and role"
          accent="#8b5cf6"
          loading={facLoading}
          onDownload={handleFaculty}
          description={
            'Complete directory of all registered users — faculty, HODs, directors, deans, ' +
            'and non-teaching staff. Useful for roster verification, role audits, and ' +
            'confirming which accounts are active or disabled in the system.'
          }
          columns={[
            'Full Name', 'Email', 'School', 'Department',
            'Role', 'Active Status', 'Account Verified',
          ]}
          fields={[
            <SelectField key="school" label="School" value={facSchool} onChange={setFacSchool}>
              <option value="">All Schools</option>
              {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
            </SelectField>,
            <SelectField key="role" label="Role" value={facRole} onChange={setFacRole}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </SelectField>,
          ]}
        />

        {/* ── Total Score Report ── */}
        <ExportCard
          icon={I.star}
          title="Total Score Report"
          subtitle="Full score breakdown for teaching faculty — all reviewer levels"
          accent="#10b981"
          loading={tsLoading}
          onDownload={handleTotalScore}
          description={
            'Score report for teaching faculty only (role = Faculty). Uses a two-row header: ' +
            'row 1 names each reviewer group, row 2 shows Part A · Part B · Total · % sub-columns. ' +
            'Part A is out of 200, Part B out of 375, Total out of 575. ' +
            '% = (Total ÷ 575) × 100. Sorted by school then score descending.'
          }
          note={
            'SoEMR includes an extra Head of Department column group. ' +
            'Select SoEMR to also filter by department (Mechanical, Civil, Chemical, Semiconductor).'
          }
          columns={[
            { label: 'Sr No' },
            { label: 'Name' },
            { label: 'Designation' },
            { label: 'School' },
            { label: 'Faculty Score ×4',  accent: '#94a3b8' },
            { label: 'HOD Score ×4',      accent: '#a78bfa' },
            { label: 'Director Score ×4', accent: '#fbbf24' },
            { label: 'Dean Score ×4',     accent: '#34d399' },
            { label: 'VC Score ×4',       accent: '#3b82f6' },
            { label: 'Average Score ×4',  accent: '#f59e0b' },
            { label: 'Best Score ×4',     accent: '#10b981' },
          ]}
          fields={[
            <SelectField key="year" label="Academic Year" value={tsYear} onChange={setTsYear}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </SelectField>,
            <SelectField key="school" label="School" value={tsSchool} onChange={handleTsSchoolChange}>
              <option value="">All Schools</option>
              {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.code} — {s.full}</option>)}
            </SelectField>,
            ...(tsSchool === 'SoEMR' ? [
              <SelectField key="dept" label="Department" value={tsDept} onChange={setTsDept}>
                <option value="">All Departments</option>
                {SOEMR_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </SelectField>,
            ] : []),
          ]}
        />

      </div>
    </div>
  );
}
