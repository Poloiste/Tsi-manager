# Build and Deployment Guide

This guide provides instructions for building and deploying the TSI Manager application.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Project Structure

```
Tsi-manager/
├── frontend/          # React frontend application
│   ├── src/          # Source files
│   ├── public/       # Public assets
│   └── package.json  # Frontend dependencies
├── build/            # Production build output (generated)
├── package.json      # Root package.json for build scripts
└── vercel.json       # Vercel deployment configuration
```

## Development Setup

### 1. Install Dependencies

From the root directory:

```bash
npm run install:frontend
```

This installs all frontend dependencies including:
- React and React DOM
- Tailwind CSS (production build, not CDN)
- PostCSS and Autoprefixer
- Supabase client
- Socket.io client
- Other dependencies

### 2. Start Development Server

```bash
npm start
```

This starts the React development server at `http://localhost:3000`.

## Production Build

### Build the Application

From the root directory:

```bash
npm run build
```

This command:
1. Navigates to the `frontend` directory
2. Runs `react-scripts build` with `BUILD_PATH=../build`
3. Generates optimized production files in the `build/` directory
4. Processes Tailwind CSS through PostCSS
5. Creates minified JS and CSS bundles with content hashes

### Build Output

The build process generates:
- `build/index.html` - Main HTML file
- `build/static/js/` - JavaScript bundles with content hashes
- `build/static/css/` - CSS bundles with Tailwind utilities and custom styles
- `build/static/media/` - Images and other media assets

Content hashes ensure proper cache busting (e.g., `main.cd67f546.css`).

## Tailwind CSS Configuration

The application uses **production-ready Tailwind CSS** (NOT the CDN version):

### Configuration Files

1. **`frontend/tailwind.config.js`** - Tailwind configuration
   ```js
   module.exports = {
     content: ["./src/**/*.{js,jsx,ts,tsx}"],
     theme: { extend: {} },
     plugins: [],
   }
   ```

2. **`frontend/postcss.config.js`** - PostCSS configuration
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

3. **`frontend/src/index.css`** - Tailwind directives
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### Benefits of Production Tailwind

- ✅ Smaller bundle size (only used utilities are included)
- ✅ No runtime compilation overhead
- ✅ Better performance
- ✅ Works offline
- ✅ Consistent styling across environments

## API Error Handling

The application includes robust API error handling:

### Features

1. **Content-Type Validation** - Checks if response is JSON before parsing
2. **HTML Error Detection** - Handles cases where API returns HTML error pages
3. **Request/Response Logging** - Logs API calls in development mode
4. **Error Context** - Provides detailed error messages with context

### API Helper Utilities (`frontend/src/utils/apiHelpers.js`)

- `fetchJson()` - Fetches and parses JSON with error handling
- `fetchWithLogging()` - Wraps fetch with logging
- `safeJsonParse()` - Safely parses JSON, handles non-JSON responses
- `handleApiError()` - Standardizes error handling
- `logApiRequest()` / `logApiResponse()` - Development logging

### Usage Example

```javascript
import { fetchJson } from '../utils/apiHelpers';

const data = await fetchJson(
  `${API_URL}/endpoint`,
  { method: 'GET' },
  'ComponentName.functionName'
);
```

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment via `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm run install:frontend",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Deployment Steps

1. Connect repository to Vercel
2. Vercel automatically runs:
   - `npm run install:frontend` - Installs dependencies
   - `npm run build` - Builds the application
3. Deploys contents of `build/` directory
4. Sets up routing (SPA rewrites to index.html)

### Environment Variables

Set these in your deployment environment:

- `REACT_APP_API_URL` - Backend API URL (optional, defaults to `http://localhost:3000/api`)
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key

### Manual Deployment

For other hosting platforms:

1. Build the application: `npm run build`
2. Deploy the `build/` directory to your hosting service
3. Configure server to redirect all routes to `index.html` (for SPA routing)
4. Set environment variables

## Troubleshooting

### Build Failures

**"Unexpected token '<'" Error**
- This occurs when API returns HTML instead of JSON
- Fixed with new API error handling utilities
- Check API endpoint URLs and ensure they return JSON

**"cdn.tailwindcss.com" Reference**
- Ensure you've removed the CDN script from `public/index.html`
- Verify Tailwind CSS is installed: `npm list tailwindcss`

**Missing CSS in Production**
- Verify `index.css` includes Tailwind directives
- Check `tailwind.config.js` content paths
- Ensure PostCSS is processing the CSS

### Static Asset 404s

**Missing CSS/JS Files**
- Ensure `BUILD_PATH=../build` is set in build script
- Verify `outputDirectory` in `vercel.json` is correct
- Check that asset paths in `index.html` are absolute (starting with `/`)

### Development Issues

**Styles Not Updating**
- Restart development server
- Clear browser cache
- Verify Tailwind classes are in configured content paths

**API Errors**
- Check browser console for detailed error logs
- Verify API URL configuration
- Ensure backend is running and accessible

## Testing the Build

To test the production build locally:

```bash
# Build the application
npm run build

# Install serve globally (if not already installed)
npm install -g serve

# Serve the build directory
serve -s build

# Open http://localhost:3000 in your browser
```

## Cache Busting

The build process automatically:
- Generates unique hashes for JS and CSS files
- Updates references in `index.html`
- Ensures browsers fetch latest versions

Example: `main.cd67f546.css` (hash changes when content changes)

## Best Practices

1. **Always build before deploying** - Don't deploy source files
2. **Test production builds locally** - Use `serve -s build`
3. **Monitor build output** - Check file sizes and warnings
4. **Update dependencies regularly** - Keep packages up to date
5. **Use environment variables** - Don't hardcode API URLs
6. **Enable compression** - Gzip/Brotli on your hosting platform

## Support

For issues or questions:
- Check the browser console for error details
- Review API logs for backend issues
- Verify environment variables are set correctly
- Ensure all dependencies are installed
