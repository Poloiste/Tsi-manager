# Quick Start Guide - TSI Manager (After Migration)

## For Developers

### 1. Setup Database (CRITICAL - Must do first!)
```bash
# 1. Login to Supabase dashboard
# 2. Go to SQL Editor
# 3. Execute the entire file: database/schema.sql
# 4. Verify tables exist in Table Editor
```

### 2. Environment Variables
```env
# .env in frontend directory
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install & Run
```bash
cd frontend
npm install
npm start
```

### 4. Build for Production
```bash
cd frontend
npm run build
```

## For End Users

### First Time Setup
1. **Create account** - Sign up with email/password
2. **Add courses** - Go to "📚 Cours" → "Ajouter un cours"
3. **Create flashcards** - Go to "🎴 Révision" → Select course → Add cards
4. **Add events** - Go to "📅 Planning" → "Ajouter" → Create your DS/Colles

### Key Concepts

**Shared Data (Everyone sees):**
- Courses you create are visible to all students
- Flashcards you create are visible to all students
- OneDrive links you add are visible to all students

**Personal Data (Only you see):**
- Your DS/Colles/DM events are private
- Your revision progress is private
- Your flashcard success rates are private

### Features

#### 1. Collaborative Course Library
- Add courses with links to shared OneDrive documents
- See courses added by other students
- Track your personal progress on each course

#### 2. Shared Flashcards
- Create flashcards for any course
- Use flashcards created by other students
- Track your personal success rate on each card

#### 3. Adaptive Evening Schedule
- Add your upcoming DS/Colles/DM
- Evening schedule automatically shows targeted revisions
- Example: "🎯 RÉVISION DS Maths (J-2)" appears automatically

#### 4. Personal Planning
- Your events (DS, Colles, DM) are private
- Get intelligent revision suggestions based on your schedule
- Track your mastery level for each course

## Troubleshooting

### "Can't create course" or "Permission denied"
**Solution**: Database schema not executed. Run `database/schema.sql` in Supabase SQL Editor.

### "Don't see courses created by others"
**Solution**: Check you're logged in. Refresh the page. Verify RLS policies in database.

### "Old data disappeared"
**Solution**: Expected - localStorage no longer used. Data is now in Supabase (cloud).

### "Can't delete someone else's course"
**Solution**: This is correct behavior - you can only delete your own courses.

### "Evening schedule not adapting"
**Check**:
- Do you have DS/Colles/DM within next 7 days?
- Is the event date set correctly?
- Try selecting a day in the planning view

## Quick Reference

### Data Architecture
```
SHARED (All Users See):
├── shared_courses
├── shared_course_links
└── shared_flashcards

PERSONAL (User-Specific):
├── user_events
├── user_revision_progress
└── user_flashcard_stats

CHAT (All Users See):
├── chat_channels
└── chat_messages
```

### Main Changes from Previous Version
- ❌ No more AI flashcard generation
- ❌ No more localStorage
- ✅ Cloud storage via Supabase
- ✅ Collaborative courses and flashcards
- ✅ Smart evening schedule adaptation

## Support

1. Check `README.md` for detailed setup
2. Check `MIGRATION_GUIDE.md` for migration help
3. Check `TEST_PLAN.md` if testing
4. Check `IMPLEMENTATION_DETAILS.md` for technical details
5. Open GitHub issue if problem persists
