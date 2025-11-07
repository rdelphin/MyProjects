# Dynamic Categories Feature

## Overview

The Shop by Category section on the index page now loads dynamically from a backend API, allowing easy management of product categories through the admin panel.

## Features

- **Dynamic Loading**: Categories are fetched from the server at page load
- **Admin Management**: Full CRUD operations available through the API
- **Ordering**: Categories display in a configurable order
- **Active/Inactive Toggle**: Show or hide categories without deleting them
- **Consistent Layout**: Maintains the existing design and functionality

## Data Structure

Categories are stored in `server/data/categories.json` with the following structure:

```json
{
  "categories": [
    {
      "id": "unique-id",
      "name": "Category Name",
      "description": "Category description text",
      "startingPrice": "$15.99",
      "image": "images/category-image.jpg",
      "link": "category-page.html",
      "order": 1,
      "active": true
    }
  ]
}
```

### Field Descriptions

- **id**: Unique identifier for the category (required)
- **name**: Display name of the category (required)
- **description**: Brief description shown on the card (required)
- **startingPrice**: Starting price text (optional, defaults to "$0.00")
- **image**: Path to category image (optional, defaults to placeholder)
- **link**: URL to category page (optional, defaults to "{id}.html")
- **order**: Display order (optional, defaults to current count + 1)
- **active**: Whether to show the category (optional, defaults to true)

## API Endpoints

### Public Endpoints

**GET /api/categories**
- Returns all active categories, sorted by order
- No authentication required
- Used by the frontend to display categories

```javascript
// Example response
{
  "success": true,
  "categories": [
    {
      "id": "wall-displays",
      "name": "Wall Displays",
      "description": "Transform your favorite photos...",
      "startingPrice": "$15.99",
      "image": "images/wall-display01.jpg",
      "link": "wall-displays.html",
      "order": 1,
      "active": true
    }
  ]
}
```

### Admin Endpoints

All admin endpoints require authentication via session.

**GET /api/admin/categories**
- Returns all categories (including inactive)
- Requires admin authentication

**POST /api/admin/categories**
- Creates a new category
- Required fields: id, name, description
- Optional fields: startingPrice, image, link, order, active

```javascript
// Example request body
{
  "id": "custom-frames",
  "name": "Custom Frames",
  "description": "Create your own unique frame design",
  "startingPrice": "$29.99",
  "image": "images/custom-frames.jpg",
  "link": "custom-frames.html",
  "order": 3,
  "active": true
}
```

**PUT /api/admin/categories/:id**
- Updates an existing category
- All fields are optional
- Categories are re-sorted by order after update

**DELETE /api/admin/categories/:id**
- Permanently deletes a category
- Returns the deleted category data

**PATCH /api/admin/categories/:id/availability**
- Toggles a category's active status
- Request body: `{ "active": true/false }`

## Frontend Implementation

The categories are loaded dynamically in `landing-script.js`:

```javascript
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        const data = await response.json();
        const categories = data.categories || [];
        
        if (categories && categories.length > 0) {
            categoriesGrid.innerHTML = categories.map(category => `
                <a href="${category.link}" class="category-new-card">
                    <!-- Category card HTML -->
                </a>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesGrid.innerHTML = '<div class="loading">Unable to load categories</div>';
    }
}
```

## Managing Categories

### Adding a New Category

1. **Via API** (requires admin authentication):
```bash
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{
    "id": "new-category",
    "name": "New Category",
    "description": "Description of the new category",
    "startingPrice": "$19.99",
    "image": "images/new-category.jpg",
    "link": "new-category.html"
  }'
```

2. **Via categories.json** (direct file edit):
- Open `server/data/categories.json`
- Add new category object to the array
- Restart the server

### Updating a Category

**Via API**:
```bash
curl -X PUT http://localhost:3000/api/admin/categories/wall-displays \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{
    "startingPrice": "$12.99",
    "description": "Updated description"
  }'
```

### Hiding/Showing a Category

**Via API**:
```bash
curl -X PATCH http://localhost:3000/api/admin/categories/wall-displays/availability \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{ "active": false }'
```

### Deleting a Category

**Via API**:
```bash
curl -X DELETE http://localhost:3000/api/admin/categories/wall-displays \
  -H "x-session-id: YOUR_SESSION_ID"
```

## Best Practices

1. **Image Optimization**: Use optimized images for faster loading
2. **Consistent Sizing**: Keep category images similar in aspect ratio
3. **Order Management**: Use order values with gaps (10, 20, 30) to allow easy insertions
4. **Inactive vs Delete**: Use inactive status instead of deleting to preserve data
5. **Backup**: Always backup `categories.json` before making direct edits

## Troubleshooting

### Categories Not Loading

1. Check if the server is running: `http://localhost:3000/api/categories`
2. Check browser console for errors
3. Verify `categories.json` exists and has valid JSON

### Categories Not Updating

1. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)
2. Check server logs for errors
3. Verify the API response includes your changes

### Images Not Showing

1. Verify image paths are correct relative to the project root
2. Check that images exist in the specified location
3. Ensure images are web-compatible formats (jpg, png, webp)

## Future Enhancements

Potential improvements for the categories feature:

- Admin UI for category management
- Image upload functionality
- Category templates
- Analytics tracking per category
- A/B testing support
- Seasonal category highlighting
- Category-specific promotions

## Integration with Existing Features

The categories feature integrates seamlessly with:

- **Admin Panel**: Can be extended to include category management UI
- **Pricing System**: Categories link to product pages with pricing
- **Mount Options**: Categories lead to pages showing available mount options
- **Analytics**: Category clicks can be tracked for insights
