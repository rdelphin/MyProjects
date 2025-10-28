const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'frames.json');
const MOUNTS_FILE = path.join(__dirname, 'data', 'mounts.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const DOWNLOADS_FILE = path.join(__dirname, 'data', 'downloads.json');

// Simple in-memory session store (in production, use Redis or database)
const sessions = new Map();

// Admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // Change this in production!

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

// Session middleware
function checkSession(req, res, next) {
    const sessionId = req.headers['x-session-id'];
    if (sessionId && sessions.has(sessionId)) {
        req.session = sessions.get(sessionId);
        next();
    } else {
        req.session = null;
        next();
    }
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.isAdmin) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
}

app.use(checkSession);

// Helper function to read frames data
async function readFramesData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading frames data:', error);
        return { frames: [] };
    }
}

// Helper function to write frames data
async function writeFramesData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing frames data:', error);
        return false;
    }
}

// Helper function to read mounts data
async function readMountsData() {
    try {
        const data = await fs.readFile(MOUNTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading mounts data:', error);
        return { mounts: [] };
    }
}

// Helper function to write mounts data
async function writeMountsData(data) {
    try {
        await fs.writeFile(MOUNTS_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing mounts data:', error);
        return false;
    }
}

// AUTHENTICATION ROUTES

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate session ID
        const sessionId = crypto.randomBytes(32).toString('hex');
        
        // Store session
        sessions.set(sessionId, {
            isAdmin: true,
            username,
            createdAt: Date.now()
        });
        
        res.json({
            success: true,
            sessionId,
            isAdmin: true,
            username
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});

// Check session endpoint
app.get('/api/auth/session', (req, res) => {
    if (req.session) {
        res.json({
            success: true,
            isAdmin: req.session.isAdmin,
            username: req.session.username
        });
    } else {
        res.json({
            success: true,
            isAdmin: false,
            username: null
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
        sessions.delete(sessionId);
    }
    res.json({ success: true });
});

// PUBLIC ROUTES (for users)

// Get all available frames
app.get('/api/frames', async (req, res) => {
    try {
        const data = await readFramesData();
        const availableFrames = data.frames.filter(frame => frame.available);
        res.json({ success: true, frames: availableFrames });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch frames' });
    }
});

// Get a specific frame by ID
app.get('/api/frames/:id', async (req, res) => {
    try {
        const data = await readFramesData();
        const frame = data.frames.find(f => f.id === req.params.id && f.available);
        
        if (frame) {
            res.json({ success: true, frame });
        } else {
            res.status(404).json({ success: false, error: 'Frame not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch frame' });
    }
});

// Get all available mounts
app.get('/api/mounts', async (req, res) => {
    try {
        const data = await readMountsData();
        const availableMounts = data.mounts.filter(mount => mount.available);
        res.json({ success: true, mounts: availableMounts });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch mounts' });
    }
});

// Get a specific mount by ID
app.get('/api/mounts/:id', async (req, res) => {
    try {
        const data = await readMountsData();
        const mount = data.mounts.find(m => m.id === req.params.id && m.available);
        
        if (mount) {
            res.json({ success: true, mount });
        } else {
            res.status(404).json({ success: false, error: 'Mount not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch mount' });
    }
});

// Download endpoint (admin only for high-res)
app.post('/api/download/verify', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({
            success: true,
            canDownload: true,
            isAdmin: true
        });
    } else {
        res.json({
            success: true,
            canDownload: false,
            isAdmin: false,
            message: 'Only administrators can download high-resolution images'
        });
    }
});

// ADMIN ROUTES

// Get all frames (including unavailable ones)
app.get('/api/admin/frames', requireAdmin, async (req, res) => {
    try {
        const data = await readFramesData();
        res.json({ success: true, frames: data.frames });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch frames' });
    }
});

// Add a new frame
app.post('/api/admin/frames', requireAdmin, async (req, res) => {
    try {
        const { size, width, height, price, available } = req.body;
        
        // Validate input
        if (!size || !width || !height || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: size, width, height, price' 
            });
        }
        
        const data = await readFramesData();
        
        // Check if frame with this size already exists
        const existingFrame = data.frames.find(f => f.id === size);
        if (existingFrame) {
            return res.status(400).json({ 
                success: false, 
                error: 'Frame with this size already exists' 
            });
        }
        
        // Create new frame
        const newFrame = {
            id: size,
            size,
            width: parseInt(width),
            height: parseInt(height),
            price: parseFloat(price),
            available: available !== undefined ? available : true
        };
        
        data.frames.push(newFrame);
        
        // Sort frames by size (roughly)
        data.frames.sort((a, b) => (a.width * a.height) - (b.width * b.height));
        
        const success = await writeFramesData(data);
        
        if (success) {
            res.json({ success: true, frame: newFrame });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save frame' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add frame' });
    }
});

// Update an existing frame
app.put('/api/admin/frames/:id', requireAdmin, async (req, res) => {
    try {
        const { width, height, price, available } = req.body;
        const data = await readFramesData();
        
        const frameIndex = data.frames.findIndex(f => f.id === req.params.id);
        
        if (frameIndex === -1) {
            return res.status(404).json({ success: false, error: 'Frame not found' });
        }
        
        // Update frame
        if (width !== undefined) data.frames[frameIndex].width = parseInt(width);
        if (height !== undefined) data.frames[frameIndex].height = parseInt(height);
        if (price !== undefined) data.frames[frameIndex].price = parseFloat(price);
        if (available !== undefined) data.frames[frameIndex].available = available;
        
        const success = await writeFramesData(data);
        
        if (success) {
            res.json({ success: true, frame: data.frames[frameIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update frame' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update frame' });
    }
});

// Delete a frame
app.delete('/api/admin/frames/:id', requireAdmin, async (req, res) => {
    try {
        const data = await readFramesData();
        const frameIndex = data.frames.findIndex(f => f.id === req.params.id);
        
        if (frameIndex === -1) {
            return res.status(404).json({ success: false, error: 'Frame not found' });
        }
        
        const deletedFrame = data.frames.splice(frameIndex, 1)[0];
        const success = await writeFramesData(data);
        
        if (success) {
            res.json({ success: true, frame: deletedFrame });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete frame' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete frame' });
    }
});

// ADMIN MOUNT ROUTES

// Get all mounts (including unavailable ones)
app.get('/api/admin/mounts', requireAdmin, async (req, res) => {
    try {
        const data = await readMountsData();
        res.json({ success: true, mounts: data.mounts });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch mounts' });
    }
});

// Add a new mount
app.post('/api/admin/mounts', requireAdmin, async (req, res) => {
    try {
        const { id, name, description, price, available } = req.body;
        
        // Validate input
        if (!id || !name || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: id, name, price' 
            });
        }
        
        const data = await readMountsData();
        
        // Check if mount with this ID already exists
        const existingMount = data.mounts.find(m => m.id === id);
        if (existingMount) {
            return res.status(400).json({ 
                success: false, 
                error: 'Mount with this ID already exists' 
            });
        }
        
        // Create new mount
        const newMount = {
            id,
            name,
            description: description || '',
            price: parseFloat(price),
            available: available !== undefined ? available : true
        };
        
        data.mounts.push(newMount);
        
        const success = await writeMountsData(data);
        
        if (success) {
            res.json({ success: true, mount: newMount });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save mount' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add mount' });
    }
});

// Update an existing mount
app.put('/api/admin/mounts/:id', requireAdmin, async (req, res) => {
    try {
        const { name, description, price, available } = req.body;
        const data = await readMountsData();
        
        const mountIndex = data.mounts.findIndex(m => m.id === req.params.id);
        
        if (mountIndex === -1) {
            return res.status(404).json({ success: false, error: 'Mount not found' });
        }
        
        // Update mount
        if (name !== undefined) data.mounts[mountIndex].name = name;
        if (description !== undefined) data.mounts[mountIndex].description = description;
        if (price !== undefined) data.mounts[mountIndex].price = parseFloat(price);
        if (available !== undefined) data.mounts[mountIndex].available = available;
        
        const success = await writeMountsData(data);
        
        if (success) {
            res.json({ success: true, mount: data.mounts[mountIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update mount' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update mount' });
    }
});

// Delete a mount
app.delete('/api/admin/mounts/:id', requireAdmin, async (req, res) => {
    try {
        const data = await readMountsData();
        const mountIndex = data.mounts.findIndex(m => m.id === req.params.id);
        
        if (mountIndex === -1) {
            return res.status(404).json({ success: false, error: 'Mount not found' });
        }
        
        const deletedMount = data.mounts.splice(mountIndex, 1)[0];
        const success = await writeMountsData(data);
        
        if (success) {
            res.json({ success: true, mount: deletedMount });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete mount' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete mount' });
    }
});

// Toggle mount availability
app.patch('/api/admin/mounts/:id/availability', requireAdmin, async (req, res) => {
    try {
        const { available } = req.body;
        const data = await readMountsData();
        
        const mountIndex = data.mounts.findIndex(m => m.id === req.params.id);
        
        if (mountIndex === -1) {
            return res.status(404).json({ success: false, error: 'Mount not found' });
        }
        
        data.mounts[mountIndex].available = available;
        const success = await writeMountsData(data);
        
        if (success) {
            res.json({ success: true, mount: data.mounts[mountIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update mount availability' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update mount availability' });
    }
});

// Toggle frame availability
app.patch('/api/admin/frames/:id/availability', requireAdmin, async (req, res) => {
    try {
        const { available } = req.body;
        const data = await readFramesData();
        
        const frameIndex = data.frames.findIndex(f => f.id === req.params.id);
        
        if (frameIndex === -1) {
            return res.status(404).json({ success: false, error: 'Frame not found' });
        }
        
        data.frames[frameIndex].available = available;
        const success = await writeFramesData(data);
        
        if (success) {
            res.json({ success: true, frame: data.frames[frameIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update frame availability' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update frame availability' });
    }
});

// ORDER ROUTES

// Helper functions for orders
async function readOrdersData() {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { orders: [] };
    }
}

async function writeOrdersData(data) {
    try {
        await fs.writeFile(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing orders data:', error);
        return false;
    }
}

async function readDownloadsData() {
    try {
        const data = await fs.readFile(DOWNLOADS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { downloads: [] };
    }
}

async function writeDownloadsData(data) {
    try {
        await fs.writeFile(DOWNLOADS_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing downloads data:', error);
        return false;
    }
}

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Generate order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // Read existing orders
        const ordersFile = await readOrdersData();
        
        // Create order record
        const order = {
            orderId,
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Save order
        ordersFile.orders.push(order);
        await writeOrdersData(ordersFile);
        
        // Send customer confirmation email
        const customerEmail = await emailService.sendCustomerConfirmation(orderData);
        
        // Send admin notification with download link
        const adminEmail = await emailService.sendAdminNotification(orderData, orderId);
        
        // Store download token if admin email succeeded
        if (adminEmail.success && adminEmail.downloadToken) {
            const downloadsFile = await readDownloadsData();
            downloadsFile.downloads.push({
                orderId,
                token: adminEmail.downloadToken,
                expiresAt: adminEmail.expiresAt,
                downloaded: false,
                createdAt: new Date().toISOString()
            });
            await writeDownloadsData(downloadsFile);
        }
        
        res.json({
            success: true,
            orderId,
            customerEmailSent: customerEmail.success,
            adminEmailSent: adminEmail.success
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

// Download endpoint with token
app.get('/api/download/:orderId/:token', async (req, res) => {
    try {
        const { orderId, token } = req.params;
        
        // Read downloads data
        const downloadsFile = await readDownloadsData();
        const download = downloadsFile.downloads.find(d => d.orderId === orderId && d.token === token);
        
        if (!download) {
            return res.status(404).json({ success: false, error: 'Invalid download link' });
        }
        
        // Check if expired
        if (new Date(download.expiresAt) < new Date()) {
            return res.status(403).json({ success: false, error: 'Download link has expired' });
        }
        
        // Check if already downloaded
        if (download.downloaded) {
            return res.status(403).json({ success: false, error: 'This link has already been used' });
        }
        
        // Get order data
        const ordersFile = await readOrdersData();
        const order = ordersFile.orders.find(o => o.orderId === orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        // Mark as downloaded
        download.downloaded = true;
        download.downloadedAt = new Date().toISOString();
        await writeDownloadsData(downloadsFile);
        
        // Return order data with images
        res.json({
            success: true,
            orderId,
            items: order.order.items,
            message: 'Download successful. Use this data to generate print-ready images.'
        });
        
    } catch (error) {
        console.error('Error processing download:', error);
        res.status(500).json({ success: false, error: 'Failed to process download' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Photo Framer API server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`API: http://localhost:${PORT}/api/frames`);
    console.log(`\n📧 Email Configuration:`);
    console.log(`Set EMAIL_USER and EMAIL_PASS environment variables to enable email notifications`);
    console.log(`Set ADMIN_EMAIL environment variable to receive order notifications`);
});
