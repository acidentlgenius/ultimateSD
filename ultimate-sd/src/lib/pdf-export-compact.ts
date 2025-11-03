/**
 * Compact PDF Export - Fast, scannable revision guide
 * Optimized for quick review before interviews
 */

import jsPDF from 'jspdf';
import { SystemDesignProblem } from '@/types';

const COLORS = {
  primary: [59, 130, 246],
  success: [34, 197, 94],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  text: [31, 41, 55],
  textLight: [107, 114, 128],
  border: [229, 231, 235],
  background: [249, 250, 251],
};

interface PDFExportOptions {
  problem: SystemDesignProblem;
  savedStepData: Map<string, any>;
}

export class CompactPDFExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 15;
  private contentWidth: number;
  private yPosition: number;
  private currentPage: number = 1;

  constructor(private options: PDFExportOptions) {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.yPosition = this.margin;
  }

  async export(): Promise<void> {
    try {
      this.addHeader();
      this.addContent();
      this.addFooter();
      this.addPageNumbers();
      
      const fileName = `${this.options.problem.slug}-revision-${new Date().toISOString().split('T')[0]}.pdf`;
      this.doc.save(fileName);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }

  private addPage(): void {
    this.doc.addPage();
    this.currentPage++;
    this.yPosition = this.margin + 10;
  }

  private checkPageBreak(neededHeight: number): void {
    if (this.yPosition + neededHeight > this.pageHeight - 25) {
      this.addPage();
    }
  }

  private addHeader(): void {
    // Colored header bar
    this.doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Problem title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    const title = this.options.problem.title.substring(0, 60);
    this.doc.text(title, this.margin, 12);
    
    // Difficulty badge
    const diff = this.options.problem.difficulty;
    const diffColor = diff === 'Hard' ? COLORS.danger : diff === 'Medium' ? COLORS.warning : COLORS.success;
    this.doc.setFillColor(diffColor[0], diffColor[1], diffColor[2]);
    this.doc.roundedRect(this.pageWidth - 40, 8, 30, 10, 2, 2, 'F');
    this.doc.setFontSize(8);
    this.doc.text(diff, this.pageWidth - 35, 14);
    
    // Metadata line
    this.yPosition = 32;
    this.doc.setFontSize(8);
    this.doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    const meta = `${this.options.problem.category} • ${new Date().toLocaleDateString()}`;
    this.doc.text(meta, this.margin, this.yPosition);
    
    this.yPosition = 40;
  }

  private addContent(): void {
    const phases: { [key: string]: string } = {
      requirements: 'Requirements',
      hld: 'High-Level Design',
      lld: 'Low-Level Design',
      tradeoffs: 'Trade-offs',
      scalability: 'Scalability',
    };

    for (const [phaseKey, phaseName] of Object.entries(phases)) {
      const phaseData = Array.from(this.options.savedStepData.entries()).filter(
        ([key]) => key.startsWith(phaseKey)
      );

      if (phaseData.length === 0) continue;

      this.checkPageBreak(20);
      
      // Phase header
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      this.doc.text(phaseName, this.margin, this.yPosition);
      this.yPosition += 6;
      
      // Underline
      this.doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
      this.yPosition += 5;

      phaseData.forEach(([key, data]) => {
        this.addStepContent(data);
      });

      // Add diagram for HLD/LLD
      if ((phaseKey === 'hld' || phaseKey === 'lld') && phaseData.some(([_, d]) => d.completed)) {
        this.addDiagram();
      }

      this.yPosition += 4;
    }

    // Quick summary
    this.addSummary();
  }

  private addStepContent(data: any): void {
    this.checkPageBreak(15);

    // Answers - show FULL text with proper wrapping
    if (data.listItems && data.listItems.length > 0) {
      data.listItems.forEach((item: string) => {
        // Split long items into multiple lines
        const lines = this.doc.splitTextToSize(item, this.contentWidth - 8);
        lines.forEach((line: string, idx: number) => {
          this.checkPageBreak(5);
          this.doc.setFontSize(9);
          this.doc.setFont('helvetica', 'normal');
          this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
          // Only add bullet for first line
          const prefix = idx === 0 ? '- ' : '  ';
          this.doc.text(`${prefix}${line}`, this.margin + 2, this.yPosition);
          this.yPosition += 4.5;
        });
        this.yPosition += 1; // Small gap between items
      });
    } else if (data.textInput && data.textInput.trim()) {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      // Show full text with wrapping
      const lines = this.doc.splitTextToSize(data.textInput, this.contentWidth - 4);
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin + 2, this.yPosition);
        this.yPosition += 4.5;
      });
    } else if (data.schemaData && data.schemaData.length > 0) {
      data.schemaData.forEach((entity: any) => {
        this.checkPageBreak(8);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        this.doc.text(`Table: ${entity.name} (${entity.fields?.length || 0} fields)`, this.margin + 2, this.yPosition);
        this.yPosition += 6;
        
        // Show fields
        if (entity.fields && entity.fields.length > 0) {
          entity.fields.forEach((field: any) => {
            this.checkPageBreak(5);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
            const pk = field.isPrimary ? ' [PK]' : '';
            const fk = field.isForeign ? ' [FK]' : '';
            this.doc.text(`  - ${field.name}: ${field.type}${pk}${fk}`, this.margin + 4, this.yPosition);
            this.yPosition += 4;
          });
        }
        this.yPosition += 2;
      });
    }

    // Feedback - show FULL feedback
    if (data.feedback) {
      this.checkPageBreak(15);
      this.yPosition += 2;
      
      // Score line
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      const scoreColor = data.feedback.score >= 7 ? COLORS.success : data.feedback.score >= 5 ? COLORS.warning : COLORS.danger;
      this.doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      this.doc.text(`Score: ${data.feedback.score}/10`, this.margin + 2, this.yPosition);
      this.yPosition += 6;
      
      // Weaknesses - show ALL, not just first one
      if (data.feedback.weaknesses && data.feedback.weaknesses.length > 0) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
        this.doc.text('Areas to Improve:', this.margin + 2, this.yPosition);
        this.yPosition += 5;
        
        data.feedback.weaknesses.forEach((weakness: string) => {
          const lines = this.doc.splitTextToSize(weakness, this.contentWidth - 8);
          lines.forEach((line: string, idx: number) => {
            this.checkPageBreak(5);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
            const prefix = idx === 0 ? '- ' : '  ';
            this.doc.text(`${prefix}${line}`, this.margin + 4, this.yPosition);
            this.yPosition += 4;
          });
        });
        this.yPosition += 2;
      }

      // Strengths
      if (data.feedback.strengths && data.feedback.strengths.length > 0) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        this.doc.text('Strengths:', this.margin + 2, this.yPosition);
        this.yPosition += 5;
        
        data.feedback.strengths.forEach((strength: string) => {
          const lines = this.doc.splitTextToSize(strength, this.contentWidth - 8);
          lines.forEach((line: string, idx: number) => {
            this.checkPageBreak(5);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
            const prefix = idx === 0 ? '- ' : '  ';
            this.doc.text(`${prefix}${line}`, this.margin + 4, this.yPosition);
            this.yPosition += 4;
          });
        });
        this.yPosition += 2;
      }

      // Missed points
      if (data.feedback.missed && data.feedback.missed.length > 0) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        this.doc.text('Key Points Missed:', this.margin + 2, this.yPosition);
        this.yPosition += 5;
        
        data.feedback.missed.forEach((missed: string) => {
          const lines = this.doc.splitTextToSize(missed, this.contentWidth - 8);
          lines.forEach((line: string, idx: number) => {
            this.checkPageBreak(5);
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
            this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
            const prefix = idx === 0 ? '- ' : '  ';
            this.doc.text(`${prefix}${line}`, this.margin + 4, this.yPosition);
            this.yPosition += 4;
          });
        });
      }
    }

    this.yPosition += 5;
  }

  private addDiagram(): void {
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.min(canvas.width, 800);
      tempCanvas.height = Math.min(canvas.height, 500);
      
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      const scale = Math.min(tempCanvas.width / canvas.width, tempCanvas.height / canvas.height, 1);
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      const offsetX = (tempCanvas.width - scaledWidth) / 2;
      const offsetY = (tempCanvas.height - scaledHeight) / 2;
      
      ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
      
      const imgData = tempCanvas.toDataURL('image/jpeg', 0.7);
      
      const imgWidth = this.contentWidth - 5;
      const imgHeight = Math.min((tempCanvas.height / tempCanvas.width) * imgWidth, 70);
      
      this.checkPageBreak(imgHeight + 10);
      this.yPosition += 3;
      
      this.doc.addImage(imgData, 'JPEG', this.margin + 2.5, this.yPosition, imgWidth, imgHeight);
      this.yPosition += imgHeight + 5;
    } catch (error) {
      console.warn('Diagram capture failed:', error);
    }
  }

  private addSummary(): void {
    const allSteps = Array.from(this.options.savedStepData.values());
    const completedSteps = allSteps.filter((step) => step.completed);
    const stepsWithFeedback = allSteps.filter((step) => step.feedback);

    if (stepsWithFeedback.length === 0) return;

    const avgScore = stepsWithFeedback.length > 0
      ? Math.round(stepsWithFeedback.reduce((sum, step) => sum + step.feedback.score, 0) / stepsWithFeedback.length * 10) / 10
      : 0;

    this.checkPageBreak(30);
    this.yPosition += 6;
    
    // Summary box
    this.doc.setFillColor(COLORS.background[0], COLORS.background[1], COLORS.background[2]);
    this.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    this.doc.roundedRect(this.margin, this.yPosition, this.contentWidth, 25, 2, 2, 'FD');
    
    this.yPosition += 6;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    this.doc.text('Quick Summary', this.margin + 3, this.yPosition);
    
    this.yPosition += 6;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Completed: ${completedSteps.length}/${allSteps.length}`, this.margin + 3, this.yPosition);
    
    this.doc.setFont('helvetica', 'bold');
    const scoreColor = avgScore >= 7 ? COLORS.success : avgScore >= 5 ? COLORS.warning : COLORS.danger;
    this.doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    this.doc.text(`Avg Score: ${avgScore}/10`, this.margin + 60, this.yPosition);
    
    this.yPosition += 5;
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    const tip = avgScore >= 7 ? 'Great! Review weak areas.' : 'Focus on missed points.';
    this.doc.text(tip, this.margin + 3, this.yPosition);
    
    this.yPosition += 10;

    // Top weaknesses
    const allWeaknesses: string[] = [];
    stepsWithFeedback.forEach((step) => {
      if (step.feedback.weaknesses) allWeaknesses.push(...step.feedback.weaknesses);
    });

    if (allWeaknesses.length > 0) {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
      this.doc.text('Focus On:', this.margin, this.yPosition);
      this.yPosition += 5;
      
      [...new Set(allWeaknesses)].slice(0, 5).forEach((weakness) => {
        // Show full text with wrapping
        const lines = this.doc.splitTextToSize(weakness, this.contentWidth - 6);
        lines.forEach((line: string, idx: number) => {
          this.checkPageBreak(5);
          this.doc.setFontSize(8);
          this.doc.setFont('helvetica', 'normal');
          this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
          const prefix = idx === 0 ? '- ' : '  ';
          this.doc.text(`${prefix}${line}`, this.margin + 2, this.yPosition);
          this.yPosition += 4;
        });
        this.yPosition += 1;
      });
    }
  }

  private addFooter(): void {
    // Footer is added with page numbers
  }

  private addPageNumbers(): void {
    const totalPages = this.currentPage;
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      
      const pageText = `Page ${i}/${totalPages}`;
      const textWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, (this.pageWidth - textWidth) / 2, this.pageHeight - 8);
      
      // Footer line
      this.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.pageHeight - 12, this.pageWidth - this.margin, this.pageHeight - 12);
    }
  }
}

export async function exportPracticeSession(options: PDFExportOptions): Promise<void> {
  const exporter = new CompactPDFExporter(options);
  await exporter.export();
}
