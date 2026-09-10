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
 * Utility helper to measure and render wrapped text within a maximum width in Canvas 2D
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let currentLine = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      ctx.fillText(currentLine, x, currentY);
      currentLine = word;
      currentY += lineHeight;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    ctx.fillText(currentLine, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

/**
 * Generates an ultra-realistic tall sample article screenshot complete with 3 obvious ads (supports Swedish and English)
 */
export function generateSampleArticle(lang: 'sv' | 'en' = 'sv'): Promise<{ dataUrl: string; width: number; height: number; suggestedCuts: CutZone[] }> {
  return new Promise((resolve) => {
    const isEn = lang === 'en';
    const width = 800;
    const maxDraftHeight = 3600;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = maxDraftHeight;
    const ctx = canvas.getContext('2d')!;

    // Background: Clean full-width article canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, maxDraftHeight);

    const margin = 44;
    const contentWidth = width - margin * 2;

    // Top Brand Navbar (Full width)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, 64);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'GLOBAL TECH & FUTURES' : 'NORDISK TEKNIK & FRAMTID', margin, 40);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const metaTag = isEn ? 'Monday • 4 min read • Premium' : 'Måndag • Lästid ca 4 min • Premium';
    const metaW = ctx.measureText(metaTag).width;
    ctx.fillText(metaTag, width - margin - metaW, 40);

    let y = 100;

    // Breadcrumb / Category
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'ANALYSIS & FOCUS' : 'ANALYS & DIGITALT FOKUS', margin, y);
    y += 32;

    // Headline (Wrapped cleanly)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px Georgia, Cambria, "Times New Roman", serif';
    y = drawWrappedText(
      ctx,
      isEn
        ? 'How to Navigate Long Digital Articles Without Constant Clutter'
        : 'Så navigerar vi det digitala informationsflödet utan avbrott',
      margin,
      y,
      contentWidth,
      40
    );
    y += 10;

    // Ingress (Wrapped cleanly)
    ctx.fillStyle = '#334155';
    ctx.font = '500 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    y = drawWrappedText(
      ctx,
      isEn
        ? 'Longform articles are increasingly difficult to save and archive when screenshots are severed by massive banners and sponsored interruptions. Here is how to reclaim reading peace.'
        : 'Långa texter och artiklar blir allt svårare att spara och arkivera när skärmdumpar bryts av massiva annonser och sponsrat brus. Här är metoden för att återta läsron.',
      margin,
      y,
      contentWidth,
      27
    );
    y += 20;

    // Author byline
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(margin + 18, y + 16, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('EL', margin + 10, y + 21);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Emma Lindqvist', margin + 46, y + 12);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'Tech Editor • Updated today 11:20' : 'Teknikskribent • Uppdaterad idag 11:20', margin + 46, y + 30);
    y += 56;

    // Hero Image Illustration Box
    const heroH = 280;
    const heroGrad = ctx.createLinearGradient(margin, y, margin + contentWidth, y + heroH);
    heroGrad.addColorStop(0, '#1e293b');
    heroGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = heroGrad;
    ctx.beginPath();
    ctx.roundRect(margin, y, contentWidth, heroH, 10);
    ctx.fill();

    // Decorative shapes inside hero
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.beginPath();
    ctx.arc(margin + 170, y + 140, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(147, 51, 234, 0.18)';
    ctx.beginPath();
    ctx.arc(margin + 400, y + 120, 115, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'Screen Anatomy: From Clutter to Focus' : 'Skärmens anatomi: Från brus till fokus', margin + 32, y + 145);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'Illustration: Studio Graphics' : 'Illustration: Nordic Tech Studio', margin + 32, y + 175);
    y += heroH + 36;

    // Paragraph 1
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    y = drawWrappedText(
      ctx,
      isEn
        ? 'When reading digital features on phones or laptops, the reading experience is often fractured. Every scroll gesture is greeted by sponsored pop-ins, newsletter traps, and flashing banners.'
        : 'När vi läser digitala reportage på telefonen eller datorn är upplevelsen ofta fragmenterad. Varje scrollrörelse ackompanjeras av instick, nyhetsbrevsinbjudningar och banners som rycker läsarens uppmärksamhet från innehållet.',
      margin,
      y,
      contentWidth,
      26
    );
    y += 12;
    y = drawWrappedText(
      ctx,
      isEn
        ? 'Saving an entire article as a continuous vertical screenshot is a fantastic way to archive research and quote references. But when half the height is filler ads, the file becomes unpleasant to read.'
        : 'Att spara en artikel som en sammanhängande skärmdump är ett fantastiskt sätt att bevara kunskap, citera källor och arkivera texter för offline-läsning. Men när hälften av bildens höjd består av annonser förlorar dokumentet sitt värde.',
      margin,
      y,
      contentWidth,
      26
    );
    y += 30;

    // ==========================================
    // AD 1: BIG BANNER AD (Full-width)
    // ==========================================
    const ad1Start = y;
    const ad1Height = 270;

    // Ad background container across full canvas width
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, ad1Start, width, ad1Height);

    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(0, ad1Start, width, 1);
    ctx.fillRect(0, ad1Start + ad1Height - 1, width, 1);

    // "ANNONS" badge
    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'SPONSORED CONTENT • ADVERTISEMENT' : 'SPONSRAT INNEHÅLL • REKLAM', margin, ad1Start + 32);

    // Ad content
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawWrappedText(
      ctx,
      isEn ? '⚡ Switch to Clean Solar Energy – Save up to $450/Year!' : '⚡ Byt till framtidens elavtal – Spara upp till 4 500 kr!',
      margin,
      ad1Start + 66,
      contentWidth,
      28
    );

    ctx.fillStyle = '#9a3412';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawWrappedText(
      ctx,
      isEn
        ? 'No long-term lock-in. 100% fossil-free electricity directly to your home. Compare prices in under 60 seconds and claim your discount.'
        : 'Ingen bindningstid. 100% fossilfri energi direkt till ditt hem. Jämför priset på under 60 sekunder och få 1 års rabatt på månadsavgiften.',
      margin,
      ad1Start + 104,
      contentWidth,
      22
    );

    // Ad CTA Button
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(margin, ad1Start + 165, 220, 44, 7);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'Compare rates now →' : 'Jämför ditt elpris nu →', margin + 24, ad1Start + 192);

    ctx.fillStyle = '#c2410c';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(
      isEn ? 'Valid for new residential customers. EnergyCheck Inc.' : 'Gäller endast nya kunder via denna kampanj. Energikollen AB.',
      margin,
      ad1Start + 242
    );

    y = ad1Start + ad1Height + 36;

    // Subheading
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 23px Georgia, Cambria, "Times New Roman", serif';
    y = drawWrappedText(
      ctx,
      isEn ? 'Why Vertical Section Cutting Changes the Game' : 'Varför höjdledsklippning förändrar spelplanen',
      margin,
      y,
      contentWidth,
      32
    );
    y += 16;

    // Body text section 2
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    y = drawWrappedText(
      ctx,
      isEn
        ? 'The approach is remarkably straightforward: rather than fighting bloated adblockers that break stylesheets, one can simply perform surgical cuts directly on the saved screenshot.'
        : 'Lösningen är förvånansvärt elegant: i stället för att förlita sig på klumpiga ad-blockers som ibland förstör artikelns typsättning eller blockerar själva bilderna, kan man i efterhand göra ett rent snitt genom skärmdumpen.',
      margin,
      y,
      contentWidth,
      26
    );
    y += 12;
    y = drawWrappedText(
      ctx,
      isEn
        ? 'By identifying the vertical strips where ads reside, the cutter slices them away and stitches the surrounding prose seamlessly together. The result is a clean, timeless document.'
        : 'Genom att identifiera de vertikala sektioner där annonser och irrelevanta puffar ligger, kan verktyget skära bort hela sektionen och foga samman de kvarvarande delarna sömlöst. Resultatet blir en ren, tidlös och lättläst sammanställning där ingress, brödtext och slutsats hänger ihop precis som en klassisk boktryckt text.',
      margin,
      y,
      contentWidth,
      26
    );
    y += 28;

    // Blockquote
    const quoteH = 96;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(margin, y, contentWidth, quoteH);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(margin, y, 5, quoteH);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 16px Georgia, serif';
    drawWrappedText(
      ctx,
      isEn
        ? '“Being able to snip out 300 pixels of sponsored clutter in the middle of a text makes screenshots truly readable again.”'
        : '”Möjligheten att enkelt klippa bort 300 pixlar reklam mitt i en text och foga samman delarna gör att långa skärmdumpar äntligen blir användbara på riktigt.”',
      margin + 20,
      y + 36,
      contentWidth - 36,
      26
    );
    y += quoteH + 36;

    // ==========================================
    // AD 2: CASINO / CRYPTO SPONSORED BANNER (Full-width)
    // ==========================================
    const ad2Start = y;
    const ad2Height = 295;

    // Ad background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, ad2Start, width, ad2Height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, ad2Start, width, 1);
    ctx.fillRect(0, ad2Start + ad2Height - 1, width, 1);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'ADVERTISEMENT • SPONSORED' : 'ANNONS • SPONSRAT INNEHÅLL', margin, ad2Start + 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawWrappedText(
      ctx,
      isEn ? '🎰 Premier Online Casino – 100 Free Spins Today!' : '🎰 Nordens Största Spelsajt – 100 Free Spins Idag!',
      margin,
      ad2Start + 66,
      contentWidth,
      28
    );

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawWrappedText(
      ctx,
      isEn
        ? 'Explore over 2,000 slots and live dealers with lightning-fast payouts. Deposit $10 and play for $50. Wagering terms apply. Please play responsibly.'
        : 'Upptäck över 2 000 slots och live casino med blixtsnabba uttag med BankID. Sätt in 100 kr och spela för 500 kr. Omsättningskrav 20x. Spela ansvarsfullt.',
      margin,
      ad2Start + 104,
      contentWidth,
      22
    );

    // Fake Ad Buttons
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(margin, ad2Start + 170, 195, 44, 6);
    ctx.fill();

    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'Claim Bonus Here →' : 'Hämta bonus här →', margin + 24, ad2Start + 198);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(
      isEn ? '18+ only • Terms and conditions apply • GambleAware.org' : '18+ • Stödlinjen.se • Spelpaus.se • Regler & villkor gäller.',
      margin,
      ad2Start + 252
    );

    y = ad2Start + ad2Height + 36;

    // Section 3
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 23px Georgia, Cambria, "Times New Roman", serif';
    y = drawWrappedText(
      ctx,
      isEn ? 'Step-by-Step: Creating the Clean Reading File' : 'Steg-för-steg: Så skapar du den perfekta läsfilen',
      margin,
      y,
      contentWidth,
      32
    );
    y += 18;

    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const steps = isEn
      ? [
          '1. Take a scrolling screenshot on your phone or laptop of the full article.',
          '2. Drop the image into the editor or paste directly from clipboard.',
          '3. Drag over unwanted vertical sections to snip them out.',
          '4. Check the clean preview – sections are stitched together with pixel accuracy.',
          '5. Download your clean article or copy it straight into your notes.',
        ]
      : [
          '1. Ta en skrollande skärmdump på din telefon eller dator av hela webbsidan.',
          '2. Släpp in bilden i redigeraren eller klistra in direkt från urklipp.',
          '3. Dra markeringar över de sektioner i höjdled som du vill ta bort.',
          '4. Kontrollera förhandsgranskningen – sektionerna fogas samman millimeter-exakt.',
          '5. Ladda ner den rena artikeln eller kopiera bilden direkt till dina anteckningar.',
        ];
    steps.forEach((step) => {
      y = drawWrappedText(ctx, step, margin, y, contentWidth, 26);
      y += 8;
    });

    y += 24;

    // ==========================================
    // AD 3: NEWSLETTER POPUP / BANNER (Full-width)
    // ==========================================
    const ad3Start = y;
    const ad3Height = 220;

    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(0, ad3Start, width, ad3Height);
    ctx.fillStyle = '#bfdbfe';
    ctx.fillRect(0, ad3Start, width, 1);
    ctx.fillRect(0, ad3Start + ad3Height - 1, width, 1);

    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'NEWSLETTER & UPDATES' : 'NYHETSBREV & ERBJUDANDEN', margin, ad3Start + 32);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawWrappedText(
      ctx,
      isEn ? '📩 Want more curated tech summaries without ads?' : '📩 Vill du ha fler sammanfattningar utan annonser?',
      margin,
      ad3Start + 66,
      contentWidth,
      26
    );

    ctx.fillStyle = '#475569';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawWrappedText(
      ctx,
      isEn
        ? 'Enter your email address to receive our weekly curation of the most important stories.'
        : 'Skriv in din e-postadress så skickar vi vår veckovisa kurering av de viktigaste tech-nyheterna.',
      margin,
      ad3Start + 100,
      contentWidth,
      22
    );

    // Input box simulation
    const inputW = Math.min(300, contentWidth - 150);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(margin, ad3Start + 132, inputW, 42);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(margin, ad3Start + 132, inputW, 42);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'your.email@company.com' : 'din.epost@foretag.se', margin + 14, ad3Start + 158);

    const btnX = margin + inputW + 12;
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(btnX, ad3Start + 132, 130, 42, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isEn ? 'Subscribe' : 'Prenumerera', btnX + (isEn ? 28 : 18), ad3Start + 158);

    y = ad3Start + ad3Height + 36;

    // Conclusion paragraph
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    y = drawWrappedText(
      ctx,
      isEn
        ? 'The final result is an article you can read, share, and archive distraction-free. Trimming away ads vertically puts you in complete control.'
        : 'Slutresultatet är en artikel som går att arkivera, skriva ut eller läsa utan distraktioner. Att kunna trimma bort reklam vertikalt ger läsaren full kontroll över innehållet.',
      margin,
      y,
      contentWidth,
      26
    );
    y += 36;

    // Footer (Full-width)
    const footerStart = y;
    const footerH = 80;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, footerStart, width, footerH);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, footerStart, width, 1);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(
      isEn
        ? '© 2026 Global Tech & Futures • All rights reserved • Privacy Policy'
        : '© 2026 Nordisk Teknik & Framtid • Alla rättigheter förbehållna • Integritetspolicy',
      margin,
      footerStart + 46
    );

    y = footerStart + footerH;

    // Crop to exact computed height
    const finalHeight = Math.ceil(y);
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.drawImage(canvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight);

    const dataUrl = finalCanvas.toDataURL('image/png');

    const suggestedCuts: CutZone[] = [
      {
        id: 'sample-ad-1',
        startY: Math.round(ad1Start),
        endY: Math.round(ad1Start + ad1Height),
        label: isEn ? 'Banner Ad (Energy)' : 'Reklambanner (Elavtal)',
        enabled: true,
      },
      {
        id: 'sample-ad-2',
        startY: Math.round(ad2Start),
        endY: Math.round(ad2Start + ad2Height),
        label: isEn ? 'Sponsored Casino Banner' : 'Sponsrat Casino/Spel',
        enabled: true,
      },
      {
        id: 'sample-ad-3',
        startY: Math.round(ad3Start),
        endY: Math.round(ad3Start + ad3Height),
        label: isEn ? 'Newsletter Prompt' : 'Nyhetsbrevspuff',
        enabled: true,
      },
    ];

    resolve({
      dataUrl,
      width,
      height: finalHeight,
      suggestedCuts,
    });
  });
}
