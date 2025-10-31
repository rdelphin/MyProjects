// API configuration
const API_BASE = 'http://localhost:3000/api';
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
                            <button onclick="viewOrder('${order.orderId}')" class="btn-small">
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
            ${order.order.items.map((item, index) => `
                <div class="order-item-detail">
                    <div class="item-header">
                        <h4>Item ${index + 1}</h4>
                        <div class="item-actions">
                            <button onclick="downloadImage('${orderId}', ${index})" class="btn-primary">
                                📥 Download High-Res Image
                            </button>
                        </div>
                    </div>
                    <div class="item-specs">
                        <div class="spec-row">
                            <strong>Frame:</strong>
                            <span>${item.frameSizeName}" ${item.orientation}</span>
                        </div>
                        <div class="spec-row">
                            <strong>Mount:</strong>
                            <span>${item.mountName}</span>
                        </div>
                        <div class="spec-row">
                            <strong>Frame Price:</strong>
                            <span>$${item.framePrice.toFixed(2)}</span>
                        </div>
                        <div class="spec-row">
                            <strong>Mount Price:</strong>
                            <span>$${item.mountPrice.toFixed(2)}</span>
                        </div>
                        <div class="spec-row">
                            <strong>Item Total:</strong>
                            <span>$${item.totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    ${item.previewImage ? `
                        <div class="item-preview">
                            <img src="${item.previewImage}" alt="Preview" style="max-width: 200px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    ` : ''}
                </div>
            `).join('')}
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
async function downloadImage(orderId, itemIndex) {
    try {
        const order = allOrders.find(o => o.orderId === orderId);
        if (!order || !order.order.items[itemIndex]) {
            alert('Order or item not found');
            return;
        }

        const item = order.order.items[itemIndex];
        
        // Show loading message
        const btn = event.target;
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
            // Create canvas for output
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Get frame dimensions based on orientation
            const frameSizeParts = item.frameSize.split('x');
            const baseWidth = parseInt(frameSizeParts[0]) * 300; // 300 DPI
            const baseHeight = parseInt(frameSizeParts[1]) * 300;

            if (item.orientation === 'landscape') {
                canvas.width = baseHeight;
                canvas.height = baseWidth;
            } else {
                canvas.width = baseWidth;
                canvas.height = baseHeight;
            }

            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw image (simplified - in production you'd apply zoom and position)
            const aspect = img.width / img.height;
            const canvasAspect = canvas.width / canvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (aspect > canvasAspect) {
                // Image is wider
                drawHeight = canvas.height;
                drawWidth = drawHeight * aspect;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Image is taller
                drawWidth = canvas.width;
                drawHeight = drawWidth / aspect;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // Download
            const filename = `${orderId}-item${itemIndex + 1}-${item.frameSize}-${item.orientation}.png`;
            canvas.toBlob(function(blob) {
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
            }, 'image/png');
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
