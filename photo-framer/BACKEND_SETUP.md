# Photo Framer Backend Setup & Documentation

## Overview

The Photo Framer application now includes a Node.js/Express backend API that enables:
- Dynamic frame size management
- Price configuration per frame size
- Admin panel for managing available frames
- Automatic frontend updates without code changes

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Navigate to the server directory:
```bash
cd photo-framer/server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Public Endpoints (For Users)

#### Get All Available Frames
```
GET /api/frames
```

Returns all frames where `available: true`

**Response:**
```json
{
  "success": true,
  "frames": [
    {
      "id": "8x10",
      "size": "8x10",
      "width": 2400,
      "height": 3000,
      "price": 29.99,
      "available": true
    }
  ]
}
```

#### Get Specific Frame
```
GET /api/frames/:id
```

Returns a single frame by ID if available.

### Admin Endpoints

#### Get All Frames (Including Unavailable)
```
GET /api/admin/frames
```

Returns all frames regardless of availability status.

#### Add New Frame
```
POST /api/admin/frames
```

**Request Body:**
```json
{
  "size": "12x16",
  "width": 3600,
  "height": 4800,
  "price": 45.99,
  "available": true
}
```

**Response:**
```json
{
  "success": true,
  "frame": { /* created frame object */ }
}
```

#### Update Frame
```
PUT /api/admin/frames/:id
```

**Request Body (all fields optional):**
```json
{
  "width": 3600,
  "height": 4800,
  "price": 49.99,
  "available": true
}
```

#### Delete Frame
```
DELETE /api/admin/frames/:id
```

Permanently removes a frame size from the system.

#### Toggle Frame Availability
```
PATCH /api/admin/frames/:id/availability
```

**Request Body:**
```json
{
  "available": false
}
```

Quick way to enable/disable a frame without deleting it.

## Admin Panel

Access the admin panel at: `http://localhost:3000/admin.html`

### Features

1. **Add New Frame Sizes**
   - Enter size (e.g., "12x16")
   - Specify width and height in pixels at 300 DPI
   - Set price
   - Frame is automatically marked as available

2. **Edit Existing Frames**
   - Click "Edit" on any frame
   - Modify dimensions or price
   - Changes are immediate

3. **Toggle Availability**
   - Enable/Disable frames without deleting them
   - Disabled frames won't show in the user interface

4. **Delete Frames**
   - Permanently remove frame sizes
   - Confirmation required

## Data Storage

Frame data is stored in `/server/data/frames.json`

**Example:**
```json
{
  "frames": [
    {
      "id": "8x10",
      "size": "8x10",
      "width": 2400,
      "height": 3000,
      "price": 29.99,
      "available": true
    }
  ]
}
```

### Frame Size Specifications

Dimensions should be in pixels at 300 DPI:
- 4x6" = 1200 x 1800 pixels
- 5x7" = 1500 x 2100 pixels
- 8x10" = 2400 x 3000 pixels
- 11x14" = 3300 x 4200 pixels
- 16x20" = 4800 x 6000 pixels
- 18x24" = 5400 x 7200 pixels

Formula: `pixels = inches × 300`

## Frontend Integration

The frontend automatically:
1. Loads frame sizes from the API on page load
2. Populates the dropdown with sizes and prices
3. Updates the price display when frame size changes
4. Falls back to hardcoded frames if API is unavailable

### Fallback Behavior

If the API server is not running, the application will:
- Use hardcoded default frames
- Display a console warning
- Continue to function normally

## Troubleshooting

### Server Won't Start

**Error: Port 3000 already in use**
```bash
# Change port in server/server.js or kill the process using port 3000
```

**Error: Cannot find module**
```bash
# Reinstall dependencies
cd server
npm install
```

### API Not Responding

1. Verify server is running: `http://localhost:3000/api/frames`
2. Check console for errors
3. Ensure CORS is properly configured

### Admin Panel Issues

1. Clear browser cache
2. Check browser console for errors
3. Verify server is running on port 3000

## Development

### Adding New Features

The backend is built with Express.js and uses:
- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `body-parser`: Parse JSON request bodies

### File Structure

```
server/
├── package.json       # Dependencies and scripts
├── server.js          # Main server file with all routes
└── data/
    └── frames.json    # Frame data storage
```

### Best Practices

1. **Always validate input** when adding/updating frames
2. **Backup frames.json** before making manual changes
3. **Use the admin panel** instead of editing JSON directly
4. **Test changes** in development before production

## Security Considerations

**Current Implementation:**
- No authentication (suitable for localhost/development)
- No input sanitization beyond basic validation
- Direct file system access

**For Production:**
- Add authentication to admin endpoints
- Implement input validation/sanitization
- Use a proper database (MongoDB, PostgreSQL, etc.)
- Add rate limiting
- Enable HTTPS
- Add request logging

## Future Enhancements

Potential improvements:
- Database integration (PostgreSQL, MongoDB)
- User authentication & authorization
- Order management system
- Image upload to server
- Payment processing integration
- Inventory management
- Analytics dashboard

## Support

For issues or questions:
1. Check server console for error messages
2. Review browser console for frontend errors
3. Verify API endpoints with tools like Postman
4. Ensure Node.js and npm are up to date
