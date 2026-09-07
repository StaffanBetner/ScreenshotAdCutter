import { CutZone, SliceSegment, StitchOptions } from '../types';

/**
 * Normalizes and merges overlapping or adjacent cut zones.
 */
export function normalizeCutZones(cutZones: CutZone[], maxHeight: number): CutZone[] {
  const active = cutZones
    .filter((z) => z.enabled)
    .map((z) => ({
      ...z,
      startY: Math.max(0, Math.min(Math.round(Math.min(z.startY, z.endY)), maxHeight)),
      endY: Math.max(0, Math.min(Math.round(Math.max(z.startY, z.endY)), maxHeight)),
    }))
    .filter((z) => z.endY - z.startY > 2)
    .sort((a, b) => a.startY - b.startY);

  if (active.length === 0) return [];

  const merged: CutZone[] = [];
  let current = { ...active[0] };

  for (let i = 1; i < active.length; i++) {
    const next = active[i];
    if (next.startY <= current.endY) {
      // Overlap or touch, merge
      current.endY = Math.max(current.endY, next.endY);
      current.label = current.label || next.label;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged;
}

/**
 * Splits an image height into keep and cut segments.
 */
export function calculateSegments(imageHeight: number, cutZones: CutZone[]): SliceSegment[] {
  const normalizedCuts = normalizeCutZones(cutZones, imageHeight);
  const segments: SliceSegment[] = [];
  let currentY = 0;

  normalizedCuts.forEach((cut, idx) => {
    // Kept area before this cut
    if (cut.startY > currentY) {
      segments.push({
        id: `keep-${idx}`,
        startY: currentY,
        endY: cut.startY,
        height: cut.startY - currentY,
        type: 'keep',
      });
    }

    // The cut section
    segments.push({
      id: `cut-${cut.id}`,
      startY: cut.startY,
      endY: cut.endY,
      height: cut.endY - cut.startY,
      type: 'cut',
    });

    currentY = cut.endY;
  });

  // Remaining kept area after last cut
  if (currentY < imageHeight) {
    segments.push({
      id: `keep-last`,
      startY: currentY,
      endY: imageHeight,
      height: imageHeight - currentY,
      type: 'keep',
    });
  }

  return segments;
}

/**
 * Stitches the kept segments of an image on an offscreen canvas.
 */
export function stitchImage(
  img: HTMLImageElement,
  cutZones: CutZone[],
  options: StitchOptions = {}
): { canvas: HTMLCanvasElement; totalKeptHeight: number; totalCutHeight: number; keepSegmentsCount: number } {
  const segments = calculateSegments(img.naturalHeight, cutZones);
  const keepSegments = segments.filter((s) => s.type === 'keep' && s.height > 0);
  const cutSegments = segments.filter((s) => s.type === 'cut');

  const totalKeptHeight = keepSegments.reduce((sum, s) => sum + s.height, 0);
  const totalCutHeight = cutSegments.reduce((sum, s) => sum + s.height, 0);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = Math.max(1, totalKeptHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, totalKeptHeight, totalCutHeight, keepSegmentsCount: keepSegments.length };

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let destY = 0;
  keepSegments.forEach((segment, idx) => {
    ctx.drawImage(
      img,
      0,
      segment.startY,
      img.naturalWidth,
      segment.height,
      0,
      destY,
      img.naturalWidth,
      segment.height
    );

    destY += segment.height;

    // Optional subtle cut indicator line
    if (options.showSeamMarkers && idx < keepSegments.length - 1) {
      ctx.save();
      ctx.strokeStyle = options.seamColor || 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, destY);
      ctx.lineTo(canvas.width, destY);
      ctx.stroke();
      ctx.restore();
    }
  });

  return { canvas, totalKeptHeight, totalCutHeight, keepSegmentsCount: keepSegments.length };
}

/**
 * Generates an ultra-realistic tall sample Swedish article screenshot complete with 3 obvious ads
 */
export function generateSampleArticle(): Promise<{ dataUrl: string; width: number; height: number; suggestedCuts: CutZone[] }> {
  return new Promise((resolve) => {
    const width = 860;
    const height = 3300;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Main Article Card
    const cardX = 40;
    const cardWidth = width - cardX * 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardX, 0, cardWidth, height);

    // Top Brand Navbar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, 68);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('NORDISK TEKNIK & FRAMTID', cardX, 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText('Måndag • Lästid ca 4 min • Premium', width - 280, 42);

    let y = 110;

    // Breadcrumb / Category
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ANALYS & SAMHÄLLE', cardX + 30, y);
    y += 35;

    // Headline
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif';
    ctx.fillText('Så navigerar vi det digitala', cardX + 30, y);
    y += 44;
    ctx.fillText('informationsflödet utan avbrott', cardX + 30, y);
    y += 42;

    // Ingress
    ctx.fillStyle = '#334155';
    ctx.font = '500 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Långa texter och artiklar blir allt svårare att spara och dela', cardX + 30, y);
    y += 28;
    ctx.fillText('när skärmdumpar bryts av massiva banners och sponsrat brus.', cardX + 30, y);
    y += 40;

    // Author byline
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cardX + 50, y + 5, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('EL', cardX + 41, y + 11);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Emma Lindqvist', cardX + 85, y);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('Teknikskribent • Uppdaterad idag 11:20', cardX + 85, y + 20);
    y += 65;

    // Hero Image Illustration Box
    const heroH = 340;
    const heroGrad = ctx.createLinearGradient(cardX + 30, y, cardX + 30 + cardWidth - 60, y + heroH);
    heroGrad.addColorStop(0, '#1e293b');
    heroGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = heroGrad;
    ctx.beginPath();
    ctx.roundRect(cardX + 30, y, cardWidth - 60, heroH, 12);
    ctx.fill();

    // Decorative shapes inside hero
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.arc(cardX + 200, y + 170, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(147, 51, 234, 0.2)';
    ctx.beginPath();
    ctx.arc(cardX + 450, y + 140, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Skärmens anatomi: Från brus till fokus', cardX + 70, y + 175);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText('Illustration: Nordic Tech Studio', cardX + 70, y + 205);
    y += heroH + 45;

    // Paragraph 1
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const text1 = [
      'När vi läser digitala reportage på telefonen eller datorn är upplevelsen ofta fragmenterad.',
      'Varje scrollrörelse ackompanjeras av instick, nyhetsbrevsinbjudningar och banners',
      'som rycker läsarens uppmärksamhet från innehållet.',
      '',
      'Att spara en artikel som en sammanhängande skärmdump är ett fantastiskt sätt att bevara',
      'kunskap, citera källor och arkivera texter för offline-läsning. Men när hälften av bildens',
      'höjd består av annonser förlorar dokumentet sitt värde.',
    ];
    text1.forEach((line) => {
      ctx.fillText(line, cardX + 30, y);
      y += 26;
    });

    y += 20;

    // ==========================================
    // AD 1: BIG BANNER AD
    // ==========================================
    const ad1Start = y;
    const ad1Height = 280;

    // Ad background container with obvious ad style
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(cardX, ad1Start, cardWidth, ad1Height);

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX, ad1Start, cardWidth, ad1Height);

    // "ANNONS" badge
    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SPONSRAT INNEHÅLL • REKLAM', cardX + 30, ad1Start + 30);

    // Ad content
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('⚡ Byt till framtidens elavtal – Spara upp till 4 500 kr!', cardX + 30, ad1Start + 75);

    ctx.fillStyle = '#9a3412';
    ctx.font = '15px sans-serif';
    ctx.fillText('Ingen bindningstid. 100% fossilfri energi direkt till ditt hem.', cardX + 30, ad1Start + 115);
    ctx.fillText('Jämför priset på under 60 sekunder och få 1 års rabatt på månadsavgiften.', cardX + 30, ad1Start + 140);

    // Fake Ad CTA Button
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(cardX + 30, ad1Start + 180, 220, 48, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Jämför ditt elpris nu →', cardX + 55, ad1Start + 210);

    ctx.fillStyle = '#c2410c';
    ctx.font = '11px sans-serif';
    ctx.fillText('Gäller endast nya kunder via denna kampanj. Energikollen AB.', cardX + 30, ad1Start + 255);

    y = ad1Start + ad1Height + 35;

    // Subheading
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, serif';
    ctx.fillText('Varför höjdledsklippning förändrar spelplanen', cardX + 30, y);
    y += 38;

    // Body text section 2
    const text2 = [
      'Lösningen är förvånansvärt elegant: i stället för att förlita sig på klumpiga ad-blockers som',
      'ibland förstör artikelns typsättning eller blockerar själva bilderna, kan man i efterhand',
      'göra ett rent snitt genom skärmdumpen.',
      '',
      'Genom att identifiera de vertikala sektioner där annonser och irrelevanta puffar ligger,',
      'kan verktyget skära bort hela sektionen och foga samman de kvarvarande delarna sömlöst.',
      'Resultatet blir en ren, tidlös och lättläst sammanställning där ingress, brödtext och',
      'slutsats hänger ihop precis som en klassisk boktryckt text.',
    ];
    text2.forEach((line) => {
      ctx.fillText(line, cardX + 30, y);
      y += 26;
    });

    y += 25;

    // Blockquote
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(cardX + 30, y, cardWidth - 60, 95);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cardX + 30, y, 6, 95);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 16px serif';
    ctx.fillText('”Möjligheten att enkelt klippa bort 300 pixlar reklam mitt i en text och foga samman', cardX + 55, y + 38);
    ctx.fillText('delarna gör att långa skärmdumpar äntligen blir användbara på riktigt.”', cardX + 55, y + 66);
    y += 125;

    // ==========================================
    // AD 2: CASINO / CRYPTO SPONSORED BANNER
    // ==========================================
    const ad2Start = y;
    const ad2Height = 310;

    // Ad background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(cardX, ad2Start, cardWidth, ad2Height);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ANNONS • SPONSRAT INNEHÅLL', cardX + 30, ad2Start + 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('🎰 Nordens Största Spelsajt – 100 Free Spins Idag!', cardX + 30, ad2Start + 75);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    ctx.fillText('Upptäck över 2 000 slots och live casino med blixtsnabba uttag med BankID.', cardX + 30, ad2Start + 115);
    ctx.fillText('Sätt in 100 kr och spela för 500 kr. Omsättningskrav 20x. Spela ansvarsfullt.', cardX + 30, ad2Start + 140);

    // Fake Ad Buttons
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(cardX + 30, ad2Start + 175, 200, 46, 6);
    ctx.fill();

    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Hämta bonus här →', cardX + 52, ad2Start + 204);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('18+ • Stödlinjen.se • Spelpaus.se • Regler & villkor gäller.', cardX + 30, ad2Start + 260);

    y = ad2Start + ad2Height + 40;

    // Section 3
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, serif';
    ctx.fillText('Steg-för-steg: Så skapar du den perfekta läsfilen', cardX + 30, y);
    y += 38;

    const text3 = [
      '1. Ta en skrollande skärmdump på din telefon eller dator av hela webbsidan.',
      '2. Släpp in bilden i redigeraren eller klistra in direkt från urklipp.',
      '3. Dra markeringar över de sektioner i höjdled som du vill ta bort.',
      '4. Kontrollera förhandsgranskningen – sektionerna fogas samman millimeter-exakt.',
      '5. Ladda ner den rena artikeln eller kopiera bilden direkt till anteckningar.',
    ];
    text3.forEach((line) => {
      ctx.fillText(line, cardX + 30, y);
      y += 32;
    });

    y += 30;

    // ==========================================
    // AD 3: NEWSLETTER POPUP / BANNER
    // ==========================================
    const ad3Start = y;
    const ad3Height = 220;

    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(cardX, ad3Start, cardWidth, ad3Height);
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX, ad3Start, cardWidth, ad3Height);

    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('NYHETSBREV & ERBJUDANDEN', cardX + 30, ad3Start + 32);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('📩 Vill du ha fler sammanfattningar utan annonser?', cardX + 30, ad3Start + 68);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Skriv in din e-postadress så skickar vi vår veckovisa kurering av de viktigaste tech-nyheterna.', cardX + 30, ad3Start + 102);

    // Input box simulation
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cardX + 30, ad3Start + 130, 320, 42);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(cardX + 30, ad3Start + 130, 320, 42);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText('din.epost@foretag.se', cardX + 45, ad3Start + 156);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(cardX + 365, ad3Start + 130, 140, 42, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Prenumerera', cardX + 392, ad3Start + 156);

    y = ad3Start + ad3Height + 40;

    // Conclusion paragraph
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    const text4 = [
      'Slutresultatet är en artikel som går att arkivera, skriva ut eller läsa utan distraktioner.',
      'Att kunna trimma bort reklam vertikalt ger läsaren full kontroll över innehållet.',
    ];
    text4.forEach((line) => {
      ctx.fillText(line, cardX + 30, y);
      y += 28;
    });

    // Footer
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, height - 90, width, 90);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('© 2026 Nordisk Teknik & Framtid • Alla rättigheter förbehållna • Integritetspolicy', cardX + 30, height - 42);

    const dataUrl = canvas.toDataURL('image/png');

    const suggestedCuts: CutZone[] = [
      {
        id: 'sample-ad-1',
        startY: Math.round(ad1Start),
        endY: Math.round(ad1Start + ad1Height),
        label: 'Reklambanner (Elavtal)',
        enabled: true,
      },
      {
        id: 'sample-ad-2',
        startY: Math.round(ad2Start),
        endY: Math.round(ad2Start + ad2Height),
        label: 'Sponsrat Casino/Spel',
        enabled: true,
      },
      {
        id: 'sample-ad-3',
        startY: Math.round(ad3Start),
        endY: Math.round(ad3Start + ad3Height),
        label: 'Nyhetsbrevspuff',
        enabled: true,
      },
    ];

    resolve({
      dataUrl,
      width,
      height,
      suggestedCuts,
    });
  });
}
