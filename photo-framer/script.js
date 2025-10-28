// Frame size configurations (in pixels at 300 DPI for print quality)
// Each size stores portrait dimensions; landscape will swap width/height
const FRAME_SIZES = {
    '4x6': { width: 1200, height: 1800 },
    '5x7': { width: 1500, height: 2100 },
    '8x10': { width: 2400, height: 3000 },
    '11x14': { width: 3300, height: 4200 },
    '16x20': { width: 4800, height: 6000 },
    '18x24': { width: 5400, height: 7200 }
};

// Get frame dimensions based on size and orientation
function getFrameDimensions(size, orientation) {
    const baseSize = FRAME_SIZES[size];
    if (orientation === 'landscape') {
        return { width: baseSize.height, height: baseSize.width };
    }
    return { width: baseSize.width, height: baseSize.height };
}

// Application state
let state = {
    uploadedImage: null,
    currentZoom: 100,
    imagePosition: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    frameSize: '8x10',
    orientation: 'portrait'
};

// DOM elements
const photoUpload = document.getElementById('photoUpload');
const uploadSection = document.getElementById('uploadSection');
const editorSection = document.getElementById('editorSection');
const photoCanvas = document.getElementById('photoCanvas');
const ctx = photoCanvas.getContext('2d');
const cropOverlay = document.getElementById('cropOverlay');
const cropCtx = cropOverlay.getContext('2d');
const frameSizeSelect = document.getElementById('frameSize');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const resetPositionBtn = document.getElementById('resetPosition');
const downloadBtn = document.getElementById('downloadBtn');
const uploadNewBtn = document.getElementById('uploadNewBtn');
const frame = document.getElementById('frame');
const canvasContainer = document.getElementById('canvasContainer');
const uploadLabel = document.querySelector('.upload-label');
const portraitBtn = document.getElementById('portraitBtn');
const landscapeBtn = document.getElementById('landscapeBtn');
const orientationHint = document.getElementById('orientationHint');

// Initialize event listeners
function init() {
    // File upload
    photoUpload.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadLabel.addEventListener('dragover', handleDragOver);
    uploadLabel.addEventListener('dragleave', handleDragLeave);
    uploadLabel.addEventListener('drop', handleDrop);
    
    // Controls
    frameSizeSelect.addEventListener('change', handleFrameSizeChange);
    zoomSlider.addEventListener('input', handleZoomChange);
    resetPositionBtn.addEventListener('click', resetPosition);
    downloadBtn.addEventListener('click', downloadFramedImage);
    uploadNewBtn.addEventListener('click', uploadNew);
    
    // Orientation controls
    portraitBtn.addEventListener('click', () => handleOrientationChange('portrait'));
    landscapeBtn.addEventListener('click', () => handleOrientationChange('landscape'));
    
    // Canvas dragging
    photoCanvas.addEventListener('mousedown', startDrag);
    photoCanvas.addEventListener('mousemove', drag);
    photoCanvas.addEventListener('mouseup', endDrag);
    photoCanvas.addEventListener('mouseleave', endDrag);
    
    // Touch support
    photoCanvas.addEventListener('touchstart', handleTouchStart);
    photoCanvas.addEventListener('touchmove', handleTouchMove);
    photoCanvas.addEventListener('touchend', endDrag);
}

// File handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadLabel.style.borderColor = '#764ba2';
    uploadLabel.style.background = '#f0f1ff';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadLabel.style.borderColor = '#667eea';
    uploadLabel.style.background = '#f8f9ff';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadLabel.style.borderColor = '#667eea';
    uploadLabel.style.background = '#f8f9ff';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            state.uploadedImage = img;
            state.currentZoom = 100;
            state.imagePosition = { x: 0, y: 0 };
            zoomSlider.value = 100;
            
            // Auto-detect orientation based on image aspect ratio
            detectImageOrientation(img);
            
            showEditor();
            updateCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Detect and suggest orientation based on image dimensions
function detectImageOrientation(img) {
    const imgAspect = img.width / img.height;
    
    if (imgAspect > 1) {
        // Image is wider than tall - suggest landscape
        state.orientation = 'landscape';
        updateOrientationUI();
        showOrientationHint('Landscape orientation detected and applied');
    } else {
        // Image is taller than wide - suggest portrait
        state.orientation = 'portrait';
        updateOrientationUI();
        showOrientationHint('Portrait orientation detected and applied');
    }
}

// Handle orientation change
function handleOrientationChange(orientation) {
    if (state.orientation === orientation) return;
    
    state.orientation = orientation;
    updateOrientationUI();
    resetPosition();
    
    // Clear hint when manually changed
    orientationHint.textContent = '';
}

// Update orientation button states
function updateOrientationUI() {
    if (state.orientation === 'portrait') {
        portraitBtn.classList.add('active');
        landscapeBtn.classList.remove('active');
    } else {
        portraitBtn.classList.remove('active');
        landscapeBtn.classList.add('active');
    }
}

// Show orientation hint with auto-fade
function showOrientationHint(message) {
    orientationHint.textContent = message;
    
    // Auto-fade hint after 3 seconds
    setTimeout(() => {
        orientationHint.textContent = '';
    }, 3000);
}

function showEditor() {
    uploadSection.style.display = 'none';
    editorSection.style.display = 'grid';
    setupCanvas();
    updateCanvas();
}

function uploadNew() {
    uploadSection.style.display = 'flex';
    editorSection.style.display = 'none';
    photoUpload.value = '';
    state.uploadedImage = null;
}

// Frame controls
function handleFrameSizeChange(e) {
    state.frameSize = e.target.value;
    updateCanvas();
}

function setupCanvas() {
    // Fixed display size - keep canvas size constant
    const displaySize = 600;
    
    photoCanvas.width = displaySize;
    photoCanvas.height = displaySize;
    cropOverlay.width = displaySize;
    cropOverlay.height = displaySize;
}

function handleZoomChange(e) {
    state.currentZoom = parseInt(e.target.value);
    zoomValue.textContent = state.currentZoom;
    updateCanvas();
}

function resetPosition() {
    state.imagePosition = { x: 0, y: 0 };
    state.currentZoom = 100;
    zoomSlider.value = 100;
    zoomValue.textContent = 100;
    updateCanvas();
}

// Canvas drawing
function updateCanvas() {
    if (!state.uploadedImage) return;
    
    const canvasWidth = photoCanvas.width;
    const canvasHeight = photoCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Get the crop area dimensions (this represents the actual print area)
    const dimensions = getFrameDimensions(state.frameSize, state.orientation);
    const printAspect = dimensions.width / dimensions.height;
    
    // Calculate crop area in canvas coordinates
    let cropWidth, cropHeight;
    if (printAspect > 1) {
        // Landscape - wider than tall
        cropWidth = canvasWidth;
        cropHeight = canvasWidth / printAspect;
    } else {
        // Portrait - taller than wide
        cropHeight = canvasHeight;
        cropWidth = canvasHeight * printAspect;
    }
    
    // At 100% zoom, fit the entire image within the crop area
    const zoom = state.currentZoom / 100;
    const imgAspect = state.uploadedImage.width / state.uploadedImage.height;
    const cropAspect = cropWidth / cropHeight;
    
    let drawWidth, drawHeight;
    
    // Fit image to be contained within the crop area at 100% zoom
    if (imgAspect > cropAspect) {
        // Image is wider - fit to crop width
        drawWidth = cropWidth * zoom;
        drawHeight = drawWidth / imgAspect;
    } else {
        // Image is taller - fit to crop height
        drawHeight = cropHeight * zoom;
        drawWidth = drawHeight * imgAspect;
    }
    
    // Center the image and apply position offset
    const x = (canvasWidth - drawWidth) / 2 + state.imagePosition.x;
    const y = (canvasHeight - drawHeight) / 2 + state.imagePosition.y;
    
    // Draw image
    ctx.drawImage(state.uploadedImage, x, y, drawWidth, drawHeight);
    
    // Draw crop overlay
    drawCropOverlay();
}

// Draw crop overlay to show print boundaries
function drawCropOverlay() {
    const canvasWidth = cropOverlay.width;
    const canvasHeight = cropOverlay.height;
    
    // Clear overlay
    cropCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Get actual print dimensions
    const dimensions = getFrameDimensions(state.frameSize, state.orientation);
    const printAspect = dimensions.width / dimensions.height;
    
    // Calculate crop area in canvas coordinates
    let cropWidth, cropHeight, cropX, cropY;
    
    if (printAspect > 1) {
        // Landscape - wider than tall
        cropWidth = canvasWidth;
        cropHeight = canvasWidth / printAspect;
        cropX = 0;
        cropY = (canvasHeight - cropHeight) / 2;
    } else {
        // Portrait - taller than wide
        cropHeight = canvasHeight;
        cropWidth = canvasHeight * printAspect;
        cropX = (canvasWidth - cropWidth) / 2;
        cropY = 0;
    }
    
    // Draw semi-transparent overlay on areas that will be cropped
    cropCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    // Top area
    if (cropY > 0) {
        cropCtx.fillRect(0, 0, canvasWidth, cropY);
    }
    
    // Bottom area
    if (cropY + cropHeight < canvasHeight) {
        cropCtx.fillRect(0, cropY + cropHeight, canvasWidth, canvasHeight - (cropY + cropHeight));
    }
    
    // Left area
    if (cropX > 0) {
        cropCtx.fillRect(0, cropY, cropX, cropHeight);
    }
    
    // Right area
    if (cropX + cropWidth < canvasWidth) {
        cropCtx.fillRect(cropX + cropWidth, cropY, canvasWidth - (cropX + cropWidth), cropHeight);
    }
    
    // Draw border around crop area
    cropCtx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
    cropCtx.lineWidth = 2;
    cropCtx.strokeRect(cropX, cropY, cropWidth, cropHeight);
    
    // Add corner markers
    const markerSize = 20;
    cropCtx.strokeStyle = 'rgba(102, 126, 234, 1)';
    cropCtx.lineWidth = 3;
    
    // Top-left
    cropCtx.beginPath();
    cropCtx.moveTo(cropX, cropY + markerSize);
    cropCtx.lineTo(cropX, cropY);
    cropCtx.lineTo(cropX + markerSize, cropY);
    cropCtx.stroke();
    
    // Top-right
    cropCtx.beginPath();
    cropCtx.moveTo(cropX + cropWidth - markerSize, cropY);
    cropCtx.lineTo(cropX + cropWidth, cropY);
    cropCtx.lineTo(cropX + cropWidth, cropY + markerSize);
    cropCtx.stroke();
    
    // Bottom-left
    cropCtx.beginPath();
    cropCtx.moveTo(cropX, cropY + cropHeight - markerSize);
    cropCtx.lineTo(cropX, cropY + cropHeight);
    cropCtx.lineTo(cropX + markerSize, cropY + cropHeight);
    cropCtx.stroke();
    
    // Bottom-right
    cropCtx.beginPath();
    cropCtx.moveTo(cropX + cropWidth - markerSize, cropY + cropHeight);
    cropCtx.lineTo(cropX + cropWidth, cropY + cropHeight);
    cropCtx.lineTo(cropX + cropWidth, cropY + cropHeight - markerSize);
    cropCtx.stroke();
}

// Drag functionality
function startDrag(e) {
    state.isDragging = true;
    state.dragStart = {
        x: e.clientX - state.imagePosition.x,
        y: e.clientY - state.imagePosition.y
    };
    photoCanvas.style.cursor = 'grabbing';
}

function drag(e) {
    if (!state.isDragging) return;
    
    e.preventDefault();
    state.imagePosition = {
        x: e.clientX - state.dragStart.x,
        y: e.clientY - state.dragStart.y
    };
    updateCanvas();
}

function endDrag() {
    state.isDragging = false;
    photoCanvas.style.cursor = 'move';
}

// Touch support
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        state.isDragging = true;
        state.dragStart = {
            x: touch.clientX - state.imagePosition.x,
            y: touch.clientY - state.imagePosition.y
        };
    }
}

function handleTouchMove(e) {
    if (!state.isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    state.imagePosition = {
        x: touch.clientX - state.dragStart.x,
        y: touch.clientY - state.dragStart.y
    };
    updateCanvas();
}

// Download functionality
function downloadFramedImage() {
    if (!state.uploadedImage) return;
    
    // Create a temporary canvas for the final output
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    
    // Get dimensions based on current orientation
    const dimensions = getFrameDimensions(state.frameSize, state.orientation);
    
    // Set canvas to exact print dimensions
    outputCanvas.width = dimensions.width;
    outputCanvas.height = dimensions.height;
    
    // Fill with white background
    outputCtx.fillStyle = 'white';
    outputCtx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Calculate scaling from display canvas to output canvas
    const displaySize = photoCanvas.width; // 600px
    
    // Calculate crop area in display coordinates
    const printAspect = dimensions.width / dimensions.height;
    let cropWidth, cropHeight;
    
    if (printAspect > 1) {
        // Landscape
        cropWidth = displaySize;
        cropHeight = displaySize / printAspect;
    } else {
        // Portrait
        cropHeight = displaySize;
        cropWidth = displaySize * printAspect;
    }
    
    // Calculate image dimensions with zoom (same logic as updateCanvas)
    const zoom = state.currentZoom / 100;
    const imgAspect = state.uploadedImage.width / state.uploadedImage.height;
    const cropAspect = cropWidth / cropHeight;
    
    let drawWidth, drawHeight;
    
    // Fit image to be contained within the crop area at 100% zoom
    if (imgAspect > cropAspect) {
        // Image is wider - fit to crop width
        drawWidth = cropWidth * zoom;
        drawHeight = drawWidth / imgAspect;
    } else {
        // Image is taller - fit to crop height
        drawHeight = cropHeight * zoom;
        drawWidth = drawHeight * imgAspect;
    }
    
    // Center the image and apply position offset (in display coordinates)
    const displayX = (displaySize - drawWidth) / 2 + state.imagePosition.x;
    const displayY = (displaySize - drawHeight) / 2 + state.imagePosition.y;
    
    // Calculate crop area position
    let cropX, cropY;
    if (printAspect > 1) {
        cropX = 0;
        cropY = (displaySize - cropHeight) / 2;
    } else {
        cropX = (displaySize - cropWidth) / 2;
        cropY = 0;
    }
    
    // Calculate which part of the image to draw
    // We need to map from crop area to image coordinates
    const sourceX = (cropX - displayX) * (state.uploadedImage.width / drawWidth);
    const sourceY = (cropY - displayY) * (state.uploadedImage.height / drawHeight);
    const sourceWidth = cropWidth * (state.uploadedImage.width / drawWidth);
    const sourceHeight = cropHeight * (state.uploadedImage.height / drawHeight);
    
    // Draw the cropped portion of the image to fill the output canvas
    outputCtx.drawImage(
        state.uploadedImage,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, dimensions.width, dimensions.height
    );
    
    // Download with orientation in filename
    const fileName = `photo-${state.frameSize}-${state.orientation}-${Date.now()}.png`;
    outputCanvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// Initialize the app
init();
