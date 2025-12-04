require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// ROUTES DONNÉES PERSONNELLES
// ============================================

// ===== HISTORIQUE DE RÉVISION =====
app.get('/api/user/:userId/revision-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('user_revision_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching revision history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/:userId/revision-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, duration, date, notes } = req.body;
    
    const { data, error } = await supabase
      .from('user_revision_history')
      .insert([{ 
        user_id: userId, 
        subject, 
        duration, 
        date, 
        notes 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating revision history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/:userId/revision-history/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    const { subject, duration, date, notes } = req.body;
    
    const { data, error } = await supabase
      .from('user_revision_history')
      .update({ subject, duration, date, notes })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating revision history:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/user/:userId/revision-history/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    
    const { error } = await supabase
      .from('user_revision_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting revision history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== EMPLOI DU TEMPS =====
app.get('/api/user/:userId/schedule', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await supabase
      .from('user_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/:userId/schedule', async (req, res) => {
  try {
    const { userId } = req.params;
    const { day_of_week, start_time, end_time, subject, room } = req.body;
    
    const { data, error } = await supabase
      .from('user_schedules')
      .insert([{ 
        user_id: userId, 
        day_of_week, 
        start_time, 
        end_time, 
        subject, 
        room 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/user/:userId/schedule/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    
    const { error } = await supabase
      .from('user_schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DS/DM/COLLES =====
app.get('/api/user/:userId/exams', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // Filter by type (DS, DM, Colle)
    
    let query = supabase
      .from('user_exams')
      .select('*')
      .eq('user_id', userId);
    
    if (type) query = query.eq('type', type);
    
    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/:userId/exams', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, subject, date, duration, coefficient, notes } = req.body;
    
    const { data, error } = await supabase
      .from('user_exams')
      .insert([{ 
        user_id: userId, 
        type, 
        subject, 
        date, 
        duration, 
        coefficient, 
        notes 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/:userId/exams/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    const { type, subject, date, duration, coefficient, notes } = req.body;
    
    const { data, error } = await supabase
      .from('user_exams')
      .update({ type, subject, date, duration, coefficient, notes })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/user/:userId/exams/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    
    const { error } = await supabase
      .from('user_exams')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PLANNING DES SEMAINES =====
app.get('/api/user/:userId/weekly-planning', async (req, res) => {
  try {
    const { userId } = req.params;
    const { week, year } = req.query;
    
    let query = supabase
      .from('user_weekly_planning')
      .select('*')
      .eq('user_id', userId);
    
    if (week) query = query.eq('week_number', parseInt(week));
    if (year) query = query.eq('year', parseInt(year));
    
    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching weekly planning:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/:userId/weekly-planning', async (req, res) => {
  try {
    const { userId } = req.params;
    const { week_number, year, tasks } = req.body;
    
    const { data, error } = await supabase
      .from('user_weekly_planning')
      .insert([{ 
        user_id: userId, 
        week_number, 
        year, 
        tasks 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating weekly planning:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/:userId/weekly-planning/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;
    const { tasks } = req.body;
    
    const { data, error } = await supabase
      .from('user_weekly_planning')
      .update({ tasks })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating weekly planning:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES DONNÉES COMMUNES (PARTAGÉES)
// ============================================

// ===== COURS PARTAGÉS =====
app.get('/api/shared/courses', async (req, res) => {
  try {
    const { subject } = req.query;
    
    let query = supabase
      .from('shared_courses')
      .select('*');
    
    if (subject) query = query.eq('subject', subject);
    
    const { data, error } = await query
      .order('subject')
      .order('chapter_number');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shared/courses', async (req, res) => {
  try {
    const { subject, title, content, chapter_number, created_by } = req.body;
    
    const { data, error } = await supabase
      .from('shared_courses')
      .insert([{ 
        subject, 
        title, 
        content, 
        chapter_number, 
        created_by 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shared/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, title, content, chapter_number } = req.body;
    
    const { data, error } = await supabase
      .from('shared_courses')
      .update({ 
        subject, 
        title, 
        content, 
        chapter_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shared/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('shared_courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FLASHCARDS PARTAGÉES =====
app.get('/api/shared/flashcards', async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    
    let query = supabase.from('shared_flashcards').select('*');
    
    if (subject) query = query.eq('subject', subject);
    if (difficulty) query = query.eq('difficulty', difficulty);
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shared/flashcards', async (req, res) => {
  try {
    const { subject, question, answer, difficulty, tags, created_by } = req.body;
    
    const { data, error } = await supabase
      .from('shared_flashcards')
      .insert([{ 
        subject, 
        question, 
        answer, 
        difficulty, 
        tags, 
        created_by 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shared/flashcards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, question, answer, difficulty, tags } = req.body;
    
    const { data, error } = await supabase
      .from('shared_flashcards')
      .update({ subject, question, answer, difficulty, tags })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating flashcard:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shared/flashcards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('shared_flashcards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RÉVISIONS PARTAGÉES =====
app.get('/api/shared/revisions', async (req, res) => {
  try {
    const { subject, type } = req.query;
    
    let query = supabase.from('shared_revisions').select('*');
    
    if (subject) query = query.eq('subject', subject);
    if (type) query = query.eq('type', type);
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching revisions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shared/revisions', async (req, res) => {
  try {
    const { subject, title, content, type, created_by } = req.body;
    
    const { data, error } = await supabase
      .from('shared_revisions')
      .insert([{ 
        subject, 
        title, 
        content, 
        type, 
        created_by 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating revision:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTE DE TEST =====
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TSI Manager API is running',
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🗄️  Connected to Supabase at ${process.env.SUPABASE_URL}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});