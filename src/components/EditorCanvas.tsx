import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Eye,
  EyeOff,
  Scissors,
  Plus,
  Minus,
  Move,
  ChevronUp,
  ChevronDown,
  Check,
  ArrowUpDown,
} from 'lucide-react';
import { CutZone, ImageInfo } from '../types';
import { Translations } from '../i18n';

interface EditorCanvasProps {
  imageInfo: ImageInfo;
  cutZones: CutZone[];
  onCutZonesChange: (zones: CutZone[]) => void;
  onAddCutZone: (startY: number, endY: number) => void;
  onDeleteCutZone: (id: string) => void;
  onToggleCutZone: (id: string) => void;
  activeZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  t: Translations;
}

type DragMode =
  | { type: 'create'; startY: number; currentY: number }
  | { type: 'resize-top'; zoneId: string; initialY: number; origStartY: number }
  | { type: 'resize-bottom'; zoneId: string; initialY: number; origEndY: number }
  | { type: 'move'; zoneId: string; initialY: number; origStartY: number; origEndY: number }
  | null;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  imageInfo,
  cutZones,
  onCutZonesChange,
  onAddCutZone,
  onDeleteCutZone,
  onToggleCutZone,
  activeZoneId,
  onSelectZone,
  scrollContainerRef,
  t,
}) => {
  const [scale, setScale] = useState<number>(1);
  const isUserZoomedRef = useRef<boolean>(false);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [panelPlacement, setPanelPlacement] = useState<'auto' | 'top' | 'bottom'>('auto');
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(600);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Reset panel placement override when switching to another zone
  useEffect(() => {
    setPanelPlacement('auto');
  }, [activeZoneId]);

  // Track container scroll position and height to detect offscreen boundaries
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateMetrics = () => {
      setScrollTop(container.scrollTop);
      setViewportHeight(container.clientHeight);
    };

    updateMetrics();
    container.addEventListener('scroll', updateMetrics, { passive: true });
    window.addEventListener('resize', updateMetrics);
    return () => {
      container.removeEventListener('scroll', updateMetrics);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [scrollContainerRef]);

  // Scroll to a specific pixel Y coordinate in the image
  const scrollToPixelY = useCallback(
    (pixelY: number) => {
      if (!scrollContainerRef.current) return;
      const targetTop = pixelY * scale;
      const containerHeight = scrollContainerRef.current.clientHeight;
      // Position target safely in the upper-middle of viewport, leaving plenty of room above mobile panel
      const visibleOffset = Math.max(100, (containerHeight - 200) / 2);
      const scrollGoal = Math.max(0, targetTop - visibleOffset);
      scrollContainerRef.current.scrollTo({
        top: scrollGoal,
        behavior: 'smooth',
      });
    },
    [scale, scrollContainerRef]
  );

  // Calculate scale that fits the image width snugly within the viewport
  const calculateFitScale = useCallback(
    (explicitContainerWidth?: number) => {
      const container = scrollContainerRef.current;
      if (!container || !imageInfo.width) return 1;
      const cw = explicitContainerWidth ?? container.clientWidth;
      if (cw <= 0) return 1;

      const isMobile = window.innerWidth < 640;
      // Pixel ruler: 32px on mobile (w-8), 48px on sm+ (w-12)
      const rulerW = isMobile ? 32 : 48;
      // Container padding: 12px*2=24px on mobile (p-3), 24px*2=48px on sm+ (p-6)
      const paddingW = isMobile ? 24 : 48;
      // Safety margin to prevent horizontal scrolling / rounding clipping
      const safetyMargin = 6;

      const availableW = Math.max(120, cw - rulerW - paddingW - safetyMargin);
      const fit = Number((availableW / imageInfo.width).toFixed(2));
      return Math.max(0.1, Math.min(1.5, fit));
    },
    [imageInfo.width, scrollContainerRef]
  );

  // Auto-fit scale to page width on load and observe container resize
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Reset user zoom flag on image change so new image always fits width
    isUserZoomedRef.current = false;

    const applyFit = () => {
      if (!isUserZoomedRef.current && container.clientWidth > 0) {
        const fitScale = calculateFitScale(container.clientWidth);
        setScale(fitScale);
      }
    };

    applyFit();

    // Use ResizeObserver to respond dynamically to mobile viewports, orientations, and iframe adjustments
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (!isUserZoomedRef.current && width > 0) {
          const fitScale = calculateFitScale(width);
          setScale(fitScale);
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [calculateFitScale, imageInfo.width, imageInfo.url, scrollContainerRef]);

  // Convert client coordinates to image pixel Y
  const getImagePixelY = useCallback(
    (clientY: number) => {
      if (!imageWrapperRef.current) return 0;
      const rect = imageWrapperRef.current.getBoundingClientRect();
      const relativeY = (clientY - rect.top) / scale;
      return Math.round(Math.max(0, Math.min(imageInfo.height, relativeY)));
    },
    [scale, imageInfo.height]
  );

  // Pointer handlers for drawing new cuts, tap-to-cut, or adjusting existing ones
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('[data-zone-action]')) {
      return;
    }

    const clickedY = getImagePixelY(e.clientY);
    setDragMode({
      type: 'create',
      startY: clickedY,
      currentY: clickedY,
    });
    onSelectZone(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('[data-zone-action]')) {
      return;
    }

    const touch = e.touches[0];
    const clickedY = getImagePixelY(touch.clientY);
    setDragMode({
      type: 'create',
      startY: clickedY,
      currentY: clickedY,
    });
    onSelectZone(null);
  };

  const handlePointerMove = useCallback(
    (clientY: number) => {
      const currentPixelY = getImagePixelY(clientY);
      setHoverY(currentPixelY);

      if (!dragMode) return;

      if (dragMode.type === 'create') {
        setDragMode((prev) => (prev?.type === 'create' ? { ...prev, currentY: currentPixelY } : prev));
      } else if (dragMode.type === 'resize-top') {
        const delta = currentPixelY - dragMode.initialY;
        const newStart = Math.min(
          cutZones.find((z) => z.id === dragMode.zoneId)?.endY ?? imageInfo.height - 10,
          Math.max(0, Math.round(dragMode.origStartY + delta))
        );
        onCutZonesChange(
          cutZones.map((z) => (z.id === dragMode.zoneId ? { ...z, startY: newStart } : z))
        );
      } else if (dragMode.type === 'resize-bottom') {
        const delta = currentPixelY - dragMode.initialY;
        const newEnd = Math.max(
          cutZones.find((z) => z.id === dragMode.zoneId)?.startY ?? 0 + 10,
          Math.min(imageInfo.height, Math.round(dragMode.origEndY + delta))
        );
        onCutZonesChange(
          cutZones.map((z) => (z.id === dragMode.zoneId ? { ...z, endY: newEnd } : z))
        );
      } else if (dragMode.type === 'move') {
        const delta = currentPixelY - dragMode.initialY;
        const height = dragMode.origEndY - dragMode.origStartY;
        let newStart = Math.round(dragMode.origStartY + delta);
        let newEnd = newStart + height;

        if (newStart < 0) {
          newStart = 0;
          newEnd = height;
        } else if (newEnd > imageInfo.height) {
          newEnd = imageInfo.height;
          newStart = newEnd - height;
        }

        onCutZonesChange(
          cutZones.map((z) => (z.id === dragMode.zoneId ? { ...z, startY: newStart, endY: newEnd } : z))
        );
      }
    },
    [dragMode, getImagePixelY, cutZones, imageInfo.height, onCutZonesChange]
  );

  const handlePointerUp = useCallback(() => {
    if (dragMode?.type === 'create') {
      const start = Math.min(dragMode.startY, dragMode.currentY);
      const end = Math.max(dragMode.startY, dragMode.currentY);
      const delta = end - start;

      if (delta > 12) {
        // Dragged a substantial box: create it directly
        onAddCutZone(start, end);
      } else {
        // Simple tap or click without dragging: just deselect any active zone
        onSelectZone(null);
      }
    }
    setDragMode(null);
  }, [dragMode, onAddCutZone, onSelectZone]);

  // Window listeners for pointer move and up (supports both mouse and mobile touch)
  useEffect(() => {
    if (dragMode) {
      const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientY);
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          // Prevent mobile scrolling while actively dragging or sizing a cut zone
          e.preventDefault();
          handlePointerMove(e.touches[0].clientY);
        }
      };

      const onMouseUp = () => handlePointerUp();
      const onTouchEnd = () => handlePointerUp();

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);

      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
      };
    }
  }, [dragMode, handlePointerMove, handlePointerUp]);

  // Zoom helpers
  const handleZoom = (delta: number) => {
    isUserZoomedRef.current = true;
    setScale((prev) => Math.min(2.5, Math.max(0.15, Number((prev + delta).toFixed(2)))));
  };

  const handleFitWidth = () => {
    isUserZoomedRef.current = false;
    const fitScale = calculateFitScale();
    setScale(fitScale);
  };

  const handleResetZoom = () => {
    isUserZoomedRef.current = true;
    setScale(1);
  };

  // Quick nudge for fine tuning
  const handleNudge = (zoneId: string, deltaY: number, edge: 'top' | 'bottom' | 'both') => {
    onCutZonesChange(
      cutZones.map((z) => {
        if (z.id !== zoneId) return z;
        if (edge === 'top') {
          return { ...z, startY: Math.max(0, Math.min(z.endY - 5, z.startY + deltaY)) };
        } else if (edge === 'bottom') {
          return { ...z, endY: Math.max(z.startY + 5, Math.min(imageInfo.height, z.endY + deltaY)) };
        } else {
          const h = z.endY - z.startY;
          const newStart = Math.max(0, Math.min(imageInfo.height - h, z.startY + deltaY));
          return { ...z, startY: newStart, endY: newStart + h };
        }
      })
    );
  };

  // Generate ruler tick marks
  const rulerTicks = [];
  const tickStep = imageInfo.height > 5000 ? 500 : 200;
  for (let y = 0; y <= imageInfo.height; y += tickStep) {
    rulerTicks.push(y);
  }

  return (
    <div className="relative flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Top Canvas Toolbar / Hints */}
      <div className="bg-white/95 border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 z-20 backdrop-blur-sm shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
            <Scissors className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{t.editorCanvasHint}</span>
            <span className="sm:hidden font-semibold">{t.editorCanvasHintMobile}</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">
            {imageInfo.width} × {imageInfo.height} px
          </span>
          {hoverY !== null && (
            <span className="font-mono text-slate-500 hidden md:inline">
              Y: <span className="text-indigo-600 font-semibold">{hoverY}</span> px
            </span>
          )}
        </div>

        {/* Floating Zoom Controls */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
          <button
            id="zoom-out-btn"
            onClick={() => handleZoom(-0.15)}
            title={t.zoomOut}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="zoom-reset-btn"
            onClick={handleResetZoom}
            title={t.zoom100}
            className="px-2 py-1 text-[11px] font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded transition font-medium"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            id="zoom-in-btn"
            onClick={() => handleZoom(0.15)}
            title={t.zoomIn}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="zoom-fit-width-btn"
            onClick={handleFitWidth}
            title={t.zoomFitWidth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Canvas Viewport */}
      <div
        ref={scrollContainerRef}
        id="editor-scroll-container"
        className="flex-1 overflow-auto p-3 sm:p-6 flex flex-col items-center bg-slate-100 relative"
      >
        <div className="flex relative shrink-0">
          {/* Pixel Ruler on Left */}
          <div
            className="w-8 sm:w-12 border-r border-slate-200 text-[9px] sm:text-[10px] font-mono text-slate-400 select-none relative pr-1 shrink-0"
            style={{ height: `${imageInfo.height * scale}px` }}
          >
            {rulerTicks.map((y) => (
              <div
                key={y}
                className="absolute right-0 flex items-center gap-1 transform -translate-y-1/2"
                style={{ top: `${y * scale}px` }}
              >
                <span>{y}</span>
                <span className="w-1.5 h-[1px] bg-slate-300"></span>
              </div>
            ))}
          </div>

          {/* Image & Cut Overlay Wrapper */}
          <div
            ref={imageWrapperRef}
            id="screenshot-canvas-wrapper"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative cursor-crosshair shadow-md bg-white rounded-none border border-slate-300/80 origin-top touch-manipulation"
            style={{
              width: `${imageInfo.width * scale}px`,
              height: `${imageInfo.height * scale}px`,
            }}
          >
            {/* The Image */}
            <img
              src={imageInfo.url}
              alt="Artikel skärmdump"
              className="w-full h-full object-fill pointer-events-none block select-none"
              style={{
                imageRendering: 'auto',
                WebkitFontSmoothing: 'antialiased',
              }}
              draggable={false}
            />

            {/* Hover Guide line when moving mouse */}
            {hoverY !== null && !dragMode && (
              <div
                className="absolute left-0 right-0 border-b border-indigo-500/70 pointer-events-none z-10"
                style={{ top: `${hoverY * scale}px` }}
              >
                <span className="absolute right-2 -top-5 bg-indigo-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                  Y: {hoverY}px
                </span>
              </div>
            )}

            {/* Live creation drag band */}
            {dragMode?.type === 'create' && (
              <div
                className="absolute left-0 right-0 bg-rose-500/25 border-y-2 border-rose-500 pointer-events-none z-30"
                style={{
                  top: `${Math.min(dragMode.startY, dragMode.currentY) * scale}px`,
                  height: `${Math.abs(dragMode.currentY - dragMode.startY) * scale}px`,
                }}
              >
                <div className="absolute top-2 left-3 bg-rose-600 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xs flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>
                    Klipp ut: {Math.abs(dragMode.currentY - dragMode.startY)} px (y:{' '}
                    {Math.min(dragMode.startY, dragMode.currentY)} –{' '}
                    {Math.max(dragMode.startY, dragMode.currentY)})
                  </span>
                </div>
              </div>
            )}

            {/* Render Existing Cut Zones */}
            {cutZones.map((zone) => {
              const topPx = zone.startY * scale;
              const heightPx = (zone.endY - zone.startY) * scale;
              const isSelected = activeZoneId === zone.id;

              return (
                <div
                  key={zone.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectZone(zone.id);
                  }}
                  className={`absolute left-0 right-0 transition-colors z-20 group ${
                    zone.enabled
                      ? isSelected
                        ? 'bg-rose-500/30 border-t-2 border-b-4 border-rose-600 shadow-sm ring-2 ring-rose-400/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/25 border-t-2 border-b-4 border-rose-500/90'
                      : 'bg-slate-400/20 border-y-2 border-slate-400/50 opacity-60'
                  }`}
                  style={{
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                  }}
                >
                  {/* Subtle diagonal warning stripe pattern */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #f43f5e 0, #f43f5e 10px, transparent 10px, transparent 20px)',
                    }}
                  />

                  {/* Top Resize Handle - with generous touch hit target */}
                  <div
                    data-drag-handle="true"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragMode({
                        type: 'resize-top',
                        zoneId: zone.id,
                        initialY: getImagePixelY(e.clientY),
                        origStartY: zone.startY,
                      });
                      onSelectZone(zone.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        setDragMode({
                          type: 'resize-top',
                          zoneId: zone.id,
                          initialY: getImagePixelY(e.touches[0].clientY),
                          origStartY: zone.startY,
                        });
                        onSelectZone(zone.id);
                      }
                    }}
                    title={t.dragTopEdge}
                    className="absolute -top-3.5 left-0 right-0 h-7 cursor-ns-resize z-30 flex items-center justify-center touch-none group/top before:absolute before:-inset-y-3 before:left-0 before:right-0 before:content-['']"
                  >
                    <div className="w-20 h-2 bg-rose-600 group-hover/top:bg-rose-500 rounded-full shadow transition-all flex items-center justify-center">
                      <div className="w-5 h-0.5 bg-white rounded-full opacity-90" />
                    </div>
                  </div>

                  {/* Move Handle (Middle bar) */}
                  <div
                    data-drag-handle="true"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragMode({
                        type: 'move',
                        zoneId: zone.id,
                        initialY: getImagePixelY(e.clientY),
                        origStartY: zone.startY,
                        origEndY: zone.endY,
                      });
                      onSelectZone(zone.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        setDragMode({
                          type: 'move',
                          zoneId: zone.id,
                          initialY: getImagePixelY(e.touches[0].clientY),
                          origStartY: zone.startY,
                          origEndY: zone.endY,
                        });
                        onSelectZone(zone.id);
                      }
                    }}
                    title={t.dragMoveZone}
                    className="absolute inset-x-0 inset-y-3 cursor-grab active:cursor-grabbing touch-none"
                  />

                  {/* Bottom Resize Handle - prominent high-visibility grip */}
                  <div
                    data-drag-handle="true"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDragMode({
                        type: 'resize-bottom',
                        zoneId: zone.id,
                        initialY: getImagePixelY(e.clientY),
                        origEndY: zone.endY,
                      });
                      onSelectZone(zone.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      if (e.touches.length === 1) {
                        setDragMode({
                          type: 'resize-bottom',
                          zoneId: zone.id,
                          initialY: getImagePixelY(e.touches[0].clientY),
                          origEndY: zone.endY,
                        });
                        onSelectZone(zone.id);
                      }
                    }}
                    title={t.dragBottomEdge}
                    className="absolute -bottom-4.5 left-0 right-0 h-9 cursor-ns-resize z-30 flex items-center justify-center touch-none group/bottom before:absolute before:-inset-y-3 before:left-0 before:right-0 before:content-['']"
                  >
                    <div className="w-28 h-3.5 bg-rose-600 hover:bg-rose-500 rounded-full shadow-md transition-all flex items-center justify-center border-2 border-white">
                      <div className="w-8 h-1 bg-white rounded-full opacity-95" />
                    </div>
                  </div>

                  {/* Bottom Edge Status Badge (anchored to bottom edge of cut) */}
                  <div
                    data-zone-action="true"
                    className="absolute -bottom-9 left-2 sm:left-3 flex items-center gap-1.5 bg-rose-950/95 text-white rounded-lg px-2 sm:px-2.5 py-1 text-xs border border-rose-700 shadow-lg backdrop-blur-sm z-30 select-none pointer-events-auto"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-semibold text-rose-100 text-[11px] whitespace-nowrap">
                      {t.bottomEdgeLabel}
                    </span>
                    <span className="font-mono text-[11px] text-amber-300 font-bold bg-rose-900/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                      Y {zone.endY} px
                    </span>
                    <div className="flex items-center gap-0.5 ml-0.5 border-l border-rose-800 pl-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudge(zone.id, -10, 'bottom');
                        }}
                        title={t.nudgeBottomUp}
                        className="p-1 hover:bg-rose-800 active:bg-rose-700 rounded text-rose-200"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudge(zone.id, 10, 'bottom');
                        }}
                        title={t.nudgeBottomDown}
                        className="p-1 hover:bg-rose-800 active:bg-rose-700 rounded text-rose-200"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Top Zone Label & Quick Action Pill */}
                  <div
                    data-zone-action="true"
                    className="absolute top-2 left-2 sm:left-3 flex items-center gap-1.5 bg-slate-900/90 text-white rounded-lg px-2 sm:px-2.5 py-1 text-xs border border-slate-800 shadow-md backdrop-blur-sm z-30 select-none"
                  >
                    <Scissors className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-semibold text-slate-100">
                      {zone.label || t.cutLabel(1)}
                    </span>
                    <span className="font-mono text-[11px] text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded">
                      -{zone.endY - zone.startY} px
                    </span>
                    <span className="text-[10px] text-slate-400 hidden md:inline">
                      (y: {zone.startY}–{zone.endY})
                    </span>

                    {/* Quick fine-tune arrows */}
                    <div className="flex items-center gap-0.5 ml-1 border-l border-slate-700 pl-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudge(zone.id, -4, 'both');
                        }}
                        title={t.nudgeBothUp}
                        className="p-1 hover:bg-slate-700 rounded text-slate-300"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNudge(zone.id, 4, 'both');
                        }}
                        title={t.nudgeBothDown}
                        className="p-1 hover:bg-slate-700 rounded text-slate-300"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Toggle enabled / disabled */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCutZone(zone.id);
                      }}
                      title={zone.enabled ? t.disableCut : t.enableCut}
                      className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
                    >
                      {zone.enabled ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCutZone(zone.id);
                      }}
                      title="Ta bort detta klipp"
                      className="p-1 hover:bg-rose-900/60 rounded text-rose-400 hover:text-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generous overscroll area so the user can scroll past the end of the image */}
        <div
          id="editor-overscroll-spacer"
          className="w-full shrink-0 flex flex-col items-center justify-start pt-8 pb-36 pointer-events-none select-none"
          style={{ minHeight: `${Math.max(500, Math.round(viewportHeight * 0.85))}px` }}
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/80 border border-slate-300/80 text-[11px] text-slate-500 font-medium shadow-2xs">
            <span>Slut på skärmdumpen • Rulla fritt förbi nederkanten</span>
          </div>
        </div>
      </div>

      {/* Floating Offscreen Edge Indicators when Active Zone Boundary is Hidden */}
      {(() => {
        const activeZone = cutZones.find((z) => z.id === activeZoneId);
        if (!activeZone) return null;

        const bottomScreenY = activeZone.endY * scale - scrollTop;
        const topScreenY = activeZone.startY * scale - scrollTop;

        // Auto-detect if active cut zone extends into or below the lower screen area where a bottom panel would obstruct it
        const isZoneNearBottom = bottomScreenY > viewportHeight - 310;
        const isPanelAtTop = panelPlacement === 'top' || (panelPlacement === 'auto' && isZoneNearBottom);

        const isBottomOffscreen = bottomScreenY > viewportHeight - (isPanelAtTop ? 90 : 220);
        const isTopOffscreen = topScreenY < (isPanelAtTop ? 180 : 45) && bottomScreenY > 70;

        return (
          <>
            {isBottomOffscreen && (
              <button
                id="offscreen-bottom-indicator-btn"
                onClick={() => scrollToPixelY(activeZone.endY)}
                className={`fixed ${
                  isPanelAtTop ? 'bottom-20 lg:bottom-12' : 'bottom-64 lg:bottom-48'
                } left-1/2 -translate-x-1/2 z-40 bg-rose-600 active:bg-rose-700 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl flex items-center gap-1.5 border border-rose-400/50 animate-bounce transition touch-manipulation whitespace-nowrap`}
              >
                <ChevronDown className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t.bottomEdgeBelowNotice(activeZone.endY)}</span>
              </button>
            )}

            {isTopOffscreen && (
              <button
                id="offscreen-top-indicator-btn"
                onClick={() => scrollToPixelY(activeZone.startY)}
                className={`fixed ${
                  isPanelAtTop ? 'top-48 sm:top-52' : 'top-20'
                } left-1/2 -translate-x-1/2 z-40 bg-slate-900 active:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl flex items-center gap-1.5 border border-slate-700 transition touch-manipulation whitespace-nowrap`}
              >
                <ChevronUp className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t.topEdgeAboveNotice(activeZone.startY)}</span>
              </button>
            )}

            {/* Floating Mobile Fine-Tuning Bar for Active Zone */}
            <div
              className={`fixed ${
                isPanelAtTop ? 'top-16 sm:top-20' : 'bottom-16 lg:bottom-5'
              } left-3 right-3 sm:left-auto sm:right-6 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2.5 flex flex-col gap-2 max-w-sm sm:w-84 mx-auto transition-all duration-200 animate-in fade-in`}
            >
              {/* Header: Title, Position toggle, Minimera/Expandera, Klar */}
              <div className="flex items-center justify-between px-1 gap-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 truncate">
                  <Scissors className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{t.selectedZoneCut(activeZone.endY - activeZone.startY)}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden xs:inline">
                    ({activeZone.startY}–{activeZone.endY})
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPanelPlacement(isPanelAtTop ? 'bottom' : 'top')}
                    className="flex items-center gap-0.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 px-1.5 py-0.5 rounded-lg font-medium transition"
                    title={isPanelAtTop ? t.panelToBottom : t.panelToTop}
                  >
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-semibold">{isPanelAtTop ? t.panelDown : t.panelUp}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-lg font-medium transition"
                    title={isPanelCollapsed ? t.expandPanel : t.minimizePanel}
                  >
                    {isPanelCollapsed ? t.expandShort : t.minimizeShort}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectZone(null)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg font-semibold transition"
                  >
                    <Check className="w-3 h-3" />
                    <span>{t.doneBtn}</span>
                  </button>
                </div>
              </div>

            {/* Always-visible Direct Navigation Buttons to Top or Bottom Edge */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => scrollToPixelY(activeZone.startY)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-700 rounded-lg font-medium border border-slate-200 shadow-2xs transition"
                title={t.goToTopEdge}
              >
                <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{t.goToTopEdge}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToPixelY(activeZone.endY)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded-lg font-bold border border-rose-200 shadow-2xs transition"
                title={t.goToBottomEdge(activeZone.endY)}
              >
                <ChevronDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{t.goToBottomEdge(activeZone.endY)}</span>
              </button>
            </div>

            {/* Expandable Controls for Fine-Tuning */}
            {!isPanelCollapsed && (
              <>
                {/* Big Touch Adjustment Buttons for Mobile Thumb Tuning */}
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  <button
                    onClick={() => handleNudge(activeZone.id, -20, 'both')}
                    className="flex flex-col items-center justify-center py-2 px-1 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl font-medium transition touch-manipulation shadow-2xs"
                    title={t.moveUpBtn}
                  >
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] font-semibold">{t.moveUpBtn}</span>
                  </button>

                  <button
                    onClick={() => handleNudge(activeZone.id, 20, 'both')}
                    className="flex flex-col items-center justify-center py-2 px-1 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl font-medium transition touch-manipulation shadow-2xs"
                    title={t.moveDownBtn}
                  >
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] font-semibold">{t.moveDownBtn}</span>
                  </button>

                  <button
                    onClick={() => handleNudge(activeZone.id, 25, 'bottom')}
                    className="flex flex-col items-center justify-center py-2 px-1 bg-indigo-50 active:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition touch-manipulation shadow-2xs border border-indigo-100"
                    title={t.increaseHeightBtn}
                  >
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-semibold">{t.increaseHeightBtn}</span>
                  </button>

                  <button
                    onClick={() => handleNudge(activeZone.id, -25, 'bottom')}
                    className="flex flex-col items-center justify-center py-2 px-1 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl font-medium transition touch-manipulation shadow-2xs"
                    title={t.decreaseHeightBtn}
                  >
                    <Minus className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] font-semibold">{t.decreaseHeightBtn}</span>
                  </button>
                </div>

                {/* Specific Edge Fine-Tuning & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNudge(activeZone.id, -5, 'bottom')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded text-[10px] font-semibold border border-rose-200"
                      title={t.bottomEdgeUpBtn}
                    >
                      {t.bottomEdgeUpBtn}
                    </button>
                    <button
                      onClick={() => handleNudge(activeZone.id, 5, 'bottom')}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded text-[10px] font-semibold border border-rose-200"
                      title={t.bottomEdgeDownBtn}
                    >
                      {t.bottomEdgeDownBtn}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleCutZone(activeZone.id)}
                      className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition"
                      title={activeZone.enabled ? t.disableCut : t.enableCut}
                    >
                      {activeZone.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>

                    <button
                      onClick={() => {
                        onDeleteCutZone(activeZone.id);
                        onSelectZone(null);
                      }}
                      className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deleteCut}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      );
    })()}
  </div>
);
};
