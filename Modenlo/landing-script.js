// Update cart count on page load
function updateCartCount() {
    const cart = localStorage.getItem('modenloCart');
    const cartCount = cart ? JSON.parse(cart).length : 0;
    const cartBadge = document.getElementById('cartCount');
    
    if (cartBadge) {
        cartBadge.textContent = cartCount;
        if (cartCount > 0) {
            cartBadge.classList.add('show');
        } else {
            cartBadge.classList.remove('show');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupEmailForm();
});
