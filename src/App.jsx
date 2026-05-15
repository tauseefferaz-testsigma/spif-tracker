import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

const CSMS = [
  'Aarathy Sundaresan', 'Aravinda G', 'Arun S', 'Mohammed Tamiz Uddin',
  'Rama Varma', 'sakshi.bagri', 'Shabrish BM', 'Subhopriyo Sen',
  'Tauseef Feraz', 'Varun Thakur', 'Vig',
];

const ACTIVITIES = [
  { label: 'G2 Review — SMB',        pts: 10, perReview: true  },
  { label: 'G2 Review — Enterprise', pts: 20, perReview: true  },
  { label: 'Case Study',             pts: 20, perReview: false },
  { label: 'GPI',                    pts: 15, perReview: false },
];

const TIERS  = ['SMB', 'Enterprise'];
const PAYOUT = 50;
const CERT   = 200;

function calcPts(activity, reviews) {
  const a = ACTIVITIES.find(x => x.label === activity);
  if (!a) return 0;
  if (!a.perReview) return a.pts;
  const n = Number(reviews) || 0;
  return a.pts * Math.max(1, n);
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toISOString().split('T')[0];
}

const S = {
  page: { minHeight: '100vh', background: '#f7f6f2', color: '#1a1a1a' },
  header: { background: '#1a1a1a', color: '#fff', padding: '0 24px', height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16 },
  badge: { fontSize: 11, background: '#333', color: '#aaa', padding: '3px 10px',
    borderRadius: 20, marginLeft: 4, fontWeight: 500 },
  nav: { background: '#fff', borderBottom: '1px solid #e8e6e0', padding: '0 16px',
    display: 'flex', overflowX: 'auto' },
  navBtn: (active) => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '14px 18px',
    fontSize: 14, fontWeight: active ? 600 : 500, color: active ? '#1a1a1a' : '#999',
    borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent',
    whiteSpace: 'nowrap', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
  }),
  container: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
  card: { background: '#fff', border: '1px solid #e8e6e0', borderRadius: 14,
    padding: '20px 24px' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  btn: { background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'opacity 0.15s' },
  btnSecondary: { background: '#fff', color: '#1a1a1a', border: '1px solid #ddd',
    borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

function StatCard({ label, value, accent, sub }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${accent}`, padding: '18px 22px' }}>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color }) {
  const colors = {
    green:  { bg: '#e6f4ea', fg: '#1a6b2f' },
    amber:  { bg: '#fef3c7', fg: '#854f0b' },
    purple: { bg: '#f0eeff', fg: '#4a3ab5' },
    gray:   { bg: '#f1f0ed', fg: '#5a5957' },
    blue:   { bg: '#e8f1fb', fg: '#1a4f8a' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.fg,
      letterSpacing: '0.2px' }}>{children}</span>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: '#f0efe9', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%',
        transition: 'width 0.4s' }} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('submit');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    csm: '', tier: 'SMB', activity: '', reviews: '', notes: '',
  });
  const [filterCsm, setFilterCsm] = useState('All');
  const [search, setSearch] = useState('');

  async function fetchSubmissions() {
    if (!APPS_SCRIPT_URL) {
      setError('Apps Script URL not configured. See setup guide.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setError('');
    } catch (e) {
      setError('Could not load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubmissions();
    const t = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit() {
    if (!form.csm || !form.activity) {
      setError('Please pick CSM and activity.');
      return;
    }
    const activity = ACTIVITIES.find(a => a.label === form.activity);
    if (activity.perReview && (!form.reviews || Number(form.reviews) < 1)) {
      setError('Enter number of reviews for G2 Review submissions.');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      date: new Date().toISOString().split('T')[0],
      csm: form.csm,
      tier: form.tier,
      activity: form.activity,
      reviews: activity.perReview ? Number(form.reviews) : '',
      notes: form.notes,
      points: calcPts(form.activity, form.reviews),
    };
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      setSuccess(`Logged ${payload.points} pts for ${payload.csm}!`);
      setForm({ csm: '', tier: 'SMB', activity: '', reviews: '', notes: '' });
      setTimeout(() => setSuccess(''), 3500);
      setTimeout(fetchSubmissions, 1500);
    } catch (e) {
      setError('Submission failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const stats = useMemo(() => {
    const totalPts = submissions.reduce((s, r) => s + Number(r.points || 0), 0);
    const g2Reviews = submissions
      .filter(r => String(r.activity).includes('G2 Review'))
      .reduce((s, r) => s + Number(r.reviews || 1), 0);
    const caseStudies = submissions.filter(r => r.activity === 'Case Study').length;
    return { totalPts, g2Reviews, caseStudies };
  }, [submissions]);

  const leaderboard = useMemo(() => {
    const byCsm = {};
    CSMS.forEach(c => {
      byCsm[c] = { csm: c, pts: 0, reviews: 0, activities: 0 };
    });
    submissions.forEach(r => {
      if (!byCsm[r.csm]) byCsm[r.csm] = { csm: r.csm, pts: 0, reviews: 0, activities: 0 };
      byCsm[r.csm].pts += Number(r.points || 0);
      byCsm[r.csm].activities += 1;
      if (String(r.activity).includes('G2 Review')) {
        byCsm[r.csm].reviews += Number(r.reviews || 1);
      }
    });
    return Object.values(byCsm).sort((a, b) => b.pts - a.pts);
  }, [submissions]);

  const atPayout = leaderboard.filter(c => c.pts >= PAYOUT).length;

  const activityBreakdown = useMemo(() => {
    return ACTIVITIES.map(a => {
      const rows = submissions.filter(r => r.activity === a.label);
      const count = a.perReview
        ? rows.reduce((s, r) => s + Number(r.reviews || 1), 0)
        : rows.length;
      const pts = rows.reduce((s, r) => s + Number(r.points || 0), 0);
      return { activity: a.label, count, pts };
    });
  }, [submissions]);

  const filteredSubs = useMemo(() => {
    return submissions
      .filter(r => filterCsm === 'All' || r.csm === filterCsm)
      .filter(r => !search || `${r.csm} ${r.activity} ${r.notes || ''}`
        .toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [submissions, filterCsm, search]);

  function exportPDF() {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US',
      { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('SPIF Advocacy Program — Report', 14, 20);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
    doc.text(`Generated ${today}`, 14, 27);

    doc.setTextColor(0);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Overview', 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [['Total Points', 'G2 Reviews', 'Case Studies', 'At Payout']],
      body: [[String(stats.totalPts),String(stats.g2Reviews),String(stats.caseStudies),`${atPayout} / ${CSMS.length}`]],
      styles: { fontSize: 11, halign: 'center', cellPadding: 6 },
      headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: [79, 70, 229], fontStyle: 'bold', fontSize: 16 },
      theme: 'grid',
    });

    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('CSM Leaderboard', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['#', 'CSM', 'Total Pts', 'G2 Reviews', 'Activities', 'Status']],
      body: leaderboard.map((c, i) => [
        i + 1, c.csm, c.pts, c.reviews, c.activities,
        c.pts >= CERT ? 'Certified' :
          c.pts >= PAYOUT ? 'Payout unlocked' :
          c.pts > 0 ? `${PAYOUT - c.pts} pts to payout` : '—',
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [45, 45, 45], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      theme: 'grid',
    });

    if (doc.lastAutoTable.finalY > 240) doc.addPage();
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Activity Breakdown', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Activity', 'Count / Reviews', 'Total Pts']],
      body: [
        ...activityBreakdown.map(a => [a.activity, a.count, a.pts]),
        ['TOTAL',activityBreakdown.reduce((s, a) => s + a.count, 0),activityBreakdown.reduce((s, a) => s + a.pts, 0)],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [45, 45, 45], textColor: 255 },
      theme: 'grid',
      didParseCell: (data) => {
        if (data.row.index === activityBreakdown.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 240, 237];
        }
      },
    });

    doc.addPage();
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Full Submissions Log', 14, 20);
    autoTable(doc, {
      startY: 24,
      head: [['Date', 'CSM', 'Activity', 'Tier', 'Reviews', 'Pts', 'Notes']],
      body: submissions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(r => [fmtDate(r.date), r.csm, r.activity, r.tier,r.reviews || '—', r.points,(r.notes || '').slice(0, 30)]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [45, 45, 45], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 248] },
      theme: 'grid',
    });

    doc.save(`spif-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  const nav = [
    { key: 'submit',      label: 'Log activity',  icon: '✏️' },
    { key: 'dashboard',   label: 'Dashboard',     icon: '📊' },
    { key: 'leaderboard', label: 'Leaderboard',   icon: '🏆' },
    { key: 'log',         label: 'All submissions', icon: '📋' },
  ];

  if (!APPS_SCRIPT_URL) {
    return (
      <div style={S.page}>
        <div style={{ maxWidth: 600, margin: '80px auto', padding: 32, background: '#fff',
          borderRadius: 14, border: '1px solid #e8e6e0' }}>
          <h2 style={{ marginTop: 0 }}>⚙️ Setup needed</h2>
          <p>Add your Apps Script URL to Vercel environment variables.</p>
          <p><strong>Name:</strong> <code>VITE_APPS_SCRIPT_URL</code></p>
          <p><strong>Value:</strong> Your Google Apps Script Web App URL</p>
          <p>Then redeploy on Vercel.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.brand}>
          <span style={{ fontSize: 22 }}>🏅</span>
          <span>SPIF Tracker</span>
          <span style={S.badge}>Advocacy Program</span>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {loading ? 'Loading...' : `${submissions.length} submissions`}
        </div>
      </div>

      <div style={S.nav}>
        {nav.map(n => (
          <button key={n.key} onClick={() => setView(n.key)} style={S.navBtn(view === n.key)}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      <div style={S.container}>
        {error && (
          <div style={{ background: '#fdecea', color: '#9b2920', padding: '12px 16px',
            borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {view === 'submit' && (
          <div style={{ maxWidth: 560 }}>
            <div style={S.card}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Log an advocacy activity
              </div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
                Points calculate automatically.
              </div>

              {success && (
                <div style={{ background: '#e6f4ea', color: '#1a6b2f', padding: '12px 16px',
                  borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 500 }}>
                  ✅ {success}
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>CSM name</label>
                <select value={form.csm} onChange={e => setForm({ ...form, csm: e.target.value })} style={S.input}>
                  <option value="">— select —</option>
                  {CSMS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>Tier</label>
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} style={S.input}>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>Activity</label>
                <select value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} style={S.input}>
                  <option value="">— select —</option>
                  {ACTIVITIES.map(a => (<option key={a.label}>{a.label}</option>))}
                </select>
              </div>

              {form.activity && ACTIVITIES.find(a => a.label === form.activity)?.perReview && (
                <div style={{ marginBottom: 18 }}>
                  <label style={S.label}>No. of reviews</label>
                  <input type="number" min="1" value={form.reviews}
                    onChange={e => setForm({ ...form, reviews: e.target.value })}
                    placeholder="e.g. 3" style={S.input} />
                </div>
              )}

              <div style={{ marginBottom: 22 }}>
                <label style={S.label}>Notes (optional)</label>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Customer name, context, etc." style={S.input} />
              </div>

              {form.activity && (
                <div style={{ background: '#f7f6f2', padding: '14px 18px', borderRadius: 10,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: '#666' }}>Points for this submission</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#4f46e5' }}>
                    {calcPts(form.activity, form.reviews)} pts
                  </span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                style={{ ...S.btn, width: '100%', opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Live dashboard</h2>
              <button onClick={exportPDF} style={S.btnSecondary}>
                ⬇ Download PDF report
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
              <StatCard label="Total points" value={stats.totalPts} accent="#4f46e5" />
              <StatCard label="G2 reviews" value={stats.g2Reviews} accent="#059669" />
              <StatCard label="Case studies" value={stats.caseStudies} accent="#d97706" />
              <StatCard label="At payout" value={atPayout} sub={`of ${CSMS.length} CSMs`} accent="#7c3aed" />
            </div>

            <div style={{ ...S.card, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>
                Progress to payout
              </div>
              {leaderboard.map(c => (
                <div key={c.csm} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.csm}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.pts >= CERT && <Badge color="purple">Certified</Badge>}
                      {c.pts >= PAYOUT && c.pts < CERT && <Badge color="green">Payout</Badge>}
                      {c.pts < PAYOUT && c.pts > 0 && <Badge color="gray">{PAYOUT - c.pts} pts to go</Badge>}
                      {c.pts === 0 && <Badge color="gray">No activity</Badge>}
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 48, textAlign: 'right' }}>
                        {c.pts} pts
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={c.pts} max={CERT}
                    color={c.pts >= CERT ? '#7c3aed' :
                      c.pts >= PAYOUT ? '#059669' : '#4f46e5'} />
                </div>
              ))}
            </div>

            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                Activity breakdown
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f7f6f2' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 600 }}>Activity</th>
                    <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600 }}>Reviews / Count</th>
                    <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600 }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {activityBreakdown.map(a => (
                    <tr key={a.activity} style={{ borderTop: '1px solid #f0efe9' }}>
                      <td style={{ padding: '10px 12px' }}>{a.activity}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>{a.count}</td>
                      <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: '#4f46e5' }}>
                        {a.pts}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #1a1a1a', background: '#f7f6f2' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>TOTAL</td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>
                      {activityBreakdown.reduce((s, a) => s + a.count, 0)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: '#4f46e5' }}>
                      {activityBreakdown.reduce((s, a) => s + a.pts, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {leaderboard.slice(0, 3).map((c, i) => (
                <div key={c.csm} style={{ ...S.card,
                  borderTop: `3px solid ${['#f59e0b','#94a3b8','#b45309'][i]}`,
                  textAlign: 'center', padding: '22px 20px' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{['🥇','🥈','🥉'][i]}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.csm}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#4f46e5', margin: '8px 0' }}>
                    {c.pts}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>points</div>
                  {c.pts >= CERT ? <Badge color="purple">Certified</Badge>
                   : c.pts >= PAYOUT ? <Badge color="green">Payout</Badge>
                   : <Badge color="gray">{Math.max(0, PAYOUT - c.pts)} to payout</Badge>}
                </div>
              ))}
            </div>

            <div style={S.card}>
              {leaderboard.map((c, i) => (
                <div key={c.csm} style={{ display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 4px', borderBottom: i < leaderboard.length - 1 ? '1px solid #f0efe9' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#bbb', width: 24, textAlign: 'center', fontWeight: 700 }}>
                    #{i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.csm}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {c.reviews} reviews · {c.activities} activities
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ProgressBar value={c.pts} max={CERT}
                        color={c.pts >= CERT ? '#7c3aed' :
                          c.pts >= PAYOUT ? '#059669' : '#4f46e5'} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.pts >= CERT && <Badge color="purple">Certified</Badge>}
                    {c.pts >= PAYOUT && c.pts < CERT && <Badge color="green">Payout</Badge>}
                    <span style={{ fontWeight: 700, fontSize: 15, minWidth: 56, textAlign: 'right' }}>
                      {c.pts} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'log' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search CSM, activity, notes…"
                style={{ ...S.input, flex: 1, minWidth: 180 }} />
              <select value={filterCsm} onChange={e => setFilterCsm(e.target.value)}
                style={{ ...S.input, width: 220 }}>
                <option value="All">All CSMs</option>
                {CSMS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={S.card}>
              {filteredSubs.length === 0 && (
                <div style={{ padding: 20, color: '#aaa', fontSize: 13, textAlign: 'center' }}>
                  No submissions yet.
                </div>
              )}
              {filteredSubs.map((s, i) => (
                <div key={i} style={{ padding: '14px 6px',
                  borderBottom: i < filteredSubs.length - 1 ? '1px solid #f0efe9' : 'none',
                  display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{s.csm}</span>
                      <Badge color="gray">{s.tier}</Badge>
                      {s.reviews && <Badge color="blue">×{s.reviews}</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>
                      {s.activity}
                    </div>
                    {s.notes && (
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{s.notes}</div>
                    )}
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>{fmtDate(s.date)}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#4f46e5' }}>
                    +{s.points}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#aaa', textAlign: 'right' }}>
              {filteredSubs.length} of {submissions.length} submissions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
