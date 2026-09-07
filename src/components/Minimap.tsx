import React, { useRef, useEffect, useState } from 'react';
import { CutZone, ImageInfo } from '../types';

interface MinimapProps {
  imageInfo: ImageInfo;
  cutZones: CutZone[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onSelectZone: (id: string | null) => void;
  activeZoneId: string | null;
}

export const Minimap: React.FC<MinimapProps> = ({
  imageInfo,
  cutZones,
  scrollContainerRef,
  onSelectZone,
  activeZoneId,
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [viewportRatio, setViewportRatio] = useState({ topRatio: 0, heightRatio: 0.2 });

  // Update viewport box on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollTop = container.scrollTop;

      if (scrollHeight > 0) {
        const topRatio = Math.max(0, Math.min(1, scrollTop / scrollHeight));
        const heightRatio = Math.max(0.05, Math.min(1, clientHeight / scrollHeight));
        setViewportRatio({ topRatio, heightRatio });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [scrollContainerRef, imageInfo.height]);

  const handleMinimapClick = (e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    const minimap = minimapRef.current;
    if (!container || !minimap) return;

    const rect = minimap.getBoundingClientRect();
    const clickYRatio = (e.clientY - rect.top) / rect.height;
    const targetScrollY = clickYRatio * container.scrollHeight - container.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetScrollY),
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-20 bg-white border-l border-slate-200 flex flex-col items-center py-3 select-none shrink-0 shadow-xs text-slate-800">
      <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
        Översikt
      </span>

      {/* Minimap Track */}
      <div
        ref={minimapRef}
        id="minimap-track"
        onClick={handleMinimapClick}
        className="relative w-12 flex-1 bg-slate-100 rounded-lg border border-slate-200 cursor-pointer overflow-hidden group shadow-inner"
      >
        {/* Tiny thumbnail preview if available */}
        {imageInfo.url && (
          <img
            src={imageInfo.url}
            alt="Miniatyr"
            className="w-full h-full object-fill opacity-60"
            draggable={false}
          />
        )}

        {/* Cut Zone Highlights on Minimap */}
        {cutZones.map((zone) => {
          if (!imageInfo.height) return null;
          const topPercent = (zone.startY / imageInfo.height) * 100;
          const heightPercent = Math.max(1, ((zone.endY - zone.startY) / imageInfo.height) * 100);
          const isSelected = activeZoneId === zone.id;

          return (
            <div
              key={zone.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectZone(zone.id);
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollTo({
                    top: (zone.startY / imageInfo.height) * container.scrollHeight - 100,
                    behavior: 'smooth',
                  });
                }
              }}
              title={`${zone.label || 'Klippzon'}: -${zone.endY - zone.startY}px`}
              className={`absolute left-0 right-0 transition-opacity ${
                zone.enabled
                  ? isSelected
                    ? 'bg-rose-600 ring-1 ring-white z-10'
                    : 'bg-rose-500/85 hover:bg-rose-500'
                  : 'bg-slate-400/50'
              }`}
              style={{
                top: `${topPercent}%`,
                height: `${heightPercent}%`,
              }}
            />
          );
        })}

        {/* Viewport Box indicator */}
        <div
          className="absolute left-0 right-0 border-2 border-indigo-600 bg-indigo-500/20 pointer-events-none rounded-xs transition-all"
          style={{
            top: `${viewportRatio.topRatio * 100}%`,
            height: `${viewportRatio.heightRatio * 100}%`,
          }}
        />
      </div>

      <div className="mt-2 text-[9px] font-mono text-slate-500 text-center">
        {cutZones.filter((z) => z.enabled).length} klipp
      </div>
    </div>
  );
};
