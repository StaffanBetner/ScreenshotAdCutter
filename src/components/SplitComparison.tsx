import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Columns2,
  ArrowLeftRight,
  Scissors,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  Check,
  Sliders,
  Layers
} from 'lucide-react';
import { CutZone, ImageInfo, StitchOptions } from '../types';
import { normalizeCutZones, calculateSegments } from '../utils/stitcher';
import { getCachedStitch, getOrGenerateStitchedImage } from '../utils/stitchCache';
import { Translations } from '../i18n';

interface SplitComparisonProps {
  imageInfo: ImageInfo;
  cutZones: CutZone[];
  onBackToEditor: () => void;
  t: Translations;
}

export const SplitComparison: React.FC<SplitComparisonProps> = ({
  imageInfo,
  cutZones,
  onBackToEditor,
  t,
}) => {
  // Check if a stitched result is already cached (e.g. from Clean Preview or prior visit)
  const initialCached = imageInfo.element
    ? getCachedStitch(imageInfo.element, cutZones, { showSeamMarkers: false })
    : null;

  const [cleanUrl, setCleanUrl] = useState<string>(initialCached ? initialCached.blobUrl : '');
  const [cleanHeight, setCleanHeight] = useState<number>(initialCached ? initialCached.totalKeptHeight : imageInfo.height);
  const [scale, setScale] = useState<number>(0.6);
  const [showSeams, setShowSeams] = useState<boolean>(false);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'both' | 'clean' | 'original'>('both');

  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef<boolean>(false);
  const isUserZoomedRef = useRef<boolean>(false);

  // Normalized active cuts to ensure startY <= endY and merged overlaps
  const normalizedCuts = normalizeCutZones(cutZones, imageInfo.height);
  const totalCutHeight = normalizedCuts.reduce((acc, c) => acc + (c.endY - c.startY), 0);

  // Calculate fit scale for comparison column
  const calculateFitScale = useCallback(
    (columnWidth?: number) => {
      const col = leftColRef.current;
      if (!col || !imageInfo.width) return 0.6;
      const cw = columnWidth ?? col.clientWidth;
      if (cw <= 0) return 0.6;
      const isMobile = window.innerWidth < 640;
      const padding = isMobile ? 16 : 36;
      const available = Math.max(100, cw - padding);
      const fit = Number((available / imageInfo.width).toFixed(2));
      return Math.max(0.15, Math.min(1.2, fit));
    },
    [imageInfo.width]
  );

  // Auto-fit scale to column width on mount and on column resize
  useEffect(() => {
    const col = leftColRef.current;
    if (!col) return;

    if (!isUserZoomedRef.current && col.clientWidth > 0) {
      setScale(calculateFitScale(col.clientWidth));
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!isUserZoomedRef.current && entry.contentRect.width > 0) {
          setScale(calculateFitScale(entry.contentRect.width));
        }
      }
    });

    ro.observe(col);
    return () => ro.disconnect();
  }, [calculateFitScale, imageInfo.width]);

  // Retrieve or generate stitched clean image from shared cache
  useEffect(() => {
    if (!imageInfo.element) return;

    let isMounted = true;
    const options: StitchOptions = {
      showSeamMarkers: showSeams,
      seamColor: 'rgba(99, 102, 241, 0.7)',
    };

    // Check synchronous cache first - instant switch without delay
    const cached = getCachedStitch(imageInfo.element, cutZones, options);
    if (cached) {
      setCleanHeight(cached.totalKeptHeight);
      setCleanUrl(cached.blobUrl);
      return;
    }

    getOrGenerateStitchedImage(imageInfo.element, cutZones, options).then((result) => {
      if (!isMounted) return;
      setCleanHeight(result.totalKeptHeight);
      setCleanUrl(result.blobUrl);
    });

    return () => {
      isMounted = false;
    };
  }, [imageInfo, cutZones, showSeams]);

  // Synchronized scrolling between the two columns
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll || isSyncingRef.current) return;
    isSyncingRef.current = true;

    const sourceEl = source === 'left' ? leftColRef.current : rightColRef.current;
    const targetEl = source === 'left' ? rightColRef.current : leftColRef.current;

    if (sourceEl && targetEl) {
      const sourceMaxScroll = sourceEl.scrollHeight - sourceEl.clientHeight;
      const targetMaxScroll = targetEl.scrollHeight - targetEl.clientHeight;
      if (sourceMaxScroll > 0 && targetMaxScroll > 0) {
        const scrollRatio = sourceEl.scrollTop / sourceMaxScroll;
        targetEl.scrollTop = scrollRatio * targetMaxScroll;
      }
    }

    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    isUserZoomedRef.current = true;
    setScale((prev) => Math.min(2.0, Math.max(0.15, Number((prev + delta).toFixed(2)))));
  };

  const handleFitWidth = () => {
    isUserZoomedRef.current = false;
    setScale(calculateFitScale());
  };

  const handleResetZoom = () => {
    isUserZoomedRef.current = true;
    setScale(1);
  };

  // Exact pixel dimensions calculated from scale
  const colPixelWidth = Math.round(imageInfo.width * scale);
  const leftPixelHeight = Math.round(imageInfo.height * scale);
  const rightPixelHeight = Math.round(cleanHeight * scale);

  return (
    <div id="split-comparison-container" className="flex-1 flex flex-col h-full bg-slate-100 text-slate-800 overflow-hidden select-none">
      {/* Top Banner Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Columns2 className="w-4 h-4 text-indigo-600" />
            <span>Sida-vid-sida jämförelse</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-500 font-mono text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span>Original: {imageInfo.height}px</span>
            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
            <span className="text-emerald-700 font-semibold">Ren: {cleanHeight}px</span>
            <span className="text-rose-600">(-{totalCutHeight}px)</span>
          </div>
        </div>

        {/* Center: Zoom Controls with 100% Sharp & Fit Mode */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              id="split-mode-100-btn"
              onClick={handleResetZoom}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition ${
                scale === 1
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.sharpOriginalBadge}
            >
              <span>100%</span>
            </button>
            <button
              id="split-mode-fit-btn"
              onClick={handleFitWidth}
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition ${
                scale !== 1
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.zoomFitWidth}
            >
              <span>{t.zoomFitWidth}</span>
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
            <button
              id="split-zoom-out-btn"
              onClick={() => handleZoom(-0.1)}
              title={t.zoomOut}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              className="px-1.5 sm:px-2 py-0.5 text-[11px] font-mono text-slate-700 rounded font-medium min-w-[34px] sm:min-w-[38px] text-center select-none"
              title={t.zoom100}
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              id="split-zoom-in-btn"
              onClick={() => handleZoom(0.1)}
              title={t.zoomIn}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-medium">
          <button
            onClick={() => setMobileView('both')}
            className={`px-2 py-1 rounded-md transition ${mobileView === 'both' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'text-slate-600'}`}
          >
            {t.bothViewsBtn}
          </button>
          <button
            onClick={() => setMobileView('clean')}
            className={`px-2 py-1 rounded-md transition ${mobileView === 'clean' ? 'bg-white text-emerald-700 font-semibold shadow-2xs' : 'text-slate-600'}`}
          >
            {t.cleanViewBtn}
          </button>
          <button
            onClick={() => setMobileView('original')}
            className={`px-2 py-1 rounded-md transition ${mobileView === 'original' ? 'bg-white text-rose-700 font-semibold shadow-2xs' : 'text-slate-600'}`}
          >
            {t.originalViewBtn}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Seam toggle */}
          <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-2xs">
            <input
              type="checkbox"
              checked={showSeams}
              onChange={(e) => setShowSeams(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
            />
            <span>{t.seamMarkersLabel}</span>
          </label>

          {/* Sync scroll toggle */}
          <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-2xs">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
            />
            <span>{t.syncScrollLabel}</span>
          </label>

          <button
            id="split-back-to-editor-btn"
            onClick={onBackToEditor}
            className="px-2.5 sm:px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1"
          >
            <span>{t.adjustCutsBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Columns Container */}
      <div className={`flex-1 ${mobileView === 'both' ? 'grid grid-cols-2 divide-x divide-slate-200' : 'flex'} overflow-hidden`}>
        {/* Left Column: Original with highlighted ad cuts */}
        {(mobileView === 'both' || mobileView === 'original') && (
          <div className={`flex flex-col h-full overflow-hidden bg-slate-100 ${mobileView === 'original' ? 'w-full' : ''}`}>
            <div className="bg-white px-3 sm:px-4 py-2 text-xs font-semibold text-rose-700 flex items-center justify-between border-b border-slate-200 shadow-2xs shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <Scissors className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{t.compareOriginalColTitle(imageInfo.height)}</span>
              </div>
              <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono font-medium shrink-0 ml-1">
                {t.cutsCountBadge(normalizedCuts.length)}
              </span>
            </div>

          <div
            ref={leftColRef}
            onScroll={() => handleScroll('left')}
            className="flex-1 overflow-auto p-6 bg-slate-100 relative"
          >
            <div className="min-w-fit flex flex-col items-center mx-auto pb-12">
              {/* Exact pixel-dimensioned wrapper matching original aspect ratio */}
              <div
                className="relative bg-white shadow-md border border-slate-300/80 overflow-hidden"
                style={{
                  width: `${colPixelWidth}px`,
                }}
              >
                <img
                  src={imageInfo.url}
                  alt={t.originalAlt}
                  className="w-full h-auto block pointer-events-none select-none"
                  style={{ imageRendering: 'auto' }}
                  draggable={false}
                />

                {/* Overlays on original positioned with exact pixel coordinates */}
                {normalizedCuts.map((cut) => {
                  const startY = Math.min(cut.startY, cut.endY);
                  const endY = Math.max(cut.startY, cut.endY);
                  const cutHeight = endY - startY;

                  const topPx = Math.round(startY * scale);
                  const heightPx = Math.max(2, Math.round(cutHeight * scale));
                  const isHovered = hoveredZoneId === cut.id;
                  const isCompact = heightPx < 28;

                  return (
                    <div
                      key={cut.id}
                      onMouseEnter={() => setHoveredZoneId(cut.id)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                      className={`absolute left-0 right-0 border-y-2 pointer-events-auto transition-all ${
                        isHovered
                          ? 'bg-rose-500/35 border-rose-600 ring-2 ring-rose-400/50 z-10'
                          : 'bg-rose-500/25 border-rose-500/90'
                      }`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                      }}
                      title={`${cut.label || 'Ad'}: ${cutHeight} px`}
                    >
                      {/* Badge placed neatly inside or at top */}
                      <div
                        className={`absolute left-2 flex items-center gap-1 bg-rose-700 text-white rounded font-medium shadow-xs select-none ${
                          isCompact
                            ? 'top-0 text-[9px] px-1.5 py-0'
                            : 'top-1.5 text-[10px] px-2 py-0.5'
                        }`}
                      >
                        <Scissors className="w-2.5 h-2.5" />
                        <span className="font-semibold">{t.cutOutLabel}</span>
                        <span>{cut.label || `${cutHeight} px`}</span>
                        {!isCompact && (
                          <span className="opacity-80 font-mono text-[9px]">
                            ({startY}–{endY}px)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Right Column: Clean stitched result */}
        {(mobileView === 'both' || mobileView === 'clean') && (
          <div className={`flex flex-col h-full overflow-hidden bg-slate-100 ${mobileView === 'clean' ? 'w-full' : ''}`}>
            <div className="bg-white px-3 sm:px-4 py-2 text-xs font-semibold text-emerald-700 flex items-center justify-between border-b border-slate-200 shadow-2xs shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{t.compareCleanColTitle(cleanHeight)}</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-medium shrink-0 ml-1">
                {t.cleanTextBadge}
              </span>
            </div>

            <div
              ref={rightColRef}
              onScroll={() => handleScroll('right')}
              className="flex-1 overflow-auto p-3 sm:p-6 bg-slate-100 relative"
            >
              {cleanUrl ? (
                <div className="min-w-fit flex flex-col items-center mx-auto pb-12">
                  {/* Exact pixel-dimensioned wrapper matching clean stitched image */}
                  <div
                    className="relative bg-white shadow-md border border-slate-300/80 overflow-hidden"
                    style={{
                      width: `${colPixelWidth}px`,
                    }}
                  >
                    <img
                      src={cleanUrl}
                      alt={t.cleanAlt}
                      className="w-full h-auto block select-none"
                      style={{ imageRendering: 'auto' }}
                      draggable={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
                  {t.generatingCleanImage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
