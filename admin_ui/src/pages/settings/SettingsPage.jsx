import { useState, useEffect } from 'react';
import { C } from '../../constants/colors';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { Loading, ApiError } from '../../components/LoadingState';
import { inp, lbl, pBtn } from '../../constants/styleTokens';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import Toggle from '../../components/Toggle';

const ROLES = ['Faculty', 'HOD', 'Director', 'Dean', 'Registrar', 'VC'];
const PERMS = ['View Appraisals', 'Submit Appraisal', 'Review Appraisals', 'Export Reports', 'Manage Users', 'System Settings'];
const DEFAULT_MATRIX = {
  Faculty:   [true,  true,  false, false, false, false],
  HOD:       [true,  false, true,  false, false, false],
  Director:  [true,  false, true,  false, false, false],
  Dean:      [true,  false, true,  true,  false, false],
  Registrar: [true,  false, true,  true,  false, false],
  VC:        [true,  false, true,  true,  false, false],
};

export default function SettingsPage() {
  const [tab, setTab] = useState('system');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [form, setForm] = useState({ FRONTEND_URL: '', APP_URL: '' });

  // Security toggles
  const [twoFA, setTwoFA]                   = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [auditLog, setAuditLog]             = useState(true);

  // Feature flag toggles
  const [maintenance, setMaintenance]       = useState(false);
  const [allowRegs, setAllowRegs]           = useState(true);
  const [emailNotifs, setEmailNotifs]       = useState(true);
  const [debugLog, setDebugLog]             = useState(false);

  const { data: cfg, loading, error } = useFetch(() => api.config.get(), []);

  useEffect(() => {
    if (cfg) {
      setForm({
        FRONTEND_URL: cfg.FRONTEND_URL ?? cfg.frontend_url ?? '',
        APP_URL:      cfg.APP_URL      ?? cfg.app_url      ?? '',
      });
    }
  }, [cfg]);

  const handleSave = async () => {
    setSaving(true); setSaveErr(null);
    try {
      await api.config.update(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMatrix = (role, pi) =>
    setMatrix(m => ({ ...m, [role]: m[role].map((v, i) => i === pi ? !v : v) }));

  const flagRows = [
    { l: 'Maintenance Mode',    d: 'Block all logins except admin',  v: maintenance,  s: setMaintenance  },
    { l: 'Allow Registrations', d: 'New faculty can request access', v: allowRegs,    s: setAllowRegs    },
    { l: 'Email Notifications', d: 'Send automated email reminders', v: emailNotifs,  s: setEmailNotifs  },
    { l: 'Debug Logging',       d: 'Verbose server-side logging',    v: debugLog,     s: setDebugLog     },
  ];

  return (
    <div className="page-enter">
      <PageHead title="Settings" sub="System configuration, permissions, and security" />

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {[['system', 'System Settings'], ['roles', 'Role Permissions'], ['security', 'Security']].map(([k, l]) => (
          <button key={k} className="act-btn" onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid ${tab === k ? C.accent : 'rgba(255,255,255,.08)'}`, background: tab === k ? `${C.accent}18` : 'transparent', color: tab === k ? C.accent : C.subtle, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      {error   && <ApiError message={error} />}

      {!loading && !error && tab === 'system' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="System Configuration" delay={0}>
            {[
              { l: 'Frontend URL', k: 'FRONTEND_URL', p: 'https://…' },
              { l: 'Backend URL',  k: 'APP_URL',      p: 'https://…' },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 14 }}>
                <label style={lbl}>{f.l}</label>
                <input className="ifield" value={form[f.k]} placeholder={f.p}
                  onChange={e => setForm(v => ({ ...v, [f.k]: e.target.value }))} style={inp} />
              </div>
            ))}
            {saveErr && <div style={{ fontSize: 12, color: C.red, marginBottom: 10 }}>{saveErr}</div>}
            <button className="act-btn" style={pBtn} onClick={handleSave} disabled={saving}>
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </Card>

          <Card title="Feature Flags" delay={60}>
            {flagRows.map((f, i) => (
              <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < flagRows.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{f.l}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{f.d}</div>
                </div>
                <Toggle val={f.v} onChange={f.s} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {!loading && !error && tab === 'roles' && (
        <Card title="Role Permission Matrix" sub="Check marks indicate allowed actions" delay={0}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.muted, padding: '8px 12px', letterSpacing: .8, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>Role</th>
                  {PERMS.map(p => (
                    <th key={p} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.muted, padding: '8px 10px', letterSpacing: .5, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)', whiteSpace: 'nowrap' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map(role => (
                  <tr key={role} className="tr-row">
                    <td style={{ padding: '10px 12px', fontSize: 13, color: C.text, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,.03)' }}>{role}</td>
                    {matrix[role].map((val, pi) => (
                      <td key={pi} style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                        <button onClick={() => toggleMatrix(role, pi)}
                          style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${val ? 'rgba(52,211,153,.4)' : 'rgba(255,255,255,.12)'}`, background: val ? 'rgba(52,211,153,.15)' : 'transparent', cursor: 'pointer', fontSize: 11, color: val ? C.green : 'transparent' }}>
                          ✓
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && !error && tab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title="Authentication" delay={0}>
            {[
              { l: 'Two-Factor Authentication', d: 'Require 2FA for admin login',  v: twoFA,          s: setTwoFA          },
              { l: 'Session Timeout',           d: 'Auto-logout after 30 minutes', v: sessionTimeout, s: setSessionTimeout },
              { l: 'Audit Logging',             d: 'Log all admin actions',         v: auditLog,       s: setAuditLog       },
            ].map((c, i) => (
              <div key={c.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{c.l}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.d}</div>
                </div>
                <Toggle val={c.v} onChange={c.s} />
              </div>
            ))}
          </Card>

          <Card title="Security Status" delay={60}>
            {[
              { l: '2FA',        v: twoFA          ? 'Enabled'  : 'Disabled', c: twoFA          ? 'green' : 'red'  },
              { l: 'Session',    v: sessionTimeout ? 'Active'   : 'Inactive', c: sessionTimeout ? 'green' : 'gray' },
              { l: 'Audit Logs', v: auditLog       ? 'Running'  : 'Paused',   c: auditLog       ? 'green' : 'gray' },
              { l: 'JWT Secret', v: 'Configured',                              c: 'green'                           },
              { l: 'Auth Mode',  v: 'Local JWT',                               c: 'blue'                            },
            ].map((x, i) => (
              <div key={x.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.05)' : 'none', fontSize: 13 }}>
                <span style={{ color: C.subtle }}>{x.l}</span>
                <Badge color={x.c}>{x.v}</Badge>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
