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

// Upload single image using multipart/form-data (NEW - Better for mobile!)
async function uploadImageBlob(imageDataUrl, itemId) {
    return new Promise((resolve, reject) => {
        // Convert data URL to blob
        fetch(imageDataUrl)
            .then(res => res.blob())
            .then(async (blob) => {
                // Create FormData with blob
                const formData = new FormData();
                formData.append('image', blob, `${itemId}.jpg`);
                formData.append('itemId', itemId);
                
                console.log(`[IMAGE UPLOAD] Uploading image for item ${itemId}, size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                
                try {
                    // Upload with retry logic
                    const response = await retryFetch(`${API_BASE}/upload-image`, {
                        method: 'POST',
                        body: formData // No Content-Type header - browser sets it with boundary
                    }, 3);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        console.log(`[IMAGE UPLOAD] Successfully uploaded ${itemId}: ${result.imageId} (${result.sizeMB}MB)`);
                        resolve(result.imageId);
                    } else {
                        reject(new Error(result.error || 'Upload failed'));
                    }
                } catch (error) {
                    console.error(`[IMAGE UPLOAD] Error uploading ${itemId}:`, error);
                    reject(error);
                }
            })
            .catch(error => {
                console.error(`[IMAGE UPLOAD] Error converting to blob:`, error);
                reject(error);
            });
    });
}

// Upload all images and return items with imageIds
async function uploadAllImages(items, submitButton, originalButtonText) {
    const uploadedItems = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Update button with progress
        submitButton.textContent = `Uploading images (${i + 1}/${items.length})...`;
        
        try {
            if (item.imageData) {
                // Upload image and get imageId
                const imageId = await uploadImageBlob(item.imageData, item.id);
                
                // Replace imageData with imageId (much smaller payload!)
                uploadedItems.push({
                    ...item,
                    imageId: imageId,
                    imageData: undefined, // Remove large base64 string
                    previewImage: item.previewImage // Keep preview for emails
                });
            } else {
                // No image data (shouldn't happen, but handle gracefully)
                uploadedItems.push(item);
            }
        } catch (error) {
            console.error(`[IMAGE UPLOAD] Failed to upload image ${i + 1}:`, error);
            throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
        }
    }
    
    console.log(`[IMAGE UPLOAD] Successfully uploaded ${items.length} images`);
    return uploadedItems;
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

// Handle form submission - NEW TWO-STAGE UPLOAD
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
    
    console.log('[CHECKOUT] API is healthy, proceeding with image uploads...');
    
    // Get full cart items with imageData
    const fullCart = getFullCart();
    
    // Merge checkout items with full cart items to get imageData
    const fullOrderItems = checkoutData.items.map(checkoutItem => {
        const cartItem = fullCart.find(item => item.id === checkoutItem.id);
        return {
            ...checkoutItem,
            imageData: cartItem ? cartItem.imageData : null,  // Full image data for upload
            previewImage: cartItem ? cartItem.previewImage : null  // Preview for emails
        };
    });
    
    try {
        // STAGE 1: Upload all images first (multipart/form-data - better for mobile!)
        console.log('[CHECKOUT] Stage 1: Uploading images...');
        const uploadedItems = await uploadAllImages(fullOrderItems, submitButton, originalButtonText);
        
        // STAGE 2: Submit order with imageIds (tiny payload - fast!)
        console.log('[CHECKOUT] Stage 2: Submitting order...');
        submitButton.textContent = 'Processing Order...';
        
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
                items: uploadedItems,  // Use items with imageIds (not imageData!)
                totals: checkoutData.totals,
                orderDate: new Date().toISOString()
            }
        };
        
        // Log the order payload size (should be much smaller now!)
        const payloadSize = JSON.stringify(orderData).length;
        console.log('[CHECKOUT] Order payload size:', payloadSize, 'bytes (~' + (payloadSize / 1024).toFixed(2) + 'KB)');
        
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
        
        // Check if response is ok before parsing
        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Failed to parse error response as JSON:', e);
                }
            } else {
                const errorText = await response.text();
                console.error('Non-JSON response received:', errorText.substring(0, 500));
                
                if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
                    errorMessage = 'Server returned an error page. Please check if the server is running correctly.';
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Now safe to parse JSON
        const result = await response.json();
        
        if (result.success) {
            console.log('[CHECKOUT] Order completed successfully:', result.orderId);
            
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
        console.error('[CHECKOUT] Error during checkout:', error);
        console.error('[CHECKOUT] Error type:', error.name);
        console.error('[CHECKOUT] Error stack:', error.stack);
        
        // Provide helpful error message
        let userMessage = 'Error processing your order. Please try again.';
        
        if (error.message.includes('Failed to upload image')) {
            userMessage = `${error.message}\n\nPlease check your internet connection and try again.`;
        } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            userMessage = 'Unable to connect to the order service.\n\n' +
                         'This may be due to:\n' +
                         '• Poor internet connection\n' +
                         '• Server maintenance\n\n' +
                         'Please check your connection and try again.';
        } else if (error.message.includes('Server returned an error page')) {
            userMessage = 'The order service is temporarily unavailable.\n\n' +
                         'Please try again in a few moments.';
        }
        
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
