# Gamification System Implementation

## Overview
This document describes the complete implementation of the gamification system for TSI Manager, including badges, XP, streaks, and activity tracking.

## Database Schema

### Tables Created
1. **badges** - Available badges
   - Contains 14 pre-seeded badges
   - Rarities: common, rare, epic, legendary
   - XP rewards: 25-2000 XP

2. **user_badges** - User's unlocked badges
   - Links users to their earned badges
   - Tracks unlock date

3. **user_profiles** - User gamification profile
   - Total XP
   - Current & longest streak
   - Cards created count
   - Total reviews, correct/incorrect counts
   - Last activity date

4. **user_daily_stats** - Daily activity statistics
   - Reviews count (correct/incorrect)
   - XP earned per day
   - Session count
   - Time spent

### Badge Types

#### Streak Badges
- **streak_3** - Débutant assidu (3 days) - 50 XP
- **streak_7** - Semaine parfaite (7 days) - 100 XP
- **streak_30** - Champion du mois (30 days) - 300 XP
- **streak_100** - Légende vivante (100 days) - 1000 XP

#### Mastery Badges
- **mastery_10** - Expert naissant (10 cards mastered) - 75 XP
- **mastery_50** - Maître éclairé (50 cards) - 200 XP
- **mastery_100** - Sage accompli (100 cards) - 500 XP
- **mastery_500** - Génie absolu (500 cards) - 2000 XP

#### Creation Badges
- **first_card** - Premier pas (1 card created) - 25 XP
- **cards_created_50** - Créateur prolifique (50 cards) - 150 XP

#### Session Badges
- **first_review** - Première révision (1 session) - 25 XP
- **sessions_10** - Étudiant régulier (10 sessions) - 100 XP
- **sessions_50** - Révisionneur dévoué (50 sessions) - 300 XP
- **sessions_100** - Marathonien du savoir (100 sessions) - 750 XP

## Frontend Implementation

### Hook: useGamification

Location: `frontend/src/hooks/useGamification.js`

#### States Managed
- `badges` - All available badges
- `unlockedBadges` - User's unlocked badges
- `userProfile` - User's gamification profile
- `dailyStats` - Daily activity statistics (90 days)
- `newBadge` - Newly unlocked badge (for modal)

#### Functions Provided
- `loadBadges()` - Load all available badges
- `loadUserBadges()` - Load user's unlocked badges
- `loadUserProfile()` - Load user profile
- `loadDailyStats(days)` - Load daily stats
- `checkAndUnlockBadges()` - Check and unlock eligible badges
- `addXP(amount)` - Add XP to profile
- `updateDailyStats(stats)` - Update today's stats
- `incrementCardsCreated(count)` - Increment cards created counter

### Components

#### 1. Badge Component
Location: `frontend/src/components/Badge.js`

Features:
- Three sizes: sm, md, lg
- Locked/unlocked states
- Rarity-based colors (common/rare/epic/legendary)
- Shine animation on unlocked badges
- Hover tooltip with details

#### 2. BadgeUnlockModal
Location: `frontend/src/components/BadgeUnlockModal.js`

Features:
- Confetti animation (50 particles)
- Badge display with rarity glow
- XP earned notification
- Celebration animations (bounce, wiggle, fade-in)

#### 3. ActivityHeatmap
Location: `frontend/src/components/ActivityHeatmap.js`

Features:
- GitHub-style heatmap
- 90-day activity visualization
- Color intensity based on review count
- Hover tooltips with date and count
- Monthly labels
- Activity summary

### Enhanced Stats Tab

The Stats tab now includes:

#### Profile Section
- Avatar with username
- 4 stat cards:
  - Total XP (with sparkles icon)
  - Current streak (with flame icon)
  - Total reviews (with book icon)
  - Average mastery % (with target icon)

#### Badges Section
- Grid display of all badges
- Progress indicator (X/14 unlocked)
- Locked badges shown grayed out
- Unlocked badges with shine animation

#### Activity Heatmap Section
- 3-month activity visualization
- Total reviews and active days summary

## XP Rewards System

### Flashcard Reviews
- **Correct answer**: +10 XP
- **Incorrect answer**: +2 XP
- **Session complete**: +25 XP bonus
- **Badge unlock**: Variable (25-2000 XP)

### Integration Points

1. **handleFlashcardAnswer()** - Modified to:
   - Award XP per answer
   - Update daily stats
   - Award session bonus on completion

2. **addFlashcard()** - Modified to:
   - Increment cards_created counter (only non-imported)
   - Trigger badge check

## Animations

Added to `frontend/src/index.css`:

```css
@keyframes shine-move - Badge shine effect
@keyframes pulse-scale - Badge pulse
@keyframes wiggle - Badge wiggle
@keyframes fade-in - Fade in animation
@keyframes bounce-slow - Slow bounce
@keyframes confetti-fall - Confetti particles
```

## Setup Instructions

### 1. Run Database Migration

Execute the migration file on your Supabase instance:
```bash
psql -U postgres -h <your-host> -d <your-db> -f database/migrations/add_gamification_tables.sql
```

Or use the Supabase SQL editor to run the migration.

### 2. Verify Tables

Check that the following tables exist:
- badges
- user_badges
- user_profiles
- user_daily_stats

### 3. Verify Seed Data

Confirm 14 badges are seeded in the `badges` table.

### 4. Test the Application

1. Start the frontend: `cd frontend && npm start`
2. Login to the application
3. Navigate to the Stats tab
4. Create flashcards and review them to earn XP
5. Check badge unlocking after meeting conditions

## Technical Considerations

### Performance
- Badge checking is asynchronous and doesn't block UI
- Daily stats are cached and only updated on changes
- Heatmap data limited to 90 days for performance

### State Management
- Hook-based state management for gamification
- Automatic profile creation on first activity
- Optimistic UI updates for better UX

### Future Enhancements
1. Implement actual mastery badge logic (currently placeholder)
2. Add leaderboards
3. Add more badge types (combo badges, perfect week, etc.)
4. Add badge sharing features
5. Add XP multipliers for special events

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] User profile created on first activity
- [ ] XP awarded correctly for flashcard reviews
- [ ] Session bonus awarded on completion
- [ ] Badges unlock when conditions met
- [ ] Badge unlock modal displays correctly
- [ ] Activity heatmap renders correctly
- [ ] Stats tab displays all sections properly
- [ ] Animations work smoothly
- [ ] No console errors

## Troubleshooting

### Badges not unlocking
- Check user_profiles table has correct counters
- Verify badge conditions in badges table
- Check browser console for errors

### Heatmap not showing data
- Verify user_daily_stats table has data
- Check date format in database
- Verify loadDailyStats is called

### XP not updating
- Check network tab for failed requests
- Verify user_profiles table updates
- Check addXP function is called

## Files Modified/Created

### Created:
- `database/migrations/add_gamification_tables.sql`
- `frontend/src/hooks/useGamification.js`
- `frontend/src/components/Badge.js`
- `frontend/src/components/BadgeUnlockModal.js`
- `frontend/src/components/ActivityHeatmap.js`

### Modified:
- `frontend/src/App.js` - Stats tab enhancement, XP integration
- `frontend/src/index.css` - Animation keyframes
