import { useState } from 'react';
import { C } from '../../constants/colors';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';
import Toggle from '../../components/Toggle';

export default function SecurityPage() {
  const [twoFA, setTwoFA]                   = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [auditLog, setAuditLog]             = useState(true);

  return (
    <div className="page-enter">
      <PageHead title="Security" sub="Authentication, session, and audit settings" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Authentication" delay={0}>
          {[
            { l: 'Two-Factor Authentication', d: 'Require 2FA for admin login',  v: twoFA,          s: setTwoFA          },
            { l: 'Session Timeout',           d: 'Auto-logout after 30 minutes', v: sessionTimeout, s: setSessionTimeout },
            { l: 'Audit Logging',             d: 'Log all admin actions',        v: auditLog,       s: setAuditLog       },
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
    </div>
  );
}
