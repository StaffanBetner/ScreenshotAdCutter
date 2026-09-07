import React from 'react';
import {
  Scissors,
  Upload,
  Sparkles,
  Undo2,
  Redo2,
  Download,
  Eye,
  Columns2,
  Edit3,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onUploadClick: () => void;
  onLoadSample: () => void;
  onResetCuts: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onCopyClipboard: () => void;
  hasImage: boolean;
  isCopied: boolean;
  cutCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onUploadClick,
  onLoadSample,
  onResetCuts,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onCopyClipboard,
  hasImage,
  isCopied,
  cutCount,
}) => {
  return (
    <header
      id="app-header"
      className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs"
    >
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs ring-2 ring-indigo-500/20">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              Screenshot Ad Cutter
            </h1>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/80">
              Artikelklippare
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Klipp bort reklamsektioner i höjdled och sammanfoga till en ren bild
          </p>
        </div>
      </div>

      {/* Center: View Switcher (when image loaded) */}
      {hasImage && (
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          <button
            id="view-mode-editor-btn"
            onClick={() => onViewModeChange('editor')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'editor'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="hidden sm:inline">Redigera klipp</span>
            <span className="sm:hidden">Redigera</span>
            {cutCount > 0 && (
              <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full border border-indigo-200/60">
                {cutCount}
              </span>
            )}
          </button>

          <button
            id="view-mode-preview-btn"
            onClick={() => onViewModeChange('preview')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Ren bild</span>
          </button>

          <button
            id="view-mode-split-btn"
            onClick={() => onViewModeChange('split')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Jämför</span>
          </button>
        </div>
      )}

      {/* Right Controls: History, Upload, Sample, Export */}
      <div className="flex items-center gap-2">
        {hasImage && (
          <div className="hidden md:flex items-center gap-1 mr-1 border-r border-slate-200 pr-2">
            <button
              id="undo-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Ångra (Ctrl+Z)"
              className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-slate-100 transition"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              id="redo-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Gör om (Ctrl+Y)"
              className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-slate-100 transition"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              id="reset-cuts-btn"
              onClick={onResetCuts}
              title="Återställ alla klipp"
              className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          id="load-sample-btn"
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Testa exempel</span>
          <span className="sm:hidden">Exempel</span>
        </button>

        <button
          id="upload-image-btn"
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs transition"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-600" />
          <span>Välj bild</span>
        </button>

        {hasImage && (
          <div className="flex items-center gap-1.5 ml-1">
            <button
              id="quick-copy-btn"
              onClick={onCopyClipboard}
              title="Kopiera ren bild till urklipp"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs transition"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Kopierad!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Kopiera</span>
                </>
              )}
            </button>

            <button
              id="export-image-btn"
              onClick={onExport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spara ren bild</span>
              <span className="sm:hidden">Spara</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
