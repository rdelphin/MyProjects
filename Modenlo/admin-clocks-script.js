// API Configuration
// API Configuration - works on localhost, mobile devices, production, AND file:// protocol
const API_BASE = window.location.protocol === 'file:' 
    ? 'http://localhost:3000/api'  // Use localhost when opened as file://
    : `${window.location.origin}/api`;  // Use current origin when via web server
let sessionId = localStorage.getItem('modenloSession');

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/session`, {
            headers: {
                'x-session-id': sessionId
            }
        });
        const data = await response.json();
        
        if (!data.success || !data.isAdmin) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'index.html';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadClocks();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('addClockForm').addEventListener('submit', handleAddClock);
    document.getElementById('editClockForm').addEventListener('submit', handleEditClock);
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Logout
async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
                'x-session-id': sessionId
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('modenloSession');
    window.location.href = 'index.html';
}

// Load all clocks
async function loadClocks() {
    try {
        const response = await fetch(`${API_BASE}/admin/clocks`, {
            headers: {
                'x-session-id': sessionId
            }
        });
        const data = await response.json();
        
        if (data.success) {
            displayClocks(data.clocks);
        } else {
            showToast('Failed to load clocks', 'error');
        }
    } catch (error) {
        console.error('Error loading clocks:', error);
        showToast('Failed to load clocks', 'error');
    }
}

// Display clocks in table
function displayClocks(clocks) {
    const container = document.getElementById('clocksContainer');
    const count = document.getElementById('clocksCount');
    
    count.textContent = clocks.length;
    
    if (clocks.length === 0) {
        container.innerHTML = '<p class="empty-state">No clocks found. Add your first clock above.</p>';
        return;
    }
    
    const table = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Diameter</th>
                    <th>Base Price</th>
                    <th>Hands Options</th>
                    <th>Frame Options</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${clocks.map(clock => `
                    <tr>
                        <td><strong>${clock.diameter}"</strong></td>
                        <td>$${clock.price.toFixed(2)}</td>
                        <td>${clock.hands ? clock.hands.length : 0} options</td>
                        <td>${clock.frames ? clock.frames.length : 0} options</td>
                        <td>
                            <span class="status-badge ${clock.available ? 'status-active' : 'status-inactive'}">
                                ${clock.available ? 'Available' : 'Unavailable'}
                            </span>
                        </td>
                        <td class="actions">
                            <button class="btn-action btn-edit" onclick='editClock(${JSON.stringify(clock)})' title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-action btn-toggle" onclick="toggleAvailability('${clock.id}', ${!clock.available})" title="${clock.available ? 'Disable' : 'Enable'}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${clock.available ? 
                                        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' :
                                        '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
                                    }
                                </svg>
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteClock('${clock.id}', '${clock.diameter}')" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Add new clock
async function handleAddClock(e) {
    e.preventDefault();
    
    const diameter = document.getElementById('newDiameter').value;
    const price = document.getElementById('newPrice').value;
    const available = document.getElementById('newAvailable').checked;
    
    try {
        const response = await fetch(`${API_BASE}/admin/clocks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify({
                diameter,
                price,
                available,
                hands: [],
                frames: []
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Clock size added successfully', 'success');
            document.getElementById('addClockForm').reset();
            document.getElementById('newAvailable').checked = true;
            loadClocks();
        } else {
            showToast(data.error || 'Failed to add clock', 'error');
        }
    } catch (error) {
        console.error('Error adding clock:', error);
        showToast('Failed to add clock', 'error');
    }
}

// Edit clock
function editClock(clock) {
    document.getElementById('editClockId').value = clock.id;
    document.getElementById('editDiameter').value = clock.diameter;
    document.getElementById('editPrice').value = clock.price;
    document.getElementById('editAvailable').checked = clock.available;
    document.getElementById('editClockDiameter').textContent = clock.diameter;
    
    // Populate hands
    const handsContainer = document.getElementById('handsContainer');
    handsContainer.innerHTML = '';
    if (clock.hands && clock.hands.length > 0) {
        clock.hands.forEach((hand, index) => {
            addHandOption(hand, index);
        });
    }
    
    // Populate frames
    const framesContainer = document.getElementById('framesContainer');
    framesContainer.innerHTML = '';
    if (clock.frames && clock.frames.length > 0) {
        clock.frames.forEach((frame, index) => {
            addFrameOption(frame, index);
        });
    }
    
    document.getElementById('editModal').style.display = 'flex';
}

// Add hand option to form
function addHandOption(hand = null, index = null) {
    const container = document.getElementById('handsContainer');
    const idx = index !== null ? index : container.children.length;
    
    const handDiv = document.createElement('div');
    handDiv.className = 'option-group';
    handDiv.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 1.5fr 2fr 2fr 1fr 120px auto; gap: 10px; align-items: start;">
            <div class="form-group" style="margin: 0;">
                <label>ID</label>
                <input type="text" class="hand-id" value="${hand ? hand.id : ''}" placeholder="e.g., classic">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Name</label>
                <input type="text" class="hand-name" value="${hand ? hand.name : ''}" placeholder="e.g., Classic">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Description</label>
                <input type="text" class="hand-description" value="${hand ? hand.description : ''}" placeholder="Description">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Price</label>
                <input type="number" class="hand-price" step="0.01" value="${hand ? hand.price : '0'}" placeholder="0.00">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Thumbnail</label>
                <input type="file" class="hand-thumbnail" accept="image/*" style="font-size: 12px;">
                <input type="hidden" class="hand-thumbnail-url" value="${hand && hand.thumbnail ? hand.thumbnail : ''}">
                ${hand && hand.thumbnail ? `<img src="${hand.thumbnail}" style="max-width: 80px; max-height: 50px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">` : ''}
            </div>
            <button type="button" class="btn-delete" onclick="this.parentElement.parentElement.remove()" style="margin-top: 24px;">×</button>
        </div>
    `;
    
    container.appendChild(handDiv);
}

// Add frame option to form
function addFrameOption(frame = null, index = null) {
    const container = document.getElementById('framesContainer');
    const idx = index !== null ? index : container.children.length;
    
    const frameDiv = document.createElement('div');
    frameDiv.className = 'option-group';
    frameDiv.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 1.5fr 2fr 2fr 1fr 120px auto; gap: 10px; align-items: start;">
            <div class="form-group" style="margin: 0;">
                <label>ID</label>
                <input type="text" class="frame-id" value="${frame ? frame.id : ''}" placeholder="e.g., wooden">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Name</label>
                <input type="text" class="frame-name" value="${frame ? frame.name : ''}" placeholder="e.g., Wooden Frame">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Description</label>
                <input type="text" class="frame-description" value="${frame ? frame.description : ''}" placeholder="Description">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Price</label>
                <input type="number" class="frame-price" step="0.01" value="${frame ? frame.price : '0'}" placeholder="0.00">
            </div>
            <div class="form-group" style="margin: 0;">
                <label>Thumbnail</label>
                <input type="file" class="frame-thumbnail" accept="image/*" style="font-size: 12px;">
                <input type="hidden" class="frame-thumbnail-url" value="${frame && frame.thumbnail ? frame.thumbnail : ''}">
                ${frame && frame.thumbnail ? `<img src="${frame.thumbnail}" style="max-width: 80px; max-height: 50px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">` : ''}
            </div>
            <button type="button" class="btn-delete" onclick="this.parentElement.parentElement.remove()" style="margin-top: 24px;">×</button>
        </div>
    `;
    
    container.appendChild(frameDiv);
}

// Handle edit clock form submission
async function handleEditClock(e) {
    e.preventDefault();
    
    const clockId = document.getElementById('editClockId').value;
    const diameter = document.getElementById('editDiameter').value;
    const price = document.getElementById('editPrice').value;
    const available = document.getElementById('editAvailable').checked;
    
    // Collect hands
    const hands = [];
    document.querySelectorAll('#handsContainer .option-group').forEach(group => {
        const id = group.querySelector('.hand-id').value.trim();
        const name = group.querySelector('.hand-name').value.trim();
        const description = group.querySelector('.hand-description').value.trim();
        const price = group.querySelector('.hand-price').value;
        
        if (id && name) {
            hands.push({ id, name, description, price: parseFloat(price) || 0 });
        }
    });
    
    // Collect frames
    const frames = [];
    document.querySelectorAll('#framesContainer .option-group').forEach(group => {
        const id = group.querySelector('.frame-id').value.trim();
        const name = group.querySelector('.frame-name').value.trim();
        const description = group.querySelector('.frame-description').value.trim();
        const price = group.querySelector('.frame-price').value;
        
        if (id && name) {
            frames.push({ id, name, description, price: parseFloat(price) || 0 });
        }
    });
    
    try {
        const response = await fetch(`${API_BASE}/admin/clocks/${clockId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify({
                diameter,
                price,
                available,
                hands,
                frames
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Clock updated successfully', 'success');
            closeEditModal();
            loadClocks();
        } else {
            showToast(data.error || 'Failed to update clock', 'error');
        }
    } catch (error) {
        console.error('Error updating clock:', error);
        showToast('Failed to update clock', 'error');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Toggle clock availability
async function toggleAvailability(clockId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/admin/clocks/${clockId}/availability`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify({ available: newStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Clock ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');
            loadClocks();
        } else {
            showToast('Failed to update clock status', 'error');
        }
    } catch (error) {
        console.error('Error toggling availability:', error);
        showToast('Failed to update clock status', 'error');
    }
}

// Delete clock
async function deleteClock(clockId, diameter) {
    if (!confirm(`Are you sure you want to delete the ${diameter}" clock? This will also remove all its hands and frame options.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/clocks/${clockId}`, {
            method: 'DELETE',
            headers: {
                'x-session-id': sessionId
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Clock deleted successfully', 'success');
            loadClocks();
        } else {
            showToast('Failed to delete clock', 'error');
        }
    } catch (error) {
        console.error('Error deleting clock:', error);
        showToast('Failed to delete clock', 'error');
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}
