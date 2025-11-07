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

// Admin credentials (in production, use environment variables and hashed passwords)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // Change this in production!

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
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
    console.log(`Modenlo API server running on port ${PORT}`);
    console.log(`Landing Page: http://localhost:${PORT}/`);
    console.log(`Modenlo Tool: http://localhost:${PORT}/framer.html`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`API: http://localhost:${PORT}/api/frames`);
    console.log(`\n📧 Email Configuration:`);
    console.log(`Set EMAIL_USER and EMAIL_PASS environment variables to enable email notifications`);
    console.log(`Set ADMIN_EMAIL environment variable to receive order notifications`);
});
