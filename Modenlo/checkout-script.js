// API Configuration - works on localhost, mobile devices, and production
const API_BASE = `${window.location.origin}/api`;

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
    submitButton.disabled = true;
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
        console.log('Submitting order to:', `${API_BASE}/orders`);
        
        // Submit order to backend
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        // Log response details for debugging
        console.log('Response status:', response.status);
        console.log('Response content-type:', response.headers.get('content-type'));
        
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
        console.error('Error submitting order:', error);
        
        // Provide more helpful error message
        let userMessage = 'Error processing your order. Please try again.';
        
        if (error.message.includes('Server returned an error page') || error.message.includes('Server error')) {
            userMessage = 'Unable to connect to the order service. Please check your internet connection and try again.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            userMessage = 'Network error. Please check your internet connection and try again.';
        } else {
            userMessage = `Error: ${error.message}`;
        }
        
        alert(userMessage);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Place Order';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const checkoutData = getCheckoutData();
    displayOrderSummary(checkoutData);
    
    // Attach event listener
    checkoutForm.addEventListener('submit', handleCheckout);
});
