# Mount Selection Feature

## Overview

The Photo Framer application now includes a comprehensive mount selection system that allows users to choose from various mount options when ordering their framed photos. Mount prices are automatically added to the frame price to calculate the total cost.

## Features

### For Users (Main Application)

- **Mount Selector**: Dropdown menu with all available mount options
- **Price Breakdown**: Displays frame price and mount price separately
- **Total Price Calculation**: Automatically calculates and displays the combined total
- **No Mount Option**: Default option with $0.00 price (no additional cost)
- **Dynamic Loading**: Mount options are loaded from the backend API

### For Administrators (Admin Panel)

- **Mount Management Page**: Dedicated interface for managing mount options
- **Add New Mounts**: Create new mount options with custom pricing
- **Edit Mounts**: Update mount names, descriptions, and prices
- **Toggle Availability**: Enable/disable mounts without deleting them
- **Delete Mounts**: Remove mount options permanently
- **Navigation**: Easy switching between Frame and Mount management

## Default Mount Options

The system includes the following pre-configured mount options:

1. **No Mount** - $0.00
   - Standard frame without mount
   - Default selection

2. **Aluminium Alloy Mount** - $25.00
   - Premium aluminium alloy mount for modern look

3. **Aluminium Shadow Mount** - $35.00
   - Aluminium mount with shadow effect for depth

4. **Natural Wood Mount** - $30.00
   - Classic natural wood mount finish

5. **Black Wood Mount** - $30.00
   - Elegant black stained wood mount

6. **Clear Acrylic Mount** - $40.00
   - Modern clear acrylic floating mount

## How It Works

### Frontend (User Experience)

1. User uploads and positions their photo
2. Selects desired frame size from dropdown
3. Chooses mount option from mount selector
4. Price breakdown shows:
   - Frame price
   - Mount price
   - Total price (Frame + Mount)
5. User can download (if admin) or preview the framed photo

### Backend (Data Management)

- Mounts are stored in `server/data/mounts.json`
- Each mount has:
  - `id`: Unique identifier (e.g., "aluminium-alloy")
  - `name`: Display name (e.g., "Aluminium Alloy Mount")
  - `description`: Optional description
  - `price`: Mount price in USD
  - `available`: Boolean to enable/disable

### API Endpoints

#### Public Endpoints (User-facing)

```javascript
// Get all available mounts
GET /api/mounts
Response: {
  success: true,
  mounts: [
    {
      id: "no-mount",
      name: "No Mount",
      description: "Standard frame without mount",
      price: 0.00,
      available: true
    },
    // ... more mounts
  ]
}

// Get specific mount
GET /api/mounts/:id
Response: {
  success: true,
  mount: { /* mount object */ }
}
```

#### Admin Endpoints (Protected)

```javascript
// Get all mounts (including unavailable)
GET /api/admin/mounts
Headers: { 'x-session-id': 'session_id_here' }

// Add new mount
POST /api/admin/mounts
Body: {
  id: "wood-walnut",
  name: "Walnut Wood Mount",
  description: "Rich walnut finish",
  price: 35.00,
  available: true
}

// Update mount
PUT /api/admin/mounts/:id
Body: {
  name: "Updated Name",
  description: "Updated description",
  price: 40.00
}

// Delete mount
DELETE /api/admin/mounts/:id

// Toggle availability
PATCH /api/admin/mounts/:id/availability
Body: { available: true }
```

## Admin Panel Usage

### Accessing Mount Management

1. Navigate to `http://localhost:3000/admin.html`
2. Login with admin credentials
3. Click "Mount Management" tab in the navigation

### Adding a New Mount

1. Fill in the "Add New Mount Option" form:
   - **ID**: Unique identifier (lowercase, hyphen-separated, e.g., "wood-walnut")
   - **Name**: Display name for users (e.g., "Walnut Wood Mount")
   - **Description**: Optional description (e.g., "Rich walnut wood finish")
   - **Price**: Mount price in USD (e.g., 35.00)
2. Click "Add Mount Option"
3. Mount appears in the list below

### Editing a Mount

1. Find the mount in the list
2. Click "Edit" button
3. Update the desired fields in the modal
4. Click "Save Changes"

### Disabling/Enabling a Mount

1. Find the mount in the list
2. Click "Disable" to hide from users (or "Enable" to show)
3. Mount status updates immediately

### Deleting a Mount

1. Find the mount in the list
2. Click "Delete" button
3. Confirm deletion in the dialog
4. Mount is permanently removed

## Implementation Details

### File Structure

```
photo-framer/
├── server/
│   ├── data/
│   │   └── mounts.json          # Mount data storage
│   └── server.js                # Backend with mount endpoints
├── index.html                   # Main app with mount selector
├── script.js                    # Frontend logic with mount handling
├── admin-mounts.html            # Mount management page
├── admin-mounts-script.js       # Mount management logic
└── style.css                    # Updated styles for price display
```

### Key Code Components

**HTML (Mount Selector)**
```html
<div class="control-group">
    <label for="mountSelect">Mount Option:</label>
    <select id="mountSelect">
        <!-- Populated dynamically from API -->
    </select>
</div>

<div class="control-group price-display-group">
    <label>Total Price:</label>
    <div class="price-display">
        <span class="price-breakdown">
            Frame: <span id="framePriceDisplay">$0.00</span><br>
            Mount: <span id="mountPriceDisplay">$0.00</span>
        </span>
        <span class="total-price" id="totalPriceDisplay">$0.00</span>
    </div>
</div>
```

**JavaScript (Price Calculation)**
```javascript
function updatePriceDisplay() {
    const framePrice = FRAME_SIZES[state.frameSize].price;
    const mountPrice = MOUNT_OPTIONS[state.selectedMount].price;
    const totalPrice = framePrice + mountPrice;
    
    framePriceDisplay.textContent = `$${framePrice.toFixed(2)}`;
    mountPriceDisplay.textContent = `$${mountPrice.toFixed(2)}`;
    totalPriceDisplay.textContent = `$${totalPrice.toFixed(2)}`;
}
```

## Benefits

### For Business Owners

- **Increased Revenue**: Additional mount options provide upsell opportunities
- **Flexible Pricing**: Easily adjust mount prices without code changes
- **Product Management**: Add/remove mounts based on inventory or demand
- **Customer Choice**: Offer variety to meet different customer preferences

### For Customers

- **Customization**: Choose the perfect mount for their artwork
- **Transparency**: Clear price breakdown shows exactly what they're paying for
- **Quality Options**: Multiple mount materials and styles to choose from
- **No Commitment**: "No Mount" option available at no extra cost

## Future Enhancements

Potential improvements for the mount system:

1. **Mount Preview**: Visual representation of different mount styles
2. **Mount Combinations**: Suggest mount options based on frame size
3. **Mount Categories**: Organize mounts by material (wood, metal, acrylic)
4. **Bulk Pricing**: Discounts for ordering multiple frames with same mount
5. **Mount Images**: Upload images to show mount appearance
6. **Custom Mounts**: Allow users to request custom mount dimensions
7. **Mount Calculator**: Help users choose appropriate mount for their artwork
8. **Inventory Tracking**: Track mount stock levels

## Troubleshooting

### Mount Options Not Loading

**Issue**: Mount dropdown is empty or shows only "No Mount"

**Solutions**:
- Check if server is running: `http://localhost:3000/api/mounts`
- Verify `server/data/mounts.json` exists and is valid JSON
- Check browser console for API errors
- Ensure mounts are marked as `available: true`

### Price Not Updating

**Issue**: Total price doesn't change when selecting different mounts

**Solutions**:
- Clear browser cache and reload
- Check browser console for JavaScript errors
- Verify mount has a valid price in `mounts.json`
- Ensure `handleMountChange` function is properly attached

### Admin Panel Issues

**Issue**: Cannot add or edit mounts

**Solutions**:
- Verify admin authentication (check session in localStorage)
- Ensure server is running with authentication enabled
- Check browser console and server logs for errors
- Confirm API endpoints are accessible

## Testing

### Manual Testing Steps

1. **Test Mount Selection**:
   - Open `http://localhost:3000/`
   - Upload an image
   - Try selecting different mounts
   - Verify price updates correctly

2. **Test Price Calculation**:
   - Select a frame size
   - Select different mounts
   - Verify: Total = Frame Price + Mount Price
   - Check both $0 mounts and priced mounts

3. **Test Admin Management**:
   - Open `http://localhost:3000/admin-mounts.html`
   - Login as admin
   - Add a new mount
   - Edit existing mount
   - Disable/enable mounts
   - Delete a mount

4. **Test Availability**:
   - Disable a mount in admin panel
   - Reload main app
   - Verify disabled mount doesn't appear in dropdown

## Conclusion

The mount selection feature provides a professional, flexible system for offering mount options to customers. The combination of user-friendly interface, admin management tools, and dynamic pricing creates a complete solution that enhances both the customer experience and business operations.

For additional questions or support, refer to:
- `BACKEND_SETUP.md` for server configuration
- `AUTHENTICATION.md` for admin access details
- API documentation in `server/server.js`
