import jsPDF from 'jspdf';
import type { InterviewSummary } from '@/lib/langgraph';

export function exportInterviewDebriefPdf(summary: InterviewSummary, problemTitle: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 18;
  let y = margin;

  doc.setFontSize(20);
  doc.text('Interview Debrief', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(problemTitle, margin, y);
  y += 12;

  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text(`Overall: ${summary.overallScore}/10 — ${summary.verdict}`, margin, y);
  y += 12;

  const addSection = (title: string, items: string[]) => {
    if (items.length === 0) return;
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += 7;
    doc.setFontSize(11);
    for (const item of items) {
      const lines = doc.splitTextToSize(`• ${item}`, 170);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    }
    y += 4;
  };

  addSection('Strengths', summary.strengths);
  addSection('Improvements', summary.improvements);

  if (summary.phaseNotes.length > 0) {
    doc.setFontSize(13);
    doc.text('Phase notes', margin, y);
    y += 7;
    doc.setFontSize(11);
    for (const note of summary.phaseNotes) {
      const line = `${note.phase}: ${note.comment}`;
      const lines = doc.splitTextToSize(line, 170);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    }
  }

  const slug = problemTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 40);
  doc.save(`${slug}-interview-debrief.pdf`);
}
