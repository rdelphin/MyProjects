# Admin Order View Details Button Fix

## Issue
The "View Details" button in the Admin Orders tab became unresponsive when viewing orders containing items without a mount option selected.

## Root Cause
When rendering order details, the code attempted to:
1. Display `item.mountName` which could be undefined/null for items without mounts
2. Call `.toFixed(2)` on `item.mountPrice` which could be undefined/null
3. Display orientation without a fallback value

This caused JavaScript errors that prevented the modal from opening, making the button appear unresponsive.

## Solution
Modified the `viewOrder()` function in `admin-orders-script.js` to:

1. **Check for mount selection status:**
   ```javascript
   const hasMountSelected = item.mountName && 
                            item.mountName !== 'No Mount' && 
                            item.mountName !== 'None';
   ```

2. **Conditionally render mount information:**
   - If mount is selected: Display mount name and price
   - If no mount: Display "No Mount Selected" message
   - Only show mount price row if mount exists and has a price > 0

3. **Add fallback values:**
   - `item.orientation || 'portrait'` - defaults to portrait if undefined
   - `(item.framePrice || 0).toFixed(2)` - prevents errors on undefined prices
   - `(item.totalPrice || 0).toFixed(2)` - prevents errors on undefined totals

## Changes Made

### File: `admin-orders-script.js`

**Before:**
```javascript
specsHTML = `
    <div class="spec-row">
        <strong>Mount:</strong>
        <span>${item.mountName}</span>
    </div>
    <div class="spec-row">
        <strong>Mount Price:</strong>
        <span>$${item.mountPrice.toFixed(2)}</span>
    </div>
`;
```

**After:**
```javascript
const hasMountSelected = item.mountName && 
                         item.mountName !== 'No Mount' && 
                         item.mountName !== 'None';

specsHTML = `
    ${hasMountSelected ? `
        <div class="spec-row">
            <strong>Mount:</strong>
            <span>${item.mountName}</span>
        </div>
    ` : `
        <div class="spec-row">
            <strong>Mount:</strong>
            <span>No Mount Selected</span>
        </div>
    `}
    ${hasMountSelected && item.mountPrice > 0 ? `
        <div class="spec-row">
            <strong>Mount Price:</strong>
            <span>$${item.mountPrice.toFixed(2)}</span>
        </div>
    ` : ''}
`;
```

## Testing
The fix ensures the button works reliably for:
- ✅ Orders with regular frames and mounts selected
- ✅ Orders with frames but no mount selected
- ✅ Orders with clock products (which don't use mounts)
- ✅ Mixed orders containing both types
- ✅ Orders with missing or undefined orientation values
- ✅ Orders with missing price information

## Impact
- No breaking changes to existing functionality
- Backward compatible with all existing orders
- Improved error handling and user experience
- Clear indication when mounts are not selected

## Date Fixed
November 10, 2025
