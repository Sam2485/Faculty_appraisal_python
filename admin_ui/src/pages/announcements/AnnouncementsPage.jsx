import { useState } from 'react';
import { C } from '../../constants/colors';
import { inp, lbl, pBtn, oBtn } from '../../constants/styleTokens';
import { I } from '../../components/icons';
import Card from '../../components/Card';
import PageHead from '../../components/PageHead';

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [audience, setAudience] = useState('All Faculty');
  const [channel, setChannel]   = useState('In-app notification');

  return (
    <div className="page-enter">
      <PageHead title="Announcements" sub="Create notices and broadcast messages to faculty" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, alignItems: 'start' }}>
        <Card title="New Notice" delay={0}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Title</label>
            <input className="ifield" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Submission window extended" style={inp} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Target Audience</label>
            <select className="ifield" value={audience} onChange={e => setAudience(e.target.value)} style={inp}>
              <option>All Faculty</option>
              <option>HODs only</option>
              <option>Deans only</option>
              <option>Non-teaching Staff</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Channel</label>
            <select className="ifield" value={channel} onChange={e => setChannel(e.target.value)} style={inp}>
              <option>In-app notification</option>
              <option>Email</option>
              <option>Both</option>
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Message</label>
            <textarea className="ifield" value={body} onChange={e => setBody(e.target.value)}
              placeholder="Write your announcement here…" rows={5}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="act-btn" style={{ ...pBtn, opacity: 0.5, cursor: 'not-allowed' }} disabled>
              <I.send size={13} /> Publish Notice
            </button>
            <button className="act-btn" style={{ ...oBtn, opacity: 0.5, cursor: 'not-allowed' }} disabled>
              Save Draft
            </button>
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 12,
            color: '#fbbf24', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)' }}>
            Announcements API not yet available. Ask the backend developer to add a <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>POST /api/v1/admin/announcements</code> endpoint to enable publishing.
          </div>
        </Card>

        <Card title="Past Notices" delay={60}>
          <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
            No notices sent yet
          </div>
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, fontSize: 11,
            color: C.muted, background: 'rgba(255,255,255,.03)', lineHeight: 1.6 }}>
            Past notices will appear here once the announcements API is connected.
          </div>
        </Card>
      </div>
    </div>
  );
}
