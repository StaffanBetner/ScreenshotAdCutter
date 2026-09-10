import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CutZone, ImageInfo, ViewMode } from './types';
import { Header } from './components/Header';
import { EditorCanvas } from './components/EditorCanvas';
import { CutZonesSidebar } from './components/CutZonesSidebar';
import { Minimap } from './components/Minimap';
import { CleanPreview } from './components/CleanPreview';
import { SplitComparison } from './components/SplitComparison';
import { EmptyDropzone } from './components/EmptyDropzone';
import { generateSampleArticle, stitchImage } from './utils/stitcher';
import { clearStitchCache, getCachedStitch } from './utils/stitchCache';
import { Check, Info, Plus, Sliders, X, Eye, Github, ExternalLink } from 'lucide-react';

export default function App() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [cutZones, setCutZones] = useState<CutZone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Undo / Redo history
  const [history, setHistory] = useState<CutZone[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Push new state to history
  const pushHistory = useCallback(
    (newZones: CutZone[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newZones];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleCutZonesChange = (newZones: CutZone[], recordHistory = true) => {
    clearStitchCache();
    setCutZones(newZones);
    if (recordHistory) {
      pushHistory(newZones);
    }
  };

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      clearStitchCache();
      const prevZones = history[historyIndex - 1];
      setCutZones(prevZones);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      clearStitchCache();
      const nextZones = history[historyIndex + 1];
      setCutZones(nextZones);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, history]);

  // Load an image from file or URL
  const loadImage = useCallback((fileOrUrl: File | string, suggestedCuts?: CutZone[], name?: string) => {
    const processImage = (url: string, fileName: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        clearStitchCache();
        const info: ImageInfo = {
          url,
          name: fileName,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img,
        };
        setImageInfo(info);
        const cuts = suggestedCuts || [];
        setCutZones(cuts);
        setHistory([cuts]);
        setHistoryIndex(0);
        setViewMode('editor');
        setActiveZoneId(null);
        showToast(`Laddade ${img.naturalWidth} × ${img.naturalHeight} px skärmdump`);
      };
      img.src = url;
    };

    if (fileOrUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processImage(e.target.result as string, fileOrUrl.name);
        }
      };
      reader.readAsDataURL(fileOrUrl);
    } else {
      processImage(fileOrUrl, name || 'artikel-skarmdump.png');
    }
  }, []);

  // Load realistic sample article with 3 ads
  const handleLoadSample = async () => {
    const sample = await generateSampleArticle();
    loadImage(sample.dataUrl, [], 'exempel-artikel.png');
    showToast('Exempelartikel laddad – markera över annonserna för att klippa!');
  };

  // Add cut zone
  const handleAddCutZone = (startY: number, endY: number, label?: string) => {
    const newZone: CutZone = {
      id: `cut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      startY: Math.min(startY, endY),
      endY: Math.max(startY, endY),
      label: label || `Klippzon (${Math.abs(endY - startY)} px)`,
      enabled: true,
    };
    const updated = [...cutZones, newZone].sort((a, b) => a.startY - b.startY);
    handleCutZonesChange(updated);
    setActiveZoneId(newZone.id);
  };

  const handleAddManualCut = () => {
    if (!imageInfo) return;
    // Default 250px cut in middle of viewport or image
    const midY = Math.round(imageInfo.height / 2);
    const startY = Math.max(0, midY - 120);
    const endY = Math.min(imageInfo.height, midY + 120);
    handleAddCutZone(startY, endY, 'Manuell klippzon');
  };

  const handleDeleteCutZone = (id: string) => {
    const updated = cutZones.filter((z) => z.id !== id);
    handleCutZonesChange(updated);
    if (activeZoneId === id) setActiveZoneId(null);
  };

  const handleToggleCutZone = (id: string) => {
    const updated = cutZones.map((z) => (z.id === id ? { ...z, enabled: !z.enabled } : z));
    handleCutZonesChange(updated);
  };

  const handleResetCuts = () => {
    if (cutZones.length === 0) return;
    if (window.confirm('Är du säker på att du vill ta bort alla klippzoner?')) {
      handleCutZonesChange([]);
      setActiveZoneId(null);
      showToast('Alla klippzoner rensades');
    }
  };

  // Scroll to a specific cut zone in the editor (supports top or bottom edge)
  const handleScrollToZone = (zone: CutZone, edge: 'top' | 'bottom' = 'top') => {
    if (!scrollContainerRef.current || !imageInfo) return;
    const container = scrollContainerRef.current;
    const pixelCoord = edge === 'bottom' ? zone.endY : zone.startY;
    const imageWrapper = container.querySelector('#screenshot-canvas-wrapper') as HTMLElement | null;

    if (imageWrapper) {
      const scale = imageWrapper.clientHeight / Math.max(1, imageInfo.height);
      const targetY = imageWrapper.offsetTop + pixelCoord * scale;
      // Position target comfortably in view leaving room for toolbars
      const offset = edge === 'bottom' ? Math.round(container.clientHeight * 0.45) : Math.round(container.clientHeight * 0.25);
      container.scrollTo({ top: Math.max(0, targetY - offset), behavior: 'smooth' });
    } else {
      const scrollRatio = pixelCoord / Math.max(1, imageInfo.height);
      const scrollableRange = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTo({ top: Math.max(0, scrollRatio * scrollableRange - 120), behavior: 'smooth' });
    }
    setActiveZoneId(zone.id);
  };

  // Global Clipboard paste support (Ctrl+V anywhere)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          loadImage(file);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadImage]);

  // Global Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeZoneId) {
          e.preventDefault();
          handleDeleteCutZone(activeZoneId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, activeZoneId, cutZones]);

  // Copy clean stitched image to clipboard
  const handleCopyClipboard = async () => {
    if (!imageInfo?.element) return;
    try {
      const cached = getCachedStitch(imageInfo.element, cutZones, { showSeamMarkers: false });
      const canvas = cached ? cached.canvas : stitchImage(imageInfo.element, cutZones).canvas;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setIsCopied(true);
          showToast('Ren bild kopierad till urklipp!');
          setTimeout(() => setIsCopied(false), 2500);
        } catch {
          // Fallback if clipboard API permission restricted
          showToast('Urklipp begränsat i webbläsaren. Ladda ner bilden i stället.');
        }
      }, 'image/png');
    } catch {
      showToast('Kunde inte kopiera bilden.');
    }
  };

  // Quick export action from top bar
  const handleQuickExport = () => {
    if (!imageInfo?.element) return;
    const cached = getCachedStitch(imageInfo.element, cutZones, { showSeamMarkers: false });
    const canvas = cached ? cached.canvas : stitchImage(imageInfo.element, cutZones).canvas;
    const link = document.createElement('a');
    const cleanName = imageInfo.name
      ? imageInfo.name.replace(/\.[^/.]+$/, '') + '-ren-artikel.png'
      : 'ren-artikel.png';
    link.download = cleanName;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Den rena bilden laddades ner!');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {/* Hidden file input for header/dropzone upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            loadImage(e.target.files[0]);
          }
        }}
      />

      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onUploadClick={() => fileInputRef.current?.click()}
        onLoadSample={handleLoadSample}
        onResetCuts={handleResetCuts}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onExport={handleQuickExport}
        onCopyClipboard={handleCopyClipboard}
        hasImage={imageInfo !== null}
        isCopied={isCopied}
        cutCount={cutZones.filter((z) => z.enabled).length}
      />

      {/* Main Work Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {!imageInfo ? (
          <EmptyDropzone
            onFileSelect={loadImage}
            onLoadSample={handleLoadSample}
          />
        ) : (
          <>
            {viewMode === 'editor' && (
              <div className="flex-1 flex h-full overflow-hidden">
                <EditorCanvas
                  imageInfo={imageInfo}
                  cutZones={cutZones}
                  onCutZonesChange={handleCutZonesChange}
                  onAddCutZone={handleAddCutZone}
                  onDeleteCutZone={handleDeleteCutZone}
                  onToggleCutZone={handleToggleCutZone}
                  activeZoneId={activeZoneId}
                  onSelectZone={setActiveZoneId}
                  scrollContainerRef={scrollContainerRef}
                />

                <div className="hidden xl:block h-full">
                  <Minimap
                    imageInfo={imageInfo}
                    cutZones={cutZones}
                    scrollContainerRef={scrollContainerRef}
                    onSelectZone={setActiveZoneId}
                    activeZoneId={activeZoneId}
                  />
                </div>

                <div className="hidden lg:block h-full">
                  <CutZonesSidebar
                    imageInfo={imageInfo}
                    cutZones={cutZones}
                    onCutZonesChange={handleCutZonesChange}
                    onAddManualCut={handleAddManualCut}
                    onDeleteZone={handleDeleteCutZone}
                    onToggleZone={handleToggleCutZone}
                    activeZoneId={activeZoneId}
                    onSelectZone={setActiveZoneId}
                    onScrollToZone={handleScrollToZone}
                    canUndo={historyIndex > 0}
                    onUndo={handleUndo}
                  />
                </div>
              </div>
            )}

            {/* Mobile Bottom Toolbar for Editor Mode */}
            {viewMode === 'editor' && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shadow-lg">
                <button
                  id="mobile-add-cut-btn"
                  onClick={handleAddManualCut}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                  title="Lägg till en ny klippzon manuellt"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Klippzon</span>
                </button>

                <button
                  id="mobile-zones-drawer-btn"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold relative transition"
                  title="Öppna lista över alla klippzoner"
                >
                  <Sliders className="w-4 h-4 text-slate-600" />
                  <span>Zoner</span>
                  {cutZones.filter((z) => z.enabled).length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {cutZones.filter((z) => z.enabled).length}
                    </span>
                  )}
                </button>

                <button
                  id="mobile-preview-btn"
                  onClick={() => setViewMode('preview')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 active:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200/60 transition"
                  title="Se den färdiga rena bilden"
                >
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Ren bild</span>
                </button>
              </div>
            )}

            {/* Mobile Cut Zones Drawer Sheet */}
            {isMobileDrawerOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
                <div
                  className="fixed inset-0"
                  onClick={() => setIsMobileDrawerOpen(false)}
                />
                <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom">
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Klippsektioner</h3>
                    </div>
                    <button
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <CutZonesSidebar
                      imageInfo={imageInfo}
                      cutZones={cutZones}
                      onCutZonesChange={handleCutZonesChange}
                      onAddManualCut={handleAddManualCut}
                      onDeleteZone={handleDeleteCutZone}
                      onToggleZone={handleToggleCutZone}
                      activeZoneId={activeZoneId}
                      onSelectZone={(id) => {
                        setActiveZoneId(id);
                        if (id) setIsMobileDrawerOpen(false);
                      }}
                      onScrollToZone={(zone) => {
                        handleScrollToZone(zone);
                        setIsMobileDrawerOpen(false);
                      }}
                      canUndo={historyIndex > 0}
                      onUndo={handleUndo}
                    />
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'preview' && (
              <CleanPreview
                imageInfo={imageInfo}
                cutZones={cutZones}
                onBackToEditor={() => setViewMode('editor')}
                onCopyClipboard={handleCopyClipboard}
                isCopied={isCopied}
              />
            )}

            {viewMode === 'split' && (
              <SplitComparison
                imageInfo={imageInfo}
                cutZones={cutZones}
                onBackToEditor={() => setViewMode('editor')}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Repository Banner */}
      <footer
        id="github-repo-banner"
        className={`shrink-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs text-slate-500 z-20 ${
          imageInfo && viewMode === 'editor' ? 'mb-14 lg:mb-0' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="text-slate-700 font-medium truncate">Screenshot Ad Cutter</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-slate-500 truncate">Öppen källkod</span>
        </div>
        <a
          id="github-repo-banner-link"
          href="https://github.com/StaffanBetner/ScreenshotAdCutter"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-indigo-600 transition bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs group shrink-0"
          title="Öppna GitHub-repositoryt i en ny flik"
        >
          <Github className="w-3.5 h-3.5 text-slate-700 group-hover:text-indigo-600 transition" />
          <span className="hidden sm:inline text-slate-500 group-hover:text-indigo-600">GitHub:</span>
          <span className="font-semibold">StaffanBetner/ScreenshotAdCutter</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
        </a>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 shadow-xl text-xs backdrop-blur-md transition-all">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
