import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CirclePause,
  Hand,
  PenTool,
  RefreshCw,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { WebcamPreview } from './components/WebcamPreview';
import { SidePanel } from './components/SidePanel';
import {
  ClearConfirmModal,
  OnboardingModal,
  SettingsModal,
} from './components/Modals';
import { ToastContainer } from './components/ToastContainer';
import { useCanvasControls } from './modules/canvasControls';
import { useAirWriteController } from './modules/uiController';

export default function App() {
  const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);

  const toastHandlerRef = useRef<
    ((
      type: 'success' | 'info' | 'warning' | 'error',
      title: string,
      description?: string
    ) => void) | null
  >(null);

  const handleCanvasToast = useCallback(
    (
      type: 'success' | 'info' | 'warning' | 'error',
      title: string,
      description?: string
    ) => {
      toastHandlerRef.current?.(type, title, description);
    },
    []
  );

  const canvasControls = useCanvasControls({ onToast: handleCanvasToast });

  const controller = useAirWriteController({
    engineRef: canvasControls.engineRef,
    tool: canvasControls.tool,
    color: canvasControls.color,
    brushSize: canvasControls.brushSize,
    onStrokeComplete: canvasControls.syncHistory,
  });

  useEffect(() => {
    toastHandlerRef.current = controller.addToast;
  }, [controller.addToast]);

  const canvasBgClass =
    canvasControls.backgroundMode === 'white'
      ? 'bg-white'
      : canvasControls.backgroundMode === 'transparent'
      ? 'canvas-checkerboard'
      : 'bg-[#0F1629]';

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B1020] text-[#F8FAFC] overflow-hidden">
      <Header
        cameraStatus={controller.cameraStatus}
        modelStatus={controller.modelStatus}
        gesture={controller.gesture}
        handDetected={controller.handDetected}
        sidePanelOpen={sidePanelOpen}
        onToggleSidePanel={() => setSidePanelOpen((v) => !v)}
        onStartCamera={() => void controller.startCamera()}
        onStopCamera={() => controller.stopCamera()}
        onOpenSettings={() => controller.setSettingsOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
      />

      <Toolbar
        tool={canvasControls.tool}
        color={canvasControls.color}
        brushSize={canvasControls.brushSize}
        backgroundMode={canvasControls.backgroundMode}
        canUndo={canvasControls.history.canUndo}
        canRedo={canvasControls.history.canRedo}
        strokeCount={canvasControls.history.strokeCount}
        onSelectTool={canvasControls.setTool}
        onSelectColor={canvasControls.setColor}
        onChangeBrushSize={canvasControls.setBrushSize}
        onChangeBackground={canvasControls.setBackgroundMode}
        onUndo={canvasControls.handleUndo}
        onRedo={canvasControls.handleRedo}
        onClear={canvasControls.requestClear}
        onExportPNG={canvasControls.handleExportPNG}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Canvas Stage */}
        <main className="flex-1 min-w-0 relative flex flex-col overflow-hidden">
          {/* Error Banner */}
          {controller.errorMessage && (
            <div
              role="alert"
              className="mx-4 mt-3 px-4 py-3 rounded-xl border border-rose-500/35 bg-rose-950/75 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-20 text-xs"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-100">
                    Camera or Tracking Issue
                  </p>
                  <p className="text-rose-200/90 mt-0.5 leading-relaxed">
                    {controller.errorMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void controller.startCamera()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={() => controller.setErrorMessage(null)}
                  aria-label="Dismiss error"
                  className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Drawing Canvas Container */}
          <div
            ref={canvasControls.containerRef}
            className={`relative flex-1 m-3 lg:m-4 rounded-2xl border border-white/10 overflow-hidden shadow-inner ${canvasBgClass}`}
          >
            {/* Subtle alignment dot grid */}
            {controller.settings.showGrid &&
              canvasControls.backgroundMode !== 'transparent' && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-35"
                  style={{
                    backgroundImage:
                      canvasControls.backgroundMode === 'white'
                        ? 'radial-gradient(rgba(15,23,42,0.16) 1px, transparent 1px)'
                        : 'radial-gradient(rgba(148,163,184,0.22) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                />
              )}

            {/* Main Stroke Canvas */}
            <canvas
              ref={canvasControls.canvasRef}
              className="absolute inset-0 w-full h-full block"
            />

            {/* Real-time Fingertip Cursor Overlay Canvas */}
            <canvas
              ref={controller.cursorCanvasRef}
              className="absolute inset-0 w-full h-full block pointer-events-none"
            />

            {/* Contextual Canvas State Indicators (Top-Left) */}
            <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
              {controller.cameraStatus === 'ready' &&
                controller.gesture === 'INDEX_DRAW' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1020]/85 border border-[#22D3EE]/50 text-xs font-semibold text-[#22D3EE] backdrop-blur-sm">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>
                      {canvasControls.tool === 'eraser'
                        ? 'Erasing Active'
                        : 'Drawing Active'}
                    </span>
                  </div>
                )}

              {controller.cameraStatus === 'ready' &&
                controller.gesture === 'CLOSED_FIST' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1020]/85 border border-amber-400/50 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                    <CirclePause className="w-3.5 h-3.5" />
                    <span>Drawing Paused (Closed Fist)</span>
                  </div>
                )}

              {controller.cameraStatus === 'ready' &&
                controller.handCount > 1 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1020]/85 border border-white/15 text-xs font-medium text-[#CBD5E1] backdrop-blur-sm">
                    <Hand className="w-3.5 h-3.5 text-[#818CF8]" />
                    <span>Multiple hands detected · Tracking primary hand</span>
                  </div>
                )}
            </div>

            {/* Empty / Idle Call-to-Action when canvas is clean and camera is off */}
            {canvasControls.history.strokeCount === 0 &&
              controller.cameraStatus !== 'ready' &&
              controller.cameraStatus !== 'requesting' && (
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                  <div className="max-w-md text-center pointer-events-auto rounded-2xl border border-white/10 bg-[#0B1020]/80 backdrop-blur-md p-6 shadow-xl">
                    <div className="w-11 h-11 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <h2 className="font-display text-base font-bold text-[#F8FAFC]">
                      Ready to Write in the Air
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                      Start your webcam, point your index finger to write or erase smoothly, and open your palm to move the cursor without drawing.
                    </p>
                    <button
                      type="button"
                      onClick={() => void controller.startCamera()}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#6366F1] text-white hover:bg-[#5558E6] transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera</span>
                    </button>
                  </div>
                </div>
              )}

            {/* Floating Webcam Preview */}
            <WebcamPreview
              videoRef={controller.videoRef}
              overlayCanvasRef={controller.previewOverlayCanvasRef}
              cameraStatus={controller.cameraStatus}
              modelStatus={controller.modelStatus}
              mirrorPreview={controller.settings.mirrorPreview}
              gesture={controller.gesture}
              handDetected={controller.handDetected}
              trackingFps={controller.trackingFps}
              onStartCamera={() => void controller.startCamera()}
            />
          </div>
        </main>

        {/* Side Guide & Live Diagnostics Panel */}
        <SidePanel
          open={sidePanelOpen}
          onClose={() => setSidePanelOpen(false)}
          cameraStatus={controller.cameraStatus}
          modelStatus={controller.modelStatus}
          activeDelegate={controller.activeDelegate}
          gesture={controller.gesture}
          handDetected={controller.handDetected}
          handCount={controller.handCount}
          trackingFps={controller.trackingFps}
          cameraResolution={controller.cameraResolution}
          strokeCount={canvasControls.history.strokeCount}
        />
      </div>

      {/* Modals & Toasts */}
      <OnboardingModal
        open={controller.showOnboarding || helpModalOpen}
        onClose={() => {
          controller.dismissOnboarding();
          setHelpModalOpen(false);
        }}
        onStartCamera={() => void controller.startCamera()}
      />

      <ClearConfirmModal
        open={canvasControls.confirmClearOpen}
        strokeCount={canvasControls.history.strokeCount}
        onConfirm={canvasControls.confirmClear}
        onCancel={canvasControls.cancelClear}
      />

      <SettingsModal
        open={controller.settingsOpen}
        settings={controller.settings}
        devices={controller.devices}
        activeDelegate={controller.activeDelegate}
        onClose={() => controller.setSettingsOpen(false)}
        onUpdate={(patch) => void controller.updateSettings(patch)}
      />

      <ToastContainer
        toasts={controller.toasts}
        onDismiss={controller.dismissToast}
      />
    </div>
  );
}
