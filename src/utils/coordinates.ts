import type { CanvasPoint, NormalizedPoint } from '../types/airwrite';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance2D(a: NormalizedPoint, b: NormalizedPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function distance3D(a: NormalizedPoint, b: NormalizedPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(dx, dy, dz);
}

/**
 * Maps a raw MediaPipe normalized landmark [0..1] into drawing-canvas normalized
 * coordinates [0..1], accounting for horizontal mirroring and an active-zone
 * margin so users can reach canvas edges comfortably without leaving camera FOV.
 */
export function mapLandmarkToCanvasNormalized(
  point: NormalizedPoint,
  options: {
    mirrorX: boolean;
    activeMargin: number;
    videoWidth?: number;
    videoHeight?: number;
    canvasWidth?: number;
    canvasHeight?: number;
  }
): CanvasPoint {
  const {
    mirrorX,
    activeMargin,
    videoWidth = 0,
    videoHeight = 0,
    canvasWidth = 0,
    canvasHeight = 0,
  } = options;

  let nx = mirrorX ? 1 - point.x : point.x;
  let ny = point.y;

  // Aspect-ratio compensation so a circle traced in the air looks circular on the canvas
  if (videoWidth > 0 && videoHeight > 0 && canvasWidth > 0 && canvasHeight > 0) {
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    if (canvasAspect > videoAspect) {
      // Canvas is wider than video: center vertically in normalized space
      const scale = videoAspect / canvasAspect;
      ny = (ny - 0.5) / scale + 0.5;
    } else if (canvasAspect < videoAspect) {
      // Canvas is taller than video: center horizontally in normalized space
      const scale = canvasAspect / videoAspect;
      nx = (nx - 0.5) / scale + 0.5;
    }
  }

  // Apply comfortable active-zone margin so edges are reachable
  const margin = clamp(activeMargin, 0, 0.25);
  const span = 1 - margin * 2;
  const mappedX = span > 0 ? (nx - margin) / span : nx;
  const mappedY = span > 0 ? (ny - margin) / span : ny;

  return {
    x: clamp(mappedX, 0, 1),
    y: clamp(mappedY, 0, 1),
  };
}

export function normalizedToPixel(
  point: CanvasPoint,
  width: number,
  height: number
): CanvasPoint {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}
