import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AirWriteSettings,
  CameraDeviceInfo,
  CameraStatus,
  CanvasPoint,
  DrawingTool,
  GestureType,
  ModelStatus,
  NormalizedPoint,
  ToastMessage,
} from '../types/airwrite';
import { DEFAULT_SETTINGS } from '../types/airwrite';
import { CameraManager } from './camera';
import { HAND_CONNECTIONS, HandTracker } from './handTracking';
import { GestureDetector } from './gestureDetection';
import { DrawingEngine } from './drawingEngine';
import { OneEuroFilter2D } from '../utils/smoothing';
import { mapLandmarkToCanvasNormalized } from '../utils/coordinates';
import { createId } from '../utils/helpers';

interface UseAirWriteControllerParams {
  engineRef: React.RefObject<DrawingEngine | null>;
  tool: DrawingTool;
  color: string;
  brushSize: number;
  onStrokeComplete: () => void;
}

export function useAirWriteController({
  engineRef,
  tool,
  color,
  brushSize,
  onStrokeComplete,
}: UseAirWriteControllerParams) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const cameraRef = useRef<CameraManager>(new CameraManager());
  const trackerRef = useRef<HandTracker>(new HandTracker());
  const gestureRef = useRef<GestureDetector>(new GestureDetector());
  const smootherRef = useRef<OneEuroFilter2D>(new OneEuroFilter2D(DEFAULT_SETTINGS.smoothingAmount));

  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const lastUiSyncRef = useRef<number>(0);

  const [settings, setSettings] = useState<AirWriteSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<AirWriteSettings>(DEFAULT_SETTINGS);

  const toolRef = useRef<DrawingTool>(tool);
  const colorRef = useRef<string>(color);
  const brushSizeRef = useRef<number>(brushSize);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    settingsRef.current = settings;
    smootherRef.current.setSmoothingAmount(settings.smoothingAmount);
  }, [settings]);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [modelStatus, setModelStatus] = useState<ModelStatus>('unloaded');
  const [activeDelegate, setActiveDelegate] = useState<'GPU' | 'CPU'>('CPU');
  const [gesture, setGesture] = useState<GestureType>('NO_HAND');
  const [handDetected, setHandDetected] = useState<boolean>(false);
  const [handCount, setHandCount] = useState<number>(0);
  const [trackingFps, setTrackingFps] = useState<number>(0);
  const [cameraResolution, setCameraResolution] = useState<string>('');
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('airscript_onboarding_seen') !== '1';
    } catch {
      return true;
    }
  });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const addToast = useCallback(
    (
      type: ToastMessage['type'],
      title: string,
      description?: string
    ) => {
      const id = createId('toast');
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      window.localStorage.setItem('airscript_onboarding_seen', '1');
    } catch {
      // Ignore storage failures
    }
  }, []);

  const clearOverlayCanvases = useCallback(() => {
    const previewCanvas = previewOverlayCanvasRef.current;
    if (previewCanvas) {
      const ctx = previewCanvas.getContext('2d');
      ctx?.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    const cursorCanvas = cursorCanvasRef.current;
    if (cursorCanvas) {
      const ctx = cursorCanvas.getContext('2d');
      ctx?.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    }
  }, []);

  const renderHandSkeleton = useCallback(
    (hands: NormalizedPoint[][], activeGesture: GestureType) => {
      const canvas = previewOverlayCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const targetW = video.videoWidth || canvas.clientWidth || 320;
      const targetH = video.videoHeight || canvas.clientHeight || 180;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!settingsRef.current.showLandmarks || hands.length === 0) {
        return;
      }

      const mirror = settingsRef.current.mirrorPreview;
      const mapX = (x: number) => (mirror ? (1 - x) * canvas.width : x * canvas.width);
      const mapY = (y: number) => y * canvas.height;

      for (let hIdx = 0; hIdx < hands.length; hIdx++) {
        const hand = hands[hIdx];
        const isPrimary = hIdx === 0;

        ctx.save();
        ctx.lineWidth = isPrimary ? 2.2 : 1.4;
        ctx.strokeStyle =
          activeGesture === 'INDEX_DRAW'
            ? '#22D3EE'
            : activeGesture === 'CLOSED_FIST'
            ? '#F59E0B'
            : isPrimary
            ? 'rgba(99, 102, 241, 0.9)'
            : 'rgba(148, 163, 184, 0.45)';

        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
          const a = hand[startIdx];
          const b = hand[endIdx];
          if (!a || !b) continue;
          ctx.beginPath();
          ctx.moveTo(mapX(a.x), mapY(a.y));
          ctx.lineTo(mapX(b.x), mapY(b.y));
          ctx.stroke();
        }

        for (let i = 0; i < hand.length; i++) {
          const lm = hand[i];
          const isIndexTip = i === 8;
          ctx.beginPath();
          ctx.arc(mapX(lm.x), mapY(lm.y), isIndexTip ? 5.5 : 2.8, 0, Math.PI * 2);
          ctx.fillStyle =
            isIndexTip
              ? activeGesture === 'INDEX_DRAW'
                ? '#22D3EE'
                : '#F8FAFC'
              : '#CBD5E1';
          ctx.fill();
        }
        ctx.restore();
      }
    },
    []
  );

  const renderCursor = useCallback(
    (point: CanvasPoint | null, activeGesture: GestureType) => {
      const canvas = cursorCanvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;

      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!point || activeGesture === 'NO_HAND') {
        ctx.restore();
        return;
      }

      ctx.scale(dpr, dpr);
      const px = point.x * width;
      const py = point.y * height;

      const isDrawing = activeGesture === 'INDEX_DRAW';
      const isPaused = activeGesture === 'CLOSED_FIST';
      const activeTool = toolRef.current;
      const scaledSize = Math.max(
        4,
        brushSizeRef.current * (Math.max(width, 400) / 1000) * (activeTool === 'eraser' ? 1.8 : 1)
      );

      // Outer ring indicating brush size or state
      ctx.beginPath();
      const ringRadius = isDrawing
        ? Math.max(scaledSize * 0.5, 6)
        : Math.max(scaledSize * 0.5 + 5, 13);
      ctx.arc(px, py, ringRadius, 0, Math.PI * 2);

      if (isPaused) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      } else if (isDrawing) {
        ctx.strokeStyle = activeTool === 'eraser' ? '#F43F5E' : '#22D3EE';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, Math.max(scaledSize * 0.5, 3), 0, Math.PI * 2);
        ctx.fillStyle =
          activeTool === 'eraser'
            ? 'rgba(244, 63, 94, 0.25)'
            : colorRef.current;
        ctx.fill();
      } else {
        // Hover / pen lifted ring (Open Palm)
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
        ctx.lineWidth = 1.75;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = activeTool === 'eraser' ? '#F43F5E' : colorRef.current;
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  const finalizeActiveStrokeIfAny = useCallback(() => {
    const engine = engineRef.current;
    if (engine && engine.isDrawing()) {
      const committed = engine.endStroke();
      if (committed) {
        onStrokeComplete();
      }
    }
  }, [engineRef, onStrokeComplete]);

  const stopCamera = useCallback(
    (reason?: string) => {
      isRunningRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      finalizeActiveStrokeIfAny();
      cameraRef.current.stop();
      gestureRef.current.reset();
      smootherRef.current.reset();
      clearOverlayCanvases();

      setCameraStatus(reason ? 'error' : 'stopped');
      setHandDetected(false);
      setHandCount(0);
      setGesture('NO_HAND');
      setTrackingFps(0);
      setCameraResolution('');
      if (reason) {
        setErrorMessage(reason);
      }
    },
    [clearOverlayCanvases, finalizeActiveStrokeIfAny]
  );

  const runTrackingLoop = useCallback(() => {
    if (!isRunningRef.current) {
      return;
    }

    const video = videoRef.current;
    const engine = engineRef.current;
    const cursorCanvas = cursorCanvasRef.current;

    if (!video || !engine || !cameraRef.current.isActive()) {
      return;
    }

    // Pause inference cleanly when tab is hidden
    if (document.visibilityState === 'hidden') {
      finalizeActiveStrokeIfAny();
      smootherRef.current.reset();
      rafIdRef.current = requestAnimationFrame(runTrackingLoop);
      return;
    }

    const nowMs = performance.now();
    const frame = trackerRef.current.processFrame(
      video,
      nowMs,
      settingsRef.current.targetFps
    );

    if (frame) {
      const result = gestureRef.current.detect(frame.landmarks);

      renderHandSkeleton(frame.landmarks, result.gesture);

      if (result.gesture === 'NO_HAND' || !result.indexTip) {
        finalizeActiveStrokeIfAny();
        smootherRef.current.reset();
        renderCursor(null, 'NO_HAND');
      } else {
        const mapped = mapLandmarkToCanvasNormalized(result.indexTip, {
          mirrorX: settingsRef.current.mirrorPreview,
          activeMargin: settingsRef.current.activeZoneMargin,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          canvasWidth: cursorCanvas?.clientWidth || 1280,
          canvasHeight: cursorCanvas?.clientHeight || 720,
        });

        const smoothed = smootherRef.current.filter(mapped, nowMs);
        renderCursor(smoothed, result.gesture);

        if (result.gesture === 'INDEX_DRAW') {
          if (!engine.isDrawing()) {
            engine.beginStroke(
              smoothed,
              toolRef.current,
              colorRef.current,
              brushSizeRef.current
            );
          } else {
            engine.addPoint(smoothed);
          }
        } else {
          finalizeActiveStrokeIfAny();
        }
      }

      // Throttle React state updates (~10Hz) for HUD indicators to prevent excess re-renders
      if (nowMs - lastUiSyncRef.current > 95) {
        lastUiSyncRef.current = nowMs;
        setGesture(result.gesture);
        setHandDetected(result.handCount > 0);
        setHandCount(result.handCount);
        setTrackingFps(frame.fps);
      }
    }

    rafIdRef.current = requestAnimationFrame(runTrackingLoop);
  }, [
    engineRef,
    finalizeActiveStrokeIfAny,
    renderCursor,
    renderHandSkeleton,
  ]);

  const startCamera = useCallback(
    async (overrideDeviceId?: string) => {
      const video = videoRef.current;
      if (!video) return;

      setErrorMessage(null);
      setCameraStatus('requesting');

      try {
        const deviceToUse =
          overrideDeviceId !== undefined
            ? overrideDeviceId
            : settingsRef.current.selectedDeviceId;

        const camInfo = await cameraRef.current.start(video, {
          deviceId: deviceToUse || undefined,
          onTrackEnded: () => {
            stopCamera('Your camera stream ended unexpectedly or was disconnected.');
            addToast('warning', 'Camera disconnected', 'The active webcam stream stopped.');
          },
        });

        setCameraResolution(`${camInfo.width}×${camInfo.height}`);
        setDevices(camInfo.devices);
        setCameraStatus('ready');

        if (!trackerRef.current.isReady()) {
          setModelStatus('loading');
          try {
            const usedDelegate = await trackerRef.current.initialize(
              settingsRef.current.delegateMode
            );
            setActiveDelegate(usedDelegate);
            setModelStatus('ready');
          } catch (modelErr) {
            setModelStatus('error');
            cameraRef.current.stop();
            setCameraStatus('error');
            const msg =
              modelErr instanceof Error
                ? modelErr.message
                : 'Failed to load MediaPipe Hand Landmarker model.';
            setErrorMessage(
              `Hand tracking model failed to initialize: ${msg}. Check your connection and try again.`
            );
            return;
          }
        }

        gestureRef.current.reset();
        smootherRef.current.reset();
        isRunningRef.current = true;
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(runTrackingLoop);
        addToast('success', 'Camera & hand tracking active', 'Raise your hand in frame to write.');
      } catch (err) {
        setCameraStatus('error');
        const message =
          err instanceof Error ? err.message : 'Unable to initialize webcam.';
        setErrorMessage(message);
        addToast('error', 'Camera unavailable', message);
      }
    },
    [addToast, runTrackingLoop, stopCamera]
  );

  const updateSettings = useCallback(
    async (patch: Partial<AirWriteSettings>) => {
      const next = { ...settingsRef.current, ...patch };
      setSettings(next);
      settingsRef.current = next;

      if (patch.delegateMode && trackerRef.current.isReady()) {
        setModelStatus('loading');
        try {
          const used = await trackerRef.current.initialize(patch.delegateMode);
          setActiveDelegate(used);
          setModelStatus('ready');
          addToast('info', `Tracking backend: ${used}`);
        } catch {
          setModelStatus('error');
        }
      }

      if (
        patch.selectedDeviceId !== undefined &&
        patch.selectedDeviceId !== settings.selectedDeviceId &&
        cameraRef.current.isActive()
      ) {
        await startCamera(patch.selectedDeviceId);
      }
    },
    [addToast, settings.selectedDeviceId, startCamera]
  );

  // Handle tab visibility changes cleanly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        finalizeActiveStrokeIfAny();
        smootherRef.current.reset();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [finalizeActiveStrokeIfAny]);

  // Cleanup camera & MediaPipe resources on unmount or page unload
  useEffect(() => {
    const cleanupAll = () => {
      isRunningRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      cameraRef.current.stop();
      trackerRef.current.dispose();
    };

    window.addEventListener('beforeunload', cleanupAll);
    window.addEventListener('pagehide', cleanupAll);

    return () => {
      window.removeEventListener('beforeunload', cleanupAll);
      window.removeEventListener('pagehide', cleanupAll);
      cleanupAll();
    };
  }, []);

  return {
    videoRef,
    previewOverlayCanvasRef,
    cursorCanvasRef,
    cameraStatus,
    modelStatus,
    activeDelegate,
    gesture,
    handDetected,
    handCount,
    trackingFps,
    cameraResolution,
    devices,
    errorMessage,
    setErrorMessage,
    toasts,
    addToast,
    dismissToast,
    showOnboarding,
    dismissOnboarding,
    settings,
    updateSettings,
    settingsOpen,
    setSettingsOpen,
    startCamera,
    stopCamera,
  };
}
