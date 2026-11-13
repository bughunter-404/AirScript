import type { CanvasPoint } from '../types/airwrite';

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null || this.s === null) {
      this.y = value;
      this.s = value;
      return value;
    }
    this.y = value;
    this.s = alpha * value + (1 - alpha) * this.s;
    return this.s;
  }

  lastRaw(): number | null {
    return this.y;
  }

  reset(): void {
    this.y = null;
    this.s = null;
  }
}

class OneEuroFilter1D {
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTimeMs: number | null = null;

  constructor(
    private minCutoff: number,
    private beta: number,
    private dCutoff: number
  ) {}

  updateParams(minCutoff: number, beta: number, dCutoff: number): void {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dtSec: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dtSec);
  }

  filter(value: number, timestampMs: number): number {
    if (this.lastTimeMs === null) {
      this.lastTimeMs = timestampMs;
      this.dxFilter.filter(0, 1);
      return this.xFilter.filter(value, 1);
    }

    const dtSec = Math.max((timestampMs - this.lastTimeMs) / 1000, 1 / 240);
    this.lastTimeMs = timestampMs;

    const prevRaw = this.xFilter.lastRaw();
    const dValue = prevRaw === null ? 0 : (value - prevRaw) / dtSec;
    const edValue = this.dxFilter.filter(dValue, this.alpha(this.dCutoff, dtSec));
    const cutoff = this.minCutoff + this.beta * Math.abs(edValue);

    return this.xFilter.filter(value, this.alpha(cutoff, dtSec));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTimeMs = null;
  }
}

/**
 * Adaptive 2D One-Euro Filter for low-latency, jitter-free air handwriting.
 * Eliminates micro-tremor when moving slowly while keeping fast strokes snappy.
 */
export class OneEuroFilter2D {
  private filterX: OneEuroFilter1D;
  private filterY: OneEuroFilter1D;
  private lastPoint: CanvasPoint | null = null;

  constructor(smoothingAmount = 0.55) {
    const params = OneEuroFilter2D.paramsFromAmount(smoothingAmount);
    this.filterX = new OneEuroFilter1D(params.minCutoff, params.beta, params.dCutoff);
    this.filterY = new OneEuroFilter1D(params.minCutoff, params.beta, params.dCutoff);
  }

  static paramsFromAmount(amount: number): {
    minCutoff: number;
    beta: number;
    dCutoff: number;
  } {
    const clamped = Math.max(0, Math.min(1, amount));
    // Lower minCutoff = stronger low-speed jitter suppression
    // Higher beta = lower lag during fast pen strokes
    const minCutoff = 4.5 - clamped * 3.4; // [4.5 .. 1.1]
    const beta = 28 - clamped * 16; // [28 .. 12]
    return {
      minCutoff,
      beta,
      dCutoff: 1.2,
    };
  }

  setSmoothingAmount(amount: number): void {
    const params = OneEuroFilter2D.paramsFromAmount(amount);
    this.filterX.updateParams(params.minCutoff, params.beta, params.dCutoff);
    this.filterY.updateParams(params.minCutoff, params.beta, params.dCutoff);
  }

  filter(point: CanvasPoint, timestampMs: number): CanvasPoint {
    // Guard against sudden large landmark jumps (>35% of screen in a single frame)
    if (this.lastPoint) {
      const jump = Math.hypot(point.x - this.lastPoint.x, point.y - this.lastPoint.y);
      if (jump > 0.35) {
        this.reset();
      }
    }

    const smoothed = {
      x: this.filterX.filter(point.x, timestampMs),
      y: this.filterY.filter(point.y, timestampMs),
    };
    this.lastPoint = smoothed;
    return smoothed;
  }

  reset(): void {
    this.filterX.reset();
    this.filterY.reset();
    this.lastPoint = null;
  }
}
