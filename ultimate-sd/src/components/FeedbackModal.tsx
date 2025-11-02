 'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Lightbulb, TrendingUp, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FeedbackData {
  structure: number;
  clarity: number;
  tradeoffs: number;
  scalability: number;
  overall: number;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
}

const mockFeedback: FeedbackData = {
  structure: 8,
  clarity: 7,
  tradeoffs: 6,
  scalability: 8,
  overall: 7,
  strengths: ['Good understanding of core concepts', 'Clear explanation of components'],
  weaknesses: ['Missed some edge cases', 'Could improve on trade-off analysis'],
  tips: ['Consider fault tolerance in distributed systems', 'Practice explaining CAP theorem applications']
};

export default function FeedbackModal() {
  const feedback = mockFeedback;
  const [animatedScores, setAnimatedScores] = useState({
    structure: 0,
    clarity: 0,
    tradeoffs: 0,
    scalability: 0,
    overall: 0
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Animate scores when modal opens
      const timer = setTimeout(() => {
        setAnimatedScores({
          structure: feedback.structure,
          clarity: feedback.clarity,
          tradeoffs: feedback.tradeoffs,
          scalability: feedback.scalability,
          overall: feedback.overall
        });
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScores({
        structure: 0,
        clarity: 0,
        tradeoffs: 0,
        scalability: 0,
        overall: 0
      });
    }
  }, [isOpen, feedback]);

  const chartData = [
    { name: 'Structure', value: feedback.structure, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500' },
    { name: 'Clarity', value: feedback.clarity, color: 'from-green-500 to-green-600', bgColor: 'bg-green-500' },
    { name: 'Trade-offs', value: feedback.tradeoffs, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-500' },
    { name: 'Scalability', value: feedback.scalability, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500' },
  ];

  const exportToPDF = async () => {
    const element = document.getElementById('feedback-content');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('ultimate-sd-session-feedback.pdf');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button suppressHydrationWarning className="w-full gradient-bg text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg flex items-center justify-center gap-2">
          <Award className="h-5 w-5" />
          Get Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Session Feedback
          </DialogTitle>
        </DialogHeader>

        <div id="feedback-content" className="p-6 space-y-6">
          {/* Overall Score Card with animation */}
          <Card className="glass border-2 border-primary/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Award className="h-6 w-6 text-primary" />
                Overall Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="text-7xl font-bold gradient-text animate-fade-in">
                    {animatedScores.overall}
                  </div>
                  <div className="absolute -top-2 -right-2 text-3xl text-primary animate-pulse">✨</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">out of 10</div>
              </div>

              {/* Animated bar charts */}
              <div className="space-y-4 mt-6">
                {chartData.map((item, index) => (
                  <div key={item.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="secondary" className="font-semibold">{item.value}/10</Badge>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ 
                          width: `${(animatedScores[item.name.toLowerCase().replace('-', '') as keyof typeof animatedScores] / 10) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths Card */}
          <Card className="glass border-2 border-green-500/20 shadow-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses Card */}
          <Card className="glass border-2 border-yellow-500/20 shadow-lg animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-800/50">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="glass border-2 border-blue-500/20 shadow-lg animate-fade-in" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Lightbulb className="h-5 w-5" />
                Actionable Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedback.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={exportToPDF} className="hover:bg-muted">
            Export PDF
          </Button>
          <Button onClick={() => setIsOpen(false)} className="gradient-bg hover:opacity-90">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}