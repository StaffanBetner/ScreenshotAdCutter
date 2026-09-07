import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  Scissors
} from 'lucide-react';
import { CutZone, ImageInfo, StitchOptions } from '../types';
import { stitchImage } from '../utils/stitcher';

interface CleanPreviewProps {
  imageInfo: ImageInfo;
  cutZones: CutZone[];
  onBackToEditor: () => void;
  onCopyClipboard: () => void;
  isCopied: boolean;
}

export const CleanPreview: React.FC<CleanPreviewProps> = ({
  imageInfo,
  cutZones,
  onBackToEditor,
  onCopyClipboard,
  isCopied,
}) => {
  // Keep scale at 1.0 (100% native resolution) by default so preview is razor sharp
  // Users can freely click "Anpassa bredd" or zoom as desired
  const [scale, setScale] = useState<number>(1);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [showSeams, setShowSeams] = useState<boolean>(false);
  const [resultBlobUrl, setResultBlobUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [stats, setStats] = useState<{
    originalHeight: number;
    newHeight: number;
    removedHeight: number;
    cutCount: number;
  }>({
    originalHeight: imageInfo.height,
    newHeight: imageInfo.height,
    removedHeight: 0,
    cutCount: 0,
  });

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const previousUrlRef = useRef<string | null>(null);

  // Generate stitched image whenever cut zones or seam options change.
  // ALWAYS generate a lossless PNG for the preview display so text sharpness is 100% preserved.
  useEffect(() => {
    if (!imageInfo.element) return;
    setIsGenerating(true);

    const options: StitchOptions = {
      showSeamMarkers: showSeams,
      seamColor: 'rgba(99, 102, 241, 0.7)',
    };

    const result = stitchImage(imageInfo.element, cutZones, options);
    previewCanvasRef.current = result.canvas;

    // Use lossless PNG for preview screen display to guarantee zero compression noise
    result.canvas.toBlob(
      (blob) => {
        if (blob) {
          if (previousUrlRef.current) {
            URL.revokeObjectURL(previousUrlRef.current);
          }
          const newUrl = URL.createObjectURL(blob);
          previousUrlRef.current = newUrl;
          setResultBlobUrl(newUrl);
        } else {
          // Fallback to dataURL
          const dataUrl = result.canvas.toDataURL('image/png');
          setResultBlobUrl(dataUrl);
        }
        setIsGenerating(false);
      },
      'image/png'
    );

    setStats({
      originalHeight: imageInfo.height,
      newHeight: result.totalKeptHeight,
      removedHeight: result.totalCutHeight,
      cutCount: cutZones.filter((z) => z.enabled).length,
    });

    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, [imageInfo, cutZones, showSeams]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(2.5, Math.max(0.15, Number((prev + delta).toFixed(2)))));
  };

  const handleFitWidth = () => {
    if (scrollContainerRef.current && imageInfo.width > 0) {
      const availableWidth = scrollContainerRef.current.clientWidth - 80;
      const fitScale = Number((availableWidth / imageInfo.width).toFixed(2));
      setScale(Math.max(0.15, Math.min(2, fitScale)));
    }
  };

  const handleResetZoom = () => setScale(1);

  const handleOpenInNewTab = () => {
    if (resultBlobUrl) {
      window.open(resultBlobUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (!previewCanvasRef.current) return;

    const link = document.createElement('a');
    const ext = format;
    const cleanName = imageInfo.name
      ? imageInfo.name.replace(/\.[^/.]+$/, '') + '-ren-artikel'
      : 'ren-artikel';
    link.download = `${cleanName}.${ext}`;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    link.href = previewCanvasRef.current.toDataURL(mimeType, format === 'jpeg' ? 0.94 : undefined);
    link.click();
  };

  const percentSaved =
    stats.originalHeight > 0
      ? Math.round((stats.removedHeight / stats.originalHeight) * 100)
      : 0;

  // Compute exact scaled dimensions
  const displayWidth = Math.round(imageInfo.width * scale);
  const displayHeight = Math.round(stats.newHeight * scale);

  return (
    <div id="clean-preview-container" className="flex-1 flex flex-col h-full bg-slate-100 text-slate-800 overflow-hidden select-none">
      {/* Top Banner Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20 shadow-xs">
        {/* Statistics Pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-900">Ren skärmdump</span>
            <span className="text-emerald-700 font-mono font-medium">
              ({imageInfo.width} × {stats.newHeight} px)
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-slate-600">
            <span className="text-rose-600 font-medium flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5" />
              -{stats.removedHeight} px borttaget ({percentSaved}%)
            </span>
            <span className="text-slate-300">•</span>
            <span>{stats.cutCount} reklamsektioner klippta</span>
          </div>
        </div>

        {/* Center: Zoom Controls with 100% Sharp & Fit Mode */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              id="preview-mode-100-btn"
              onClick={handleResetZoom}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition ${
                scale === 1
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visa bilden i 100% knivskarp originalupplösning utan nedskalning"
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>100% Skarp</span>
            </button>
            <button
              id="preview-mode-fit-btn"
              onClick={handleFitWidth}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition ${
                scale !== 1
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Anpassa bildens bredd efter fönstret"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Anpassa bredd</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
            <button
              id="preview-zoom-out-btn"
              onClick={() => handleZoom(-0.15)}
              title="Zooma ut"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              className="px-2 py-1 text-[11px] font-mono text-slate-700 rounded font-medium min-w-[42px] text-center select-none"
              title="Aktuell visningsskala"
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              id="preview-zoom-in-btn"
              onClick={() => handleZoom(0.15)}
              title="Zooma in"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Subtle Seams Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-2xs">
            <input
              type="checkbox"
              checked={showSeams}
              onChange={(e) => setShowSeams(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
            />
            <span className="hidden sm:inline">Markera skarvar</span>
          </label>

          {/* Format Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFormat('png')}
              className={`px-2 py-1 rounded font-medium transition ${
                format === 'png' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setFormat('jpeg')}
              className={`px-2 py-1 rounded font-medium transition ${
                format === 'jpeg' ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              JPG
            </button>
          </div>

          {/* Open in new tab button */}
          {resultBlobUrl && (
            <button
              id="preview-new-tab-btn"
              onClick={handleOpenInNewTab}
              title="Öppna ren bild i full storlek i ny flik"
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 shadow-xs transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Copy to Clipboard */}
          <button
            id="preview-copy-btn"
            onClick={onCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 shadow-xs transition"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Kopierad!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kopiera</span>
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            id="preview-download-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ladda ner ren bild</span>
          </button>
        </div>
      </div>

      {/* Main Preview Area - uses min-w-fit mx-auto so nothing is ever clipped on the left */}
      <div
        ref={scrollContainerRef}
        id="clean-preview-scroll-container"
        className="flex-1 overflow-auto p-8 bg-slate-100 relative"
      >
        {!isGenerating && resultBlobUrl ? (
          <div className="min-w-fit flex flex-col items-center mx-auto pb-12">
            {/* Dimensions & Quality Badge */}
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              {scale === 1 ? (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-full font-medium shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">100% Knivskarp originalupplösning</span>
                  <span className="text-emerald-700 font-mono font-medium">({imageInfo.width} × {stats.newHeight} px)</span>
                  <span className="text-emerald-600/70 text-[11px]">• 1:1 pixelmatchning</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs">
                  <span className="text-slate-600">
                    Visas förminskad till <strong className="font-mono text-slate-900 font-semibold">{Math.round(scale * 100)}%</strong> för att passa skärmen
                  </span>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={handleResetZoom}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-300 hover:decoration-indigo-600 transition"
                  >
                    <span>Växla till 100% skarp originalstorlek</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Image display - strictly preserved aspect ratio and width */}
            <div
              className="shadow-md rounded-none border border-slate-300/80 bg-white overflow-hidden transition-all duration-75"
              style={{
                width: `${displayWidth}px`,
              }}
            >
              <img
                src={resultBlobUrl}
                alt="Ren artikel utan reklam"
                className="w-full h-auto block select-none"
                style={{
                  imageRendering: 'auto',
                  WebkitFontSmoothing: 'antialiased',
                }}
              />
            </div>

            {/* Bottom floating helper */}
            <div className="mt-6 flex items-center gap-3 text-xs text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Sektionerna har sammanfogats sömlöst i full originalkvalitet.</span>
              <button
                onClick={onBackToEditor}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 ml-1"
              >
                <span>Justera fler klipp</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Genererar ren bild...</span>
          </div>
        )}
      </div>
    </div>
  );
};

