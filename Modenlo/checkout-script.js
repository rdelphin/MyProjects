// API Configuration - works on localhost, mobile devices, and production
const API_BASE = `${window.location.origin}/api`;

// Connection check function
async function checkAPIHealth() {
    try {
        console.log('[HEALTH CHECK] Testing API connectivity...');
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn('[HEALTH CHECK] API returned non-OK status:', response.status);
            return false;
        }
        
        const data = await response.json();
        console.log('[HEALTH CHECK] API is accessible:', data);
        return data.success === true;
    } catch (error) {
        console.error('[HEALTH CHECK] Failed to reach API:', error);
        return false;
    }
}

// Retry fetch with exponential backoff
async function retryFetch(url, options, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[FETCH] Attempt ${attempt}/${maxRetries} to ${url}`);
            
            const response = await fetch(url, options);
            console.log(`[FETCH] Attempt ${attempt} response:`, response.status, response.statusText);
            
            return response; // Return response (caller will check if ok)
            
        } catch (error) {
            lastError = error;
            console.error(`[FETCH] Attempt ${attempt} failed:`, error.message);
            
            // Don't retry on last attempt
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`[FETCH] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All retries failed
    throw lastError;
}

// DOM Elements
const checkoutForm = document.getElementById('checkoutForm');
const orderItemsEl = document.getElementById('orderItems');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');

// Get checkout data from localStorage
function getCheckoutData() {
    const data = localStorage.getItem('modenloCheckout');
    return data ? JSON.parse(data) : null;
}

// Display order items
function displayOrderItems(items) {
    orderItemsEl.innerHTML = items.map(item => `
        <div class="order-item">
            <div class="order-item-name">
                ${item.frameSizeName}" ${item.orientation}<br>
                <small style="color: #999;">${item.mountName}</small>
            </div>
            <div class="order-item-price">
                $${item.totalPrice.toFixed(2)}
            </div>
        </div>
    `).join('');
}

// Display order summary
function displayOrderSummary(checkoutData) {
    if (!checkoutData) {
        alert('No checkout data found. Redirecting to cart...');
        window.location.href = 'cart.html';
        return;
    }

    const { items, totals } = checkoutData;
    
    displayOrderItems(items);
    
    subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    shippingEl.textContent = `$${totals.shipping.toFixed(2)}`;
    taxEl.textContent = `$${totals.tax.toFixed(2)}`;
    totalEl.textContent = `$${totals.total.toFixed(2)}`;
}

// Get full cart data (with imageData)
function getFullCart() {
    const cart = localStorage.getItem('modenloCart');
    return cart ? JSON.parse(cart) : [];
}

// Handle form submission
async function handleCheckout(e) {
    e.preventDefault();
    
    const checkoutData = getCheckoutData();
    if (!checkoutData) {
        alert('Error: No checkout data found');
        return;
    }
    
    // Disable submit button to prevent double submission
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Checking connection...';
    
    // First, check if API is reachable
    console.log('[CHECKOUT] Testing API connectivity before submitting order...');
    const apiHealthy = await checkAPIHealth();
    
    if (!apiHealthy) {
        console.error('[CHECKOUT] API health check failed');
        alert('Unable to connect to the order service. Please check your internet connection and try again.\n\nIf the problem persists, please contact support.');
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
    }
    
    console.log('[CHECKOUT] API is healthy, proceeding with order submission...');
    submitButton.textContent = 'Processing Order...';
    
    // Get full cart items with imageData (not in checkoutData to avoid localStorage quota)
    const fullCart = getFullCart();
    
    // Merge checkout items with full cart items to get imageData
    const fullOrderItems = checkoutData.items.map(checkoutItem => {
        const cartItem = fullCart.find(item => item.id === checkoutItem.id);
        return {
            ...checkoutItem,
            imageData: cartItem ? cartItem.imageData : null  // Add full image data
        };
    });
    
    // Collect form data
    const orderData = {
        contact: {
            email: document.getElementById('email').value
        },
        shipping: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zipCode: document.getElementById('zipCode').value,
            phone: document.getElementById('phone').value
        },
        payment: {
            method: document.querySelector('input[name="paymentMethod"]:checked').value
        },
        order: {
            items: fullOrderItems,  // Use items with full imageData
            totals: checkoutData.totals,
            orderDate: new Date().toISOString()
        }
    };
    
    try {
        // Log the API endpoint for debugging
        console.log('[CHECKOUT] Submitting order to:', `${API_BASE}/orders`);
        console.log('[CHECKOUT] Current origin:', window.location.origin);
        console.log('[CHECKOUT] Order data size:', JSON.stringify(orderData).length, 'bytes');
        
        // Submit order to backend with retry logic
        const response = await retryFetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        }, 3); // Try up to 3 times
        
        // Log response details for debugging
        console.log('[CHECKOUT] Response status:', response.status);
        console.log('[CHECKOUT] Response statusText:', response.statusText);
        console.log('[CHECKOUT] Response content-type:', response.headers.get('content-type'));
        
        // Check if response is ok before parsing
        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            
            // Try to parse as JSON first
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Failed to parse error response as JSON:', e);
                }
            } else {
                // If not JSON, get text to help debug
                const errorText = await response.text();
                console.error('Non-JSON response received:', errorText.substring(0, 500));
                
                // Check if it's an HTML error page
                if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
                    errorMessage = 'Server returned an error page. Please check if the server is running correctly.';
                } else {
                    errorMessage = `Server error: ${errorText.substring(0, 100)}`;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Now safe to parse JSON
        const result = await response.json();
        
        if (result.success) {
            // Store order for success page
            const orderWithId = {
                ...orderData,
                orderId: result.orderId,
                customerEmailSent: result.customerEmailSent,
                adminEmailSent: result.adminEmailSent
            };
            localStorage.setItem('modenloLastOrder', JSON.stringify(orderWithId));
            
            // Clear cart and checkout data
            localStorage.removeItem('modenloCart');
            localStorage.removeItem('modenloCheckout');
            
            // Redirect to success page
            window.location.href = 'order-success.html';
        } else {
            throw new Error(result.error || 'Failed to process order');
        }
    } catch (error) {
        console.error('[CHECKOUT] Error submitting order:', error);
        console.error('[CHECKOUT] Error type:', error.name);
        console.error('[CHECKOUT] Error stack:', error.stack);
        
        // Provide more helpful error message based on error type
        let userMessage = 'Error processing your order. Please try again.';
        let technicalDetails = error.message;
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            userMessage = 'Unable to connect to the order service.\n\n' +
                         'This may be due to:\n' +
                         '• Poor internet connection\n' +
                         '• Server maintenance\n' +
                         '• Browser security settings\n\n' +
                         'Please check your connection and try again.';
            technicalDetails = 'Network request failed after 3 attempts';
        } else if (error.message.includes('CORS')) {
            userMessage = 'Connection blocked by security policy.\n\n' +
                         'Please try:\n' +
                         '• Clearing your browser cache\n' +
                         '• Using a different browser\n' +
                         '• Contacting support if the issue persists';
            technicalDetails = 'CORS policy error';
        } else if (error.message.includes('Server returned an error page') || error.message.includes('Server error')) {
            userMessage = 'The order service is temporarily unavailable.\n\n' +
                         'Please try again in a few moments.\n' +
                         'If the problem persists, contact support.';
        }
        
        console.log('[CHECKOUT] User message:', userMessage);
        console.log('[CHECKOUT] Technical details:', technicalDetails);
        
        alert(userMessage);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const checkoutData = getCheckoutData();
    displayOrderSummary(checkoutData);
    
    // Attach event listener
    checkoutForm.addEventListener('submit', handleCheckout);
});
