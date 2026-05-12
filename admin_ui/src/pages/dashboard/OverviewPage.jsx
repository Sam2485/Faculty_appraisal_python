import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeStats } from '../../api/normalizers';
import { AUTO_REFRESH_INTERVAL, useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, smBtn, rateColor } from '../../constants/styleTokens';
import { SCHOOLS, SCHOOL_MAP } from '../../constants/schools';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import LiveBadge from '../../components/LiveBadge';
import ProgressBar from '../../components/ProgressBar';
import ChartTip from '../../components/ChartTip';
import { I } from '../../components/icons';

// ── Stage configs ──────────────────────────────────────────────────────────────

const T_STAGES = [
  { key: 'Submitted',               label: 'Submitted',    color: C.accent  },
  { key: 'Pending Review',          label: 'HOD Review',   color: '#a78bfa' },
  { key: 'Pending Director Review', label: 'Director',     color: C.yellow  },
  { key: 'Pending Dean Review',     label: 'Dean',         color: C.green   },
  { key: 'Pending VC Review',       label: 'VC Queue',     color: '#f472b6' },
  { key: 'Reviewed',                label: 'Approved',     color: '#22d3ee' },
];

const NT_STAGES = [
  { key: 'Draft',                      label: 'Submitted',    color: C.accent  },
  { key: 'Reporting Officer Reviewed', label: 'RO Reviewed',  color: '#a78bfa' },
  { key: 'Registrar Reviewed',         label: 'Registrar',    color: C.yellow  },
  { key: 'VC Approved',                label: 'VC Approved',  color: '#22d3ee' },
];

const ROLE_COLORS = {
  faculty:            C.accent,
  hod:                '#a78bfa',
  director:           C.yellow,
  dean:               C.green,
  registrar:          '#22d3ee',
  vc:                 '#f472b6',
  non_teaching_staff: C.orange,
  reporting_officer:  '#fb923c',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function fmtRole(r) {
  return r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPI({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="glass card-appear" style={{
      padding: '18px 20px', borderRadius: 12, position: 'relative', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,.06)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${color}80,transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: .7,
            textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1,
            letterSpacing: -1, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
        </div>
        <div style={{ padding: 10, borderRadius: 10,
          background: `${color}14`, border: `1px solid ${color}25` }}>
          <Icon size={17} stroke={color} />
        </div>
      </div>
    </div>
  );
}

function PipelineList({ pipeline, stages }) {
  const total = Object.values(pipeline).reduce((s, n) => s + (n ?? 0), 0);
  if (total === 0) return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>
      No submissions yet
    </div>
  );
  return stages.map(({ key, label, color }) => {
    const n   = pipeline[key] ?? 0;
    const pct = total ? n / total : 0;
    return (
      <div key={key} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.subtle, fontWeight: 500 }}>{label}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text,
              fontFamily: "'JetBrains Mono',monospace" }}>{n}</span>
            <span style={{ fontSize: 10, color: C.muted, minWidth: 30, textAlign: 'right' }}>
              {Math.round(pct * 100)}%
            </span>
          </div>
        </div>
        <ProgressBar value={pct * 100} color={color} />
      </div>
    );
  });
}

function InsightChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
      borderRadius: 8, background: `${color}0d`, border: `1px solid ${color}22` }}>
      <Icon size={13} stroke={color} />
      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color,
        fontFamily: "'JetBrains Mono',monospace", marginLeft: 'auto' }}>{value}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [year,           setYear]           = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [downloading,    setDownloading]    = useState(null);
  const [downloadErr,    setDownloadErr]    = useState(null);

  const { data: raw, loading, error, lastUpdated } = useFetch(
    () => api.stats.get(year || undefined),
    [year],
    { interval: AUTO_REFRESH_INTERVAL },
  );
  const stats = normalizeStats(raw);
  const { bySchool, bySchoolSub, pipeline, nonTeachingPipeline, byRole } = stats;

  // ── School-filtered derived values ──────────────────────────────────────────

  const NT_KEY  = '__nt__';
  const isNT    = selectedSchool === NT_KEY;
  const isSchool = selectedSchool && !isNT;

  const ntRegistered = byRole?.non_teaching_staff ?? 0;
  const ntSubmitted  = Object.values(nonTeachingPipeline).reduce((s, n) => s + (n ?? 0), 0);

  const schoolRow    = isSchool ? bySchool.find(s => s.name === selectedSchool) : null;
  const filtPipeline = isNT  ? nonTeachingPipeline
                     : isSchool ? (bySchoolSub?.[selectedSchool] ?? {})
                     : pipeline;

  const filtTotal    = isNT ? ntRegistered
                     : schoolRow ? schoolRow.total : stats.total;
  const filtSub      = isNT ? ntSubmitted
                     : schoolRow ? schoolRow.sub   : stats.submitted;
  const filtPend     = isNT ? (ntRegistered - ntSubmitted)
                     : schoolRow ? schoolRow.pend  : stats.pending;
  const filtRate     = filtTotal ? Math.round(filtSub / filtTotal * 100) : 0;
  const filtTTotal   = Object.values(filtPipeline).reduce((s, n) => s + (n ?? 0), 0);
  const ntTotal      = ntSubmitted;

  const filtApproved = isNT  ? (nonTeachingPipeline['VC Approved'] ?? 0)
                     : isSchool ? (filtPipeline['Reviewed'] ?? 0)
                     : (pipeline['Reviewed'] ?? 0) + (nonTeachingPipeline['VC Approved'] ?? 0);

  const activeStages   = isNT ? NT_STAGES : T_STAGES;
  const pipelineBarData = activeStages.map(({ key, label, color }) => ({
    status: label, count: filtPipeline[key] ?? 0, color,
  }));

  const cycleDonut = [
    { name: 'Submitted', value: filtSub,  color: C.green },
    { name: 'Pending',   value: filtPend, color: C.red   },
  ];

  // School performance sorting — respects selected school (pins it to top)
  const sortedSchools = [...bySchool].sort((a, b) => {
    if (selectedSchool) {
      if (a.name === selectedSchool) return -1;
      if (b.name === selectedSchool) return 1;
    }
    return (b.total ? b.sub / b.total : 0) - (a.total ? a.sub / a.total : 0);
  });
  const topSchool    = [...bySchool].sort((a, b) =>
    (b.total ? b.sub / b.total : 0) - (a.total ? a.sub / a.total : 0)
  )[0];
  const bottomSchool = [...bySchool].sort((a, b) =>
    (a.total ? a.sub / a.total : 0) - (b.total ? b.sub / b.total : 0)
  )[0];

  const roleData = Object.entries(byRole ?? {})
    .filter(([role]) => role !== 'admin')
    .map(([role, count]) => ({ name: fmtRole(role), value: count, color: ROLE_COLORS[role] ?? C.muted }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const handleExport = async (type) => {
    setDownloading(type); setDownloadErr(null);
    const params = year ? { academic_year: year } : {};
    try {
      const blob = await api.export[type](params);
      triggerDownload(blob, `${type}-${year || 'latest'}.csv`);
    } catch (e) {
      setDownloadErr(e.message);
    } finally {
      setDownloading(null);
    }
  };

  const schoolFullName = isNT ? 'Non-Teaching Staff'
                       : isSchool ? (SCHOOL_MAP[selectedSchool] ?? selectedSchool)
                       : null;

  return (
    <div className="page-enter">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <PageHead
          title="Overview"
          sub={selectedSchool
            ? `Showing data for ${selectedSchool} · ${schoolFullName}`
            : 'Real-time snapshot · submission pipeline · school analytics'}
          action={<LiveBadge lastUpdated={lastUpdated} />}
        />
        <select value={year} onChange={e => setYear(e.target.value)}
          style={{ ...inp, width: 'auto', minWidth: 140, cursor: 'pointer', fontSize: 12, marginTop: 4 }}>
          <option value="">Latest cycle</option>
          {(stats.availableYears ?? []).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── School selector ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>

        {/* Dropdown — full school names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted,
            textTransform: 'uppercase', letterSpacing: .6, whiteSpace: 'nowrap' }}>
            Filter by School
          </span>

          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            style={{
              ...inp, width: 'auto', flex: 1, maxWidth: 420,
              cursor: 'pointer', fontSize: 12,
              color: selectedSchool ? C.accent : C.subtle,
              borderColor: selectedSchool ? `${C.accent}55` : undefined,
              background: selectedSchool ? `${C.accent}08` : undefined,
            }}>
            <option value="">All Schools</option>
            {SCHOOLS.map(s => {
              const sRow = bySchool.find(r => r.name === s.code);
              const pct  = sRow && sRow.total ? Math.round(sRow.sub / sRow.total * 100) : null;
              return (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.full}{pct !== null ? `  (${pct}%)` : ''}
                </option>
              );
            })}
            <option disabled>──────────────</option>
            <option value={NT_KEY}>
              Non-Teaching Staff{ntRegistered ? `  (${ntRegistered} registered)` : ''}
            </option>
          </select>
          {selectedSchool && (
            <button className="act-btn" onClick={() => setSelectedSchool('')} style={{
              padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              border: '1px solid rgba(248,113,113,.25)',
              background: 'rgba(248,113,113,.08)',
              color: C.red,
            }}>
              Clear ×
            </button>
          )}
        </div>

      </div>

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          {/* ── KPI row ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <KPI label={isNT ? 'Non-Teaching Staff' : isSchool ? `${selectedSchool} Faculty` : 'Total Faculty'}
              value={filtTotal}    sub={isNT ? 'Registered staff' : isSchool ? schoolFullName : 'Registered'}
              color={C.accent}   icon={I.users}  />
            <KPI label="Submitted"
              value={filtSub}    sub={`${filtRate}% completion`}
              color={C.green}    icon={I.check}  />
            <KPI label="Pending"
              value={filtPend}   sub="Yet to submit"
              color={C.red}      icon={I.clock}  />
            <KPI label="Fully Approved"
              value={filtApproved}
              sub={isNT ? 'VC approved' : isSchool ? 'Teaching only' : 'Teaching + Non-Teaching'}
              color='#22d3ee'    icon={I.shield} />
          </div>

          {/* ── Insights bar ────────────────────────────────────────────────── */}
          {!selectedSchool && !isNT && bySchool.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <InsightChip icon={I.star}  label="Top school"      color={C.green}
                value={topSchool ? `${topSchool.name} · ${Math.round(topSchool.sub / (topSchool.total || 1) * 100)}%` : '—'} />
              <InsightChip icon={I.clock} label="Needs attention" color={C.red}
                value={bottomSchool ? `${bottomSchool.name} · ${Math.round(bottomSchool.sub / (bottomSchool.total || 1) * 100)}%` : '—'} />
              <InsightChip icon={I.chart} label="Teaching pipeline"    color={C.accent} value={`${filtTTotal} in-progress`} />
              {ntTotal > 0 && (
                <InsightChip icon={I.doc} label="Non-teaching pipeline" color={C.yellow} value={`${ntTotal} in-progress`} />
              )}
            </div>
          )}
          {(isSchool || isNT) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <InsightChip icon={I.star}  label="Completion rate"  color={C.green}
                value={`${filtRate}%`} />
              <InsightChip icon={I.chart} label="In pipeline"      color={C.accent}
                value={`${filtTTotal} forms`} />
              <InsightChip icon={I.check} label={isNT ? 'VC Approved' : 'Approved'} color='#22d3ee'
                value={`${filtApproved}`} />
              <InsightChip icon={I.clock} label="Pending"          color={C.red}
                value={`${filtPend} remaining`} />
            </div>
          )}

          {/* ── Bar chart + Donut ───────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>

            {/* Vertical bar chart — submission stages */}
            <Card
              title="Submission Pipeline"
              sub={isNT ? 'Non-Teaching — Count per review stage'
                 : isSchool ? `${selectedSchool} — Count per review stage`
                 : 'Count per review stage (teaching)'}
              delay={0}
              info="Each bar shows how many appraisal forms are currently sitting at that review stage.">
              {filtTTotal === 0 ? (
                <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.muted, fontSize: 13 }}>No submissions yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={pipelineBarData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                    <XAxis dataKey="status" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" name="Submissions" radius={[4, 4, 0, 0]}>
                      {pipelineBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Donut — cycle split */}
            <Card
              title="Cycle Split"
              sub={isNT ? 'Non-Teaching — Current year'
                 : isSchool ? `${selectedSchool} — Current year`
                 : 'Current year'}
              delay={60}
              info="Donut shows the ratio of submitted forms (green) to not-yet-submitted / pending faculty (red) for the selected academic year. Hover a segment for exact counts.">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={cycleDonut} cx="50%" cy="50%" innerRadius={46} outerRadius={66}
                      strokeWidth={0} dataKey="value">
                      {cycleDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                {cycleDonut.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                    <span style={{ color: C.subtle }}>{p.name}</span>
                    <span style={{ color: C.text, fontWeight: 700,
                      fontFamily: "'JetBrains Mono',monospace" }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Progress-bar pipelines ───────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card
              title={isNT ? 'Non-Teaching Pipeline' : 'Teaching Pipeline'}
              sub={isNT ? 'RO → Registrar → VC review stages'
                 : isSchool ? `${selectedSchool} — Forms by review stage`
                 : 'Forms by review stage'}
              delay={80}
              info="Progress bars break down appraisal forms by their current review stage.">
              <PipelineList pipeline={filtPipeline} stages={activeStages} />
            </Card>
            {!isNT && (
              <Card
                title="Non-Teaching Pipeline"
                sub={isSchool ? 'University-wide (no school breakdown)' : 'Staff forms by review stage'}
                delay={100}
                info="Tracks non-teaching staff forms from Reporting Officer review through Registrar to final VC approval.">
                {isSchool && (
                  <div style={{
                    marginBottom: 12, padding: '8px 12px', borderRadius: 7, fontSize: 11,
                    color: C.yellow, background: 'rgba(251,191,36,.07)',
                    border: '1px solid rgba(251,191,36,.18)',
                  }}>
                    Non-teaching staff are not assigned to a school. Showing university-wide data.
                  </div>
                )}
                <PipelineList pipeline={nonTeachingPipeline} stages={NT_STAGES} />
              </Card>
            )}
          </div>

          {/* ── School performance ──────────────────────────────────────────── */}
          {bySchool.length > 0 && !isNT && (
            <Card title="School Performance"
              sub={selectedSchool ? `${selectedSchool} highlighted — all schools compared` : 'Submitted vs pending — all schools'}
              delay={120} style={{ marginBottom: 14 }}
              info="Each horizontal bar is one school — blue segment = submitted forms, red segment = still pending. The right table ranks all schools by completion percentage for quick comparison.">
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>

                {/* Stacked horizontal bar chart */}
                <ResponsiveContainer width="100%" height={bySchool.length * 44 + 20}>
                  <BarChart layout="vertical" data={sortedSchools}
                    margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={58}
                      tick={{ fill: C.subtle, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="sub"  name="Submitted" radius={[0, 0, 0, 0]} stackId="a">
                      {sortedSchools.map((s, i) => (
                        <Cell key={i}
                          fill={s.name === selectedSchool ? C.accent : `${C.accent}60`}
                          opacity={selectedSchool && s.name !== selectedSchool ? 0.45 : 1}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="pend" name="Pending" radius={[0, 4, 4, 0]} stackId="a">
                      {sortedSchools.map((s, i) => (
                        <Cell key={i}
                          fill="rgba(248,113,113,.25)"
                          opacity={selectedSchool && s.name !== selectedSchool ? 0.45 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Completion rate table */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: .7,
                    textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6,
                    borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    Completion Rate
                  </div>
                  {sortedSchools.map((s, i) => {
                    const pct = s.total ? s.sub / s.total : 0;
                    const { badge } = rateColor(pct);
                    const isSelected = s.name === selectedSchool;
                    return (
                      <div key={s.name}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '7px 8px', borderRadius: 6,
                          background: isSelected ? `${C.accent}0e` : 'transparent',
                          border: `1px solid ${isSelected ? `${C.accent}30` : 'transparent'}`,
                          marginBottom: 2,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: C.muted, fontFamily: "'JetBrains Mono',monospace",
                            minWidth: 14, textAlign: 'right' }}>#{i + 1}</span>
                          <span style={{ fontSize: 12,
                            color: isSelected ? C.accent : C.subtle,
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: isSelected ? 700 : 400 }}>{s.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 10, color: C.muted,
                            fontFamily: "'JetBrains Mono',monospace" }}>{s.sub}/{s.total}</span>
                          <Badge color={badge}>{Math.round(pct * 100)}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* ── Role distribution + Export ───────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Role distribution — pie chart */}
            <Card
              title="Role Distribution"
              sub={selectedSchool ? 'University-wide (role data not school-specific)' : 'Faculty breakdown by role'}
              delay={140}
              info="Donut shows how many registered users belong to each role — Faculty, HOD, Director, Dean, VC, Registrar, Non-Teaching. Admin accounts are excluded. Hover a slice for exact count.">
              {selectedSchool && (
                <div style={{
                  marginBottom: 12, padding: '8px 12px', borderRadius: 7, fontSize: 11,
                  color: C.muted, background: 'rgba(255,255,255,.03)',
                  border: '1px solid rgba(255,255,255,.07)',
                }}>
                  Role breakdown is available university-wide only.
                </div>
              )}
              {roleData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: C.muted, fontSize: 13 }}>
                  No role data
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={roleData} cx="50%" cy="50%" innerRadius={42} outerRadius={70}
                        dataKey="value" strokeWidth={0} paddingAngle={2}>
                        {roleData.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {roleData.map((r, i) => (
                      <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8,
                        padding: '5px 0',
                        borderBottom: i < roleData.length - 1 ? '1px solid var(--c-row-border)' : 'none' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%',
                          background: r.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: C.subtle, flex: 1 }}>{r.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text,
                          fontFamily: "'JetBrains Mono',monospace" }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Export reports */}
            <Card title="Export Reports" sub="Download data as CSV" delay={140}>
              {[
                { key: 'submissions', label: 'Submission Report',
                  desc: 'All declarations with current review stage', icon: I.doc  },
                { key: 'faculty',     label: 'Faculty Export',
                  desc: 'Faculty list with school, role and status',  icon: I.users },
              ].map((e, i) => (
                <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '13px 0',
                  borderBottom: i === 0 ? '1px solid var(--c-divider)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: 'var(--c-soft-bg)', border: '1px solid var(--c-divider)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <e.icon size={15} stroke={C.muted} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{e.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.desc}</div>
                    </div>
                  </div>
                  <button className="act-btn" disabled={downloading === e.key}
                    onClick={() => handleExport(e.key)}
                    style={{ ...smBtn, display: 'flex', alignItems: 'center', gap: 5,
                      opacity: downloading === e.key ? .5 : 1 }}>
                    <I.dl size={12} />
                    {downloading === e.key ? '…' : 'CSV'}
                  </button>
                </div>
              ))}

              {downloadErr && (
                <div style={{ marginTop: 12, fontSize: 12, color: C.red }}>{downloadErr}</div>
              )}

              <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 7, fontSize: 11,
                color: C.yellow, background: 'rgba(251,191,36,.07)',
                border: '1px solid rgba(251,191,36,.18)', lineHeight: 1.55 }}>
                Export endpoints are pending backend implementation. CSV buttons will activate once
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, margin: '0 3px' }}>
                  /admin/export/*
                </code>
                is deployed.
              </div>
            </Card>

          </div>
        </>
      )}
    </div>
  );
}
