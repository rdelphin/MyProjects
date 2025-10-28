// DOM Elements
const checkoutForm = document.getElementById('checkoutForm');
const orderItemsEl = document.getElementById('orderItems');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');

// Get checkout data from localStorage
function getCheckoutData() {
    const data = localStorage.getItem('photoFramerCheckout');
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
    const cart = localStorage.getItem('photoFramerCart');
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
        // Submit order to backend
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store order for success page
            const orderWithId = {
                ...orderData,
                orderId: result.orderId,
                customerEmailSent: result.customerEmailSent,
                adminEmailSent: result.adminEmailSent
            };
            localStorage.setItem('photoFramerLastOrder', JSON.stringify(orderWithId));
            
            // Clear cart and checkout data
            localStorage.removeItem('photoFramerCart');
            localStorage.removeItem('photoFramerCheckout');
            
            // Redirect to success page
            window.location.href = 'order-success.html';
        } else {
            throw new Error(result.error || 'Failed to process order');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('Error processing your order. Please try again.\n\n' + error.message);
        
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
