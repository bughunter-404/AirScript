import React from 'react';
import {
  Download,
  Eraser,
  Pen,
  Redo2,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  BRUSH_PRESETS,
  PALETTE_COLORS,
  type CanvasBackground,
  type DrawingTool,
} from '../types/airwrite';

interface ToolbarProps {
  tool: DrawingTool;
  color: string;
  brushSize: number;
  backgroundMode: CanvasBackground;
  canUndo: boolean;
  canRedo: boolean;
  strokeCount: number;
  onSelectTool: (tool: DrawingTool) => void;
  onSelectColor: (hex: string) => void;
  onChangeBrushSize: (size: number) => void;
  onChangeBackground: (bg: CanvasBackground) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportPNG: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  color,
  brushSize,
  backgroundMode,
  canUndo,
  canRedo,
  strokeCount,
  onSelectTool,
  onSelectColor,
  onChangeBrushSize,
  onChangeBackground,
  onUndo,
  onRedo,
  onClear,
  onExportPNG,
}) => {
  return (
    <div className="shrink-0 border-b border-white/10 bg-[#151D32]/90 backdrop-blur-md px-3 lg:px-5 py-2 flex items-center justify-between gap-3 overflow-x-auto sm:flex-wrap z-20">
      {/* Left Cluster: Tools + Colors + Brush Size */}
      <div className="flex items-center gap-3 shrink-0 sm:shrink sm:flex-wrap">
        {/* Pen / Eraser Segmented Toggle */}
        <div
          className="flex items-center p-1 rounded-lg bg-[#0B1020] border border-white/10"
          role="group"
          aria-label="Drawing Tools"
        >
          <button
            type="button"
            onClick={() => onSelectTool('pen')}
            title="Pen Tool (Shortcut: P)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tool === 'pen'
                ? 'bg-[#6366F1] text-white'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Pen</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('eraser')}
            title="Eraser Tool (Shortcut: E)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              tool === 'eraser'
                ? 'bg-rose-500 text-white'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" aria-hidden="true" />

        {/* Color Palette + Custom Picker */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Color Palette">
          {PALETTE_COLORS.map((swatch) => {
            const isSelected =
              tool === 'pen' && color.toUpperCase() === swatch.hex.toUpperCase();
            return (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => {
                  onSelectTool('pen');
                  onSelectColor(swatch.hex);
                }}
                title={`${swatch.name} (${swatch.hex})`}
                aria-label={`Select ${swatch.name} color`}
                className={`w-6 h-6 rounded-full border transition-transform cursor-pointer shrink-0 ${
                  isSelected
                    ? 'scale-115 ring-2 ring-[#22D3EE] ring-offset-2 ring-offset-[#151D32] border-white'
                    : 'border-white/25 hover:scale-110'
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            );
          })}

          <label
            title="Custom Color Picker"
            className="relative w-7 h-7 rounded-full border border-white/25 overflow-hidden cursor-pointer flex items-center justify-center ml-0.5 hover:border-white/50 transition-colors"
            style={{
              background:
                'conic-gradient(#EF4444, #FACC15, #22C55E, #22D3EE, #6366F1, #A855F7, #EF4444)',
            }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => {
                onSelectTool('pen');
                onSelectColor(e.target.value);
              }}
              aria-label="Custom ink color"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <span
              className="w-3 h-3 rounded-full border border-[#0B1020]/60 pointer-events-none"
              style={{ backgroundColor: color }}
            />
          </label>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" aria-hidden="true" />

        {/* Brush Presets + Custom Slider */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center p-0.5 rounded-lg bg-[#0B1020] border border-white/10"
            role="group"
            aria-label="Brush Size Presets"
          >
            {BRUSH_PRESETS.map((preset) => {
              const active = brushSize === preset.size;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChangeBrushSize(preset.size)}
                  title={`${preset.label} brush (${preset.size}px)`}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#1E293B] text-[#F8FAFC]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={2}
              max={36}
              step={1}
              value={brushSize}
              onChange={(e) => onChangeBrushSize(Number(e.target.value))}
              aria-label="Custom brush size"
              title={`Brush size: ${brushSize}px`}
              className="w-20 accent-[#6366F1] cursor-pointer"
            />
            <span className="font-mono text-xs text-[#94A3B8] w-9 text-right tabular-nums">
              {brushSize}px
            </span>
          </div>
        </div>
      </div>

      {/* Right Cluster: Canvas Background + History + Clear + Export */}
      <div className="flex items-center gap-2 shrink-0 sm:shrink sm:flex-wrap">
        {/* Background Selector */}
        <div
          className="flex items-center p-0.5 rounded-lg bg-[#0B1020] border border-white/10"
          role="group"
          aria-label="Canvas Background"
        >
          {(['dark', 'white', 'transparent'] as CanvasBackground[]).map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => onChangeBackground(bg)}
              title={`Canvas background: ${bg}`}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                backgroundMode === bg
                  ? 'bg-[#1E293B] text-[#F8FAFC]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" aria-hidden="true" />

        {/* Undo / Redo / Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last stroke (Ctrl + Z)"
            aria-label="Undo"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-[#0B1020] text-[#F8FAFC] hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo stroke (Ctrl + Y)"
            aria-label="Redo"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-[#0B1020] text-[#F8FAFC] hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Redo</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={strokeCount === 0}
            title="Clear Canvas (Shortcut: C)"
            aria-label="Clear Canvas"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-[#0B1020] text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/30 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Clear</span>
          </button>
        </div>

        {/* Export PNG */}
        <button
          type="button"
          onClick={onExportPNG}
          title="Download Drawing as PNG"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#22D3EE] text-[#0B1020] hover:bg-[#38DCF4] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export PNG</span>
        </button>
      </div>
    </div>
  );
};
