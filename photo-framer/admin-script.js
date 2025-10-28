const API_BASE = 'http://localhost:3000/api';

// Session management
let sessionId = localStorage.getItem('photoFramerSession');

// DOM elements
const addFrameForm = document.getElementById('addFrameForm');
const editFrameForm = document.getElementById('editFrameForm');
const framesList = document.getElementById('framesList');
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
            loadFrames();
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
            localStorage.setItem('photoFramerSession', sessionId);
            showToast('Successfully logged in as admin!', 'success');
            loadFrames();
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
    addFrameForm.addEventListener('submit', handleAddFrame);
    editFrameForm.addEventListener('submit', handleEditFrame);
    closeModalBtn.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });
}

// Load all frames
async function loadFrames() {
    try {
        const response = await fetch(`${API_BASE}/admin/frames`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            displayFrames(data.frames);
        } else {
            showToast('Failed to load frames', 'error');
        }
    } catch (error) {
        console.error('Error loading frames:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Display frames in the list
function displayFrames(frames) {
    if (frames.length === 0) {
        framesList.innerHTML = '<p class="loading">No frames found. Add your first frame above.</p>';
        return;
    }
    
    framesList.innerHTML = frames.map(frame => `
        <div class="frame-card ${frame.available ? '' : 'unavailable'}">
            <div class="frame-info">
                <span class="frame-size">${frame.size}"</span>
                <span class="frame-detail">${frame.width} × ${frame.height} pixels</span>
            </div>
            <div class="frame-price">$${frame.price.toFixed(2)}</div>
            <div>
                <span class="frame-status ${frame.available ? 'available' : 'unavailable'}">
                    ${frame.available ? 'Available' : 'Unavailable'}
                </span>
            </div>
            <div class="frame-actions">
                <button class="btn-icon btn-edit" onclick="openEditModal('${frame.id}')">
                    Edit
                </button>
                <button class="btn-icon btn-toggle" onclick="toggleAvailability('${frame.id}', ${!frame.available})">
                    ${frame.available ? 'Disable' : 'Enable'}
                </button>
                <button class="btn-icon btn-delete" onclick="deleteFrame('${frame.id}')">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Add new frame
async function handleAddFrame(e) {
    e.preventDefault();
    
    const formData = {
        size: document.getElementById('newSize').value.trim(),
        width: parseInt(document.getElementById('newWidth').value),
        height: parseInt(document.getElementById('newHeight').value),
        price: parseFloat(document.getElementById('newPrice').value),
        available: true
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/frames`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Frame added successfully', 'success');
            addFrameForm.reset();
            loadFrames();
        } else {
            showToast(data.error || 'Failed to add frame', 'error');
        }
    } catch (error) {
        console.error('Error adding frame:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Open edit modal
async function openEditModal(frameId) {
    try {
        const response = await fetch(`${API_BASE}/admin/frames`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            const frame = data.frames.find(f => f.id === frameId);
            if (frame) {
                document.getElementById('editFrameId').value = frame.id;
                document.getElementById('editSize').value = frame.size;
                document.getElementById('editWidth').value = frame.width;
                document.getElementById('editHeight').value = frame.height;
                document.getElementById('editPrice').value = frame.price;
                
                editModal.classList.add('show');
            }
        }
    } catch (error) {
        console.error('Error loading frame:', error);
        showToast('Error loading frame details', 'error');
    }
}

// Close edit modal
function closeModal() {
    editModal.classList.remove('show');
    editFrameForm.reset();
}

// Handle edit frame
async function handleEditFrame(e) {
    e.preventDefault();
    
    const frameId = document.getElementById('editFrameId').value;
    const formData = {
        width: parseInt(document.getElementById('editWidth').value),
        height: parseInt(document.getElementById('editHeight').value),
        price: parseFloat(document.getElementById('editPrice').value)
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/frames/${frameId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Frame updated successfully', 'success');
            closeModal();
            loadFrames();
        } else {
            showToast(data.error || 'Failed to update frame', 'error');
        }
    } catch (error) {
        console.error('Error updating frame:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Toggle frame availability
async function toggleAvailability(frameId, available) {
    try {
        const response = await fetch(`${API_BASE}/admin/frames/${frameId}/availability`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ available })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Frame ${available ? 'enabled' : 'disabled'} successfully`, 'success');
            loadFrames();
        } else {
            showToast(data.error || 'Failed to update frame', 'error');
        }
    } catch (error) {
        console.error('Error toggling availability:', error);
        showToast('Error connecting to server', 'error');
    }
}

// Delete frame
async function deleteFrame(frameId) {
    if (!confirm('Are you sure you want to delete this frame size? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/frames/${frameId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Frame deleted successfully', 'success');
            loadFrames();
        } else {
            showToast(data.error || 'Failed to delete frame', 'error');
        }
    } catch (error) {
        console.error('Error deleting frame:', error);
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
