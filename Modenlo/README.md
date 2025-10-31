# Modenlo App

A web application that allows users to upload photos, choose frame sizes, zoom and crop images, preview them in mock frames, and download print-ready framed images.

## Features

- **Photo Upload**: Click to upload or drag and drop images
- **Frame Sizes**: Choose from standard print sizes (4x6, 5x7, 8x10, 11x14, 16x20, 18x24 inches)
- **Frame Styles**: Select from 5 different frame styles (Black Wood, White Wood, Gold, Silver, Natural Wood)
- **Zoom Control**: Zoom from 100% to 300% to perfectly fit your image
- **Drag to Position**: Click and drag the image to position it within the frame
- **Live Preview**: See exactly how your framed photo will look
- **Print-Ready Download**: Downloads high-resolution images at 300 DPI suitable for professional printing

## How to Use

1. **Open the App**: Simply open `index.html` in a web browser
2. **Upload a Photo**: Click the upload area or drag and drop an image file
3. **Choose Frame Size**: Select your desired frame size from the dropdown
4. **Select Frame Style**: Pick a frame style that matches your decor
5. **Adjust the Image**:
   - Use the zoom slider to resize the image
   - Click and drag on the image to reposition it
   - Click "Reset Position" to return to default settings
6. **Download**: Click "Download Framed Photo" to save your print-ready image

## Technical Details

- **Resolution**: All downloads are generated at 300 DPI for professional print quality
- **File Format**: PNG format with transparency support
- **Browser Support**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **No Server Required**: Completely client-side application - runs directly in your browser

## File Structure

```
Modenlo/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive design
├── script.js       # Application logic and image processing
└── README.md       # This file
```

## Features Breakdown

### Upload Methods
- Click to browse files
- Drag and drop support
- Accepts all common image formats (JPG, PNG, GIF, etc.)

### Frame Customization
- Multiple standard photo frame sizes
- 5 realistic frame styles with gradient effects
- Frame borders automatically added to final output

### Image Controls
- Smooth zoom functionality (100-300%)
- Drag-to-position with mouse or touch
- Reset button to restore default positioning
- Touch screen compatible for mobile devices

### Download Quality
- High-resolution output (300 DPI)
- Frame dimensions in actual print inches
- Professional-grade PNG files
- Unique timestamped filenames

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## Future Enhancements

Potential features for future versions:
- Additional frame styles and colors
- Custom frame size input
- Rotation controls
- Filters and effects
- Save/load project state
- Batch processing multiple images

## License

Free to use and modify.
