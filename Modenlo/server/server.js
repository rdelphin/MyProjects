// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'frames.json');
const MOUNTS_FILE = path.join(__dirname, 'data', 'mounts.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const DOWNLOADS_FILE = path.join(__dirname, 'data', 'downloads.json');
const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');
const CLOCKS_FILE = path.join(__dirname, 'data', 'clocks.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'mounts');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            // Create uploads directory if it doesn't exist
            await fs.mkdir(UPLOADS_DIR, { recursive: true });
            cb(null, UPLOADS_DIR);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'mount-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Simple in-memory session store (in production, use Redis or database)
const sessions = new Map();

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Log warning if using default credentials
if (ADMIN_PASSWORD === 'admin123') {
    console.warn('⚠️  WARNING: Using default admin password! Change ADMIN_PASSWORD in environment variables.');
}

// Middleware
// Configure CORS for production - support both www and non-www variants
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://modenlo.com',
            'http://modenlo.com',
            'https://www.modenlo.com',
            'http://www.modenlo.com'
          ]
        : true,
    credentials: true
};
app.use(cors(corsOptions));

// Log CORS errors for debugging
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && process.env.NODE_ENV === 'production') {
        const allowedOrigins = corsOptions.origin;
        if (!allowedOrigins.includes(origin)) {
            console.warn('[CORS] Blocked request from origin:', origin);
        }
    }
    next();
});
// Increase body size limit to handle large image data (50MB)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
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

// Helper function to read categories data
async function readCategoriesData() {
    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading categories data:', error);
        return { categories: [] };
    }
}

// Helper function to write categories data
async function writeCategoriesData(data) {
    try {
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing categories data:', error);
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

// Get all available clocks (public)
app.get('/api/clocks', async (req, res) => {
    try {
        const data = await readClocksData();
        const availableClocks = data.clocks.filter(clock => clock.available);
        res.json({ success: true, clocks: availableClocks });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch clocks' });
    }
});

// Get a specific clock by ID (public)
app.get('/api/clocks/:id', async (req, res) => {
    try {
        const data = await readClocksData();
        const clock = data.clocks.find(c => c.id === req.params.id && c.available);
        
        if (clock) {
            res.json({ success: true, clock });
        } else {
            res.status(404).json({ success: false, error: 'Clock not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch clock' });
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

// Add a new mount (with optional thumbnail upload)
app.post('/api/admin/mounts', requireAdmin, upload.single('thumbnail'), async (req, res) => {
    try {
        // When using FormData, all fields come as strings in req.body
        const id = req.body.id;
        const name = req.body.name;
        const description = req.body.description || '';
        const price = req.body.price;
        const available = req.body.available === 'true' || req.body.available === true;
        
        console.log('Received mount data:', { id, name, description, price, available }); // Debug log
        
        // Validate input
        if (!id || !name || !price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: id, name, price',
                received: { id, name, price }
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
        
        // Add thumbnail path if uploaded
        if (req.file) {
            newMount.thumbnail = `/uploads/mounts/${req.file.filename}`;
        }
        
        data.mounts.push(newMount);
        
        const success = await writeMountsData(data);
        
        if (success) {
            res.json({ success: true, mount: newMount });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save mount' });
        }
    } catch (error) {
        console.error('Error adding mount:', error);
        res.status(500).json({ success: false, error: 'Failed to add mount' });
    }
});

// Update an existing mount (with optional thumbnail upload)
app.put('/api/admin/mounts/:id', requireAdmin, upload.single('thumbnail'), async (req, res) => {
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
        
        // Update thumbnail if new one uploaded
        if (req.file) {
            data.mounts[mountIndex].thumbnail = `/uploads/mounts/${req.file.filename}`;
        }
        
        const success = await writeMountsData(data);
        
        if (success) {
            res.json({ success: true, mount: data.mounts[mountIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update mount' });
        }
    } catch (error) {
        console.error('Error updating mount:', error);
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

// CATEGORY ROUTES

// Get all active categories (public)
app.get('/api/categories', async (req, res) => {
    try {
        const data = await readCategoriesData();
        const activeCategories = data.categories
            .filter(cat => cat.active)
            .sort((a, b) => a.order - b.order);
        res.json({ success: true, categories: activeCategories });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});

// Get all categories (admin)
app.get('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
        const data = await readCategoriesData();
        res.json({ success: true, categories: data.categories });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});

// Add a new category (admin)
app.post('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
        const { id, name, description, startingPrice, image, link, order, active } = req.body;
        
        // Validate input
        if (!id || !name || !description) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: id, name, description' 
            });
        }
        
        const data = await readCategoriesData();
        
        // Check if category with this ID already exists
        const existingCategory = data.categories.find(c => c.id === id);
        if (existingCategory) {
            return res.status(400).json({ 
                success: false, 
                error: 'Category with this ID already exists' 
            });
        }
        
        // Create new category
        const newCategory = {
            id,
            name,
            description,
            startingPrice: startingPrice || '$0.00',
            image: image || 'images/placeholder.jpg',
            link: link || `${id}.html`,
            order: order !== undefined ? parseInt(order) : data.categories.length + 1,
            active: active !== undefined ? active : true
        };
        
        data.categories.push(newCategory);
        
        // Sort categories by order
        data.categories.sort((a, b) => a.order - b.order);
        
        const success = await writeCategoriesData(data);
        
        if (success) {
            res.json({ success: true, category: newCategory });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save category' });
        }
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, error: 'Failed to add category' });
    }
});

// Update a category (admin)
app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
        const { name, description, startingPrice, image, link, order, active } = req.body;
        const data = await readCategoriesData();
        
        const categoryIndex = data.categories.findIndex(c => c.id === req.params.id);
        
        if (categoryIndex === -1) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        // Update category
        if (name !== undefined) data.categories[categoryIndex].name = name;
        if (description !== undefined) data.categories[categoryIndex].description = description;
        if (startingPrice !== undefined) data.categories[categoryIndex].startingPrice = startingPrice;
        if (image !== undefined) data.categories[categoryIndex].image = image;
        if (link !== undefined) data.categories[categoryIndex].link = link;
        if (order !== undefined) data.categories[categoryIndex].order = parseInt(order);
        if (active !== undefined) data.categories[categoryIndex].active = active;
        
        // Re-sort categories by order
        data.categories.sort((a, b) => a.order - b.order);
        
        const success = await writeCategoriesData(data);
        
        if (success) {
            res.json({ success: true, category: data.categories[categoryIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update category' });
        }
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, error: 'Failed to update category' });
    }
});

// Delete a category (admin)
app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
        const data = await readCategoriesData();
        const categoryIndex = data.categories.findIndex(c => c.id === req.params.id);
        
        if (categoryIndex === -1) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        const deletedCategory = data.categories.splice(categoryIndex, 1)[0];
        const success = await writeCategoriesData(data);
        
        if (success) {
            res.json({ success: true, category: deletedCategory });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete category' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete category' });
    }
});

// Toggle category availability (admin)
app.patch('/api/admin/categories/:id/availability', requireAdmin, async (req, res) => {
    try {
        const { active } = req.body;
        const data = await readCategoriesData();
        
        const categoryIndex = data.categories.findIndex(c => c.id === req.params.id);
        
        if (categoryIndex === -1) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        
        data.categories[categoryIndex].active = active;
        const success = await writeCategoriesData(data);
        
        if (success) {
            res.json({ success: true, category: data.categories[categoryIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update category availability' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update category availability' });
    }
});

// CLOCK ROUTES

// Helper functions for clocks
async function readClocksData() {
    try {
        const data = await fs.readFile(CLOCKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading clocks data:', error);
        return { clocks: [] };
    }
}

async function writeClocksData(data) {
    try {
        await fs.writeFile(CLOCKS_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing clocks data:', error);
        return false;
    }
}

// Get all clocks (admin)
app.get('/api/admin/clocks', requireAdmin, async (req, res) => {
    try {
        const data = await readClocksData();
        res.json({ success: true, clocks: data.clocks });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch clocks' });
    }
});

// Add a new clock (admin)
app.post('/api/admin/clocks', requireAdmin, async (req, res) => {
    try {
        const { diameter, price, available, hands, frames } = req.body;
        
        if (!diameter || price === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: diameter, price' 
            });
        }
        
        const data = await readClocksData();
        const id = `clock-${diameter}`;
        
        // Check if clock with this diameter already exists
        const existingClock = data.clocks.find(c => c.id === id);
        if (existingClock) {
            return res.status(400).json({ 
                success: false, 
                error: 'Clock with this diameter already exists' 
            });
        }
        
        const newClock = {
            id,
            diameter: parseInt(diameter),
            price: parseFloat(price),
            available: available !== undefined ? available : true,
            hands: hands || [],
            frames: frames || []
        };
        
        data.clocks.push(newClock);
        data.clocks.sort((a, b) => a.diameter - b.diameter);
        
        const success = await writeClocksData(data);
        
        if (success) {
            res.json({ success: true, clock: newClock });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save clock' });
        }
    } catch (error) {
        console.error('Error adding clock:', error);
        res.status(500).json({ success: false, error: 'Failed to add clock' });
    }
});

// Update clock (admin)
app.put('/api/admin/clocks/:id', requireAdmin, async (req, res) => {
    try {
        const { diameter, price, available, hands, frames } = req.body;
        const data = await readClocksData();
        
        const clockIndex = data.clocks.findIndex(c => c.id === req.params.id);
        
        if (clockIndex === -1) {
            return res.status(404).json({ success: false, error: 'Clock not found' });
        }
        
        if (diameter !== undefined) data.clocks[clockIndex].diameter = parseInt(diameter);
        if (price !== undefined) data.clocks[clockIndex].price = parseFloat(price);
        if (available !== undefined) data.clocks[clockIndex].available = available;
        if (hands !== undefined) data.clocks[clockIndex].hands = hands;
        if (frames !== undefined) data.clocks[clockIndex].frames = frames;
        
        const success = await writeClocksData(data);
        
        if (success) {
            res.json({ success: true, clock: data.clocks[clockIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update clock' });
        }
    } catch (error) {
        console.error('Error updating clock:', error);
        res.status(500).json({ success: false, error: 'Failed to update clock' });
    }
});

// Delete clock (admin)
app.delete('/api/admin/clocks/:id', requireAdmin, async (req, res) => {
    try {
        const data = await readClocksData();
        const clockIndex = data.clocks.findIndex(c => c.id === req.params.id);
        
        if (clockIndex === -1) {
            return res.status(404).json({ success: false, error: 'Clock not found' });
        }
        
        const deletedClock = data.clocks.splice(clockIndex, 1)[0];
        const success = await writeClocksData(data);
        
        if (success) {
            res.json({ success: true, clock: deletedClock });
        } else {
            res.status(500).json({ success: false, error: 'Failed to delete clock' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete clock' });
    }
});

// Toggle clock availability (admin)
app.patch('/api/admin/clocks/:id/availability', requireAdmin, async (req, res) => {
    try {
        const { available } = req.body;
        const data = await readClocksData();
        
        const clockIndex = data.clocks.findIndex(c => c.id === req.params.id);
        
        if (clockIndex === -1) {
            return res.status(404).json({ success: false, error: 'Clock not found' });
        }
        
        data.clocks[clockIndex].available = available;
        const success = await writeClocksData(data);
        
        if (success) {
            res.json({ success: true, clock: data.clocks[clockIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update clock availability' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update clock availability' });
    }
});

// HEALTH CHECK ROUTE
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
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
        // Log incoming request
        console.log('[ORDER] New order request received');
        console.log('[ORDER] Request headers:', {
            'content-type': req.headers['content-type'],
            'origin': req.headers['origin'],
            'user-agent': req.headers['user-agent']
        });
        
        const orderData = req.body;
        
        // Validate order data
        if (!orderData || !orderData.order || !orderData.order.items || orderData.order.items.length === 0) {
            console.error('[ORDER] Invalid order data received');
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid order data: missing items' 
            });
        }
        
        // Generate order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        console.log('[ORDER] Generated order ID:', orderId);
        
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
        console.log('[ORDER] Order saved to file');
        
        // Send customer confirmation email
        const customerEmail = await emailService.sendCustomerConfirmation(orderData);
        console.log('[ORDER] Customer email result:', customerEmail.success ? 'sent' : 'failed');
        
        // Send admin notification with download link
        const adminEmail = await emailService.sendAdminNotification(orderData, orderId);
        console.log('[ORDER] Admin email result:', adminEmail.success ? 'sent' : 'failed');
        
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
            console.log('[ORDER] Download token stored');
        }
        
        console.log('[ORDER] Order completed successfully:', orderId);
        res.json({
            success: true,
            orderId,
            customerEmailSent: customerEmail.success,
            adminEmailSent: adminEmail.success
        });
        
    } catch (error) {
        console.error('[ORDER] Error creating order:', error);
        console.error('[ORDER] Error stack:', error.stack);
        
        // Ensure we always return JSON, never HTML
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create order: ' + error.message 
        });
    }
});

// Get all orders (admin only)
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
        const ordersFile = await readOrdersData();
        res.json({ success: true, orders: ordersFile.orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// Update order status (admin only)
app.patch('/api/admin/orders/:orderId/status', requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const ordersFile = await readOrdersData();
        const orderIndex = ordersFile.orders.findIndex(o => o.orderId === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        ordersFile.orders[orderIndex].status = status;
        ordersFile.orders[orderIndex].updatedAt = new Date().toISOString();
        
        await writeOrdersData(ordersFile);
        
        res.json({ success: true, order: ordersFile.orders[orderIndex] });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
});

// Download page endpoint (shows HTML page for downloading images)
app.get('/download/:orderId/:token', async (req, res) => {
    try {
        const { orderId, token } = req.params;
        
        // Read downloads data
        const downloadsFile = await readDownloadsData();
        const download = downloadsFile.downloads.find(d => d.orderId === orderId && d.token === token);
        
        if (!download) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Download Error - Modenlo</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                        .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Invalid Download Link</h2>
                        <p>This download link is invalid or has been removed.</p>
                    </div>
                </body>
                </html>
            `);
        }
        
        // Check if expired
        if (new Date(download.expiresAt) < new Date()) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Download Error - Modenlo</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                        .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Link Expired</h2>
                        <p>This download link expired on ${new Date(download.expiresAt).toLocaleString()}.</p>
                        <p>Please contact support for assistance.</p>
                    </div>
                </body>
                </html>
            `);
        }
        
        // Get order data
        const ordersFile = await readOrdersData();
        const order = ordersFile.orders.find(o => o.orderId === orderId);
        
        if (!order) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Download Error - Modenlo</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                        .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h2>Order Not Found</h2>
                        <p>The order associated with this download link could not be found.</p>
                    </div>
                </body>
                </html>
            `);
        }
        
        // Send download page HTML
        const downloadPageHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Download High-Res Images - Order ${orderId}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        min-height: 100vh;
                    }
                    .container {
                        max-width: 900px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 15px;
                        padding: 40px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    }
                    h1 { color: #667eea; margin-bottom: 10px; }
                    .order-id { color: #666; margin-bottom: 30px; font-size: 0.9rem; }
                    .item-card {
                        background: #f8f9ff;
                        padding: 20px;
                        margin-bottom: 20px;
                        border-radius: 10px;
                        border: 2px solid #e0e0e0;
                    }
                    .item-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #e0e0e0;
                    }
                    .item-header h3 { color: #333; }
                    .btn-download {
                        background: #28a745;
                        color: white;
                        padding: 12px 24px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    .btn-download:hover { background: #218838; transform: translateY(-2px); }
                    .btn-download:disabled {
                        background: #6c757d;
                        cursor: not-allowed;
                        transform: none;
                    }
                    .item-specs {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .spec-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .spec-row strong { color: #333; }
                    .spec-row span { color: #666; }
                    .preview { text-align: center; margin-top: 15px; }
                    .preview img {
                        max-width: 300px;
                        border: 2px solid #ddd;
                        border-radius: 8px;
                    }
                    .warning {
                        background: #fff3cd;
                        border: 2px solid #ffc107;
                        color: #856404;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .success-message {
                        background: #d4edda;
                        color: #155724;
                        padding: 10px;
                        border-radius: 6px;
                        margin-top: 10px;
                        display: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🖼️ Download High-Resolution Images</h1>
                    <p class="order-id">Order ID: ${orderId}</p>
                    
                    <div class="warning">
                        <strong>⚠️ Important:</strong> Each image can only be downloaded once. Make sure to save them to a secure location.
                        This link expires on <strong>${new Date(download.expiresAt).toLocaleString()}</strong>.
                    </div>
                    
                    ${order.order.items.map((item, index) => {
                        const isClock = item.productType === 'clock';
                        return `
                            <div class="item-card">
                                <div class="item-header">
                                    <h3>Item ${index + 1} ${isClock ? '(Clock)' : '(Frame)'}</h3>
                                    <button onclick="downloadItem(${index})" class="btn-download" id="btn-${index}">
                                        📥 Download High-Res
                                    </button>
                                </div>
                                <div class="item-specs">
                                    ${isClock ? `
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
                                    ` : `
                                        <div class="spec-row">
                                            <strong>Frame:</strong>
                                            <span>${item.frameSizeName}" ${item.orientation}</span>
                                        </div>
                                        <div class="spec-row">
                                            <strong>Mount:</strong>
                                            <span>${item.mountName}</span>
                                        </div>
                                    `}
                                </div>
                                ${item.previewImage ? `
                                    <div class="preview">
                                        <img src="${item.previewImage}" alt="Preview">
                                    </div>
                                ` : ''}
                                <div class="success-message" id="success-${index}">
                                    ✅ Image downloaded successfully!
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <script>
                    const orderData = ${JSON.stringify(order.order.items)};
                    const orderId = '${orderId}';
                    const downloadedItems = new Set();
                    
                    async function downloadItem(itemIndex) {
                        if (downloadedItems.has(itemIndex)) {
                            alert('This item has already been downloaded.');
                            return;
                        }
                        
                        const btn = document.getElementById('btn-' + itemIndex);
                        const successMsg = document.getElementById('success-' + itemIndex);
                        const item = orderData[itemIndex];
                        
                        if (!item.imageData) {
                            alert('Image data not found for this item.');
                            return;
                        }
                        
                        btn.textContent = '⏳ Generating...';
                        btn.disabled = true;
                        
                        try {
                            // Create image from data URL
                            const img = new Image();
                            
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = () => reject(new Error('Failed to load image'));
                                img.src = item.imageData;
                            });
                            
                            // Create canvas for high-res output
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
                            
                            // Calculate proper scaling
                            const aspect = img.width / img.height;
                            const canvasAspect = canvas.width / canvas.height;
                            let drawWidth, drawHeight, offsetX, offsetY;
                            
                            if (aspect > canvasAspect) {
                                drawHeight = canvas.height;
                                drawWidth = drawHeight * aspect;
                                offsetX = (canvas.width - drawWidth) / 2;
                                offsetY = 0;
                            } else {
                                drawWidth = canvas.width;
                                drawHeight = drawWidth / aspect;
                                offsetX = 0;
                                offsetY = (canvas.height - drawHeight) / 2;
                            }
                            
                            // Draw image
                            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                            
                            // Convert to blob and download
                            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = orderId + '-item' + (itemIndex + 1) + '-' + item.frameSize + '-' + item.orientation + '.png';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            // Mark as downloaded
                            downloadedItems.add(itemIndex);
                            btn.textContent = '✓ Downloaded';
                            successMsg.style.display = 'block';
                            
                        } catch (error) {
                            console.error('Download error:', error);
                            alert('Error downloading image: ' + error.message);
                            btn.textContent = '📥 Download High-Res';
                            btn.disabled = false;
                        }
                    }
                </script>
            </body>
            </html>
        `;
        
        res.send(downloadPageHTML);
        
    } catch (error) {
        console.error('Error processing download page:', error);
        res.status(500).send('Server error');
    }
});

// API endpoint to get download data
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
        
        // Get order data
        const ordersFile = await readOrdersData();
        const order = ordersFile.orders.find(o => o.orderId === orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        // Return order data with images
        res.json({
            success: true,
            orderId,
            items: order.order.items,
            expiresAt: download.expiresAt
        });
        
    } catch (error) {
        console.error('Error processing download:', error);
        res.status(500).json({ success: false, error: 'Failed to process download' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Modenlo API server running on port ${PORT}`);
    console.log(`Landing Page: http://localhost:${PORT}/`);
    console.log(`Modenlo Tool: http://localhost:${PORT}/framer.html`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`API: http://localhost:${PORT}/api/frames`);
    console.log(`\n📧 Email Configuration:`);
    console.log(`Set EMAIL_USER and EMAIL_PASS environment variables to enable email notifications`);
    console.log(`Set ADMIN_EMAIL environment variable to receive order notifications`);
});
