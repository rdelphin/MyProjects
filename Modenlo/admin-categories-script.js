// Admin Categories Management Script

// Get session ID from localStorage
const sessionId = localStorage.getItem('modenloSession');

// Check authentication
async function checkAuth() {
    if (!sessionId) {
        console.log('No session ID found, redirecting to login');
        window.location.href = 'test-auth.html';
        return false;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/session', {
            headers: {
                'x-session-id': sessionId
            }
        });

        if (!response.ok) {
            console.error('Auth check response not OK:', response.status);
            localStorage.removeItem('modenloSession');
            window.location.href = 'test-auth.html';
            return false;
        }

        const data = await response.json();
        
        if (!data.success || !data.isAdmin) {
            console.log('Not authenticated as admin');
            localStorage.removeItem('modenloSession');
            window.location.href = 'test-auth.html';
            return false;
        }

        console.log('Auth check passed');
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        // Don't redirect immediately on network error - server might be starting
        showError('Unable to verify authentication. Please ensure the server is running.');
        return false;
    }
}

// Logout function
function logout() {
    fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
            'x-session-id': sessionId
        }
    }).finally(() => {
        localStorage.removeItem('modenloSession');
        window.location.href = 'test-auth.html';
    });
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/categories', {
            headers: {
                'x-session-id': sessionId
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displayCategories(data.categories);
            updateCategoriesCount(data.categories.length);
        } else {
            showError('Failed to load categories');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Error loading categories. Make sure the server is running.');
    }
}

// Display categories in table
function displayCategories(categories) {
    const container = document.getElementById('categoriesTableContainer');
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state">No categories yet. Add one above!</div>';
        return;
    }

    // Sort by order
    categories.sort((a, b) => a.order - b.order);

    const table = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Order</th>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Link</th>
                    <th>Starting Price</th>
                    <th>Image</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${categories.map(category => `
                    <tr>
                        <td><strong>${category.order}</strong></td>
                        <td><code>${category.id}</code></td>
                        <td>${category.name}</td>
                        <td><a href="${category.link}" target="_blank">${category.link}</a></td>
                        <td>${category.startingPrice}</td>
                        <td title="${category.image}">
                            <img src="${category.image}" alt="${category.name}" 
                                 style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;"
                                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'40\'%3E%3Crect width=\'60\' height=\'40\' fill=\'%23ddd\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'10\'%3ENo Image%3C/text%3E%3C/svg%3E'">
                        </td>
                        <td>
                            <span class="status-badge ${category.active ? 'status-active' : 'status-inactive'}">
                                ${category.active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button onclick="toggleCategoryStatus('${category.id}', ${!category.active})" 
                                        class="btn-icon" 
                                        title="${category.active ? 'Deactivate' : 'Activate'}">
                                    ${category.active ? '👁️' : '🔒'}
                                </button>
                                <button onclick="editCategory('${category.id}')" 
                                        class="btn-icon" 
                                        title="Edit">
                                    ✏️
                                </button>
                                <button onclick="deleteCategory('${category.id}', '${category.name}')" 
                                        class="btn-icon btn-danger" 
                                        title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Update categories count badge
function updateCategoriesCount(count) {
    const badge = document.getElementById('categoriesCount');
    if (badge) {
        badge.textContent = count;
    }
}

// Add new category
async function addCategory(e) {
    e.preventDefault();

    const categoryData = {
        id: document.getElementById('categoryId').value.trim(),
        name: document.getElementById('categoryName').value.trim(),
        description: document.getElementById('categoryDescription').value.trim(),
        startingPrice: document.getElementById('categoryPrice').value.trim() || '$0.00',
        image: document.getElementById('categoryImage').value.trim(),
        link: document.getElementById('categoryLink').value.trim(),
        order: parseInt(document.getElementById('categoryOrder').value) || undefined,
        active: document.getElementById('categoryActive').checked
    };

    try {
        const response = await fetch('http://localhost:3000/api/admin/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify(categoryData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Category added successfully!');
            document.getElementById('addCategoryForm').reset();
            document.getElementById('categoryActive').checked = true; // Reset checkbox
            loadCategories();
        } else {
            showError(data.error || 'Failed to add category');
        }
    } catch (error) {
        console.error('Error adding category:', error);
        showError('Error adding category. Please try again.');
    }
}

// Edit category - open modal
function editCategory(categoryId) {
    // Find category data
    fetch(`http://localhost:3000/api/admin/categories`, {
        headers: {
            'x-session-id': sessionId
        }
    })
    .then(response => response.json())
    .then(data => {
        const category = data.categories.find(c => c.id === categoryId);
        if (category) {
            // Populate modal
            document.getElementById('editCategoryId').value = category.id;
            document.getElementById('editCategoryName').value = category.name;
            document.getElementById('editCategoryDescription').value = category.description;
            document.getElementById('editCategoryPrice').value = category.startingPrice;
            document.getElementById('editCategoryImage').value = category.image;
            document.getElementById('editCategoryLink').value = category.link;
            document.getElementById('editCategoryOrder').value = category.order;
            document.getElementById('editCategoryActive').checked = category.active;
            
            // Show modal
            document.getElementById('editModal').style.display = 'flex';
        }
    });
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Save category edits
async function saveCategory(e) {
    e.preventDefault();

    const categoryId = document.getElementById('editCategoryId').value;
    const updateData = {
        name: document.getElementById('editCategoryName').value.trim(),
        description: document.getElementById('editCategoryDescription').value.trim(),
        startingPrice: document.getElementById('editCategoryPrice').value.trim(),
        image: document.getElementById('editCategoryImage').value.trim(),
        link: document.getElementById('editCategoryLink').value.trim(),
        order: parseInt(document.getElementById('editCategoryOrder').value),
        active: document.getElementById('editCategoryActive').checked
    };

    try {
        const response = await fetch(`http://localhost:3000/api/admin/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Category updated successfully!');
            closeEditModal();
            loadCategories();
        } else {
            showError(data.error || 'Failed to update category');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        showError('Error updating category. Please try again.');
    }
}

// Toggle category status
async function toggleCategoryStatus(categoryId, newStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/categories/${categoryId}/availability`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
            },
            body: JSON.stringify({ active: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`Category ${newStatus ? 'activated' : 'deactivated'} successfully!`);
            loadCategories();
        } else {
            showError(data.error || 'Failed to update category status');
        }
    } catch (error) {
        console.error('Error toggling category status:', error);
        showError('Error updating category status. Please try again.');
    }
}

// Delete category
async function deleteCategory(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/admin/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'x-session-id': sessionId
            }
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Category deleted successfully!');
            loadCategories();
        } else {
            showError(data.error || 'Failed to delete category');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showError('Error deleting category. Please try again.');
    }
}

// Show success message
function showSuccess(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show error message
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
};

// Auto-generate category ID and link from name
function setupAutoGeneration() {
    const nameInput = document.getElementById('categoryName');
    const idInput = document.getElementById('categoryId');
    const linkInput = document.getElementById('categoryLink');
    
    nameInput.addEventListener('input', function() {
        const name = this.value;
        
        // Generate ID from name
        const id = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')          // Replace spaces with hyphens
            .replace(/-+/g, '-')           // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
        
        // Update ID field
        idInput.value = id;
        
        // Update link field
        if (id) {
            linkInput.value = id + '.html';
        } else {
            linkInput.value = '';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        // Auth failed, will redirect
        return;
    }
    
    // Set up event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('addCategoryForm').addEventListener('submit', addCategory);
    document.getElementById('editCategoryForm').addEventListener('submit', saveCategory);
    
    // Set up auto-generation for category ID and link
    setupAutoGeneration();

    // Load categories
    loadCategories();
});
