import React from 'react';
import {
  AlertTriangle,
  Camera,
  CirclePause,
  Hand,
  PenTool,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  AirWriteSettings,
  CameraDeviceInfo,
  DelegateMode,
} from '../types/airwrite';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onStartCamera: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onClose,
  onStartCamera,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#151D32] shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/10">
          <div>
            <h2
              id="onboarding-title"
              className="font-display text-xl font-bold text-[#F8FAFC]"
            >
              Welcome to AirScript
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              Write in the air using your webcam and hand gestures in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close welcome guide"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Privacy Callout */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0B1020] border border-white/10">
            <ShieldCheck className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-[#F8FAFC]">
                100% Local & Private Computer Vision
              </p>
              <p className="text-[#94A3B8] mt-0.5">
                When you allow camera access, MediaPipe processes video frames directly inside your browser. No video is recorded, stored, or sent to any server.
              </p>
            </div>
          </div>

          {/* 3 Gestures Grid */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0B1020]/70 border border-[#22D3EE]/35">
              <div className="flex items-center gap-2 mb-1.5">
                <PenTool className="w-4 h-4 text-[#22D3EE]" />
                <span className="text-xs font-semibold text-[#F8FAFC]">
                  1. Index Finger Up
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Point only your index finger to write or erase immediately.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1020]/70 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <Hand className="w-4 h-4 text-[#818CF8]" />
                <span className="text-xs font-semibold text-[#F8FAFC]">
                  2. Open Palm
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Spread 2+ fingers to lift the pen and move the cursor freely.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1020]/70 border border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <CirclePause className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-[#F8FAFC]">
                  3. Closed Fist
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Curl all fingers to pause drawing and end the active stroke.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#0B1020]/70 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 transition-colors cursor-pointer"
          >
            Explore Workspace First
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartCamera();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-[#5558E6] transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Start Camera & Begin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ClearConfirmModalProps {
  open: boolean;
  strokeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  open,
  strokeCount,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#151D32] p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2
              id="clear-title"
              className="font-display text-base font-bold text-[#F8FAFC]"
            >
              Clear Entire Canvas?
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              This will permanently remove all {strokeCount} recorded stroke{strokeCount === 1 ? '' : 's'} and reset undo history. You can export as PNG first if you want to keep a copy.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#F8FAFC] border border-white/10 bg-[#0B1020] hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Clear Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  open: boolean;
  settings: AirWriteSettings;
  devices: CameraDeviceInfo[];
  activeDelegate: 'GPU' | 'CPU';
  onClose: () => void;
  onUpdate: (patch: Partial<AirWriteSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  settings,
  devices,
  activeDelegate,
  onClose,
  onUpdate,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#151D32] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2
              id="settings-title"
              className="font-display text-base font-bold text-[#F8FAFC]"
            >
              Tracking & Workspace Settings
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Tune gesture sensitivity, smoothing, and hardware performance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Camera Device Selector */}
          <div>
            <label
              htmlFor="camera-device-select"
              className="block font-semibold text-[#F8FAFC] mb-1.5"
            >
              Webcam Device
            </label>
            <select
              id="camera-device-select"
              value={settings.selectedDeviceId}
              onChange={(e) => onUpdate({ selectedDeviceId: e.target.value })}
              className="w-full rounded-lg bg-[#0B1020] border border-white/15 px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
            >
              <option value="">Default System Camera</option>
              {devices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stroke Smoothing */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="smoothing-range"
                className="font-semibold text-[#F8FAFC]"
              >
                Adaptive Stroke Smoothing
              </label>
              <span className="font-mono text-[#22D3EE] tabular-nums">
                {Math.round(settings.smoothingAmount * 100)}%
              </span>
            </div>
            <input
              id="smoothing-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.smoothingAmount}
              onChange={(e) => onUpdate({ smoothingAmount: Number(e.target.value) })}
              className="w-full accent-[#6366F1] cursor-pointer"
            />
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Balances micro-tremor suppression with low-latency stroke response.
            </p>
          </div>

          {/* Active Edge Margin */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="margin-range"
                className="font-semibold text-[#F8FAFC]"
              >
                Canvas Edge Reach Margin
              </label>
              <span className="font-mono text-[#22D3EE] tabular-nums">
                {Math.round(settings.activeZoneMargin * 100)}%
              </span>
            </div>
            <input
              id="margin-range"
              type="range"
              min={0}
              max={0.18}
              step={0.02}
              value={settings.activeZoneMargin}
              onChange={(e) => onUpdate({ activeZoneMargin: Number(e.target.value) })}
              className="w-full accent-[#6366F1] cursor-pointer"
            />
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Inward padding so you can reach all four corners of the canvas before your hand leaves the webcam frame.
            </p>
          </div>

          {/* Inference Engine & FPS */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="delegate-select"
                className="block font-semibold text-[#F8FAFC] mb-1.5"
              >
                Inference Backend ({activeDelegate} active)
              </label>
              <select
                id="delegate-select"
                value={settings.delegateMode}
                onChange={(e) =>
                  onUpdate({ delegateMode: e.target.value as DelegateMode })
                }
                className="w-full rounded-lg bg-[#0B1020] border border-white/15 px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
              >
                <option value="AUTO">Auto (GPU with CPU fallback)</option>
                <option value="GPU">Prefer GPU (WebGL)</option>
                <option value="CPU">Force CPU (Low-power laptops)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fps-select"
                className="block font-semibold text-[#F8FAFC] mb-1.5"
              >
                Target Tracking Rate
              </label>
              <select
                id="fps-select"
                value={settings.targetFps}
                onChange={(e) => onUpdate({ targetFps: Number(e.target.value) })}
                className="w-full rounded-lg bg-[#0B1020] border border-white/15 px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
              >
                <option value={24}>24 FPS (Battery Saver)</option>
                <option value={30}>30 FPS (Balanced)</option>
                <option value={45}>45 FPS (Smooth)</option>
                <option value={60}>60 FPS (Maximum)</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[#F8FAFC] font-medium">
                Mirror Webcam Preview & Coordinates
              </span>
              <input
                type="checkbox"
                checked={settings.mirrorPreview}
                onChange={(e) => onUpdate({ mirrorPreview: e.target.checked })}
                className="w-4 h-4 accent-[#6366F1] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[#F8FAFC] font-medium">
                Show 21-Point Hand Skeleton Overlay
              </span>
              <input
                type="checkbox"
                checked={settings.showLandmarks}
                onChange={(e) => onUpdate({ showLandmarks: e.target.checked })}
                className="w-4 h-4 accent-[#6366F1] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[#F8FAFC] font-medium">
                Show Subtle Canvas Alignment Grid
              </span>
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => onUpdate({ showGrid: e.target.checked })}
                className="w-4 h-4 accent-[#6366F1] cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#0B1020]/70 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-[#5558E6] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
