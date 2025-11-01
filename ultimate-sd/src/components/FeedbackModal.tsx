'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Star } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const feedback = mockFeedback;

  const chartData = [
    { name: 'Structure', value: feedback.structure, fill: '#8884d8' },
    { name: 'Clarity', value: feedback.clarity, fill: '#82ca9d' },
    { name: 'Trade-offs', value: feedback.tradeoffs, fill: '#ffc658' },
    { name: 'Scalability', value: feedback.scalability, fill: '#ff7c7c' },
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
    <div className="w-full">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Get Feedback
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Session Feedback</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-black">Performance Scores</h3>
                    <div className="space-y-2">
                      {Object.entries(feedback).filter(([key]) => typeof feedback[key as keyof typeof feedback] === 'number').map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className="font-medium">{value}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-semibold mb-4 text-black">Overall Score</h3>
                    <div className="text-6xl font-bold text-blue-600">{feedback.overall}</div>
                    <div className="text-sm text-gray-600">out of 10</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-black">Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-black">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-gray-700">{weakness}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-black">Actionable Tips</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.tips.map((tip, index) => (
                      <li key={index} className="text-gray-700">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={exportToPDF}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}