export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'error'
  | 'stopped';

export type ModelStatus =
  | 'unloaded'
  | 'loading'
  | 'ready'
  | 'error';

export type DelegateMode = 'AUTO' | 'GPU' | 'CPU';

export type GestureType =
  | 'NO_HAND'
  | 'OPEN_PALM'
  | 'INDEX_DRAW'
  | 'CLOSED_FIST';

export type DrawingTool = 'pen' | 'eraser';

export type CanvasBackground = 'dark' | 'white' | 'transparent';

export interface NormalizedPoint {
  x: number;
  y: number;
  z?: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: DrawingTool;
  color: string;
  /** Width in normalized canvas units (relative to 1000px reference width) */
  size: number;
  /** Normalized [0..1] points relative to canvas dimensions */
  points: CanvasPoint[];
}

export interface AirWriteSettings {
  smoothingAmount: number;
  mirrorPreview: boolean;
  showLandmarks: boolean;
  showGrid: boolean;
  delegateMode: DelegateMode;
  targetFps: number;
  activeZoneMargin: number;
  selectedDeviceId: string;
}

export interface HandTrackingFrame {
  landmarks: NormalizedPoint[][];
  handedness: string[];
  inferenceTimeMs: number;
  fps: number;
}

export interface GestureResult {
  gesture: GestureType;
  rawGesture: GestureType;
  confidence: number;
  indexTip: NormalizedPoint | null;
  handCount: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export const PALETTE_COLORS: ColorSwatch[] = [
  { name: 'White', hex: '#F8FAFC' },
  { name: 'Black', hex: '#0F172A' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#FACC15' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Cyan', hex: '#22D3EE' },
];

export const BRUSH_PRESETS = [
  { label: 'Small', size: 4 },
  { label: 'Medium', size: 10 },
  { label: 'Large', size: 20 },
] as const;

export const DEFAULT_SETTINGS: AirWriteSettings = {
  smoothingAmount: 0.55,
  mirrorPreview: true,
  showLandmarks: true,
  showGrid: true,
  delegateMode: 'AUTO',
  targetFps: 30,
  activeZoneMargin: 0.08,
  selectedDeviceId: '',
};
