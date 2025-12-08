# Public Decks & Community Sharing Feature

## Overview

The Public Decks feature allows users to share their flashcard decks with the TSI Manager community. Users can publish decks, browse the public library, import decks created by others, and rate/review shared content.

## Features

### 1. Publishing Decks

Users can publish any of their courses as a public deck:

- **Title & Description**: Customize how the deck appears to others
- **Category**: Organize decks by subject (Mathématiques, Physique, Chimie, SI, Informatique, Anglais, Français)
- **Tags**: Add up to 5 tags for better discoverability
- **Preview**: See which flashcards will be included before publishing
- **Terms Acceptance**: Users must agree to share content appropriately

#### How to Publish

1. Navigate to the **🌐 Communauté** tab
2. Click **📤 Publier un deck**
3. Select a course that contains flashcards
4. Fill in the deck information (title, description, category, tags)
5. Accept the sharing terms
6. Click **Publier**

### 2. Browsing Public Library

The public library provides a rich browsing experience:

- **Search**: Find decks by title or description
- **Filters**: 
  - Category filter (All, Mathématiques, Physique, etc.)
  - Sort options (Popular, Recent, Rating, Downloads)
- **Deck Cards**: Each deck shows:
  - Category badge
  - Title and author
  - Description
  - Stats (cards count, rating, downloads)
  - Preview and Import buttons

#### Sort Options

- **Plus populaires**: Sorted by number of likes
- **Plus récents**: Newest decks first
- **Mieux notés**: Highest average rating first
- **Plus téléchargés**: Most downloaded decks first

### 3. Deck Details

Click **Aperçu** on any deck to see detailed information:

- Full description
- Author information and publish date
- Detailed statistics (cards, rating, downloads, likes)
- Preview of 3-5 flashcards
- All user reviews and ratings
- Like button
- Import button

### 4. Importing Decks

Import any public deck into your personal collection:

1. Find a deck you want to import
2. Click **📥 Importer** (or **Importer ce deck** in detail view)
3. The deck is copied as a new course in your collection
4. All flashcards are duplicated with attribution to the original author
5. Download counter is incremented

**Note**: You can only import each deck once per account.

### 5. Rating & Reviewing

Share your feedback on imported decks:

- **Star Rating**: Rate from 1 to 5 stars
- **Written Review**: Optional text review
- **Update**: Modify your rating/review anytime
- **View Reviews**: See what others think about the deck

### 6. Likes

Show appreciation for quality decks:

- Click the ❤️ button to like a deck
- Click again to unlike
- Likes are public and count toward deck popularity

### 7. Managing Your Published Decks

View and manage your published decks in the **📚 Mes decks publiés** section:

- See status (Active/Inactive)
- View statistics (cards, rating, downloads)
- Preview your published decks
- Unpublish decks (removes from public library, doesn't delete your course)

## Technical Architecture

### Database Schema

#### public_decks
```sql
- id: UUID (primary key)
- title: TEXT
- description: TEXT
- category: TEXT
- author_id: UUID (references users)
- author_name: TEXT
- cards_count: INTEGER
- downloads_count: INTEGER
- likes_count: INTEGER
- average_rating: DECIMAL(3,2)
- ratings_count: INTEGER
- tags: TEXT[]
- source_course_id: UUID
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

#### deck_ratings
```sql
- id: UUID (primary key)
- deck_id: UUID (references public_decks)
- user_id: UUID (references users)
- rating: INTEGER (1-5)
- review: TEXT
- created_at, updated_at: TIMESTAMP
- UNIQUE(deck_id, user_id)
```

#### deck_downloads
```sql
- id: UUID (primary key)
- deck_id: UUID (references public_decks)
- user_id: UUID (references users)
- imported_course_id: UUID
- downloaded_at: TIMESTAMP
- UNIQUE(deck_id, user_id)
```

#### deck_likes
```sql
- id: UUID (primary key)
- deck_id: UUID (references public_decks)
- user_id: UUID (references users)
- created_at: TIMESTAMP
- UNIQUE(deck_id, user_id)
```

#### deck_flashcards
```sql
- id: UUID (primary key)
- deck_id: UUID (references public_decks)
- flashcard_id: UUID (references shared_flashcards)
- position: INTEGER
- created_at: TIMESTAMP
- UNIQUE(deck_id, flashcard_id)
```

### Components

#### usePublicDecks Hook
Location: `frontend/src/hooks/usePublicDecks.js`

Main functions:
- `loadPublicDecks(filters)` - Load public decks with filtering
- `searchDecks(query)` - Search decks by title/description
- `publishDeck(courseId, metadata)` - Publish a course as a deck
- `unpublishDeck(deckId)` - Unpublish a deck
- `downloadDeck(deckId)` - Import a deck
- `rateDeck(deckId, rating, review)` - Rate a deck
- `likeDeck(deckId)` - Like/unlike a deck
- `loadMyPublishedDecks()` - Load user's published decks

#### PublicLibrary Component
Location: `frontend/src/components/PublicLibrary.js`

Features:
- Search bar with live search
- Category and sort filters
- Grid display of deck cards
- Empty states and loading states

#### DeckCard Component
Location: `frontend/src/components/DeckCard.js`

Displays:
- Category badge
- Title and author
- Description
- Statistics
- Preview and Import buttons

#### DeckDetail Component
Location: `frontend/src/components/DeckDetail.js`

Displays:
- Complete deck information
- Flashcard previews
- Rating interface
- Reviews list
- Like button
- Import button

#### PublishDeckModal Component
Location: `frontend/src/components/PublishDeckModal.js`

Form fields:
- Title (required)
- Description
- Category (required)
- Tags (up to 5)
- Terms acceptance (required)
- Flashcard preview

### Security

#### Row Level Security (RLS)

All tables have RLS enabled with policies:

**public_decks**:
- SELECT: Anyone can view active decks
- INSERT: Authenticated users can create decks
- UPDATE/DELETE: Only deck authors

**deck_ratings**:
- SELECT: Anyone can view ratings
- INSERT/UPDATE/DELETE: Only rating authors

**deck_downloads**:
- SELECT: Users can see their own downloads
- INSERT: Authenticated users can download

**deck_likes**:
- SELECT: Anyone can view likes
- INSERT/DELETE: Only like owners

#### Data Validation

- Ratings must be between 1 and 5
- Users can only rate/download each deck once
- Users can only publish courses they own
- Published decks require terms acceptance

### Database Triggers

#### Auto-update Statistics

Three triggers automatically maintain deck statistics:

1. **Rating Stats**: Updates `average_rating` and `ratings_count` when ratings change
2. **Likes Count**: Updates `likes_count` when users like/unlike
3. **Downloads Count**: Increments `downloads_count` when decks are imported

## User Flow Examples

### Publishing a Deck

```
1. User clicks "📤 Publier un deck"
2. System shows list of courses with flashcard counts
3. User selects a course
4. Form appears with pre-filled title
5. User fills description, selects category, adds tags
6. User accepts terms
7. System creates public_deck entry
8. System links flashcards via deck_flashcards table
9. Success message appears
10. Deck appears in "Mes decks publiés"
```

### Importing a Deck

```
1. User browses public library
2. User finds interesting deck
3. User clicks "📥 Importer"
4. System checks if already imported (returns error if yes)
5. System creates new course with imported prefix
6. System copies all flashcards
7. System records download in deck_downloads
8. System increments deck downloads_count
9. Success toast appears
10. User can find new course in their courses list
```

### Rating a Deck

```
1. User opens deck detail view
2. User clicks star rating (1-5)
3. User optionally writes review
4. User clicks "Publier mon avis"
5. System saves/updates rating in deck_ratings
6. Database trigger updates deck average_rating
7. Rating appears in community reviews
```

## Best Practices

### For Publishers

1. **Clear Titles**: Use descriptive titles that indicate subject and topic
2. **Good Descriptions**: Explain what the deck covers, difficulty level, and target audience
3. **Accurate Categories**: Choose the most appropriate category
4. **Relevant Tags**: Add tags that help users find your deck
5. **Quality Content**: Ensure flashcards are accurate and well-formatted

### For Users

1. **Rate Honestly**: Help others by providing honest ratings
2. **Write Reviews**: Detailed reviews are more helpful than ratings alone
3. **Give Credit**: Remember that decks are created by community members
4. **Report Issues**: Contact deck authors if you find errors

## Future Enhancements

Potential improvements for future versions:

- [ ] Deck collections/playlists
- [ ] Follow favorite authors
- [ ] Deck versioning and updates
- [ ] Comments/discussions on decks
- [ ] Deck recommendations based on user activity
- [ ] Advanced search with filters
- [ ] Deck analytics for authors
- [ ] Collaborative decks (multiple authors)
- [ ] Private sharing (share with specific users)
- [ ] Deck export to various formats

## Troubleshooting

### Common Issues

**"Aucune flashcard trouvée"**
- The course you're trying to publish has no flashcards
- Add flashcards to the course first

**"Vous avez déjà importé ce deck"**
- You've already imported this deck
- The system prevents duplicate imports

**Deck not appearing in library**
- Check that `is_active` is true
- Verify RLS policies are correct
- Check Supabase logs for errors

**Statistics not updating**
- Verify triggers are installed correctly
- Check trigger functions exist in database
- Review Supabase logs for trigger errors

### Debug Mode

Enable debug logging in the browser console:

```javascript
// In usePublicDecks.js, add console.logs
console.log('Loading public decks with filters:', filters);
console.log('Deck data received:', data);
```

## Support

For issues or questions:

1. Check the migration README for database setup
2. Review Supabase dashboard for RLS policy issues
3. Check browser console for JavaScript errors
4. Verify environment variables are set correctly
