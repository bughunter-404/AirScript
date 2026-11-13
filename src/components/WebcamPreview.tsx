import React, { useState } from 'react';
import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from 'lucide-react';
import type { CameraStatus, GestureType, ModelStatus } from '../types/airwrite';

interface WebcamPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  mirrorPreview: boolean;
  gesture: GestureType;
  handDetected: boolean;
  trackingFps: number;
  onStartCamera: () => void;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  videoRef,
  overlayCanvasRef,
  cameraStatus,
  modelStatus,
  mirrorPreview,
  gesture,
  handDetected,
  trackingFps,
  onStartCamera,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isLoading = cameraStatus === 'requesting' || modelStatus === 'loading';
  const isReady = cameraStatus === 'ready';

  const sizeClass = minimized
    ? 'w-44 sm:w-56'
    : expanded
    ? 'w-64 sm:w-96'
    : 'w-40 sm:w-72';

  return (
    <div
      className={`absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-20 ${sizeClass} rounded-xl border border-white/15 bg-[#0B1020]/90 backdrop-blur-md shadow-2xl overflow-hidden transition-[width] duration-200`}
    >
      {/* Preview Top Strip */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Camera className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
          <span className="font-medium text-[#F8FAFC] truncate">
            Webcam Feed
          </span>
          {isReady && trackingFps > 0 && (
            <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
              {trackingFps} FPS
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!minimized && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Compact preview' : 'Expand preview'}
              aria-label={expanded ? 'Compact preview' : 'Expand preview'}
              className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors cursor-pointer"
            >
              {expanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMinimized((v) => !v)}
            title={minimized ? 'Show camera preview' : 'Hide camera preview'}
            aria-label={minimized ? 'Show camera preview' : 'Hide camera preview'}
            className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors cursor-pointer"
          >
            {minimized ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Video & Skeleton Container — video stays mounted even when minimized so tracking never stops */}
      <div
        className={`relative w-full aspect-video bg-[#070B16] ${
          minimized ? 'sr-only' : 'block'
        }`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${
            mirrorPreview ? '-scale-x-100' : ''
          } ${isReady ? 'opacity-100' : 'opacity-0'}`}
        />

        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Idle / Stopped State */}
        {!isReady && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <ShieldCheck className="w-6 h-6 text-[#6366F1] mb-2" />
            <p className="text-xs font-medium text-[#F8FAFC] mb-1">
              {cameraStatus === 'error' ? 'Camera Unavailable' : 'Local Camera Off'}
            </p>
            <p className="text-[11px] text-[#94A3B8] mb-3 leading-snug">
              Processed 100% locally in your browser. Zero video uploaded.
            </p>
            <button
              type="button"
              onClick={onStartCamera}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-[#5558E6] transition-colors cursor-pointer"
            >
              Enable Camera
            </button>
          </div>
        )}

        {/* Loading Overlay while Camera / MediaPipe Initializes */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#0B1020]/85 flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="w-6 h-6 text-[#22D3EE] animate-spin mb-2" />
            <p className="text-xs font-medium text-[#F8FAFC]">
              {cameraStatus === 'requesting'
                ? 'Requesting Camera Permission...'
                : 'Initializing Hand Tracker...'}
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Preparing local MediaPipe vision model
            </p>
          </div>
        )}

        {/* Subtle Bottom Status Strip when Ready */}
        {isReady && !isLoading && (
          <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-[11px]">
            <span className="text-[#F8FAFC] font-medium">
              {handDetected ? 'Hand Locked' : 'Show Hand'}
            </span>
            <span
              className={
                gesture === 'INDEX_DRAW'
                  ? 'text-[#22D3EE] font-semibold'
                  : gesture === 'CLOSED_FIST'
                  ? 'text-amber-300 font-semibold'
                  : 'text-[#CBD5E1]'
              }
            >
              {gesture === 'INDEX_DRAW'
                ? 'Drawing'
                : gesture === 'CLOSED_FIST'
                ? 'Paused'
                : gesture === 'OPEN_PALM'
                ? 'Move / Lift'
                : 'Searching'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
