# UrbanSprout Logo Assets

## How to Upload Your Logo

### 1. Logo File Requirements
- **Format**: PNG, SVG, or JPG (PNG with transparency recommended)
- **Size**: Minimum 512x512px for best quality
- **Background**: Transparent background preferred
- **Aspect Ratio**: Square (1:1) or slightly rectangular works best

### 2. Upload Your Logo Files
Place your logo files in this directory with these names:

```
/client/src/assets/images/logo/
├── urbansprout-logo.png          # Main logo (used most places)
├── urbansprout-logo.svg          # Vector version (optional, for scalability)
├── urbansprout-logo-white.png    # White version (for dark backgrounds)
├── urbansprout-logo-small.png    # Small version (16x16 or 32x32 for favicons)
└── README.md                     # This file
```

### 3. Recommended Logo Sizes
- **Main Logo**: 512x512px or larger
- **Small Logo**: 32x32px (for small spaces)
- **Favicon**: 16x16px, 32x32px, 48x48px

### 4. Using the Logo Component

The Logo component is already created at `/client/src/components/Logo.jsx`

#### Basic Usage:
```jsx
import Logo from '../components/Logo';

// Simple logo
<Logo />

// Logo with text
<Logo showText={true} />

// Different sizes
<Logo size="sm" />   // Small
<Logo size="md" />   // Medium (default)
<Logo size="lg" />   // Large
<Logo size="xl" />   // Extra Large
```

#### Props:
- `size`: 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
- `showText`: boolean - shows "UrbanSprout" text next to logo
- `className`: additional CSS classes
- `variant`: 'default', 'white' (for different logo versions)

### 5. Current Locations Using Emojis (🌱, 🌿)

Your logo will replace emojis in these files:
- Chatbot (Sprouty header)
- Dashboard pages
- Landing page
- Navigation bars
- Loading screens
- Plant suggestion pages
- Profile pages

### 6. After Uploading Your Logo

1. Place your logo file as `urbansprout-logo.png` in this directory
2. The Logo component will automatically use it
3. If the logo file is missing, it will fallback to the 🌱 emoji
4. Update the favicon in `/client/public/` with your small logo

### 7. Favicon Update

To update the website favicon:
1. Create a 32x32px version of your logo
2. Save it as `favicon.ico` in `/client/public/`
3. Or use PNG: save as `favicon.png` and update `index.html`

### 8. Testing Your Logo

After uploading:
1. Restart the development server (`npm run dev`)
2. Check these pages to see your logo:
   - Dashboard (http://localhost:5174/dashboard)
   - Landing page (http://localhost:5174/)
   - Chatbot (click the floating chat button)

## Need Help?

If you need to customize the logo further or have issues:
1. Check the browser console for any image loading errors
2. Ensure your logo file path matches exactly: `urbansprout-logo.png`
3. Try different image formats (PNG, SVG, JPG)
4. Make sure the file size isn't too large (< 1MB recommended)

