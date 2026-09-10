export type Language = 'sv' | 'en';

export interface Translations {
  // Brand & metadata
  appTitle: string;
  appSubtitle: string;
  brandBadge: string;
  brandSubtitle: string;
  openSource: string;
  langName: string;

  // Header
  viewEditor: string;
  viewEditorShort: string;
  viewClean: string;
  viewCompare: string;
  undoTooltip: string;
  redoTooltip: string;
  resetAllTooltip: string;
  sampleArticle: string;
  sampleArticleShort: string;
  uploadButton: string;
  copyCleanImageTooltip: string;
  copyImage: string;
  copied: string;
  saveCleanImage: string;
  saveCleanImageShort: string;

  // Empty Dropzone
  dropzonePill: string;
  dropzoneHeadline: string;
  dropzoneLead: string;
  dropzoneDragText: string;
  dropzoneBrowse: string;
  dropzoneSupported: string;
  dropzonePasteTip: string;
  sampleCardTitle: string;
  sampleCardDesc: string;
  testSampleArticleBtn: string;
  privacyBadge: string;
  privacyNotice: string;
  step1Title: string;
  step1Sub: string;
  step1Desc: string;
  step2Title: string;
  step2Sub: string;
  step2Desc: string;
  step3Title: string;
  step3Sub: string;
  step3Desc: string;

  // Sidebar
  sidebarTitle: string;
  activeZonesCount: (count: number) => string;
  originalHeight: string;
  adsRemoved: string;
  cleanArticleHeight: string;
  keptPercent: (p: number) => string;
  cutPercent: (p: number) => string;
  addCutZoneBtn: string;
  noCutZonesYet: string;
  noCutZonesHint: string;
  cutLabel: (num: number) => string;
  disableCut: string;
  enableCut: string;
  deleteCut: string;
  fromY: string;
  toY: string;
  scrollToStart: string;
  scrollToEnd: string;
  startEdge: string;
  endEdge: (y: number) => string;

  // Editor Canvas
  editorCanvasHint: string;
  editorCanvasHintMobile: string;
  zoomOut: string;
  zoomIn: string;
  zoomFitWidth: string;
  zoom100: string;
  dragTopEdge: string;
  dragMoveZone: string;
  dragBottomEdge: string;
  bottomEdgeLabel: string;
  nudgeBottomUp: string;
  nudgeBottomDown: string;
  nudgeBothUp: string;
  nudgeBothDown: string;
  topEdgeAboveNotice: (y: number) => string;
  bottomEdgeBelowNotice: (y: number) => string;
  selectedZoneCut: (px: number) => string;
  panelToBottom: string;
  panelToTop: string;
  panelDown: string;
  panelUp: string;
  minimizePanel: string;
  expandPanel: string;
  minimizeShort: string;
  expandShort: string;
  doneBtn: string;
  goToTopEdge: string;
  goToBottomEdge: (y: number) => string;
  moveUpBtn: string;
  moveDownBtn: string;
  increaseHeightBtn: string;
  decreaseHeightBtn: string;
  bottomEdgeUpBtn: string;
  bottomEdgeDownBtn: string;

  // Clean Preview
  cleanScreenshotBadge: string;
  removedBadge: (removedPx: number, percent: number) => string;
  sectionsCutCount: (count: number) => string;
  sharpOriginalBadge: string;
  pixelMatchBadge: string;
  fitWidthBadge: (scalePercent: number) => string;
  switchToSharpBtn: string;
  seamMarkersLabel: string;
  openInNewTabTooltip: string;
  downloadCleanBtn: string;
  cleanImageAlt: string;
  seamlessQualityNotice: string;
  adjustMoreCutsBtn: string;
  generatingCleanImage: string;

  // Split Comparison
  compareOriginalColTitle: (height: number) => string;
  cutsCountBadge: (count: number) => string;
  compareCleanColTitle: (height: number) => string;
  cleanTextBadge: string;
  bothViewsBtn: string;
  cleanViewBtn: string;
  originalViewBtn: string;
  syncScrollLabel: string;
  adjustCutsBtn: string;
  cutOutLabel: string;
  originalAlt: string;
  cleanAlt: string;

  // Mobile Bottom Bar
  mobileAddCut: string;
  mobileZones: string;
  mobileClean: string;
  mobileDrawerTitle: string;

  // Footer & Tooltips
  githubRepoTooltip: string;

  // Toasts & Dialogs
  toastImageLoaded: (w: number, h: number) => string;
  toastSampleLoaded: string;
  toastCleared: string;
  toastCopied: string;
  toastCopyFailed: string;
  toastDownloaded: string;
  confirmResetAll: string;
  defaultZoneLabel: (px: number) => string;
  manualZoneLabel: string;
}

export const translations: Record<Language, Translations> = {
  sv: {
    appTitle: 'Screenshot Ad Cutter',
    appSubtitle: 'Klipp bort reklam & foga samman',
    brandBadge: 'Klipp & Sammanfoga',
    brandSubtitle: 'Rensa vertikala artikelskärmdumpar från reklam',
    openSource: 'Öppen källkod',
    langName: 'Svenska',

    // Header
    viewEditor: 'Redigera',
    viewEditorShort: 'Redigera',
    viewClean: 'Ren bild',
    viewCompare: 'Delad vy',
    undoTooltip: 'Ångra senaste ändring (Ctrl+Z)',
    redoTooltip: 'Gör om (Ctrl+Y)',
    resetAllTooltip: 'Återställ alla klippzoner',
    sampleArticle: 'Exempelartikel',
    sampleArticleShort: 'Exempel',
    uploadButton: 'Välj skärmdump',
    copyCleanImageTooltip: 'Kopiera ren bild till urklipp',
    copyImage: 'Kopiera',
    copied: 'Kopierad!',
    saveCleanImage: 'Spara ren bild',
    saveCleanImageShort: 'Spara',

    // Empty Dropzone
    dropzonePill: 'Klipp & sammanfoga vertikala skärmdumpar',
    dropzoneHeadline: 'Klipp bort reklam från artiklar',
    dropzoneLead: 'Har du tagit en lång skärmdump med irriterande banners och sponsrat innehåll mitt i texten? Markera reklamsektionerna i höjdled och foga samman resten till en ren, sömlös läsbild.',
    dropzoneDragText: 'Släpp din skärmdump här eller',
    dropzoneBrowse: 'bläddra',
    dropzoneSupported: 'Stöder PNG, JPEG, WebP (alla bildformat)',
    dropzonePasteTip: 'Tips: Du kan också klistra in direkt med',
    sampleCardTitle: 'Har du ingen skärmdump redo?',
    sampleCardDesc: 'Testa direkt med en realistisk nyhetsartikel som innehåller 3 typiska reklamavbrott.',
    testSampleArticleBtn: 'Testa exempelartikel',
    privacyBadge: '100% lokalt i webbläsaren',
    privacyNotice: 'All bildbehandling sker direkt i din webbläsare. Inga bilder laddas upp någonstans.',
    step1Title: '1. Ladda upp',
    step1Sub: 'Lång skärmdump',
    step1Desc: 'Lägg till skärmdumpen från mobilen eller datorn.',
    step2Title: '2. Markera',
    step2Sub: 'Klipp bort reklam',
    step2Desc: 'Dra över de banners och annonser i höjdled du vill ta bort.',
    step3Title: '3. Sammanfoga',
    step3Sub: 'Sömlöst resultat',
    step3Desc: 'Få en ren sammanfogad artikelbild redo att sparas eller delas.',

    // Sidebar
    sidebarTitle: 'Klippsektioner',
    activeZonesCount: (count) => `${count} aktiva`,
    originalHeight: 'Ursprunglig höjd:',
    adsRemoved: 'Reklam borttagen:',
    cleanArticleHeight: 'Ren artikel:',
    keptPercent: (p) => `Behålls: ${p}%`,
    cutPercent: (p) => `Klipps bort: ${p}%`,
    addCutZoneBtn: 'Lägg till klippzon',
    noCutZonesYet: 'Inga klippzoner ännu',
    noCutZonesHint: 'Klicka och dra över bildytan för att markera sektioner som ska klippas bort.',
    cutLabel: (num) => `Klipp ${num}`,
    disableCut: 'Inaktivera detta klipp',
    enableCut: 'Aktivera detta klipp',
    deleteCut: 'Ta bort',
    fromY: 'Från (Y-start):',
    toY: 'Till (Y-slut):',
    scrollToStart: 'Scrolla till zonens start',
    scrollToEnd: 'Scrolla till zonens nedre slutkant',
    startEdge: 'Start',
    endEdge: (y) => `Slut (${y}px)`,

    // Editor Canvas
    editorCanvasHint: 'Klicka och dra över bildytan för att markera en klippzon',
    editorCanvasHintMobile: 'Dra för att markera klippzon',
    zoomOut: 'Zooma ut',
    zoomIn: 'Zooma in',
    zoomFitWidth: 'Anpassa bredd till skärmen',
    zoom100: '100% skala',
    dragTopEdge: 'Dra för att justera övre klippgräns',
    dragMoveZone: 'Dra för att flytta hela zonen',
    dragBottomEdge: 'Dra för att justera undre klippgräns',
    bottomEdgeLabel: 'Nedre kant:',
    nudgeBottomUp: 'Flytta nedre kanten uppåt 10px',
    nudgeBottomDown: 'Flytta nedre kanten nedåt 10px',
    nudgeBothUp: 'Flytta upp 4px',
    nudgeBothDown: 'Flytta ner 4px',
    topEdgeAboveNotice: (y) => `Övre kanten börjar vid Y: ${y} px ↑ Klicka för att se`,
    bottomEdgeBelowNotice: (y) => `Nedre kanten slutar vid Y: ${y} px ↓ Klicka för att se`,
    selectedZoneCut: (px) => `Klipp: ${px} px`,
    panelToBottom: 'Flytta rutan till botten',
    panelToTop: 'Flytta rutan till toppen så den inte skymmer',
    panelDown: 'Nere ↓',
    panelUp: 'Uppe ↑',
    minimizePanel: 'Minimera för att se mer av skärmen',
    expandPanel: 'Expandera justeringsverktyg',
    minimizeShort: 'Minimera −',
    expandShort: 'Expandera ＋',
    doneBtn: 'Klar',
    goToTopEdge: 'Gå till överkant',
    goToBottomEdge: (y) => `Gå till underkant (${y} px)`,
    moveUpBtn: 'Flytta upp',
    moveDownBtn: 'Flytta ner',
    increaseHeightBtn: '+ Höjd',
    decreaseHeightBtn: '− Höjd',
    bottomEdgeUpBtn: 'Underkant ▲',
    bottomEdgeDownBtn: 'Underkant ▼',

    // Clean Preview
    cleanScreenshotBadge: 'Ren skärmdump',
    removedBadge: (removedPx, percent) => `-${removedPx} px borttaget (${percent}%)`,
    sectionsCutCount: (count) => `${count} reklamsektioner klippta`,
    sharpOriginalBadge: '100% Knivskarp originalupplösning',
    pixelMatchBadge: '1:1 pixelmatchning',
    fitWidthBadge: (scalePercent) => `Bredd anpassad till skärmen (${scalePercent}%)`,
    switchToSharpBtn: 'Växla till 100% skarp originalstorlek',
    seamMarkersLabel: 'Markera skarvar',
    openInNewTabTooltip: 'Öppna ren bild i full storlek i ny flik',
    downloadCleanBtn: 'Ladda ner ren bild',
    cleanImageAlt: 'Ren artikel utan reklam',
    seamlessQualityNotice: 'Sektionerna har sammanfogats sömlöst i full originalkvalitet.',
    adjustMoreCutsBtn: 'Justera fler klipp',
    generatingCleanImage: 'Genererar ren bild...',

    // Split Comparison
    compareOriginalColTitle: (h) => `Originalartikel (${h} px)`,
    cutsCountBadge: (count) => `${count} klipp`,
    compareCleanColTitle: (h) => `Sammanfogat resultat (${h} px)`,
    cleanTextBadge: '100% ren text',
    bothViewsBtn: 'Båda',
    cleanViewBtn: 'Ren bild',
    originalViewBtn: 'Original',
    syncScrollLabel: 'Synka skroll',
    adjustCutsBtn: 'Justera klipp',
    cutOutLabel: 'Klipps bort:',
    originalAlt: 'Original artikel',
    cleanAlt: 'Ren sammansatt artikel',

    // Mobile Bottom Bar
    mobileAddCut: '+ Klippzon',
    mobileZones: 'Zoner',
    mobileClean: 'Ren bild',
    mobileDrawerTitle: 'Klippsektioner',

    // Footer & Tooltips
    githubRepoTooltip: 'Öppna GitHub-repositoryt i en ny flik',

    // Toasts & Dialogs
    toastImageLoaded: (w, h) => `Laddade ${w} × ${h} px skärmdump`,
    toastSampleLoaded: 'Exempelartikel laddad – markera över annonserna för att klippa!',
    toastCleared: 'Alla klippzoner rensades',
    toastCopied: 'Ren bild kopierad till urklipp!',
    toastCopyFailed: 'Urklipp begränsat i webbläsaren. Ladda ner bilden i stället.',
    toastDownloaded: 'Den rena bilden laddades ner!',
    confirmResetAll: 'Är du säker på att du vill ta bort alla klippzoner?',
    defaultZoneLabel: (px) => `Klippzon (${px} px)`,
    manualZoneLabel: 'Manuell klippzon',
  },
  en: {
    appTitle: 'Screenshot Ad Cutter',
    appSubtitle: 'Cut out ads & stitch seamlessly',
    brandBadge: 'Cut & Stitch',
    brandSubtitle: 'Remove ads from vertical article screenshots',
    openSource: 'Open Source',
    langName: 'English',

    // Header
    viewEditor: 'Editor',
    viewEditorShort: 'Edit',
    viewClean: 'Clean image',
    viewCompare: 'Split view',
    undoTooltip: 'Undo last change (Ctrl+Z)',
    redoTooltip: 'Redo (Ctrl+Y)',
    resetAllTooltip: 'Reset all cut zones',
    sampleArticle: 'Sample article',
    sampleArticleShort: 'Sample',
    uploadButton: 'Choose screenshot',
    copyCleanImageTooltip: 'Copy clean image to clipboard',
    copyImage: 'Copy',
    copied: 'Copied!',
    saveCleanImage: 'Save clean image',
    saveCleanImageShort: 'Save',

    // Empty Dropzone
    dropzonePill: 'Cut & stitch vertical screenshots',
    dropzoneHeadline: 'Cut out ads from articles',
    dropzoneLead: 'Captured a long screenshot cluttered with ads and sponsored banners interrupting the article? Highlight the ad sections vertically and stitch the rest into a clean, seamless readable image.',
    dropzoneDragText: 'Drop your screenshot here or',
    dropzoneBrowse: 'browse',
    dropzoneSupported: 'Supports PNG, JPEG, WebP (all image formats)',
    dropzonePasteTip: 'Tip: You can also paste directly using',
    sampleCardTitle: 'No screenshot ready?',
    sampleCardDesc: 'Try right away with a realistic news article containing 3 typical inline ad interruptions.',
    testSampleArticleBtn: 'Try sample article',
    privacyBadge: '100% local in your browser',
    privacyNotice: 'All image processing happens directly in your browser. Nothing is uploaded anywhere.',
    step1Title: '1. Upload',
    step1Sub: 'Long screenshot',
    step1Desc: 'Upload a screenshot from your phone or computer.',
    step2Title: '2. Select',
    step2Sub: 'Cut out ads',
    step2Desc: 'Drag over the vertical ad banners you want removed.',
    step3Title: '3. Stitch',
    step3Sub: 'Seamless result',
    step3Desc: 'Get a clean, stitched article image ready to save or share.',

    // Sidebar
    sidebarTitle: 'Cut Sections',
    activeZonesCount: (count) => `${count} active`,
    originalHeight: 'Original height:',
    adsRemoved: 'Ads removed:',
    cleanArticleHeight: 'Clean article:',
    keptPercent: (p) => `Kept: ${p}%`,
    cutPercent: (p) => `Cut out: ${p}%`,
    addCutZoneBtn: 'Add cut zone',
    noCutZonesYet: 'No cut zones yet',
    noCutZonesHint: 'Click and drag across the image to highlight sections to remove.',
    cutLabel: (num) => `Cut ${num}`,
    disableCut: 'Disable this cut',
    enableCut: 'Enable this cut',
    deleteCut: 'Delete',
    fromY: 'From (Y start):',
    toY: 'To (Y end):',
    scrollToStart: 'Scroll to zone start',
    scrollToEnd: 'Scroll to zone bottom edge',
    startEdge: 'Start',
    endEdge: (y) => `End (${y}px)`,

    // Editor Canvas
    editorCanvasHint: 'Click and drag across the image to mark a cut zone',
    editorCanvasHintMobile: 'Drag to mark cut zone',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomFitWidth: 'Fit width to screen',
    zoom100: '100% scale',
    dragTopEdge: 'Drag to adjust top cut boundary',
    dragMoveZone: 'Drag to move the entire zone',
    dragBottomEdge: 'Drag to adjust bottom cut boundary',
    bottomEdgeLabel: 'Bottom edge:',
    nudgeBottomUp: 'Move bottom edge up 10px',
    nudgeBottomDown: 'Move bottom edge down 10px',
    nudgeBothUp: 'Move up 4px',
    nudgeBothDown: 'Move down 4px',
    topEdgeAboveNotice: (y) => `Top edge starts at Y: ${y} px ↑ Click to view`,
    bottomEdgeBelowNotice: (y) => `Bottom edge ends at Y: ${y} px ↓ Click to view`,
    selectedZoneCut: (px) => `Cut: ${px} px`,
    panelToBottom: 'Move panel to bottom',
    panelToTop: 'Move panel to top so it doesn\'t obstruct view',
    panelDown: 'Bottom ↓',
    panelUp: 'Top ↑',
    minimizePanel: 'Minimize to view more of the screen',
    expandPanel: 'Expand adjustment controls',
    minimizeShort: 'Minimize −',
    expandShort: 'Expand ＋',
    doneBtn: 'Done',
    goToTopEdge: 'Go to top edge',
    goToBottomEdge: (y) => `Go to bottom edge (${y} px)`,
    moveUpBtn: 'Move up',
    moveDownBtn: 'Move down',
    increaseHeightBtn: '+ Height',
    decreaseHeightBtn: '− Height',
    bottomEdgeUpBtn: 'Bottom edge ▲',
    bottomEdgeDownBtn: 'Bottom edge ▼',

    // Clean Preview
    cleanScreenshotBadge: 'Clean screenshot',
    removedBadge: (removedPx, percent) => `-${removedPx} px removed (${percent}%)`,
    sectionsCutCount: (count) => `${count} ad sections cut`,
    sharpOriginalBadge: '100% Razor-sharp original resolution',
    pixelMatchBadge: '1:1 pixel match',
    fitWidthBadge: (scalePercent) => `Width fitted to screen (${scalePercent}%)`,
    switchToSharpBtn: 'Switch to 100% sharp original size',
    seamMarkersLabel: 'Show seam lines',
    openInNewTabTooltip: 'Open clean image in full size in new tab',
    downloadCleanBtn: 'Download clean image',
    cleanImageAlt: 'Clean article without ads',
    seamlessQualityNotice: 'Sections have been stitched seamlessly in full original quality.',
    adjustMoreCutsBtn: 'Adjust more cuts',
    generatingCleanImage: 'Generating clean image...',

    // Split Comparison
    compareOriginalColTitle: (h) => `Original article (${h} px)`,
    cutsCountBadge: (count) => `${count} cuts`,
    compareCleanColTitle: (h) => `Stitched result (${h} px)`,
    cleanTextBadge: '100% clean text',
    bothViewsBtn: 'Both',
    cleanViewBtn: 'Clean image',
    originalViewBtn: 'Original',
    syncScrollLabel: 'Sync scroll',
    adjustCutsBtn: 'Adjust cuts',
    cutOutLabel: 'Cut out:',
    originalAlt: 'Original article',
    cleanAlt: 'Clean stitched article',

    // Mobile Bottom Bar
    mobileAddCut: '+ Cut Zone',
    mobileZones: 'Zones',
    mobileClean: 'Clean image',
    mobileDrawerTitle: 'Cut Sections',

    // Footer & Tooltips
    githubRepoTooltip: 'Open GitHub repository in a new tab',

    // Toasts & Dialogs
    toastImageLoaded: (w, h) => `Loaded ${w} × ${h} px screenshot`,
    toastSampleLoaded: 'Sample article loaded – drag over ads to cut them out!',
    toastCleared: 'All cut zones cleared',
    toastCopied: 'Clean image copied to clipboard!',
    toastCopyFailed: 'Clipboard restricted in browser. Please download the image instead.',
    toastDownloaded: 'Clean image downloaded!',
    confirmResetAll: 'Are you sure you want to remove all cut zones?',
    defaultZoneLabel: (px) => `Cut zone (${px} px)`,
    manualZoneLabel: 'Manual cut zone',
  },
};

const STORAGE_KEY = 'screenshot_cutter_lang';

/**
 * Detects visitor language:
 * 1. Checks localStorage for a manual preference ('sv' or 'en')
 * 2. If none, inspects navigator.language / navigator.languages:
 *    If language code starts with 'sv' -> 'sv', else defaults to 'en'
 */
export function detectInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'sv' || saved === 'en') {
      return saved;
    }
  } catch {
    // localStorage might be unavailable in some sandboxes
  }

  try {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const browserLang = (nav?.language || nav?.languages?.[0] || '').toLowerCase();
    if (browserLang.startsWith('sv')) {
      return 'sv';
    }
  } catch {
    // fallback
  }

  return 'en';
}

export function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}
