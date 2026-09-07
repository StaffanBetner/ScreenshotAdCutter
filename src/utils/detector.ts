import { CutZone } from '../types';

export type DetectionSensitivity = 'conservative' | 'balanced' | 'aggressive';

export interface DetectorOptions {
  sensitivity?: DetectionSensitivity;
}

/**
 * Intelligent Ad & Banner Detector for Long Screenshot Articles
 *
 * Specifically engineered to PROTECT and EXCLUDE normal article body text:
 * 1. Monochromatic text blocks with typical typographic line-spacing and paragraph rhythms
 *    are explicitly identified as readable article content and STRICTLY EXCLUDED.
 * 2. Real ads and marketing banners are recognized through:
 *    - High chromatic saturation (vibrant photos, brand colors, CTA buttons, promo graphics)
 *    - Container shifts (solid or tinted card/iframe backgrounds differing from page background)
 *    - Dense solid fills (non-text photo media and video players without typographic line gutters)
 */
export function detectCandidateAdZones(
  img: HTMLImageElement,
  existingCuts: CutZone[] = [],
  options: DetectorOptions = {}
): CutZone[] {
  const sensitivity = options.sensitivity || 'conservative';

  const canvas = document.createElement('canvas');
  // Downscale width for rapid analysis while keeping high vertical resolution
  const scale = Math.min(1, 420 / Math.max(1, img.naturalWidth));
  const sampleW = Math.round(img.naturalWidth * scale);
  const sampleH = Math.round(img.naturalHeight * scale);
  canvas.width = sampleW;
  canvas.height = sampleH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || sampleW < 20 || sampleH < 20) return [];

  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;

  // Step 1: Detect dominant page background color
  // Sample left and right margins (first 7% and last 7% of width), which almost always contain page background
  let bgRSum = 0;
  let bgGSum = 0;
  let bgBSum = 0;
  let bgCount = 0;

  const marginWidth = Math.max(3, Math.round(sampleW * 0.07));

  for (let y = 0; y < sampleH; y += 3) {
    // Left margin
    for (let x = 1; x < marginWidth; x += 2) {
      const idx = (y * sampleW + x) * 4;
      bgRSum += data[idx];
      bgGSum += data[idx + 1];
      bgBSum += data[idx + 2];
      bgCount++;
    }
    // Right margin
    for (let x = sampleW - marginWidth; x < sampleW - 1; x += 2) {
      const idx = (y * sampleW + x) * 4;
      bgRSum += data[idx];
      bgGSum += data[idx + 1];
      bgBSum += data[idx + 2];
      bgCount++;
    }
  }

  const pageBgR = bgCount > 0 ? bgRSum / bgCount : 255;
  const pageBgG = bgCount > 0 ? bgGSum / bgCount : 255;
  const pageBgB = bgCount > 0 ? bgBSum / bgCount : 255;

  // Step 2: Analyze each row in the screenshot
  interface RowMetrics {
    nonBgRatio: number;
    avgChroma: number;
    isWhitespace: boolean;
    isTextLine: boolean;
    isColoredMedia: boolean;
    isDenseSolid: boolean;
    isTintedBox: boolean;
  }

  const rowMetrics: RowMetrics[] = new Array(sampleH);

  for (let y = 0; y < sampleH; y++) {
    let nonBgCount = 0;
    let chromaSum = 0;
    let transitions = 0;
    let lastLum = -1;
    let rowBgDiffSum = 0;
    let sampledPixels = 0;

    const rowOffset = y * sampleW * 4;

    for (let x = 2; x < sampleW - 2; x += 2) {
      const idx = rowOffset + x * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const diffFromBg = Math.abs(r - pageBgR) + Math.abs(g - pageBgG) + Math.abs(b - pageBgB);
      rowBgDiffSum += diffFromBg;
      sampledPixels++;

      // Saturation / Chromaticity = difference between max and min channel
      const maxChan = Math.max(r, g, b);
      const minChan = Math.min(r, g, b);
      const chroma = maxChan - minChan;

      // Luminance (for edge detection)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lastLum >= 0 && Math.abs(lum - lastLum) > 40) {
        transitions++;
      }
      lastLum = lum;

      // Pixel differs meaningfully from background
      if (diffFromBg > 36) {
        nonBgCount++;
        chromaSum += chroma;
      }
    }

    const nonBgRatio = sampledPixels > 0 ? nonBgCount / sampledPixels : 0;
    const avgChroma = nonBgCount > 0 ? chromaSum / nonBgCount : 0;
    const avgRowBgDiff = sampledPixels > 0 ? rowBgDiffSum / sampledPixels : 0;

    // Classification of this individual row:
    // 1. Whitespace: almost completely empty (page background)
    const isWhitespace = nonBgRatio < 0.035;

    // 2. Text line: typical body text has 4%-45% coverage, near zero chroma (monochrome black/gray),
    // and frequent horizontal micro-transitions (individual letter strokes).
    const isTextLine =
      nonBgRatio >= 0.035 &&
      nonBgRatio <= 0.52 &&
      avgChroma < 18 &&
      transitions >= 6;

    // 3. Colored media / ad: high saturation (rich colors, brand graphics, CTA buttons)
    const isColoredMedia = avgChroma >= (sensitivity === 'aggressive' ? 18 : 22) && nonBgRatio >= 0.12;

    // 4. Dense solid banner / photo: covers majority of the width without whitespace gaps
    const isDenseSolid = nonBgRatio >= (sensitivity === 'aggressive' ? 0.6 : 0.68);

    // 5. Tinted ad container: the background color of the row itself shifts away from page background
    const isTintedBox = avgRowBgDiff > (sensitivity === 'aggressive' ? 24 : 32) && nonBgRatio >= 0.3;

    rowMetrics[y] = {
      nonBgRatio,
      avgChroma,
      isWhitespace,
      isTextLine,
      isColoredMedia,
      isDenseSolid,
      isTintedBox,
    };
  }

  // Step 3: Find candidate ad regions
  // A row is an ad candidate if it has high color, dense graphic fill, or tinted ad card background,
  // AND is NOT a clean monochromatic text line.
  const isAdCandidateRow: boolean[] = new Array(sampleH);
  for (let y = 0; y < sampleH; y++) {
    const rm = rowMetrics[y];
    if (rm.isTextLine) {
      isAdCandidateRow[y] = false;
    } else {
      isAdCandidateRow[y] = rm.isColoredMedia || rm.isDenseSolid || rm.isTintedBox;
    }
  }

  // Step 4: Cluster contiguous candidate rows into vertical blocks
  // Allow small internal gaps (up to 3 rows) so segmented ad graphics merge into one clean block
  interface RawBlock {
    startY: number;
    endY: number;
  }
  const rawBlocks: RawBlock[] = [];
  let inBlock = false;
  let blockStart = 0;
  let gapCount = 0;

  for (let y = 0; y < sampleH; y++) {
    if (isAdCandidateRow[y]) {
      if (!inBlock) {
        inBlock = true;
        blockStart = y;
        gapCount = 0;
      } else {
        gapCount = 0;
      }
    } else {
      if (inBlock) {
        gapCount++;
        // If gap exceeds 3 sample pixels (~8-12 screen pixels), close block
        if (gapCount > 3 || rowMetrics[y].isTextLine) {
          inBlock = false;
          rawBlocks.push({ startY: blockStart, endY: y - gapCount });
        }
      }
    }
  }
  if (inBlock) {
    rawBlocks.push({ startY: blockStart, endY: sampleH - 1 });
  }

  // Step 5: Stringent Anti-Text Verification (Strict False-Positive Prevention)
  const validCandidates: { startY: number; endY: number; type: string }[] = [];

  for (const block of rawBlocks) {
    const blockSampleH = block.endY - block.startY + 1;
    if (blockSampleH < 4) continue;

    const realStart = Math.max(0, Math.round(block.startY / scale));
    const realEnd = Math.min(img.naturalHeight, Math.round(block.endY / scale));
    const realHeight = realEnd - realStart;

    // Standard web banners are typically between 60px and 900px tall
    // (e.g. 300x250, 728x90, 320x50, 300x600 sticky/in-article banners)
    if (realHeight < 60 || realHeight > 920) continue;

    // Avoid cutting the top navigation bar (usually top 40px) or bottom attribution
    if (realStart < 40 || realEnd > img.naturalHeight - 25) continue;

    // Analyze rows inside this candidate block:
    let textLineCount = 0;
    let whitespaceCount = 0;
    let coloredRowCount = 0;
    let denseRowCount = 0;
    let tintedRowCount = 0;
    let totalChroma = 0;

    for (let y = block.startY; y <= block.endY; y++) {
      const rm = rowMetrics[y];
      if (rm.isTextLine) textLineCount++;
      if (rm.isWhitespace) whitespaceCount++;
      if (rm.isColoredMedia) coloredRowCount++;
      if (rm.isDenseSolid) denseRowCount++;
      if (rm.isTintedBox) tintedRowCount++;
      totalChroma += rm.avgChroma;
    }

    const avgChromaInBlock = totalChroma / blockSampleH;
    const textRatio = textLineCount / blockSampleH;
    const whitespaceRatio = whitespaceCount / blockSampleH;

    // CRITICAL ARTICLE TEXT PROTECTION RULES:
    // Rule 1: If text lines make up more than 15% of the block and chroma is low, REJECT!
    if (textRatio > 0.15 && avgChromaInBlock < 20) {
      continue;
    }

    // Rule 2: If there is periodic whitespace (line-height spacing) and low chroma, REJECT!
    if (whitespaceRatio > 0.12 && avgChromaInBlock < 22) {
      continue;
    }

    // Rule 3: If block is almost completely monochromatic (black/white text paragraphs)
    // without any tinted container or high-density graphic fill, REJECT!
    if (avgChromaInBlock < 14 && denseRowCount / blockSampleH < 0.4 && tintedRowCount / blockSampleH < 0.4) {
      continue;
    }

    // Confidence requirements based on sensitivity
    const isStrongColoredAd = coloredRowCount / blockSampleH >= 0.4 || avgChromaInBlock >= 25;
    const isStrongTintedCard = tintedRowCount / blockSampleH >= 0.45;
    const isStrongDenseBanner = denseRowCount / blockSampleH >= 0.55;

    if (sensitivity === 'conservative') {
      if (!isStrongColoredAd && !isStrongTintedCard && !isStrongDenseBanner) {
        continue;
      }
    }

    // Determine descriptive type
    let typeLabel = 'Annonssektion';
    if (isStrongColoredAd) {
      typeLabel = 'Färgstark annonsbanner';
    } else if (isStrongTintedCard) {
      typeLabel = 'Inramad annonssektion';
    } else if (isStrongDenseBanner) {
      typeLabel = 'Grafisk annonsbanner';
    }

    validCandidates.push({
      startY: realStart,
      endY: realEnd,
      type: typeLabel,
    });
  }

  // Step 6: Avoid overlapping existing user-defined cuts
  const newZones: CutZone[] = [];
  validCandidates.forEach((cand, i) => {
    const overlaps = existingCuts.some(
      (cut) => cand.startY < cut.endY && cand.endY > cut.startY
    );
    if (!overlaps) {
      const height = cand.endY - cand.startY;
      newZones.push({
        id: `auto-${Date.now()}-${i}`,
        startY: cand.startY,
        endY: cand.endY,
        label: `${cand.type} (${height} px)`,
        enabled: true,
      });
    }
  });

  return newZones;
}
