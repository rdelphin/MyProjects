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

// Handle form submission
async function handleCheckout(e) {
    e.preventDefault();
    
    const checkoutData = getCheckoutData();
    if (!checkoutData) {
        alert('Error: No checkout data found');
        return;
    }
    
    // Collect form data
    const formData = {
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
            items: checkoutData.items,
            totals: checkoutData.totals,
            orderDate: new Date().toISOString()
        }
    };
    
    // Store order for success page
    localStorage.setItem('photoFramerLastOrder', JSON.stringify(formData));
    
    // Clear cart and checkout data
    localStorage.removeItem('photoFramerCart');
    localStorage.removeItem('photoFramerCheckout');
    
    // Redirect to success page
    window.location.href = 'order-success.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const checkoutData = getCheckoutData();
    displayOrderSummary(checkoutData);
    
    // Attach event listener
    checkoutForm.addEventListener('submit', handleCheckout);
});
