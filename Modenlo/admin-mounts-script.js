// API Configuration - works on localhost, mobile devices, production, AND file:// protocol
const API_BASE = window.location.protocol === 'file:' 
    ? 'http://localhost:3000/api'  // Use localhost when opened as file://
    : `${window.location.origin}/api`;  // Use current origin when via web server

// Session management
let sessionId = localStorage.getItem('modenloSession');

// DOM elements
const addMountForm = document.getElementById('addMountForm');
const editMountForm = document.getElementById('editMountForm');
const mountsList = document.getElementById('mountsList');
const editModal = document.getElementById('editModal');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    setupEventListeners();
});

// Check if user is authenticated as admin
async function checkAdminSession() {
    try {
        const headers = {};
        if (sessionId) {
            headers['x-session-id'] = sessionId;
        }
        
        const response = await fetch(`${API_BASE}/auth/session`, { headers });
        const data = await response.json();
        
        if (data.success && data.isAdmin) {
            // User is authenticated as admin
            loadMounts();
        } else {
            // Not authenticated, prompt for login
            promptAdminLogin();
        }
    } catch (error) {
        console.error('Error checking session:', error);
        promptAdminLogin();
    }
}

// Prompt for admin login
function promptAdminLogin() {
    const username = prompt('Admin login required.\n\nEnter username:');
    if (!username) {
        document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Access Denied</h1><p>Admin authentication required.</p></div>';
        return;
    }
    
    const password = prompt('Enter password:');
    if (!password) {
        document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Access Denied</h1><p>Admin authentication required.</p></div>';
        return;
    }
    
    loginAsAdmin(username, password);
}

// Login as admin
async function loginAsAdmin(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.sessionId && data.isAdmin) {
            sessionId = data.sessionId;
            localStorage.setItem('modenloSession', sessionId);
            showToast('Successfully logged in as admin!', 'success');
            loadMounts();
        } else {
            alert('Login failed: ' + (data.error || 'Invalid credentials'));
            document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Access Denied</h1><p>Invalid admin credentials.</p><button onclick="location.reload()">Try Again</button></div>';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
        document.body.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Error</h1><p>Failed to connect to server.</p><button onclick="location.reload()">Try Again</button></div>';
    }
}

// Helper function to get headers with session
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (sessionId) {
        headers['x-session-id'] = sessionId;
    }
    return headers;
}

// Event listeners
function setupEventListeners() {
    addMountForm.addEventListener('submit', handleAddMount);
    editMountForm.addEventListener('submit', handleEditMount);
    closeModalBtn.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });
}

// Load all mounts
async function loadMounts() {
    try {
        const response = await fetch(`${API_BASE}/admin/mounts`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            displayMounts(data.mounts);
        } else {
            showToast('Failed to load mounts', 'error');
        }
    } catch (error) {
        console.error('Error loading mounts:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Display mounts in the list
function displayMounts(mounts) {
    if (mounts.length === 0) {
        mountsList.innerHTML = '<p class="loading">No mounts found. Add your first mount above.</p>';
        return;
    }
    
    mountsList.innerHTML = mounts.map(mount => `
        <div class="frame-card ${mount.available ? '' : 'unavailable'}">
            <div class="frame-info">
                <span class="frame-size">${mount.name}</span>
                <span class="frame-detail">${mount.description || 'No description'}</span>
                <span class="frame-detail" style="font-size: 0.85rem; color: #999;">ID: ${mount.id}</span>
            </div>
            <div class="frame-price">$${mount.price.toFixed(2)}</div>
            <div>
                <span class="frame-status ${mount.available ? 'available' : 'unavailable'}">
                    ${mount.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="frame-actions">
                <button class="btn-icon btn-edit" onclick="openEditModal('${mount.id}')">
                    Edit
                </button>
                <button class="btn-icon btn-toggle" onclick="toggleAvailability('${mount.id}', ${!mount.available})">
                    ${mount.available ? 'Disable' : 'Enable'}
                </button>
                <button class="btn-icon btn-delete" onclick="deleteMount('${mount.id}')">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Add new mount
async function handleAddMount(e) {
    e.preventDefault();
    
    const name = document.getElementById('newName').value.trim();
    const description = document.getElementById('newDescription').value.trim();
    const price = document.getElementById('newPrice').value;
    
    // Auto-generate ID from name
    const id = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single
        .trim();
    
    if (!id) {
        showToast('Please enter a valid mount name', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('available', 'true');
    
    // Add thumbnail if provided
    const thumbnailInput = document.getElementById('newThumbnail');
    if (thumbnailInput.files[0]) {
        formData.append('thumbnail', thumbnailInput.files[0]);
    }
    
    try {
        const headers = {};
        if (sessionId) {
            headers['x-session-id'] = sessionId;
        }
        
        const response = await fetch(`${API_BASE}/admin/mounts`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Mount added successfully', 'success');
            addMountForm.reset();
            loadMounts();
        } else {
            showToast(data.error || 'Failed to add mount', 'error');
        }
    } catch (error) {
        console.error('Error adding mount:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Open edit modal
async function openEditModal(mountId) {
    try {
        const response = await fetch(`${API_BASE}/admin/mounts`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const mount = data.mounts.find(m => m.id === mountId);
            if (mount) {
                document.getElementById('editMountId').value = mount.id;
                document.getElementById('editName').value = mount.name;
                document.getElementById('editDescription').value = mount.description || '';
                document.getElementById('editPrice').value = mount.price;
                
                // Show current thumbnail if exists
                const currentThumbnailDiv = document.getElementById('currentThumbnail');
                if (mount.thumbnail) {
                    currentThumbnailDiv.innerHTML = `
                        <p style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Current thumbnail:</p>
                        <img src="${mount.thumbnail}" alt="${mount.name}" style="max-width: 150px; border-radius: 5px; border: 2px solid #e0e0e0;">
                    `;
                } else {
                    currentThumbnailDiv.innerHTML = '<p style="font-size: 0.9rem; color: #999;">No thumbnail currently set</p>';
                }
                
                editModal.classList.add('show');
            }
        }
    } catch (error) {
        console.error('Error loading mount:', error);
        showToast('Error loading mount details', 'error');
    }
}

// Close edit modal
function closeModal() {
    editModal.classList.remove('show');
    editMountForm.reset();
}

// Handle edit mount
async function handleEditMount(e) {
    e.preventDefault();
    
    const mountId = document.getElementById('editMountId').value;
    const thumbnailInput = document.getElementById('editThumbnail');
    
    // Use FormData if thumbnail is being uploaded, otherwise use JSON
    let body, headers;
    
    if (thumbnailInput.files[0]) {
        const formData = new FormData();
        formData.append('name', document.getElementById('editName').value.trim());
        formData.append('description', document.getElementById('editDescription').value.trim());
        formData.append('price', parseFloat(document.getElementById('editPrice').value));
        formData.append('thumbnail', thumbnailInput.files[0]);
        
        body = formData;
        headers = {};
        if (sessionId) {
            headers['x-session-id'] = sessionId;
        }
    } else {
        body = JSON.stringify({
            name: document.getElementById('editName').value.trim(),
            description: document.getElementById('editDescription').value.trim(),
            price: parseFloat(document.getElementById('editPrice').value)
        });
        headers = getAuthHeaders();
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/mounts/${mountId}`, {
            method: 'PUT',
            headers: headers,
            body: body
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Mount updated successfully', 'success');
            closeModal();
            loadMounts();
        } else {
            showToast(data.error || 'Failed to update mount', 'error');
        }
    } catch (error) {
        console.error('Error updating mount:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Toggle mount availability
async function toggleAvailability(mountId, available) {
    try {
        const response = await fetch(`${API_BASE}/admin/mounts/${mountId}/availability`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ available })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Mount ${available ? 'enabled' : 'disabled'} successfully`, 'success');
            loadMounts();
        } else {
            showToast(data.error || 'Failed to update mount', 'error');
        }
    } catch (error) {
        console.error('Error toggling availability:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Delete mount
async function deleteMount(mountId) {
    if (!confirm('Are you sure you want to delete this mount option? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/mounts/${mountId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Mount deleted successfully', 'success');
            loadMounts();
        } else {
            showToast(data.error || 'Failed to delete mount', 'error');
        }
    } catch (error) {
        console.error('Error deleting mount:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
