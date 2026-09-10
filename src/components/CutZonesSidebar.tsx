import React from 'react';
import {
  Scissors,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { CutZone, ImageInfo } from '../types';
import { Translations } from '../i18n';

interface CutZonesSidebarProps {
  imageInfo: ImageInfo;
  cutZones: CutZone[];
  onCutZonesChange: (zones: CutZone[]) => void;
  onAddManualCut: () => void;
  onDeleteZone: (id: string) => void;
  onToggleZone: (id: string) => void;
  activeZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onScrollToZone: (zone: CutZone, edge?: 'top' | 'bottom') => void;
  canUndo?: boolean;
  onUndo?: () => void;
  t: Translations;
}

export const CutZonesSidebar: React.FC<CutZonesSidebarProps> = ({
  imageInfo,
  cutZones,
  onCutZonesChange,
  onAddManualCut,
  onDeleteZone,
  onToggleZone,
  activeZoneId,
  onSelectZone,
  onScrollToZone,
  canUndo,
  onUndo,
  t,
}) => {
  // Stats
  const activeCuts = cutZones.filter((z) => z.enabled);
  const totalRemovedHeight = activeCuts.reduce(
    (sum, z) => sum + Math.max(0, z.endY - z.startY),
    0
  );
  const remainingHeight = Math.max(0, imageInfo.height - totalRemovedHeight);
  const percentSaved =
    imageInfo.height > 0 ? Math.round((totalRemovedHeight / imageInfo.height) * 100) : 0;

  const handleUpdateZone = (id: string, updates: Partial<CutZone>) => {
    onCutZonesChange(
      cutZones.map((z) => (z.id === id ? { ...z, ...updates } : z))
    );
  };

  return (
    <aside
      id="cut-zones-sidebar"
      className="w-full lg:w-80 bg-white border-l border-slate-200 flex flex-col h-full text-slate-800 shrink-0 shadow-xs"
    >
      {/* Sidebar Header & Stats */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">{t.sidebarTitle}</h2>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            {t.activeZonesCount(activeCuts.length)}
          </span>
        </div>

        {/* Height Compression Summary */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{t.originalHeight}</span>
            <span className="font-mono text-slate-700">{imageInfo.height} px</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-rose-600 font-medium flex items-center gap-1">
              <Scissors className="w-3 h-3" /> {t.adsRemoved}
            </span>
            <span className="font-mono text-rose-600 font-semibold">
              -{totalRemovedHeight} px
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 font-medium">
            <span className="text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {t.cleanArticleHeight}
            </span>
            <span className="font-mono text-emerald-700 font-bold">
              {remainingHeight} px
            </span>
          </div>

          {/* Progress bar */}
          <div className="pt-1">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${100 - percentSaved}%` }}
                title={t.keptPercent(100 - percentSaved)}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${percentSaved}%` }}
                title={t.cutPercent(percentSaved)}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
              <span>{t.keptPercent(100 - percentSaved)}</span>
              <span className="text-rose-600 font-medium">{t.cutPercent(percentSaved)}</span>
            </div>
          </div>
        </div>

        {/* Action button: Manual add */}
        <div className="pt-1">
          <button
            id="add-cut-zone-btn"
            onClick={onAddManualCut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCutZoneBtn}</span>
          </button>
        </div>
      </div>

      {/* List of Cut Zones */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {cutZones.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Scissors className="w-6 h-6 opacity-60" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">{t.noCutZonesYet}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t.noCutZonesHint}
              </p>
            </div>
          </div>
        ) : (
          cutZones.map((zone, index) => {
            const isSelected = activeZoneId === zone.id;
            const height = Math.max(0, zone.endY - zone.startY);

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                } ${!zone.enabled ? 'opacity-50' : ''}`}
              >
                {/* Zone header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center justify-center border border-rose-200 shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={zone.label || t.cutLabel(index + 1)}
                      onChange={(e) => handleUpdateZone(zone.id, { label: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium bg-transparent hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent focus:border-slate-300 px-1 py-0.5 rounded text-slate-800 truncate w-full"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleZone(zone.id)}
                      title={zone.enabled ? t.disableCut : t.enableCut}
                      className="p-1 hover:bg-slate-200/70 rounded text-slate-400 hover:text-slate-700 transition"
                    >
                      {zone.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => onDeleteZone(zone.id)}
                      title={t.deleteCut}
                      className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Pixel Range Coordinates */}
                <div className="grid grid-cols-2 gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                    <label className="text-[10px] text-slate-500 block">{t.fromY}</label>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min="0"
                        max={zone.endY - 5}
                        value={zone.startY}
                        onChange={(e) =>
                          handleUpdateZone(zone.id, {
                            startY: Math.max(0, Math.min(zone.endY - 5, parseInt(e.target.value) || 0)),
                          })
                        }
                        className="bg-transparent font-mono text-slate-800 text-xs w-16 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400">px</span>
                    </div>
                  </div>

                  <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-200">
                    <label className="text-[10px] text-slate-500 block">{t.toY}</label>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        min={zone.startY + 5}
                        max={imageInfo.height}
                        value={zone.endY}
                        onChange={(e) =>
                          handleUpdateZone(zone.id, {
                            endY: Math.max(zone.startY + 5, Math.min(imageInfo.height, parseInt(e.target.value) || 0)),
                          })
                        }
                        className="bg-transparent font-mono text-slate-800 text-xs w-16 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400">px</span>
                    </div>
                  </div>
                </div>

                {/* Footer with removed height & jump button */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-rose-600 font-mono font-medium">
                    -{height} px
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onScrollToZone(zone, 'top');
                      }}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded text-[10px] font-medium transition"
                      title={t.scrollToStart}
                    >
                      {t.startEdge}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onScrollToZone(zone, 'bottom');
                      }}
                      className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded text-[10px] font-bold border border-rose-200 transition"
                      title={t.scrollToEnd}
                    >
                      {t.endEdge(zone.endY)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

