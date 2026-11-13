import React from 'react';
import {
  Camera,
  CameraOff,
  HelpCircle,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Settings,
} from 'lucide-react';
import type { CameraStatus, GestureType, ModelStatus } from '../types/airwrite';

interface HeaderProps {
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  gesture: GestureType;
  handDetected: boolean;
  sidePanelOpen: boolean;
  onToggleSidePanel: () => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

const GESTURE_LABELS: Record<GestureType, string> = {
  NO_HAND: 'No Hand',
  OPEN_PALM: 'Move (Open)',
  INDEX_DRAW: 'Index Draw',
  CLOSED_FIST: 'Paused (Fist)',
};

export const Header: React.FC<HeaderProps> = ({
  cameraStatus,
  modelStatus,
  gesture,
  handDetected,
  sidePanelOpen,
  onToggleSidePanel,
  onStartCamera,
  onStopCamera,
  onOpenSettings,
  onOpenHelp,
}) => {
  const isBusy = cameraStatus === 'requesting' || modelStatus === 'loading';
  const isActive = cameraStatus === 'ready';

  const cameraLabel =
    cameraStatus === 'ready'
      ? 'Camera Active'
      : cameraStatus === 'requesting'
      ? 'Requesting Access'
      : cameraStatus === 'error'
      ? 'Camera Error'
      : cameraStatus === 'stopped'
      ? 'Camera Stopped'
      : 'Camera Ready';

  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-[#0B1020]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-4 z-30">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/15 bg-[#0A0B14] shadow-sm">
          <img
            src="./assets/aistudio/image_376f3562.png"
            alt="AirScript Logo"
            className="w-full h-full object-cover scale-[1.28]"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-display text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap">
              AirScript
            </h1>
            <span className="hidden xl:inline text-xs text-[#94A3B8] truncate">
              Your Finger Is the Pen. The Air Is Your Canvas.
            </span>
          </div>
        </div>
      </div>

      {/* Live Status Summary (clean unboxed text with separators) */}
      <div className="hidden md:flex items-center gap-2.5 text-xs text-[#94A3B8] whitespace-nowrap">
        <span
          className={
            isActive
              ? 'text-[#22D3EE] font-medium'
              : cameraStatus === 'error'
              ? 'text-rose-400 font-medium'
              : 'text-[#94A3B8]'
          }
        >
          {cameraLabel}
        </span>
        <span aria-hidden="true" className="text-white/20">
          ·
        </span>
        <span>
          {modelStatus === 'loading'
            ? 'Loading Hand Tracker'
            : handDetected
            ? 'Hand Tracked'
            : isActive
            ? 'Awaiting Hand'
            : 'Tracker Idle'}
        </span>
        <span aria-hidden="true" className="text-white/20">
          ·
        </span>
        <span
          className={
            gesture === 'INDEX_DRAW'
              ? 'text-[#22D3EE] font-medium'
              : gesture === 'CLOSED_FIST'
              ? 'text-amber-400 font-medium'
              : 'text-[#F8FAFC]'
          }
        >
          {GESTURE_LABELS[gesture]}
        </span>
      </div>

      {/* Primary Action Zone */}
      <div className="flex items-center gap-2 shrink-0">
        {isActive ? (
          <button
            type="button"
            onClick={onStopCamera}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
          >
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartCamera}
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-[#5558E6] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22D3EE]"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span>{isBusy ? 'Starting...' : 'Start Camera'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          title="Tracking & Camera Settings"
          aria-label="Open Settings"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-[#151D32] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/20 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          title="Gesture Guide & Help"
          aria-label="Open Help Guide"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-[#151D32] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/20 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleSidePanel}
          title={sidePanelOpen ? 'Hide Guide Panel' : 'Show Guide Panel'}
          aria-label={sidePanelOpen ? 'Hide Guide Panel' : 'Show Guide Panel'}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 bg-[#151D32] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/20 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
        >
          {sidePanelOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
