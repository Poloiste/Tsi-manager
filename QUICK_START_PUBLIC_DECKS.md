# Quick Start Guide - Public Decks Feature

## Prerequisites
- Node.js and npm installed
- Supabase account and project
- Database credentials

## Setup Steps

### 1. Database Setup

Run the migration file in your Supabase SQL editor:

```sql
-- Copy and paste the entire content from:
database/migrations/add_public_decks_tables.sql
```

Or via CLI:
```bash
psql -h your-db-host \
     -U your-db-user \
     -d your-db-name \
     -f database/migrations/add_public_decks_tables.sql
```

### 2. Environment Variables

Create `.env` file in `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install Dependencies

```bash
cd frontend
npm install
```

### 4. Run Development Server

```bash
npm start
```

The app will open at http://localhost:3000

### 5. Test the Feature

1. **Create an account** or log in
2. **Create a course** with some flashcards:
   - Go to "📚 Cours" tab
   - Click "Ajouter un cours"
   - Add subject, chapter, and content
   - Add several flashcards

3. **Publish a deck**:
   - Go to "🌐 Communauté" tab
   - Click "📤 Publier un deck"
   - Select your course
   - Fill in title, description, category, and tags
   - Accept terms and publish

4. **Browse public decks**:
   - Stay on "🌐 Communauté" tab
   - Use search bar to find decks
   - Filter by category
   - Sort by newest, rating, or downloads

5. **Import a deck**:
   - Click "👁️ Aperçu" on any deck
   - Review the details and preview cards
   - Click "📥 Importer ce deck"
   - Check "📚 Cours" tab to see imported course

6. **Rate and like**:
   - Open deck details
   - Click stars to rate (1-5)
   - Optionally write a review
   - Click "Envoyer ma note"
   - Click heart icon to like

7. **Manage your decks**:
   - Go to "🌐 Communauté" tab
   - Click "📤 Mes decks" button
   - View your published decks with stats

## Troubleshooting

### Issue: "Supabase credentials not configured"
**Solution**: Make sure `.env` file exists and contains valid credentials

### Issue: Build fails
**Solution**: Run `npm install` again to ensure all dependencies are installed

### Issue: No decks visible
**Solution**: 
- Check that database migration was run successfully
- Verify Supabase RLS policies are active
- Try publishing a deck first to test

### Issue: Import fails
**Solution**: 
- Check browser console for errors
- Verify user is logged in
- Ensure the course has flashcards

### Issue: Cannot rate/like
**Solution**:
- Verify user is logged in
- Check Supabase RLS policies for deck_ratings and deck_likes tables

## Development Notes

### Hot Reload
The development server supports hot reload. Changes to React components will reflect immediately.

### Database Changes
If you modify the database schema, you'll need to:
1. Update the migration file
2. Re-run the migration
3. Update relevant components/hooks

### Adding New Categories
To add new categories:
1. Update `categories` array in `PublicLibrary.js`
2. Update `getCategoryColor` function in `DeckCard.js`
3. Update `categoryBadgeColor` function in `DeckCard.js`

### Customizing Colors
Category colors are defined in:
- `DeckCard.js` - `getCategoryColor()` and `categoryBadgeColor()`
- `DeckDetail.js` - `getCategoryColor()`

## Production Deployment

### Build for Production

```bash
cd frontend
npm run build
```

This creates an optimized build in the `build/` directory.

### Deploy

You can deploy the build folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

### Environment Variables (Production)

Make sure to set these in your hosting platform:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## API Usage

The `usePublicDecks` hook provides these functions:

```javascript
const {
  publicDecks,           // Array of all public decks
  myPublishedDecks,      // Array of user's published decks
  isLoading,             // Loading state
  error,                 // Error message if any
  loadPublicDecks,       // Load decks with filters
  searchDecks,           // Search by query
  publishDeck,           // Publish a course
  unpublishDeck,         // Remove published deck
  downloadDeck,          // Import a deck
  rateDeck,              // Rate with stars + review
  likeDeck,              // Toggle like/unlike
  hasLiked,              // Check if liked
  getDeckReviews         // Get all reviews
} = usePublicDecks(userId);
```

## Database Schema Quick Reference

### Main Tables
- `public_decks` - Published decks metadata
- `deck_ratings` - User ratings and reviews (1-5 stars)
- `deck_downloads` - Download tracking
- `deck_likes` - Like tracking

### Key Fields
- `public_decks.category` - One of 8 categories
- `public_decks.tags` - Array of up to 5 tags
- `public_decks.average_rating` - Auto-calculated average
- `public_decks.download_count` - Auto-updated count
- `public_decks.like_count` - Auto-updated count

## Support

For issues or questions:
1. Check the implementation documentation: `PUBLIC_DECKS_IMPLEMENTATION.md`
2. Review the visual guide: `PUBLIC_DECKS_VISUAL_GUIDE.md`
3. Check browser console for errors
4. Review Supabase dashboard for database issues

## Next Features (Future)

Potential enhancements:
- Edit published decks
- Deck comments
- Featured/trending section
- User profiles
- Deck collections
- Export to PDF
- Collaborative decks
- Report system
