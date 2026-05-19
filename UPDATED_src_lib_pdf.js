import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../types/index.js';
import { buildLeaderboard, buildActivityBreakdown, buildTeamSummary } from './stats.js';

export function exportReport(submissions) {
  const doc      = new jsPDF();
  const today    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const stats    = buildTeamSummary(submissions);
  const lb       = buildLeaderboard(submissions);
  const actBreak = buildActivityBreakdown(submissions);

  // Title
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 26);
  doc.text('Customer Advocacy App — Report', 14, 22);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${today}`, 14, 30);

  // Overview
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 26);
  doc.text('Program Overview', 14, 44);
  autoTable(doc, {
    startY: 48,
    head: [['Total Points', 'Total Reviews', 'References', 'Stories']],
    body: [[
      stats.totalPts,
      `${stats.totalReviews} / ${stats.targets.reviews} target`,
      `${stats.totalRefs} / ${stats.targets.references} target`,
      `${stats.totalStories} / ${stats.targets.stories} target`,
    ]],
    styles: { fontSize: 11, halign: 'center', cellPadding: 6 },
    headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [79, 70, 229], fontStyle: 'bold', fontSize: 14 },
    theme: 'grid',
  });

  // Leaderboard
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('CSM Leaderboard', 14, doc.lastAutoTable.finalY + 14);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [['Rank', 'CSM Name', 'Total Pts', 'Reviews', 'Activities']],
    body: lb.map((c, i) => [
      i + 1,
      c.name,
      c.pts,
      c.targets ? `${c.reviews} / ${c.targets.reviews}` : `${c.reviews} / no target`,
      c.activities,
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    columnStyles: { 0: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    theme: 'grid',
  });

  // Activity Breakdown
  if (doc.lastAutoTable.finalY > 230) doc.addPage();
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Activity Breakdown', 14, doc.lastAutoTable.finalY + 14);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [['Activity', 'Category', 'Count', 'Points']],
    body: [
      ...actBreak.map(a => [a.label, a.category, a.count, a.pts]),
      ['TOTAL', '', actBreak.reduce((s, a) => s + a.count, 0), actBreak.reduce((s, a) => s + a.pts, 0)],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' } },
    didParseCell: ({ row, cell }) => {
      if (row.index === actBreak.length) { cell.styles.fontStyle = 'bold'; cell.styles.fillColor = [241, 240, 237]; }
    },
    theme: 'grid',
  });

  // Submissions log
  doc.addPage();
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Full Submissions Log', 14, 20);
  autoTable(doc, {
    startY: 26,
    head: [['Date', 'CSM', 'Activity', 'Reviews', 'Customer', 'Context', 'Pts']],
    body: submissions
      .filter(r => !r._pending)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(r => [
        formatDate(r.date), r.csm, r.activity,
        r.reviews || '—',
        [r.customerName, r.customerEmail].filter(Boolean).join('\n') || '—',
        (r.context || '').slice(0, 30) || '—',
        r.points,
      ]),
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [45, 45, 45], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    theme: 'grid',
  });

  doc.save(`advocacy-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
