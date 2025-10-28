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
    const cart = localStorage.getItem('photoFramerCart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('photoFramerCart', JSON.stringify(cart));
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
    const cart = getCart();
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // Save order summary to localStorage for checkout page
    const totals = calculateTotals(cart);
    localStorage.setItem('photoFramerCheckout', JSON.stringify({
        items: cart,
        totals,
        timestamp: new Date().toISOString()
    }));
    
    // Navigate to checkout
    window.location.href = 'checkout.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    // Attach event listeners
    checkoutBtn.addEventListener('click', handleCheckout);
});
