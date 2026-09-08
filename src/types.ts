export interface CutZone {
  id: string;
  startY: number;
  endY: number;
  label?: string;
  enabled: boolean;
}

export interface SliceSegment {
  id: string;
  startY: number;
  endY: number;
  height: number;
  type: 'keep' | 'cut';
}

export type ViewMode = 'editor' | 'preview' | 'split';

export interface ImageInfo {
  url: string;
  name: string;
  width: number;
  height: number;
  element: HTMLImageElement | null;
}

export interface StitchOptions {
  showSeamMarkers?: boolean;
  seamColor?: string;
}

