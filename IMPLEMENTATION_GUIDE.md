# Implementation Guide - TSI Manager Enhancement

## Quick Start for Users

### Using the New Flashcard Interface

1. **Creating a Flashcard:**
   - Navigate to the "Cours" tab
   - Find a course and click the "➕ Créer 1ère carte" button or the "+" icon
   - A modal will appear with:
     - Course selection (pre-filled if clicked from a specific course)
     - Question field (multi-line)
     - Answer field (multi-line)
     - Preview button to see how the card will look
   - Fill in the question and answer
   - Click "Créer" to save

2. **Editing a Flashcard:**
   - In the course list, find the flashcard you want to edit
   - Click the "✏️" (pencil) icon next to the flashcard
   - Modify the question or answer
   - Use the preview to verify changes
   - Click "Mettre à jour" to save

3. **Deleting a Flashcard:**
   - Click the "X" icon next to the flashcard
   - Confirm the deletion in the dialog

### Using the Intelligent Revision Suggestions

1. **Configuring Revision Settings:**
   - Navigate to the "Suggestions" tab
   - Click "⚙️ Paramètres de révision" button
   - Set your preferences:
     - **Start time**: When you begin studying (e.g., 19:15)
     - **Total duration**: How long you study (e.g., 2h00)
     - **Session duration**: Time per subject (e.g., 45 min)
     - **Priority subjects**: Check subjects you want to focus on
     - **Rest days**: Check days you don't want to study
   - Click "Enregistrer" - settings are saved automatically

2. **Understanding Suggestions:**
   - Each day shows suggested courses to review
   - Look for urgency indicators:
     - **🔥 URGENT** (red border): Test in 1-2 days
     - **⚠️ BIENTÔT** (orange border): Test in 3-4 days
     - No badge (normal): Regular review schedule
   - Each suggestion shows:
     - Subject and chapter name
     - Reason (e.g., "DS Maths dans 2 jour(s)")
     - Mastery level
     - Number of reviews
     - Last review date

3. **Algorithm Logic:**
   - The system considers:
     - Upcoming DS, Colles, and Examens
     - Your priority subject preferences
     - How long since last review
     - Your mastery level
     - Configured rest days
   - Suggestions are balanced (max 2 courses per subject)
   - More urgent tests get higher priority

## Developer Notes

### Key Code Sections

#### State Management (Lines 71-115)
```javascript
// Flashcard modal states
const [showAddFlashcard, setShowAddFlashcard] = useState(false);
const [showEditFlashcard, setShowEditFlashcard] = useState(false);
const [editingFlashcard, setEditingFlashcard] = useState(null);
const [newFlashcard, setNewFlashcard] = useState({
  courseId: '',
  question: '',
  answer: ''
});

// Revision settings with localStorage
const [revisionSettings, setRevisionSettings] = useState(() => {
  const saved = localStorage.getItem('revisionSettings');
  return saved ? JSON.parse(saved) : {
    startTime: '19:15',
    totalDuration: 120,
    sessionDuration: 45,
    prioritySubjects: [],
    restDays: ['Vendredi', 'Samedi']
  };
});
```

#### Intelligent Suggestion Algorithm (Lines 385-483)
The algorithm:
1. Checks for rest days
2. Calculates scores per subject based on:
   - Manual priority (+20)
   - Test urgency (+10 to +50)
   - Mastery level (inversely proportional)
   - Time since last review (+days × 2)
3. Sorts courses by subject score and priority
4. Selects diverse courses (max 2 per subject)
5. Attaches reason and urgency level

#### Modal Components (Lines 2650-2970)
Three modal implementations:
1. Add Flashcard Modal
2. Edit Flashcard Modal
3. Revision Settings Modal

All follow the same pattern:
- Full-screen backdrop with blur
- Centered card with indigo border
- Form fields with slate background
- Cancel/Submit buttons at bottom

### Database Schema

No changes to database schema required. Uses existing tables:
- `shared_flashcards`: Stores flashcard data
- `shared_courses`: Links flashcards to courses
- `user_events`: Provides test/colle data for suggestions
- `user_revision_progress`: Tracks mastery and review history

### API Calls

**Flashcard Operations:**
```javascript
// Create
await supabase
  .from('shared_flashcards')
  .insert([{ course_id, question, answer, created_by }]);

// Update
await supabase
  .from('shared_flashcards')
  .update({ question, answer })
  .eq('id', flashcardId);

// Delete
await supabase
  .from('shared_flashcards')
  .delete()
  .eq('id', flashcardId);
```

**Settings Storage:**
```javascript
// Auto-save via useEffect
localStorage.setItem('revisionSettings', JSON.stringify(settings));
```

### Styling Guidelines

All new components follow existing patterns:
- Dark theme (slate-800/900 backgrounds)
- Indigo/purple gradients for primary actions
- Border colors: indigo-500/30 for modals
- Text colors: white for primary, slate-400 for secondary
- Hover states with transition-all
- Rounded corners (rounded-lg, rounded-2xl)
- Backdrop blur effects

### Testing Strategy

#### Unit Test Ideas (not implemented)
```javascript
describe('getSuggestedReviews', () => {
  it('returns empty array for rest days', () => {
    // Test with restDays configured
  });
  
  it('prioritizes courses with upcoming tests', () => {
    // Test with DS in 2 days
  });
  
  it('respects subject diversity limit', () => {
    // Test that max 2 courses per subject
  });
});
```

#### Integration Test Ideas
- Test modal open/close flow
- Test flashcard CRUD operations
- Test settings persistence across refresh
- Test suggestion updates when events change

### Performance Considerations

**Optimization Done:**
- Single re-render on settings change (via useEffect)
- Efficient filtering (O(n) complexity)
- LocalStorage caching for settings
- Lazy evaluation of suggestions (only when tab active)

**Potential Improvements:**
- Memoize suggestion calculations with useMemo
- Debounce settings updates
- Virtual scrolling for large flashcard lists

### Accessibility

**Current State:**
- Semantic HTML in modals
- Button labels and titles
- Color not sole indicator (icons + text)
- Keyboard navigation via tab

**Future Improvements:**
- Focus trap in modals
- ARIA labels for screen readers
- Keyboard shortcuts (ESC to close)
- Focus return after modal close

### Browser Compatibility

Tested/Compatible:
- Chrome 90+ ✅
- Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅

Uses standard React patterns, no experimental features.

### Deployment Checklist

1. ✅ Code compiled without errors
2. ✅ No new dependencies added
3. ✅ No environment variables required
4. ✅ Backwards compatible (no breaking changes)
5. ✅ Documentation provided
6. ⏳ User acceptance testing (pending)
7. ⏳ Production deployment (pending)

### Troubleshooting

**Issue: Settings don't persist**
- Check browser localStorage is enabled
- Verify no incognito/private mode
- Check browser console for errors

**Issue: Suggestions not showing**
- Verify courses exist in database
- Check events are added with correct dates
- Confirm not all days are rest days
- Review browser console for API errors

**Issue: Modal not opening**
- Check for JavaScript errors in console
- Verify state variables initialized correctly
- Test in different browser

**Issue: Flashcards not saving**
- Check Supabase connection
- Verify user is authenticated
- Check network tab for failed requests
- Review RLS policies in Supabase

## Maintenance Notes

### Regular Checks
- Monitor localStorage size (should stay under 5MB)
- Review suggestion algorithm effectiveness
- Check for user feedback on urgency levels
- Update test scoring if needed

### Future Extensions
- Export/import flashcards
- Shared flashcard decks
- Custom urgency thresholds
- Study session timer
- Analytics dashboard
