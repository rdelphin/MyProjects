// API configuration
const API_BASE = 'http://localhost:3000/api';

// Frame size configurations (will be loaded from API)
let FRAME_SIZES = {};

// Mount options (will be loaded from API)
let MOUNT_OPTIONS = {};

// Session management
let sessionId = localStorage.getItem('photoFramerSession');
let isAdmin = false;

// Minimum DPI threshold for print quality
const MIN_DPI = 150;

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
    orientation: 'portrait',
    selectedMount: 'no-mount'
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
const mountSelect = document.getElementById('mountSelect');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const resetPositionBtn = document.getElementById('resetPosition');
const addToCartBtn = document.getElementById('addToCartBtn');
const uploadNewBtn = document.getElementById('uploadNewBtn');
const cartBadge = document.getElementById('cartBadge');
const frame = document.getElementById('frame');
const canvasContainer = document.getElementById('canvasContainer');
const uploadLabel = document.querySelector('.upload-label');
const portraitBtn = document.getElementById('portraitBtn');
const landscapeBtn = document.getElementById('landscapeBtn');
const orientationHint = document.getElementById('orientationHint');
const resolutionWarning = document.getElementById('resolutionWarning');
const warningMessage = document.getElementById('warningMessage');
const closeWarningBtn = document.getElementById('closeWarning');

// Load frames from API
async function loadFrames() {
    try {
        const response = await fetch(`${API_BASE}/frames`);
        const data = await response.json();
        
        if (data.success && data.frames.length > 0) {
            // Build FRAME_SIZES object from API data
            FRAME_SIZES = {};
            data.frames.forEach(frame => {
                FRAME_SIZES[frame.id] = {
                    width: frame.width,
                    height: frame.height,
                    price: frame.price
                };
            });
            
            // Populate frame size dropdown
            populateFrameDropdown(data.frames);
            
            // Set default frame size if current one doesn't exist
            if (!FRAME_SIZES[state.frameSize] && data.frames.length > 0) {
                state.frameSize = data.frames[0].id;
            }
            
            // Update price display
            updatePriceDisplay();
        } else {
            console.error('No frames available from API');
        }
    } catch (error) {
        console.error('Error loading frames:', error);
        // Fallback to hardcoded frames if API fails
        useFallbackFrames();
    }
}

// Fallback frames if API is unavailable
function useFallbackFrames() {
    FRAME_SIZES = {
        '4x6': { width: 1200, height: 1800, price: 15.99 },
        '5x7': { width: 1500, height: 2100, price: 22.99 },
        '8x10': { width: 2400, height: 3000, price: 29.99 },
        '11x14': { width: 3300, height: 4200, price: 39.99 },
        '16x20': { width: 4800, height: 6000, price: 54.99 },
        '18x24': { width: 5400, height: 7200, price: 69.99 }
    };
    
    populateFrameDropdown(
        Object.entries(FRAME_SIZES).map(([id, data]) => ({
            id,
            size: id,
            width: data.width,
            height: data.height,
            price: data.price,
            available: true
        }))
    );
    
    updatePriceDisplay();
}

// Populate frame size dropdown
function populateFrameDropdown(frames) {
    frameSizeSelect.innerHTML = frames.map(frame => 
        `<option value="${frame.id}">${frame.size}" - $${frame.price.toFixed(2)}</option>`
    ).join('');
    
    // Set selected value
    if (frames.find(f => f.id === state.frameSize)) {
        frameSizeSelect.value = state.frameSize;
    }
}

// Update price display
function updatePriceDisplay() {
    const framePriceDisplay = document.getElementById('framePriceDisplay');
    const mountPriceDisplay = document.getElementById('mountPriceDisplay');
    const totalPriceDisplay = document.getElementById('totalPriceDisplay');
    
    if (FRAME_SIZES[state.frameSize] && MOUNT_OPTIONS[state.selectedMount]) {
        const framePrice = FRAME_SIZES[state.frameSize].price;
        const mountPrice = MOUNT_OPTIONS[state.selectedMount].price;
        const totalPrice = framePrice + mountPrice;
        
        if (framePriceDisplay) framePriceDisplay.textContent = `$${framePrice.toFixed(2)}`;
        if (mountPriceDisplay) mountPriceDisplay.textContent = `$${mountPrice.toFixed(2)}`;
        if (totalPriceDisplay) totalPriceDisplay.textContent = `$${totalPrice.toFixed(2)}`;
    }
}

// Check user session and permissions
async function checkUserSession() {
    try {
        const headers = {};
        if (sessionId) {
            headers['x-session-id'] = sessionId;
        }
        
        const response = await fetch(`${API_BASE}/auth/session`, { headers });
        const data = await response.json();
        
        if (data.success) {
            isAdmin = data.isAdmin || false;
            updateDownloadButtonState();
        }
    } catch (error) {
        console.error('Error checking session:', error);
        isAdmin = false;
        updateDownloadButtonState();
    }
}

// Update download button based on user permissions
function updateDownloadButtonState() {
    if (!isAdmin) {
        downloadBtn.title = 'Only administrators can download high-resolution images';
        downloadBtn.style.opacity = '0.6';
        downloadBtn.style.cursor = 'not-allowed';
    } else {
        downloadBtn.title = 'Download high-resolution image';
        downloadBtn.style.opacity = '1';
        downloadBtn.style.cursor = 'pointer';
    }
}

// Load mounts from API
async function loadMounts() {
    try {
        const response = await fetch(`${API_BASE}/mounts`);
        const data = await response.json();
        
        if (data.success && data.mounts.length > 0) {
            // Build MOUNT_OPTIONS object from API data
            MOUNT_OPTIONS = {};
            data.mounts.forEach(mount => {
                MOUNT_OPTIONS[mount.id] = {
                    name: mount.name,
                    description: mount.description,
                    price: mount.price
                };
            });
            
            // Populate mount dropdown
            populateMountDropdown(data.mounts);
            
            // Set default mount if current one doesn't exist
            if (!MOUNT_OPTIONS[state.selectedMount] && data.mounts.length > 0) {
                state.selectedMount = data.mounts[0].id;
            }
            
            // Update price display
            updatePriceDisplay();
        } else {
            console.error('No mounts available from API');
        }
    } catch (error) {
        console.error('Error loading mounts:', error);
        // Fallback to default mount
        useFallbackMounts();
    }
}

// Fallback mounts if API is unavailable
function useFallbackMounts() {
    MOUNT_OPTIONS = {
        'no-mount': { name: 'No Mount', description: 'Standard frame without mount', price: 0.00 }
    };
    
    populateMountDropdown([
        { id: 'no-mount', name: 'No Mount', description: 'Standard frame without mount', price: 0.00, available: true }
    ]);
    
    updatePriceDisplay();
}

// Populate mount dropdown
function populateMountDropdown(mounts) {
    mountSelect.innerHTML = mounts.map(mount => {
        const priceText = mount.price > 0 ? ` (+$${mount.price.toFixed(2)})` : '';
        return `<option value="${mount.id}">${mount.name}${priceText}</option>`;
    }).join('');
    
    // Set selected value
    if (mounts.find(m => m.id === state.selectedMount)) {
        mountSelect.value = state.selectedMount;
    }
}

// Handle mount selection change
function handleMountChange(e) {
    state.selectedMount = e.target.value;
    updatePriceDisplay();
}

// Initialize event listeners
function init() {
    // Check user session
    checkUserSession();
    
    // Load frames and mounts from API
    loadFrames();
    loadMounts();
    
    // File upload
    photoUpload.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadLabel.addEventListener('dragover', handleDragOver);
    uploadLabel.addEventListener('dragleave', handleDragLeave);
    uploadLabel.addEventListener('drop', handleDrop);
    
    // Controls
    frameSizeSelect.addEventListener('change', handleFrameSizeChange);
    mountSelect.addEventListener('change', handleMountChange);
    zoomSlider.addEventListener('input', handleZoomChange);
    resetPositionBtn.addEventListener('click', resetPosition);
    
    // Add to cart button - make sure it exists before adding listener
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    } else {
        console.error('Add to Cart button not found');
    }
    
    uploadNewBtn.addEventListener('click', uploadNew);
    
    // Update cart badge on load
    updateCartBadge();
    
    // Orientation controls
    portraitBtn.addEventListener('click', () => handleOrientationChange('portrait'));
    landscapeBtn.addEventListener('click', () => handleOrientationChange('landscape'));
    
    // Warning close button
    closeWarningBtn.addEventListener('click', hideResolutionWarning);
    
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

// DPI Calculation and Resolution Check Functions
function calculateEffectiveDPI(imageWidth, imageHeight, frameSize, orientation) {
    const dimensions = getFrameDimensions(frameSize, orientation);
    
    // Calculate physical dimensions in inches
    const frameSizeParts = frameSize.split('x');
    const physicalWidth = orientation === 'portrait' ? 
        parseInt(frameSizeParts[0]) : parseInt(frameSizeParts[1]);
    const physicalHeight = orientation === 'portrait' ? 
        parseInt(frameSizeParts[1]) : parseInt(frameSizeParts[0]);
    
    // Calculate DPI for both dimensions
    const dpiWidth = imageWidth / physicalWidth;
    const dpiHeight = imageHeight / physicalHeight;
    
    // Return the minimum DPI (worst case)
    return Math.min(dpiWidth, dpiHeight);
}

function checkResolution() {
    if (!state.uploadedImage) return;
    
    const img = state.uploadedImage;
    const effectiveDPI = calculateEffectiveDPI(
        img.width, 
        img.height, 
        state.frameSize, 
        state.orientation
    );
    
    if (effectiveDPI < MIN_DPI) {
        showResolutionWarning(effectiveDPI);
    } else {
        hideResolutionWarning();
    }
}

function showResolutionWarning(currentDPI) {
    const img = state.uploadedImage;
    const dimensions = getFrameDimensions(state.frameSize, state.orientation);
    
    // Calculate recommended minimum resolution
    const frameSizeParts = state.frameSize.split('x');
    const physicalWidth = state.orientation === 'portrait' ? 
        parseInt(frameSizeParts[0]) : parseInt(frameSizeParts[1]);
    const physicalHeight = state.orientation === 'portrait' ? 
        parseInt(frameSizeParts[1]) : parseInt(frameSizeParts[0]);
    
    const recommendedWidth = physicalWidth * MIN_DPI;
    const recommendedHeight = physicalHeight * MIN_DPI;
    
    // Find suggested smaller frame sizes
    const suggestedSizes = findSuitableFrameSizes(img.width, img.height, state.orientation);
    
    let message = `Your image resolution is ${Math.round(currentDPI)} DPI, which is below the recommended ${MIN_DPI} DPI for print quality. `;
    message += `This may result in a pixelated or blurry print for the selected ${state.frameSize}" ${state.orientation} frame.<br><br>`;
    message += `<strong>Current image:</strong> ${img.width} × ${img.height} pixels<br>`;
    message += `<strong>Recommended for ${state.frameSize}":</strong> ${recommendedWidth} × ${recommendedHeight} pixels (${MIN_DPI} DPI)<br><br>`;
    
    if (suggestedSizes.length > 0) {
        message += `<strong>Suggestions:</strong><br>`;
        message += `• Upload a higher-resolution image (at least ${recommendedWidth} × ${recommendedHeight} pixels)<br>`;
        message += `• Choose a smaller frame size: ${suggestedSizes.join(', ')}`;
    } else {
        message += `<strong>Suggestion:</strong> Upload a higher-resolution image (at least ${recommendedWidth} × ${recommendedHeight} pixels)`;
    }
    
    warningMessage.innerHTML = message;
    resolutionWarning.style.display = 'flex';
}

function hideResolutionWarning() {
    resolutionWarning.style.display = 'none';
}

function findSuitableFrameSizes(imageWidth, imageHeight, orientation) {
    const suitableSizes = [];
    
    for (const [size, dimensions] of Object.entries(FRAME_SIZES)) {
        const frameDims = getFrameDimensions(size, orientation);
        const dpi = calculateEffectiveDPI(imageWidth, imageHeight, size, orientation);
        
        if (dpi >= MIN_DPI) {
            suitableSizes.push(`${size}"`);
        }
    }
    
    return suitableSizes;
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
            
            // Check resolution after image is loaded
            checkResolution();
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
    
    // Check resolution when orientation changes
    checkResolution();
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
    
    // Update price display
    updatePriceDisplay();
    
    // Check resolution when frame size changes
    checkResolution();
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
async function downloadFramedImage() {
    if (!state.uploadedImage) return;
    
    // Check if user has permission to download
    if (!isAdmin) {
        const shouldLogin = confirm('Only administrators can download high-resolution images.\n\nWould you like to login as admin?');
        if (shouldLogin) {
            showLoginPrompt();
        }
        return;
    }
    
    // Verify with backend
    try {
        const headers = {};
        if (sessionId) {
            headers['x-session-id'] = sessionId;
        }
        
        const response = await fetch(`${API_BASE}/download/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });
        
        const data = await response.json();
        
        if (!data.success || !data.canDownload) {
            alert(data.message || 'You do not have permission to download high-resolution images.');
            return;
        }
    } catch (error) {
        console.error('Error verifying download permission:', error);
        alert('Error verifying download permission. Please try again.');
        return;
    }
    
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

// Login prompt for admin access
function showLoginPrompt() {
    const username = prompt('Enter admin username:');
    if (!username) return;
    
    const password = prompt('Enter admin password:');
    if (!password) return;
    
    loginAsAdmin(username, password);
}

// Login as admin
async function loginAsAdmin(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.sessionId) {
            sessionId = data.sessionId;
            isAdmin = data.isAdmin;
            localStorage.setItem('photoFramerSession', sessionId);
            updateDownloadButtonState();
            alert('Successfully logged in as admin!');
        } else {
            alert('Login failed: ' + (data.error || 'Invalid credentials'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Cart Management Functions
function getCart() {
    const cart = localStorage.getItem('photoFramerCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('photoFramerCart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getCart();
    if (cartBadge) {
        cartBadge.textContent = cart.length;
        cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function addToCart(e) {
    console.log('Add to cart clicked'); // Debug log
    
    if (!state.uploadedImage) {
        alert('Please upload an image first');
        return;
    }
    
    // Generate preview image as data URL
    const previewCanvas = document.createElement('canvas');
    const previewCtx = previewCanvas.getContext('2d');
    previewCanvas.width = 200;
    previewCanvas.height = 200;
    
    // Draw scaled preview
    const dimensions = getFrameDimensions(state.frameSize, state.orientation);
    const aspect = dimensions.width / dimensions.height;
    
    let previewWidth, previewHeight;
    if (aspect > 1) {
        previewWidth = 200;
        previewHeight = 200 / aspect;
    } else {
        previewHeight = 200;
        previewWidth = 200 * aspect;
    }
    
    const offsetX = (200 - previewWidth) / 2;
    const offsetY = (200 - previewHeight) / 2;
    
    previewCtx.fillStyle = 'white';
    previewCtx.fillRect(0, 0, 200, 200);
    previewCtx.drawImage(state.uploadedImage, offsetX, offsetY, previewWidth, previewHeight);
    
    const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.7);
    
    // Create cart item
    const cartItem = {
        id: Date.now(),
        frameSize: state.frameSize,
        frameSizeName: FRAME_SIZES[state.frameSize] ? state.frameSize : '8x10',
        framePrice: FRAME_SIZES[state.frameSize] ? FRAME_SIZES[state.frameSize].price : 0,
        mountId: state.selectedMount,
        mountName: MOUNT_OPTIONS[state.selectedMount] ? MOUNT_OPTIONS[state.selectedMount].name : 'No Mount',
        mountPrice: MOUNT_OPTIONS[state.selectedMount] ? MOUNT_OPTIONS[state.selectedMount].price : 0,
        orientation: state.orientation,
        zoom: state.currentZoom,
        position: { ...state.imagePosition },
        imageData: state.uploadedImage.src,
        previewImage: previewDataUrl,
        totalPrice: (FRAME_SIZES[state.frameSize] ? FRAME_SIZES[state.frameSize].price : 0) + 
                   (MOUNT_OPTIONS[state.selectedMount] ? MOUNT_OPTIONS[state.selectedMount].price : 0),
        addedAt: new Date().toISOString()
    };
    
    // Add to cart
    const cart = getCart();
    cart.push(cartItem);
    saveCart(cart);
    
    // Show success message with simpler flow
    const message = `✅ Item added to cart!\n\nCart now has ${cart.length} item(s).\n\nYou can:\n- Upload a new photo to add more items\n- Click the cart icon to view your cart`;
    alert(message);
    
    // No automatic redirect - let user continue shopping
}

// Make addToCart globally accessible for onclick handler
window.handleAddToCart = addToCart;

// Initialize the app
init();
