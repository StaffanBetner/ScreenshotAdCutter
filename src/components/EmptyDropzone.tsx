import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Scissors, ArrowRight, Clipboard, ShieldCheck } from 'lucide-react';
import { Translations } from '../i18n';

interface EmptyDropzoneProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  t: Translations;
}

export const EmptyDropzone: React.FC<EmptyDropzoneProps> = ({
  onFileSelect,
  onLoadSample,
  t,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-100 text-slate-800 overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8 my-auto py-8">
        {/* Hero Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
              <Scissors className="w-3.5 h-3.5" />
              <span>{t.dropzonePill}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.privacyBadge}</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t.dropzoneHeadline}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {t.dropzoneLead}
          </p>
        </div>

        {/* Dropzone Box */}
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-white shadow-xs ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
              : 'border-slate-300 hover:bg-slate-50/80 hover:border-indigo-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-xs">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800">
              {t.dropzoneDragText} <span className="text-indigo-600 underline">{t.dropzoneBrowse}</span>
            </p>
            <p className="text-xs text-slate-500">
              {t.dropzoneSupported}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <Clipboard className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.dropzonePasteTip} <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono text-[10px] shadow-2xs">Ctrl + V</kbd></span>
          </div>
        </div>

        {/* Privacy Note Banner */}
        <div
          id="privacy-assurance-banner"
          className="flex items-center justify-center gap-2 text-xs bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-4 py-2.5 text-emerald-900 shadow-2xs"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-center sm:text-left leading-relaxed">
            <span className="font-semibold">{t.privacyBadge}:</span>{' '}
            <span className="text-emerald-800">{t.privacyNotice}</span>
          </p>
        </div>

        {/* Sample Article Quick Start Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.sampleCardTitle}</h3>
              <p className="text-xs text-slate-600">
                {t.sampleCardDesc}
              </p>
            </div>
          </div>

          <button
            id="test-sample-hero-btn"
            onClick={onLoadSample}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>{t.testSampleArticleBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Step Process */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs">{t.step1Title}</div>
            <p className="text-xs text-slate-800 font-medium">{t.step1Sub}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.step1Desc}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="text-rose-600 font-bold text-xs">{t.step2Title}</div>
            <p className="text-xs text-slate-800 font-medium">{t.step2Sub}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.step2Desc}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="text-emerald-600 font-bold text-xs">{t.step3Title}</div>
            <p className="text-xs text-slate-800 font-medium">{t.step3Sub}</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t.step3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

