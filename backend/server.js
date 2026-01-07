require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const supabase = require('./config/supabase');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware to ensure all API responses have proper Content-Type
app.use('/api', (req, res, next) => {
  // Store original res.send and res.json
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send to always set Content-Type for API routes
  res.send = function(data) {
    if (!res.get('Content-Type')) {
      res.set('Content-Type', 'application/json');
    }
    return originalSend.call(this, data);
  };
  
  // Override res.json to ensure it's always JSON
  res.json = function(data) {
    res.set('Content-Type', 'application/json');
    return originalJson.call(this, data);
  };
  
  next();
});

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


// ============================================
// ROUTES CHANNELS - GESTION DES CANAUX
// ============================================

// GET /api/channels/:channelId/messages - Récupérer les messages d'un canal
app.get('/api/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session instead
    let limit = 50; // Default limit
    let offset = 0; // Default offset for pagination

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Validate and cap the limit
    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
      }
      limit = Math.min(parsedLimit, 100); // Cap at 100
    }

    // Parse offset for pagination
    if (req.query.offset !== undefined) {
      const parsedOffset = Number(req.query.offset);
      if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({ error: 'Invalid offset parameter. Must be a non-negative integer.' });
      }
      offset = parsedOffset;
    }

    // Get channel info to check visibility
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('visibility')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // If it's a private channel, verify membership
    if (channel.visibility === 'private') {
      const { data: membership, error: memberError } = await supabase
        .from('channel_memberships')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: 'You are not a member of this channel' });
      }
    }

    // Récupérer les messages du canal avec pagination
    const { data, error, count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      messages: data || [],
      total: count,
      limit,
      offset,
      hasMore: count > offset + limit
    });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/channels/:channelId/messages - Envoyer un message dans un canal
app.post('/api/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { user_id, user_name, content } = req.body;

    // Input validation
    if (!user_id || !user_name || !content) {
      return res.status(400).json({ error: 'Missing required fields: user_id, user_name, content' });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content must be a non-empty string' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content exceeds maximum length of 5000 characters' });
    }

    // Get channel info to check visibility
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('visibility')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // If it's a private channel, verify membership
    if (channel.visibility === 'private') {
      const { data: membership, error: memberError } = await supabase
        .from('channel_memberships')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', user_id)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ error: 'You are not a member of this channel' });
      }
    }

    // Insérer le message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        channel_id: channelId,
        user_id,
        user_name,
        content: content.trim()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/channels/:channelId/messages/:messageId - Supprimer un message d'un canal
app.delete('/api/channels/:channelId/messages/:messageId', async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session instead

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify the message belongs to the user and the correct channel
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .select('user_id, channel_id')
      .eq('id', messageId)
      .eq('channel_id', channelId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Delete the message
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
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

// ============================================
// CATEGORY AND CHANNEL SYSTEM API
// ============================================

// POST /api/channels - Create a new category or channel
app.post('/api/channels', async (req, res) => {
  try {
    const { name, type, parent_id, visibility, created_by } = req.body;

    // Input validation
    if (!name || !type || !created_by) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, type, created_by' 
      });
    }

    // Validate type
    if (!['category', 'text'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: category, text' 
      });
    }

    // Validate visibility
    const channelVisibility = visibility || 'public';
    if (!['public', 'private'].includes(channelVisibility)) {
      return res.status(400).json({ 
        error: 'Invalid visibility. Must be one of: public, private' 
      });
    }

    // Validate name
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ 
        error: 'Name exceeds maximum length of 100 characters' 
      });
    }

    // Categories cannot have parent_id
    if (type === 'category' && parent_id) {
      return res.status(400).json({ 
        error: 'Categories cannot have a parent' 
      });
    }

    // If parent_id is provided, verify it's a category
    if (parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from('chat_channels')
        .select('channel_type')
        .eq('id', parent_id)
        .single();

      if (parentError || !parent) {
        return res.status(404).json({ error: 'Parent category not found' });
      }

      if (parent.channel_type !== 'category') {
        return res.status(400).json({ 
          error: 'Parent must be a category' 
        });
      }
    }

    // Create the channel
    const { data, error } = await supabase
      .from('chat_channels')
      .insert([{
        name: trimmedName,
        type: type,
        channel_type: type,
        parent_id: parent_id || null,
        visibility: channelVisibility,
        created_by,
        group_id: null, // Standalone channels don't belong to groups
        position: 0
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/channels - List all accessible channels/categories with hierarchy
app.get('/api/channels', async (req, res) => {
  try {
    const userId = req.query.user_id; // TODO: Get from authenticated session
    const { include_children } = req.query;

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Get public channels
    const { data: publicChannels, error: publicError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('visibility', 'public')
      .is('group_id', null)
      .order('position')
      .order('created_at');

    if (publicError) throw publicError;

    // Get private channels where user is a member
    const { data: privateChannels, error: privateError } = await supabase
      .from('chat_channels')
      .select(`
        *,
        channel_memberships!inner(user_id, role)
      `)
      .eq('visibility', 'private')
      .is('group_id', null)
      .eq('channel_memberships.user_id', userId)
      .order('position')
      .order('created_at');

    if (privateError) throw privateError;

    // Combine and organize channels
    const allChannels = [...(publicChannels || []), ...(privateChannels || [])];

    // If include_children is requested, organize into hierarchy
    if (include_children === 'true') {
      const categories = allChannels.filter(ch => ch.channel_type === 'category');
      const channelsOnly = allChannels.filter(ch => ch.channel_type !== 'category');

      const hierarchy = categories.map(category => ({
        ...category,
        children: channelsOnly.filter(ch => ch.parent_id === category.id)
      }));

      // Include orphan channels (no parent)
      const orphans = channelsOnly.filter(ch => !ch.parent_id);

      res.json({
        categories: hierarchy,
        orphan_channels: orphans
      });
    } else {
      res.json(allChannels);
    }
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/channels/:id - Get a specific channel with details
app.get('/api/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Get channel
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('id', id)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check access rights
    if (channel.visibility === 'private' && !channel.group_id) {
      const { data: membership, error: memberError } = await supabase
        .from('channel_memberships')
        .select('role')
        .eq('channel_id', id)
        .eq('user_id', userId)
        .single();

      if (memberError || !membership) {
        return res.status(403).json({ 
          error: 'You do not have access to this channel' 
        });
      }

      channel.user_role = membership.role;
    }

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/channels/:id/children - Get child channels of a category
app.get('/api/channels/:id/children', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify the parent is a category
    const { data: parent, error: parentError } = await supabase
      .from('chat_channels')
      .select('channel_type')
      .eq('id', id)
      .single();

    if (parentError || !parent) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (parent.channel_type !== 'category') {
      return res.status(400).json({ error: 'Specified channel is not a category' });
    }

    // Get public child channels
    const { data: publicChildren, error: publicError } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('parent_id', id)
      .eq('visibility', 'public')
      .order('position')
      .order('created_at');

    if (publicError) throw publicError;

    // Get private child channels where user is a member
    const { data: privateChildren, error: privateError } = await supabase
      .from('chat_channels')
      .select(`
        *,
        channel_memberships!inner(user_id, role)
      `)
      .eq('parent_id', id)
      .eq('visibility', 'private')
      .eq('channel_memberships.user_id', userId)
      .order('position')
      .order('created_at');

    if (privateError) throw privateError;

    const children = [...(publicChildren || []), ...(privateChildren || [])];
    res.json(children);
  } catch (error) {
    console.error('Error fetching child channels:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/channels/:id - Update a channel
app.put('/api/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, name, visibility, position } = req.body;

    // Validate user_id is provided
    if (!user_id) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify user has permission (owner or moderator)
    const { data: membership, error: memberError } = await supabase
      .from('channel_memberships')
      .select('role')
      .eq('channel_id', id)
      .eq('user_id', user_id)
      .single();

    // Also check if user is creator
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('created_by')
      .eq('id', id)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const isCreator = channel.created_by === user_id;
    const isOwnerOrMod = membership && ['owner', 'moderator'].includes(membership.role);

    if (!isCreator && !isOwnerOrMod) {
      return res.status(403).json({ 
        error: 'You do not have permission to update this channel' 
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }
      const trimmedName = name.trim();
      if (trimmedName.length > 100) {
        return res.status(400).json({ 
          error: 'Name exceeds maximum length of 100 characters' 
        });
      }
      updateData.name = trimmedName;
    }
    if (visibility !== undefined) {
      if (!['public', 'private'].includes(visibility)) {
        return res.status(400).json({ 
          error: 'Invalid visibility. Must be one of: public, private' 
        });
      }
      updateData.visibility = visibility;
    }
    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        return res.status(400).json({ 
          error: 'Position must be a non-negative integer' 
        });
      }
      updateData.position = position;
    }

    // Update the channel
    const { data, error } = await supabase
      .from('chat_channels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/channels/:id - Delete a channel
app.delete('/api/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify user is the owner
    const { data: membership } = await supabase
      .from('channel_memberships')
      .select('role')
      .eq('channel_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    // Also check if user is creator
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('created_by, channel_type')
      .eq('id', id)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const isCreator = channel.created_by === userId;
    const isOwner = membership && membership.role === 'owner';

    if (!isCreator && !isOwner) {
      return res.status(403).json({ 
        error: 'Only channel owners can delete channels' 
      });
    }

    // If it's a category, check if it has children
    if (channel.channel_type === 'category') {
      const { data: children, error: childError } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('parent_id', id);

      if (childError) throw childError;

      if (children && children.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with channels. Delete channels first.' 
        });
      }
    }

    // Delete the channel
    const { error } = await supabase
      .from('chat_channels')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/channels/:id/memberships - Add a user to a channel with a role
app.post('/api/channels/:id/memberships', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, target_user_id, role } = req.body;

    // Input validation
    if (!user_id || !target_user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, target_user_id' 
      });
    }

    // Validate role
    const memberRole = role || 'member';
    if (!['owner', 'moderator', 'member'].includes(memberRole)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be one of: owner, moderator, member' 
      });
    }

    // Verify channel exists and is private
    const { data: channel, error: channelError } = await supabase
      .from('chat_channels')
      .select('visibility, channel_type')
      .eq('id', id)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (channel.channel_type === 'category') {
      return res.status(400).json({ 
        error: 'Cannot add members to categories' 
      });
    }

    if (channel.visibility !== 'private') {
      return res.status(400).json({ 
        error: 'Can only add members to private channels' 
      });
    }

    // Verify user has permission to add members (owner or moderator)
    const { data: membership, error: memberError } = await supabase
      .from('channel_memberships')
      .select('role')
      .eq('channel_id', id)
      .eq('user_id', user_id)
      .single();

    if (memberError || !membership || !['owner', 'moderator'].includes(membership.role)) {
      return res.status(403).json({ 
        error: 'Only channel owners and moderators can add members' 
      });
    }

    // Add the user to the channel
    const { data, error } = await supabase
      .from('channel_memberships')
      .insert([{
        channel_id: id,
        user_id: target_user_id,
        role: memberRole
      }])
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'User is already a member of this channel' 
        });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding channel membership:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/channels/:id/memberships - Get members of a channel
app.get('/api/channels/:id/memberships', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Verify user has access to the channel
    const { data: membership, error: memberError } = await supabase
      .from('channel_memberships')
      .select('id')
      .eq('channel_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ 
        error: 'You do not have access to this channel' 
      });
    }

    // Get all members
    const { data, error } = await supabase
      .from('channel_memberships')
      .select('*')
      .eq('channel_id', id)
      .order('role')
      .order('joined_at');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching channel memberships:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/channels/:id/memberships/:targetUserId - Remove a user from a channel
app.delete('/api/channels/:id/memberships/:targetUserId', async (req, res) => {
  try {
    const { id, targetUserId } = req.params;
    const userId = req.query.user_id; // TODO: Get from authenticated session

    // Validate user_id is provided
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Check if user is removing themselves or has permission
    const isSelfRemoval = userId === targetUserId;

    if (!isSelfRemoval) {
      // Verify user has permission to remove others (owner or moderator)
      const { data: membership, error: memberError } = await supabase
        .from('channel_memberships')
        .select('role')
        .eq('channel_id', id)
        .eq('user_id', userId)
        .single();

      if (memberError || !membership || !['owner', 'moderator'].includes(membership.role)) {
        return res.status(403).json({ 
          error: 'Only channel owners and moderators can remove members' 
        });
      }

      // Prevent moderators from removing owners
      const { data: targetMembership } = await supabase
        .from('channel_memberships')
        .select('role')
        .eq('channel_id', id)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (targetMembership && 
          membership.role === 'moderator' && targetMembership.role === 'owner') {
        return res.status(403).json({ 
          error: 'Moderators cannot remove owners' 
        });
      }
    }

    // Remove the membership
    const { error } = await supabase
      .from('channel_memberships')
      .delete()
      .eq('channel_id', id)
      .eq('user_id', targetUserId);

    if (error) throw error;

    res.json({ message: 'User removed from channel successfully' });
  } catch (error) {
    console.error('Error removing channel membership:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SOCKET.IO REAL-TIME MESSAGING
// ============================================

// Store active connections by channel
const channelConnections = new Map();

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join a specific channel
  socket.on('join_channel', async ({ channelId, userId, userName }) => {
    try {
      // Verify user has access to this channel
      const { data: channel, error: channelError } = await supabase
        .from('chat_channels')
        .select('visibility')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      // If it's a private channel, verify membership
      if (channel.visibility === 'private') {
        const { data: membership, error: memberError } = await supabase
          .from('channel_memberships')
          .select('id')
          .eq('channel_id', channelId)
          .eq('user_id', userId)
          .single();

        if (memberError || !membership) {
          socket.emit('error', { message: 'Access denied - not a member' });
          return;
        }
      }

      // Join the channel room
      socket.join(`channel:${channelId}`);
      socket.channelId = channelId;
      socket.userId = userId;
      socket.userName = userName;

      // Track connection
      if (!channelConnections.has(channelId)) {
        channelConnections.set(channelId, new Set());
      }
      channelConnections.get(channelId).add(socket.id);

      console.log(`📥 ${userName} joined channel ${channelId}`);
      
      // Notify others in the channel
      socket.to(`channel:${channelId}`).emit('user_joined', {
        userId,
        userName
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // Leave a channel
  socket.on('leave_channel', ({ channelId }) => {
    if (channelId) {
      socket.leave(`channel:${channelId}`);
      
      // Remove from tracking
      if (channelConnections.has(channelId)) {
        channelConnections.get(channelId).delete(socket.id);
        if (channelConnections.get(channelId).size === 0) {
          channelConnections.delete(channelId);
        }
      }

      console.log(`📤 ${socket.userName} left channel ${channelId}`);
      
      // Notify others
      socket.to(`channel:${channelId}`).emit('user_left', {
        userId: socket.userId,
        userName: socket.userName
      });
    }
  });

  // Send a message
  socket.on('send_message', async ({ channelId, content }) => {
    try {
      // Verify user is in the channel
      if (socket.channelId !== channelId) {
        socket.emit('error', { message: 'You are not in this channel' });
        return;
      }

      // Validate content
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        socket.emit('error', { message: 'Invalid message content' });
        return;
      }

      if (content.length > 5000) {
        socket.emit('error', { message: 'Message too long' });
        return;
      }

      // Save message to database
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert([{
          channel_id: channelId,
          user_id: socket.userId,
          user_name: socket.userName,
          content: content.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      // Broadcast to all users in the channel (including sender)
      io.to(`channel:${channelId}`).emit('new_message', message);

      console.log(`💬 Message sent in channel ${channelId} by ${socket.userName}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ channelId, isTyping }) => {
    if (socket.channelId === channelId) {
      socket.to(`channel:${channelId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    // Clean up channel connections
    if (socket.channelId) {
      const channelId = socket.channelId;
      socket.to(`channel:${channelId}`).emit('user_left', {
        userId: socket.userId,
        userName: socket.userName
      });

      if (channelConnections.has(channelId)) {
        channelConnections.get(channelId).delete(socket.id);
        if (channelConnections.get(channelId).size === 0) {
          channelConnections.delete(channelId);
        }
      }
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🗄️  Connected to Supabase at ${process.env.SUPABASE_URL}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server ready`);
});