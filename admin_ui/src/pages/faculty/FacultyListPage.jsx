import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { normalizeUsers } from '../../api/normalizers';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, pBtn } from '../../constants/styleTokens';
import { SCHOOLS } from '../../constants/schools';
import { I } from '../../components/icons';
import Badge from '../../components/Badge';
import Av from '../../components/Av';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

// ── Role config ────────────────────────────────────────────────────────────────

const ROLE_META = {
  faculty:            { label: 'Faculty',           color: C.accent  },
  hod:                { label: 'HOD',               color: '#a78bfa' },
  director:           { label: 'Director',          color: C.yellow  },
  dean:               { label: 'Dean',              color: C.green   },
  vc:                 { label: 'VC',                color: '#f472b6' },
  registrar:          { label: 'Registrar',         color: '#22d3ee' },
  non_teaching_staff: { label: 'Non-Teaching',      color: C.orange  },
  reporting_officer:  { label: 'Reporting Officer', color: '#fb923c' },
  center_head:        { label: 'Center Head',       color: '#a78bfa' },
  section_head:       { label: 'Section Head',      color: C.yellow  },
  staff:              { label: 'Staff',             color: C.muted   },
};

function roleMeta(r) {
  return ROLE_META[r] ?? { label: r ?? 'Unknown', color: C.muted };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function IndeterminateCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <input ref={ref} type="checkbox" checked={checked} onChange={onChange}
      style={{ cursor: 'pointer', accentColor: C.accent, width: 14, height: 14 }} />
  );
}

function RoleBadge({ role }) {
  const { label, color } = roleMeta(role);
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: .2,
      background: `${color}15`, color, border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  );
}

const MultiSelectDropdown = memo(function MultiSelectDropdown({ noun, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = (val) => {
    const next = new Set(selected);
    next.has(val) ? next.delete(val) : next.add(val);
    onChange(next);
  };

  const active = selected.size > 0;
  const label = active
    ? (selected.size === 1
        ? (options.find(o => selected.has(o.value))?.label ?? [...selected][0])
        : `${selected.size} ${noun}`)
    : `All ${noun}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="act-btn" onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 11px',
        borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap', minWidth: 130,
        border: `1px solid ${active ? C.accent + '55' : 'rgba(255,255,255,.1)'}`,
        background: active ? `${C.accent}10` : 'rgba(255,255,255,.04)',
        color: active ? C.accent : C.subtle,
      }}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden',
          textOverflow: 'ellipsis', maxWidth: 150 }}>{label}</span>
        <span style={{ opacity: .4, fontSize: 9 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: C.surf, border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,.7)',
          minWidth: 220, maxHeight: 320, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.muted,
              textTransform: 'uppercase', letterSpacing: .7 }}>Filter by {noun}</span>
            {active && (
              <button className="act-btn" onClick={() => onChange(new Set())}
                style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 700, padding: 0 }}>Clear</button>
            )}
          </div>
          <div style={{ overflowY: 'auto', padding: '6px 0' }}>
            {options.map(opt => (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', cursor: 'pointer',
                background: selected.has(opt.value) ? `${C.accent}14` : 'transparent',
                borderLeft: selected.has(opt.value) ? `2px solid ${C.accent}` : '2px solid transparent',
              }}>
                <input type="checkbox" checked={selected.has(opt.value)}
                  onChange={() => toggle(opt.value)}
                  style={{ accentColor: C.accent, cursor: 'pointer', width: 14, height: 14, flexShrink: 0 }} />
                {opt.dot && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%',
                    background: opt.dot, flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: 12, fontWeight: selected.has(opt.value) ? 600 : 400,
                  color: selected.has(opt.value) ? C.text : C.muted,
                }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Pagination helpers ─────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

function getPageNums(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  if (current > 3) out.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) out.push(p);
  if (current < total - 2) out.push('…');
  out.push(total);
  return out;
}

function PgBtn({ children, onClick, disabled, active }) {
  return (
    <button className="act-btn" onClick={onClick} disabled={disabled} style={{
      minWidth: 30, height: 30, padding: '0 7px', borderRadius: 7, fontSize: 12,
      fontWeight: active ? 700 : 500, cursor: disabled ? 'default' : 'pointer',
      border: `1px solid ${active ? C.accent : 'rgba(255,255,255,.1)'}`,
      background: active ? `${C.accent}20` : 'transparent',
      color: active ? C.accent : disabled ? 'rgba(255,255,255,.2)' : C.subtle,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FacultyListPage() {
  const navigate = useNavigate();
  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('All');
  const [selectedSchools, setSelectedSchools] = useState(new Set());
  const [selectedRoles,   setSelectedRoles]   = useState(new Set());
  const [tick,            setTick]            = useState(0);
  const [bulkRemoving,    setBulkRemoving]    = useState(false);
  const [removeErr,       setRemoveErr]       = useState(null);
  const [verifying,       setVerifying]       = useState(null);
  const [editing,         setEditing]         = useState(null);
  const [editForm,        setEditForm]        = useState({});
  const [saving,          setSaving]          = useState(false);
  const [saveErr,         setSaveErr]         = useState(null);
  const [selected,        setSelected]        = useState(new Set());
  const [page,            setPage]            = useState(1);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  const { data: raw, loading, error } = useFetch(() => api.users.list(), [tick]);

  // Memoize normalization — only re-runs when raw API data changes
  const users = useMemo(() => normalizeUsers(raw), [raw]);

  // Memoize filtering — only re-runs when users or filter state changes
  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(f =>
      (selectedSchools.size === 0 || selectedSchools.has(f.school)) &&
      (selectedRoles.size   === 0 || selectedRoles.has(f.role))     &&
      (statusFilter === 'All'     || f.status === statusFilter)      &&
      (!q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q))
    );
  }, [users, selectedSchools, selectedRoles, statusFilter, search]);

  // Memoize pagination — only re-runs when rows or page changes
  const { totalPages, safePage, pageRows } = useMemo(() => {
    const total = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safe  = Math.min(page, total);
    return { totalPages: total, safePage: safe, pageRows: rows.slice((safe - 1) * PAGE_SIZE, safe * PAGE_SIZE) };
  }, [rows, page]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, selectedSchools, selectedRoles, statusFilter]);

  // ── Selection ────────────────────────────────────────────────────────────────

  const visibleEmails   = pageRows.map(r => r.email);
  const selectedVisible = visibleEmails.filter(e => selected.has(e));
  const allChecked      = visibleEmails.length > 0 && selectedVisible.length === visibleEmails.length;
  const someChecked     = selectedVisible.length > 0 && !allChecked;

  const toggleRow = (email) => setSelected(prev => {
    const next = new Set(prev); next.has(email) ? next.delete(email) : next.add(email); return next;
  });
  const toggleAll = () => {
    if (allChecked) setSelected(prev => { const n = new Set(prev); visibleEmails.forEach(e => n.delete(e)); return n; });
    else            setSelected(prev => new Set([...prev, ...visibleEmails]));
  };
  const clearSelection = () => setSelected(new Set());

  // ── Edit ─────────────────────────────────────────────────────────────────────

  const startEdit = (f) => {
    setSaveErr(null);
    setEditForm({
      full_name:            f.name  === f.email ? '' : f.name,
      department:           f.dept  === '—'     ? '' : f.dept,
      school:               f.school === '—'    ? '' : f.school,
      phone:                f.phone === '—'     ? '' : f.phone,
      appraisal_role:       f.role  ?? 'faculty',
      reports_to_registrar: f.reports_to_registrar ?? false,
    });
    setEditing(f);
  };

  const saveEdit = async () => {
    setSaving(true); setSaveErr(null);
    try {
      await api.users.update(editing.email, editForm);
      setEditing(null); refresh();
    } catch (e) {
      setSaveErr(e.message);
    } finally { setSaving(false); }
  };

  // ── Verify / Remove ──────────────────────────────────────────────────────────

  const handleVerify = async (f, value) => {
    setVerifying(f.email);
    try {
      await api.users.update(f.email, { is_verified: value }); refresh();
    } catch (e) { setRemoveErr(e.message); }
    finally { setVerifying(null); }
  };

  const handleBulkRemove = async () => {
    const targets = [...selected];
    if (!targets.length) return;
    const nameList = targets.map(email => {
      const u = users.find(u => u.email === email);
      return `• ${u ? u.name : email}`;
    }).join('\n');
    if (!window.confirm(
      `Permanently delete ${targets.length} user${targets.length > 1 ? 's' : ''}?\n\n${nameList}\n\nThis cannot be undone.`
    )) return;
    setBulkRemoving(true); setRemoveErr(null);
    const results = await Promise.allSettled(targets.map(email => api.users.remove(email)));
    const failed  = results.filter(r => r.status === 'rejected');
    clearSelection();
    if (failed.length) setRemoveErr(`${failed.length} deletion(s) failed: ${failed[0].reason?.message ?? ''}`);
    refresh(); setBulkRemoving(false);
  };

  // ── Print ─────────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const printList = rows; // respects active filters
    const now = new Date().toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // Build a human-readable filter description for the print header
    const filterParts = [];
    if (selectedSchools.size > 0) filterParts.push(`School: ${[...selectedSchools].join(', ')}`);
    if (selectedRoles.size   > 0) filterParts.push(`Role: ${[...selectedRoles].map(r => roleMeta(r).label).join(', ')}`);
    if (statusFilter !== 'All')   filterParts.push(`Status: ${statusFilter}`);
    if (search)                   filterParts.push(`Search: "${search}"`);
    const filterDesc = filterParts.length ? filterParts.join(' · ') : 'All users (no filter)';

    const tableRows = printList.map((f, i) => `
      <tr class="${i % 2 ? 'alt' : ''}">
        <td class="num">${i + 1}</td>
        <td><div class="name">${f.name}</div><div class="email">${f.email}</div></td>
        <td><span class="role-badge">${roleMeta(f.role).label}</span></td>
        <td class="mono">${f.school !== '—' ? f.school : '—'}</td>
        <td>${f.dept !== '—' ? f.dept : '—'}</td>
        <td>${f.phone !== '—' ? f.phone : '—'}</td>
        <td><span class="status ${f.status === 'Active' ? 'active' : 'inactive'}">${f.status}</span></td>
      </tr>`).join('');

    const w = window.open('', '_blank', 'width=960,height=760');
    w.document.write(`<!DOCTYPE html><html><head>
      <title>User List — DYP Faculty Appraisal</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;background:#fff;font-size:12px}
        .page{padding:32px 36px}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:16px;border-bottom:2px solid #e5e7eb}
        .hdr h1{font-size:18px;font-weight:800}.hdr .inst{font-size:11px;color:#6b7280;margin-top:2px}
        .hdr-right{text-align:right;font-size:11px;color:#9ca3af}
        .filter-bar{margin-bottom:16px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:11px;color:#374151}
        .filter-bar span{font-weight:700;color:#1d4ed8}
        .chips{display:flex;gap:10px;margin-bottom:18px}
        .chip{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid}
        .c-blue{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
        .c-green{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}
        .c-yellow{background:#fffbeb;color:#b45309;border-color:#fde68a}
        table{width:100%;border-collapse:collapse}
        thead tr{background:#f9fafb;border-bottom:2px solid #e5e7eb}
        th{padding:8px 10px;font-size:9px;font-weight:700;color:#6b7280;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;text-align:left}
        td{padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
        tr.alt td{background:#fafafa}
        .num{color:#9ca3af;text-align:center;width:30px}
        .name{font-weight:700;color:#111;margin-bottom:1px}.email{font-size:10px;color:#6b7280;font-family:monospace}
        .mono{font-family:monospace;font-weight:700;color:#1d4ed8;font-size:10px}
        .role-badge{display:inline-block;padding:2px 7px;border-radius:10px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:9px;font-weight:700}
        .status{display:inline-block;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:700}
        .active{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
        .inactive{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
        .footer{margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px}
        .footer-l{font-weight:700;color:#111}.footer-r{color:#9ca3af}
        @media print{@page{margin:12mm 10mm;size:A4 landscape}body{font-size:11px}.page{padding:0}}
      </style></head><body><div class="page">
      <div class="hdr">
        <div><h1>User List Report</h1><div class="inst">DYP Faculty Appraisal System · Dr. D.Y. Patil International University</div></div>
        <div class="hdr-right"><div>Generated: ${now}</div></div>
      </div>
      <div class="filter-bar">Filter applied: <span>${filterDesc}</span></div>
      <div class="chips">
        <span class="chip c-blue">Showing: ${printList.length} of ${users.length}</span>
        <span class="chip c-green">Active: ${printList.filter(f => f.status === 'Active').length}</span>
        <span class="chip c-yellow">Unverified: ${printList.filter(f => f.status !== 'Active').length}</span>
      </div>
      <table><thead><tr>
        <th>#</th><th>Name / Email</th><th>Role</th><th>School</th><th>Department</th><th>Phone</th><th>Status</th>
      </tr></thead><tbody>${tableRows}</tbody></table>
      <div class="footer">
        <span class="footer-l">Records: ${printList.length}</span>
        <span class="footer-r">Confidential — for administrative use only</span>
      </div>
    </div></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
  };

  // ── Counts + options ─────────────────────────────────────────────────────────

  const activeCount     = users.filter(f => f.status === 'Active').length;
  const unverifiedCount = users.filter(f => f.status !== 'Active').length;
  const schoolOptions   = SCHOOLS.map(s => ({ value: s.code, label: `${s.code} — ${s.full}` }));
  const roleOptions     = Object.entries(ROLE_META).map(([value, { label, color }]) => ({ value, label, dot: color }));
  const anyFilter       = selectedSchools.size + selectedRoles.size + (statusFilter !== 'All' ? 1 : 0) + (search ? 1 : 0);

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: C.muted, letterSpacing: .5, textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,.06)', whiteSpace: 'nowrap',
  };

  return (
    <div className="page-enter">
      <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      <PageHead
        title="User List"
        sub={anyFilter > 0 ? `${rows.length} of ${users.length} shown` : 'All Users'}
      />

      {/* ── Edit drawer ─────────────────────────────────────────────────── */}
      {editing && (
        <>
          <div onClick={() => setEditing(null)} style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(3px)',
          }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh', width: 340,
            zIndex: 901, display: 'flex', flexDirection: 'column',
            background: C.surf,
            borderLeft: '1px solid rgba(255,255,255,.08)',
            boxShadow: '-20px 0 60px rgba(0,0,0,.5)',
            animation: 'drawerIn .2s ease',
          }}>
            {/* Drawer header */}
            <div style={{
              padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Edit User</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3,
                  fontFamily: "'JetBrains Mono',monospace" }}>{editing.email}</div>
              </div>
              <button className="act-btn" onClick={() => setEditing(null)} style={{
                width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)',
                background: 'transparent', cursor: 'pointer', color: C.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>×</button>
            </div>

            {/* User summary strip */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.05)',
              display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              background: 'rgba(255,255,255,.02)',
            }}>
              <Av
                init={editing.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                color={roleMeta(editing.role).color}
                size={40}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{editing.name}</div>
                <RoleBadge role={editing.role} />
              </div>
            </div>

            {/* Fields */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { l: 'Full Name',   k: 'full_name',  type: 'text' },
                  { l: 'Phone',       k: 'phone',      type: 'text' },
                  { l: 'Department',  k: 'department', type: 'text' },
                ].map(f => (
                  <div key={f.k}>
                    <label style={lbl}>{f.l}</label>
                    <input className="ifield" type={f.type} value={editForm[f.k] ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, [f.k]: e.target.value }))}
                      style={inp} />
                  </div>
                ))}

                <div>
                  <label style={lbl}>Role</label>
                  <select className="ifield" value={editForm.appraisal_role ?? 'faculty'}
                    onChange={e => setEditForm(p => ({ ...p, appraisal_role: e.target.value }))}
                    style={inp}>
                    {Object.entries(ROLE_META).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Reporting structure — non-teaching staff only */}
                {editForm.appraisal_role === 'non_teaching_staff' && (
                  <div>
                    <label style={lbl}>Reporting Structure</label>
                    <div
                      onClick={() => setEditForm(p => ({ ...p, reports_to_registrar: !p.reports_to_registrar }))}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 14px', borderRadius: 9, cursor: 'pointer',
                        background: editForm.reports_to_registrar ? 'rgba(52,211,153,.07)' : 'rgba(255,255,255,.03)',
                        border: `1.5px solid ${editForm.reports_to_registrar ? 'rgba(52,211,153,.3)' : 'rgba(255,255,255,.08)'}`,
                        transition: 'all .2s',
                      }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12,
                          color: editForm.reports_to_registrar ? C.green : C.subtle }}>
                          {editForm.reports_to_registrar ? 'Direct → Registrar' : 'Standard (via RO)'}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                          {editForm.reports_to_registrar
                            ? 'Skips Reporting Officer'
                            : 'Staff → RO → Registrar → VC'}
                        </div>
                      </div>
                      <div style={{
                        width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                        background: editForm.reports_to_registrar ? C.green : 'rgba(255,255,255,.1)',
                        border: `1.5px solid ${editForm.reports_to_registrar ? C.green : 'rgba(255,255,255,.12)'}`,
                        transition: 'all .2s',
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: editForm.reports_to_registrar ? 17 : 2,
                          width: 12, height: 12, borderRadius: '50%', background: '#fff',
                          transition: 'left .2s',
                        }} />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label style={lbl}>School</label>
                  <select className="ifield" value={editForm.school ?? ''}
                    onChange={e => setEditForm(p => ({ ...p, school: e.target.value }))}
                    style={inp}>
                    <option value="">— None —</option>
                    {SCHOOLS.map(s => <option key={s.code} value={s.code}>{s.full} ({s.code})</option>)}
                  </select>
                </div>
              </div>

              {saveErr && (
                <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 8, fontSize: 12,
                  color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
                  {saveErr}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.07)',
              display: 'flex', gap: 10, flexShrink: 0,
            }}>
              <button className="act-btn" style={{ ...pBtn, flex: 1 }}
                onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="act-btn" onClick={() => setEditing(null)} style={{
                padding: '9px 16px', background: 'transparent', color: C.muted,
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && (
        <>
          {/* ── Stat row ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Users', value: users.length,    color: C.accent },
              { label: 'Active',      value: activeCount,     color: C.green  },
              { label: 'Unverified',  value: unverifiedCount, color: C.yellow },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 10,
                background: `${s.color}0d`, border: `1px solid ${s.color}22`,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: s.color,
                  fontFamily: "'JetBrains Mono',monospace", marginLeft: 2 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {removeErr && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              color: C.red, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)' }}>
              {removeErr}
            </div>
          )}

          <Card>
            {/* ── Toolbar row 1: search + buttons ─────────────────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{ position: 'absolute', left: 10, top: '50%',
                  transform: 'translateY(-50%)', opacity: .3, pointerEvents: 'none' }}>
                  <I.search size={13} />
                </div>
                <input className="ifield" placeholder="Search by name or email…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inp, paddingLeft: 32 }} />
              </div>
              <button className="act-btn" onClick={handlePrint} disabled={rows.length === 0}
                style={{
                  padding: '8px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: rows.length === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: C.subtle, background: 'transparent',
                  border: '1px solid rgba(255,255,255,.1)',
                  opacity: rows.length === 0 ? .35 : 1,
                }}>
                <I.dl size={12} /> {anyFilter > 0 ? `Print (${rows.length})` : 'Print All'}
              </button>
              <button className="act-btn" style={{ ...pBtn }}
                onClick={() => navigate('/faculty/add')}>
                <I.addUser size={13} /> Add User
              </button>
            </div>

            {/* ── Toolbar row 2: filters + status tabs + count ────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14,
              alignItems: 'center', flexWrap: 'wrap' }}>
              <MultiSelectDropdown noun="Schools" options={schoolOptions}
                selected={selectedSchools} onChange={setSelectedSchools} />
              <MultiSelectDropdown noun="Roles" options={roleOptions}
                selected={selectedRoles} onChange={setSelectedRoles} />

              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.1)',
                margin: '0 2px', flexShrink: 0 }} />

              {['All', 'Active', 'Unverified'].map(key => {
                const count = key === 'All' ? users.length : key === 'Active' ? activeCount : unverifiedCount;
                const active = statusFilter === key;
                return (
                  <button key={key} className="act-btn" onClick={() => setStatusFilter(key)} style={{
                    padding: '6px 11px', borderRadius: 7, whiteSpace: 'nowrap',
                    fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
                    border: `1px solid ${active ? C.accent : 'rgba(255,255,255,.08)'}`,
                    background: active ? `${C.accent}15` : 'transparent',
                    color: active ? C.accent : C.subtle,
                  }}>
                    {key} <span style={{ opacity: .6 }}>({count})</span>
                  </button>
                );
              })}

              <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>
                {rows.length > PAGE_SIZE
                  ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, rows.length)} of ${rows.length} records`
                  : `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`}
              </span>
            </div>

            {/* ── Bulk bar ─────────────────────────────────────────────── */}
            {selected.size > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                padding: '9px 14px', borderRadius: 8,
                background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.18)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.red, flex: 1 }}>
                  {selected.size} user{selected.size > 1 ? 's' : ''} selected
                </span>
                <button className="act-btn" onClick={handleBulkRemove} disabled={bulkRemoving}
                  style={{
                    padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', color: C.red, background: 'rgba(248,113,113,.12)',
                    border: '1px solid rgba(248,113,113,.3)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: bulkRemoving ? .5 : 1,
                  }}>
                  <I.trash size={12} />
                  {bulkRemoving ? 'Deleting…' : `Delete ${selected.size} selected`}
                </button>
                <button className="act-btn" onClick={clearSelection} style={{
                  padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', color: C.muted, background: 'transparent',
                  border: '1px solid rgba(255,255,255,.1)',
                }}>Clear</button>
              </div>
            )}

            {/* ── Table ────────────────────────────────────────────────── */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                    <th style={{ ...thStyle, width: 42, textAlign: 'center', padding: '10px 12px' }}>
                      <IndeterminateCheckbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
                    </th>
                    <th style={{ ...thStyle }}>User</th>
                    <th style={{ ...thStyle, width: 130 }}>Role</th>
                    <th style={{ ...thStyle, width: 140 }}>School / Dept</th>
                    <th style={{ ...thStyle, width: 110 }}>Status</th>
                    <th style={{ ...thStyle, width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '44px 0', textAlign: 'center',
                        color: C.muted, fontSize: 13 }}>
                        {anyFilter > 0 ? 'No records match the current filters' : 'No users added yet'}
                      </td>
                    </tr>
                  ) : pageRows.map((f, i) => {
                    const isSelected = selected.has(f.email);
                    const rm = roleMeta(f.role);
                    const isActive = f.status === 'Active';
                    return (
                      <tr key={f.id} style={{
                        borderTop: '1px solid rgba(255,255,255,.04)',
                        background: isSelected ? 'rgba(99,102,241,.06)' : 'transparent',
                        transition: 'background .12s',
                      }}>
                        {/* Checkbox */}
                        <td style={{ padding: '13px 12px', textAlign: 'center', width: 42 }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => toggleRow(f.email)}
                            style={{ cursor: 'pointer', accentColor: C.accent, width: 14, height: 14 }} />
                        </td>

                        {/* User */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Av
                              init={f.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                              color={isActive ? rm.color : C.muted}
                              size={34}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{f.name}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 1,
                                fontFamily: "'JetBrains Mono',monospace" }}>{f.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '13px 14px' }}>
                          <RoleBadge role={f.role} />
                          {f.role === 'non_teaching_staff' && f.reports_to_registrar && (
                            <div style={{
                              marginTop: 5, fontSize: 10, fontWeight: 700,
                              color: '#22d3ee', fontFamily: "'JetBrains Mono',monospace",
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <span style={{ fontSize: 8 }}>●</span> Direct → Reg
                            </div>
                          )}
                        </td>

                        {/* School / Dept */}
                        <td style={{ padding: '13px 14px' }}>
                          {f.school !== '—' ? (
                            <>
                              <div style={{ fontSize: 12, fontWeight: 700, color: C.accent,
                                fontFamily: "'JetBrains Mono',monospace" }}>{f.school}</div>
                              {f.dept !== '—' && (
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{f.dept}</div>
                              )}
                            </>
                          ) : <span style={{ color: C.muted, fontSize: 12 }}>—</span>}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '13px 14px' }}>
                          <Badge color={isActive ? 'green' : 'red'} dot>
                            {f.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {/* Edit */}
                            <button className="act-btn" title="Edit"
                              onClick={() => startEdit(f)}
                              style={{
                                width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
                                border: `1px solid ${C.accent}28`,
                                background: `${C.accent}10`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: C.accent,
                              }}>
                              <I.edit size={13} />
                            </button>
                            {/* Activate / Deactivate */}
                            <button className="act-btn"
                              title={isActive ? 'Deactivate' : 'Activate'}
                              disabled={verifying === f.email}
                              onClick={() => handleVerify(f, !isActive)}
                              style={{
                                width: 30, height: 30, borderRadius: 7,
                                cursor: verifying === f.email ? 'default' : 'pointer',
                                border: `1px solid ${isActive ? 'rgba(251,191,36,.25)' : 'rgba(34,197,94,.25)'}`,
                                background: isActive ? 'rgba(251,191,36,.1)' : 'rgba(34,197,94,.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isActive ? C.yellow : C.green,
                                opacity: verifying === f.email ? .4 : 1,
                              }}>
                              {verifying === f.email
                                ? <span style={{ fontSize: 10 }}>…</span>
                                : <I.check size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 14, marginTop: 4, borderTop: '1px solid rgba(255,255,255,.06)',
              }}>
                <span style={{ fontSize: 12, color: C.muted }}>
                  Page {safePage} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <PgBtn onClick={() => setPage(p => p - 1)} disabled={safePage === 1}>‹</PgBtn>
                  {getPageNums(safePage, totalPages).map((p, i) =>
                    p === '…'
                      ? <span key={`e${i}`} style={{ padding: '0 4px', color: C.muted, fontSize: 13, lineHeight: '30px' }}>…</span>
                      : <PgBtn key={p} active={p === safePage} onClick={() => setPage(p)}>{p}</PgBtn>
                  )}
                  <PgBtn onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages}>›</PgBtn>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
