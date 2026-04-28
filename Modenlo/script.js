// API configuration
// API Configuration - works on localhost, mobile devices, and production
// Check if API_BASE is already defined by landing-script.js
if (typeof API_BASE === 'undefined') {
    //var API_BASE = `${window.location.origin}/api`;
    var API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://api.modenlo.com/api";
}

// Frame size configurations (will be loaded from API)
let FRAME_SIZES = {};

// Mount options (will be loaded from API)
let MOUNT_OPTIONS = {};

// Session management
let sessionId = localStorage.getItem('modenloSession');
let isAdmin = false;

// Minimum DPI threshold for print quality
const MIN_DPI = 300;

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
    orientation: getDisplayType() === 'mousepad' ? 'landscape' : 'portrait',
    selectedMount: 'no-mount',
    selectedClockHands: null,
    selectedFrameOption: null,
    currentClockData: null
};

// DOM elements
const photoUpload = document.getElementById('photoUpload');
const uploadArea = document.getElementById('uploadArea');
const previewArea = document.getElementById('previewArea');
const photoCanvas = document.getElementById('photoCanvas');
const ctx = photoCanvas.getContext('2d');
const cropOverlay = document.getElementById('cropOverlay');
const cropCtx = cropOverlay.getContext('2d');
const frameSizeSelect = document.getElementById('frameSize');
const orientationSelect = document.getElementById('orientationSelect');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const resetPositionBtn = document.getElementById('resetPosition');
const addToCartBtn = document.getElementById('addToCartBtn');
const uploadNewBtn = document.getElementById('uploadNewBtn');
const changeImageBtn = document.getElementById('changeImageBtn');
const cartBadge = document.getElementById('cartBadge');
const cartCount = document.getElementById('cartCount');
const uploadDropzone = document.querySelector('.upload-dropzone');
const totalPriceMain = document.getElementById('totalPriceMain');
const totalCentsMain = document.getElementById('totalCentsMain');
const resolutionWarning = document.getElementById('resolutionWarning');
const warningMessage = document.getElementById('warningMessage');
const closeWarningBtn = document.getElementById('closeWarning');

// Get display type from URL parameter
function getDisplayType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type'); // Returns 'wall', 'tabletop', 'clock', or null
}

// Check if current product is a clock
function isClock() {
    return getDisplayType() === 'clock';
}

// Load clocks from API (for clock product type)
async function loadClocks() {
    try {
        const response = await fetch(`${API_BASE}/clocks`);
        const data = await response.json();
        
        if (data.success && data.clocks.length > 0) {
            const availableClocks = data.clocks.filter(clock => clock.available);
            
            // Build FRAME_SIZES object from clock data (using diameter as "size")
            FRAME_SIZES = {};
            availableClocks.forEach(clock => {
                const size = clock.diameter.toString();
                // For circular clocks, width and height are the same (diameter)
                const diameter = clock.diameter * 300; // Convert inches to pixels (assuming 300 DPI)
                FRAME_SIZES[size] = {
                    width: diameter,
                    height: diameter,
                    price: clock.price,
                    clockData: clock // Store the full clock object
                };
            });
            
            // Populate size dropdown
            frameSizeSelect.innerHTML = availableClocks.map(clock => 
                `<option value="${clock.diameter}">${clock.diameter}" Diameter - $${clock.price.toFixed(2)}</option>`
            ).join('');
            
            // Set default if needed
            if (availableClocks.length > 0 && !FRAME_SIZES[state.frameSize]) {
                state.frameSize = availableClocks[0].diameter.toString();
                frameSizeSelect.value = state.frameSize;
                state.currentClockData = availableClocks[0];
            } else if (FRAME_SIZES[state.frameSize]) {
                state.currentClockData = FRAME_SIZES[state.frameSize].clockData;
            }
            
            // Load clock hands and frame options for the selected clock
            if (state.currentClockData) {
                loadClockHands(state.currentClockData);
                loadClockFrameOptions(state.currentClockData);
            }
            
            // Update price display
            updatePriceDisplay();
        } else {
            console.error('No clocks available from API');
        }
    } catch (error) {
        console.error('Error loading clocks:', error);
    }
}

// Load clock hands options
function loadClockHands(clockData) {
    if (!clockData || !clockData.hands || clockData.hands.length === 0) return;
    
    const handsGrid = document.getElementById('handsGrid');
    if (!handsGrid) return;
    
    // Set default if not set
    if (!state.selectedClockHands && clockData.hands.length > 0) {
        state.selectedClockHands = clockData.hands[0].id;
    }
    
    // Populate clock hands grid
    handsGrid.innerHTML = clockData.hands.map(hands => {
        const isSelected = hands.id === state.selectedClockHands;
        
        // Determine icon based on hands type
        let icon = '🕐';
        if (hands.id.toLowerCase().includes('modern')) icon = '⚡';
        else if (hands.id.toLowerCase().includes('vintage')) icon = '🕰️';
        
        // Image content
        let imageContent;
        if (hands.thumbnail) {
            imageContent = `<img src="${hands.thumbnail}" alt="${hands.name}">`;
        } else {
            imageContent = `<span class="mount-card-image-placeholder">${icon}</span>`;
        }
        
        return `
            <div class="mount-card ${isSelected ? 'selected' : ''}" data-hands-id="${hands.id}">
                <div class="mount-card-image">
                    ${imageContent}
                    <div class="mount-card-label">
                        ${hands.name.toUpperCase()}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </div>
                </div>
                <div class="mount-card-name">${hands.name}</div>
            </div>
        `;
    }).join('');
    
    // Add click event listeners
    handsGrid.querySelectorAll('.mount-card').forEach(card => {
        card.addEventListener('click', handleClockHandsSelection);
    });
    
    // Update header
    updateClockHandsHeader(clockData);
}

// Load clock frame options
function loadClockFrameOptions(clockData) {
    if (!clockData || !clockData.frames || clockData.frames.length === 0) return;
    
    const frameOptionsGrid = document.getElementById('frameOptionsGrid');
    if (!frameOptionsGrid) return;
    
    // Set default if not set
    if (!state.selectedFrameOption && clockData.frames.length > 0) {
        state.selectedFrameOption = clockData.frames[0].id;
    }
    
    // Populate frame options grid
    frameOptionsGrid.innerHTML = clockData.frames.map(frame => {
        const isSelected = frame.id === state.selectedFrameOption;
        
        // Determine icon based on frame type
        let icon = '🖼️';
        if (frame.id.toLowerCase().includes('wooden')) icon = '🌲';
        else if (frame.id.toLowerCase().includes('metal')) icon = '⚙️';
        else if (frame.id.toLowerCase().includes('plastic')) icon = '🔲';
        
        // Image content
        let imageContent;
        if (frame.thumbnail) {
            imageContent = `<img src="${frame.thumbnail}" alt="${frame.name}">`;
        } else {
            imageContent = `<span class="mount-card-image-placeholder">${icon}</span>`;
        }
        
        return `
            <div class="mount-card ${isSelected ? 'selected' : ''}" data-frame-id="${frame.id}">
                <div class="mount-card-image">
                    ${imageContent}
                    <div class="mount-card-label">
                        ${frame.name.toUpperCase()}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </div>
                </div>
                <div class="mount-card-name">${frame.name}</div>
            </div>
        `;
    }).join('');
    
    // Add click event listeners
    frameOptionsGrid.querySelectorAll('.mount-card').forEach(card => {
        card.addEventListener('click', handleFrameOptionSelection);
    });
    
    // Update header
    updateFrameOptionHeader(clockData);
}

// Handle clock hands selection
function handleClockHandsSelection(e) {
    const handsCard = e.currentTarget;
    const handsId = handsCard.dataset.handsId;
    
    // Update state
    state.selectedClockHands = handsId;
    
    // Update UI
    document.querySelectorAll('#handsGrid .mount-card').forEach(card => {
        card.classList.remove('selected');
    });
    handsCard.classList.add('selected');
    
    // Update price display and header
    updatePriceDisplay();
    updateClockHandsHeader(state.currentClockData);
}

// Handle frame option selection
function handleFrameOptionSelection(e) {
    const frameCard = e.currentTarget;
    const frameId = frameCard.dataset.frameId;
    
    // Update state
    state.selectedFrameOption = frameId;
    
    // Update UI
    document.querySelectorAll('#frameOptionsGrid .mount-card').forEach(card => {
        card.classList.remove('selected');
    });
    frameCard.classList.add('selected');
    
    // Update price display and header
    updatePriceDisplay();
    updateFrameOptionHeader(state.currentClockData);
}

// Update clock hands header
function updateClockHandsHeader(clockData) {
    const handsSelectedName = document.getElementById('handsSelectedName');
    const handsSelectedPrice = document.getElementById('handsSelectedPrice');
    
    if (!clockData || !clockData.hands) return;
    
    const selectedHands = clockData.hands.find(h => h.id === state.selectedClockHands);
    if (selectedHands) {
        if (handsSelectedName) {
            handsSelectedName.textContent = selectedHands.name;
        }
        
        if (handsSelectedPrice) {
            if (selectedHands.price > 0) {
                handsSelectedPrice.textContent = `+$${selectedHands.price.toFixed(2)}`;
            } else {
                handsSelectedPrice.textContent = '';
            }
        }
    }
}

// Update frame option header
function updateFrameOptionHeader(clockData) {
    const frameOptionSelectedName = document.getElementById('frameOptionSelectedName');
    const frameOptionSelectedPrice = document.getElementById('frameOptionSelectedPrice');
    
    if (!clockData || !clockData.frames) return;
    
    const selectedFrame = clockData.frames.find(f => f.id === state.selectedFrameOption);
    if (selectedFrame) {
        if (frameOptionSelectedName) {
            frameOptionSelectedName.textContent = selectedFrame.name;
        }
        
        if (frameOptionSelectedPrice) {
            if (selectedFrame.price > 0) {
                frameOptionSelectedPrice.textContent = `+$${selectedFrame.price.toFixed(2)}`;
            } else {
                frameOptionSelectedPrice.textContent = '';
            }
        }
    }
}

// Load frames from API
async function loadFrames() {
    try {
        const response = await fetch(`${API_BASE}/frames`);
        const data = await response.json();
        
        if (data.success && data.frames.length > 0) {
            // Get display type from URL parameter
            const displayType = getDisplayType();
            
            // Filter frames based on display type
            let framesToShow = data.frames;
            if (displayType === 'tabletop') {
                // Tabletop: limit to 11×14 and smaller
                framesToShow = data.frames.filter(frame => {
                    const parts = frame.id.split('x');
                    const width = parseInt(parts[0]);
                    const height = parseInt(parts[1]);
                    return width <= 11 && height <= 14;
                });
            } else if (displayType === 'mousepad') {
                // Mouse Pad: only 30" and above sizes
                framesToShow = data.frames.filter(frame => {
                    const sizeNum = parseInt(frame.size);
                    return sizeNum >= 30;
                });
            }
            
            // Build FRAME_SIZES object from API data
            FRAME_SIZES = {};
            framesToShow.forEach(frame => {
                FRAME_SIZES[frame.id] = {
                    width: frame.width,
                    height: frame.height,
                    price: frame.price
                };
            });
            
            // Populate frame size dropdown
            populateFrameDropdown(framesToShow);
            
            // Set default frame size if current one doesn't exist
            if (!FRAME_SIZES[state.frameSize] && framesToShow.length > 0) {
                state.frameSize = framesToShow[0].id;
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
    let totalPrice = 0;
    
    // Add frame/clock base price
    if (FRAME_SIZES[state.frameSize]) {
        totalPrice += FRAME_SIZES[state.frameSize].price;
    }
    
    // For clocks: add clock hands and frame option prices
    if (isClock() && state.currentClockData) {
        // Add clock hands price
        if (state.selectedClockHands && state.currentClockData.hands) {
            const selectedHands = state.currentClockData.hands.find(h => h.id === state.selectedClockHands);
            if (selectedHands) {
                totalPrice += selectedHands.price;
            }
        }
        
        // Add frame option price
        if (state.selectedFrameOption && state.currentClockData.frames) {
            const selectedFrame = state.currentClockData.frames.find(f => f.id === state.selectedFrameOption);
            if (selectedFrame) {
                totalPrice += selectedFrame.price;
            }
        }
    } else {
        // For regular frames: add mount price
        if (MOUNT_OPTIONS[state.selectedMount]) {
            totalPrice += MOUNT_OPTIONS[state.selectedMount].price;
        }
    }
    
    // Update main price display
    if (totalPriceMain && totalCentsMain) {
        const dollars = Math.floor(totalPrice);
        const cents = Math.round((totalPrice - dollars) * 100);
        totalPriceMain.textContent = dollars;
        totalCentsMain.textContent = cents.toString().padStart(2, '0');
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
    // Download button is not present on this page, skip
    return;
}

// Load mounts from API
async function loadMounts() {
    try {
        const response = await fetch(`${API_BASE}/mounts`);
        const data = await response.json();
        
        if (data.success && data.mounts.length > 0) {
            // Get display type from URL parameter
            const displayType = getDisplayType();
            
            // Filter mounts based on display type
            let mountsToShow = data.mounts;
            
            if (displayType === 'tabletop') {
                // Tabletop: Only show No Mount, Easel, Bamboo
                const tabletopMountIds = ['no-mount', 'easel', 'bamboo'];
                mountsToShow = data.mounts.filter(mount => 
                    tabletopMountIds.includes(mount.id.toLowerCase())
                );
            } else if (displayType === 'wall') {
                // Wall: Exclude Easel and Bamboo (tabletop-only mounts)
                const excludedMountIds = ['easel', 'bamboo'];
                mountsToShow = data.mounts.filter(mount => 
                    !excludedMountIds.includes(mount.id.toLowerCase())
                );
            } else if (displayType === 'mousepad') {
                // Mouse Pad: Only show No Mount
                mountsToShow = data.mounts.filter(mount => 
                    mount.id.toLowerCase() === 'no-mount'
                );
            }
            // If displayType is null (direct access to framer), show all mounts
            
            // Build MOUNT_OPTIONS object from filtered mounts
            MOUNT_OPTIONS = {};
            mountsToShow.forEach(mount => {
                MOUNT_OPTIONS[mount.id] = {
                    name: mount.name,
                    description: mount.description,
                    price: mount.price
                };
            });
            
            // Populate mount grid
            populateMountGrid(mountsToShow);
            
            // Set default mount if current one doesn't exist
            if (!MOUNT_OPTIONS[state.selectedMount] && mountsToShow.length > 0) {
                state.selectedMount = mountsToShow[0].id;
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
    
    populateMountGrid([
        { id: 'no-mount', name: 'No Mount', description: 'Standard frame without mount', price: 0.00, available: true }
    ]);
    
    updatePriceDisplay();
}

// Populate mount grid - image-focused card design
function populateMountGrid(mounts) {
    const mountGrid = document.getElementById('mountGrid');
    
    mountGrid.innerHTML = mounts.map(mount => {
        const isSelected = mount.id === state.selectedMount;
        
        // Determine icon based on mount type (fallback if no thumbnail)
        let icon = '🖼️';
        if (mount.id.includes('aluminium')) icon = '⚙️';
        else if (mount.id.includes('wood')) icon = '🌲';
        else if (mount.id.includes('acrylic')) icon = '💎';
        else if (mount.id === 'no-mount') icon = '⊗';
        
        // Image content - use thumbnail if available, otherwise use placeholder icon
        let imageContent;
        if (mount.thumbnail) {
            imageContent = `<img src="${mount.thumbnail}" alt="${mount.name}">`;
        } else {
            imageContent = `<span class="mount-card-image-placeholder">${icon}</span>`;
        }
        
        return `
            <div class="mount-card ${isSelected ? 'selected' : ''}" data-mount-id="${mount.id}">
                <div class="mount-card-image">
                    ${imageContent}
                    <div class="mount-card-label">
                        ${mount.name.toUpperCase()}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </div>
                </div>
                <div class="mount-card-name">${mount.name}</div>
            </div>
        `;
    }).join('');
    
    // Add click event listeners to all mount cards
    mountGrid.querySelectorAll('.mount-card').forEach(card => {
        card.addEventListener('click', handleMountSelection);
    });
    
    // Update mount header
    updateMountHeader();
}

// Handle mount selection
function handleMountSelection(e) {
    const mountCard = e.currentTarget;
    const mountId = mountCard.dataset.mountId;
    
    // Update state
    state.selectedMount = mountId;
    
    // Update UI - remove selected class from all and add to clicked
    document.querySelectorAll('.mount-card').forEach(card => {
        card.classList.remove('selected');
    });
    mountCard.classList.add('selected');
    
    // Update price display and mount header
    updatePriceDisplay();
    updateMountHeader();
}

// Update mount header with selected mount info
function updateMountHeader() {
    const mountSelectedName = document.getElementById('mountSelectedName');
    const mountSelectedPrice = document.getElementById('mountSelectedPrice');
    
    if (MOUNT_OPTIONS[state.selectedMount]) {
        const mount = MOUNT_OPTIONS[state.selectedMount];
        
        if (mountSelectedName) {
            mountSelectedName.textContent = mount.name;
        }
        
        if (mountSelectedPrice) {
            if (mount.price > 0) {
                mountSelectedPrice.textContent = `+$${mount.price.toFixed(2)}`;
            } else {
                mountSelectedPrice.textContent = '';
            }
        }
    }
}

// Toggle section visibility based on product type
function toggleSectionVisibility() {
    const mountSection = document.getElementById('mountSection');
    const clockHandsSection = document.getElementById('clockHandsSection');
    const frameOptionsSection = document.getElementById('frameOptionsSection');
    
    if (isClock()) {
        // Hide mount section, show clock sections
        if (mountSection) mountSection.style.display = 'none';
        if (clockHandsSection) clockHandsSection.style.display = 'block';
        if (frameOptionsSection) frameOptionsSection.style.display = 'block';
    } else {
        // Show mount section, hide clock sections
        if (mountSection) mountSection.style.display = 'block';
        if (clockHandsSection) clockHandsSection.style.display = 'none';
        if (frameOptionsSection) frameOptionsSection.style.display = 'none';
    }
}

// Initialize event listeners
function init() {
    // Check user session
    checkUserSession();
    
    // Toggle section visibility based on product type
    toggleSectionVisibility();
    
    // Initialize MOUNT_OPTIONS with default for all cases
    MOUNT_OPTIONS = {
        'no-mount': { name: 'No Mount', description: 'Standard frame without mount', price: 0.00 }
    };
    
    // Set default orientation for mouse pads BEFORE loading frames
    const displayType = getDisplayType();
    if (displayType === 'mousepad') {
        state.orientation = 'landscape';
        if (orientationSelect) {
            orientationSelect.value = 'landscape';
            orientationSelect.disabled = true;
            orientationSelect.style.opacity = '0.6';
            orientationSelect.style.cursor = 'not-allowed';
        }
    }
    
    // Load frames/clocks and mounts from API based on product type
    if (isClock()) {
        loadClocks();
        // Disable orientation for clocks since they're always circular
        if (orientationSelect) {
            orientationSelect.disabled = true;
            orientationSelect.style.display = 'none';
            // Also hide the label
            const orientationLabel = orientationSelect.previousElementSibling;
            if (orientationLabel && orientationLabel.classList.contains('form-label')) {
                orientationLabel.style.display = 'none';
            }
        }
    } else {
        loadFrames();
        loadMounts();
    }
    
    // File upload
    photoUpload.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    if (uploadDropzone) {
        uploadDropzone.addEventListener('dragover', handleDragOver);
        uploadDropzone.addEventListener('dragleave', handleDragLeave);
        uploadDropzone.addEventListener('drop', handleDrop);
    }
    
    // Controls
    frameSizeSelect.addEventListener('change', handleFrameSizeChange);
    if (orientationSelect) {
        orientationSelect.addEventListener('change', handleOrientationSelectChange);
    }
    zoomSlider.addEventListener('input', handleZoomChange);
    resetPositionBtn.addEventListener('click', resetPosition);
    
    // Add to cart button
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
        // Disable initially until image is uploaded
        addToCartBtn.disabled = true;
    }
    
    // Upload new and change image buttons
    if (uploadNewBtn) {
        uploadNewBtn.addEventListener('click', uploadNew);
    }
    if (changeImageBtn) {
        changeImageBtn.addEventListener('click', uploadNew);
    }
    
    // Update cart badge on load
    updateCartBadge();
    
    // Warning close button
    if (closeWarningBtn) {
        closeWarningBtn.addEventListener('click', hideResolutionWarning);
    }
    
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

// Handle orientation select change
function handleOrientationSelectChange(e) {
    state.orientation = e.target.value;
    if (state.uploadedImage) {
        updateCanvas();
        checkResolution();
    }
}

// DPI Calculation and Resolution Check Functions
function calculateEffectiveDPI(imageWidth, imageHeight, frameSize, orientation) {
    const dimensions = getFrameDimensions(frameSize, orientation);
    
    let physicalWidth, physicalHeight;
    
    // For clocks (circular), use diameter for both dimensions
    if (isClock()) {
        const diameter = parseFloat(frameSize);
        physicalWidth = diameter;
        physicalHeight = diameter;
    } else {
        // For regular frames, split by 'x'
        const frameSizeParts = frameSize.split('x');
        physicalWidth = orientation === 'portrait' ? 
            parseInt(frameSizeParts[0]) : parseInt(frameSizeParts[1]);
        physicalHeight = orientation === 'portrait' ? 
            parseInt(frameSizeParts[1]) : parseInt(frameSizeParts[0]);
    }
    
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
    
    let physicalWidth, physicalHeight;
    let sizeLabel;
    
    // For clocks (circular), use diameter
    if (isClock()) {
        const diameter = parseFloat(state.frameSize);
        physicalWidth = diameter;
        physicalHeight = diameter;
        sizeLabel = `${state.frameSize}" diameter clock`;
    } else {
        // For regular frames, split by 'x'
        const frameSizeParts = state.frameSize.split('x');
        physicalWidth = state.orientation === 'portrait' ? 
            parseInt(frameSizeParts[0]) : parseInt(frameSizeParts[1]);
        physicalHeight = state.orientation === 'portrait' ? 
            parseInt(frameSizeParts[1]) : parseInt(frameSizeParts[0]);
        sizeLabel = `${state.frameSize}" ${state.orientation} frame`;
    }
    
    const recommendedWidth = physicalWidth * MIN_DPI;
    const recommendedHeight = physicalHeight * MIN_DPI;
    
    // Find suggested smaller frame sizes
    const suggestedSizes = findSuitableFrameSizes(img.width, img.height, state.orientation);
    
    let message = `Your image resolution is ${Math.round(currentDPI)} DPI, which is below the recommended ${MIN_DPI} DPI for print quality. `;
    message += `This may result in a pixelated or blurry print for the selected ${sizeLabel}.<br><br>`;
    message += `<strong>Current image:</strong> ${img.width} × ${img.height} pixels<br>`;
    message += `<strong>Recommended for ${state.frameSize}":</strong> ${Math.round(recommendedWidth)} × ${Math.round(recommendedHeight)} pixels (${MIN_DPI} DPI)<br><br>`;
    
    if (suggestedSizes.length > 0) {
        message += `<strong>Suggestions:</strong><br>`;
        message += `• Upload a higher-resolution image (at least ${Math.round(recommendedWidth)} × ${Math.round(recommendedHeight)} pixels)<br>`;
        message += `• Choose a smaller ${isClock() ? 'clock' : 'frame'} size: ${suggestedSizes.join(', ')}`;
    } else {
        message += `<strong>Suggestion:</strong> Upload a higher-resolution image (at least ${Math.round(recommendedWidth)} × ${Math.round(recommendedHeight)} pixels)`;
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
    if (uploadDropzone) {
        uploadDropzone.style.borderColor = 'var(--blue-hover)';
        uploadDropzone.style.background = '#EFF6FF';
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadDropzone) {
        uploadDropzone.style.borderColor = 'var(--blue-primary)';
        uploadDropzone.style.background = 'var(--background)';
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadDropzone) {
        uploadDropzone.style.borderColor = 'var(--blue-primary)';
        uploadDropzone.style.background = 'var(--background)';
    }
    
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
    const displayType = getDisplayType();
    
    // For Mouse Pad, always use landscape and disable orientation selector
    if (displayType === 'mousepad') {
        state.orientation = 'landscape';
        if (orientationSelect) {
            orientationSelect.value = 'landscape';
            orientationSelect.disabled = true;
            orientationSelect.style.opacity = '0.6';
            orientationSelect.style.cursor = 'not-allowed';
        }
        return;
    }
    
    // For other product types, auto-detect based on image aspect ratio
    const imgAspect = img.width / img.height;
    
    if (imgAspect > 1) {
        // Image is wider than tall - suggest landscape
        state.orientation = 'landscape';
        updateOrientationSelectUI();
    } else {
        // Image is taller than wide - suggest portrait
        state.orientation = 'portrait';
        updateOrientationSelectUI();
    }
}

// Update orientation select dropdown UI
function updateOrientationSelectUI() {
    if (orientationSelect) {
        orientationSelect.value = state.orientation;
        // Re-enable if it was disabled (in case user switches product types)
        orientationSelect.disabled = false;
        orientationSelect.style.opacity = '1';
        orientationSelect.style.cursor = 'pointer';
    }
}

// Setup canvas size
function setupCanvas() {
    const canvasSize = 600;
    photoCanvas.width = canvasSize;
    photoCanvas.height = canvasSize;
    cropOverlay.width = canvasSize;
    cropOverlay.height = canvasSize;
}

function showEditor() {
    // Hide upload area, show preview area
    if (uploadArea) uploadArea.style.display = 'none';
    if (previewArea) previewArea.style.display = 'flex';
    
    // Enable add to cart button
    if (addToCartBtn) addToCartBtn.disabled = false;
    
    setupCanvas();
    updateCanvas();
    updatePriceDisplay();
}

function uploadNew() {
    // Show upload area, hide preview area
    if (uploadArea) uploadArea.style.display = 'flex';
    if (previewArea) previewArea.style.display = 'none';
    
    // Disable add to cart button
    if (addToCartBtn) addToCartBtn.disabled = true;
    
    // Reset file input
    photoUpload.value = '';
    state.uploadedImage = null;
    
    // Hide resolution warning
    hideResolutionWarning();
}

// Frame controls
function handleFrameSizeChange(e) {
    state.frameSize = e.target.value;
    
    // For clocks: reload hands and frame options when size changes
    if (isClock() && FRAME_SIZES[state.frameSize]) {
        state.currentClockData = FRAME_SIZES[state.frameSize].clockData;
        if (state.currentClockData) {
            loadClockHands(state.currentClockData);
            loadClockFrameOptions(state.currentClockData);
        }
    }
    
    updateCanvas();
    
    // Update price display
    updatePriceDisplay();
    
    // Check resolution when frame size changes
    checkResolution();
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
    
    // Check if this is a clock (circular)
    const isCircular = isClock() || printAspect === 1;
    
    if (isCircular) {
        // Draw circular crop overlay for clocks
        const radius = Math.min(canvasWidth, canvasHeight) / 2;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Draw darkened overlay outside circle
        cropCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        cropCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Cut out the circular area
        cropCtx.globalCompositeOperation = 'destination-out';
        cropCtx.beginPath();
        cropCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        cropCtx.fill();
        cropCtx.globalCompositeOperation = 'source-over';
        
        // Draw circular border
        cropCtx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
        cropCtx.lineWidth = 2;
        cropCtx.beginPath();
        cropCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        cropCtx.stroke();
        
        // Add circular markers at 12, 3, 6, 9 o'clock positions
        const markerSize = 20;
        cropCtx.strokeStyle = 'rgba(102, 126, 234, 1)';
        cropCtx.lineWidth = 3;
        
        // 12 o'clock
        cropCtx.beginPath();
        cropCtx.moveTo(centerX, centerY - radius);
        cropCtx.lineTo(centerX, centerY - radius + markerSize);
        cropCtx.stroke();
        
        // 3 o'clock
        cropCtx.beginPath();
        cropCtx.moveTo(centerX + radius, centerY);
        cropCtx.lineTo(centerX + radius - markerSize, centerY);
        cropCtx.stroke();
        
        // 6 o'clock
        cropCtx.beginPath();
        cropCtx.moveTo(centerX, centerY + radius);
        cropCtx.lineTo(centerX, centerY + radius - markerSize);
        cropCtx.stroke();
        
        // 9 o'clock
        cropCtx.beginPath();
        cropCtx.moveTo(centerX - radius, centerY);
        cropCtx.lineTo(centerX - radius + markerSize, centerY);
        cropCtx.stroke();
        
        return;
    }
    
    // Rectangle crop overlay for regular frames
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
            localStorage.setItem('modenloSession', sessionId);
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
    const cart = localStorage.getItem('modenloCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('modenloCart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getCart();
    const itemCount = cart.length;
    
    // Update navbar cart count
    if (cartCount) {
        cartCount.textContent = itemCount;
        if (itemCount > 0) {
            cartCount.style.display = 'flex';
        }
    }
    
    // Update any other cart badge (if present on page)
    if (cartBadge) {
        cartBadge.textContent = itemCount;
        cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
    }
}

async function addToCart(e) {
    console.log('Add to cart clicked'); // Debug log
    
    // Silently ignore if no image uploaded
    if (!state.uploadedImage) {
        return;
    }
    
    // Disable button during upload
    if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Uploading...';
    }
    
    try {
        // Generate FULL-RESOLUTION final image (300 DPI)
        console.log('[ADD TO CART] Generating full-resolution image...');
        const finalCanvas = generateFinalImage();
        const dimensions = getFrameDimensions(state.frameSize, state.orientation);
        console.log(`[ADD TO CART] Image dimensions: ${dimensions.width}x${dimensions.height}px`);
        
        // Convert to PNG blob for lossless upload
        const fullResBlob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));
        console.log(`[ADD TO CART] Full-res blob size: ${(fullResBlob.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Upload full-res image to server IMMEDIATELY
        const itemId = Date.now();
        const formData = new FormData();
        formData.append('image', fullResBlob, `${itemId}.png`);
        formData.append('itemId', itemId);
        
        console.log('[ADD TO CART] Uploading to server...');
        const uploadResponse = await fetch(`${API_BASE}/upload-image`, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
        }
        
        console.log('[ADD TO CART] Upload successful, imageId:', uploadResult.imageId);
        
        // Generate preview thumbnail (small, for cart display only)
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');
        previewCanvas.width = 200;
        previewCanvas.height = 200;
        
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
        previewCtx.drawImage(finalCanvas, offsetX, offsetY, previewWidth, previewHeight);
        
        const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.6);
    
        // Calculate total price
        let totalPrice = FRAME_SIZES[state.frameSize] ? FRAME_SIZES[state.frameSize].price : 0;
        
        // Create cart item with imageId reference (full-res already on server!)
        const cartItem = {
            id: itemId,
            imageId: uploadResult.imageId, // Reference to full-res image on server
            frameSize: state.frameSize,
            frameSizeName: FRAME_SIZES[state.frameSize] ? state.frameSize : '8x10',
            framePrice: FRAME_SIZES[state.frameSize] ? FRAME_SIZES[state.frameSize].price : 0,
            orientation: state.orientation,
            zoom: state.currentZoom,
            position: { ...state.imagePosition },
            // Keep small preview for cart display
            previewImage: previewDataUrl,
            addedAt: new Date().toISOString()
        };
    
    // Add clock-specific or regular frame-specific data
    if (isClock() && state.currentClockData) {
        // For clocks: add hands and frame option details
        if (state.selectedClockHands && state.currentClockData.hands) {
            const selectedHands = state.currentClockData.hands.find(h => h.id === state.selectedClockHands);
            if (selectedHands) {
                cartItem.clockHandsId = selectedHands.id;
                cartItem.clockHandsName = selectedHands.name;
                cartItem.clockHandsPrice = selectedHands.price;
                totalPrice += selectedHands.price;
            }
        }
        
        if (state.selectedFrameOption && state.currentClockData.frames) {
            const selectedFrame = state.currentClockData.frames.find(f => f.id === state.selectedFrameOption);
            if (selectedFrame) {
                cartItem.frameOptionId = selectedFrame.id;
                cartItem.frameOptionName = selectedFrame.name;
                cartItem.frameOptionPrice = selectedFrame.price;
                totalPrice += selectedFrame.price;
            }
        }
        
        cartItem.productType = 'clock';
    } else {
        // For regular frames: add mount details
        cartItem.mountId = state.selectedMount;
        cartItem.mountName = MOUNT_OPTIONS[state.selectedMount] ? MOUNT_OPTIONS[state.selectedMount].name : 'No Mount';
        cartItem.mountPrice = MOUNT_OPTIONS[state.selectedMount] ? MOUNT_OPTIONS[state.selectedMount].price : 0;
        totalPrice += cartItem.mountPrice;
        cartItem.productType = 'frame';
    }
    
    cartItem.totalPrice = totalPrice;
    
        // Add to cart
        const cart = getCart();
        cart.push(cartItem);
        saveCart(cart);
        
        // Show toast notification
        showToast('✅ Item added to cart!');
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        
        let errorMessage = 'Error adding item to cart. Please try again.';
        if (error.message.includes('Upload failed')) {
            errorMessage = 'Failed to upload image to server. Please check your connection and try again.';
        } else if (error.name === 'QuotaExceededError') {
            errorMessage = 'Cart storage limit reached! Please complete your order or remove items.';
        }
        
        alert(errorMessage);
    } finally {
        // Re-enable button
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = 'ADD TO CART';
        }
    }
}

// Generate final framed image for download/cart
function generateFinalImage() {
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
    
    return outputCanvas;
}

// Toast notification function
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        toast.classList.remove('hide');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            toast.classList.remove('show');
            
            // Remove hide class after animation completes
            setTimeout(() => {
                toast.classList.remove('hide');
            }, 300);
        }, 3000);
    }
}

// Make addToCart globally accessible for onclick handler
window.handleAddToCart = addToCart;

// Initialize the app
init();
