import { useState } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { inp } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import { SCHOOLS } from '../../constants/schools';

// ── Section max marks (Part A = 200, Part B = 375) ────────────────────────
const FULL_A = 200
const FULL_B = 375
const SELF_ACR_EXCLUDED = 25

// When a section is empty or has notApplicable:true its max is removed from denominator.
// Falls back to full 200/375 when vc_section_scores is not yet supplied by the backend.
function getSelfMax(item = {}) {
  const form = item.form && typeof item.form === 'object' ? item.form : {}
  const totals = item.totals && typeof item.totals === 'object' ? item.totals : {}
  const applicability = item.sectionApplicability || form.sectionApplicability || {}

  const partAMax =
    Number(item.effectivePartAMax || totals.effectivePartAMax) ||
    FULL_A
      - SELF_ACR_EXCLUDED
      - (applicability.projects === 'notApplicable' ? 10 : 0)
      - (applicability.society === 'notApplicable' ? 10 : 0)

  const partBMax =
    Number(item.effectivePartBMax || totals.effectivePartBMax) ||
    FULL_B
      - (applicability.research === 'notApplicable' ? 30 : 0)

  return {
    partA: Math.max(partAMax, 1),
    partB: Math.max(partBMax, 1),
    total: Math.max(partAMax + partBMax, 1),
  }
}

function getReviewerMax(item = {}) {
  const self = getSelfMax(item)
  return {
    partA: self.partA + SELF_ACR_EXCLUDED,
    partB: self.partB,
    total: self.total + SELF_ACR_EXCLUDED,
  }
}

function getReportPayload(detail = {}) {
  const payload = detail.payload || {}
  const nested = payload.payload && typeof payload.payload === 'object' ? payload.payload : {}
  const form = payload.form || nested.form || {}
  const totals = payload.totals || nested.totals || {}
  const sectionApplicability =
    payload.sectionApplicability ||
    form.sectionApplicability ||
    nested.sectionApplicability ||
    nested.form?.sectionApplicability ||
    {}

  return { form, totals, sectionApplicability }
}

async function enrichTotalScoreRows(rows, academicYear) {
  return Promise.all(rows.map(async (row) => {
    try {
      const detail = await api.marks.detail(row.email, academicYear)
      const reportPayload = getReportPayload(detail)
      const next = {
        ...row,
        ...reportPayload,
        faculty_section_scores: reportPayload.form,
        faculty_section_applicability: reportPayload.sectionApplicability,
      }

      ;(detail.reviews || []).forEach(review => {
        const role = review.reviewer_role
        if (role) next[`${role}_section_scores`] = review.section_scores || {}
      })

      return next
    } catch {
      return row
    }
  }))
}

// ── Total Score Excel builder (no colours, wide columns, centred) ──────────
async function buildTotalScoreExcel(rows, includeHod) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'DYP Faculty Appraisal'

  const ws = wb.addWorksheet('Total Score Report', {
    views: [{ state: 'frozen', ySplit: 2, topLeftCell: 'A3' }],
    pageSetup: { orientation: 'landscape', fitToPage: true },
  })

  const FIXED = 4
  const groups = [
    { label: 'Faculty Score',   cols: 7 },
    ...(includeHod ? [{ label: 'Head of Department', cols: 7 }] : []),
    { label: 'Director Score',  cols: 7 },
    { label: 'Dean Score',      cols: 7 },
    { label: 'Vice Chancellor', cols: 7 },
    { label: 'Average Score',   cols: 7 },
    { label: 'Best Score',      cols: 7 },
  ]

  ws.columns = [
    { width: 6  },  // Sr No
    { width: 32 },  // Name — wide
    { width: 24 },  // Designation — wide
    { width: 12 },  // School
    ...groups.flatMap(g =>
      [{ width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 7 }]
    ),
  ]

  const bdr = {
    top:    { style: 'thin', color: { argb: 'FFd1d5db' } },
    bottom: { style: 'thin', color: { argb: 'FFd1d5db' } },
    left:   { style: 'thin', color: { argb: 'FFd1d5db' } },
    right:  { style: 'thin', color: { argb: 'FFd1d5db' } },
  }
  const partAStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }
  const partAMaxStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
  const partBStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }
  const partBMaxStyle = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }

  const scoreFillForOffset = (offset) => {
    if (offset === 0) return partAStyle
    if (offset === 1) return partAMaxStyle
    if (offset === 2) return partBStyle
    if (offset === 3) return partBMaxStyle
    return null
  }
  const scoreOffsetForColumn = (colNum) => {
    let start = FIXED + 1
    for (const g of groups) {
      if (colNum >= start && colNum < start + g.cols) return colNum - start
      start += g.cols
    }
    return -1
  }

  // ── Row 1: fixed + group headers ─────────────────────────────────────────
  const fixedLabels = ['Sr No', 'Name of the Faculty', 'Designation', 'School']
  const row1 = ws.addRow([
    ...fixedLabels,
    ...groups.flatMap(g => [g.label, ...Array(g.cols - 1).fill(null)]),
  ])
  row1.height = 28
  fixedLabels.forEach((_, ci) => {
    row1.getCell(ci + 1).style = {
      font: { bold: true, size: 10, name: 'Calibri' },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: bdr,
    }
  })
  let c = FIXED + 1
  groups.forEach(g => {
    const cell = row1.getCell(c)
    cell.value = g.label
    cell.style = { font: { bold: true, size: 10, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'middle' }, border: bdr }
    if (g.cols > 1) ws.mergeCells(1, c, 1, c + g.cols - 1)
    c += g.cols
  })

  // ── Row 2: sub-column headers ─────────────────────────────────────────────
  const row2 = ws.addRow([
    null, null, null, null,
    ...groups.flatMap(g =>
      ['Part A', 'A Max', 'Part B', 'B Max', 'Total', 'Max', '%']
    ),
  ])
  row2.height = 18
  for (let ci = 1; ci <= FIXED; ci++) ws.mergeCells(1, ci, 2, ci)
  let c2 = FIXED + 1
  groups.forEach(g => {
    const subs = ['Part A', 'A Max', 'Part B', 'B Max', 'Total', 'Max', '%']
    subs.forEach((_, j) => {
      const fill = scoreFillForOffset(j)
      row2.getCell(c2 + j).style = {
        font: { bold: true, size: 9, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: bdr,
        ...(fill ? { fill } : {}),
      }
    })
    c2 += g.cols
  })

  // ── Data rows ─────────────────────────────────────────────────────────────
  rows.forEach((r, i) => {
    const selfMax = getSelfMax(r)
    const reviewerMax = getReviewerMax(r)
    const selfA = r.part_a_total    || 0, selfB = r.part_b_total    || 0, selfT = r.grand_total    || 0
    const hodA  = r.hod_part_a      || 0, hodB  = r.hod_part_b      || 0, hodT  = r.hod_total      || 0
    const dirA  = r.director_part_a || 0, dirB  = r.director_part_b || 0, dirT  = r.director_total || 0
    const dnA   = r.dean_part_a     || 0, dnB   = r.dean_part_b     || 0, dnT   = r.dean_total     || 0
    const vcA   = r.vc_part_a       || 0, vcB   = r.vc_part_b       || 0, vcT   = r.vc_total       || 0
    const isEMR = r.school === 'SoEMR'
    const revs  = isEMR
      ? [[hodA,hodB,hodT,reviewerMax],[dirA,dirB,dirT,reviewerMax],[dnA,dnB,dnT,reviewerMax],[vcA,vcB,vcT,reviewerMax]]
      : [[dirA,dirB,dirT,reviewerMax],[dnA,dnB,dnT,reviewerMax],[vcA,vcB,vcT,reviewerMax]]
    const nz   = revs.filter(([,,t]) => t > 0)
    const avgA = nz.length ? nz.reduce((s,[a])   => s+a, 0)/nz.length : 0
    const avgB = nz.length ? nz.reduce((s,[,b])  => s+b, 0)/nz.length : 0
    const avgT = nz.length ? nz.reduce((s,[,,t]) => s+t, 0)/nz.length : 0
    const avgMax = nz.length ? {
      partA: nz.reduce((s,[,,,m]) => s + m.partA, 0) / nz.length,
      partB: nz.reduce((s,[,,,m]) => s + m.partB, 0) / nz.length,
      total: nz.reduce((s,[,,,m]) => s + m.total, 0) / nz.length,
    } : reviewerMax
    let bestA = 0, bestB = 0, bestT = 0, bestMax = reviewerMax
    revs.forEach(([a,b,t,m]) => { if (t > bestT) { bestT = t; bestA = a; bestB = b; bestMax = m } })
    const n = v => v > 0 ? parseFloat(v.toFixed(1)) : null
    const p = (s, m) => s > 0 && m > 0 ? parseFloat(((s/m)*100).toFixed(1)) : null
    const mx = v => parseFloat(v.toFixed(1))
    const scoreCols = (a, b, t, max, enabled = true) => enabled
      ? [n(a), mx(max.partA), n(b), mx(max.partB), n(t), mx(max.total), p(t, max.total)]
      : [null, null, null, null, null, null, null]

    const rowData = [i+1, r.name||'', r.designation||'', r.school||'', ...scoreCols(selfA, selfB, selfT, selfMax)]
    if (includeHod) rowData.push(...scoreCols(hodA, hodB, hodT, reviewerMax, isEMR))
    rowData.push(...scoreCols(dirA, dirB, dirT, reviewerMax))
    rowData.push(...scoreCols(dnA, dnB, dnT, reviewerMax))
    rowData.push(...scoreCols(vcA, vcB, vcT, reviewerMax))
    rowData.push(...scoreCols(avgA, avgB, avgT, avgMax, avgT > 0))
    rowData.push(...scoreCols(bestA, bestB, bestT, bestMax, bestT > 0))

    const dataRow = ws.addRow(rowData)
    dataRow.height = 17
    dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const groupOffset = scoreOffsetForColumn(colNum)
      const fill = scoreFillForOffset(groupOffset)
      cell.style = {
        font: { size: 9, name: 'Calibri' },
        alignment: { horizontal: colNum <= 2 ? 'left' : 'center', vertical: 'middle' },
        border: bdr,
        ...(fill ? { fill } : {}),
      }
    })
  })

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ── Total Score CSV builder ────────────────────────────────────────────────
function buildTotalScoreCSV(rows, includeHod) {
  const esc = (v) => {
    const s = String(v ?? '')
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const fmt = (n) => (n > 0 ? n.toFixed(1) : '')
  const pct = (score, max) =>
    (score > 0 && max > 0) ? ((score / max) * 100).toFixed(1) : ''

  const groups = [
    { label: 'Faculty Score',   extra: 0 },
    ...(includeHod ? [{ label: 'Head of Department', extra: 0 }] : []),
    { label: 'Director Score',  extra: 0 },
    { label: 'Dean Score',      extra: 0 },
    { label: 'Vice Chancellor', extra: 0 },
    { label: 'Average Score',   extra: 0 },
    { label: 'Best Score',      extra: 0 },
  ]

  const FIXED = ['Sr No', 'Name of the Faculty', 'Designation', 'School']

  const row1 = [
    ...FIXED,
    ...groups.flatMap(g => [g.label, ...Array(6 + g.extra).fill('')]),
  ]
  const row2 = [
    ...FIXED.map(() => ''),
    ...groups.flatMap(g =>
      ['Part A', 'A Max', 'Part B', 'B Max', 'Total', 'Max', '%']
    ),
  ]

  const dataRows = rows.map((r, i) => {
    const selfMax = getSelfMax(r)
    const reviewerMax = getReviewerMax(r)

    const selfA = r.part_a_total    || 0, selfB = r.part_b_total    || 0, selfT = r.grand_total    || 0
    const hodA  = r.hod_part_a      || 0, hodB  = r.hod_part_b      || 0, hodT  = r.hod_total      || 0
    const dirA  = r.director_part_a || 0, dirB  = r.director_part_b || 0, dirT  = r.director_total || 0
    const dnA   = r.dean_part_a     || 0, dnB   = r.dean_part_b     || 0, dnT   = r.dean_total     || 0
    const vcA   = r.vc_part_a       || 0, vcB   = r.vc_part_b       || 0, vcT   = r.vc_total       || 0

    const isEMR = r.school === 'SoEMR'
    const revs  = isEMR
      ? [[hodA, hodB, hodT, reviewerMax], [dirA, dirB, dirT, reviewerMax], [dnA, dnB, dnT, reviewerMax], [vcA, vcB, vcT, reviewerMax]]
      : [[dirA, dirB, dirT, reviewerMax], [dnA, dnB, dnT, reviewerMax], [vcA, vcB, vcT, reviewerMax]]

    const nz   = revs.filter(([,,t]) => t > 0)
    const avgA = nz.length ? nz.reduce((s,[a])   => s+a, 0)/nz.length : 0
    const avgB = nz.length ? nz.reduce((s,[,b])  => s+b, 0)/nz.length : 0
    const avgT = nz.length ? nz.reduce((s,[,,t]) => s+t, 0)/nz.length : 0
    const avgMax = nz.length ? {
      partA: nz.reduce((s,[,,,m]) => s + m.partA, 0) / nz.length,
      partB: nz.reduce((s,[,,,m]) => s + m.partB, 0) / nz.length,
      total: nz.reduce((s,[,,,m]) => s + m.total, 0) / nz.length,
    } : reviewerMax

    let bestA = 0, bestB = 0, bestT = 0, bestMax = reviewerMax
    revs.forEach(([a,b,t,m]) => { if (t > bestT) { bestT = t; bestA = a; bestB = b; bestMax = m } })

    const fmtMax = (n) => Number(n).toFixed(1)
    const scoreCols = (a, b, t, max, enabled = true) => enabled
      ? [fmt(a), fmtMax(max.partA), fmt(b), fmtMax(max.partB), fmt(t), fmtMax(max.total), pct(t, max.total)]
      : ['', '', '', '', '', '', '']

    const cells = [
      esc(i + 1), esc(r.name || ''), esc(r.designation || ''), esc(r.school || ''),
      ...scoreCols(selfA, selfB, selfT, selfMax),
    ]
    if (includeHod) {
      cells.push(...scoreCols(hodA, hodB, hodT, reviewerMax, isEMR))
    }
    cells.push(...scoreCols(dirA, dirB, dirT, reviewerMax))
    cells.push(...scoreCols(dnA, dnB, dnT, reviewerMax))
    cells.push(...scoreCols(vcA, vcB, vcT, reviewerMax))
    cells.push(...scoreCols(avgA, avgB, avgT, avgMax, avgT > 0))
    cells.push(...scoreCols(bestA, bestB, bestT, bestMax, bestT > 0))
    return cells
  })

  return [
    row1.map(esc).join(','),
    row2.join(','),
    ...dataRows.map(r => r.join(',')),
  ].join('\r\n')
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

// ── Page header ───────────────────────────────────────────────────────────
function PageHeader({ error }) {
  return (
    <div style={{ flexShrink: 0, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: error ? 8 : 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'rgba(16,185,129,.13)', border: '1px solid rgba(16,185,129,.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.dl size={16} stroke="#10b981" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 16, fontWeight: 800, color: C.text,
            letterSpacing: -.4, lineHeight: 1.1, margin: 0, marginBottom: 2,
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
function ExportCard({ icon: Icon, title, subtitle, accent, description, note, fields, onDownload, loading, btnLabel = 'Download CSV', xlsxBtn }) {
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
      {/* Accent bar */}
      <div style={{
        height: 3, flexShrink: 0,
        background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)`,
      }} />

      {/* Header */}
      <div style={{
        padding: '11px 16px 10px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,.055)',
        background: `linear-gradient(135deg, ${accent}09, transparent 55%)`,
        display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: `${accent}14`, border: `1px solid ${accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} stroke={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: C.text, letterSpacing: -.2 }}>
              {title}
            </span>
            {xlsxBtn ? (
              <span style={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: .9, textTransform: 'uppercase',
                padding: '1px 6px', borderRadius: 3,
                background: `${accent}14`, color: accent, border: `1px solid ${accent}22`,
              }}>CSV + XLSX</span>
            ) : (
              <span style={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: .9, textTransform: 'uppercase',
                padding: '1px 6px', borderRadius: 3,
                background: `${accent}14`, color: accent, border: `1px solid ${accent}22`,
              }}>CSV</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.3 }}>{subtitle}</div>
        </div>
      </div>

      {/* Body — no scroll, compact */}
      <div style={{
        flex: 1, padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Description */}
        {description && (
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>
            {description}
          </p>
        )}

        {/* Note */}
        {note && (
          <div style={{
            display: 'flex', gap: 6, padding: '7px 10px', borderRadius: 7, fontSize: 10.5,
            background: `${accent}0b`, border: `1px solid ${accent}1e`,
            color: `${accent}bb`, lineHeight: 1.5,
          }}>
            <span style={{ flexShrink: 0 }}>ℹ</span>
            <span>{note}</span>
          </div>
        )}

        {/* Filters label */}
        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: .9, textTransform: 'uppercase',
          color: `${accent}70`,
        }}>
          Filters
        </div>

        {/* Filter fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {fields}
        </div>
      </div>

      {/* Footer — buttons side-by-side */}
      <div style={{
        padding: '10px 16px 13px', flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,.055)',
        background: 'rgba(0,0,0,.08)',
        display: 'flex', gap: 8,
      }}>
        <button
          className="act-btn"
          onClick={onDownload}
          disabled={loading}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0', borderRadius: 9,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: '#fff',
            border: 'none',
            background: loading ? `${accent}45` : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow: loading ? 'none' : `0 3px 14px ${accent}38`,
            opacity: loading ? .7 : 1, transition: 'all .2s',
          }}
        >
          <I.dl size={12} stroke="#fff" />
          {loading ? 'Preparing…' : btnLabel}
        </button>
        {xlsxBtn && (
          <button
            className="act-btn"
            onClick={xlsxBtn.onClick}
            disabled={xlsxBtn.loading}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 0', borderRadius: 9,
              cursor: xlsxBtn.loading ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, color: accent,
              border: `1.5px solid ${accent}55`,
              background: xlsxBtn.loading ? `${accent}10` : 'transparent',
              opacity: xlsxBtn.loading ? .7 : 1, transition: 'all .2s',
            }}
          >
            <I.dl size={12} stroke={accent} />
            {xlsxBtn.loading ? 'Preparing…' : xlsxBtn.label}
          </button>
        )}
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
  const [tsYear,      setTsYear]     = useState(YEARS[0]);
  const [tsSchool,    setTsSchool]   = useState('');
  const [tsDept,      setTsDept]     = useState('');
  const [tsLoading,   setTsLoading]  = useState(false);
  const [tsXlsxLoad, setTsXlsxLoad] = useState(false);
  const [tsErr,       setTsErr]      = useState(null);

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
      const enriched   = await enrichTotalScoreRows(faculty, tsYear);
      const csv        = buildTotalScoreCSV(enriched, includeHod);
      const blob       = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const deptSlug   = tsDept ? '_' + tsDept.replace(/\s+/g, '_') : '';
      triggerDownload(blob, `total_score_${tsYear}${tsSchool ? '_' + tsSchool : '_all'}${deptSlug}.csv`);
    } catch (e) {
      setTsErr(e.message);
    } finally {
      setTsLoading(false);
    }
  };

  const handleTotalScoreXlsx = async () => {
    setTsXlsxLoad(true); setTsErr(null);
    try {
      const data = await api.marks.list(tsYear, tsSchool);
      const rows = Array.isArray(data) ? data : [];
      const faculty = rows
        .filter(r => r.appraisal_role === 'faculty')
        .filter(r => !tsDept || r.department === tsDept)
        .sort((a, b) => {
          if (!tsSchool) { const sc = (a.school||'').localeCompare(b.school||''); if (sc !== 0) return sc; }
          return (b.grand_total || 0) - (a.grand_total || 0);
        });
      if (!faculty.length) { setTsErr('No faculty records found for the selected filters.'); return; }
      const includeHod = !tsSchool || tsSchool === 'SoEMR';
      const enriched   = await enrichTotalScoreRows(faculty, tsYear);
      const blob       = await buildTotalScoreExcel(enriched, includeHod);
      const deptSlug   = tsDept ? '_' + tsDept.replace(/\s+/g, '_') : '';
      triggerDownload(blob, `total_score_${tsYear}${tsSchool ? '_' + tsSchool : '_all'}${deptSlug}.xlsx`);
    } catch (e) { setTsErr(e.message); }
    finally { setTsXlsxLoad(false); }
  };

  const anyErr = subErr || facErr || tsErr;

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      <PageHeader error={anyErr} />

      {/* Card grid — fills remaining viewport height */}
      <div style={{
        flex: 1,
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
          description="Tracks which faculty members have submitted their appraisal for the selected year, current review stage, and submission timestamp. Use this to monitor completion progress across schools."
          accent="#3b82f6"
          loading={subLoading}
          onDownload={handleSubmissions}
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
          description="Complete user directory including faculty, HODs, directors, deans, and non-teaching staff. Useful for roster verification and role audits."
          accent="#8b5cf6"
          loading={facLoading}
          onDownload={handleFaculty}
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
          description="Part A (200) + Part B (375) scores from every reviewer level. N/A sections reduce the effective max below 575."
          accent="#10b981"
          loading={tsLoading}
          onDownload={handleTotalScore}
          xlsxBtn={{ label: 'Download Excel (.xlsx)', onClick: handleTotalScoreXlsx, loading: tsXlsxLoad }}
          note="SoEMR includes an extra HOD column. Select SoEMR to also filter by department."
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
