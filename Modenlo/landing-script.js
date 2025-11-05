// Update cart count on page load
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

// Handle email signup
function handleEmailSignup(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // Store email (in a real app, this would send to a server)
    localStorage.setItem('modenloPromoEmail', email);
    
    // Show success message
    const form = e.target;
    const originalHTML = form.innerHTML;
    form.innerHTML = '<p style="color: white; font-size: 1.1rem; margin: 1rem 0;">✅ Thank you! Check your email for your 15% discount code.</p>';
    
    // Reset form after 5 seconds
    setTimeout(() => {
        form.innerHTML = originalHTML;
        setupEmailForm();
    }, 5000);
}

// Setup email form
function setupEmailForm() {
    const emailForm = document.getElementById('emailSignup');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSignup);
    }
}

// Load popular prices
async function loadPopularPrices() {
    const pricesGrid = document.getElementById('popularPricesGrid');
    if (!pricesGrid) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/frames');
        const data = await response.json();
        
        // Extract frames array from response
        const frames = data.frames || data;
        
        if (frames && frames.length > 0) {
            // Sort by price and take first 4
            const popularFrames = frames.sort((a, b) => a.price - b.price).slice(0, 4);
            
            pricesGrid.innerHTML = popularFrames.map(frame => `
                <div class="price-box">
                    <div class="price-box-size">${frame.size}"</div>
                    <div class="price-box-amount">$${frame.price.toFixed(2)}</div>
                </div>
            `).join('');
        } else {
            pricesGrid.innerHTML = '<div class="loading-prices">No pricing available</div>';
        }
    } catch (error) {
        console.error('Error loading prices:', error);
        pricesGrid.innerHTML = '<div class="loading-prices">Unable to load pricing</div>';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupEmailForm();
    loadPopularPrices();
});
