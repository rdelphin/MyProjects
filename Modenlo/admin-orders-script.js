// API Configuration - works on localhost, mobile devices, and production
const API_BASE = `${window.location.origin}/api`;
const sessionId = localStorage.getItem('modenloSession');

// State
let allOrders = [];
let filteredOrders = [];

// DOM Elements
const ordersContainer = document.getElementById('ordersContainer');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const orderModal = document.getElementById('orderModal');
const orderDetails = document.getElementById('orderDetails');
const modalClose = document.querySelector('.modal-close');

// Stats elements
const totalOrdersEl = document.getElementById('totalOrders');
const pendingOrdersEl = document.getElementById('pendingOrders');
const processingOrdersEl = document.getElementById('processingOrders');
const completedOrdersEl = document.getElementById('completedOrders');

// Check authentication
async function checkAuth() {
    if (!sessionId) {
        window.location.href = 'admin.html';
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/session`, {
            headers: { 'x-session-id': sessionId }
        });
        const data = await response.json();
        
        if (!data.success || !data.isAdmin) {
            alert('Admin access required');
            window.location.href = 'admin.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'admin.html';
        return false;
    }
}

// Load orders from API
async function loadOrders() {
    try {
        ordersContainer.innerHTML = '<p class="loading-message">Loading orders...</p>';
        
        const response = await fetch(`${API_BASE}/admin/orders`, {
            headers: { 'x-session-id': sessionId }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.orders.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            filteredOrders = [...allOrders];
            displayOrders();
            updateStats();
        } else {
            throw new Error(data.error || 'Failed to load orders');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = `
            <p class="error-message">Error loading orders: ${error.message}</p>
            <button onclick="loadOrders()" class="btn-secondary">Retry</button>
        `;
    }
}

// Update statistics
function updateStats() {
    totalOrdersEl.textContent = allOrders.length;
    pendingOrdersEl.textContent = allOrders.filter(o => o.status === 'pending').length;
    processingOrdersEl.textContent = allOrders.filter(o => o.status === 'processing').length;
    completedOrdersEl.textContent = allOrders.filter(o => o.status === 'completed').length;
}

// Display orders
function displayOrders() {
    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = '<p class="no-results">No orders found</p>';
        return;
    }

    ordersContainer.innerHTML = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredOrders.map(order => `
                    <tr>
                        <td><strong>${order.orderId}</strong></td>
                        <td>
                            ${order.shipping.firstName} ${order.shipping.lastName}<br>
                            <small>${order.contact.email}</small>
                        </td>
                        <td>${order.order.items.length} item(s)</td>
                        <td>$${order.order.totals.total.toFixed(2)}</td>
                        <td>
                            <span class="status-badge status-${order.status}">
                                ${order.status}
                            </span>
                        </td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button data-order-id="${order.orderId}" class="btn-small btn-view-order">
                                View Details
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// View order details
async function viewOrder(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) return;

    orderDetails.innerHTML = `
        <div class="order-detail-section">
            <h3>Order Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Order ID:</strong>
                    <span>${order.orderId}</span>
                </div>
                <div class="detail-item">
                    <strong>Date:</strong>
                    <span>${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <strong>Status:</strong>
                    <select id="orderStatus" class="status-select" onchange="updateOrderStatus('${orderId}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="order-detail-section">
            <h3>Customer Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Name:</strong>
                    <span>${order.shipping.firstName} ${order.shipping.lastName}</span>
                </div>
                <div class="detail-item">
                    <strong>Email:</strong>
                    <span>${order.contact.email}</span>
                </div>
                <div class="detail-item">
                    <strong>Phone:</strong>
                    <span>${order.shipping.phone}</span>
                </div>
                <div class="detail-item full-width">
                    <strong>Shipping Address:</strong>
                    <span>
                        ${order.shipping.address}<br>
                        ${order.shipping.city}, ${order.shipping.state} ${order.shipping.zipCode}
                    </span>
                </div>
            </div>
        </div>

        <div class="order-detail-section">
            <h3>Order Items</h3>
            ${order.order.items.map((item, index) => {
                const isClock = item.productType === 'clock';
                
                // Build specifications based on product type
                let specsHTML = '';
                if (isClock) {
                    specsHTML = `
                        <div class="spec-row">
                            <strong>Product:</strong>
                            <span>Custom Clock - ${item.frameSizeName}" Diameter</span>
                        </div>
                        <div class="spec-row">
                            <strong>Clock Hands:</strong>
                            <span>${item.clockHandsName || 'Standard'}</span>
                        </div>
                        <div class="spec-row">
                            <strong>Frame Option:</strong>
                            <span>${item.frameOptionName || 'Standard'}</span>
                        </div>
                        <div class="spec-row">
                            <strong>Clock Price:</strong>
                            <span>$${item.framePrice.toFixed(2)}</span>
                        </div>
                        ${item.clockHandsPrice > 0 ? `
                            <div class="spec-row">
                                <strong>Hands Price:</strong>
                                <span>$${item.clockHandsPrice.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        ${item.frameOptionPrice > 0 ? `
                            <div class="spec-row">
                                <strong>Frame Price:</strong>
                                <span>$${item.frameOptionPrice.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="spec-row">
                            <strong>Item Total:</strong>
                            <span>$${item.totalPrice.toFixed(2)}</span>
                        </div>
                    `;
                } else {
                    // Handle frames with optional mount selection
                    const hasMountSelected = item.mountName && item.mountName !== 'No Mount' && item.mountName !== 'None';
                    
                    specsHTML = `
                        <div class="spec-row">
                            <strong>Frame:</strong>
                            <span>${item.frameSizeName}" ${item.orientation || 'portrait'}</span>
                        </div>
                        ${hasMountSelected ? `
                            <div class="spec-row">
                                <strong>Mount:</strong>
                                <span>${item.mountName}</span>
                            </div>
                        ` : `
                            <div class="spec-row">
                                <strong>Mount:</strong>
                                <span>No Mount Selected</span>
                            </div>
                        `}
                        <div class="spec-row">
                            <strong>Frame Price:</strong>
                            <span>$${(item.framePrice || 0).toFixed(2)}</span>
                        </div>
                        ${hasMountSelected && item.mountPrice > 0 ? `
                            <div class="spec-row">
                                <strong>Mount Price:</strong>
                                <span>$${item.mountPrice.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="spec-row">
                            <strong>Item Total:</strong>
                            <span>$${(item.totalPrice || 0).toFixed(2)}</span>
                        </div>
                    `;
                }
                
                return `
                    <div class="order-item-detail">
                        <div class="item-header">
                            <h4>Item ${index + 1} ${isClock ? '(Clock)' : '(Frame)'}</h4>
                            <div class="item-actions">
                                <button onclick="downloadImage('${orderId}', ${index}, this)" class="btn-primary">
                                    📥 Download High-Res Image
                                </button>
                            </div>
                        </div>
                        <div class="item-specs">
                            ${specsHTML}
                        </div>
                        ${item.previewImage ? `
                            <div class="item-preview">
                                <img src="${item.previewImage}" alt="Preview" style="max-width: 200px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>

        <div class="order-detail-section">
            <h3>Payment Summary</h3>
            <div class="payment-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${order.order.totals.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>$${order.order.totals.shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>$${order.order.totals.tax.toFixed(2)}</span>
                </div>
                <div class="summary-row total-row">
                    <strong>Total:</strong>
                    <strong>$${order.order.totals.total.toFixed(2)}</strong>
                </div>
            </div>
        </div>
    `;

    orderModal.style.display = 'block';
}

// Download high-res image
async function downloadImage(orderId, itemIndex, buttonElement) {
    try {
        const order = allOrders.find(o => o.orderId === orderId);
        if (!order || !order.order.items[itemIndex]) {
            alert('Order or item not found');
            return;
        }

        const item = order.order.items[itemIndex];
        
        // Show loading message
        const btn = buttonElement;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Generating...';

        // Generate high-res image from item data
        const imageData = item.imageData;
        if (!imageData) {
            alert('Image data not found in order');
            btn.disabled = false;
            btn.textContent = originalText;
            return;
        }

        // Create image from data URL
        const img = new Image();
        img.onload = function() {
            try {
                // Create canvas for output
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const isClock = item.productType === 'clock';
                let filename;

                if (isClock) {
                    // For clocks: circular, use diameter
                    const diameter = parseInt(item.frameSizeName) * 300; // 300 DPI
                    canvas.width = diameter;
                    canvas.height = diameter;
                    filename = `${orderId}-item${itemIndex + 1}-clock-${item.frameSizeName}in.png`;
                } else {
                    // For frames: rectangular, use frameSize and orientation
                    // The imageData already contains the properly oriented final image from the cart
                    // We just need to determine the correct output dimensions
                    
                    // Parse the frame size (e.g., "35x12" means 35 wide × 12 tall in portrait base)
                    const frameSizeParts = item.frameSize.split('x');
                    const firstNum = parseInt(frameSizeParts[0]);
                    const secondNum = parseInt(frameSizeParts[1]);
                    
                    // Determine which is larger to know the base orientation
                    let portraitWidth, portraitHeight;
                    
                    if (firstNum < secondNum) {
                        // Normal case: first number is smaller (e.g., 8x10, 12x35)
                        portraitWidth = firstNum * 300;
                        portraitHeight = secondNum * 300;
                    } else {
                        // Inverted case: first number is larger (e.g., 35x12, 31x11)
                        // This means the size name itself represents landscape
                        portraitWidth = secondNum * 300;
                        portraitHeight = firstNum * 300;
                    }

                    if (item.orientation === 'landscape') {
                        // Swap for landscape
                        canvas.width = portraitHeight;
                        canvas.height = portraitWidth;
                    } else {
                        // Keep portrait
                        canvas.width = portraitWidth;
                        canvas.height = portraitHeight;
                    }
                    filename = `${orderId}-item${itemIndex + 1}-${item.frameSize}-${item.orientation}.png`;
                }

                // Fill with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // IMPORTANT: The imageData is already the final cropped/positioned image from the preview
                // We just need to scale it up to the print dimensions maintaining the exact composition
                // Draw the image to fill the entire canvas (it's already cropped correctly)
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Download
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        alert('Error creating image blob');
                        btn.disabled = false;
                        btn.textContent = originalText;
                        return;
                    }
                    
                    try {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        btn.disabled = false;
                        btn.textContent = originalText;
                        alert('Image downloaded successfully!');
                    } catch (error) {
                        console.error('Download error:', error);
                        alert('Error downloading image: ' + error.message);
                        btn.disabled = false;
                        btn.textContent = originalText;
                    }
                }, 'image/png');
            } catch (error) {
                console.error('Canvas error:', error);
                alert('Error generating image: ' + error.message);
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };

        img.onerror = function() {
            alert('Error loading image');
            btn.disabled = false;
            btn.textContent = originalText;
        };

        img.src = imageData;

    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Error downloading image: ' + error.message);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            // Update local data
            const order = allOrders.find(o => o.orderId === orderId);
            if (order) {
                order.status = newStatus;
                displayOrders();
                updateStats();
            }
            alert('Order status updated successfully');
        } else {
            throw new Error(data.error || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status: ' + error.message);
        // Reload to get correct status
        loadOrders();
    }
}

// Filter orders
function filterOrders() {
    const statusValue = statusFilter.value;
    const searchValue = searchInput.value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        const matchesStatus = statusValue === 'all' || order.status === statusValue;
        const matchesSearch = !searchValue || 
            order.orderId.toLowerCase().includes(searchValue) ||
            order.contact.email.toLowerCase().includes(searchValue) ||
            `${order.shipping.firstName} ${order.shipping.lastName}`.toLowerCase().includes(searchValue);

        return matchesStatus && matchesSearch;
    });

    displayOrders();
}

// Logout
function logout() {
    localStorage.removeItem('modenloSession');
    window.location.href = 'admin.html';
}

// Event listeners
statusFilter.addEventListener('change', filterOrders);
searchInput.addEventListener('input', filterOrders);
refreshBtn.addEventListener('click', loadOrders);
logoutBtn.addEventListener('click', logout);

// Event delegation for View Details buttons - ENHANCED with comprehensive debugging
ordersContainer.addEventListener('click', (e) => {
    console.log('=== CLICK EVENT DEBUG ===');
    console.log('Target element:', e.target);
    console.log('Target tag:', e.target.tagName);
    console.log('Target classes:', e.target.className);
    console.log('Target parent:', e.target.parentElement);
    
    // Approach 1: Check if the clicked element is the button itself
    let button = null;
    
    if (e.target.classList.contains('btn-view-order')) {
        button = e.target;
        console.log('✓ Method 1: Direct button click detected');
    } else {
        // Approach 2: Check if we clicked inside a button (find closest button)
        button = e.target.closest('.btn-view-order');
        if (button) {
            console.log('✓ Method 2: Found button via closest()');
        } else {
            console.log('✗ No button found via either method');
            
            // Approach 3: Manual parent traversal for debugging
            let current = e.target;
            let depth = 0;
            while (current && depth < 10) {
                console.log(`  Level ${depth}:`, current.tagName, current.className);
                if (current.classList && current.classList.contains('btn-view-order')) {
                    button = current;
                    console.log('✓ Method 3: Found button via manual traversal at depth', depth);
                    break;
                }
                current = current.parentElement;
                depth++;
            }
        }
    }
    
    if (button) {
        console.log('✓ BUTTON FOUND:', button);
        console.log('  Button classes:', button.className);
        console.log('  Button attributes:', Array.from(button.attributes).map(a => `${a.name}="${a.value}"`));
        
        e.preventDefault();
        e.stopPropagation();
        
        const orderId = button.getAttribute('data-order-id');
        console.log('  Order ID:', orderId);
        
        if (orderId) {
            console.log('✓ Calling viewOrder with ID:', orderId);
            try {
                viewOrder(orderId);
                console.log('✓ viewOrder executed successfully');
            } catch (error) {
                console.error('✗ ERROR in viewOrder:', error);
                alert('Error opening order details: ' + error.message);
            }
        } else {
            console.error('✗ No order ID found on button:', button);
            alert('Error: No order ID found on button');
        }
    } else {
        console.log('✗ BUTTON NOT FOUND - Click ignored');
    }
    console.log('=== END CLICK DEBUG ===\n');
}, true); // Using capture phase

modalClose.addEventListener('click', () => {
    orderModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === orderModal) {
        orderModal.style.display = 'none';
    }
});

// Make functions globally accessible
window.viewOrder = viewOrder;
window.downloadImage = downloadImage;
window.updateOrderStatus = updateOrderStatus;

// Initialize
(async function() {
    const isAuthed = await checkAuth();
    if (isAuthed) {
        loadOrders();
    }
})();
