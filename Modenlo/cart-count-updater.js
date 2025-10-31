// Shared cart count updater for all pages
// Include this script in pages that need to show the cart count

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

// Update cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

// Update cart count when localStorage changes (e.g., when cart is updated in another tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'modenloCart') {
        updateCartCount();
    }
});
