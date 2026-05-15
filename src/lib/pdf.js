import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, CSMS, PAYOUT_THRESHOLD, CERT_THRESHOLD } from '../types/index.js';
import { buildLeaderboard, buildActivityBreakdown, buildSummaryStats } from './stats.js';

export function exportReport(submissions) {
  const doc     = new jsPDF();
  const today   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const stats   = buildSummaryStats(submissions);
  const lb      = buildLeaderboard(submissions);
  const actBreak = buildActivityBreakdown(submissions);

  // ── Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('SPIF Advocacy Program — Report', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${today}`, 14, 30);

  // ── Overview
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text('Program Overview', 14, 44);

  autoTable(doc, {
    startY: 48,
    head: [['Total Points', 'G2 Reviews', 'Case Studies', `At Payout (${PAYOUT_THRESHOLD}+ pts)`]],
    body: [[stats.totalPts, stats.g2Reviews, stats.caseStudies, `${stats.atPayout} / ${CSMS.length}`]],
    styles: { fontSize: 12, halign: 'center', cellPadding: 7 },
    headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [79, 70, 229], fontStyle: 'bold', fontSize: 18 },
    theme: 'grid',
  });

  // ── Leaderboard
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CSM Leaderboard', 14, doc.lastAutoTable.finalY + 14);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [['Rank', 'CSM Name', 'Total Pts', 'G2 Reviews', 'Activities', 'Status']],
    body: lb.map((c, i) => {
      const status = c.pts >= CERT_THRESHOLD
        ? 'Certified'
        : c.pts >= PAYOUT_THRESHOLD
          ? 'Payout unlocked'
          : c.pts > 0
            ? `${PAYOUT_THRESHOLD - c.pts} pts needed`
            : '—';
      return [i + 1, c.csm, c.pts, c.reviews, c.activities, status];
    }),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    columnStyles: { 0: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    theme: 'grid',
  });

  // ── Activity Breakdown
  if (doc.lastAutoTable.finalY > 240) doc.addPage();
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Activity Breakdown', 14, doc.lastAutoTable.finalY + 14);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [['Activity', 'Points per Unit', 'Reviews / Count', 'Total Points']],
    body: [
      ...actBreak.map(a => [a.label, a.perReview ? `${a.points}/review` : `${a.points} flat`, a.count, a.pts]),
      ['TOTAL', '', actBreak.reduce((s, a) => s + a.count, 0), actBreak.reduce((s, a) => s + a.pts, 0)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' } },
    didParseCell: ({ row, cell }) => {
      if (row.index === actBreak.length) {
        cell.styles.fontStyle = 'bold';
        cell.styles.fillColor = [241, 240, 237];
      }
    },
    theme: 'grid',
  });

  // ── Submissions Log
  doc.addPage();
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Submissions Log', 14, 20);

  autoTable(doc, {
    startY: 26,
    head: [['Date', 'CSM', 'Activity', 'Tier', 'Reviews', 'Points', 'Notes']],
    body: submissions
      .filter(r => !r._pending)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(r => [
        formatDate(r.date),
        r.csm,
        r.activity,
        r.tier,
        r.reviews || '—',
        r.points,
        (r.notes || '').slice(0, 40) || '—',
      ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    theme: 'grid',
  });

  doc.save(`spif-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
