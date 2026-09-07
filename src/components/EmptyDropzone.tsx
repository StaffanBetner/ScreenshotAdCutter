import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Scissors, ShieldCheck, ArrowRight, Clipboard } from 'lucide-react';

interface EmptyDropzoneProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
}

export const EmptyDropzone: React.FC<EmptyDropzoneProps> = ({
  onFileSelect,
  onLoadSample,
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
            <Scissors className="w-3.5 h-3.5" />
            <span>Klipp & sammanfoga vertikala skärmdumpar</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Klipp bort reklam från artiklar
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Har du tagit en lång skärmdump med irriterande banners och sponsrat innehåll mitt i texten?
            Markera reklamsektionerna i höjdled och foga samman resten till en ren, sömlös läsbild.
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
              Släpp din skärmdump här eller <span className="text-indigo-600 underline">bläddra</span>
            </p>
            <p className="text-xs text-slate-500">
              Stöder PNG, JPEG, WebP (alla bildformat)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <Clipboard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tips: Du kan också klistra in direkt med <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono text-[10px] shadow-2xs">Ctrl + V</kbd></span>
          </div>
        </div>

        {/* Sample Article Quick Start Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Har du ingen skärmdump redo?</h3>
              <p className="text-xs text-slate-600">
                Testa direkt med en realistisk nyhetsartikel som innehåller 3 typiska reklamavbrott.
              </p>
            </div>
          </div>

          <button
            id="test-sample-hero-btn"
            onClick={onLoadSample}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <span>Testa exempelartikel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Step Process */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="text-indigo-600 font-bold text-xs">1. Ladda upp</div>
            <p className="text-xs text-slate-800 font-medium">Lång skärmdump</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Lägg till skärmdumpen från mobilen eller datorn.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="text-rose-600 font-bold text-xs">2. Markera</div>
            <p className="text-xs text-slate-800 font-medium">Klipp bort reklam</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dra över de banners och annonser i höjdled du vill ta bort.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="text-emerald-600 font-bold text-xs">3. Sammanfoga</div>
            <p className="text-xs text-slate-800 font-medium">Sömlöst resultat</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Få en ren sammanfogad artikelbild redo att sparas eller delas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
