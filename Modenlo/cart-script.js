// Cart management
const SHIPPING_COST = 15.00;
const TAX_RATE = 0.08; // 8% tax

// DOM Elements
const cartItemsContainer = document.getElementById('cartItemsContainer');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const itemCount = document.getElementById('itemCount');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('modenloCart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('modenloCart', JSON.stringify(cart));
}

// Remove item from cart
function removeItem(itemId) {
    const confirmed = confirm('Are you sure you want to remove this item from your cart?');
    if (!confirmed) return;
    
    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== itemId);
    saveCart(updatedCart);
    loadCart();
}

// Calculate order totals
function calculateTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const shipping = cart.length > 0 ? SHIPPING_COST : 0;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shipping + tax;
    
    return {
        subtotal,
        shipping,
        tax,
        total
    };
}

// Update order summary
function updateOrderSummary(cart) {
    const totals = calculateTotals(cart);
    
    subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    shippingEl.textContent = cart.length > 0 ? `$${totals.shipping.toFixed(2)}` : 'FREE';
    taxEl.textContent = `$${totals.tax.toFixed(2)}`;
    totalEl.textContent = `$${totals.total.toFixed(2)}`;
    
    // Enable/disable checkout button
    checkoutBtn.disabled = cart.length === 0;
}

// Display cart items
function displayCartItems(cart) {
    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        itemCount.textContent = '0';
        return;
    }
    
    cartItemsContainer.style.display = 'flex';
    emptyCartMessage.style.display = 'none';
    itemCount.textContent = cart.length;
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.previewImage}" alt="Framed Photo ${item.frameSizeName}">
            </div>
            
            <div class="cart-item-details">
                <div class="cart-item-title">
                    Framed Photo - ${item.frameSizeName}" ${item.orientation}
                </div>
                
                <div class="cart-item-specs">
                    <div class="cart-item-spec">
                        <strong>Frame Size:</strong>
                        <span>${item.frameSizeName}" (${item.orientation})</span>
                    </div>
                    <div class="cart-item-spec">
                        <strong>Mount:</strong>
                        <span>${item.mountName}</span>
                    </div>
                    <div class="cart-item-spec">
                        <strong>Added:</strong>
                        <span>${new Date(item.addedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="cart-item-price-section">
                <div class="cart-item-price">
                    $${item.totalPrice.toFixed(2)}
                </div>
                <div class="cart-item-breakdown">
                    Frame: $${item.framePrice.toFixed(2)}<br>
                    Mount: $${item.mountPrice.toFixed(2)}
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove" onclick="removeItem(${item.id})">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load and display cart
function loadCart() {
    const cart = getCart();
    displayCartItems(cart);
    updateOrderSummary(cart);
}

// Handle checkout
function handleCheckout() {
    console.log('Checkout button clicked!');
    const cart = getCart();
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Calculate totals
    const totals = calculateTotals(cart);
    
    // Create checkout data WITHOUT the large imageData field
    // (we'll include it when submitting to backend, not in localStorage)
    const checkoutItems = cart.map(item => ({
        id: item.id,
        frameSize: item.frameSize,
        frameSizeName: item.frameSizeName,
        framePrice: item.framePrice,
        mountId: item.mountId,
        mountName: item.mountName,
        mountPrice: item.mountPrice,
        orientation: item.orientation,
        zoom: item.zoom,
        position: item.position,
        previewImage: item.previewImage,  // Keep preview (smaller)
        totalPrice: item.totalPrice,
        addedAt: item.addedAt
        // NOTE: imageData is NOT included here to avoid localStorage quota
        // It will be retrieved from original cart when submitting order
    }));
    
    try {
        // Save lightweight checkout data to localStorage
        localStorage.setItem('modenloCheckout', JSON.stringify({
            items: checkoutItems,
            totals,
            timestamp: new Date().toISOString()
        }));
        
        console.log('Checkout data saved, navigating to checkout page');
        
        // Navigate to checkout
        window.location.href = 'checkout.html';
    } catch (error) {
        console.error('Error saving checkout data:', error);
        if (error.name === 'QuotaExceededError') {
            alert('Cart data is too large. This usually happens with high-resolution images.\n\nPlease try:\n1. Reducing the number of items\n2. Using smaller images\n\nWe\'ll fix this issue in the next update to handle larger images better.');
        } else {
            alert('Error preparing checkout. Please try again.');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cart page loaded');
    console.log('Checkout button:', checkoutBtn);
    
    loadCart();
    
    // Attach event listeners
    if (checkoutBtn) {
        console.log('Attaching click listener to checkout button');
        checkoutBtn.addEventListener('click', handleCheckout);
        
        // Also add onclick as backup
        checkoutBtn.onclick = handleCheckout;
    } else {
        console.error('Checkout button not found!');
    }
});
