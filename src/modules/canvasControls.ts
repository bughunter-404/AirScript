import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasBackground, DrawingTool } from '../types/airwrite';
import { DrawingEngine, type HistorySnapshot } from './drawingEngine';
import { generateExportFilename, isEditableTarget } from '../utils/helpers';

export interface UseCanvasControlsOptions {
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

export function useCanvasControls({ onToast }: UseCanvasControlsOptions) {
  const engineRef = useRef<DrawingEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new DrawingEngine();
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState<string>('#22D3EE');
  const [brushSize, setBrushSize] = useState<number>(10);
  const [backgroundMode, setBackgroundMode] = useState<CanvasBackground>('dark');
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistorySnapshot>({
    strokeCount: 0,
    canUndo: false,
    canRedo: false,
  });

  const syncHistory = useCallback(() => {
    if (!engineRef.current) return;
    setHistory(engineRef.current.getHistorySnapshot());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const engine = engineRef.current;
    if (!canvas || !container || !engine) return;

    engine.attachCanvas(canvas);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        engine.resize(Math.floor(width), Math.floor(height));
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      engine.detachCanvas();
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setBackgroundMode(backgroundMode);
    // Automatically pick high-contrast pen color if switching between dark/white and current color matches background
    if (backgroundMode === 'white' && color.toUpperCase() === '#F8FAFC') {
      setColor('#0F172A');
    } else if (backgroundMode === 'dark' && color.toUpperCase() === '#0F172A') {
      setColor('#F8FAFC');
    }
  }, [backgroundMode]);

  const handleUndo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.undo()) {
      syncHistory();
    }
  }, [syncHistory]);

  const handleRedo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.redo()) {
      syncHistory();
    }
  }, [syncHistory]);

  const requestClear = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const snap = engine.getHistorySnapshot();
    if (snap.strokeCount === 0 && !engine.isDrawing()) {
      onToast('info', 'Canvas is already empty');
      return;
    }
    setConfirmClearOpen(true);
  }, [onToast]);

  const confirmClear = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.clear();
    syncHistory();
    setConfirmClearOpen(false);
    onToast('info', 'Canvas cleared', 'All air strokes were removed.');
  }, [onToast, syncHistory]);

  const cancelClear = useCallback(() => {
    setConfirmClearOpen(false);
  }, []);

  const handleExportPNG = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const dataUrl = engine.exportPNGDataUrl(backgroundMode);
    if (!dataUrl) {
      onToast('error', 'Export failed', 'Canvas is not ready to export.');
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = generateExportFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onToast('success', 'PNG downloaded', `Saved with ${backgroundMode} background.`);
  }, [backgroundMode, onToast]);

  // Global keyboard shortcuts (Ctrl+Z, Ctrl+Y, E, P, C)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;

      if (hasModifier && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if ((hasModifier && key === 'y') || (hasModifier && event.shiftKey && key === 'z')) {
        event.preventDefault();
        handleRedo();
        return;
      }

      if (hasModifier || event.altKey) {
        return;
      }

      if (key === 'e') {
        event.preventDefault();
        setTool('eraser');
      } else if (key === 'p') {
        event.preventDefault();
        setTool('pen');
      } else if (key === 'c') {
        event.preventDefault();
        requestClear();
      } else if (key === 'escape' && confirmClearOpen) {
        event.preventDefault();
        setConfirmClearOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmClearOpen, handleRedo, handleUndo, requestClear]);

  return {
    engineRef,
    canvasRef,
    containerRef,
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    backgroundMode,
    setBackgroundMode,
    history,
    syncHistory,
    confirmClearOpen,
    requestClear,
    confirmClear,
    cancelClear,
    handleUndo,
    handleRedo,
    handleExportPNG,
  };
}
