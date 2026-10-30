/**
 * ASCII Studio Pro - Core Application Engine
 * Image processing, ASCII rendering, Halftone, Pixel blocks,
 * Real-time grid overlay with auto-fadeout, and Native Resolution Export.
 */

// Application State
const state = {
  originalImage: null,
  bgImage: null,
  imageName: 'imagen',
  imageWidth: 0,
  imageHeight: 0,
  hasAlpha: false,
  
  // Grid settings
  gridCols: 32,
  gridRows: 32,
  keepAspectRatio: true,
  
  // Visual settings
  palette: 'bw', // 'bw', 'grayscale', 'gameboy', 'fluor', 'matrix', 'amber', 'original'
  invertColors: false,
  fillMode: 'ascii', // 'gradual', 'ascii', 'circles'
  charset: '@%#*+=-:. ',
  brightnessAdj: 0,
  contrastAdj: 0,
  
  // Background settings
  bgType: 'transparent', // 'transparent', 'black', 'white', 'custom'
  bgColor: '#0f172a',
  
  // Viewport / Zoom State
  zoom: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  
  // Grid Overlay timer
  gridFadeTimer: null
};

// Preset ASCII Character Sets (Ordered from darkest/densest to lightest/empty)
const CHARSETS = {
  standard: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  binary: '10 ',
  simple: '#*+. ',
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  custom: '@#*+=-:. '
};

// Color Palettes Definition
const PALETTES = {
  bw: {
    name: 'Blanco y Vacío',
    type: 'threshold',
    colors: ['#000000', '#ffffff']
  },
  grayscale: {
    name: 'Escala de Grises',
    type: 'ramp',
    colors: ['#050505', '#2a2a2a', '#555555', '#888888', '#bbbbbb', '#ffffff']
  },
  gameboy: {
    name: 'Game Boy',
    type: 'quantized',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  fluor: {
    name: 'Flúor / Neón',
    type: 'ramp',
    colors: ['#070716', '#800080', '#ff007f', '#00f2fe', '#39ff14', '#ffe600']
  },
  matrix: {
    name: 'Matrix Terminal',
    type: 'quantized',
    colors: ['#031405', '#00470d', '#008f1b', '#00ff41', '#a6ffb9']
  },
  amber: {
    name: 'Ámbar CRT',
    type: 'quantized',
    colors: ['#120800', '#4d2600', '#994d00', '#e67300', '#ffbe33']
  },
  original: {
    name: 'Color Original',
    type: 'original'
  }
};

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('image-input');
const navImageInput = document.getElementById('nav-image-input');
const sidebarImageInput = document.getElementById('sidebar-image-input');
const changeImageInput = document.getElementById('change-image-input');
const btnLoadDemo = document.getElementById('btn-load-demo');
const currentImgBadge = document.getElementById('current-img-badge');
const sidebarUploadBtnText = document.getElementById('sidebar-upload-btn-text');
const canvasWrapper = document.getElementById('canvas-wrapper');
const canvasStage = document.getElementById('canvas-stage');
const bgCanvas = document.getElementById('bg-canvas');
const renderCanvas = document.getElementById('render-canvas');
const gridCanvas = document.getElementById('grid-canvas');
const gridStatusPill = document.getElementById('grid-status-pill');
const gridStatusVal = document.getElementById('grid-status-val');

const gridSlider = document.getElementById('grid-slider');
const gridValDisplay = document.getElementById('grid-val-display');
const aspectRatioToggle = document.getElementById('aspect-ratio-toggle');
const invertColorsToggle = document.getElementById('invert-colors-toggle');

const brightnessSlider = document.getElementById('brightness-slider');
const contrastSlider = document.getElementById('contrast-slider');
const brightnessVal = document.getElementById('brightness-val');
const contrastVal = document.getElementById('contrast-val');

const asciiCharsetSelect = document.getElementById('ascii-charset-select');
const customCharsetBox = document.getElementById('custom-charset-box');
const customCharsetInput = document.getElementById('custom-charset-input');

const bgImageInput = document.getElementById('bg-image-input');
const btnRemoveBgImg = document.getElementById('btn-remove-bg-img');
const bgColorPicker = document.getElementById('bg-color-picker');
const bgImgLabelText = document.getElementById('bg-img-label-text');
const pngBadge = document.getElementById('png-badge');

const btnDownload = document.getElementById('btn-download');
const btnCopyAscii = document.getElementById('btn-copy-ascii');
const btnResetView = document.getElementById('btn-reset-view');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomFit = document.getElementById('btn-zoom-fit');
const zoomLevelText = document.getElementById('zoom-level');
const zoomToolbar = document.getElementById('zoom-toolbar');
const imageInfoBadge = document.getElementById('image-info-badge');
const exportDimText = document.getElementById('export-dim-text');
const toastEl = document.getElementById('toast');

// Canvas Contexts
const bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
const renderCtx = renderCanvas.getContext('2d');
const gridCtx = gridCanvas.getContext('2d');

// Sample data cache
let cachedSamplingCanvas = null;
let cachedSamplingCtx = null;

// Initialize
function init() {
  setupEventListeners();
  setupZoomAndPan();
  // We leave the dropzone visible by default so the user can easily upload their image.
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  // Global drag & drop everywhere on window
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.clientX <= 0 || e.clientY <= 0) {
      dropZone.classList.remove('dragover');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  });

  // Multiple input triggers
  [imageInput, navImageInput, sidebarImageInput, changeImageInput].forEach(input => {
    if (input) {
      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleImageFile(e.target.files[0]);
        }
      });
    }
  });

  // Demo button
  if (btnLoadDemo) {
    btnLoadDemo.addEventListener('click', () => {
      loadDefaultPlaceholder();
      showToast('Imagen de demostración cargada');
    });
  }

  // Grid Slider Interaction & 1s auto fade-out
  gridSlider.addEventListener('input', () => {
    updateGridDimensionsFromSlider();
    triggerGridOverlayActivity();
    renderMainArt();
  });

  aspectRatioToggle.addEventListener('change', (e) => {
    state.keepAspectRatio = e.target.checked;
    updateGridDimensionsFromSlider();
    triggerGridOverlayActivity();
    renderMainArt();
  });

  // Color Palette Selection
  document.querySelectorAll('.palette-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.palette-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.palette = btn.dataset.palette;
      renderMainArt();
    });
  });

  invertColorsToggle.addEventListener('change', (e) => {
    state.invertColors = e.target.checked;
    renderMainArt();
  });

  // Fill Mode Selection
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.fillMode = btn.dataset.fill;
      
      const asciiSub = document.getElementById('ascii-sub-options');
      if (state.fillMode === 'ascii') {
        asciiSub.classList.remove('hidden');
      } else {
        asciiSub.classList.add('hidden');
      }
      renderMainArt();
    });
  });

  // ASCII Charset Select
  asciiCharsetSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customCharsetBox.classList.remove('hidden');
      state.charset = customCharsetInput.value || CHARSETS.standard;
    } else {
      customCharsetBox.classList.add('hidden');
      state.charset = CHARSETS[e.target.value] || CHARSETS.standard;
    }
    renderMainArt();
  });

  customCharsetInput.addEventListener('input', (e) => {
    state.charset = e.target.value || ' ';
    renderMainArt();
  });

  // Fine Brightness / Contrast sliders
  brightnessSlider.addEventListener('input', (e) => {
    state.brightnessAdj = parseInt(e.target.value, 10);
    brightnessVal.textContent = state.brightnessAdj > 0 ? `+${state.brightnessAdj}` : state.brightnessAdj;
    renderMainArt();
  });

  contrastSlider.addEventListener('input', (e) => {
    state.contrastAdj = parseInt(e.target.value, 10);
    contrastVal.textContent = state.contrastAdj > 0 ? `+${state.contrastAdj}` : state.contrastAdj;
    renderMainArt();
  });

  // Background Options (Radio)
  document.querySelectorAll('input[name="bg-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.bgType = e.target.value;
      updateBackgroundStage();
    });
  });

  bgColorPicker.addEventListener('input', (e) => {
    state.bgColor = e.target.value;
    const customRadio = document.querySelector('input[name="bg-type"][value="custom"]');
    if (customRadio) customRadio.checked = true;
    state.bgType = 'custom';
    updateBackgroundStage();
  });

  // Upload Custom Background Image
  bgImageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleBackgroundImageFile(e.target.files[0]);
    }
  });

  btnRemoveBgImg.addEventListener('click', () => {
    state.bgImage = null;
    btnRemoveBgImg.classList.add('hidden');
    bgImgLabelText.textContent = 'Subir Imagen de Fondo';
    bgImageInput.value = '';
    updateBackgroundStage();
    showToast('Fondo subido eliminado');
  });

  // Export Format Selection
  document.querySelectorAll('input[name="export-format"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.radio-chip').forEach(c => c.classList.remove('active'));
      e.target.closest('.radio-chip').classList.add('active');
    });
  });

  // Download Button
  btnDownload.addEventListener('click', downloadFinalImage);

  // Copy ASCII Button
  btnCopyAscii.addEventListener('click', copyAsciiToClipboard);

  // Window Resize
  window.addEventListener('resize', () => {
    if (state.originalImage) fitCanvasToViewport();
  });
}

/**
 * Update Grid dimensions from slider value and aspect ratio toggle
 */
function updateGridDimensionsFromSlider() {
  const val = parseInt(gridSlider.value, 10);
  state.gridCols = val;

  if (state.keepAspectRatio && state.imageWidth > 0 && state.imageHeight > 0) {
    const ratio = state.imageHeight / state.imageWidth;
    state.gridRows = Math.max(2, Math.min(256, Math.round(val * ratio)));
  } else {
    state.gridRows = val;
  }

  gridValDisplay.textContent = `${state.gridCols} × ${state.gridRows}`;
  gridStatusVal.textContent = `${state.gridCols} × ${state.gridRows}`;
}

/**
 * Trigger Grid Overlay lines with 1s auto-fadeout
 */
function triggerGridOverlayActivity() {
  if (!state.originalImage) return;

  // Draw crisp grid lines on grid-canvas
  drawGridLines();

  // Make sure grid canvas is fully visible
  gridCanvas.classList.remove('fade-out');
  gridStatusPill.classList.remove('hidden');

  // Reset timer
  if (state.gridFadeTimer) {
    clearTimeout(state.gridFadeTimer);
  }

  // 1 second inactivity timer -> triggers smooth fade-out
  state.gridFadeTimer = setTimeout(() => {
    gridCanvas.classList.add('fade-out');
    gridStatusPill.classList.add('hidden');
  }, 1000);
}

/**
 * Draw the actual grid lines on top overlay canvas
 */
function drawGridLines() {
  const w = gridCanvas.width;
  const h = gridCanvas.height;
  gridCtx.clearRect(0, 0, w, h);

  const cols = state.gridCols;
  const rows = state.gridRows;
  const cellW = w / cols;
  const cellH = h / rows;

  gridCtx.lineWidth = 1;
  gridCtx.strokeStyle = 'rgba(0, 242, 254, 0.45)';

  gridCtx.beginPath();

  // Vertical lines
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * cellW) + 0.5;
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, h);
  }

  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(r * cellH) + 0.5;
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(w, y);
  }

  gridCtx.stroke();
}

/**
 * Handle Main Image Upload
 */
function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)');
    return;
  }

  // Check file size (e.g., up to 25MB for safety)
  if (file.size > 25 * 1024 * 1024) {
    showToast('La imagen es demasiado grande. El límite recomendado es 25MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.originalImage = img;
      state.imageName = file.name.replace(/\.[^/.]+$/, "");
      state.imageWidth = img.naturalWidth || img.width;
      state.imageHeight = img.naturalHeight || img.height;

      // Update UI badges
      imageInfoBadge.textContent = `${state.imageWidth} × ${state.imageHeight} px`;
      imageInfoBadge.classList.remove('hidden');
      exportDimText.textContent = `${state.imageWidth} × ${state.imageHeight} px`;

      if (currentImgBadge) {
        currentImgBadge.textContent = `${state.imageWidth}×${state.imageHeight}`;
      }
      if (sidebarUploadBtnText) {
        sidebarUploadBtnText.textContent = 'Cambiar Imagen';
      }

      // Check alpha channel
      checkImageAlpha(img);

      // Setup and adjust grid
      updateGridDimensionsFromSlider();

      // Show stage and hide dropzone
      dropZone.classList.add('hidden');
      canvasWrapper.classList.remove('hidden');
      zoomToolbar.classList.remove('hidden');

      // Setup canvas dimensions
      setupCanvases(state.imageWidth, state.imageHeight);
      updateBackgroundStage();
      renderMainArt();
      fitCanvasToViewport();

      showToast(`Imagen cargada: ${state.imageWidth}x${state.imageHeight}px`);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Check if the image contains alpha transparency
 */
function checkImageAlpha(img) {
  const testCanvas = document.createElement('canvas');
  testCanvas.width = Math.min(img.width, 256);
  testCanvas.height = Math.min(img.height, 256);
  const testCtx = testCanvas.getContext('2d');
  testCtx.drawImage(img, 0, 0, testCanvas.width, testCanvas.height);

  const imgData = testCtx.getImageData(0, 0, testCanvas.width, testCanvas.height).data;
  let hasAlpha = false;
  for (let i = 3; i < imgData.length; i += 4) {
    if (imgData[i] < 255) {
      hasAlpha = true;
      break;
    }
  }

  state.hasAlpha = hasAlpha;
  if (hasAlpha) {
    pngBadge.textContent = 'Transparencia detectada';
    pngBadge.classList.remove('hidden');
  } else {
    pngBadge.textContent = 'Sin canal alfa';
  }
}

/**
 * Handle Custom Background Image File
 */
function handleBackgroundImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.bgImage = img;
      btnRemoveBgImg.classList.remove('hidden');
      bgImgLabelText.textContent = 'Cambiar Imagen de Fondo';
      updateBackgroundStage();
      showToast('Imagen de fondo aplicada');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Setup Dimensions for Canvas Elements
 */
function setupCanvases(width, height) {
  [bgCanvas, renderCanvas, gridCanvas].forEach(c => {
    c.width = width;
    c.height = height;
  });

  // Cached sampling canvas for performance
  cachedSamplingCanvas = document.createElement('canvas');
  cachedSamplingCanvas.width = width;
  cachedSamplingCanvas.height = height;
  cachedSamplingCtx = cachedSamplingCanvas.getContext('2d', { willReadFrequently: true });
}

/**
 * Update Background Canvas
 */
function updateBackgroundStage() {
  if (!state.imageWidth || !state.imageHeight) return;

  const w = bgCanvas.width;
  const h = bgCanvas.height;
  bgCtx.clearRect(0, 0, w, h);

  // Custom uploaded background image takes priority if present
  if (state.bgImage) {
    bgCtx.drawImage(state.bgImage, 0, 0, w, h);
    canvasStage.classList.remove('pattern-trans');
    renderMainArt();
    return;
  }

  if (state.bgType === 'transparent') {
    canvasStage.classList.add('pattern-trans');
  } else {
    canvasStage.classList.remove('pattern-trans');
    let color = '#000000';
    if (state.bgType === 'white') color = '#ffffff';
    else if (state.bgType === 'custom') color = state.bgColor;

    bgCtx.fillStyle = color;
    bgCtx.fillRect(0, 0, w, h);
  }

  renderMainArt();
}

/**
 * Main Render Function
 * Draws pixels, ASCII or circles onto renderCanvas
 */
function renderMainArt() {
  if (!state.originalImage) return;

  const w = renderCanvas.width;
  const h = renderCanvas.height;
  const cols = state.gridCols;
  const rows = state.gridRows;

  // Clear render canvas
  renderCtx.clearRect(0, 0, w, h);

  // If sampling canvas is not prepared, draw source image
  cachedSamplingCtx.clearRect(0, 0, w, h);
  cachedSamplingCtx.drawImage(state.originalImage, 0, 0, w, h);

  // Cell dimensions in original image coordinates
  const cellW = w / cols;
  const cellH = h / rows;

  // Pre-calculate contrast factor
  // Contrast slider: -100 to 100 -> factor
  const contrastFactor = (259 * (state.contrastAdj + 255)) / (255 * (259 - state.contrastAdj));
  const brightnessOffset = state.brightnessAdj * 1.5;

  // Fast sampling: create a downscaled canvas (cols x rows) to sample average colors per cell instantly!
  const downscaleCanvas = document.createElement('canvas');
  downscaleCanvas.width = cols;
  downscaleCanvas.height = rows;
  const downscaleCtx = downscaleCanvas.getContext('2d', { willReadFrequently: true });
  downscaleCtx.imageSmoothingEnabled = true;
  downscaleCtx.drawImage(state.originalImage, 0, 0, cols, rows);

  const imgDataObj = downscaleCtx.getImageData(0, 0, cols, rows);
  const data = imgDataObj.data;

  // Font setup for ASCII
  if (state.fillMode === 'ascii') {
    // Configure monospace font size based on cell
    const fontSize = Math.max(8, Math.min(cellW * 1.25, cellH * 1.1));
    renderCtx.font = `bold ${Math.round(fontSize)}px "JetBrains Mono", monospace`;
    renderCtx.textAlign = 'center';
    renderCtx.textBaseline = 'middle';
  }

  // Iterate each cell in the grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      let red = data[idx];
      let green = data[idx + 1];
      let blue = data[idx + 2];
      const alpha = data[idx + 3];

      // If cell is completely transparent, skip unless background is set
      if (alpha === 0) continue;

      // Apply brightness & contrast
      red = Math.min(255, Math.max(0, contrastFactor * (red - 128) + 128 + brightnessOffset));
      green = Math.min(255, Math.max(0, contrastFactor * (green - 128) + 128 + brightnessOffset));
      blue = Math.min(255, Math.max(0, contrastFactor * (blue - 128) + 128 + brightnessOffset));

      // Calculate relative luminance (standard ITU-R BT.601)
      let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      luminance = Math.min(1, Math.max(0, luminance));

      // Invert if active
      if (state.invertColors) {
        luminance = 1 - luminance;
        red = 255 - red;
        green = 255 - green;
        blue = 255 - blue;
      }

      // Compute display color for this cell based on active palette
      const finalColor = getPaletteColor(luminance, red, green, blue, alpha);

      // Coordinate for this cell
      const x = c * cellW;
      const y = r * cellH;

      // Draw according to fillMode
      if (state.fillMode === 'gradual') {
        drawGradualPixel(renderCtx, x, y, cellW, cellH, luminance, finalColor);
      } else if (state.fillMode === 'ascii') {
        drawAsciiCell(renderCtx, x, y, cellW, cellH, luminance, finalColor);
      } else if (state.fillMode === 'circles') {
        drawCircleCell(renderCtx, x, y, cellW, cellH, luminance, finalColor);
      }
    }
  }
}

/**
 * Get Color from chosen palette based on luminance or RGB
 */
function getPaletteColor(luminance, r, g, b, alpha) {
  const pal = PALETTES[state.palette];

  if (!pal) return `rgba(${r},${g},${b},${alpha / 255})`;

  if (pal.type === 'original') {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha / 255})`;
  }

  if (pal.type === 'threshold') {
    // Blanco y Vacío: blanco si supera umbral (o brillo), o transparente
    return luminance > 0.35 ? '#ffffff' : 'transparent';
  }

  if (pal.type === 'quantized') {
    // Step quantization into palette colors
    const colors = pal.colors;
    const index = Math.min(colors.length - 1, Math.floor(luminance * colors.length));
    return colors[index];
  }

  if (pal.type === 'ramp') {
    // Interpolate smoothly through ramp
    const colors = pal.colors;
    const scaled = luminance * (colors.length - 1);
    const i = Math.floor(scaled);
    const fract = scaled - i;

    if (i >= colors.length - 1) return colors[colors.length - 1];

    const c1 = hexToRgb(colors[i]);
    const c2 = hexToRgb(colors[i + 1]);

    const nr = Math.round(c1.r + (c2.r - c1.r) * fract);
    const ng = Math.round(c1.g + (c2.g - c1.g) * fract);
    const nb = Math.round(c1.b + (c2.b - c1.b) * fract);

    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  return '#ffffff';
}

/**
 * Fill Mode 1: Gradual Pixel (Scales pixel block based on brightness)
 */
function drawGradualPixel(ctx, x, y, cellW, cellH, luminance, color) {
  if (color === 'transparent') return;

  ctx.fillStyle = color;

  // Scale dimension based on brightness from cell center
  const scale = Math.max(0.1, luminance);
  const blockW = cellW * scale;
  const blockH = cellH * scale;
  const posX = x + (cellW - blockW) / 2;
  const posY = y + (cellH - blockH) / 2;

  ctx.fillRect(posX, posY, blockW, blockH);
}

/**
 * Fill Mode 2: ASCII Character Mapping
 */
function drawAsciiCell(ctx, x, y, cellW, cellH, luminance, color) {
  if (color === 'transparent') return;

  const charset = state.charset;
  if (!charset || charset.length === 0) return;

  // Map luminance to character index
  // Luminance 1.0 (lightest) maps to lighter characters, 0.0 (darkest) to dense characters
  // or vice versa depending on background. In standard terminal: high brightness = dense char.
  const charIdx = Math.min(charset.length - 1, Math.floor((1 - luminance) * (charset.length - 1)));
  const char = charset[charIdx];

  if (char === ' ') return;

  ctx.fillStyle = color;
  ctx.fillText(char, x + cellW / 2, y + cellH / 2);
}

/**
 * Fill Mode 3: Circles with proportional radius (Halftone)
 */
function drawCircleCell(ctx, x, y, cellW, cellH, luminance, color) {
  if (color === 'transparent') return;

  // Max radius is half the min dimension
  const maxRadius = Math.min(cellW, cellH) / 2;
  const radius = maxRadius * luminance;

  if (radius <= 0.2) return;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + cellW / 2, y + cellH / 2, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Setup Zoom & Pan for interactive viewport
 */
function setupZoomAndPan() {
  const wrapper = canvasWrapper;

  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(state.zoom * delta);
  }, { passive: false });

  wrapper.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    state.isDragging = true;
    state.dragStartX = e.clientX - state.panX;
    state.dragStartY = e.clientY - state.panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    state.panX = e.clientX - state.dragStartX;
    state.panY = e.clientY - state.dragStartY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    state.isDragging = false;
  });

  // Zoom toolbar buttons
  btnZoomIn.addEventListener('click', () => setZoom(state.zoom * 1.25));
  btnZoomOut.addEventListener('click', () => setZoom(state.zoom * 0.8));
  btnZoomFit.addEventListener('click', fitCanvasToViewport);
  btnResetView.addEventListener('click', resetView);
}

function setZoom(val) {
  state.zoom = Math.min(5, Math.max(0.1, val));
  zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
  applyTransform();
}

function resetView() {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  zoomLevelText.textContent = '100%';
  applyTransform();
}

function fitCanvasToViewport() {
  if (!state.imageWidth || !state.imageHeight) return;

  const vp = document.getElementById('viewport-container');
  const padding = 60;
  const availW = vp.clientWidth - padding;
  const availH = vp.clientHeight - padding;

  const scaleW = availW / state.imageWidth;
  const scaleH = availH / state.imageHeight;
  const bestFit = Math.min(scaleW, scaleH, 1.2);

  state.zoom = Math.max(0.1, bestFit);
  state.panX = 0;
  state.panY = 0;
  zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
  applyTransform();
}

function applyTransform() {
  canvasStage.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
}

/**
 * Final Export at Original Native Resolution
 */
function downloadFinalImage() {
  if (!state.originalImage) {
    showToast('Por favor carga una imagen primero');
    return;
  }

  showToast('Generando imagen en resolución original...');

  setTimeout(() => {
    const origW = state.imageWidth;
    const origH = state.imageHeight;

    // Create full-resolution offscreen export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = origW;
    exportCanvas.height = origH;
    const expCtx = exportCanvas.getContext('2d');

    // 1. Draw Background
    if (state.bgImage) {
      expCtx.drawImage(state.bgImage, 0, 0, origW, origH);
    } else if (state.bgType === 'black') {
      expCtx.fillStyle = '#000000';
      expCtx.fillRect(0, 0, origW, origH);
    } else if (state.bgType === 'white') {
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, origW, origH);
    } else if (state.bgType === 'custom') {
      expCtx.fillStyle = state.bgColor;
      expCtx.fillRect(0, 0, origW, origH);
    }
    // Note: If transparent, we leave it transparent!

    // 2. Render Art at Native Resolution
    const cols = state.gridCols;
    const rows = state.gridRows;
    const cellW = origW / cols;
    const cellH = origH / rows;

    const contrastFactor = (259 * (state.contrastAdj + 255)) / (255 * (259 - state.contrastAdj));
    const brightnessOffset = state.brightnessAdj * 1.5;

    // Sample downscaled
    const downCanvas = document.createElement('canvas');
    downCanvas.width = cols;
    downCanvas.height = rows;
    const downCtx = downCanvas.getContext('2d', { willReadFrequently: true });
    downCtx.drawImage(state.originalImage, 0, 0, cols, rows);
    const data = downCtx.getImageData(0, 0, cols, rows).data;

    if (state.fillMode === 'ascii') {
      const fontSize = Math.max(8, Math.min(cellW * 1.25, cellH * 1.1));
      expCtx.font = `bold ${Math.round(fontSize)}px "JetBrains Mono", monospace`;
      expCtx.textAlign = 'center';
      expCtx.textBaseline = 'middle';
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = (r * cols + c) * 4;
        let red = data[idx];
        let green = data[idx + 1];
        let blue = data[idx + 2];
        const alpha = data[idx + 3];

        if (alpha === 0) continue;

        red = Math.min(255, Math.max(0, contrastFactor * (red - 128) + 128 + brightnessOffset));
        green = Math.min(255, Math.max(0, contrastFactor * (green - 128) + 128 + brightnessOffset));
        blue = Math.min(255, Math.max(0, contrastFactor * (blue - 128) + 128 + brightnessOffset));

        let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
        luminance = Math.min(1, Math.max(0, luminance));

        if (state.invertColors) {
          luminance = 1 - luminance;
          red = 255 - red;
          green = 255 - green;
          blue = 255 - blue;
        }

        const finalColor = getPaletteColor(luminance, red, green, blue, alpha);
        const x = c * cellW;
        const y = r * cellH;

        if (state.fillMode === 'gradual') {
          drawGradualPixel(expCtx, x, y, cellW, cellH, luminance, finalColor);
        } else if (state.fillMode === 'ascii') {
          drawAsciiCell(expCtx, x, y, cellW, cellH, luminance, finalColor);
        } else if (state.fillMode === 'circles') {
          drawCircleCell(expCtx, x, y, cellW, cellH, luminance, finalColor);
        }
      }
    }

    // Determine export format
    const formatRadio = document.querySelector('input[name="export-format"]:checked');
    const format = formatRadio ? formatRadio.value : 'png';
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';

    // Trigger download
    const link = document.createElement('a');
    link.download = `${state.imageName}_ascii_${cols}x${rows}.${extension}`;
    link.href = exportCanvas.toDataURL(mimeType, 0.95);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Imagen descargada en resolución nativa: ${origW}×${origH}px`);
  }, 50);
}

/**
 * Copy ASCII Text representation to clipboard
 */
function copyAsciiToClipboard() {
  if (!state.originalImage) return;

  const cols = state.gridCols;
  const rows = state.gridRows;

  const downCanvas = document.createElement('canvas');
  downCanvas.width = cols;
  downCanvas.height = rows;
  const downCtx = downCanvas.getContext('2d', { willReadFrequently: true });
  downCtx.drawImage(state.originalImage, 0, 0, cols, rows);
  const data = downCtx.getImageData(0, 0, cols, rows).data;

  const charset = state.charset;
  let asciiText = '';

  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c) * 4;
      const red = data[idx];
      const green = data[idx + 1];
      const blue = data[idx + 2];
      const alpha = data[idx + 3];

      if (alpha === 0) {
        line += ' ';
        continue;
      }

      let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      if (state.invertColors) luminance = 1 - luminance;

      const charIdx = Math.min(charset.length - 1, Math.floor((1 - luminance) * (charset.length - 1)));
      line += charset[charIdx] || ' ';
    }
    asciiText += line + '\n';
  }

  navigator.clipboard.writeText(asciiText).then(() => {
    showToast('¡Texto ASCII copiado al portapapeles!');
  }).catch(() => {
    showToast('Error al copiar al portapapeles');
  });
}

/**
 * Helper: Convert Hex color to RGB object
 */
function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  if (sanitized.length === 6) {
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  } else if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return { r, g, b };
  }
  return { r: 255, g: 255, b: 255 };
}

/**
 * Helper: Toast Notification
 */
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

/**
 * Load initial default placeholder demo (cyberpunk retro skull/avatar)
 * so the page is immediately beautiful and testable right away!
 */
function loadDefaultPlaceholder() {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Create an engaging retro demo graphic
  const grad = ctx.createLinearGradient(0, 0, 600, 600);
  grad.addColorStop(0, '#ff007f');
  grad.addColorStop(0.5, '#7928ca');
  grad.addColorStop(1, '#00f2fe');

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 600, 600);

  // Draw concentric glowing circles and shapes
  ctx.save();
  ctx.translate(300, 300);

  // Background glow
  const radGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 260);
  radGrad.addColorStop(0, 'rgba(0, 242, 254, 0.8)');
  radGrad.addColorStop(0.5, 'rgba(255, 0, 127, 0.4)');
  radGrad.addColorStop(1, 'rgba(10, 13, 20, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 260, 0, Math.PI * 2);
  ctx.fill();

  // Geometric retro synth glyphs
  ctx.strokeStyle = grad;
  ctx.lineWidth = 12;

  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.stroke();

  // Central symbol
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 110px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ASCII', 0, -20);

  ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#00f2fe';
  ctx.fillText('PRO', 0, 55);

  ctx.restore();

  // Create image from canvas
  const img = new Image();
  img.onload = () => {
    state.originalImage = img;
    state.imageName = 'demo_ascii';
    state.imageWidth = 600;
    state.imageHeight = 600;
    state.hasAlpha = false;

    imageInfoBadge.textContent = '600 × 600 px (Demo)';
    imageInfoBadge.classList.remove('hidden');
    exportDimText.textContent = '600 × 600 px';

    if (currentImgBadge) {
      currentImgBadge.textContent = 'Demo (600×600)';
    }
    if (sidebarUploadBtnText) {
      sidebarUploadBtnText.textContent = 'Cambiar Imagen';
    }

    setupCanvases(600, 600);
    updateGridDimensionsFromSlider();
    dropZone.classList.add('hidden');
    canvasWrapper.classList.remove('hidden');
    zoomToolbar.classList.remove('hidden');

    updateBackgroundStage();
    renderMainArt();
    fitCanvasToViewport();
  };
  img.src = canvas.toDataURL('image/png');
}

// Start Application on Load
window.addEventListener('DOMContentLoaded', init);

