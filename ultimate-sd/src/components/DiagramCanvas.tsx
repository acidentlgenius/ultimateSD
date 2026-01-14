'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Download,
  Share,
  Sparkles,
  Eraser,
  Square,
  Circle,
  Database,
  Server,
  Cloud,
  Workflow,
  Type,
  ArrowRight,
  Move,
  Trash2,
  Grid3x3,
  Image as ImageIcon,
  Undo,
  Redo,
  Users,
  Smartphone,
  Gauge,
  Cable,
  Lock,
  Zap,
  Box,
  HardDrive,
  Binary,
  Maximize,
  Minimize,
  Upload,
  Save,
  Diamond,
  Octagon,
  Play,
  Hexagon,
  Triangle,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';

type Tool = 'select' | 'rectangle' | 'circle' | 'database' | 'server' | 'cloud' | 'text' | 'arrow' | 'line' |
  'loadbalancer' | 'cache' | 'queue' | 'client' | 'api' | 'microservice' | 'cdn' |
  'diamond' | 'parallelogram' | 'hexagon' | 'oval' | 'document' | 'cylinder';

interface DiagramElement {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color: string;
  endX?: number;
  endY?: number;
}

function SystemDesignCanvas({ stepKey }: { stepKey?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<DiagramElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'ne' | 'sw' | 'nw' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useTheme();

  // Dialog states
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [designName, setDesignName] = useState('Untitled Design');
  const [savedDesigns, setSavedDesigns] = useState<Array<{ name: string, timestamp: string }>>([]);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [pendingTextPos, setPendingTextPos] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate bounding box of all elements with padding
  const getBoundingBox = useCallback(() => {
    if (elements.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600 }; // Default size if empty
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(el => {
      if (el.type === 'arrow' || el.type === 'line') {
        // For lines and arrows, consider both start and end points
        minX = Math.min(minX, el.x, el.endX || el.x);
        minY = Math.min(minY, el.y, el.endY || el.y);
        maxX = Math.max(maxX, el.x, el.endX || el.x);
        maxY = Math.max(maxY, el.y, el.endY || el.y);
      } else if (el.type === 'text') {
        // For text, estimate width based on text length
        const textWidth = (el.text?.length || 0) * 8;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y - 20); // Text baseline offset
        maxX = Math.max(maxX, el.x + textWidth);
        maxY = Math.max(maxY, el.y);
      } else {
        // For shapes
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      }
    });

    // Add padding around the content
    const padding = 40;
    return {
      minX: Math.max(0, minX - padding),
      minY: Math.max(0, minY - padding),
      maxX: maxX + padding,
      maxY: maxY + padding
    };
  }, [elements]);

  // Expose elements data and export function to parent component
  useEffect(() => {
    (window as any).sd_getDiagramElements = () => elements;
    (window as any).sd_getBoundingBox = getBoundingBox;
    (window as any).sd_getDesignName = () => designName;
    (window as any).sd_loadDiagramElements = (newElements: DiagramElement[]) => {
      setElements(newElements);
      setHistory([newElements]);
      setHistoryIndex(0);
      setSelectedElements(new Set());
    };
    (window as any).sd_clearDiagram = (clearStorage = false, storageKey?: string) => {
      setElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedElements(new Set());
      // Clear localStorage if requested
      if (clearStorage && storageKey) {
        localStorage.removeItem(`diagram-${storageKey}`);
      }
    };
    (window as any).sd_saveToLocalStorage = (stepKey: string) => {
      // Save current elements to localStorage
      if (stepKey && elements.length > 0) {
        const diagramData = {
          elements,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(`diagram-${stepKey}`, JSON.stringify(diagramData));
      }
    };
    (window as any).sd_getDiagramDescription = () => {
      if (elements.length === 0) return null;

      const componentsWithText = elements
        .filter((el: any) => el.type !== 'arrow' && el.type !== 'line')
        .map((el: any) => {
          const type = el.type.charAt(0).toUpperCase() + el.type.slice(1);
          return el.text ? `${type}("${el.text}")` : type;
        });

      const componentCounts = elements.reduce((acc: any, el: any) => {
        if (el.type !== 'arrow' && el.type !== 'line') {
          acc[el.type] = (acc[el.type] || 0) + 1;
        }
        return acc;
      }, {});

      const summary = Object.entries(componentCounts)
        .map(([type, count]) => `${count} ${type}(s)`)
        .join(', ');

      return `Diagram contains ${elements.length} elements. Summary: ${summary}. Components: ${componentsWithText.join(', ')}`;
    };
    return () => {
      (window as any).sd_getDiagramElements = undefined;
      (window as any).sd_getBoundingBox = undefined;
      (window as any).sd_getDesignName = undefined;
      (window as any).sd_loadDiagramElements = undefined;
      (window as any).sd_clearDiagram = undefined;
      (window as any).sd_saveToLocalStorage = undefined;
    };
  }, [elements, getBoundingBox, designName]);

  const saveHistory = (newElements: DiagramElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  const getColor = () => theme === 'dark' ? '#60a5fa' : '#3b82f6';

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return;
    ctx.strokeStyle = theme === 'dark' ? '#333' : '#e5e5e5';
    ctx.lineWidth = 0.5;
    const gridSize = 20;

    // Optimization: Batch all grid lines into a single path to reduce draw calls
    // from O(width/grid + height/grid) to O(1) stroke call.
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DiagramElement, isSelected: boolean = false) => {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)';
    ctx.lineWidth = isSelected ? 3 : 2;

    if (isSelected) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }

    switch (element.type) {
      case 'rectangle':
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        break;

      case 'circle':
        ctx.beginPath();
        const radiusX = element.width / 2;
        const radiusY = element.height / 2;
        ctx.ellipse(element.x + radiusX, element.y + radiusY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'database':
        // Cylinder shape
        const dbHeight = element.height;
        const dbWidth = element.width;
        const ellipseHeight = dbHeight * 0.15;

        ctx.beginPath();
        ctx.ellipse(element.x + dbWidth / 2, element.y + ellipseHeight, dbWidth / 2, ellipseHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillRect(element.x, element.y + ellipseHeight, dbWidth, dbHeight - ellipseHeight * 2);
        ctx.beginPath();
        ctx.moveTo(element.x, element.y + ellipseHeight);
        ctx.lineTo(element.x, element.y + dbHeight - ellipseHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(element.x + dbWidth, element.y + ellipseHeight);
        ctx.lineTo(element.x + dbWidth, element.y + dbHeight - ellipseHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(element.x + dbWidth / 2, element.y + dbHeight - ellipseHeight, dbWidth / 2, ellipseHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'server':
        // Server rack shape
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        // Horizontal lines
        for (let i = 1; i < 4; i++) {
          const lineY = element.y + (element.height / 4) * i;
          ctx.beginPath();
          ctx.moveTo(element.x, lineY);
          ctx.lineTo(element.x + element.width, lineY);
          ctx.stroke();
        }
        break;

      case 'cloud':
        // Cloud shape (simplified)
        ctx.beginPath();
        ctx.arc(element.x + element.width * 0.25, element.y + element.height * 0.5, element.height * 0.3, Math.PI, 0);
        ctx.arc(element.x + element.width * 0.5, element.y + element.height * 0.3, element.height * 0.35, Math.PI, 0);
        ctx.arc(element.x + element.width * 0.75, element.y + element.height * 0.5, element.height * 0.3, Math.PI, 0);
        ctx.lineTo(element.x + element.width * 0.75, element.y + element.height);
        ctx.lineTo(element.x + element.width * 0.25, element.y + element.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'loadbalancer':
        // Load Balancer - Gauge icon style (semi-circle with needle)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const lbCx = element.x + element.width / 2;
        const lbCy = element.y + element.height / 2;
        const lbRadius = Math.min(element.width, element.height) * 0.35;

        // Draw semi-circle gauge
        ctx.beginPath();
        ctx.arc(lbCx, lbCy + lbRadius * 0.3, lbRadius, Math.PI, 0, false);
        ctx.stroke();

        // Draw tick marks
        for (let i = 0; i <= 4; i++) {
          const angle = Math.PI + (i / 4) * Math.PI;
          const startR = lbRadius * 0.85;
          const endR = lbRadius;
          ctx.beginPath();
          ctx.moveTo(lbCx + Math.cos(angle) * startR, lbCy + lbRadius * 0.3 + Math.sin(angle) * startR);
          ctx.lineTo(lbCx + Math.cos(angle) * endR, lbCy + lbRadius * 0.3 + Math.sin(angle) * endR);
          ctx.stroke();
        }

        // Draw needle pointing up-right
        const needleAngle = Math.PI * 1.25;
        ctx.beginPath();
        ctx.moveTo(lbCx, lbCy + lbRadius * 0.3);
        ctx.lineTo(lbCx + Math.cos(needleAngle) * lbRadius * 0.7, lbCy + lbRadius * 0.3 + Math.sin(needleAngle) * lbRadius * 0.7);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = isSelected ? 3 : 2;
        break;

      case 'cache':
        // Cache - Lightning bolt (Zap icon)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const cacheCx = element.x + element.width / 2;
        const cacheCy = element.y + element.height / 2;
        const zW = element.width * 0.25;
        const zH = element.height * 0.35;

        // Lightning bolt shape matching Zap icon
        ctx.beginPath();
        ctx.moveTo(cacheCx + zW * 0.3, cacheCy - zH);
        ctx.lineTo(cacheCx - zW * 0.3, cacheCy);
        ctx.lineTo(cacheCx + zW * 0.1, cacheCy + zH * 0.1);
        ctx.lineTo(cacheCx - zW * 0.3, cacheCy + zH);
        ctx.lineTo(cacheCx + zW * 0.3, cacheCy - zH * 0.1);
        ctx.lineTo(cacheCx - zW * 0.1, cacheCy - zH * 0.1);
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = isSelected ? 3 : 2;
        break;

      case 'queue':
        // Message Queue - Binary icon style (1s and 0s pattern)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const qCx = element.x + element.width / 2;
        const qCy = element.y + element.height / 2;

        // Draw binary pattern
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = element.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const binaryText = ['1 0', '0 1', '1 1'];
        binaryText.forEach((text, i) => {
          const yOffset = (i - 1) * 12;
          ctx.fillText(text, qCx, qCy + yOffset);
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        break;

      case 'client':
        // Client - Users icon (two overlapping circles with bodies)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const clientCx = element.x + element.width / 2;
        const clientCy = element.y + element.height / 2;
        const headR = element.height * 0.12;
        const offset = element.width * 0.12;

        // Left person
        ctx.beginPath();
        ctx.arc(clientCx - offset, clientCy - headR * 1.5, headR, 0, Math.PI * 2);
        ctx.stroke();
        // Left person body (arc)
        ctx.beginPath();
        ctx.arc(clientCx - offset, clientCy + headR * 2, headR * 1.8, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // Right person (overlapping)
        ctx.beginPath();
        ctx.arc(clientCx + offset, clientCy - headR * 1.5, headR, 0, Math.PI * 2);
        ctx.stroke();
        // Right person body (arc)
        ctx.beginPath();
        ctx.arc(clientCx + offset, clientCy + headR * 2, headR * 1.8, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        break;

      case 'api':
        // API Gateway - Cable icon (plug with connector)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const apiCx = element.x + element.width / 2;
        const apiCy = element.y + element.height / 2;
        const cableW = element.width * 0.15;
        const cableH = element.height * 0.3;

        // Cable connector top
        ctx.beginPath();
        ctx.moveTo(apiCx - cableW, apiCy - cableH);
        ctx.lineTo(apiCx - cableW, apiCy - cableH * 0.5);
        ctx.lineTo(apiCx + cableW, apiCy - cableH * 0.5);
        ctx.lineTo(apiCx + cableW, apiCy - cableH);
        ctx.stroke();

        // Pins
        const pinSpacing = cableW * 0.6;
        [-pinSpacing, 0, pinSpacing].forEach(xOff => {
          ctx.beginPath();
          ctx.moveTo(apiCx + xOff, apiCy - cableH * 0.5);
          ctx.lineTo(apiCx + xOff, apiCy);
          ctx.stroke();
        });

        // Cable line
        ctx.beginPath();
        ctx.moveTo(apiCx, apiCy);
        ctx.lineTo(apiCx, apiCy + cableH);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = isSelected ? 3 : 2;
        break;

      case 'microservice':
        // Microservice - Box icon (cube in 3D)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const msInset = Math.min(element.width, element.height) * 0.15;
        const msX = element.x + msInset;
        const msY = element.y + msInset;
        const msW = element.width - msInset * 2;
        const msH = element.height - msInset * 2;

        // Front face
        ctx.strokeRect(msX, msY, msW, msH);

        // 3D effect - connect corners
        ctx.beginPath();
        ctx.moveTo(element.x + msInset * 0.5, element.y + msInset * 0.5);
        ctx.lineTo(msX, msY);
        ctx.moveTo(element.x + element.width - msInset * 0.5, element.y + msInset * 0.5);
        ctx.lineTo(msX + msW, msY);
        ctx.moveTo(element.x + msInset * 0.5, element.y + element.height - msInset * 0.5);
        ctx.lineTo(msX, msY + msH);
        ctx.stroke();

        // Back edges
        ctx.beginPath();
        ctx.moveTo(element.x + msInset * 0.5, element.y + msInset * 0.5);
        ctx.lineTo(element.x + element.width - msInset * 0.5, element.y + msInset * 0.5);
        ctx.lineTo(element.x + element.width - msInset * 0.5, element.y + element.height - msInset * 0.5);
        ctx.lineTo(element.x + msInset * 0.5, element.y + element.height - msInset * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'cdn':
        // CDN - HardDrive icon (disk with lines)
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.strokeRect(element.x, element.y, element.width, element.height);

        const cdnCx = element.x + element.width / 2;
        const cdnW = element.width * 0.6;
        const cdnH = element.height * 0.15;
        const cdnTop = element.y + element.height * 0.25;

        // Top ellipse
        ctx.beginPath();
        ctx.ellipse(cdnCx, cdnTop, cdnW / 2, cdnH, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Vertical lines (sides)
        ctx.beginPath();
        ctx.moveTo(cdnCx - cdnW / 2, cdnTop);
        ctx.lineTo(cdnCx - cdnW / 2, cdnTop + element.height * 0.35);
        ctx.moveTo(cdnCx + cdnW / 2, cdnTop);
        ctx.lineTo(cdnCx + cdnW / 2, cdnTop + element.height * 0.35);
        ctx.stroke();

        // Bottom ellipse
        ctx.beginPath();
        ctx.ellipse(cdnCx, cdnTop + element.height * 0.35, cdnW / 2, cdnH, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Indicator light
        ctx.beginPath();
        ctx.arc(cdnCx - cdnW * 0.3, cdnTop + element.height * 0.175, 3, 0, Math.PI * 2);
        ctx.fillStyle = element.color;
        ctx.fill();
        break;

      case 'diamond':
        // Decision diamond (flowchart)
        ctx.beginPath();
        ctx.moveTo(element.x + element.width / 2, element.y); // Top
        ctx.lineTo(element.x + element.width, element.y + element.height / 2); // Right
        ctx.lineTo(element.x + element.width / 2, element.y + element.height); // Bottom
        ctx.lineTo(element.x, element.y + element.height / 2); // Left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'parallelogram':
        // Parallelogram (data/input-output in flowchart)
        const paraOffset = element.width * 0.15;
        ctx.beginPath();
        ctx.moveTo(element.x + paraOffset, element.y); // Top left
        ctx.lineTo(element.x + element.width, element.y); // Top right
        ctx.lineTo(element.x + element.width - paraOffset, element.y + element.height); // Bottom right
        ctx.lineTo(element.x, element.y + element.height); // Bottom left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'hexagon':
        // Hexagon (preparation/subroutine in flowchart)
        const hexOffset = element.width * 0.2;
        ctx.beginPath();
        ctx.moveTo(element.x + hexOffset, element.y); // Top left
        ctx.lineTo(element.x + element.width - hexOffset, element.y); // Top right
        ctx.lineTo(element.x + element.width, element.y + element.height / 2); // Right
        ctx.lineTo(element.x + element.width - hexOffset, element.y + element.height); // Bottom right
        ctx.lineTo(element.x + hexOffset, element.y + element.height); // Bottom left
        ctx.lineTo(element.x, element.y + element.height / 2); // Left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'oval':
        // Oval (start/end in flowchart)
        ctx.beginPath();
        ctx.ellipse(
          element.x + element.width / 2,
          element.y + element.height / 2,
          element.width / 2,
          element.height / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        break;

      case 'document':
        // Document shape (wavy bottom)
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x + element.width, element.y);
        ctx.lineTo(element.x + element.width, element.y + element.height * 0.85);

        // Wavy bottom
        const waveHeight = element.height * 0.15;
        const waveWidth = element.width / 4;
        for (let i = 0; i < 4; i++) {
          const startX = element.x + element.width - (i * waveWidth);
          const endX = startX - waveWidth;
          const controlY = i % 2 === 0 ? element.y + element.height : element.y + element.height - waveHeight;
          ctx.quadraticCurveTo(startX - waveWidth / 2, controlY, endX, element.y + element.height * 0.85);
        }

        ctx.lineTo(element.x, element.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'cylinder':
        // Cylinder (database in flowchart style)
        const cylHeight = element.height;
        const cylWidth = element.width;
        const cylEllipseHeight = cylHeight * 0.15;

        ctx.beginPath();
        ctx.ellipse(element.x + cylWidth / 2, element.y + cylEllipseHeight, cylWidth / 2, cylEllipseHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillRect(element.x, element.y + cylEllipseHeight, cylWidth, cylHeight - cylEllipseHeight * 2);
        ctx.beginPath();
        ctx.moveTo(element.x, element.y + cylEllipseHeight);
        ctx.lineTo(element.x, element.y + cylHeight - cylEllipseHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(element.x + cylWidth, element.y + cylEllipseHeight);
        ctx.lineTo(element.x + cylWidth, element.y + cylHeight - cylEllipseHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(element.x + cylWidth / 2, element.y + cylHeight - cylEllipseHeight, cylWidth / 2, cylEllipseHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'arrow':
      case 'line':
        if (element.endX !== undefined && element.endY !== undefined) {
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(element.x, element.y);
          ctx.lineTo(element.endX, element.endY);
          ctx.stroke();

          if (element.type === 'arrow') {
            // Draw arrowhead
            const angle = Math.atan2(element.endY - element.y, element.endX - element.x);
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(element.endX, element.endY);
            ctx.lineTo(
              element.endX - headLength * Math.cos(angle - Math.PI / 6),
              element.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(element.endX, element.endY);
            ctx.lineTo(
              element.endX - headLength * Math.cos(angle + Math.PI / 6),
              element.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
        break;

      case 'text':
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.fillStyle = theme === 'dark' ? '#e2e8f0' : '#1e293b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const textLines = (element.text || 'Text').split('\n');
        const lineHeight = 18;
        const totalHeight = textLines.length * lineHeight;
        const startY = element.y + element.height / 2 - totalHeight / 2 + lineHeight / 2;
        textLines.forEach((line, index) => {
          ctx.fillText(line, element.x, startY + (index * lineHeight));
        });
        break;
    }

    // Draw text label if exists
    if (element.text && element.type !== 'text' && element.type !== 'arrow' && element.type !== 'line') {
      ctx.setLineDash([]);
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillStyle = theme === 'dark' ? '#e2e8f0' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(element.text, element.x + element.width / 2, element.y + element.height / 2 + 4);
    }

    ctx.setLineDash([]);

    // Draw resize handles for selected element
    if (isSelected && element.type !== 'arrow' && element.type !== 'line' && element.type !== 'text') {
      const handleSize = 8;
      const handles = [
        { x: element.x, y: element.y }, // nw
        { x: element.x + element.width, y: element.y }, // ne
        { x: element.x, y: element.y + element.height }, // sw
        { x: element.x + element.width, y: element.y + element.height }, // se
      ];

      ctx.fillStyle = '#3b82f6'; // Blue color for handles
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
    }
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid only if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    elements.forEach(el => {
      drawElement(ctx, el, selectedElements.has(el.id));
    });
  }, [elements, selectedElements, showGrid, theme]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findElementAt = (x: number, y: number): DiagramElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'arrow' || el.type === 'line') {
        if (el.endX !== undefined && el.endY !== undefined) {
          const dist = pointToLineDistance(x, y, el.x, el.y, el.endX, el.endY);
          if (dist < 10) return el;
        }
      } else if (el.type === 'text') {
        // For text elements, check a rectangular area around the text
        // Use the actual height stored in the element (which accounts for multiple lines)
        if (x >= el.x && x <= el.x + el.width && y >= el.y - 5 && y <= el.y + el.height + 5) {
          return el;
        }
      } else {
        if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
          return el;
        }
      }
    }
    return null;
  };

  // Check if mouse is on a resize handle
  const getResizeHandle = (x: number, y: number, element: DiagramElement): 'se' | 'ne' | 'sw' | 'nw' | null => {
    if (element.type === 'arrow' || element.type === 'line' || element.type === 'text') {
      return null; // These types are not resizable
    }

    const handleSize = 8;
    const ex = element.x;
    const ey = element.y;
    const ew = element.width;
    const eh = element.height;

    // Check corner handles
    if (Math.abs(x - (ex + ew)) < handleSize && Math.abs(y - (ey + eh)) < handleSize) {
      return 'se'; // Southeast (bottom-right)
    }
    if (Math.abs(x - (ex + ew)) < handleSize && Math.abs(y - ey) < handleSize) {
      return 'ne'; // Northeast (top-right)
    }
    if (Math.abs(x - ex) < handleSize && Math.abs(y - (ey + eh)) < handleSize) {
      return 'sw'; // Southwest (bottom-left)
    }
    if (Math.abs(x - ex) < handleSize && Math.abs(y - ey) < handleSize) {
      return 'nw'; // Northwest (top-left)
    }

    return null;
  };

  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (currentTool === 'select') {
      const element = findElementAt(pos.x, pos.y);
      if (element) {
        const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;

        // Check if clicking on a resize handle (only for single selection)
        if (!isMultiSelect && selectedElements.size === 1) {
          const handle = getResizeHandle(pos.x, pos.y, element);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            setStartPos(pos);
            return;
          }
        }

        // Multi-select logic
        if (isMultiSelect) {
          const newSelected = new Set(selectedElements);
          if (newSelected.has(element.id)) {
            newSelected.delete(element.id);
          } else {
            newSelected.add(element.id);
          }
          setSelectedElements(newSelected);
        } else {
          // Single selection or start dragging
          if (!selectedElements.has(element.id)) {
            setSelectedElements(new Set([element.id]));
          }
          setDragOffset({ x: pos.x - element.x, y: pos.y - element.y });
          setIsDrawing(true);
        }
      } else {
        // Clicked on empty space - clear selection
        if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
          setSelectedElements(new Set());
        }
      }
    } else {
      setIsDrawing(true);
      setStartPos(pos);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const element = findElementAt(pos.x, pos.y);

    if (element) {
      setEditingElementId(element.id);
      setTextInput(element.text || '');
      if (element.type === 'text') {
        setShowTextDialog(true);
      } else {
        setShowLabelDialog(true);
      }
    }
  };

  const handleTextDialogSubmit = () => {
    if (editingElementId) {
      const newElements = elements.map(el => {
        if (el.id === editingElementId) {
          // Calculate dimensions for multiline text
          if (el.type === 'text') {
            const lines = textInput.split('\n');
            const maxLineLength = Math.max(...lines.map(line => line.length));
            const lineHeight = 18;

            return {
              ...el,
              text: textInput,
              width: maxLineLength * 8 || 20,
              height: lines.length * lineHeight
            };

          }
          return {
            ...el,
            text: textInput
          };

        }
        return el;
      });
      setElements(newElements);
      saveHistory(newElements);
    }
    setShowTextDialog(false);
    setShowLabelDialog(false);
    setTextInput('');
    setEditingElementId(null);
  };

  const handleTextDialogCancel = () => {
    setShowTextDialog(false);
    setShowLabelDialog(false);
    setTextInput('');
    setEditingElementId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    // Update cursor based on hover state
    if (currentTool === 'select' && !isDrawing && !isResizing) {
      const element = findElementAt(pos.x, pos.y);
      if (element) {
        const handle = getResizeHandle(pos.x, pos.y, element);
        const canvas = canvasRef.current;
        if (canvas) {
          if (handle === 'se' || handle === 'nw') {
            canvas.style.cursor = 'nwse-resize';
          } else if (handle === 'ne' || handle === 'sw') {
            canvas.style.cursor = 'nesw-resize';
          } else {
            canvas.style.cursor = 'move';
          }
        }
      } else if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }

    if (!isDrawing && !isResizing) return;

    if (isResizing && selectedElements.size === 1 && startPos && resizeHandle) {
      // Handle resizing (only for single selection)
      const selectedId = Array.from(selectedElements)[0];
      const newElements = elements.map(el => {
        if (el.id === selectedId) {
          const dx = pos.x - startPos.x;
          const dy = pos.y - startPos.y;
          let newX = el.x;
          let newY = el.y;
          let newWidth = el.width;
          let newHeight = el.height;

          switch (resizeHandle) {
            case 'se': // Bottom-right
              newWidth = Math.max(20, el.width + dx);
              newHeight = Math.max(20, el.height + dy);
              break;
            case 'sw': // Bottom-left
              newWidth = Math.max(20, el.width - dx);
              newHeight = Math.max(20, el.height + dy);
              newX = el.x + (el.width - newWidth);
              break;
            case 'ne': // Top-right
              newWidth = Math.max(20, el.width + dx);
              newHeight = Math.max(20, el.height - dy);
              newY = el.y + (el.height - newHeight);
              break;
            case 'nw': // Top-left
              newWidth = Math.max(20, el.width - dx);
              newHeight = Math.max(20, el.height - dy);
              newX = el.x + (el.width - newWidth);
              newY = el.y + (el.height - newHeight);
              break;
          }

          return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
        }
        return el;
      });
      setElements(newElements);
      setStartPos(pos); // Update start position for continuous resizing
    } else if (currentTool === 'select' && selectedElements.size > 0 && dragOffset) {
      // Drag multiple selected elements together
      const firstSelectedElement = elements.find(el => selectedElements.has(el.id));
      if (firstSelectedElement) {
        const dx = pos.x - dragOffset.x - firstSelectedElement.x;
        const dy = pos.y - dragOffset.y - firstSelectedElement.y;

        const newElements = elements.map(el => {
          if (selectedElements.has(el.id)) {
            if (el.type === 'arrow' || el.type === 'line') {
              return {
                ...el,
                x: el.x + dx,
                y: el.y + dy,
                endX: (el.endX || el.x) + dx,
                endY: (el.endY || el.y) + dy
              };

            }
            return { ...el, x: el.x + dx, y: el.y + dy };
          }
          return el;
        });
        setElements(newElements);
      }
    } else if (startPos && (currentTool === 'arrow' || currentTool === 'line')) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      redraw();
      ctx.strokeStyle = getColor();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      if (currentTool === 'arrow') {
        const angle = Math.atan2(pos.y - startPos.y, pos.x - startPos.x);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headLength * Math.cos(angle - Math.PI / 6), pos.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - headLength * Math.cos(angle + Math.PI / 6), pos.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && !isResizing) return;

    if (isResizing) {
      // Save history after resizing
      saveHistory(elements);
      setIsResizing(false);
      setResizeHandle(null);
      setStartPos(null);
    } else if (currentTool !== 'select' && startPos) {
      const pos = getMousePos(e);
      const newElement: DiagramElement = {
        id: Date.now().toString(),
        type: currentTool,
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(pos.x - startPos.x) || 100,
        height: Math.abs(pos.y - startPos.y) || 60,
        color: getColor(),
      };


      if (currentTool === 'arrow' || currentTool === 'line') {
        newElement.x = startPos.x;
        newElement.y = startPos.y;
        newElement.endX = pos.x;
        newElement.endY = pos.y;
        newElement.width = 0;
        newElement.height = 0;
      }

      if (currentTool === 'text') {
        // Store position and show dialog
        setPendingTextPos({ x: startPos.x, y: startPos.y });
        setTextInput('');
        setShowTextDialog(true);
        setIsDrawing(false);
        setStartPos(null);
        setDragOffset(null);
        return;
      }

      const newElements = [...elements, newElement];
      setElements(newElements);
      saveHistory(newElements);
      setCurrentTool('select');
    } else if (currentTool === 'select' && selectedElements.size > 0) {
      saveHistory(elements);
    }

    setIsDrawing(false);
    setStartPos(null);
    setDragOffset(null);
  };

  const handleCreateTextElement = () => {
    if (textInput && pendingTextPos) {
      // Calculate dimensions for multiline text
      const lines = textInput.split('\n');
      const maxLineLength = Math.max(...lines.map(line => line.length));
      const lineHeight = 18;

      const newElement: DiagramElement = {
        id: Date.now().toString(),
        type: 'text',
        x: pendingTextPos.x,
        y: pendingTextPos.y,
        width: maxLineLength * 8, // Width based on longest line
        height: lines.length * lineHeight, // Height based on number of lines
        color: getColor(),
        text: textInput,
      };


      const newElements = [...elements, newElement];
      setElements(newElements);
      saveHistory(newElements);
    }

    setShowTextDialog(false);
    setTextInput('');
    setPendingTextPos(null);
    setCurrentTool('select');
  };

  const deleteSelected = () => {
    if (selectedElements.size > 0) {
      const newElements = elements.filter(el => !selectedElements.has(el.id));
      setElements(newElements);
      saveHistory(newElements);
      setSelectedElements(new Set());
    }
  };

  const bringForward = () => {
    if (selectedElements.size !== 1) return;

    const selectedId = Array.from(selectedElements)[0];
    const currentIndex = elements.findIndex(el => el.id === selectedId);

    if (currentIndex < elements.length - 1) {
      const newElements = [...elements];
      // Swap with next element (move forward)
      [newElements[currentIndex], newElements[currentIndex + 1]] =
        [newElements[currentIndex + 1], newElements[currentIndex]];
      setElements(newElements);
      saveHistory(newElements);
    }
  };

  const sendBackward = () => {
    if (selectedElements.size !== 1) return;

    const selectedId = Array.from(selectedElements)[0];
    const currentIndex = elements.findIndex(el => el.id === selectedId);

    if (currentIndex > 0) {
      const newElements = [...elements];
      // Swap with previous element (move backward)
      [newElements[currentIndex], newElements[currentIndex - 1]] =
        [newElements[currentIndex - 1], newElements[currentIndex]];
      setElements(newElements);
      saveHistory(newElements);
    }
  };

  const bringToFront = () => {
    if (selectedElements.size !== 1) return;

    const selectedId = Array.from(selectedElements)[0];
    const selectedElement = elements.find(el => el.id === selectedId);

    if (selectedElement) {
      const newElements = elements.filter(el => el.id !== selectedId);
      newElements.push(selectedElement); // Add to end (top)
      setElements(newElements);
      saveHistory(newElements);
    }
  };

  const sendToBack = () => {
    if (selectedElements.size !== 1) return;

    const selectedId = Array.from(selectedElements)[0];
    const selectedElement = elements.find(el => el.id === selectedId);

    if (selectedElement) {
      const newElements = elements.filter(el => el.id !== selectedId);
      newElements.unshift(selectedElement); // Add to beginning (bottom)
      setElements(newElements);
      saveHistory(newElements);
    }
  };

  const clearCanvas = () => {
    setShowClearDialog(true);
  };

  const handleClearConfirm = () => {
    setElements([]);
    saveHistory([]);
    setSelectedElements(new Set());
    setShowClearDialog(false);

    // Immediately clear localStorage for this step
    if (stepKey) {
      localStorage.removeItem(`diagram-${stepKey}`);
    }
  };

  const addTextToSelected = () => {
    if (selectedElements.size === 1) {
      const selectedId = Array.from(selectedElements)[0];
      const element = elements.find(el => el.id === selectedId);
      if (element) {
        setEditingElementId(selectedId);
        setTextInput(element.text || '');
        setShowLabelDialog(true);
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);

      // Wait for React to render the fullscreen div
      await new Promise(resolve => setTimeout(resolve, 50));

      // Enter native fullscreen
      if (fullscreenRef.current) {
        try {
          if (fullscreenRef.current.requestFullscreen) {
            await fullscreenRef.current.requestFullscreen();
          } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
            await (fullscreenRef.current as any).webkitRequestFullscreen();
          } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
            await (fullscreenRef.current as any).mozRequestFullScreen();
          } else if ((fullscreenRef.current as any).msRequestFullscreen) {
            await (fullscreenRef.current as any).msRequestFullscreen();
          }
        } catch (err) {
          console.error('Error entering fullscreen:', err);
        }
      }
    } else {
      // Exit native fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  };

  const saveDiagramFile = () => {
    if (elements.length === 0) {
      // Show empty diagram notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Your diagram is empty! Nothing to save.</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }

    const diagramData = {
      version: '1.0',
      type: 'system-design-diagram',
      name: designName,
      timestamp: new Date().toISOString(),
      elements: elements,
      settings: {
        showGrid: showGrid
      }
    };

    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = designName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `${fileName}-${Date.now()}.sdd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Diagram saved successfully! (${elements.length} elements)</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const loadDiagramFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.endsWith('.sdd')) {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Invalid file format! Please select a .sdd file.</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const diagramData = JSON.parse(content);

        // Validate file structure
        if (diagramData.type !== 'system-design-diagram' || !diagramData.elements || !Array.isArray(diagramData.elements)) {
          throw new Error('Invalid diagram file structure');
        }

        // Load elements
        setElements(diagramData.elements);
        saveHistory(diagramData.elements);
        setSelectedElements(new Set());

        // Load design name if available
        if (diagramData.name) {
          setDesignName(diagramData.name);
        }

        // Load settings if available
        if (diagramData.settings && typeof diagramData.settings.showGrid === 'boolean') {
          setShowGrid(diagramData.settings.showGrid);
        }

        // Show success notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
        toast.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Diagram loaded successfully! (${diagramData.elements.length} elements)</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } catch (error) {
        console.error('Error loading diagram:', error);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
        toast.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Failed to load diagram! Invalid file format.</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be loaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save design to localStorage
  const saveDesignToLocalStorage = () => {
    if (elements.length === 0) {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `<div class="flex items-center gap-2">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Your diagram is empty! Nothing to save.</span>
      </div>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }

    const diagramData = {
      version: '1.0',
      type: 'system-design-diagram',
      name: designName,
      timestamp: new Date().toISOString(),
      elements: elements,
      settings: { showGrid }
    };

    // Save to localStorage with design name as key
    const storageKey = `saved-design-${designName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    localStorage.setItem(storageKey, JSON.stringify(diagramData));

    // Update saved designs list
    const savedDesignsList = JSON.parse(localStorage.getItem('saved-designs-list') || '[]');
    const existingIndex = savedDesignsList.findIndex((d: any) => d.name === designName);

    if (existingIndex >= 0) {
      savedDesignsList[existingIndex].timestamp = diagramData.timestamp;
    } else {
      savedDesignsList.push({ name: designName, timestamp: diagramData.timestamp });
    }

    localStorage.setItem('saved-designs-list', JSON.stringify(savedDesignsList));
    loadSavedDesignsList();

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
    toast.innerHTML = `<div class="flex items-center gap-2">
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>"${designName}" saved successfully!</span>
    </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    setShowSaveDialog(false);
  };

  // Load design from localStorage
  const loadDesignFromLocalStorage = (name: string) => {
    const storageKey = `saved-design-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    const savedData = localStorage.getItem(storageKey);

    if (!savedData) {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `<div class="flex items-center gap-2">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Design not found!</span>
      </div>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }

    try {
      const diagramData = JSON.parse(savedData);
      setElements(diagramData.elements);
      saveHistory(diagramData.elements);
      setSelectedElements(new Set());
      setDesignName(diagramData.name || name);

      if (diagramData.settings && typeof diagramData.settings.showGrid === 'boolean') {
        setShowGrid(diagramData.settings.showGrid);
      }

      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `<div class="flex items-center gap-2">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>"${name}" loaded successfully!</span>
      </div>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      setShowLoadDialog(false);
    } catch (error) {
      console.error('Error loading design:', error);
    }
  };

  // Load saved designs list
  const loadSavedDesignsList = () => {
    const savedDesignsList = JSON.parse(localStorage.getItem('saved-designs-list') || '[]');
    setSavedDesigns(savedDesignsList);
  };

  // Delete design from localStorage
  const deleteDesignFromLocalStorage = (name: string) => {
    const storageKey = `saved-design-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    localStorage.removeItem(storageKey);

    const savedDesignsList = JSON.parse(localStorage.getItem('saved-designs-list') || '[]');
    const filtered = savedDesignsList.filter((d: any) => d.name !== name);
    localStorage.setItem('saved-designs-list', JSON.stringify(filtered));
    loadSavedDesignsList();
  };

  // Load designs list on mount
  useEffect(() => {
    loadSavedDesignsList();
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      // Bring forward: Cmd/Ctrl + ]
      else if (cmdOrCtrl && e.key === ']') {
        e.preventDefault();
        bringForward();
      }
      // Send backward: Cmd/Ctrl + [
      else if (cmdOrCtrl && e.key === '[') {
        e.preventDefault();
        sendBackward();
      }
      // Bring to front: Cmd/Ctrl + Shift + ]
      else if (cmdOrCtrl && e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringToFront();
      }
      // Send to back: Cmd/Ctrl + Shift + [
      else if (cmdOrCtrl && e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendToBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, elements]);

  // Portal for design name section to render in parent component
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById('design-name-portal');
    setPortalContainer(container);
  }, []);

  const designNameSection = (
    <div className="flex items-center gap-1.5">
      <Input
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
        className="h-7 text-xs w-40"
        placeholder="Design name..."
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowSaveDialog(true)}
        className="h-7 w-7 p-0"
        title="Save to Browser"
      >
        <Save className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          loadSavedDesignsList();
          setShowLoadDialog(true);
        }}
        className="h-7 w-7 p-0"
        title="Load Saved Design"
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div
      ref={fullscreenRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative w-full h-full'} flex flex-col`}
    >
      {/* Render design name section in portal (parent component's header) */}
      {portalContainer && !isFullscreen && createPortal(designNameSection, portalContainer)}

      {/* Text Input Dialog */}
      <Dialog open={showTextDialog} onOpenChange={(open) => {
        if (!open) handleTextDialogCancel();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingElementId ? 'Edit Text' : 'Enter Text'}</DialogTitle>
            <DialogDescription>
              {editingElementId ? 'Update the text content' : 'Type the text you want to add to the diagram'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter text... (Shift+Enter for new line)"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (editingElementId) {
                    handleTextDialogSubmit();
                  } else {
                    handleCreateTextElement();
                  }
                }
                // Shift+Enter will naturally create a new line in textarea
              }}
              rows={4}
              className="resize-none"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleTextDialogCancel}>
              Cancel
            </Button>
            <Button onClick={editingElementId ? handleTextDialogSubmit : handleCreateTextElement}>
              {editingElementId ? 'Update' : 'Add Text'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Label Input Dialog */}
      <Dialog open={showLabelDialog} onOpenChange={(open) => {
        if (!open) handleTextDialogCancel();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Label</DialogTitle>
            <DialogDescription>
              Add or update a label for the selected element
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter label..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextDialogSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleTextDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleTextDialogSubmit}>
              Update Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Elements?</DialogTitle>
            <DialogDescription>
              This will remove all elements from your diagram. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearConfirm}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Design Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
            <DialogDescription>
              Save "{designName}" to your browser's local storage for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">Design will be saved as:</p>
            <p className="text-sm font-semibold">{designName}</p>
            <p className="text-xs text-muted-foreground mt-2">
              You can change the name above before saving.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveDesignToLocalStorage}>
              Save to Browser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Design Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Design</DialogTitle>
            <DialogDescription>
              Choose a previously saved design from your browser's local storage.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-auto">
            {savedDesigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No saved designs found.</p>
                <p className="text-xs mt-1">Create and save a design to see it here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedDesigns.map((design) => (
                  <div
                    key={design.name}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{design.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Saved: {new Date(design.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadDesignFromLocalStorage(design.name)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${design.name}"?`)) {
                            deleteDesignFromLocalStorage(design.name);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sdd"
        onChange={loadDiagramFile}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 border-b border-border flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-border">
          <Button
            size="sm"
            variant={currentTool === 'select' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('select')}
            className="h-8 w-8 p-0"
            title="Select & Move (V)"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('rectangle')}
            className="h-8 w-8 p-0"
            title="Rectangle - Generic Component (R)"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'circle' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('circle')}
            className="h-8 w-8 p-0"
            title="Circle - Process/Node (C)"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'database' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('database')}
            className="h-8 w-8 p-0"
            title="Database - SQL/NoSQL Storage (D)"
          >
            <Database className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'server' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('server')}
            className="h-8 w-8 p-0"
            title="Server - Application Server (S)"
          >
            <Server className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'cloud' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('cloud')}
            className="h-8 w-8 p-0"
            title="Cloud - Cloud Service/Infrastructure"
          >
            <Cloud className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'arrow' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('arrow')}
            className="h-8 w-8 p-0"
            title="Arrow - Data Flow Direction (A)"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'line' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('line')}
            className="h-8 w-8 p-0"
            title="Line - Connection/Link (L)"
          >
            <Workflow className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'text' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('text')}
            className="h-8 w-8 p-0"
            title="Text - Label/Annotation (T)"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* System Design Components */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-border">
          <Button
            size="sm"
            variant={currentTool === 'loadbalancer' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('loadbalancer')}
            className="h-8 w-8 p-0"
            title="Load Balancer - Distributes Traffic"
          >
            <Gauge className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'cache' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('cache')}
            className="h-8 w-8 p-0"
            title="Cache - Redis/Memcached"
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'queue' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('queue')}
            className="h-8 w-8 p-0"
            title="Message Queue - Kafka/RabbitMQ/SQS"
          >
            <Binary className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'client' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('client')}
            className="h-8 w-8 p-0"
            title="Client - User/Mobile/Web App"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'api' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('api')}
            className="h-8 w-8 p-0"
            title="API Gateway - REST/GraphQL Endpoint"
          >
            <Cable className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'microservice' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('microservice')}
            className="h-8 w-8 p-0"
            title="Microservice - Service Component"
          >
            <Box className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'cdn' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('cdn')}
            className="h-8 w-8 p-0"
            title="CDN - Content Delivery Network"
          >
            <HardDrive className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Flowchart Components */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-border">
          <Button
            size="sm"
            variant={currentTool === 'diamond' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('diamond')}
            className="h-8 w-8 p-0"
            title="Diamond - Decision (Flowchart)"
          >
            <Diamond className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'oval' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('oval')}
            className="h-8 w-8 p-0"
            title="Oval - Start/End (Flowchart)"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'parallelogram' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('parallelogram')}
            className="h-8 w-8 p-0"
            title="Parallelogram - Input/Output (Flowchart)"
          >
            <Hexagon className="h-4 w-4" style={{ transform: 'skew(-10deg)' }} />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'hexagon' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('hexagon')}
            className="h-8 w-8 p-0"
            title="Hexagon - Preparation (Flowchart)"
          >
            <Hexagon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'document' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('document')}
            className="h-8 w-8 p-0"
            title="Document - Report/Document (Flowchart)"
          >
            <Square className="h-4 w-4" style={{ borderRadius: '0 0 8px 8px' }} />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'cylinder' ? 'default' : 'ghost'}
            onClick={() => setCurrentTool('cylinder')}
            className="h-8 w-8 p-0"
            title="Cylinder - Database (Flowchart)"
          >
            <Database className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="h-8 w-8 p-0"
            title="Undo (Cmd+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="h-8 w-8 p-0"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={saveDiagramFile}
            className="h-8 px-2"
            title="Download as File (.sdd)"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-2"
            title="Import from File (.sdd)"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowGrid(!showGrid)}
            className="h-8 w-8 p-0"
            title="Toggle Grid"
          >
            <Grid3x3 className={`h-4 w-4 ${showGrid ? 'text-primary' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={addTextToSelected}
            disabled={selectedElements.size !== 1}
            className="h-8 px-2"
            title="Add Label"
          >
            <Type className="h-4 w-4 mr-1" />
            Label
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Z-Order Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={bringToFront}
            disabled={selectedElements.size !== 1}
            className="h-8 w-8 p-0"
            title="Bring to Front (Cmd+Shift+])"
          >
            <ChevronsUp className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={bringForward}
            disabled={selectedElements.size !== 1}
            className="h-8 w-8 p-0"
            title="Bring Forward (Cmd+])"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={sendBackward}
            disabled={selectedElements.size !== 1}
            className="h-8 w-8 p-0"
            title="Send Backward (Cmd+[)"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={sendToBack}
            disabled={selectedElements.size !== 1}
            className="h-8 w-8 p-0"
            title="Send to Back (Cmd+Shift+[)"
          >
            <ChevronsDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={deleteSelected}
            disabled={selectedElements.size === 0}
            className="h-8 w-8 p-0"
            title="Delete (Del)"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearCanvas}
            className="h-8 px-2"
            title="Clear All"
          >
            <Eraser className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="ml-auto text-xs text-muted-foreground">
          {selectedElements.size > 0
            ? `${selectedElements.size} selected • ${selectedElements.size === 1 ? 'Drag to move • Drag corners to resize • Double-click to edit' : 'Drag to move all • Shift/Cmd+Click to multi-select'}`
            : `${currentTool === 'select' ? 'Select mode • Shift/Cmd+Click for multi-select' : `Draw ${currentTool}`} • Click and drag`}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-muted/10 to-muted/5 p-4">
        <div className="w-full h-full flex items-start justify-center">
          <canvas
            ref={canvasRef}
            width={2000}
            height={1200}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="border-2 border-border/50 rounded-lg bg-white shadow-xl"
            style={{ cursor: currentTool === 'select' ? 'default' : 'crosshair' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DiagramCanvas({ stepKey }: { stepKey: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-save to localStorage whenever elements change
  useEffect(() => {
    if (stepKey && mounted) {
      const saveInterval = setInterval(() => {
        const elements = (window as any).sd_getDiagramElements?.();
        if (elements) {
          if (elements.length > 0) {
            // Save diagram data if there are elements
            const diagramData = {
              elements,
              timestamp: new Date().toISOString()
            };

            localStorage.setItem(`diagram-${stepKey}`, JSON.stringify(diagramData));
          } else {
            // Clear localStorage if diagram is empty (user cleared it)
            localStorage.removeItem(`diagram-${stepKey}`);
          }
        }
      }, 1000); // Auto-save every second

      return () => clearInterval(saveInterval);
    }
  }, [stepKey, mounted]);

  // Load diagram data for this step when stepKey changes
  useEffect(() => {
    if (stepKey && mounted) {
      const savedData = localStorage.getItem(`diagram-${stepKey}`);
      if (savedData) {
        try {
          const diagramData = JSON.parse(savedData);
          // Load the diagram data into the canvas
          if ((window as any).sd_loadDiagramElements) {
            (window as any).sd_loadDiagramElements(diagramData.elements || []);
          }
        } catch (error) {
          console.error('Error loading diagram data:', error);
        }
      } else {
        // Clear canvas for new step
        if ((window as any).sd_clearDiagram) {
          (window as any).sd_clearDiagram();
        }
      }
    }
  }, [stepKey, mounted]);

  const exportPNG = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get bounding box of all elements
    const getBoundingBox = (window as any).sd_getBoundingBox;
    const elements = (window as any).sd_getDiagramElements?.();

    if (!getBoundingBox || !elements || elements.length === 0) {
      // Show empty diagram notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Your diagram is empty! Please add some components first.</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
      return;
    }

    const bounds = getBoundingBox();
    const cropWidth = Math.ceil(bounds.maxX - bounds.minX);
    const cropHeight = Math.ceil(bounds.maxY - bounds.minY);

    // Create a temporary canvas with the cropped size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      // Fill with white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, cropWidth, cropHeight);

      // Copy only the relevant portion of the canvas
      tempCtx.drawImage(
        canvas,
        bounds.minX, bounds.minY, cropWidth, cropHeight, // Source rectangle
        0, 0, cropWidth, cropHeight // Destination rectangle
      );

      // Download
      const link = document.createElement('a');
      const getDesignName = (window as any).sd_getDesignName;
      const currentDesignName = getDesignName ? getDesignName() : 'system-diagram';
      const fileName = currentDesignName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${fileName}-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();

      // Show success message with dimensions
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Diagram exported! (${cropWidth}×${cropHeight}px)</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }, []);

  const getDiagramData = useCallback(() => {
    // Get the canvas and extract diagram elements
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    // We need to access the elements from the SystemDesignCanvas component
    // Since we can't directly access the state, we'll try to extract from the canvas
    // For now, return a placeholder that indicates diagram was created
    return {
      hasDiagram: true,
      description: 'System architecture diagram was created during this phase',
      timestamp: new Date().toISOString()
    };
  }, []);

  const handleShareWithAI = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      // Show error notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No diagram found. Please draw something first!</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
      return;
    }

    // Get diagram elements
    const elements = (window as any).sd_getDiagramElements?.();
    if (!elements || elements.length === 0) {
      // Show empty diagram notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Your diagram is empty! Please add some components first.</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
      return;
    }

    try {
      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png');

      // Create a description of the diagram including text labels
      const componentsWithText = elements
        .filter((el: any) => el.type !== 'arrow' && el.type !== 'line')
        .map((el: any) => {
          const type = el.type.charAt(0).toUpperCase() + el.type.slice(1);
          return el.text ? `${type}("${el.text}")` : type;
        });

      const componentCounts = elements.reduce((acc: any, el: any) => {
        if (el.type !== 'arrow' && el.type !== 'line') {
          acc[el.type] = (acc[el.type] || 0) + 1;
        }
        return acc;
      }, {});

      const summary = Object.entries(componentCounts)
        .map(([type, count]) => `${count} ${type}(s)`)
        .join(', ');

      const description = `Diagram contains ${elements.length} elements. Summary: ${summary}. Components: ${componentsWithText.join(', ')}`;

      const uniqueComponents = [...new Set(elements.map((el: any) => el.type).filter((t: string) => t !== 'arrow' && t !== 'line'))];

      // Save diagram data to localStorage for this step
      if (stepKey) {
        const diagramData = {
          imageData,
          elements,
          description,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem(`diagram-${stepKey}`, JSON.stringify(diagramData));
      }

      // Dispatch custom event with diagram data
      const event = new CustomEvent('sd-diagram-shared', {
        detail: {
          imageData,
          elements,
          description,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);

      // Show success message
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md shadow-xl border-2 border-primary/30">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-full bg-green-500/10">
              <svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold mb-2">Diagram Captured!</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Your diagram has been saved. Now describe your architecture in the chat, 
                and the AI will provide feedback on both your description and diagram!
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                <strong>Components detected:</strong> ${uniqueComponents.join(', ')}
              </p>
              <button 
                onclick="this.closest('.fixed').remove()" 
                class="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Auto-close after 8 seconds
      setTimeout(() => {
        if (modal.parentElement) {
          modal.remove();
        }
      }, 8000);

    } catch (error) {
      console.error('Error sharing diagram:', error);
      // Show error notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Failed to capture diagram. Please try again.</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }, []);

  if (!mounted) {
    return (
      <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-2">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-2 overflow-hidden">
      <div className="glass p-2 border-b border-border shrink-0">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">System Design Diagram</h3>
              <p className="text-xs text-muted-foreground truncate">Create your architecture diagram with system components</p>
            </div>
          </div>
          {/* Design Name Management - inline with buttons */}
          <div id="design-name-portal" className="flex items-center gap-2 shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={exportPNG}
              className="h-7 px-2 text-xs"
            >
              <ImageIcon className="h-3 w-3 mr-1" /> Export PNG
            </Button>
            <Button
              size="sm"
              onClick={handleShareWithAI}
              className="h-7 px-2 text-xs gradient-bg"
            >
              <Share className="h-3 w-3 mr-1" /> Share with AI
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <SystemDesignCanvas stepKey={stepKey} />
      </div>
    </Card>
  );
}
