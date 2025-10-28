# Orientation Feature Documentation

## Overview
The photo framer app now includes a comprehensive orientation feature that allows users to select between portrait and landscape frame orientations. The app intelligently auto-detects the best orientation based on the uploaded photo's aspect ratio.

## Features Implemented

### 1. Orientation Selection UI
- Two interactive buttons for Portrait and Landscape modes
- Visual icons representing each orientation
- Active state highlighting for the currently selected orientation
- Positioned between Frame Size and Frame Style controls

### 2. Auto-Detection
- Automatically analyzes uploaded photos to determine optimal orientation
- **Portrait**: Selected when image height > width (aspect ratio < 1)
- **Landscape**: Selected when image width > height (aspect ratio > 1)
- Displays a helpful hint message when orientation is auto-detected
- Hint auto-fades after 3 seconds

### 3. Manual Override
- Users can manually switch between orientations at any time
- Clicking an orientation button:
  - Updates the frame preview immediately
  - Adjusts canvas dimensions
  - Resets zoom and position for optimal fit
  - Clears the auto-detection hint

### 4. Dynamic Frame Dimensions
- Frame sizes automatically adjust based on orientation:
  - **Portrait**: Standard dimensions (e.g., 8x10 = 2400x3000px)
  - **Landscape**: Swapped dimensions (e.g., 8x10 = 3000x2400px)
- All frame sizes (4x6, 5x7, 8x10, 11x14, 16x20, 18x24) support both orientations

### 5. Preview Updates
- Frame preview accurately reflects selected orientation
- Canvas resizes to match orientation
- Crop area adjusts automatically
- Visual feedback is immediate and smooth

### 6. Download Integration
- Downloaded images include the selected orientation
- Filename includes orientation (e.g., `framed-photo-8x10-landscape-1234567890.png`)
- Frame and matting properly sized for the chosen orientation

## User Experience Flow

1. **Upload Photo**
   - User uploads a photo via click or drag-and-drop
   - App analyzes photo aspect ratio
   - Auto-selects optimal orientation
   - Shows hint: "Landscape orientation detected and applied" or "Portrait orientation detected and applied"

2. **Review & Adjust**
   - User sees the preview with auto-selected orientation
   - Orientation buttons show current selection
   - User can manually switch if desired

3. **Fine-tune**
   - Frame size, style, zoom, and position all work with selected orientation
   - Switching orientation resets position/zoom for best fit

4. **Download**
   - Final image is exported with correct orientation
   - File naming clearly indicates the orientation used

## Technical Implementation

### State Management
```javascript
state = {
    // ... other properties
    orientation: 'portrait' // or 'landscape'
}
```

### Key Functions
- `getFrameDimensions(size, orientation)`: Returns appropriate width/height based on orientation
- `detectImageOrientation(img)`: Analyzes image and sets initial orientation
- `handleOrientationChange(orientation)`: Handles manual orientation switches
- `updateOrientationUI()`: Updates button active states
- `showOrientationHint(message)`: Displays auto-fade hints

### Responsive Design
- Orientation controls styled with gradient backgrounds when active
- Hover effects for better interactivity
- Icons clearly represent each orientation mode
- Works seamlessly on both desktop and mobile devices

## Benefits

1. **Smart Defaults**: Auto-detection means most users won't need to manually adjust
2. **Flexibility**: Manual override allows for creative choices
3. **Visual Clarity**: Icons and active states make the current selection obvious
4. **Seamless Integration**: Works perfectly with all existing features
5. **User Feedback**: Helpful hints guide users without being intrusive

## Future Enhancements (Potential)
- Add a "square" orientation option for 1:1 aspect ratio frames
- Remember user's last orientation preference
- Suggest optimal frame size based on photo dimensions
- Add keyboard shortcuts for quick orientation switching
