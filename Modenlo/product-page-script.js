// Product Page Script
// Handles size selection, option changes, price calculation, and navigation

// Configuration state
const productState = {
    selectedSize: null,
    selectedFinish: 'standard',
    selectedHardware: 'standard',
    basePrice: 0,
    finishPrice: 0,
    hardwarePrice: 0
};

// Finish prices
const finishPrices = {
    standard: 0,
    matte: 5.00,
    premium: 8.00,
    canvas: 12.00
};

// Hardware prices
const hardwarePrices = {
    standard: 0,
    sawtooth: 0,
    wire: 3.00,
    premium: 5.00,
    dual: 7.00
};

// Initialize product page
function initializeProductPage() {
    console.log('Initializing product page...');
    
    // Set up size option handlers
    setupSizeOptions();
    
    // Set up finish option handlers
    setupFinishOptions();
    
    // Set up hardware option handlers
    setupHardwareOptions();
    
    // Set up create print button
    setupCreatePrintButton();
    
    // Initialize with default values
    initializeDefaults();
    
    // Update cart count display
    updateCartCount();
}

// Setup size option buttons
function setupSizeOptions() {
    const sizeButtons = document.querySelectorAll('.size-option');
    
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update state
            productState.selectedSize = this.dataset.size;
            productState.basePrice = parseFloat(this.dataset.price);
            
            // Update display
            updateProductDisplay();
        });
    });
}

// Setup finish option radio buttons
function setupFinishOptions() {
    const finishInputs = document.querySelectorAll('input[name="finish"]');
    
    finishInputs.forEach(input => {
        input.addEventListener('change', function() {
            productState.selectedFinish = this.value;
            productState.finishPrice = finishPrices[this.value] || 0;
            updateProductDisplay();
        });
    });
}

// Setup hardware option radio buttons
function setupHardwareOptions() {
    const hardwareInputs = document.querySelectorAll('input[name="hardware"]');
    
    hardwareInputs.forEach(input => {
        input.addEventListener('change', function() {
            productState.selectedHardware = this.value;
            productState.hardwarePrice = hardwarePrices[this.value] || 0;
            updateProductDisplay();
        });
    });
}

// Initialize default values
function initializeDefaults() {
    // Find and click the first active size option
    const activeSize = document.querySelector('.size-option.active');
    if (activeSize) {
        productState.selectedSize = activeSize.dataset.size;
        productState.basePrice = parseFloat(activeSize.dataset.price);
    }
    
    // Set default finish
    const defaultFinish = document.querySelector('input[name="finish"]:checked');
    if (defaultFinish) {
        productState.selectedFinish = defaultFinish.value;
        productState.finishPrice = finishPrices[defaultFinish.value] || 0;
    }
    
    // Set default hardware
    const defaultHardware = document.querySelector('input[name="hardware"]:checked');
    if (defaultHardware) {
        productState.selectedHardware = defaultHardware.value;
        productState.hardwarePrice = hardwarePrices[defaultHardware.value] || 0;
    }
    
    updateProductDisplay();
}

// Update product configuration and price display
function updateProductDisplay() {
    const totalPrice = productState.basePrice + productState.finishPrice + productState.hardwarePrice;
    
    // Update price
    const priceEl = document.getElementById('productPrice');
    if (priceEl) {
        priceEl.textContent = `$${totalPrice.toFixed(2)}`;
    }
    
    // Update configuration line text
    const configLineEl = document.getElementById('productConfigLine');
    if (configLineEl) {
        const sizeText = productState.selectedSize || 'Select size';
        const finishText = getFinishDisplayName(productState.selectedFinish);
        const hardwareText = getHardwareDisplayName(productState.selectedHardware);
        
        configLineEl.textContent = `${sizeText}" - Premium Frame w/ ${finishText}, ${hardwareText}`;
    }
}

// Get display name for hardware option
function getHardwareDisplayName(hardwareValue) {
    const names = {
        standard: 'Standard D-Ring',
        sawtooth: 'Sawtooth Hanger',
        wire: 'Wire System',
        premium: 'Premium Stand',
        dual: 'Dual Purpose Stand'
    };
    return names[hardwareValue] || 'Standard Hardware';
}

// Get display name for finish option
function getFinishDisplayName(finishValue) {
    const names = {
        standard: 'Standard Finish',
        matte: 'Matte Finish',
        premium: 'Premium Gloss',
        canvas: 'Canvas Texture'
    };
    return names[finishValue] || 'Standard Finish';
}

// Setup create print button
function setupCreatePrintButton() {
    const createBtn = document.getElementById('createPrintBtn');
    
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            // Determine display type from page URL or title
            const pageTitle = document.querySelector('.product-title');
            const displayType = pageTitle && pageTitle.textContent.includes('TABLETOP') ? 'tabletop' : 'wall';
            
            // Store the selected options in sessionStorage to pass to framer.html
            const productOptions = {
                displayType: displayType,
                size: productState.selectedSize,
                finish: productState.selectedFinish,
                hardware: productState.selectedHardware,
                basePrice: productState.basePrice,
                totalPrice: productState.basePrice + productState.finishPrice + productState.hardwarePrice
            };
            
            sessionStorage.setItem('productPageOptions', JSON.stringify(productOptions));
            
            // Navigate to framer.html
            window.location.href = 'framer.html';
        });
    }
}

// Update cart count
function updateCartCount() {
    const cart = localStorage.getItem('modenloCart');
    const itemCount = cart ? JSON.parse(cart).length : 0;
    const cartCountElement = document.getElementById('cartCount');
    
    if (cartCountElement) {
        cartCountElement.textContent = itemCount;
        if (itemCount > 0) {
            cartCountElement.style.display = 'flex';
        } else {
            cartCountElement.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeProductPage);
