Set-Location "C:\Users\RIO\Documents\Projets\tsi-manager\frontend\src"

# Créer le nouveau App.js avec Supabase intégré
$newAppJs = @'
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, AlertCircle, Plus, X, Brain, Zap, Sparkles, Trash2, Upload, File, ChevronDown, ChevronLeft, ChevronRight, Folder, FolderOpen, LogOut, Users, User } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import Login from './Login';

function App() {
  const { user, logout, loading: authLoading } = useAuth();
  
  // États pour le mode (personnel ou partagé)
  const [viewMode, setViewMode] = useState('personal'); // 'personal' ou 'shared'
  
  // États pour Planning
  const [currentWeek, setCurrentWeek] = useState(10);
  const [selectedDay, setSelectedDay] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    week: 10,
    day: 'Lundi',
    type: 'DS',
    subject: '',
    time: '',
    duration: '',
    date: ''
  });

  // Calendrier des semaines TSI
  const weekCalendar = {
    1: { dates: '1 au 5/9', label: 'S1' },
    2: { dates: '8 au 12/9', label: 'S2' },
    3: { dates: '15 au 19/9', label: 'S3' },
    4: { dates: '22 au 26/09', label: 'S4' },
    5: { dates: '29/9 au 3/10', label: 'S5' },
    6: { dates: '6 au 10/10', label: 'S6' },
    7: { dates: '13 au 17/10', label: 'S7' },
    8: { dates: '3 au 7/11', label: 'S8' },
    9: { dates: '10 au 14/11', label: 'S9' },
    10: { dates: '17 au 21/11', label: 'S10' },
    11: { dates: '24 au 28/11', label: 'S11' },
    12: { dates: '1 au 5/12', label: 'S12' },
    13: { dates: '8 au 12/12', label: 'S13' },
    14: { dates: '15 au 19/12', label: 'S14' },
    15: { dates: '5 au 9/1', label: 'S15' },
    16: { dates: '12 au 16/1', label: 'S16' },
    17: { dates: '19 au 23/1', label: 'S17' },
    18: { dates: '26 au 30/1', label: 'S18' },
    19: { dates: '2 au 6/2', label: 'S19' },
    20: { dates: '23 au 27/2', label: 'S20' },
    21: { dates: '2 au 6/3', label: 'S21' },
    22: { dates: '9 au 13/3', label: 'S22' },
    23: { dates: '16 au 20/3', label: 'S23' },
    24: { dates: '23 au 27/3', label: 'S24' },
    25: { dates: '30/3 au 3/4', label: 'S25' },
    26: { dates: '20 au 24/4', label: 'S26' },
    27: { dates: '27/4 au 1/5', label: 'S27' },
    28: { dates: '4 au 8/5', label: 'S28' },
    29: { dates: '11 au 15/5', label: 'S29' },
    30: { dates: '18 au 22/5', label: 'S30' },
    31: { dates: '25 au 29/5', label: 'S31' },
    32: { dates: '1 au 5/6', label: 'S32' },
    33: { dates: '8 au 12/6', label: 'S33' }
  };

  // États pour Cours et Flashcards
  const [courses, setCourses] = useState([]);
  const [sharedCourses, setSharedCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('planning');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  
  // États pour Flashcards
  const [selectedCourseForFlashcards, setSelectedCourseForFlashcards] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [sharedFlashcards, setSharedFlashcards] = useState([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState({ correct: 0, incorrect: 0, skipped: 0 });
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  
  const [newCourse, setNewCourse] = useState({
    subject: '',
    chapter: '',
    content: '',
    difficulty: 3,
    priority: 3,
    dateAdded: new Date().toISOString().split('T')[0],
    oneDriveLinks: []
  });

  const [newOneDriveLink, setNewOneDriveLink] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  
  const BACKEND_URL = 'https://tsi-manager-backend.onrender.com';

  const baseSchedule = {
    'Lundi': [
      { time: '8h-10h', subject: 'Méca', type: 'cours', room: 'D123 TSI1' },
      { time: '10h-13h', subject: 'Elec', type: 'TD', room: 'D123 TSI1' },
      { time: '14h-15h', subject: 'Français', type: 'cours', room: 'D123 TSI1' },
      { time: '16h-18h', subject: 'Anglais', type: 'cours', room: 'D123 TSI1' }
    ],
    'Mardi': [
      { time: '8h-10h', subject: 'Maths', type: 'cours', room: 'D123 TSI1' },
      { time: '10h-12h', subject: 'Physique', type: 'cours', room: 'D123 TSI1' },
      { time: '13h-14h', subject: 'Informatique', type: 'cours', room: 'B121' },
      { time: '14h-16h', subject: 'Maths', type: 'TD', room: 'D123 TSI1' },
      { time: '16h-18h', subject: 'Physique', type: 'TD', room: 'D123 TSI1' }
    ],
    'Mercredi': [
      { time: '8h-11h', subject: 'Maths', type: 'cours', room: 'D123 TSI1' },
      { time: '11h-12h', subject: 'T.I.P.E.', type: 'TP', room: 'Atelier SI'},
      { time: '14h-16h', subject: 'Maths', type: 'cours', room: 'D123 TSI1' },
      { time: '16h-18h', subject: 'Physique', type: 'cours', room: 'B121' },
    ],
    'Jeudi': [
      { time: '8h-10h', subject: 'Maths', type: 'cours', room: 'D123 TSI1' },
      { time: '10h-12h', subject: 'E.P.S.', type: 'cours', room: 'Gymnase' },
      { time: '13h30-18h', subject: 'TP', type: 'TP', room: 'Atelier SI' }
    ],
    'Vendredi': [
      { time: '9h-10h', subject: 'Anglais', type: 'cours', room: 'D123 TSI1' },
      { time: '10h-12h', subject: 'Physique', type: 'cours', room: 'D123 TSI1' },
      { time: '14h-15h', subject: 'Physique', type: 'TD', room: 'D123 TSI1' },
      { time: '15h-16h', subject: 'Français', type: 'TD', room: 'D123 TSI1' }
    ]
  };

  const eveningSchedule = {
    'Lundi': [
      { time: '19h15-20h00', activity: 'Méca : relecture + exo clé', duration: 45 },
      { time: '20h00-20h45', activity: 'Maths : exercices', duration: 45 },
      { time: '20h45-21h15', activity: 'Pause / détente', duration: 30 },
      { time: '21h15-21h45', activity: 'Détente', duration: 30 }
    ],
    'Mardi': [
      { time: '19h15-20h00', activity: 'Maths : relecture + formules', duration: 45 },
      { time: '20h00-20h45', activity: 'Physique : exercices', duration: 45 },
      { time: '20h45-21h15', activity: 'Informatique : TP', duration: 30 },
      { time: '21h15-21h45', activity: 'Détente', duration: 30 }
    ],
    'Mercredi': [
      { time: '19h15-20h00', activity: 'Maths : méthodes', duration: 45 },
      { time: '20h00-20h45', activity: 'Français : révision', duration: 45 },
      { time: '20h45-21h15', activity: 'Anglais : vocabulaire', duration: 30 },
      { time: '21h15-21h45', activity: 'Repos', duration: 30 }
    ],
    'Jeudi': [
      { time: '19h15-20h00', activity: 'Physique : cours + formules', duration: 45 },
      { time: '20h00-20h45', activity: 'Méca : synthèse TP', duration: 45 },
      { time: '20h45-21h15', activity: 'Français : lecture', duration: 30 },
      { time: '21h15-21h45', activity: 'Détente', duration: 30 }
    ],
    'Vendredi': [
      { time: '18h40-20h45', activity: 'Trajet retour', duration: 0 }
    ],
    'Samedi': [
      { time: '19h15-21h45', activity: 'Repos / Natation', duration: 0 }
    ],
    'Dimanche': [
      { time: '20h45-21h15', activity: 'Fiches semaine', duration: 30 },
      { time: '21h15-21h45', activity: 'Préparation', duration: 30 }
    ]
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const subjects = ['Maths', 'Physique', 'Méca', 'Elec', 'Anglais', 'Français', 'Informatique'];
  const daysUntil = Math.floor((new Date('2027-04-15') - new Date()) / (1000 * 60 * 60 * 24));

  // Charger les données depuis Supabase
  useEffect(() => {
    if (user) {
      loadDataFromSupabase();
    }
  }, [user, viewMode]);

  const loadDataFromSupabase = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'personal') {
        // Charger les cours personnels
        const { data: coursesData, error: coursesError } = await supabase
          .from('user_exams')
          .select('*')
          .eq('user_id', user.id);

        if (coursesError) throw coursesError;

        // Charger les événements personnels (à adapter selon votre schéma)
        const storedEvents = localStorage.getItem(`tsi-events-${user.id}`);
        if (storedEvents) {
          setCustomEvents(JSON.parse(storedEvents));
        }
      } else {
        // Charger les données partagées
        const { data: sharedCoursesData, error: sharedError } = await supabase
          .from('shared_courses')
          .select('*');

        if (sharedError) throw sharedError;
        setSharedCourses(sharedCoursesData || []);

        const { data: sharedFlashcardsData } = await supabase
          .from('shared_flashcards')
          .select('*');

        setSharedFlashcards(sharedFlashcardsData || []);
      }
    } catch (error) {
      console.error('Erreur chargement Supabase:', error);
    }
    setIsLoading(false);
  };

  // Sauvegarder dans Supabase
  const saveCourseToSupabase = async (course) => {
    try {
      if (viewMode === 'personal') {
        // Sauvegarder en tant que user_exam (à adapter)
        const { data, error } = await supabase
          .from('user_exams')
          .insert([{
            user_id: user.id,
            type: 'Cours',
            subject: course.subject,
            date: course.dateAdded,
            notes: course.content
          }]);

        if (error) throw error;
      } else {
        // Sauvegarder en tant que cours partagé
        const { data, error } = await supabase
          .from('shared_courses')
          .insert([{
            subject: course.subject,
            title: course.chapter,
            content: course.content,
            created_by: user.id
          }]);

        if (error) throw error;
      }
      
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  // Fonctions de l'ancien App.js
  const getUpcomingTests = (currentWeek, daysAhead = 14) => {
    const tests = [];
    const today = new Date();
    
    customEvents.forEach(event => {
      if (event.type === 'DS' || event.type === 'DM' || event.type === 'Colle' || event.type === 'Examen' || event.type === 'TP Noté') {
        let daysUntil = 0;
        
        if (event.date) {
          const eventDate = new Date(event.date);
          daysUntil = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
        } else {
          const weekOffset = event.week - currentWeek;
          const dayIndex = days.indexOf(event.day);
          daysUntil = (weekOffset * 7) + dayIndex;
        }
        
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          tests.push({
            subject: event.subject,
            type: event.type,
            day: event.day,
            week: event.week,
            date: event.date,
            daysUntil: daysUntil,
            time: event.time
          });
        }
      }
    });
    
    return tests.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const addCustomEvent = async () => {
    if (newEvent.subject && newEvent.time && (newEvent.week || newEvent.date)) {
      const eventToAdd = { ...newEvent, id: Date.now() };
      
      if (newEvent.date) {
        const selectedDate = new Date(newEvent.date);
        const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][selectedDate.getDay()];
        eventToAdd.day = dayName;
        
        const startOfSchoolYear = new Date('2024-09-01');
        const diffTime = selectedDate - startOfSchoolYear;
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        
        let calculatedWeek = diffWeeks + 1;
        
        if (selectedDate >= new Date('2024-10-19') && selectedDate <= new Date('2024-11-03')) {
          calculatedWeek -= 2;
        } else if (selectedDate >= new Date('2024-12-21') && selectedDate <= new Date('2025-01-05')) {
          calculatedWeek -= 2;
        } else if (selectedDate >= new Date('2025-02-08') && selectedDate <= new Date('2025-02-23')) {
          calculatedWeek -= 2;
        } else if (selectedDate >= new Date('2025-04-05') && selectedDate <= new Date('2025-04-21')) {
          calculatedWeek -= 2;
        }
        
        eventToAdd.week = Math.max(1, Math.min(33, calculatedWeek));
      }
      
      const updatedEvents = [...customEvents, eventToAdd];
      setCustomEvents(updatedEvents);
      localStorage.setItem(`tsi-events-${user.id}`, JSON.stringify(updatedEvents));
      
      setNewEvent({
        week: currentWeek,
        day: 'Lundi',
        type: 'DS',
        subject: '',
        time: '',
        duration: '',
        date: ''
      });
      setShowAddEvent(false);
    }
  };

  const deleteCustomEvent = (id) => {
    const updatedEvents = customEvents.filter(e => e.id !== id);
    setCustomEvents(updatedEvents);
    localStorage.setItem(`tsi-events-${user.id}`, JSON.stringify(updatedEvents));
  };

  const getDaySchedule = (week, day) => {
    const base = baseSchedule[day] || [];
    const custom = customEvents.filter(e => e.week === week && e.day === day);
    return [...base, ...custom];
  };

  const getTypeColor = (type) => {
    const colors = {
      'cours': 'bg-blue-500/20 border-blue-500/50 text-blue-300',
      'TD': 'bg-green-500/20 border-green-500/50 text-green-300',
      'TP': 'bg-purple-500/20 border-purple-500/50 text-purple-300',
      'DS': 'bg-red-500/20 border-red-500/50 text-red-300',
      'Colle': 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
      'DM': 'bg-orange-500/20 border-orange-500/50 text-orange-300'
    };
    return colors[type] || 'bg-slate-500/20 border-slate-500/50 text-slate-300';
  };

  const addCourse = async () => {
    if (newCourse.subject && newCourse.chapter) {
      const course = {
        id: Date.now(),
        ...newCourse,
        reviewCount: 0,
        mastery: 0,
        estimatedHours: 3,
        oneDriveLinks: newCourse.oneDriveLinks || [],
        lastReviewed: null,
        reviewHistory: []
      };
      
      await saveCourseToSupabase(course);
      
      setNewCourse({
        subject: '',
        chapter: '',
        content: '',
        difficulty: 3,
        priority: 3,
        dateAdded: new Date().toISOString().split('T')[0],
        oneDriveLinks: []
      });
      setNewOneDriveLink('');
      setNewLinkName('');
      setShowAddCourse(false);
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Maths': 'from-blue-600 to-cyan-600',
      'Physique': 'from-purple-600 to-pink-600',
      'Méca': 'from-green-600 to-emerald-600',
      'Elec': 'from-yellow-600 to-orange-600',
      'Anglais': 'from-red-600 to-rose-600',
      'Français': 'from-indigo-600 to-violet-600',
      'Informatique': 'from-slate-600 to-gray-600'
    };
    return colors[subject] || 'from-slate-600 to-slate-700';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-6"><Brain className="w-16 h-16 text-purple-400 mx-auto" /></div>
          <p className="text-purple-200 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-6"><Brain className="w-16 h-16 text-purple-400 mx-auto" /></div>
          <p className="text-purple-200 text-lg">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-b border-indigo-500/20 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TSI1 Manager</h1>
                <p className="text-xs text-slate-400">Connecté : {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Toggle Personnel/Partagé */}
              <div className="flex items-center gap-2 bg-slate-900/50 border border-indigo-500/20 rounded-full p-1">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
                    viewMode === 'personal'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-indigo-300 hover:text-indigo-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Personnel
                </button>
                <button
                  onClick={() => setViewMode('shared')}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-semibold flex items-center gap-2 ${
                    viewMode === 'shared'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-indigo-300 hover:text-indigo-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Classe
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/50 border border-indigo-500/20 rounded-full p-1">
                {[
                  { id: 'planning', label: '📅 Planning' },
                  { id: 'courses', label: '📚 Cours' },
                  { id: 'stats', label: '📊 Stats' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full transition-all text-sm font-semibold ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'text-indigo-300 hover:text-indigo-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={logout}
                className="p-3 bg-red-600/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-600/30 transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text">{daysUntil}</div>
              <div className="text-xs text-indigo-300">jours avant concours</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 min-h-screen w-full">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Mode indicator */}
          <div className="mb-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              {viewMode === 'personal' ? (
                <>
                  <User className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-white font-semibold">Mode Personnel</p>
                    <p className="text-sm text-indigo-300">Vos données personnelles (cours, révisions, flashcards)</p>
                  </div>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-semibold">Mode Classe</p>
                    <p className="text-sm text-purple-300">Données partagées avec toute la classe TSI1</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* TAB PLANNING */}
          {activeTab === 'planning' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">Planning TSI1</h2>
                <p className="text-indigo-300 text-lg">Emploi du temps adaptatif avec planning du soir</p>
              </div>

              {/* Sélecteur de semaine */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                  disabled={currentWeek === 1}
                  className="p-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-center">
                  <div className="text-2xl font-bold">{weekCalendar[currentWeek]?.label || `S${currentWeek}`}</div>
                  <div className="text-sm opacity-90">{weekCalendar[currentWeek]?.dates || ''}</div>
                </div>

                <button
                  onClick={() => setCurrentWeek(Math.min(33, currentWeek + 1))}
                  disabled={currentWeek === 33}
                  className="p-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowAddEvent(true)}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                >
                <Plus className="w-5 h-5" />
                Ajouter
                </button>
                </div>
{/* Week Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 mb-8">
            {days.map(day => {
              const schedule = getDaySchedule(currentWeek, day);
              const hasCustomEvents = customEvents.some(e => e.week === currentWeek && e.day === day);
              
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedDay === day
                      ? 'bg-indigo-600/30 border-indigo-500'
                      : hasCustomEvents
                      ? 'bg-slate-800/50 border-yellow-500/50 hover:border-indigo-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">{day}</h3>
                    {hasCustomEvents && (
                      <span className="text-yellow-400 text-xs">●</span>
                    )}
                  </div>
                  <div className="text-xs text-indigo-300">
                    {schedule.length} cours
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Schedule */}
          {selectedDay && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Journée */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-indigo-400" />
                    Journée - {selectedDay}
                  </h2>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {getDaySchedule(currentWeek, selectedDay).map((item, idx) => {
                    const isCustom = item.id !== undefined;
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${getTypeColor(item.type)} relative`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                                {item.type}
                              </span>
                              {isCustom && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">
                                  Personnalisé
                                </span>
                              )}
                              {item.date && (
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                  📅 {new Date(item.date).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-lg mb-1">{item.subject}</h3>
                            <div className="flex items-center gap-4 text-sm opacity-80">
                              <span>🕐 {item.time}</span>
                              {item.room && <span>📍 {item.room}</span>}
                              {item.duration && <span>⏱️ {item.duration}</span>}
                            </div>
                          </div>
                          {isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Supprimer cet événement ?')) {
                                  deleteCustomEvent(item.id);
                                }
                              }}
                              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Soirée */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  Travail du soir
                </h2>

                <div className="space-y-3">
                  {eveningSchedule[selectedDay] ? (
                    eveningSchedule[selectedDay].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">{item.time}</span>
                        </div>
                        <p className="text-white font-medium">{item.activity}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-8">Pas de planning</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB COURSES */}
      {activeTab === 'courses' && (
        <div className="w-full">
          <div className="mb-12 text-center">
            <h2 className="text-5xl font-bold text-white mb-3">
              {viewMode === 'personal' ? '📚 Mes Cours' : '📚 Cours de la Classe'}
            </h2>
            <p className="text-indigo-300 text-lg">
              {viewMode === 'personal' 
                ? 'Organisez vos cours personnels' 
                : 'Cours partagés avec toute la classe'}
            </p>
          </div>

          <button
            onClick={() => setShowAddCourse(true)}
            className="mb-8 mx-auto block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-lg flex items-center gap-2"
          >
            <Plus className="w-6 h-6" />
            Ajouter un cours
          </button>

          {viewMode === 'personal' ? (
            courses.length === 0 ? (
              <div className="text-center text-white py-12">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p>Aucun cours personnel pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map(course => (
                  <div key={course.id} className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-2">{course.chapter}</h3>
                    <p className="text-slate-400 text-sm">{course.subject}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            sharedCourses.length === 0 ? (
              <div className="text-center text-white py-12">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p>Aucun cours partagé pour le moment</p>
                <p className="text-sm text-slate-400 mt-2">Soyez le premier à partager un cours !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedCourses.map(course => (
                  <div key={course.id} className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                        <p className="text-slate-400 text-sm mb-2">{course.subject}</p>
                        {course.content && (
                          <p className="text-slate-300 text-sm">{course.content}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        Partagé le {new Date(course.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* TAB STATS */}
      {activeTab === 'stats' && (
        <div className="w-full">
          <div className="mb-12 text-center">
            <h2 className="text-5xl font-bold text-white mb-3">📊 Statistiques</h2>
            <p className="text-indigo-300 text-lg">Vue d'ensemble de votre progression</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-8 h-8 text-blue-400" />
                <div className="text-3xl font-bold text-blue-300">{courses.length}</div>
              </div>
              <p className="text-blue-200 font-semibold">
                {viewMode === 'personal' ? 'Mes cours' : 'Cours partagés'}
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-400" />
                <div className="text-3xl font-bold text-purple-300">
                  {viewMode === 'shared' ? sharedCourses.length : courses.length}
                </div>
              </div>
              <p className="text-purple-200 font-semibold">Ressources disponibles</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8 text-green-400" />
                <div className="text-3xl font-bold text-green-300">{customEvents.length}</div>
              </div>
              <p className="text-green-200 font-semibold">Événements planifiés</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <div className="text-3xl font-bold text-red-300">
                  {getUpcomingTests(currentWeek, 14).length}
                </div>
              </div>
              <p className="text-red-200 font-semibold">Évaluations à venir</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Modal Ajouter Événement */}
  {showAddEvent && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Ajouter un événement</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">Matière</label>
            <input
              type="text"
              value={newEvent.subject}
              onChange={(e) => setNewEvent({...newEvent, subject: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Maths, Physique..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">Type</label>
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="DS">DS</option>
              <option value="DM">DM</option>
              <option value="Colle">Colle</option>
              <option value="Examen">Examen</option>
              <option value="TP Noté">TP Noté</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">📅 Date</label>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">Horaire</label>
            <input
              type="text"
              value={newEvent.time}
              onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="14h-16h"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowAddEvent(false)}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={addCustomEvent}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Modal Ajouter Cours */}
  {showAddCourse && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          {viewMode === 'personal' ? 'Ajouter un cours personnel' : 'Partager un cours avec la classe'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">Matière</label>
            <select
              value={newCourse.subject}
              onChange={(e) => setNewCourse({...newCourse, subject: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Sélectionner...</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">Chapitre</label>
            <input
              type="text"
              value={newCourse.chapter}
              onChange={(e) => setNewCourse({...newCourse, chapter: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Nom du chapitre"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">Contenu (optionnel)</label>
            <textarea
              value={newCourse.content}
              onChange={(e) => setNewCourse({...newCourse, content: e.target.value})}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              rows="3"
              placeholder="Description du cours..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowAddCourse(false);
              setNewCourse({
                subject: '',
                chapter: '',
                content: '',
                difficulty: 3,
                priority: 3,
                dateAdded: new Date().toISOString().split('T')[0],
                oneDriveLinks: []
              });
            }}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={addCourse}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            {viewMode === 'personal' ? 'Ajouter' : 'Partager'}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
                    
