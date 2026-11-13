import type {
  CanvasBackground,
  CanvasPoint,
  DrawingTool,
  Stroke,
} from '../types/airwrite';
import { createId } from '../utils/helpers';

export interface HistorySnapshot {
  strokeCount: number;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 120;
const REFERENCE_WIDTH = 1000;

export class DrawingEngine {
  private displayCanvas: HTMLCanvasElement | null = null;
  private strokeLayerCanvas: HTMLCanvasElement;
  private strokes: Stroke[] = [];
  private redoStack: Stroke[] = [];
  private activeStroke: Stroke | null = null;
  private backgroundMode: CanvasBackground = 'dark';
  private logicalWidth = 0;
  private logicalHeight = 0;
  private dpr = 1;

  constructor() {
    this.strokeLayerCanvas = document.createElement('canvas');
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    this.displayCanvas = canvas;
    this.resize(canvas.clientWidth, canvas.clientHeight);
  }

  detachCanvas(): void {
    this.displayCanvas = null;
  }

  setBackgroundMode(mode: CanvasBackground): void {
    this.backgroundMode = mode;
    this.compositeToDisplay();
  }

  getBackgroundMode(): CanvasBackground {
    return this.backgroundMode;
  }

  resize(width: number, height: number): void {
    if (!this.displayCanvas || width <= 0 || height <= 0) {
      return;
    }
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.logicalWidth = width;
    this.logicalHeight = height;

    const pixelWidth = Math.round(width * this.dpr);
    const pixelHeight = Math.round(height * this.dpr);

    if (
      this.displayCanvas.width !== pixelWidth ||
      this.displayCanvas.height !== pixelHeight
    ) {
      this.displayCanvas.width = pixelWidth;
      this.displayCanvas.height = pixelHeight;
    }

    if (
      this.strokeLayerCanvas.width !== pixelWidth ||
      this.strokeLayerCanvas.height !== pixelHeight
    ) {
      this.strokeLayerCanvas.width = pixelWidth;
      this.strokeLayerCanvas.height = pixelHeight;
    }

    this.redrawStrokeLayer();
    this.compositeToDisplay();
  }

  beginStroke(
    point: CanvasPoint,
    tool: DrawingTool,
    color: string,
    brushSizePx: number
  ): void {
    // End any dangling stroke first so strokes never bleed together
    if (this.activeStroke) {
      this.endStroke();
    }

    this.activeStroke = {
      id: createId('stroke'),
      tool,
      color,
      size: brushSizePx,
      points: [point],
    };

    this.redrawStrokeLayer();
    this.compositeToDisplay();
  }

  addPoint(point: CanvasPoint): void {
    if (!this.activeStroke) {
      return;
    }

    const pts = this.activeStroke.points;
    const prev = pts[pts.length - 1];

    // Skip sub-pixel redundant points to keep bezier curves silky smooth
    if (prev) {
      const dx = (point.x - prev.x) * (this.logicalWidth || REFERENCE_WIDTH);
      const dy = (point.y - prev.y) * (this.logicalHeight || REFERENCE_WIDTH);
      if (Math.hypot(dx, dy) < 1.75) {
        return;
      }
    }

    pts.push(point);

    // For fast incremental performance, draw onto stroke layer incrementally when pen,
    // or redraw full layer cleanly. Full redraw is fast for typical stroke counts and ensures
    // quadratic midpoint interpolation stays seamless.
    this.redrawStrokeLayer();
    this.compositeToDisplay();
  }

  endStroke(): boolean {
    if (!this.activeStroke) {
      return false;
    }

    const finished = this.activeStroke;
    this.activeStroke = null;

    if (finished.points.length > 0) {
      this.strokes.push(finished);
      if (this.strokes.length > MAX_HISTORY) {
        this.strokes.shift();
      }
      this.redoStack = [];
    }

    this.redrawStrokeLayer();
    this.compositeToDisplay();
    return true;
  }

  isDrawing(): boolean {
    return this.activeStroke !== null;
  }

  undo(): boolean {
    if (this.activeStroke) {
      this.endStroke();
    }
    const popped = this.strokes.pop();
    if (!popped) {
      return false;
    }
    this.redoStack.push(popped);
    this.redrawStrokeLayer();
    this.compositeToDisplay();
    return true;
  }

  redo(): boolean {
    if (this.activeStroke) {
      this.endStroke();
    }
    const restored = this.redoStack.pop();
    if (!restored) {
      return false;
    }
    this.strokes.push(restored);
    this.redrawStrokeLayer();
    this.compositeToDisplay();
    return true;
  }

  clear(): void {
    this.activeStroke = null;
    this.strokes = [];
    this.redoStack = [];
    this.redrawStrokeLayer();
    this.compositeToDisplay();
  }

  getHistorySnapshot(): HistorySnapshot {
    return {
      strokeCount: this.strokes.length,
      canUndo: this.strokes.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  private renderStrokeOnContext(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    width: number,
    height: number
  ): void {
    const pts = stroke.points;
    if (pts.length === 0) {
      return;
    }

    const scaleFactor = Math.max(width, 400) / REFERENCE_WIDTH;
    const strokeWidth = Math.max(1.5, stroke.size * scaleFactor * (stroke.tool === 'eraser' ? 1.8 : 1));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeWidth;

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
    }

    if (pts.length === 1) {
      const p0 = pts[0];
      ctx.beginPath();
      ctx.arc(p0.x * width, p0.y * height, strokeWidth * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    const first = pts[0];
    ctx.moveTo(first.x * width, first.y * height);

    if (pts.length === 2) {
      const second = pts[1];
      ctx.lineTo(second.x * width, second.y * height);
      ctx.stroke();
      ctx.restore();
      return;
    }

    for (let i = 1; i < pts.length - 1; i++) {
      const currentX = pts[i].x * width;
      const currentY = pts[i].y * height;
      const nextX = pts[i + 1].x * width;
      const nextY = pts[i + 1].y * height;
      const midX = (currentX + nextX) * 0.5;
      const midY = (currentY + nextY) * 0.5;
      ctx.quadraticCurveTo(currentX, currentY, midX, midY);
    }

    const last = pts[pts.length - 1];
    ctx.lineTo(last.x * width, last.y * height);
    ctx.stroke();
    ctx.restore();
  }

  private redrawStrokeLayer(): void {
    const ctx = this.strokeLayerCanvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const pixelWidth = this.strokeLayerCanvas.width;
    const pixelHeight = this.strokeLayerCanvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);
    ctx.scale(this.dpr, this.dpr);

    for (const stroke of this.strokes) {
      this.renderStrokeOnContext(ctx, stroke, this.logicalWidth, this.logicalHeight);
    }

    if (this.activeStroke) {
      this.renderStrokeOnContext(
        ctx,
        this.activeStroke,
        this.logicalWidth,
        this.logicalHeight
      );
    }

    ctx.restore();
  }

  private compositeToDisplay(): void {
    if (!this.displayCanvas) {
      return;
    }
    const ctx = this.displayCanvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const pixelWidth = this.displayCanvas.width;
    const pixelHeight = this.displayCanvas.height;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);

    if (this.backgroundMode === 'dark') {
      ctx.fillStyle = '#0F1629';
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    } else if (this.backgroundMode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    }

    ctx.drawImage(this.strokeLayerCanvas, 0, 0);
    ctx.restore();
  }

  exportPNGDataUrl(backgroundMode: CanvasBackground = this.backgroundMode): string | null {
    if (this.logicalWidth <= 0 || this.logicalHeight <= 0) {
      return null;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.strokeLayerCanvas.width;
    exportCanvas.height = this.strokeLayerCanvas.height;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    if (backgroundMode === 'dark') {
      ctx.fillStyle = '#0F1629';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    } else if (backgroundMode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    ctx.drawImage(this.strokeLayerCanvas, 0, 0);
    return exportCanvas.toDataURL('image/png');
  }
}
