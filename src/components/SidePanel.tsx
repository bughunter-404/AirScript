import React from 'react';
import {
  CheckCircle2,
  CirclePause,
  Hand,
  PenTool,
  X,
} from 'lucide-react';
import type {
  CameraStatus,
  GestureType,
  ModelStatus,
} from '../types/airwrite';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  activeDelegate: 'GPU' | 'CPU';
  gesture: GestureType;
  handDetected: boolean;
  handCount: number;
  trackingFps: number;
  cameraResolution: string;
  strokeCount: number;
}

const GESTURE_GUIDE: Array<{
  id: GestureType;
  title: string;
  action: string;
  howTo: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'INDEX_DRAW',
    title: 'Index Finger Up',
    action: 'Write / Erase',
    howTo: 'Extend only your index finger (fold middle, ring, pinky) to draw or erase directly.',
    icon: <PenTool className="w-4 h-4 text-[#22D3EE]" />,
  },
  {
    id: 'OPEN_PALM',
    title: 'Open Palm (2+ Fingers)',
    action: 'Move Cursor',
    howTo: 'Open your hand or raise two or more fingers to lift the pen and reposition without drawing.',
    icon: <Hand className="w-4 h-4 text-[#818CF8]" />,
  },
  {
    id: 'CLOSED_FIST',
    title: 'Closed Fist',
    action: 'Pause Drawing',
    howTo: 'Curl all fingers into a fist to safely pause and end the current stroke.',
    icon: <CirclePause className="w-4 h-4 text-amber-400" />,
  },
];

export const SidePanel: React.FC<SidePanelProps> = ({
  open,
  onClose,
  cameraStatus,
  modelStatus,
  activeDelegate,
  gesture,
  handDetected,
  handCount,
  trackingFps,
  cameraResolution,
  strokeCount,
}) => {
  if (!open) return null;

  const cameraStateText =
    cameraStatus === 'ready'
      ? `Active (${cameraResolution || 'Live'})`
      : cameraStatus === 'requesting'
      ? 'Requesting Permission'
      : cameraStatus === 'error'
      ? 'Error'
      : cameraStatus === 'stopped'
      ? 'Stopped'
      : 'Idle';

  const handStatusText =
    cameraStatus !== 'ready'
      ? 'Waiting for Camera'
      : handCount > 1
      ? `${handCount} Hands (Tracking Primary)`
      : handDetected
      ? 'Hand Detected'
      : 'No Hand in Frame';

  const gestureText: Record<GestureType, string> = {
    NO_HAND: 'None',
    OPEN_PALM: 'Open Palm · Move Cursor',
    INDEX_DRAW: 'Index Finger · Writing Active',
    CLOSED_FIST: 'Closed Fist · Paused',
  };

  return (
    <aside
      aria-label="AirScript Guide and Status"
      className="fixed inset-y-0 right-0 top-16 w-80 max-w-[90vw] lg:static lg:top-0 border-l border-white/10 bg-[#151D32]/95 backdrop-blur-md flex flex-col z-25 overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 lg:hidden">
        <span className="font-display text-sm font-semibold text-[#F8FAFC]">
          Controls & Gesture Guide
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close side panel"
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Live Tracking Status */}
        <section aria-labelledby="status-heading">
          <h2
            id="status-heading"
            className="font-display text-xs font-semibold text-[#94A3B8] tracking-wide mb-3"
          >
            Live Session Status
          </h2>
          <dl className="divide-y divide-white/8 text-xs">
            <div className="py-2 flex items-center justify-between gap-3">
              <dt className="text-[#94A3B8]">Camera</dt>
              <dd
                className={`font-medium text-right ${
                  cameraStatus === 'ready'
                    ? 'text-[#22D3EE]'
                    : cameraStatus === 'error'
                    ? 'text-rose-400'
                    : 'text-[#F8FAFC]'
                }`}
              >
                {cameraStateText}
              </dd>
            </div>
            <div className="py-2 flex items-center justify-between gap-3">
              <dt className="text-[#94A3B8]">Hand Detection</dt>
              <dd
                className={`font-medium text-right ${
                  handDetected ? 'text-emerald-400' : 'text-[#F8FAFC]'
                }`}
              >
                {handStatusText}
              </dd>
            </div>
            <div className="py-2 flex items-center justify-between gap-3">
              <dt className="text-[#94A3B8]">Current Gesture</dt>
              <dd
                className={`font-medium text-right ${
                  gesture === 'INDEX_DRAW'
                    ? 'text-[#22D3EE]'
                    : gesture === 'CLOSED_FIST'
                    ? 'text-amber-400'
                    : 'text-[#F8FAFC]'
                }`}
              >
                {gestureText[gesture]}
              </dd>
            </div>
            <div className="py-2 flex items-center justify-between gap-3">
              <dt className="text-[#94A3B8]">Tracker Runtime</dt>
              <dd className="font-mono text-[#F8FAFC] tabular-nums">
                {modelStatus === 'ready'
                  ? `${activeDelegate} · ${trackingFps} FPS`
                  : modelStatus === 'loading'
                  ? 'Initializing...'
                  : 'Standby'}
              </dd>
            </div>
            <div className="py-2 flex items-center justify-between gap-3">
              <dt className="text-[#94A3B8]">Recorded Strokes</dt>
              <dd className="font-mono text-[#F8FAFC] tabular-nums">{strokeCount}</dd>
            </div>
          </dl>
        </section>

        {/* Gesture Reference */}
        <section aria-labelledby="gestures-heading">
          <h2
            id="gestures-heading"
            className="font-display text-xs font-semibold text-[#94A3B8] tracking-wide mb-3"
          >
            Gesture Controls
          </h2>
          <div className="space-y-2.5">
            {GESTURE_GUIDE.map((item) => {
              const isCurrent = gesture === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'border-[#22D3EE]/50 bg-[#22D3EE]/8'
                      : 'border-white/8 bg-[#0B1020]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-xs font-semibold text-[#F8FAFC]">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#94A3B8]">
                      {item.action}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {item.howTo}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How to Use */}
        <section aria-labelledby="howto-heading">
          <h2
            id="howto-heading"
            className="font-display text-xs font-semibold text-[#94A3B8] tracking-wide mb-2.5"
          >
            How to Write in the Air
          </h2>
          <ol className="space-y-2 text-xs text-[#94A3B8] leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6366F1] shrink-0 mt-0.5" />
              <span>
                Click <strong className="text-[#F8FAFC]">Start Camera</strong> and allow webcam access. Video stays strictly on your device.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6366F1] shrink-0 mt-0.5" />
              <span>
                Raise only your <strong className="text-[#F8FAFC]">index finger</strong> to write or erase directly in the air.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#6366F1] shrink-0 mt-0.5" />
              <span>
                Open your palm (or raise 2+ fingers) to lift the pen and move without drawing, or close your fist to pause.
              </span>
            </li>
          </ol>
        </section>

        {/* Keyboard Shortcuts */}
        <section aria-labelledby="shortcuts-heading">
          <h2
            id="shortcuts-heading"
            className="font-display text-xs font-semibold text-[#94A3B8] tracking-wide mb-2.5"
          >
            Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Pen</span>
              <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0B1020] border border-white/15 text-[#F8FAFC]">
                P
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Eraser</span>
              <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0B1020] border border-white/15 text-[#F8FAFC]">
                E
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Undo</span>
              <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0B1020] border border-white/15 text-[#F8FAFC]">
                Ctrl+Z
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Redo</span>
              <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0B1020] border border-white/15 text-[#F8FAFC]">
                Ctrl+Y
              </kbd>
            </div>
            <div className="flex items-center justify-between col-span-2">
              <span className="text-[#94A3B8]">Clear Canvas</span>
              <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#0B1020] border border-white/15 text-[#F8FAFC]">
                C
              </kbd>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
};
