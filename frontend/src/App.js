import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Clock, BookOpen, AlertCircle, Plus, X, Brain, Zap, Sparkles,
  Trash2, Upload, File, ChevronDown, ChevronLeft, ChevronRight, Folder,
  FolderOpen, LogOut, Send, MessageCircle, Menu, Download, Copy, FileText,
  HelpCircle, Search, Award, Target, Flame, Bell, Users, Volume2, VolumeX, BellOff
} from 'lucide-react';
import { useAuth } from './AuthContext';
import Login from './Login';
import { supabase } from './supabaseClient';
import Onboarding from './components/Onboarding';
import { Badge } from './components/Badge';
import { BadgeUnlockModal } from './components/BadgeUnlockModal';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationSettings } from './components/NotificationSettings';
import { ToastContainer, useToast } from './components/Toast';
import { useGamification } from './hooks/useGamification';
import { useNotifications } from './hooks/useNotifications';
import { ONBOARDING_COMPLETED_KEY } from './constants';
import { getCurrentSchoolWeek } from './utils/schoolWeek';
import { parseLocalDate, normalizeToMidnight, calculateDaysBetween } from './utils/dateUtils';
import { getDaySchedule as getDayScheduleUtil } from './utils/scheduleUtils';
import { getPreparationDays, getUrgencyMultiplier, getSuggestedDuration, baseScoreByType } from './utils/suggestionHelpers';
import { useSRS } from './hooks/useSRS';
import { useQuiz } from './hooks/useQuiz';
import { getCardStatus, getStatusEmoji, getStatusLabel, isDifficultyCorrect } from './utils/srsAlgorithm';
import { useQuiz } from './hooks/useQuiz';
import { useTheme } from './hooks/useTheme';
import { getThemeClasses } from './utils/themeColors';
import { ThemeToggle } from './components/ThemeToggle';
import { useQuiz } from './hooks/useQuiz';
import { QuizSetup } from './components/QuizSetup';
import { QuizSession } from './components/QuizSession';
import { QuizResults } from './components/QuizResults';
import { useStudyGroups } from './hooks/useStudyGroups';
import { GroupCard } from './components/GroupCard';
import { GroupDetail } from './components/GroupDetail';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { useChatNotifications } from './hooks/useChatNotifications';

// Composant pour rendre les équations LaTeX avec KaTeX
const MathText = ({ children, className = "" }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    const renderMath = () => {
      if (ref.current && window.renderMathInElement && window.katex) {
        try {
          window.renderMathInElement(ref.current, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false}
            ],
            macros: {
              "\\reals": "\\mathbb{R}",
              "\\R": "\\mathbb{R}",
              "\\naturals": "\\mathbb{N}",
              "\\N": "\\mathbb{N}",
              "\\integers": "\\mathbb{Z}",
              "\\Z": "\\mathbb{Z}",
              "\\rationals": "\\mathbb{Q}",
              "\\Q": "\\mathbb{Q}",
              "\\complexes": "\\mathbb{C}",
              "\\C": "\\mathbb{C}"
            },
            throwOnError: false
          });
        } catch (e) {
          // Silently ignore KaTeX errors
        }
      }
    };

    // Attendre que KaTeX soit complètement chargé
    if (window.katex && window.renderMathInElement) {
      setTimeout(renderMath, 50);
    } else {
      // Réessayer plusieurs fois si KaTeX n'est pas encore chargé
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.katex && window.renderMathInElement) {
          clearInterval(interval);
          renderMath();
        } else if (attempts > 20) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [children]);
  
  return <span ref={ref} className={className}>{children}</span>;
};

// ==================== UTILITY FUNCTIONS ====================

// Get current day name in French
const getDayName = () => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const today = new Date();
  return days[today.getDay()];
};

// ==================== MAIN APP ====================
function App() {
  const { user, loading, signOut } = useAuth();
  
  // Theme management
  const { theme, toggleTheme, isDark } = useTheme();
  const themeClasses = getThemeClasses(isDark ? 'dark' : 'light');
  
  // États pour Planning  ← DOIT ÊTRE ICI, À L'INTÉRIEUR DE function App()
  const [currentWeek, setCurrentWeek] = useState(() => getCurrentSchoolWeek());
  const [selectedDay, setSelectedDay] = useState(() => getDayName());
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    week: 10,
    day: 'Lundi',
    type: 'DS',
    subject: '',
    time: '',
    duration: '',
    date: ''
  });

  // Calendrier des semaines TSI 2025-2026 (dates réelles, vacances exclues)
  // Format d'affichage: { dates: 'jour-jour mois', label: 'Sxx' }
  // Note: Ces dates affichent les jours de classe (Lundi-Vendredi) pour l'interface utilisateur.
  // Le calendrier sous-jacent (schoolWeek.js) couvre Lundi-Dimanche pour le calcul des semaines.
  // Les dates complètes au format YYYY-MM-DD sont définies dans schoolWeek.js
  const weekCalendar = {
    1: { dates: '1-5 sept', label: 'S1' },           // 2025-09-01 to 2025-09-05
    2: { dates: '8-12 sept', label: 'S2' },          // 2025-09-08 to 2025-09-12
    3: { dates: '15-19 sept', label: 'S3' },         // 2025-09-15 to 2025-09-19
    4: { dates: '22-26 sept', label: 'S4' },         // 2025-09-22 to 2025-09-26
    5: { dates: '29 sept-3 oct', label: 'S5' },      // 2025-09-29 to 2025-10-03
    6: { dates: '6-10 oct', label: 'S6' },           // 2025-10-06 to 2025-10-10
    7: { dates: '13-17 oct', label: 'S7' },          // 2025-10-13 to 2025-10-17
    // VACANCES TOUSSAINT: 19 oct - 3 nov
    8: { dates: '3-7 nov', label: 'S8' },            // 2025-11-03 to 2025-11-07
    9: { dates: '10-14 nov', label: 'S9' },          // 2025-11-10 to 2025-11-14
    10: { dates: '17-21 nov', label: 'S10' },        // 2025-11-17 to 2025-11-21
    11: { dates: '24-28 nov', label: 'S11' },        // 2025-11-24 to 2025-11-28
    12: { dates: '1-5 déc', label: 'S12' },          // 2025-12-01 to 2025-12-05
    13: { dates: '8-12 déc', label: 'S13' },         // 2025-12-08 to 2025-12-12
    14: { dates: '15-19 déc', label: 'S14' },        // 2025-12-15 to 2025-12-19
    // VACANCES NOËL: 21 déc - 5 jan
    15: { dates: '5-9 jan', label: 'S15' },          // 2026-01-05 to 2026-01-09
    16: { dates: '12-16 jan', label: 'S16' },        // 2026-01-12 to 2026-01-16
    17: { dates: '19-23 jan', label: 'S17' },        // 2026-01-19 to 2026-01-23
    18: { dates: '26-30 jan', label: 'S18' },        // 2026-01-26 to 2026-01-30
    19: { dates: '2-6 fév', label: 'S19' },          // 2026-02-02 to 2026-02-06
    20: { dates: '9-13 fév', label: 'S20' },         // 2026-02-09 to 2026-02-13
    // VACANCES HIVER: 15 fév - 2 mars (zone B)
    21: { dates: '2-6 mars', label: 'S21' },         // 2026-03-02 to 2026-03-06
    22: { dates: '9-13 mars', label: 'S22' },        // 2026-03-09 to 2026-03-13
    23: { dates: '16-20 mars', label: 'S23' },       // 2026-03-16 to 2026-03-20
    24: { dates: '23-27 mars', label: 'S24' },       // 2026-03-23 to 2026-03-27
    25: { dates: '30 mars-3 avr', label: 'S25' },    // 2026-03-30 to 2026-04-03
    26: { dates: '6-10 avr', label: 'S26' },         // 2026-04-06 to 2026-04-10
    // VACANCES PRINTEMPS: 12 avr - 27 avr
    27: { dates: '27 avr-1 mai', label: 'S27' },     // 2026-04-27 to 2026-05-01
    28: { dates: '4-8 mai', label: 'S28' },          // 2026-05-04 to 2026-05-08
    29: { dates: '11-15 mai', label: 'S29' },        // 2026-05-11 to 2026-05-15
    30: { dates: '18-22 mai', label: 'S30' },        // 2026-05-18 to 2026-05-22
    31: { dates: '25-29 mai', label: 'S31' },        // 2026-05-25 to 2026-05-29
    32: { dates: '1-5 juin', label: 'S32' },         // 2026-06-01 to 2026-06-05
    33: { dates: '8-12 juin', label: 'S33' }         // 2026-06-08 to 2026-06-12
  };

  // États pour Cours et Flashcards
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('planning');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null);
  
  // États pour Flashcards
  const [selectedCourseForFlashcards, setSelectedCourseForFlashcards] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState({ correct: 0, incorrect: 0, skipped: 0 });
  const [showAddFlashcard, setShowAddFlashcard] = useState(false);
  const [showEditFlashcard, setShowEditFlashcard] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [newFlashcard, setNewFlashcard] = useState({
    courseId: '',
    question: '',
    answer: ''
  });
  const [showFlashcardPreview, setShowFlashcardPreview] = useState(false);
  
  // États pour arborescence des flashcards
  const [expandedSubjects, setExpandedSubjects] = useState(() => {
    const saved = localStorage.getItem('expandedSubjects');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedChapters, setExpandedChapters] = useState(() => {
    const saved = localStorage.getItem('expandedChapters');
    return saved ? JSON.parse(saved) : {};
  });
  
  // États pour navigation responsive
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // État pour le tutoriel d'onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // États pour la recherche globale
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState({ courses: [], flashcards: [] });
  
  // États pour Import/Export de flashcards
  const [showImportExport, setShowImportExport] = useState(false);
  const [showAnkiImport, setShowAnkiImport] = useState(false);
  const [showNotionImport, setShowNotionImport] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showNojiImport, setShowNojiImport] = useState(false);
  const [notionImportText, setNotionImportText] = useState('');
  const [importCourseId, setImportCourseId] = useState('');
  const [selectedCoursesForExport, setSelectedCoursesForExport] = useState([]);
  
  // États pour SRS (Spaced Repetition System)
  const [isSRSMode, setIsSRSMode] = useState(false);  // Mode révision SRS vs mode normal
  const [srsFlashcards, setSrsFlashcards] = useState([]);  // Cartes SRS avec données
  const [currentSRSIndex, setCurrentSRSIndex] = useState(0);

  // Hook SRS
  const srs = useSRS(user?.id);
  
  // Hook Quiz
  const quiz = useQuiz(user?.id);
  
  // États pour Quiz
  const [quizView, setQuizView] = useState('home'); // 'home' | 'setup' | 'session' | 'results'
  const [quizError, setQuizError] = useState(null);
  
  // États pour Chat/Discussions
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Hook de gamification
  const {
    badges,
    unlockedBadges,
    userProfile,
    dailyStats,
    newBadge,
    isLoading: isLoadingGamification,
    addXP,
    updateDailyStats,
    incrementCardsCreated,
    setNewBadge
  } = useGamification(user?.id);
  
  // Hook de notifications
  const {
    settings: notificationSettings,
    reminders,
    permission: notificationPermission,
    unreadCount,
    updateSettings: updateNotificationSettings,
    requestPermission: requestNotificationPermission,
    dismissReminder,
    dismissAllReminders
  } = useNotifications(user?.id);
  
  // Hook de toasts
  const { toasts, removeToast, showSuccess, showInfo, showWarning } = useToast();
  
  // États pour les notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // Hook de groupes d'étude
  const studyGroups = useStudyGroups(user?.id);
  
  // Hook de notifications de chat
  const chatNotifications = useChatNotifications(user?.id, selectedChannel, channels);
  
  // États pour les groupes d'étude
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [groupLeaderboard, setGroupLeaderboard] = useState([]);
  
  const [newCourse, setNewCourse] = useState({
    subject: '',
    chapter: '',
    content: '',
    difficulty: 3,
    priority: 3,
    dateAdded: new Date().toISOString().split('T')[0],
    oneDriveLinks: []
  });

  // Constantes
  const SCROLL_DELAY_MS = 100;
  const DEFAULT_USERNAME = 'Anonyme';
  const MAX_MESSAGES_PER_FETCH = 100;
  const REALTIME_FALLBACK_DELAY_MS = 1000; // Délai avant suppression locale si Realtime échoue

  // États pour gérer l'ajout de liens OneDrive
  const [newOneDriveLink, setNewOneDriveLink] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

  // États pour les paramètres de révision
  const [showRevisionSettings, setShowRevisionSettings] = useState(false);
  const [revisionSettings, setRevisionSettings] = useState(() => {
    const saved = localStorage.getItem('revisionSettings');
    return saved ? JSON.parse(saved) : {
      startTime: '19:15',
      totalDuration: 120, // minutes
      sessionDuration: 45, // minutes
      prioritySubjects: [],
      restDays: ['Vendredi', 'Samedi']
    };
  });

  // Emploi du temps de base
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
      { subject: 'Maths', duration: '30 min - 1h', tasks: [
        'Reprise des cours de la semaine précédente',
        'Préparation des exercices pour le mardi',
        'Noter toutes les questions pour les poser le lendemain',
        'Répertorier les exercices de colles pertinents ou difficiles'
      ]},
      { subject: 'SII', duration: '1h30', tasks: [
        'Revoir et assimiler le cours',
        'Reprise des TD du jour'
      ]}
    ],
    'Mardi': [
      { subject: 'Maths', duration: '30 min - 1h', tasks: [
        'Compréhension et apprentissage du cours du jour',
        'Préparation des exercices pour le mercredi',
        'Noter toutes les questions pour les poser aux prochains cours'
      ]},
      { subject: 'Physique', duration: '30 - 45 min', tasks: [
        'Apprentissage du cours du jour (faire des cartes Anki ou une carte mentale)',
        'Reprise des exercices du jour (EC en priorité)'
      ]},
      { subject: 'Anglais', duration: '10 min', tasks: [
        'Exercices sur test-english.com'
      ]}
    ],
    'Mercredi': [
      { subject: 'Physique', duration: '30 - 45 min', tasks: [
        'Reprise du cours du mardi (réviser ses cartes Anki ou sa carte mentale)',
        'Reprise des exercices du jour',
        'Ou finalisation du compte-rendu de TP'
      ]},
      { subject: 'Maths', duration: '30 min', tasks: [
        'Compréhension et apprentissage du cours du jour',
        'Noter toutes les questions pour les poser aux prochains cours',
        'Préparation des exercices pour le jeudi'
      ]},
      { subject: 'SII', duration: '1h', tasks: [
        'Refaire les TD'
      ]},
      { subject: 'Français', duration: '30 min', tasks: [
        'Relire le cours',
        'Lister les questions sur les points jugés difficiles'
      ]},
      { subject: 'Anglais', duration: '10 min', tasks: [
        'Exercices sur test-english.com'
      ]}
    ],
    'Jeudi': [
      { subject: 'Maths', duration: '30 min - 1h', tasks: [
        'Compréhension et apprentissage du cours du jour',
        'Préparation des exercices pour le mardi',
        'Pointer tous les items du programme de colle de la semaine suivante'
      ]},
      { subject: 'SII', duration: '1h', tasks: [
        'Finir la présentation et la synthèse des TP',
        'Ou comprendre et savoir refaire les parties théoriques des TP'
      ]},
      { subject: 'Physique', duration: '30 - 45 min', tasks: [
        'Reprise du cours du mardi (réviser ses cartes Anki ou sa carte mentale)',
        'Noter les questions à poser le vendredi',
        'Préparation des exercices pour le vendredi'
      ]},
      { subject: 'Info', duration: '15 min', tasks: [
        'Apprentissage du cours en vue de l\'évaluation du jeudi'
      ]},
      { subject: 'Français', duration: '30 min', tasks: [
        'Relire le cours',
        'Lister les questions sur les points jugés difficiles'
      ]},
      { subject: 'Anglais', duration: '10 min', tasks: [
        'Exercices sur test-english.com'
      ]}
    ],
    'Vendredi': [
      { subject: 'Maths', duration: '1h30 - 2h', tasks: [
        'Rédiger à nouveau les exemples du cours et les exercices de base des TD pour préparer les colles',
        'Noter toutes les questions à poser'
      ]},
      { subject: 'Physique', duration: '15 - 30 min', tasks: [
        'Reprise du cours du vendredi (réviser ses cartes Anki ou sa carte mentale)',
        'Noter les questions à poser le mardi'
      ]},
      { subject: 'Anglais', duration: '20 min', tasks: [
        'Exercices sur test-english.com',
        'Relire le cours'
      ]}
    ],
    'Samedi': [
      { subject: 'Préparation DM', duration: '3h', tasks: [
        'Préparation des devoirs maison'
      ]},
      { subject: 'Préparation colles', duration: '2h', tasks: [
        'Préparation des colles'
      ]}
    ],
    'Dimanche': [
      { subject: 'Physique', duration: '1h30', tasks: [
        'Apprentissage du cours du vendredi et assimilation des cours de la semaine',
        'Faire et réviser ses cartes Anki ou une carte mentale',
        'Préparation des exercices pour le mardi',
        'Préparation du TP de la semaine suivante'
      ]},
      { subject: 'Anglais', duration: '1h', tasks: [
        'Relire le cours'
      ]},
      { subject: 'Français', duration: '1h', tasks: [
        'Travail personnel'
      ]},
      { subject: 'Info', duration: '1h', tasks: [
        'Travail personnel'
      ]}
    ]
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const subjects = ['Maths', 'Physique', 'Méca', 'Elec', 'Anglais', 'Français', 'Informatique'];
  const daysUntil = Math.floor((new Date('2027-04-15') - new Date()) / (1000 * 60 * 60 * 24));

  // Fonction de recherche globale
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults({ courses: [], flashcards: [] });
      setShowSearchResults(false);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Filtrer selon l'onglet actif
    if (activeTab === 'flashcards') {
      // Recherche dans les flashcards uniquement
      const matchingFlashcards = flashcards.filter(fc =>
        fc.question.toLowerCase().includes(lowerQuery) ||
        fc.answer.toLowerCase().includes(lowerQuery)
      );
      
      setSearchResults({
        courses: [],
        flashcards: matchingFlashcards.slice(0, 5)
      });
    } else if (activeTab === 'courses') {
      // Recherche dans les cours uniquement
      const matchingCourses = courses.filter(course => 
        course.subject.toLowerCase().includes(lowerQuery) ||
        course.chapter.toLowerCase().includes(lowerQuery) ||
        (course.content && course.content.toLowerCase().includes(lowerQuery))
      );
      
      setSearchResults({
        courses: matchingCourses.slice(0, 5),
        flashcards: []
      });
    }
    
    setShowSearchResults(true);
  };

  // Fonctions
  const getUpcomingTests = (currentWeek, daysAhead = 14) => {
    const tests = [];
    const today = new Date();
    
    customEvents.forEach(event => {
      if (event.type === 'DS' || event.type === 'DM' || event.type === 'Colle' || event.type === 'Examen' || event.type === 'TP Noté') {
        let daysUntil = 0;
        
        // Si l'événement a une date exacte
        if (event.date) {
          // Parser la date en composants locaux pour éviter les problèmes UTC
          const eventDate = parseLocalDate(event.date);
          const todayNormalized = normalizeToMidnight(today);
          daysUntil = calculateDaysBetween(todayNormalized, eventDate);
        } else {
          // Sinon calculer approximativement avec semaine/jour
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

  // eslint-disable-next-line no-unused-vars
  const getWeekIntensity = (weekNum) => {
    const tests = getUpcomingTests(weekNum, 7);
    const dsCount = tests.filter(t => t.type === 'DS').length;
    const colleCount = tests.filter(t => t.type === 'Colle').length;
    const dmCount = tests.filter(t => t.type === 'DM').length;
    
    const intensity = (dsCount * 40) + (colleCount * 25) + (dmCount * 20);
    return Math.min(100, intensity);
  };

  const calculateReviewPriority = (course, weekContext = {}) => {
    if (!course.lastReviewed) {
      return { priority: 100, reason: "Jamais révisé", daysUntilReview: 0, daysSinceReview: 0 };
    }

    const lastReview = new Date(course.lastReviewed);
    const today = new Date();
    const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));
    
    const intervals = [1, 3, 7, 14, 30, 60];
    const reviewCount = course.reviewHistory?.length || 0;
    const optimalInterval = intervals[Math.min(reviewCount, intervals.length - 1)];
    
    const daysUntilReview = optimalInterval - daysSinceReview;
    
    let priority = 0;
    if (daysSinceReview >= optimalInterval) {
      priority = 100 - course.mastery + (daysSinceReview - optimalInterval) * 5;
    } else {
      priority = (daysSinceReview / optimalInterval) * (100 - course.mastery);
    }

    if (weekContext.upcomingTests) {
      const testForThisSubject = weekContext.upcomingTests.find(
        test => test.subject.toLowerCase().includes(course.subject.toLowerCase()) || 
                course.subject.toLowerCase().includes(test.subject.toLowerCase())
      );
      
      if (testForThisSubject) {
        const daysUntilTest = testForThisSubject.daysUntil;
        if (daysUntilTest <= 1) priority += 50;
        else if (daysUntilTest <= 3) priority += 35;
        else if (daysUntilTest <= 7) priority += 20;
      }
    }

    let reason = "";
    if (weekContext.upcomingTests) {
      const testForThisSubject = weekContext.upcomingTests.find(
        test => test.subject.toLowerCase().includes(course.subject.toLowerCase()) || 
                course.subject.toLowerCase().includes(test.subject.toLowerCase())
      );
      if (testForThisSubject && testForThisSubject.daysUntil <= 7) {
        reason = `🎯 ${testForThisSubject.type} dans ${testForThisSubject.daysUntil}j !`;
      } else if (daysSinceReview >= optimalInterval * 1.5) {
        reason = "⚠️ Révision urgente !";
      } else if (daysSinceReview >= optimalInterval) {
        reason = "📌 À réviser maintenant";
      } else if (daysUntilReview <= 1) {
        reason = "📜 Bientôt à réviser";
      } else {
        reason = `✔ OK (${daysUntilReview}j)`;
      }
    } else {
      if (daysSinceReview >= optimalInterval * 1.5) {
        reason = "⚠️ Révision urgente !";
      } else if (daysSinceReview >= optimalInterval) {
        reason = "📌 À réviser maintenant";
      } else if (daysUntilReview <= 1) {
        reason = "📜 Bientôt à réviser";
      } else {
        reason = `✔ OK (${daysUntilReview}j)`;
      }
    }

    return { priority: Math.max(0, Math.min(150, priority)), reason, daysUntilReview, daysSinceReview };
  };

  const markAsReviewed = async (courseId, masteryIncrease = 10) => {
    if (!user) return;
    
    try {
      // Get current progress
      const { data: existingProgress } = await supabase
        .from('user_revision_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();
      
      const currentMastery = existingProgress?.mastery || 0;
      const newMastery = Math.min(100, currentMastery + masteryIncrease);
      const reviewHistory = existingProgress?.review_history || [];
      
      const newHistoryEntry = {
        date: new Date().toISOString().split('T')[0],
        masteryBefore: currentMastery,
        masteryAfter: newMastery
      };
      
      if (existingProgress) {
        // Update existing progress
        await supabase
          .from('user_revision_progress')
          .update({
            mastery: newMastery,
            review_count: existingProgress.review_count + 1,
            last_reviewed: new Date().toISOString(),
            review_history: [...reviewHistory, newHistoryEntry]
          })
          .eq('id', existingProgress.id);
      } else {
        // Insert new progress
        await supabase
          .from('user_revision_progress')
          .insert([{
            user_id: user.id,
            course_id: courseId,
            mastery: newMastery,
            review_count: 1,
            last_reviewed: new Date().toISOString(),
            review_history: [newHistoryEntry]
          }]);
      }
      
      // Update local state
      setCourses(courses.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            lastReviewed: new Date().toISOString().split('T')[0],
            reviewCount: (existingProgress?.review_count || 0) + 1,
            mastery: newMastery,
            reviewHistory: [...reviewHistory, newHistoryEntry]
          };
        }
        return c;
      }));
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      alert('Erreur lors de la mise à jour de la progression');
    }
  };

  // Helper function: Calculate days from a specific day to a test
  const calculateDaysFromDayToTest = (fromDay, test) => {
    const dayIndex = days.indexOf(fromDay);
    const testDayIndex = days.indexOf(test.day);
    
    // If test has an exact date, use it
    if (test.date) {
      const today = new Date();
      const testDate = parseLocalDate(test.date);
      const todayNormalized = normalizeToMidnight(today);
      
      // Calculate total days from today to test
      const totalDaysToTest = calculateDaysBetween(todayNormalized, testDate);
      
      // Calculate days from current day of week to the specified day
      const todayDayIndex = days.indexOf(getDayName());
      let daysToSpecifiedDay = dayIndex - todayDayIndex;
      
      // Adjust for next week if needed
      if (daysToSpecifiedDay < 0) {
        daysToSpecifiedDay += 7;
      }
      
      // Days from the specified day to the test
      return totalDaysToTest - daysToSpecifiedDay;
    } else {
      // Fallback to week/day calculation
      const weekOffset = test.week - currentWeek;
      let daysUntil = (weekOffset * 7) + (testDayIndex - dayIndex);
      return daysUntil;
    }
  };

  const getSuggestedReviews = (day, weekNum = currentWeek) => {
    // Check if it's a rest day
    if (revisionSettings.restDays.includes(day)) {
      return [];
    }

    // Calculate available time based on settings
    const totalSlots = Math.floor(revisionSettings.totalDuration / revisionSettings.sessionDuration);
    
    // Get all upcoming tests (extend window to catch preparation period)
    const upcomingTests = getUpcomingTests(weekNum, 14);
    
    // Calculate priority scores for each subject based on the specific day
    const subjectScores = {};
    subjects.forEach(subject => {
      let score = 0;
      
      // Base score from manual priority
      if (revisionSettings.prioritySubjects.includes(subject)) {
        score += 20;
      }
      
      // Find upcoming tests for this subject
      const subjectTests = upcomingTests.filter(test => 
        test.subject.toLowerCase().includes(subject.toLowerCase()) || 
        subject.toLowerCase().includes(test.subject.toLowerCase())
      );
      
      // For each test, calculate if this day should include preparation
      const relevantTests = [];
      subjectTests.forEach(test => {
        const daysUntilFromThisDay = calculateDaysFromDayToTest(day, test);
        const prepDays = getPreparationDays(test.type);
        
        // Check if we're in the preparation window
        if (daysUntilFromThisDay > 0 && daysUntilFromThisDay <= prepDays) {
          const baseScore = baseScoreByType[test.type] || 30;
          const urgencyMultiplier = getUrgencyMultiplier(daysUntilFromThisDay, test.type);
          const testScore = baseScore * urgencyMultiplier;
          
          score += testScore;
          relevantTests.push({
            ...test,
            daysUntilFromThisDay,
            suggestedDuration: getSuggestedDuration(test.type, daysUntilFromThisDay)
          });
        }
      });
      
      // Find courses for this subject
      const subjectCourses = courses.filter(c => c.subject === subject);
      if (subjectCourses.length > 0) {
        // Bonus if low mastery
        const avgMastery = subjectCourses.reduce((sum, c) => sum + (c.mastery || 0), 0) / subjectCourses.length;
        score += (100 - avgMastery) * 0.2;
        
        // Bonus if not reviewed recently
        const NEVER_REVIEWED_VALUE = Number.MAX_SAFE_INTEGER;
        const oldestReview = subjectCourses.reduce((oldest, c) => {
          if (!c.lastReviewed) return NEVER_REVIEWED_VALUE;
          const days = Math.floor((new Date() - new Date(c.lastReviewed)) / (1000 * 60 * 60 * 24));
          return Math.min(oldest, days);
        }, 0);
        score += Math.min(oldestReview * 2, 30);
      }
      
      subjectScores[subject] = { score, tests: relevantTests };
    });
    
    // Build week context for compatibility
    const weekContext = { upcomingTests };
    
    // Calculate priority for all courses with enriched data
    const coursesWithPriority = courses.map(course => {
      const subjectData = subjectScores[course.subject];
      const hasRelevantTest = subjectData?.tests?.length > 0;
      const firstTest = hasRelevantTest ? subjectData.tests[0] : null;
      
      return {
        ...course,
        ...calculateReviewPriority(course, weekContext),
        subjectScore: subjectData?.score || 0,
        relevantTest: firstTest,
        suggestedDuration: firstTest?.suggestedDuration || '30min - 45min'
      };
    });

    // Group courses by subject
    const coursesBySubject = {};
    coursesWithPriority.forEach(course => {
      if (!coursesBySubject[course.subject]) {
        coursesBySubject[course.subject] = [];
      }
      coursesBySubject[course.subject].push(course);
    });

    // Sort subjects by their score (highest priority first)
    const sortedSubjects = Object.keys(coursesBySubject).sort((a, b) => {
      const scoreA = subjectScores[a]?.score || 0;
      const scoreB = subjectScores[b]?.score || 0;
      return scoreB - scoreA;
    });

    // Build suggestions organized by subject with 1-2 chapters per subject
    const suggestionsBySubject = [];
    let totalChaptersSelected = 0;

    for (const subject of sortedSubjects) {
      if (totalChaptersSelected >= totalSlots) break;
      
      const subjectData = subjectScores[subject];
      const subjectCourses = coursesBySubject[subject];
      
      // Sort chapters by urgency and priority within this subject (create copy to avoid mutation)
      const sortedChapters = [...subjectCourses].sort((a, b) => {
        // First by urgency
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        const urgencyA = a.relevantTest ? (
          a.relevantTest.daysUntilFromThisDay <= 2 ? 'high' : 
          a.relevantTest.daysUntilFromThisDay <= 3 ? 'medium' : 'low'
        ) : (a.priority > 80 ? 'medium' : 'low');
        const urgencyB = b.relevantTest ? (
          b.relevantTest.daysUntilFromThisDay <= 2 ? 'high' : 
          b.relevantTest.daysUntilFromThisDay <= 3 ? 'medium' : 'low'
        ) : (b.priority > 80 ? 'medium' : 'low');
        
        if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
          return urgencyOrder[urgencyB] - urgencyOrder[urgencyA];
        }
        
        // Then by priority score
        return b.priority - a.priority;
      });

      // Select top 1-2 chapters for this subject
      const chaptersToInclude = sortedChapters.slice(0, Math.min(2, totalSlots - totalChaptersSelected));
      
      if (chaptersToInclude.length > 0 && (subjectData?.score > 20 || chaptersToInclude[0].priority > 25)) {
        // Enrich chapters with urgency and reason
        const enrichedChapters = chaptersToInclude.map(course => {
          const hasTest = course.relevantTest != null;
          const test = course.relevantTest;
          
          // Determine urgency based on days until test
          let urgency = 'low';
          let reasonText = 'Révision recommandée';
          
          if (hasTest) {
            const daysUntil = test.daysUntilFromThisDay;
            
            if (daysUntil <= 1) {
              urgency = 'high';
              reasonText = `🎯 ${test.type} dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} - Révision ${test.type === 'DS' || test.type === 'Examen' ? 'approfondie' : 'intensive'}`;
            } else if (daysUntil <= 2) {
              urgency = 'high';
              reasonText = `🎯 ${test.type} dans ${daysUntil} jours`;
            } else if (daysUntil <= 3) {
              urgency = 'medium';
              reasonText = `🎯 ${test.type} dans ${daysUntil} jours`;
            } else {
              urgency = 'low';
              reasonText = `🎯 ${test.type} dans ${daysUntil} jours - Préparation progressive`;
            }
          } else if (course.priority > 80) {
            urgency = 'medium';
            reasonText = 'Révision urgente';
          }
          
          return {
            ...course,
            reason: reasonText,
            urgency: urgency
          };
        });

        suggestionsBySubject.push({
          subject: subject,
          subjectScore: subjectData?.score || 0,
          relevantTests: subjectData?.tests || [],
          chapters: enrichedChapters
        });

        totalChaptersSelected += enrichedChapters.length;
      }
    }

    return suggestionsBySubject;
  };

  // eslint-disable-next-line no-unused-vars
  const getCoursesBySubject = () => {
    const grouped = {};
    subjects.forEach(subject => {
      grouped[subject] = courses.filter(c => c.subject === subject);
    });
    return grouped;
  };

  // eslint-disable-next-line no-unused-vars
  const getSubjectStats = (subject) => {
    const subjectCourses = courses.filter(c => c.subject === subject);
    if (subjectCourses.length === 0) return { avgMastery: 0, totalCourses: 0, totalLinks: 0, totalReviews: 0 };
    
    const avgMastery = Math.round(subjectCourses.reduce((sum, c) => sum + c.mastery, 0) / subjectCourses.length);
    const totalLinks = subjectCourses.reduce((sum, c) => sum + (c.oneDriveLinks?.length || 0), 0);
    const totalReviews = subjectCourses.reduce((sum, c) => sum + c.reviewCount, 0);
    
    return { avgMastery, totalCourses: subjectCourses.length, totalLinks, totalReviews };
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

  // Get evening schedule subject colors with text and background
  const getEveningSubjectColors = (subject) => {
    const colors = {
      'Maths': { text: 'text-blue-400', bg: 'bg-blue-900/30' },
      'Physique': { text: 'text-green-400', bg: 'bg-green-900/30' },
      'SII': { text: 'text-orange-400', bg: 'bg-orange-900/30' },
      'Info': { text: 'text-cyan-400', bg: 'bg-cyan-900/30' },
      'Français': { text: 'text-pink-400', bg: 'bg-pink-900/30' },
      'Anglais': { text: 'text-purple-400', bg: 'bg-purple-900/30' },
      'Préparation DM': { text: 'text-yellow-400', bg: 'bg-yellow-900/30' },
      'Préparation colles': { text: 'text-yellow-400', bg: 'bg-yellow-900/30' }
    };
    return colors[subject] || { text: 'text-slate-400', bg: 'bg-slate-900/30' };
  };

  // Get user's display name from user object
  const getUserDisplayName = (user) => {
    if (!user) return 'Anonyme';
    return user.user_metadata?.name || user.email?.split('@')[0] || 'Anonyme';
  };

  // Toggle expansion for tree view
  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // ==================== SUPABASE DATA FUNCTIONS ====================
  
  // Load shared courses from Supabase
  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Load course links
      const { data: linksData, error: linksError } = await supabase
        .from('shared_course_links')
        .select('*');
      
      if (linksError) throw linksError;
      
      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_revision_progress')
        .select('*')
        .eq('user_id', user?.id);
      
      if (progressError) console.error('Error loading progress:', progressError);
      
      // Merge data
      const coursesWithData = (data || []).map(course => {
        const courseLinks = (linksData || []).filter(link => link.course_id === course.id);
        const progress = (progressData || []).find(p => p.course_id === course.id);
        
        return {
          id: course.id,
          subject: course.subject,
          chapter: course.chapter,
          content: course.content,
          difficulty: course.difficulty || 3,
          priority: 3,
          dateAdded: course.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          oneDriveLinks: courseLinks.map(link => ({
            id: link.id,
            url: link.url,
            name: link.name,
            addedDate: link.created_at?.split('T')[0]
          })),
          reviewCount: progress?.review_count || 0,
          mastery: progress?.mastery || 0,
          lastReviewed: progress?.last_reviewed?.split('T')[0] || null,
          reviewHistory: progress?.review_history || [],
          estimatedHours: 3
        };
      });
      
      setCourses(coursesWithData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Load shared flashcards from Supabase
  const loadFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_flashcards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Load user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_flashcard_stats')
        .select('*')
        .eq('user_id', user?.id);
      
      if (statsError) console.error('Error loading flashcard stats:', statsError);
      
      // Load SRS data
      const { data: srsData, error: srsError } = await supabase
        .from('user_flashcard_srs')
        .select('*')
        .eq('user_id', user?.id);
      
      if (srsError) console.error('Error loading SRS data:', srsError);
      
      // Merge data
      const flashcardsWithStats = (data || []).map(flashcard => {
        const stats = (statsData || []).find(s => s.flashcard_id === flashcard.id);
        const srs = (srsData || []).find(s => s.flashcard_id === flashcard.id);
        
        return {
          id: flashcard.id,
          courseId: flashcard.course_id,
          question: flashcard.question,
          answer: flashcard.answer,
          createdAt: flashcard.created_at,
          lastReviewed: stats?.last_reviewed || null,
          correctCount: stats?.correct_count || 0,
          incorrectCount: stats?.incorrect_count || 0,
          authorName: flashcard.created_by_name || 'Anonyme',
          isImported: !!flashcard.imported_from,
          importSource: flashcard.imported_from || null,
          srsData: srs || null
        };
      });
      
      setFlashcards(flashcardsWithStats);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    }
  };

  // Load personal events from Supabase
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const eventsData = (data || []).map(event => ({
        id: event.id,
        week: event.week,
        day: event.day,
        type: event.type,
        subject: event.subject,
        time: event.time,
        duration: event.duration,
        date: event.date
      }));
      
      setCustomEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await Promise.all([
          loadCourses(),
          loadFlashcards(),
          loadEvents()
        ]);
      }
      setIsLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Check for first-time user onboarding after user is loaded
  useEffect(() => {
    if (user && !isLoading) {
      const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (onboardingCompleted !== 'true') {
        setShowOnboarding(true);
      }
    }
  }, [user, isLoading]);

  // Check for notifications after data is loaded
  useEffect(() => {
    if (user && !isLoading && courses.length > 0 && notificationSettings) {
      const checkNotifications = () => {
        // Check for due cards
        if (srs.stats.due > 0 && notificationSettings.due_cards_reminder_enabled) {
          showInfo(`🔴 ${srs.stats.due} carte${srs.stats.due > 1 ? 's' : ''} à réviser aujourd'hui`);
        }
        
        // Check streak in danger
        if (userProfile && notificationSettings.streak_warning_enabled) {
          const today = new Date().toISOString().split('T')[0];
          const lastActivity = userProfile.last_activity_date;
          
          if (lastActivity) {
            const lastDate = new Date(lastActivity);
            const todayDate = new Date(today);
            const daysSinceActivity = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceActivity >= 1 && userProfile.current_streak > 0) {
              showWarning(`🔥 Ton streak de ${userProfile.current_streak} jours est en danger ! Révise aujourd'hui.`);
            }
          }
        }
        
        // Check upcoming tests
        if (notificationSettings.upcoming_test_reminder_enabled) {
          const daysThreshold = notificationSettings.upcoming_test_days_before || 3;
          const upcomingTests = getUpcomingTests(currentWeek, daysThreshold);
          upcomingTests.forEach(test => {
            showInfo(`📅 ${test.type} de ${test.subject} dans ${test.daysUntil} jour${test.daysUntil > 1 ? 's' : ''}`);
          });
        }
      };

      // Check notifications once after 2 seconds
      const timer = setTimeout(checkNotifications, 2000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, courses, notificationSettings, srs.stats.due, userProfile, currentWeek]);

  // Watch for new badges and show toast
  useEffect(() => {
    if (newBadge && notificationSettings?.goal_achieved_notification_enabled) {
      showSuccess(`🏆 Nouveau badge débloqué : ${newBadge.name} !`, 7000);
    }
  }, [newBadge, notificationSettings, showSuccess]);

  // Save expansion state to localStorage
  useEffect(() => {
    localStorage.setItem('expandedSubjects', JSON.stringify(expandedSubjects));
  }, [expandedSubjects]);

  useEffect(() => {
    localStorage.setItem('expandedChapters', JSON.stringify(expandedChapters));
  }, [expandedChapters]);

  // Remove localStorage sync useEffects

  // Save revision settings to localStorage
  useEffect(() => {
    localStorage.setItem('revisionSettings', JSON.stringify(revisionSettings));
  }, [revisionSettings]);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Charger les salons au démarrage
  useEffect(() => {
    if (user) {
      fetchChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Charger les messages quand le salon change
  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  // Temps réel - S'abonner aux nouveaux messages
  useEffect(() => {
    if (!selectedChannel || !user) return;
    
    const channel = supabase
      .channel(`messages:${selectedChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${selectedChannel.id}`
      }, (payload) => {
        // Éviter les doublons en vérifiant si le message existe déjà
        // Note: O(n) complexity acceptable pour MAX_MESSAGES_PER_FETCH (100) messages
        // TODO: Pour un volume plus important, considérer un Map<id, message> ou Set<id>
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === payload.new.id);
          if (exists) return prev;
          
          // Nouveau message - gérer les notifications
          const newMessage = payload.new;
          
          // Afficher toast pour le canal actuel (sauf si c'est notre message)
          if (newMessage.user_id !== user.id) {
            showInfo(`💬 ${newMessage.user_name}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`);
          }
          
          // Gérer les notifications (son, navigateur, etc.)
          chatNotifications.handleNewMessage(newMessage, true, selectedChannel.name);
          
          return [...prev, payload.new];
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${selectedChannel.id}`
      }, (payload) => {
        // Retirer le message supprimé du state
        // payload.old contient l'ID du message supprimé
        const deletedId = payload.old?.id;
        if (deletedId) {
          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
          console.log('Message deleted via Realtime:', deletedId);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to channel:', selectedChannel.id);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to channel:', selectedChannel.id);
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, user, chatNotifications, showInfo]);

  // Temps réel - S'abonner à tous les messages pour les notifications dans autres canaux
  useEffect(() => {
    if (!user || !channels || channels.length === 0) return;
    
    const channel = supabase
      .channel('all-messages-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new;
        
        // Ne traiter que les messages qui ne sont PAS dans le canal actuel
        if (newMessage.channel_id !== selectedChannel?.id && newMessage.user_id !== user.id) {
          // Trouver le nom du canal
          const channel = channels.find(ch => ch.id === newMessage.channel_id);
          const channelName = channel?.name || 'Inconnu';
          
          // Gérer les notifications pour les autres canaux
          chatNotifications.handleNewMessage(newMessage, false, channelName);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, channels, selectedChannel?.id, chatNotifications]);

  // Demander la permission de notification quand on accède au chat pour la première fois
  useEffect(() => {
    if (activeTab === 'chat' && user && !chatNotifications.permissionRequested) {
      // Demander après un court délai pour ne pas être trop intrusif
      const timer = setTimeout(() => {
        chatNotifications.requestBrowserNotificationPermission();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, user, chatNotifications]);

  // Raccourcis clavier pour la recherche
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ne fonctionne que si la recherche est visible (flashcards ou courses)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        if (activeTab === 'flashcards' || activeTab === 'courses') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
      if (e.key === 'Escape') {
        setShowSearchResults(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Loading check - must be after all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-6"><Brain className="w-16 h-16 text-purple-400 mx-auto" /></div>
          <p className="text-purple-200 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Authentication check - must be after all hooks
  if (!user) {
    return <Login />;
  }

  const addCourse = async () => {
    if (newCourse.subject && newCourse.chapter && user) {
      try {
        // Insert course into Supabase
        const { data: courseData, error: courseError } = await supabase
          .from('shared_courses')
          .insert([{
            subject: newCourse.subject,
            chapter: newCourse.chapter,
            content: newCourse.content,
            difficulty: newCourse.difficulty,
            created_by: user.id
          }])
          .select()
          .single();
        
        if (courseError) throw courseError;
        
        // Insert links if any
        if (newCourse.oneDriveLinks && newCourse.oneDriveLinks.length > 0) {
          const linksToInsert = newCourse.oneDriveLinks.map(link => ({
            course_id: courseData.id,
            url: link.url,
            name: link.name,
            added_by: user.id
          }));
          
          const { error: linksError } = await supabase
            .from('shared_course_links')
            .insert(linksToInsert);
          
          if (linksError) throw linksError;
        }
        
        // Reload courses
        await loadCourses();
        
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
      } catch (error) {
        console.error('Error adding course:', error);
        alert('Erreur lors de l\'ajout du cours');
      }
    }
  };

  const addOneDriveLink = async (isNewCourse = false, courseId = null) => {
    if (!newOneDriveLink.trim()) return;

    const linkData = {
      id: Date.now() + Math.random(),
      url: newOneDriveLink.trim(),
      name: newLinkName.trim() || 'Document OneDrive',
      addedDate: new Date().toISOString().split('T')[0]
    };

    if (isNewCourse) {
      setNewCourse(prev => ({
        ...prev,
        oneDriveLinks: [...(prev.oneDriveLinks || []), linkData]
      }));
    } else if (courseId && user) {
      try {
        // Insert link into Supabase
        const { error } = await supabase
          .from('shared_course_links')
          .insert([{
            course_id: courseId,
            url: linkData.url,
            name: linkData.name,
            added_by: user.id
          }]);
        
        if (error) throw error;
        
        // Reload courses
        await loadCourses();
      } catch (error) {
        console.error('Error adding link:', error);
        alert('Erreur lors de l\'ajout du lien');
        return;
      }
    }

    setNewOneDriveLink('');
    setNewLinkName('');
  };

  const deleteOneDriveLink = async (courseId, linkId) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('shared_course_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      
      // Reload courses
      await loadCourses();
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Erreur lors de la suppression du lien');
    }
  };

  const deleteOneDriveLinkFromNewCourse = (linkId) => {
    setNewCourse(prev => ({
      ...prev,
      oneDriveLinks: prev.oneDriveLinks.filter(link => link.id !== linkId)
    }));
  };

  const deleteCourse = async (id) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('shared_courses')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);
      
      if (error) throw error;
      
      // Reload courses and flashcards (cascade delete will handle links and flashcards)
      await Promise.all([loadCourses(), loadFlashcards()]);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Erreur lors de la suppression du cours');
    }
  };

  // Fonctions Flashcards
  const startFlashcardSession = (course) => {
    const courseFlashcards = flashcards.filter(f => f.courseId === course.id);
    if (courseFlashcards.length === 0) {
      alert('Aucune flashcard pour ce cours. Créez-en d\'abord !');
      return;
    }
    setSelectedCourseForFlashcards(course);
    setCurrentFlashcardIndex(0);
    setShowFlashcardAnswer(false);
    setFlashcardStats({ correct: 0, incorrect: 0, skipped: 0 });
  };

  const addFlashcard = async (courseId, question, answer, importedFrom = null) => {
    if (!user) return;
    
    try {
      const userName = getUserDisplayName(user);
      
      const { error } = await supabase
        .from('shared_flashcards')
        .insert([{
          course_id: courseId,
          question,
          answer,
          created_by: user.id,
          created_by_name: userName,
          imported_from: importedFrom
        }]);
      
      if (error) throw error;
      
      // Reload flashcards
      await loadFlashcards();

      // GAMIFICATION: Incrémenter le compteur de cartes créées (seulement si pas importée)
      if (!importedFrom) {
        await incrementCardsCreated(1);
      }
    } catch (error) {
      console.error('Error adding flashcard:', error);
      alert('Erreur lors de l\'ajout de la flashcard');
    }
  };

  const deleteFlashcard = async (flashcardId) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('shared_flashcards')
        .delete()
        .eq('id', flashcardId);
      
      if (error) throw error;
      
      // Reload flashcards
      await loadFlashcards();
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      alert('Erreur lors de la suppression de la flashcard');
    }
  };

  const openAddFlashcardModal = (courseId = '') => {
    setNewFlashcard({
      courseId: courseId,
      question: '',
      answer: ''
    });
    setShowFlashcardPreview(false);
    setShowAddFlashcard(true);
  };

  const openEditFlashcardModal = (flashcard) => {
    setEditingFlashcard(flashcard);
    setNewFlashcard({
      courseId: flashcard.courseId,
      question: flashcard.question,
      answer: flashcard.answer
    });
    setShowFlashcardPreview(false);
    setShowEditFlashcard(true);
  };

  const handleCreateFlashcard = async () => {
    if (!newFlashcard.courseId || !newFlashcard.question.trim() || !newFlashcard.answer.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    await addFlashcard(newFlashcard.courseId, newFlashcard.question, newFlashcard.answer);
    setShowAddFlashcard(false);
    setNewFlashcard({ courseId: '', question: '', answer: '' });
  };

  const handleUpdateFlashcard = async () => {
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('shared_flashcards')
        .update({
          question: newFlashcard.question,
          answer: newFlashcard.answer
        })
        .eq('id', editingFlashcard.id);
      
      if (error) throw error;
      
      await loadFlashcards();
      setShowEditFlashcard(false);
      setEditingFlashcard(null);
      setNewFlashcard({ courseId: '', question: '', answer: '' });
    } catch (error) {
      console.error('Error updating flashcard:', error);
      alert('Erreur lors de la mise à jour de la flashcard');
    }
  };

  const handleDeleteFlashcardWithConfirm = (flashcardId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette flashcard ?')) {
      deleteFlashcard(flashcardId);
    }
  };

  const handleFlashcardAnswer = async (isCorrect) => {
    if (!user) return;
    
    const courseFlashcards = flashcards.filter(f => f.courseId === selectedCourseForFlashcards.id);
    const currentFlashcard = courseFlashcards[currentFlashcardIndex];
    
    // Update user flashcard stats in Supabase
    try {
      const { data: existingStats } = await supabase
        .from('user_flashcard_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('flashcard_id', currentFlashcard.id)
        .single();
      
      if (existingStats) {
        // Update existing stats
        await supabase
          .from('user_flashcard_stats')
          .update({
            correct_count: isCorrect ? existingStats.correct_count + 1 : existingStats.correct_count,
            incorrect_count: !isCorrect ? existingStats.incorrect_count + 1 : existingStats.incorrect_count,
            last_reviewed: new Date().toISOString()
          })
          .eq('id', existingStats.id);
      } else {
        // Insert new stats
        await supabase
          .from('user_flashcard_stats')
          .insert([{
            user_id: user.id,
            flashcard_id: currentFlashcard.id,
            correct_count: isCorrect ? 1 : 0,
            incorrect_count: !isCorrect ? 1 : 0,
            last_reviewed: new Date().toISOString()
          }]);
      }
      
      // Update local state
      setFlashcards(flashcards.map(f => {
        if (f.id === currentFlashcard.id) {
          return {
            ...f,
            lastReviewed: new Date().toISOString(),
            correctCount: isCorrect ? f.correctCount + 1 : f.correctCount,
            incorrectCount: !isCorrect ? f.incorrectCount + 1 : f.incorrectCount
          };
        }
        return f;
      }));

      // GAMIFICATION: Ajouter XP
      const xpEarned = isCorrect ? 10 : 2;
      await addXP(xpEarned);

      // GAMIFICATION: Mettre à jour les stats quotidiennes
      await updateDailyStats({
        reviews_count: 1,
        correct_count: isCorrect ? 1 : 0,
        incorrect_count: !isCorrect ? 1 : 0,
        xp_earned: xpEarned,
        sessions_count: 0, // On compte la session à la fin
        time_spent_minutes: 0
      });
    } catch (error) {
      console.error('Error updating flashcard stats:', error);
    }

    // Mettre à jour les stats de la session
    setFlashcardStats(prev => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect
    }));

    // Passer à la carte suivante
    if (currentFlashcardIndex < courseFlashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
      setShowFlashcardAnswer(false);
    } else {
      // Fin de la session
      const finalCorrect = flashcardStats.correct + (isCorrect ? 1 : 0);
      const finalIncorrect = flashcardStats.incorrect + (!isCorrect ? 1 : 0);
      
      // GAMIFICATION: Bonus de fin de session
      await addXP(25); // Bonus pour compléter la session
      
      // GAMIFICATION: Compter cette session
      await updateDailyStats({
        reviews_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        xp_earned: 25,
        sessions_count: 1,
        time_spent_minutes: 0
      });

      alert(`Session terminée !\n✅ Correct: ${finalCorrect}\n❌ Incorrect: ${finalIncorrect}\n\n🎉 +25 XP bonus pour la session complète !`);
      setSelectedCourseForFlashcards(null);
      markAsReviewed(selectedCourseForFlashcards.id, 10);
    }
  };

  const skipFlashcard = () => {
    const courseFlashcards = flashcards.filter(f => f.courseId === selectedCourseForFlashcards.id);
    
    setFlashcardStats(prev => ({
      ...prev,
      skipped: prev.skipped + 1
    }));

    if (currentFlashcardIndex < courseFlashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
      setShowFlashcardAnswer(false);
    } else {
      alert(`Session terminée !\n✅ Correct: ${flashcardStats.correct}\nâŒ Incorrect: ${flashcardStats.incorrect}\nâ­ï¸ Passées: ${flashcardStats.skipped + 1}`);
      setSelectedCourseForFlashcards(null);
    }
  };


  // ==================== FONCTIONS SRS (SPACED REPETITION SYSTEM) ====================
  
  // Démarrer une session de révision SRS
  const startSRSSession = async () => {
    if (!user) return;
    
    try {
      const cards = await srs.loadCardsToReview();
      
      if (cards.length === 0) {
        alert('🎉 Aucune carte à réviser maintenant !\nRevenez plus tard.');
        return;
      }
      
      setSrsFlashcards(cards);
      setCurrentSRSIndex(0);
      setIsSRSMode(true);
      setShowFlashcardAnswer(false);
      setFlashcardStats({ correct: 0, incorrect: 0, skipped: 0 });
    } catch (error) {
      console.error('Error starting SRS session:', error);
      alert('Erreur lors du chargement des cartes à réviser');
    }
  };
  
  // Gérer une réponse SRS avec difficulté
  const handleSRSAnswer = async (difficulty) => {
    if (!user || srsFlashcards.length === 0) return;
    
    const currentCard = srsFlashcards[currentSRSIndex];
    
    try {
      // Enregistrer la révision avec l'algorithme SM-2
      await srs.recordReview(currentCard.id, difficulty);
      
      // Mettre à jour les statistiques de session
      if (difficulty === 'again' || difficulty === 'hard') {
        setFlashcardStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      } else {
        setFlashcardStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      }
      
      // Passer à la carte suivante
      if (currentSRSIndex < srsFlashcards.length - 1) {
        setCurrentSRSIndex(currentSRSIndex + 1);
        setShowFlashcardAnswer(false);
      } else {
        // Fin de la session
        const totalCorrect = flashcardStats.correct + (isDifficultyCorrect(difficulty) ? 1 : 0);
        const totalIncorrect = flashcardStats.incorrect + (!isDifficultyCorrect(difficulty) ? 1 : 0);
        
        alert(`🎉 Session terminée !\n\n✅ Réussies: ${totalCorrect}\n❌ À revoir: ${totalIncorrect}\n\nContinuez comme ça !`);
        setIsSRSMode(false);
        setSrsFlashcards([]);
        setCurrentSRSIndex(0);
        
        // Recharger les statistiques
        await srs.getReviewStats();
        await loadFlashcards();
      }
    } catch (error) {
      console.error('Error handling SRS answer:', error);
      alert('Erreur lors de l\'enregistrement de la révision');
    }
  };
  
  // Quitter la session SRS
  const exitSRSSession = () => {
    setIsSRSMode(false);
    setSrsFlashcards([]);
    setCurrentSRSIndex(0);
    setShowFlashcardAnswer(false);
  };


  // ==================== FONCTIONS IMPORT/EXPORT FLASHCARDS ====================
  
  // Exporter vers Anki (format TSV)
  const exportToAnki = () => {
    if (selectedCoursesForExport.length === 0) {
      alert('Veuillez sélectionner au moins un cours à exporter');
      return;
    }

    const exportFlashcards = flashcards.filter(f => 
      selectedCoursesForExport.includes(f.courseId)
    );

    if (exportFlashcards.length === 0) {
      alert('Aucune flashcard à exporter pour les cours sélectionnés');
      return;
    }

    // Créer le contenu TSV: Question[TAB]Réponse[TAB]Tags
    const tsvContent = exportFlashcards.map(f => {
      const course = courses.find(c => c.id === f.courseId);
      const tags = course ? `${course.subject},${course.chapter}` : 'TSI';
      return `${f.question}\t${f.answer}\t${tags}`;
    }).join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([tsvContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flashcards_anki_export.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ ${exportFlashcards.length} flashcards exportées vers Anki`);
  };

  // Exporter vers Notion (format Markdown)
  const exportToNotion = () => {
    if (selectedCoursesForExport.length === 0) {
      alert('Veuillez sélectionner au moins un cours à exporter');
      return;
    }

    const exportFlashcards = flashcards.filter(f => 
      selectedCoursesForExport.includes(f.courseId)
    );

    if (exportFlashcards.length === 0) {
      alert('Aucune flashcard à exporter pour les cours sélectionnés');
      return;
    }

    // Créer le tableau Markdown
    let markdown = '| Question | Réponse | Matière | Chapitre |\n';
    markdown += '|----------|---------|---------|----------|\n';
    
    exportFlashcards.forEach(f => {
      const course = courses.find(c => c.id === f.courseId);
      const subject = course ? course.subject : 'N/A';
      const chapter = course ? course.chapter : 'N/A';
      // Échapper les backslashes d'abord, puis les pipes et newlines dans le contenu
      const question = f.question.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const answer = f.answer.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      markdown += `| ${question} | ${answer} | ${subject} | ${chapter} |\n`;
    });

    // Copier dans le presse-papiers
    navigator.clipboard.writeText(markdown).then(() => {
      alert(`✅ ${exportFlashcards.length} flashcards copiées pour Notion\nCollez-les dans votre page Notion`);
    }).catch(() => {
      // Fallback si le clipboard ne fonctionne pas
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert(`✅ ${exportFlashcards.length} flashcards copiées pour Notion\nCollez-les dans votre page Notion`);
    });
  };

  // Importer depuis Anki
  const handleAnkiImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        alert('Le fichier est vide');
        return;
      }

      if (!importCourseId) {
        alert('Veuillez sélectionner un cours de destination');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 2) {
          const question = parts[0].trim();
          const answer = parts[1].trim();
          
          if (question && answer) {
            try {
              const userName = getUserDisplayName(user);
              
              const { error } = await supabase
                .from('shared_flashcards')
                .insert([{
                  course_id: importCourseId,
                  question: question,
                  answer: answer,
                  created_by: user.id,
                  created_by_name: userName,
                  imported_from: 'anki'
                }]);
              
              if (error) throw error;
              successCount++;
            } catch (error) {
              console.error('Error importing flashcard:', error);
              errorCount++;
            }
          }
        }
      }

      // Recharger les flashcards
      await loadFlashcards();
      
      setShowAnkiImport(false);
      setImportCourseId('');
      alert(`✅ Import terminé\n${successCount} flashcards importées\n${errorCount} erreurs`);
    };

    reader.readAsText(file);
  };

  // Importer depuis Notion
  const handleNotionImport = async () => {
    if (!notionImportText.trim()) {
      alert('Veuillez coller le contenu de votre tableau Notion');
      return;
    }

    if (!importCourseId) {
      alert('Veuillez sélectionner un cours de destination');
      return;
    }

    const lines = notionImportText.split('\n').filter(line => line.trim());
    
    // Ignorer la première ligne (headers) et la ligne de séparation
    const dataLines = lines.slice(2);
    
    if (dataLines.length === 0) {
      alert('Aucune donnée à importer');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const line of dataLines) {
      // Parser le format Markdown table
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      if (cells.length >= 2) {
        const question = cells[0].replace(/\\\|/g, '|').trim();
        const answer = cells[1].replace(/\\\|/g, '|').trim();
        
        if (question && answer) {
          try {
            const userName = getUserDisplayName(user);
            
            const { error } = await supabase
              .from('shared_flashcards')
              .insert([{
                course_id: importCourseId,
                question: question,
                answer: answer,
                created_by: user.id,
                created_by_name: userName,
                imported_from: 'notion'
              }]);
            
            if (error) throw error;
            successCount++;
          } catch (error) {
            console.error('Error importing flashcard:', error);
            errorCount++;
          }
        }
      }
    }

    // Recharger les flashcards
    await loadFlashcards();
    
    setShowNotionImport(false);
    setNotionImportText('');
    setImportCourseId('');
    alert(`✅ Import terminé\n${successCount} flashcards importées\n${errorCount} erreurs`);
  };

  // Toggle course selection for export
  const toggleCourseForExport = (courseId) => {
    setSelectedCoursesForExport(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // ==================== CSV IMPORT/EXPORT ====================

  // Exporter vers CSV
  const exportToCSV = () => {
    if (selectedCoursesForExport.length === 0) {
      alert('Veuillez sélectionner au moins un cours à exporter');
      return;
    }

    const exportFlashcards = flashcards.filter(f => 
      selectedCoursesForExport.includes(f.courseId)
    );

    if (exportFlashcards.length === 0) {
      alert('Aucune flashcard à exporter pour les cours sélectionnés');
      return;
    }

    // Échapper les guillemets et entourer les valeurs de guillemets
    // Normalize special characters to ensure proper encoding
    const escapeCSV = (str) => {
      if (!str) return '""';
      // Convert to string, normalize Unicode (NFC), escape quotes, and wrap in quotes
      const normalized = String(str).normalize('NFC').replace(/"/g, '""');
      return '"' + normalized + '"';
    };

    // Créer le contenu CSV avec en-têtes
    let csvContent = 'question,answer,subject,chapter\n';
    
    exportFlashcards.forEach(f => {
      const course = courses.find(c => c.id === f.courseId);
      const subject = course ? course.subject : 'N/A';
      const chapter = course ? course.chapter : 'N/A';
      
      csvContent += `${escapeCSV(f.question)},${escapeCSV(f.answer)},${escapeCSV(subject)},${escapeCSV(chapter)}\n`;
    });

    // Créer et télécharger le fichier avec encodage UTF-8 BOM
    // UTF-8 BOM ensures proper encoding in Excel and other tools
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flashcards_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ ${exportFlashcards.length} flashcards exportées en CSV`);
  };

  // Importer depuis CSV
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!importCourseId) {
      alert('Veuillez sélectionner un cours de destination');
      event.target.value = ''; // Reset file input
      return;
    }

    // Helper to remove UTF-8 BOM (Byte Order Mark) if present
    const removeBOM = (text) => text.charCodeAt(0) === 0xFEFF ? text.substring(1) : text;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Remove BOM and normalize Unicode to ensure consistent character encoding
        const content = removeBOM(e.target.result).normalize('NFC');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          alert('Le fichier est vide');
          return;
        }

        // Détecter le séparateur (virgule, point-virgule, ou tabulation)
        // Compte les occurrences de chaque séparateur et retourne le plus fréquent
        const detectSeparator = (line) => {
          const separators = [',', ';', '\t'];
          const counts = {};
          
          let inQuotes = false;
          for (let char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (!inQuotes && separators.includes(char)) {
              counts[char] = (counts[char] || 0) + 1;
            }
          }
          
          // Retourner le séparateur avec le plus d'occurrences
          let maxSep = ',';
          let maxCount = 0;
          for (let sep of separators) {
            if (counts[sep] > maxCount) {
              maxCount = counts[sep];
              maxSep = sep;
            }
          }
          return maxSep;
        };

        const separator = detectSeparator(lines[0]);
        
        // Parse CSV with proper quote handling
        // Follows RFC 4180: fields may be quoted, quotes within fields are escaped by doubling
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip the escaped quote (RFC 4180)
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === separator && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        // Détecter si la première ligne est un en-tête
        // Check si tous les éléments de la première ligne sont des chaînes non vides
        // et qu'au moins un contient les mots clés courants
        const firstLine = parseCSVLine(lines[0]);
        const headerKeywords = ['question', 'answer', 'réponse', 'reponse', 'subject', 'matiere', 'matière', 'chapter', 'chapitre'];
        const hasHeader = firstLine.some(cell => 
          headerKeywords.some(keyword => cell.toLowerCase().includes(keyword))
        );

        const startIndex = hasHeader ? 1 : 0;
        let successCount = 0;
        let errorCount = 0;

        for (let i = startIndex; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i]);
          
          if (cells.length >= 2) {
            const question = cells[0].trim();
            const answer = cells[1].trim();
            
            if (question && answer) {
              try {
                const userName = getUserDisplayName(user);
                
                const { error } = await supabase
                  .from('shared_flashcards')
                  .insert([{
                    course_id: importCourseId,
                    question: question,
                    answer: answer,
                    created_by: user.id,
                    created_by_name: userName,
                    imported_from: 'csv'
                  }]);
                
                if (error) throw error;
                successCount++;
              } catch (error) {
                console.error('Error importing flashcard:', error);
                errorCount++;
              }
            }
          }
        }

        // Recharger les flashcards
        await loadFlashcards();
        
        setShowCsvImport(false);
        setImportCourseId('');
        event.target.value = ''; // Reset file input
        alert(`✅ Import terminé\n${successCount} flashcards importées\n${errorCount} erreurs`);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('❌ Erreur lors de la lecture du fichier CSV');
        event.target.value = '';
      }
    };

    // Try to read as UTF-8 first
    reader.readAsText(file, 'UTF-8');
  };

  // ==================== NOJI IA IMPORT/EXPORT ====================

  // Exporter vers Noji IA (JSON)
  const exportToNoji = () => {
    if (selectedCoursesForExport.length === 0) {
      alert('Veuillez sélectionner au moins un cours à exporter');
      return;
    }

    const exportFlashcards = flashcards.filter(f => 
      selectedCoursesForExport.includes(f.courseId)
    );

    if (exportFlashcards.length === 0) {
      alert('Aucune flashcard à exporter pour les cours sélectionnés');
      return;
    }

    // Créer le format JSON Noji IA
    const nojiData = {
      cards: exportFlashcards.map(f => {
        const course = courses.find(c => c.id === f.courseId);
        const tags = course ? [course.subject, course.chapter] : ['TSI'];
        
        return {
          front: f.question,
          back: f.answer,
          tags: tags
        };
      })
    };

    // Créer et télécharger le fichier JSON
    const jsonContent = JSON.stringify(nojiData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flashcards_noji_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ ${exportFlashcards.length} flashcards exportées pour Noji IA`);
  };

  // Importer depuis Noji IA (JSON)
  const handleNojiImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!importCourseId) {
      alert('Veuillez sélectionner un cours de destination');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        
        if (!data.cards || !Array.isArray(data.cards)) {
          alert('❌ Format JSON invalide. Le fichier doit contenir un tableau "cards"');
          return;
        }

        if (data.cards.length === 0) {
          alert('❌ Le fichier ne contient aucune carte');
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const card of data.cards) {
          // Valider que la carte a les propriétés requises
          if (!card || typeof card !== 'object') {
            skippedCount++;
            continue;
          }
          
          if (!card.front || !card.back) {
            skippedCount++;
            continue;
          }
          
          // Valider que front et back sont des chaînes non vides
          const front = String(card.front).trim();
          const back = String(card.back).trim();
          
          if (!front || !back) {
            skippedCount++;
            continue;
          }
          
          try {
            const userName = getUserDisplayName(user);
            
            const { error } = await supabase
              .from('shared_flashcards')
              .insert([{
                course_id: importCourseId,
                question: front,
                answer: back,
                created_by: user.id,
                created_by_name: userName,
                imported_from: 'noji'
              }]);
            
            if (error) throw error;
            successCount++;
          } catch (error) {
            console.error('Error importing flashcard:', error);
            errorCount++;
          }
        }

        // Recharger les flashcards
        await loadFlashcards();
        
        setShowNojiImport(false);
        setImportCourseId('');
        event.target.value = '';
        
        let message = `✅ Import terminé\n${successCount} flashcards importées`;
        if (errorCount > 0) message += `\n${errorCount} erreurs`;
        if (skippedCount > 0) message += `\n${skippedCount} cartes ignorées (invalides)`;
        alert(message);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('❌ Erreur lors de la lecture du fichier JSON. Vérifiez que le format est correct.');
        event.target.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };


  // ==================== FONCTIONS CHAT ====================
  
  // Nettoyer et valider le nom d'utilisateur
  const sanitizeUsername = (username) => {
    if (!username) return DEFAULT_USERNAME;
    
    // Supprimer tous les caractères dangereux et limiter la longueur
    // Autoriser uniquement lettres, chiffres, espaces, et quelques caractères courants
    const cleaned = username
      .replace(/[<>'"&/\\]/g, '') // Supprimer les caractères HTML/script dangereux
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim()
      .substring(0, 50); // Limiter à 50 caractères
    
    return cleaned || DEFAULT_USERNAME;
  };
  
  // Charger les salons
  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .order('type')
        .order('name');
      
      if (error) throw error;
      setChannels(data || []);
      
      // Sélectionner le premier salon par défaut
      if (data && data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error('Erreur chargement salons:', error);
    }
  };

  // Charger les messages d'un salon
  const fetchMessages = async (channelId) => {
    if (!channelId) return;
    
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(MAX_MESSAGES_PER_FETCH);
      
      if (error) throw error;
      setMessages(data || []);
      
      // Scroll vers le bas après chargement
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, SCROLL_DELAY_MS);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Envoyer un message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChannel || !user) return;
    
    try {
      const rawUsername = user.user_metadata?.name || user.email?.split('@')[0];
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          channel_id: selectedChannel.id,
          user_id: user.id,
          user_name: sanitizeUsername(rawUsername),
          content: newMessage.trim()
        }]);
      
      if (error) throw error;
      
      setNewMessage('');
      // Les messages seront ajoutés via le realtime subscription
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  // Supprimer un message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    
    try {
      // Vérifier que l'utilisateur est bien connecté
      if (!user) {
        showWarning('Vous devez être connecté pour supprimer un message');
        return;
      }
      
      // Vérifier que le message existe dans l'état local
      const messageToDelete = messages.find(msg => msg.id === messageId);
      if (!messageToDelete) {
        showWarning('Message introuvable');
        return;
      }
      
      // Vérifier que l'utilisateur est bien le propriétaire du message
      if (messageToDelete.user_id !== user.id) {
        showWarning('Vous ne pouvez supprimer que vos propres messages');
        return;
      }
      
      console.log('Attempting to delete message:', messageId);
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id); // Extra security check
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Message deleted successfully:', messageId);
      showSuccess('Message supprimé avec succès');
      
      // La suppression du state sera gérée par la subscription realtime
      // Mais on peut aussi supprimer localement en cas de problème de realtime
      setTimeout(() => {
        setMessages(prev => {
          const stillExists = prev.some(msg => msg.id === messageId);
          if (stillExists) {
            console.log('Realtime deletion not received, removing locally');
            return prev.filter(msg => msg.id !== messageId);
          }
          return prev;
        });
      }, REALTIME_FALLBACK_DELAY_MS);
      
    } catch (error) {
      console.error('Erreur suppression message:', error);
      
      // Messages d'erreur plus spécifiques basés sur les codes d'erreur Supabase/PostgreSQL
      // PGRST116: Row not found (404)
      // PGRST301: JWT/Auth error (401)
      if (error.code === 'PGRST116' || error.status === 404) {
        showWarning('Message déjà supprimé ou introuvable');
      } else if (error.code === 'PGRST301' || error.status === 401 || error.message?.toLowerCase().includes('auth')) {
        showWarning('Erreur d\'authentification. Veuillez vous reconnecter.');
      } else if (error.code === '42501' || error.message?.toLowerCase().includes('permission') || error.message?.toLowerCase().includes('rls')) {
        showWarning('Vous n\'avez pas la permission de supprimer ce message');
      } else if (error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch')) {
        showWarning('Erreur réseau. Vérifiez votre connexion internet.');
      } else {
        showWarning('Erreur lors de la suppression du message. Veuillez réessayer.');
      }
    }
  };

  // Formater l'heure d'un message
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const addCustomEvent = async () => {
    if (newEvent.subject && newEvent.time && (newEvent.week || newEvent.date) && user) {
      try {
        const eventToAdd = { ...newEvent };
        
        // Si une date est fournie, calculer automatiquement la semaine et le jour
        if (newEvent.date) {
          const selectedDate = new Date(newEvent.date);
          const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][selectedDate.getDay()];
          eventToAdd.day = dayName;
          
          // Utiliser la fonction qui vérifie le vrai calendrier TSI
          eventToAdd.week = getCurrentSchoolWeek(selectedDate);
        }
        
        // Insert into Supabase
        const { error } = await supabase
          .from('user_events')
          .insert([{
            user_id: user.id,
            type: eventToAdd.type,
            subject: eventToAdd.subject,
            date: eventToAdd.date || null,
            time: eventToAdd.time,
            week: eventToAdd.week,
            day: eventToAdd.day,
            duration: eventToAdd.duration
          }]);
        
        if (error) throw error;
        
        // Reload events
        await loadEvents();
        
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
      } catch (error) {
        console.error('Error adding event:', error);
        alert('Erreur lors de l\'ajout de l\'événement');
      }
    }
  };

  const deleteCustomEvent = async (id) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Reload events
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erreur lors de la suppression de l\'événement');
    }
  };

  const getDaySchedule = (week, day) => {
    const base = baseSchedule[day] || [];
    return getDayScheduleUtil(base, customEvents, week, day);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-6"><Brain className="w-16 h-16 text-purple-400 mx-auto" /></div>
          <p className="text-purple-200 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900' : 'light bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}
      onClick={() => setShowSearchResults(false)}
    >
      {/* Header */}
      <nav className={`fixed top-0 left-0 right-0 backdrop-blur-xl border-b z-50 ${themeClasses.bg.secondary}/80 ${themeClasses.border.subtle}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Always visible */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TSI1 Manager</h1>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <div className={`hidden lg:flex items-center gap-1 border rounded-full p-1 ${themeClasses.bg.tertiary} ${themeClasses.border.subtle}`}>
              {[
                { id: 'planning', label: '📅 Planning' },
                { id: 'courses', label: '📚 Cours' },
                { id: 'flashcards', label: '🎴 Révision' },
                { id: 'quiz', label: '📝 Quiz' },
                { id: 'chat', label: '💬 Discussions' },
                { id: 'stats', label: '📊 Stats' },
                { id: 'community', label: '🌐 Communauté' },
                { id: 'groups', label: '👥 Groupes' },
                { id: 'suggestions', label: '🎯 Suggestions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-semibold relative ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : `${themeClasses.text.accent} hover:text-indigo-100`
                  }`}
                >
                  {tab.label}
                  {tab.id === 'chat' && chatNotifications.totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {chatNotifications.totalUnreadCount > 9 ? '9+' : chatNotifications.totalUnreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tablet Navigation - Horizontal scroll with compact tabs */}
            <div className={`hidden md:flex lg:hidden items-center gap-1 border rounded-full p-1 overflow-x-auto max-w-md scrollbar-hide ${themeClasses.bg.tertiary} ${themeClasses.border.subtle}`}>
              {[
                { id: 'planning', icon: '📅', label: 'Planning' },
                { id: 'courses', icon: '📚', label: 'Cours' },
                { id: 'flashcards', icon: '🎴', label: 'Révision' },
                { id: 'quiz', icon: '📝', label: 'Quiz' },
                { id: 'chat', icon: '💬', label: 'Chat' },
                { id: 'stats', icon: '📊', label: 'Stats' },
                { id: 'community', icon: '🌐', label: 'Commu.' },
                { id: 'groups', icon: '👥', label: 'Groupes' },
                { id: 'suggestions', icon: '🎯', label: 'Sugg.' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-full transition-all text-xs font-semibold whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : `${themeClasses.text.accent} hover:text-indigo-100`
                  }`}
                >
                  {tab.icon} {tab.label}
                  {tab.id === 'chat' && chatNotifications.totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {chatNotifications.totalUnreadCount > 9 ? '9+' : chatNotifications.totalUnreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Barre de recherche - Conditionnelle (uniquement pour flashcards et courses) */}
            {(activeTab === 'flashcards' || activeTab === 'courses') && (
              <div className="relative hidden md:block" onClick={(e) => e.stopPropagation()}>
                <div className={`flex items-center border rounded-lg px-3 py-2 ${themeClasses.bg.card} ${themeClasses.border.default}`}>
                  <Search className={`w-4 h-4 mr-2 ${themeClasses.text.muted}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={activeTab === 'flashcards' ? "Rechercher des flashcards..." : "Rechercher des cours..."}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                    className={`bg-transparent outline-none w-48 lg:w-64 ${themeClasses.text.primary} ${isDark ? 'placeholder-slate-400' : 'placeholder-gray-400'}`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                      aria-label="Clear search"
                    >
                      <X className={`w-4 h-4 ${themeClasses.text.muted} ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`} />
                    </button>
                  )}
                </div>
                
                {/* Dropdown des résultats */}
                {showSearchResults && (
                  <div className={`absolute top-full mt-2 w-80 lg:w-96 border rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto ${themeClasses.bg.secondary} ${themeClasses.border.subtle}`}>
                    {searchResults.courses.length === 0 && searchResults.flashcards.length === 0 ? (
                      <p className="p-4 text-slate-400 text-center">Aucun résultat pour "{searchQuery}"</p>
                    ) : (
                      <>
                        {/* Résultats Cours */}
                        {searchResults.courses.length > 0 && (
                          <div className="p-3 border-b border-slate-700">
                            <h4 className="text-xs font-semibold text-slate-400 mb-2">📚 COURS ({searchResults.courses.length})</h4>
                            {searchResults.courses.map(course => (
                              <button
                                key={course.id}
                                onClick={() => {
                                  setActiveTab('courses');
                                  setExpandedSubject(course.subject);
                                  setShowSearchResults(false);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left p-2 hover:bg-slate-800 rounded-lg transition-all"
                              >
                                <span className="text-white font-medium">{course.subject}</span>
                                <span className="text-slate-400"> - {course.chapter}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Résultats Flashcards */}
                        {searchResults.flashcards.length > 0 && (
                          <div className="p-3">
                            <h4 className="text-xs font-semibold text-slate-400 mb-2">🧠 FLASHCARDS ({searchResults.flashcards.length})</h4>
                            {searchResults.flashcards.map(fc => (
                              <button
                                key={fc.id}
                                onClick={() => {
                                  const relatedCourse = courses.find(c => c.id === fc.courseId);
                                  if (relatedCourse) {
                                    setActiveTab('flashcards');
                                    setSelectedCourseForFlashcards(relatedCourse);
                                    setShowSearchResults(false);
                                    setSearchQuery('');
                                  } else {
                                    console.warn(`Course not found for flashcard: ${fc.id} (courseId: ${fc.courseId})`);
                                  }
                                }}
                                className="w-full text-left p-2 hover:bg-slate-800 rounded-lg transition-all"
                              >
                                <MathText className="text-white text-sm truncate">{fc.question}</MathText>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Right section - Days counter and logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text">{daysUntil}</div>
                <div className="text-xs text-indigo-300">jours avant concours</div>
              </div>
              
              {/* Hamburger menu button - Mobile only */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-indigo-300 hover:text-indigo-100 transition-all"
                aria-label="Menu"
              >
                <Menu className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
              </button>
              
              {/* Help button */}
              <button
                onClick={() => setShowOnboarding(true)}
                className="hidden sm:flex px-3 sm:px-4 py-2 bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 rounded-lg hover:bg-indigo-600/50 transition-all font-semibold items-center gap-2 text-sm"
                title="Revoir le tutoriel"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden md:inline">Aide</span>
              </button>
              
              {/* Notification button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hidden sm:flex px-3 sm:px-4 py-2 bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 rounded-lg hover:bg-indigo-600/50 transition-all font-semibold items-center gap-2 text-sm relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold min-w-[20px] text-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Center Dropdown */}
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <NotificationCenter
                      notifications={reminders}
                      onDismiss={dismissReminder}
                      onDismissAll={dismissAllReminders}
                      onClose={() => setShowNotifications(false)}
                      onOpenSettings={() => {
                        setShowNotifications(false);
                        setShowNotificationSettings(true);
                      }}
                    />
                  </>
                )}
              </div>
              
              {/* Theme toggle button */}
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              
              {/* Logout button - Hidden on small mobile */}
              <button
                onClick={signOut}
                className="hidden sm:flex px-3 sm:px-4 py-2 bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-600/50 transition-all font-semibold items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          
          {/* Drawer */}
          <div 
            className={`absolute top-[73px] right-0 left-0 backdrop-blur-xl border-b shadow-2xl ${themeClasses.bg.primary}/95 ${themeClasses.border.subtle}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 space-y-2">
              {[
                { id: 'planning', label: '📅 Planning' },
                { id: 'courses', label: '📚 Cours' },
                { id: 'flashcards', label: '🎴 Révision' },
                { id: 'quiz', label: '📝 Quiz' },
                { id: 'chat', label: '💬 Discussions' },
                { id: 'stats', label: '📊 Stats' },
                { id: 'community', label: '🌐 Communauté' },
                { id: 'groups', label: '👥 Groupes' },
                { id: 'suggestions', label: '🎯 Suggestions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-all text-left font-semibold relative flex items-center justify-between ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : `${themeClasses.text.accent} ${themeClasses.hover} hover:text-indigo-100`
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'chat' && chatNotifications.totalUnreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold animate-pulse">
                      {chatNotifications.totalUnreadCount > 9 ? '9+' : chatNotifications.totalUnreadCount}
                    </span>
                  )}
                </button>
              ))}
              
              {/* Mobile-only actions */}
              <div className={`pt-2 border-t ${themeClasses.border.subtle}`}>
                <div className="px-4 py-2 text-center">
                  <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text">{daysUntil}</div>
                  <div className="text-xs text-indigo-300">jours avant concours</div>
                </div>
                <button
                  onClick={() => {
                    setShowOnboarding(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 mb-2 bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 rounded-lg hover:bg-indigo-600/50 transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Aide / Tutoriel
                </button>
                <button
                  onClick={signOut}
                  className="w-full px-4 py-3 bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-600/50 transition-all font-semibold flex items-center justify-center gap-2 sm:hidden"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-24 pb-12 min-h-screen w-full">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* TAB PLANNING */}
          {activeTab === 'planning' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className={`text-5xl font-bold mb-3 ${themeClasses.text.primary}`}>Planning TSI1</h2>
                <p className={`text-lg ${themeClasses.text.accent}`}>Emploi du temps adaptatif avec planning du soir</p>
              </div>

              {/* Sélecteur de semaine */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                  disabled={currentWeek === 1}
                  className={`p-3 rounded-lg disabled:opacity-30 transition-all ${themeClasses.bg.card} ${themeClasses.text.secondary} ${themeClasses.hover}`}
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
                  className={`p-3 rounded-lg disabled:opacity-30 transition-all ${themeClasses.bg.card} ${themeClasses.text.secondary} ${themeClasses.hover}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setCurrentWeek(getCurrentSchoolWeek());
                    setSelectedDay(getDayName());
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  Aujourd'hui
                </button>

                <button
                  onClick={() => setShowAddEvent(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center gap-2"
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
                  const isToday = day === getDayName() && currentWeek === getCurrentSchoolWeek();
                  
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
                      } ${isToday ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white flex items-center gap-1">
                          {day}
                          {isToday && <span className="text-green-400">●</span>}
                        </h3>
                        {hasCustomEvents && (
                          <span className="text-yellow-400 text-xs">◉</span>
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
                                  <span>🕐 {item.time}</span>
                                  {item.room && <span>📍 {item.room}</span>}
                                  {item.duration && <span>â±ï¸ {item.duration}</span>}
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

                    <div className="space-y-4">
                      {eveningSchedule[selectedDay] ? (
                        eveningSchedule[selectedDay].map((item, idx) => {
                          const colors = getEveningSubjectColors(item.subject);
                          return (
                            <div
                              key={idx}
                              className={`p-4 ${colors.bg} border border-slate-700/50 rounded-lg`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h3 className={`font-bold text-lg ${colors.text}`}>
                                  {item.subject}
                                </h3>
                                <span className="text-sm text-slate-400 font-semibold">
                                  {item.duration}
                                </span>
                              </div>
                              <ul className="space-y-2">
                                {item.tasks.map((task, taskIdx) => (
                                  <li key={taskIdx} className="flex items-start gap-2 text-sm text-slate-300">
                                    <span className="text-indigo-400 mt-1">•</span>
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-slate-400 py-8">Pas de planning</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CHAT/DISCUSSIONS */}
          {activeTab === 'chat' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">💬 Discussions</h2>
                <p className="text-indigo-300 text-lg">Entraide entre étudiants TSI</p>
              </div>

              <div className="max-w-6xl mx-auto">
                {/* Sélecteur de salon */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {channels.map(channel => {
                    const unreadCount = chatNotifications.unreadMessages[channel.id] || 0;
                    return (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition-all relative ${
                          selectedChannel?.id === channel.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                        }`}
                      >
                        {channel.name}
                        {unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedChannel ? (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                    {/* En-tête du salon */}
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-xl font-bold text-white">{selectedChannel.name}</h3>
                          {selectedChannel.subject && (
                            <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded text-xs">
                              {selectedChannel.type === 'subject' ? 'Matière' : selectedChannel.type}
                            </span>
                          )}
                        </div>
                        
                        {/* Notification controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={chatNotifications.toggleSound}
                            className={`p-2 rounded-lg transition-all ${
                              chatNotifications.soundEnabled
                                ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50'
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                            title={chatNotifications.soundEnabled ? 'Son activé' : 'Son désactivé'}
                          >
                            {chatNotifications.soundEnabled ? (
                              <Volume2 className="w-4 h-4" />
                            ) : (
                              <VolumeX className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={chatNotifications.toggleBrowserNotifications}
                            className={`p-2 rounded-lg transition-all ${
                              chatNotifications.browserNotificationsEnabled
                                ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/50'
                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                            }`}
                            title={chatNotifications.browserNotificationsEnabled ? 'Notifications navigateur activées' : 'Notifications navigateur désactivées'}
                          >
                            {chatNotifications.browserNotificationsEnabled ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Zone de messages */}
                    <div className="h-[500px] overflow-y-auto p-4 space-y-3">
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin mb-4">
                              <MessageCircle className="w-8 h-8 text-indigo-400 mx-auto" />
                            </div>
                            <p className="text-slate-400">Chargement des messages...</p>
                          </div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">Aucun message pour le moment</p>
                            <p className="text-slate-500 text-sm mt-2">Soyez le premier à démarrer la conversation !</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {messages.map(msg => (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-xl ${
                                msg.user_id === user?.id
                                  ? 'bg-indigo-900/30 border border-indigo-500/30 ml-12'
                                  : 'bg-slate-900/50 border border-slate-700/50 mr-12'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-semibold ${
                                      msg.user_id === user?.id ? 'text-indigo-300' : 'text-purple-300'
                                    }`}>
                                      {msg.user_name}
                                      {msg.user_id === user?.id && (
                                        <span className="ml-2 text-xs text-indigo-400">(vous)</span>
                                      )}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {formatTime(msg.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-white whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                                {msg.user_id === user?.id && (
                                  <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-all"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Zone de saisie */}
                    <div className="p-4 bg-slate-900/50 border-t border-slate-700/50">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrire un message..."
                          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                          disabled={!user}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || !user}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-5 h-5" />
                          Envoyer
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Sélectionnez un salon pour commencer</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB COURSES */}
          {activeTab === 'courses' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">📚 Bibliothèque de Cours</h2>
                <p className="text-indigo-300 text-lg">Organisez et enrichissez vos cours avec OneDrive</p>
              </div>

              <button
                onClick={() => setShowAddCourse(true)}
                className="mb-8 mx-auto block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-lg flex items-center gap-2"
              >
                <Plus className="w-6 h-6" />
                Ajouter un cours
              </button>

              {courses.length === 0 ? (
                <div className="text-center text-white">
                  <p>Aucun cours pour le moment</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {subjects.map(subject => {
                    const subjectCourses = courses.filter(c => c.subject === subject);
                    if (subjectCourses.length === 0) return null;
                    const isExpanded = expandedSubject === subject;

                    return (
                      <div key={subject} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                          className="w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {isExpanded ? <FolderOpen className="w-6 h-6 text-indigo-400" /> : <Folder className="w-6 h-6 text-slate-400" />}
                            <h3 className={`text-2xl font-bold bg-gradient-to-r ${getSubjectColor(subject)} bg-clip-text text-transparent`}>
                              {subject}
                            </h3>
                            <span className="px-3 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                              {subjectCourses.length}
                            </span>
                          </div>
                          <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="p-6 pt-0 space-y-4">
                            {subjectCourses.map(course => (
                              <div key={course.id} className="p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-2">{course.chapter}</h4>
                                    {course.content && (
                                      <p className="text-sm text-slate-400 mb-3">{course.content}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-indigo-300">📅 {course.dateAdded}</span>
                                      <span className="text-purple-300">🎯 Maîtrise: {course.mastery}%</span>
                                      <span className="text-green-300">✔ {course.reviewCount} révision(s)</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => deleteCourse(course.id)}
                                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>

                                {course.oneDriveLinks && course.oneDriveLinks.length > 0 && (
                                  <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                                    <h5 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                      <File className="w-4 h-4" />
                                      Liens OneDrive ({course.oneDriveLinks.length})
                                    </h5>
                                    <div className="space-y-2">
                                      {course.oneDriveLinks.map(link => (
                                        <div key={link.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                                          <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 flex-1 hover:text-indigo-300 transition-colors"
                                          >
                                            <File className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-white">{link.name}</span>
                                          </a>
                                          <button
                                            onClick={() => deleteOneDriveLink(course.id, link.id)}
                                            className="text-red-400 hover:text-red-300"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      const link = prompt('Coller le lien OneDrive :');
                                      if (link && user) {
                                        const name = prompt('Nom du document (optionnel) :') || 'Document OneDrive';
                                        try {
                                          const { error } = await supabase
                                            .from('shared_course_links')
                                            .insert([{
                                              course_id: course.id,
                                              url: link.trim(),
                                              name: name.trim(),
                                              added_by: user.id
                                            }]);
                                          
                                          if (error) throw error;
                                          
                                          // Reload courses to display the new link
                                          await loadCourses();
                                        } catch (error) {
                                          console.error('Error adding link:', error);
                                          alert('Erreur lors de l\'ajout du lien');
                                        }
                                      }
                                    }}
                                    className="flex-1 px-4 py-2 bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 rounded-lg hover:bg-indigo-600/50 transition-all font-semibold text-sm"
                                  >
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    Ajouter lien OneDrive
                                  </button>
                                  <button
                                    onClick={() => markAsReviewed(course.id)}
                                    className="px-4 py-2 bg-green-600/30 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-600/50 transition-all font-semibold text-sm"
                                  >
                                    Marquer révisé
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">🎴 Révision Active</h2>
                <p className="text-indigo-300 text-lg">Flashcards pour maximiser la rétention</p>
              </div>

              {/* Section SRS - Révisions du jour */}
              {!selectedCourseForFlashcards && !isSRSMode && courses.length > 0 && (
                <div className="mb-8 max-w-4xl mx-auto">
                  <div className="p-6 bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-500/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Brain className="w-8 h-8 text-red-300" />
                        <div>
                          <h3 className="text-2xl font-bold text-white">Révisions du jour</h3>
                          <p className="text-red-200 text-sm">Système de répétition espacée (SRS)</p>
                        </div>
                      </div>
                      {srs.stats.due > 0 && (
                        <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-xl">
                          {srs.stats.due}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <div className="text-red-300 text-2xl font-bold">{srs.stats.due}</div>
                        <div className="text-slate-400 text-xs">À réviser</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <div className="text-yellow-300 text-2xl font-bold">{srs.stats.learning}</div>
                        <div className="text-slate-400 text-xs">En apprentissage</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <div className="text-green-300 text-2xl font-bold">{srs.stats.mastered}</div>
                        <div className="text-slate-400 text-xs">Maîtrisées</div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg">
                        <div className="text-blue-300 text-2xl font-bold">{srs.stats.new}</div>
                        <div className="text-slate-400 text-xs">Nouvelles</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={startSRSSession}
                      disabled={srs.stats.due === 0}
                      className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-500 hover:to-orange-500 transition-all font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Brain className="w-6 h-6" />
                      {srs.stats.due > 0 ? '🧠 Commencer la révision SRS' : '✅ Aucune carte à réviser'}
                    </button>
                  </div>
                </div>
              )}

              {/* Section Import/Export */}
              {!selectedCourseForFlashcards && courses.length > 0 && (
                <div className="mb-8 max-w-4xl mx-auto">
                  <button
                    onClick={() => setShowImportExport(!showImportExport)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 text-blue-300 rounded-xl hover:bg-blue-600/50 transition-all font-semibold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      🔄 Import / Export
                    </span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showImportExport ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showImportExport && (
                    <div className="mt-4 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-6">
                      {/* Import Section */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          📥 Importer
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <button
                            onClick={() => setShowCsvImport(true)}
                            className="p-4 bg-slate-900/50 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all text-left"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <File className="w-5 h-5" />
                              CSV
                            </div>
                            <p className="text-sm text-slate-400">Format .csv standard</p>
                          </button>
                          
                          <button
                            onClick={() => setShowAnkiImport(true)}
                            className="p-4 bg-slate-900/50 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all text-left"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <FileText className="w-5 h-5" />
                              Anki
                            </div>
                            <p className="text-sm text-slate-400">Format .txt (TAB séparé)</p>
                          </button>
                          
                          <button
                            onClick={() => setShowNojiImport(true)}
                            className="p-4 bg-slate-900/50 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all text-left"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Brain className="w-5 h-5" />
                              Noji IA
                            </div>
                            <p className="text-sm text-slate-400">Format .json</p>
                          </button>
                          
                          <button
                            onClick={() => setShowNotionImport(true)}
                            className="p-4 bg-slate-900/50 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all text-left"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Copy className="w-5 h-5" />
                              Notion
                            </div>
                            <p className="text-sm text-slate-400">Tableau Markdown</p>
                          </button>
                        </div>
                      </div>

                      {/* Export Section */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          📤 Exporter
                        </h3>
                        
                        {/* Course Selection for Export */}
                        <div className="mb-4 p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                          <p className="text-sm text-slate-300 mb-3 font-semibold">Sélectionner les cours à exporter :</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {courses.map(course => {
                              const courseFlashcards = flashcards.filter(f => f.courseId === course.id);
                              if (courseFlashcards.length === 0) return null;
                              
                              return (
                                <label key={course.id} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedCoursesForExport.includes(course.id)}
                                    onChange={() => toggleCourseForExport(course.id)}
                                    className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>{course.subject} - {course.chapter} ({courseFlashcards.length} carte{courseFlashcards.length > 1 ? 's' : ''})</span>
                                </label>
                              );
                            })}
                          </div>
                          {selectedCoursesForExport.length > 0 && (
                            <p className="text-sm text-indigo-400 mt-3 font-semibold">
                              Total sélectionné : {flashcards.filter(f => selectedCoursesForExport.includes(f.courseId)).length} flashcards
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <button
                            onClick={exportToCSV}
                            disabled={selectedCoursesForExport.length === 0}
                            className="p-4 bg-slate-900/50 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Download className="w-5 h-5" />
                              CSV
                            </div>
                            <p className="text-sm text-slate-400">Télécharger .csv</p>
                          </button>
                          
                          <button
                            onClick={exportToAnki}
                            disabled={selectedCoursesForExport.length === 0}
                            className="p-4 bg-slate-900/50 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Download className="w-5 h-5" />
                              Anki
                            </div>
                            <p className="text-sm text-slate-400">Télécharger .txt</p>
                          </button>
                          
                          <button
                            onClick={exportToNoji}
                            disabled={selectedCoursesForExport.length === 0}
                            className="p-4 bg-slate-900/50 border border-blue-500/30 rounded-lg hover:border-blue-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Download className="w-5 h-5" />
                              Noji IA
                            </div>
                            <p className="text-sm text-slate-400">Télécharger .json</p>
                          </button>
                          
                          <button
                            onClick={exportToNotion}
                            disabled={selectedCoursesForExport.length === 0}
                            className="p-4 bg-slate-900/50 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              <Copy className="w-5 h-5" />
                              Notion
                            </div>
                            <p className="text-sm text-slate-400">Copier Markdown</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode SRS Review Session */}
              {isSRSMode ? (
                <div className="max-w-3xl mx-auto">
                  <button
                    onClick={exitSRSSession}
                    className="mb-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Quitter la session SRS
                  </button>

                  {(() => {
                    const currentCard = srsFlashcards[currentSRSIndex];
                    if (!currentCard) return null;

                    return (
                      <div>
                        {/* En-tête de session SRS */}
                        <div className="mb-6 p-6 bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/50 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Brain className="w-6 h-6 text-red-300" />
                              <div>
                                <h3 className="text-xl font-bold text-white">Session SRS</h3>
                                <p className="text-sm text-slate-400">
                                  {currentCard.course?.subject} - {currentCard.course?.chapter}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-300">
                                {currentSRSIndex + 1} / {srsFlashcards.length}
                              </div>
                              <div className="text-xs text-slate-400">cartes</div>
                            </div>
                          </div>
                          
                          {/* Stats de session */}
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">✅</span>
                              <span className="text-white font-semibold">{flashcardStats.correct}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-400">❌</span>
                              <span className="text-white font-semibold">{flashcardStats.incorrect}</span>
                            </div>
                          </div>
                        </div>

                        {/* Flashcard SRS */}
                        <div className="mb-6">
                          <div 
                            className="min-h-[300px] p-8 bg-gradient-to-br from-red-900/50 to-orange-900/50 border-2 border-red-500/50 rounded-2xl cursor-pointer hover:border-red-400 transition-all flex items-center justify-center"
                            onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                          >
                            <div className="text-center">
                              {!showFlashcardAnswer ? (
                                <div>
                                  <div className="text-sm text-red-300 mb-4">Question</div>
                                  <MathText className="text-2xl font-bold text-white">{currentCard.question}</MathText>
                                  <p className="text-sm text-slate-400 mt-6">👆 Cliquez pour voir la réponse</p>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm text-orange-300 mb-4">Réponse</div>
                                  <MathText className="text-xl text-white whitespace-pre-wrap">{currentCard.answer}</MathText>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Boutons de difficulté SRS */}
                        {showFlashcardAnswer && (
                          <div className="space-y-4">
                            <p className="text-center text-slate-300 font-semibold mb-2">
                              Comment avez-vous trouvé cette carte ?
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <button
                                onClick={() => handleSRSAnswer('again')}
                                className="px-4 py-6 bg-red-600/30 border-2 border-red-500/50 text-red-300 rounded-xl hover:bg-red-600/50 transition-all font-bold text-center"
                              >
                                <div className="text-3xl mb-2">😫</div>
                                <div className="text-sm">À revoir</div>
                                <div className="text-xs text-red-400 mt-1">&lt; 1 jour</div>
                              </button>
                              <button
                                onClick={() => handleSRSAnswer('hard')}
                                className="px-4 py-6 bg-orange-600/30 border-2 border-orange-500/50 text-orange-300 rounded-xl hover:bg-orange-600/50 transition-all font-bold text-center"
                              >
                                <div className="text-3xl mb-2">😕</div>
                                <div className="text-sm">Difficile</div>
                                <div className="text-xs text-orange-400 mt-1">1-2 jours</div>
                              </button>
                              <button
                                onClick={() => handleSRSAnswer('good')}
                                className="px-4 py-6 bg-green-600/30 border-2 border-green-500/50 text-green-300 rounded-xl hover:bg-green-600/50 transition-all font-bold text-center"
                              >
                                <div className="text-3xl mb-2">🙂</div>
                                <div className="text-sm">Bien</div>
                                <div className="text-xs text-green-400 mt-1">Intervalle normal</div>
                              </button>
                              <button
                                onClick={() => handleSRSAnswer('easy')}
                                className="px-4 py-6 bg-blue-600/30 border-2 border-blue-500/50 text-blue-300 rounded-xl hover:bg-blue-600/50 transition-all font-bold text-center"
                              >
                                <div className="text-3xl mb-2">😊</div>
                                <div className="text-sm">Facile</div>
                                <div className="text-xs text-blue-400 mt-1">Intervalle long</div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : selectedCourseForFlashcards ? (
                // Mode Session de révision
                <div className="max-w-3xl mx-auto">
                  <button
                    onClick={() => setSelectedCourseForFlashcards(null)}
                    className="mb-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Quitter la session
                  </button>

                  {(() => {
                    const courseFlashcards = flashcards.filter(f => f.courseId === selectedCourseForFlashcards.id);
                    const currentCard = courseFlashcards[currentFlashcardIndex];

                    return (
                      <div>
                        {/* En-tête de session */}
                        <div className="mb-6 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white">{selectedCourseForFlashcards.chapter}</h3>
                              <p className="text-sm text-slate-400">{selectedCourseForFlashcards.subject}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-indigo-400">
                                {currentFlashcardIndex + 1} / {courseFlashcards.length}
                              </div>
                              <div className="text-xs text-slate-400">cartes</div>
                            </div>
                          </div>
                          
                          {/* Stats de session */}
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">✅</span>
                              <span className="text-white font-semibold">{flashcardStats.correct}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-400">âŒ</span>
                              <span className="text-white font-semibold">{flashcardStats.incorrect}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400">â­ï¸</span>
                              <span className="text-white font-semibold">{flashcardStats.skipped}</span>
                            </div>
                          </div>
                        </div>

                        {/* Flashcard */}
                        <div className="mb-6">
                          <div 
                            className="min-h-[300px] p-8 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-2 border-indigo-500/50 rounded-2xl cursor-pointer hover:border-indigo-400 transition-all flex items-center justify-center"
                            onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                          >
                            <div className="text-center">
                              {!showFlashcardAnswer ? (
                                <div>
                                  <div className="text-sm text-indigo-300 mb-4">Question</div>
                                  <MathText className="text-2xl font-bold text-white">{currentCard.question}</MathText>
                                  <p className="text-sm text-slate-400 mt-6">👆 Cliquez pour voir la réponse</p>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm text-purple-300 mb-4">Réponse</div>
                                  <MathText className="text-xl text-white whitespace-pre-wrap">{currentCard.answer}</MathText>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Boutons de réponse */}
                        {showFlashcardAnswer && (
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleFlashcardAnswer(false)}
                              className="flex-1 px-6 py-4 bg-red-600/30 border-2 border-red-500/50 text-red-300 rounded-xl hover:bg-red-600/50 transition-all font-bold text-lg"
                            >
                              âŒ Incorrect
                            </button>
                            <button
                              onClick={skipFlashcard}
                              className="px-6 py-4 bg-yellow-600/30 border-2 border-yellow-500/50 text-yellow-300 rounded-xl hover:bg-yellow-600/50 transition-all font-bold"
                            >
                              â­ï¸
                            </button>
                            <button
                              onClick={() => handleFlashcardAnswer(true)}
                              className="flex-1 px-6 py-4 bg-green-600/30 border-2 border-green-500/50 text-green-300 rounded-xl hover:bg-green-600/50 transition-all font-bold text-lg"
                            >
                              ✅ Correct
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                ) : (
                // Mode Sélection de cours avec arborescence
                <div className="space-y-4">
                  {courses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Ajoutez des cours pour créer des flashcards</p>
                    </div>
                  ) : (
                    // Arborescence : Matière > Chapitre > Flashcard
                    subjects.map(subject => {
                      const subjectCourses = courses.filter(c => c.subject === subject);
                      const subjectFlashcards = flashcards.filter(f => 
                        subjectCourses.some(c => c.id === f.courseId)
                      );
                      if (subjectFlashcards.length === 0) return null;
                      
                      const isSubjectExpanded = expandedSubjects[subject];
                      
                      return (
                        <div key={subject} className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                          {/* Header Matière */}
                          <button
                            onClick={() => toggleSubject(subject)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-all rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              {isSubjectExpanded ? (
                                <FolderOpen className="w-6 h-6 text-indigo-400" />
                              ) : (
                                <Folder className="w-6 h-6 text-slate-400" />
                              )}
                              <span className={`font-bold text-xl bg-gradient-to-r ${getSubjectColor(subject)} bg-clip-text text-transparent`}>
                                {subject}
                              </span>
                              <span className="text-sm text-slate-400">({subjectFlashcards.length} cartes)</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isSubjectExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {/* Contenu Matière */}
                          {isSubjectExpanded && (
                            <div className="pl-6 pb-4 space-y-2">
                              {subjectCourses.map(course => {
                                const chapterFlashcards = flashcards.filter(f => f.courseId === course.id);
                                if (chapterFlashcards.length === 0) return null;
                                
                                const isChapterExpanded = expandedChapters[course.id];
                                
                                return (
                                  <div key={course.id} className="border-l-2 border-slate-600 pl-4">
                                    {/* Header Chapitre */}
                                    <div className="flex items-center justify-between p-2 hover:bg-slate-700/30 rounded transition-all">
                                      <button
                                        onClick={() => toggleChapter(course.id)}
                                        className="flex items-center gap-2 flex-1"
                                      >
                                        {isChapterExpanded ? (
                                          <FolderOpen className="w-4 h-4 text-indigo-400" />
                                        ) : (
                                          <Folder className="w-4 h-4 text-slate-400" />
                                        )}
                                        <span className="font-semibold text-white">{course.chapter}</span>
                                        <span className="text-xs text-slate-400">({chapterFlashcards.length})</span>
                                      </button>
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => startFlashcardSession(course)}
                                          className="text-xs bg-green-600/30 px-2 py-1 rounded hover:bg-green-600/50 transition-all"
                                        >
                                          ▶️ Réviser
                                        </button>
                                        <button 
                                          onClick={() => openAddFlashcardModal(course.id)}
                                          className="text-xs bg-indigo-600/30 px-2 py-1 rounded hover:bg-indigo-600/50 transition-all"
                                        >
                                          + Ajouter
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Liste des Flashcards */}
                                    {isChapterExpanded && (
                                      <div className="pl-4 mt-2 space-y-1">
                                        {chapterFlashcards.map(card => {
                                          // Get SRS status for this card
                                          const srsStatus = getCardStatus(card.srsData);
                                          const statusEmoji = getStatusEmoji(srsStatus);
                                          const statusLabel = getStatusLabel(srsStatus);
                                          
                                          return (
                                          <div key={card.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-sm hover:bg-slate-800/50 transition-all">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <span title={statusLabel}>{statusEmoji}</span>
                                              <span 
                                                className="truncate max-w-xs text-white" 
                                                title={card.question}
                                              >
                                                {card.question}
                                              </span>
                                              <span className="text-xs text-indigo-400 whitespace-nowrap">— par {card.authorName}</span>
                                              {card.isImported && (
                                                <span className="text-xs bg-blue-500/20 text-blue-300 px-1 rounded whitespace-nowrap">
                                                  importé ({card.importSource})
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                              <span className="text-xs text-green-400">✅{card.correctCount}</span>
                                              <span className="text-xs text-red-400">❌{card.incorrectCount}</span>
                                              <button 
                                                onClick={() => openEditFlashcardModal(card)}
                                                className="p-1 hover:bg-slate-700 rounded"
                                                title="Modifier"
                                              >
                                                ✏️
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteFlashcardWithConfirm(card.id)}
                                                className="p-1 hover:bg-red-900/30 rounded text-red-400"
                                                title="Supprimer"
                                              >
                                                🗑
                                              </button>
                                            </div>
                                          </div>
                                        )})}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">🎯 Suggestions Intelligentes</h2>
                <p className="text-indigo-300 text-lg">Planning adaptatif basé sur vos cours et DS</p>
                
                {/* Settings Button */}
                <button
                  onClick={() => setShowRevisionSettings(true)}
                  className="mt-4 px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2 mx-auto"
                >
                  ⚙️ Paramètres de révision
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Ajoutez des cours pour obtenir des suggestions de révision</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Évaluations à venir */}
                  {getUpcomingTests(currentWeek, 14).length > 0 && (
                    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-2xl p-6">
                      <h3 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        Évaluations à venir
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getUpcomingTests(currentWeek, 14).map((test, idx) => (
                          <div key={idx} className="p-4 bg-slate-900/50 rounded-lg border border-red-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(test.type)}`}>
                                {test.type}
                              </span>
                              <span className="text-red-300 font-bold">
                                {test.daysUntil === 0 ? "Aujourd'hui" : test.daysUntil === 1 ? "Demain" : `J-${test.daysUntil}`}
                              </span>
                            </div>
                            <h4 className="font-bold text-white mb-1">{test.subject}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <span>{test.day}</span>
                              {test.date && (
                                <span className="text-blue-300">
                                  • {new Date(test.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              <span>• {test.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions par jour */}
                  <div className="grid grid-cols-1 gap-6">
                    {days.map(day => {
                      const suggestionsBySubject = getSuggestedReviews(day, currentWeek);
                      if (suggestionsBySubject.length === 0) return null;

                      const totalChapters = suggestionsBySubject.reduce((sum, s) => sum + s.chapters.length, 0);

                      return (
                        <div key={day} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                              <Calendar className="w-6 h-6 text-indigo-400" />
                              {day}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="px-4 py-2 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                                {suggestionsBySubject.length} matière{suggestionsBySubject.length > 1 ? 's' : ''}
                              </span>
                              <span className="px-4 py-2 bg-purple-900/50 text-purple-300 rounded-full text-sm font-semibold">
                                {totalChapters} chapitre{totalChapters > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {suggestionsBySubject.map((subjectGroup, subjectIdx) => (
                              <div key={subjectIdx} className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-5">
                                {/* Subject Header */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <span className={`px-4 py-2 bg-gradient-to-r ${getSubjectColor(subjectGroup.subject)} rounded-lg text-sm font-bold text-white shadow-lg`}>
                                        📚 {subjectGroup.subject}
                                      </span>
                                      {subjectGroup.relevantTests && subjectGroup.relevantTests.length > 0 && (
                                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs font-semibold border border-red-500/30">
                                          🎯 {subjectGroup.relevantTests[0].type} dans {subjectGroup.relevantTests[0].daysUntilFromThisDay}j
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-400">
                                      {subjectGroup.chapters.length} chapitre{subjectGroup.chapters.length > 1 ? 's' : ''} à réviser
                                    </span>
                                  </div>
                                </div>

                                {/* Chapters List */}
                                <div className="space-y-3">
                                  {subjectGroup.chapters.map((course, chapterIdx) => (
                                    <div key={course.id} className={`p-4 rounded-lg border ${
                                      course.urgency === 'high' ? 'border-red-500/50 bg-red-900/10' : 
                                      course.urgency === 'medium' ? 'border-orange-500/50 bg-orange-900/10' : 
                                      'border-slate-700/50 bg-slate-800/50'
                                    }`}>
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-indigo-600/40 text-indigo-200 rounded text-xs font-bold border border-indigo-500/30">
                                              📖 Suggestion {chapterIdx + 1}
                                            </span>
                                            {course.urgency === 'high' && (
                                              <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                                                🔥 URGENT
                                              </span>
                                            )}
                                            {course.urgency === 'medium' && (
                                              <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs font-semibold">
                                                ⚠️ BIENTÔT
                                              </span>
                                            )}
                                          </div>
                                          <h4 className="text-xl font-bold text-white mb-2">{course.chapter}</h4>
                                          <p className="text-sm text-indigo-300 mb-2">💡 {course.reason}</p>
                                          {course.suggestedDuration && (
                                            <p className="text-sm text-green-300 mb-2">⏱️ {course.suggestedDuration} recommandées</p>
                                          )}
                                          <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <span>🎯 Maîtrise: {course.mastery || 0}%</span>
                                            <span>🔄 {course.reviewCount || 0} révision(s)</span>
                                            {course.lastReviewed && (
                                              <span>📅 {new Date(course.lastReviewed).toLocaleDateString('fr-FR')}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          <button
                                            onClick={() => markAsReviewed(course.id, 15)}
                                            className="px-4 py-2 bg-green-600/30 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-600/50 transition-all font-semibold text-sm whitespace-nowrap"
                                          >
                                            ✔ Marquer révisé
                                          </button>
                                        </div>
                                      </div>

                                      {/* Barre de priorité */}
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs text-slate-400">Priorité de révision</span>
                                          <span className="text-xs font-bold text-white">{Math.round(course.priority)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all ${
                                              course.priority > 80 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                              course.priority > 50 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                                              'bg-gradient-to-r from-green-500 to-emerald-500'
                                            }`}
                                            style={{ width: `${Math.min(100, course.priority)}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Liens OneDrive */}
                                      {course.oneDriveLinks && course.oneDriveLinks.length > 0 && (
                                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                                          <p className="text-xs text-slate-400 mb-2">🔎 Documents disponibles:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {course.oneDriveLinks.map(link => (
                                              <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1 bg-blue-600/30 border border-blue-500/50 text-blue-300 rounded-lg hover:bg-blue-600/50 transition-all text-xs font-semibold flex items-center gap-1"
                                              >
                                                <File className="w-3 h-3" />
                                                {link.name}
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Temps de travail suggéré */}
                          {eveningSchedule[day] && eveningSchedule[day].length > 0 && (
                            <div className="mt-6 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg">
                              <h4 className="text-sm font-bold text-indigo-300 mb-3">⏱️ Planning de travail du soir:</h4>
                              <div className="space-y-2">
                                {eveningSchedule[day].map((slot, idx) => {
                                  const colors = getEveningSubjectColors(slot.subject);
                                  return (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span className={`px-2 py-1 ${colors.bg} ${colors.text} rounded text-xs font-semibold`}>
                                        {slot.subject}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        ({slot.duration})
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cours urgents à réviser */}
                  {(() => {
                    const upcomingTests = getUpcomingTests(currentWeek);
                    const weekContext = { upcomingTests };
                    const urgentCourses = courses
                      .map(course => ({
                        ...course,
                        ...calculateReviewPriority(course, weekContext)
                      }))
                      .filter(c => c.priority > 80)
                      .sort((a, b) => b.priority - a.priority);

                    if (urgentCourses.length === 0) return null;

                    return (
                      <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/30 rounded-2xl p-6">
                        <h3 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-6 h-6" />
                          ⚠️ Révisions urgentes
                        </h3>
                        <p className="text-red-200 mb-4 text-sm">Ces cours nécessitent une révision immédiate</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {urgentCourses.map(course => (
                            <div key={course.id} className="p-4 bg-slate-900/50 rounded-lg border border-red-500/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-3 py-1 bg-gradient-to-r ${getSubjectColor(course.subject)} rounded-full text-xs font-bold text-white`}>
                                  {course.subject}
                                </span>
                                <span className="text-red-300 font-bold text-sm">{course.reason}</span>
                              </div>
                              <h4 className="font-bold text-white mb-2">{course.chapter}</h4>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">
                                  {course.daysSinceReview} jours depuis dernière révision
                                </span>
                                <button
                                  onClick={() => markAsReviewed(course.id, 15)}
                                  className="px-3 py-1 bg-green-600/30 border border-green-500/50 text-green-300 rounded text-xs hover:bg-green-600/50 transition-all font-semibold"
                                >
                                  ✔ Réviser
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* TAB STATS */}
          {activeTab === 'stats' && (
            <div className="w-full space-y-8">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">📊 Statistiques & Progression</h2>
                <p className="text-indigo-300 text-lg">Vue d'ensemble de votre parcours d'apprentissage</p>
              </div>

              {/* Section Profil Utilisateur */}
              {userProfile && (
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-3xl p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Avatar et nom */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-4xl border-4 border-indigo-400">
                        👤
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {getUserDisplayName(user)}
                        </h3>
                        <p className="text-indigo-300">Étudiant TSI</p>
                      </div>
                    </div>

                    {/* Stats globales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {/* XP */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          <span className="text-3xl font-bold text-yellow-300">
                            {userProfile.total_xp || 0}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">XP Total</p>
                      </div>

                      {/* Streak */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-orange-400" />
                          <span className="text-3xl font-bold text-orange-300">
                            {userProfile.current_streak || 0}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">Jours Streak</p>
                      </div>

                      {/* Révisions */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <BookOpen className="w-5 h-5 text-blue-400" />
                          <span className="text-3xl font-bold text-blue-300">
                            {userProfile.total_reviews || 0}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">Révisions</p>
                      </div>

                      {/* Maîtrise */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-green-400" />
                          <span className="text-3xl font-bold text-green-300">
                            {courses.length > 0 
                              ? Math.round(courses.reduce((sum, c) => sum + c.mastery, 0) / courses.length) 
                              : 0}%
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">Maîtrise Moy.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Badges */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Award className="w-8 h-8 text-yellow-400" />
                    Badges
                  </h3>
                  <span className="px-4 py-2 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                    {unlockedBadges.length}/{badges.length} débloqués
                  </span>
                </div>

                {isLoadingGamification ? (
                  <div className="text-center py-12">
                    <div className="animate-spin mb-4"><Brain className="w-12 h-12 text-purple-400 mx-auto" /></div>
                    <p className="text-slate-400">Chargement des badges...</p>
                  </div>
                ) : badges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Aucun badge disponible pour le moment</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-6">
                    {badges.map(badge => {
                      const userBadge = unlockedBadges.find(ub => ub.badge_id === badge.id);
                      return (
                        <Badge
                          key={badge.id}
                          badge={badge}
                          unlocked={!!userBadge}
                          size="md"
                          unlockedAt={userBadge?.unlocked_at}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section Heatmap d'activité */}
              <ActivityHeatmap dailyStats={dailyStats} />

              {/* Stats détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="w-8 h-8 text-blue-400" />
                    <div className="text-3xl font-bold text-blue-300">{courses.length}</div>
                  </div>
                  <p className="text-blue-200 font-semibold">Chapitres totaux</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-8 h-8 text-green-400" />
                    <div className="text-3xl font-bold text-green-300">
                      {userProfile?.total_reviews || 0}
                    </div>
                  </div>
                  <p className="text-green-200 font-semibold">Révisions effectuées</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <Brain className="w-8 h-8 text-purple-400" />
                    <div className="text-3xl font-bold text-purple-300">
                      {courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.mastery, 0) / courses.length) : 0}%
                    </div>
                  </div>
                  <p className="text-purple-200 font-semibold">Maîtrise moyenne</p>
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

              {/* SRS Statistics Section */}
              <div className="mt-12">
                <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <Brain className="w-8 h-8 text-indigo-400" />
                  Statistiques SRS
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl">🔴</div>
                      <div className="text-3xl font-bold text-red-300">{srs.stats.due}</div>
                    </div>
                    <p className="text-red-200 font-semibold">À réviser</p>
                    <p className="text-red-400/60 text-xs mt-1">Cartes dues aujourd'hui</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl">🟡</div>
                      <div className="text-3xl font-bold text-yellow-300">{srs.stats.learning}</div>
                    </div>
                    <p className="text-yellow-200 font-semibold">En apprentissage</p>
                    <p className="text-yellow-400/60 text-xs mt-1">Intervalle ≤ 21 jours</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl">🟢</div>
                      <div className="text-3xl font-bold text-green-300">{srs.stats.mastered}</div>
                    </div>
                    <p className="text-green-200 font-semibold">Maîtrisées</p>
                    <p className="text-green-400/60 text-xs mt-1">Intervalle &gt; 21 jours</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl">🔵</div>
                      <div className="text-3xl font-bold text-blue-300">{srs.stats.new}</div>
                    </div>
                    <p className="text-blue-200 font-semibold">Nouvelles</p>
                    <p className="text-blue-400/60 text-xs mt-1">Jamais révisées</p>
                  </div>
                </div>

                {/* SRS Progress */}
                <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                  <h4 className="text-xl font-bold text-white mb-4">Progression SRS</h4>
                  <div className="space-y-4">
                    {/* Total cards */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Total des cartes</span>
                        <span className="text-white font-bold">
                          {srs.stats.due + srs.stats.learning + srs.stats.mastered + srs.stats.new}
                        </span>
                      </div>
                    </div>

                    {/* Mastery rate */}
                    {(srs.stats.due + srs.stats.learning + srs.stats.mastered) > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Taux de maîtrise</span>
                          <span className="text-white font-bold">
                            {Math.round((srs.stats.mastered / (srs.stats.due + srs.stats.learning + srs.stats.mastered)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-600 to-emerald-500 h-full transition-all duration-500"
                            style={{ 
                              width: `${Math.round((srs.stats.mastered / (srs.stats.due + srs.stats.learning + srs.stats.mastered)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Progress breakdown */}
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Répartition</p>
                      <div className="flex gap-2 h-6 rounded-full overflow-hidden">
                        {srs.stats.due > 0 && (
                          <div 
                            className="bg-red-500 flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              width: `${(srs.stats.due / (srs.stats.due + srs.stats.learning + srs.stats.mastered + srs.stats.new)) * 100}%` 
                            }}
                            title={`${srs.stats.due} à réviser`}
                          >
                            {srs.stats.due > 5 && srs.stats.due}
                          </div>
                        )}
                        {srs.stats.learning > 0 && (
                          <div 
                            className="bg-yellow-500 flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              width: `${(srs.stats.learning / (srs.stats.due + srs.stats.learning + srs.stats.mastered + srs.stats.new)) * 100}%` 
                            }}
                            title={`${srs.stats.learning} en apprentissage`}
                          >
                            {srs.stats.learning > 5 && srs.stats.learning}
                          </div>
                        )}
                        {srs.stats.mastered > 0 && (
                          <div 
                            className="bg-green-500 flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              width: `${(srs.stats.mastered / (srs.stats.due + srs.stats.learning + srs.stats.mastered + srs.stats.new)) * 100}%` 
                            }}
                            title={`${srs.stats.mastered} maîtrisées`}
                          >
                            {srs.stats.mastered > 5 && srs.stats.mastered}
                          </div>
                        )}
                        {srs.stats.new > 0 && (
                          <div 
                            className="bg-blue-500 flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              width: `${(srs.stats.new / (srs.stats.due + srs.stats.learning + srs.stats.mastered + srs.stats.new)) * 100}%` 
                            }}
                            title={`${srs.stats.new} nouvelles`}
                          >
                            {srs.stats.new > 5 && srs.stats.new}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB QUIZ */}
          {activeTab === 'quiz' && (
            <div className="w-full">
              {quizView === 'home' && (
                <>
                  <div className="mb-12 text-center">
                    <h2 className="text-5xl font-bold text-white mb-3">📝 Mode Quiz</h2>
                    <p className="text-indigo-300 text-lg">Testez vos connaissances</p>
                  </div>

                  {/* Boutons actions principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
                    <button
                      onClick={() => setQuizView('setup')}
                      className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-left hover:shadow-2xl hover:shadow-indigo-500/50 transition-all hover:scale-[1.02] border border-indigo-500/20"
                    >
                      <div className="text-5xl mb-4">🚀</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Nouveau Quiz</h3>
                      <p className="text-indigo-200">Configuration complète et personnalisée</p>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          setQuizError(null);
                          await quiz.createQuiz({
                            title: 'Quiz Rapide',
                            mode: 'training',
                            courseIds: courses.map(c => c.id),
                            questionCount: 10,
                            timeLimitMinutes: null
                          });
                          quiz.startQuiz();
                          setQuizView('session');
                        } catch (error) {
                          console.error('Error starting quick quiz:', error);
                          setQuizError(error.message || 'Erreur lors du démarrage du quiz. Assurez-vous d\'avoir des flashcards.');
                        }
                      }}
                      className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-left hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-[1.02] border border-purple-500/20"
                    >
                      <div className="text-5xl mb-4">⚡</div>
                      <h3 className="text-2xl font-bold text-white mb-2">Quiz Rapide</h3>
                      <p className="text-purple-200">10 questions, toutes matières</p>
                    </button>
                  </div>

                  {/* Error display */}
                  {quizError && (
                    <div className="max-w-4xl mx-auto mb-8">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <p className="text-red-400 font-semibold">Erreur</p>
                          <p className="text-red-300 text-sm mt-1">{quizError}</p>
                        </div>
                        <button
                          onClick={() => setQuizError(null)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Historique des quiz */}
                  <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8">
                      <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                        📊 Historique des Quiz
                      </h3>

                      {quiz.isLoading ? (
                        <div className="text-center py-12 text-slate-400">
                          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                          Chargement...
                        </div>
                      ) : quiz.quizHistory.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <div className="text-6xl mb-4">📝</div>
                          <p className="text-xl">Aucun quiz complété pour le moment</p>
                          <p className="text-sm mt-2">Lancez votre premier quiz pour commencer !</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {quiz.quizHistory.map(q => {
                            const scoreColor = q.score >= 90 ? 'text-green-400' : q.score >= 70 ? 'text-blue-400' : q.score >= 50 ? 'text-yellow-400' : 'text-red-400';
                            const modeEmoji = q.mode === 'training' ? '🎯' : q.mode === 'exam' ? '📝' : '🎓';
                            const timeAgo = (() => {
                              const date = new Date(q.completed_at);
                              const now = new Date();
                              const diffMs = now - date;
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffDays = Math.floor(diffHours / 24);
                              
                              if (diffDays > 0) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                              if (diffHours > 0) return `il y a ${diffHours}h`;
                              return 'À l\'instant';
                            })();

                            return (
                              <div
                                key={q.id}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all"
                              >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className="text-4xl">{modeEmoji}</div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-bold text-lg mb-1">{q.title}</h4>
                                      <p className="text-slate-400 text-sm">
                                        {q.total_questions} questions • {Math.floor(q.time_spent_seconds / 60)}:{(q.time_spent_seconds % 60).toString().padStart(2, '0')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <div className={`text-3xl font-bold ${scoreColor}`}>{q.score}%</div>
                                      <div className="text-xs text-slate-400">{timeAgo}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistiques globales */}
                  {quiz.quizHistory.length > 0 && (
                    <div className="max-w-6xl mx-auto mt-8">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8">
                        <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                          📈 Statistiques Quiz
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                            <div className="text-3xl font-bold text-indigo-400">{quiz.getQuizStats().totalCompleted}</div>
                            <div className="text-slate-400 text-sm mt-2">Quiz complétés</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                            <div className="text-3xl font-bold text-purple-400">{quiz.getQuizStats().averageScore}%</div>
                            <div className="text-slate-400 text-sm mt-2">Score moyen</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                            <div className="text-3xl font-bold text-green-400">{quiz.getQuizStats().bestScore}%</div>
                            <div className="text-slate-400 text-sm mt-2">Meilleur score</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-center">
                            <div className="text-3xl font-bold text-blue-400">
                              {Math.floor(quiz.getQuizStats().totalTimeSpent / 60)}h
                            </div>
                            <div className="text-slate-400 text-sm mt-2">Temps total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {quizView === 'setup' && (
                <>
                  {quizError && (
                    <div className="max-w-3xl mx-auto mb-6">
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <p className="text-red-400 font-semibold">Erreur</p>
                          <p className="text-red-300 text-sm mt-1">{quizError}</p>
                        </div>
                        <button
                          onClick={() => setQuizError(null)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <QuizSetup
                    courses={courses}
                    onStartQuiz={async (options) => {
                      try {
                        setQuizError(null);
                        await quiz.createQuiz(options);
                        quiz.startQuiz();
                        setQuizView('session');
                      } catch (error) {
                        console.error('Error creating quiz:', error);
                        setQuizError(error.message || 'Erreur lors de la création du quiz');
                      }
                    }}
                  />
                </>
              )}

              {quizView === 'session' && quiz.currentQuiz && (
                <QuizSession
                  quiz={quiz.currentQuiz}
                  questions={quiz.questions}
                  currentIndex={quiz.currentIndex}
                  answers={quiz.answers}
                  timeRemaining={quiz.timeRemaining}
                  onSubmitAnswer={quiz.submitAnswer}
                  onNextQuestion={quiz.nextQuestion}
                  onFinish={async () => {
                    try {
                      await quiz.finishQuiz();
                      
                      // Ajouter XP pour le quiz
                      const correctCount = quiz.answers.filter(a => a.is_correct).length;
                      const totalQuestions = quiz.questions.length;
                      const score = Math.round((correctCount / totalQuestions) * 100);
                      
                      let xpEarned = correctCount * 5; // 5 XP par bonne réponse
                      if (score > 80) {
                        xpEarned += 50; // Bonus pour score > 80%
                      }
                      
                      await addXP(xpEarned);
                      
                      setQuizView('results');
                    } catch (error) {
                      console.error('Error finishing quiz:', error);
                    }
                  }}
                />
              )}

              {quizView === 'results' && quiz.currentQuiz && (
                <QuizResults
                  quiz={quiz.currentQuiz}
                  answers={quiz.answers}
                  questions={quiz.questions}
                  onRetry={() => {
                    quiz.resetQuiz();
                    setQuizView('setup');
                  }}
                  onClose={() => {
                    quiz.resetQuiz();
                    quiz.loadQuizHistory();
                    setQuizView('home');
                  }}
                />
              )}
            </div>
          )}

          {/* TAB GROUPS */}
          {activeTab === 'groups' && (
            <div className="w-full">
              <div className="mb-12 text-center">
                <h2 className="text-5xl font-bold text-white mb-3">👥 Groupes d'Étude</h2>
                <p className="text-indigo-300 text-lg">Collaborez et progressez ensemble</p>
              </div>

              {/* Boutons d'action principaux */}
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-semibold shadow-lg shadow-indigo-500/25"
                >
                  <Plus className="w-5 h-5" />
                  Créer un groupe
                </button>
                <button
                  onClick={() => setShowJoinByCode(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all font-semibold shadow-lg shadow-purple-500/25"
                >
                  🔗 Rejoindre par code
                </button>
              </div>

              {/* Mes Groupes */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  📌 Mes Groupes
                  {studyGroups.myGroups.length > 0 && (
                    <span className="text-lg text-indigo-400">({studyGroups.myGroups.length})</span>
                  )}
                </h3>
                
                {studyGroups.isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Chargement...</p>
                  </div>
                ) : studyGroups.myGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyGroups.myGroups.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onAction={async () => {
                          const details = await studyGroups.loadGroupDetails(group.id);
                          const leaderboard = await studyGroups.loadGroupLeaderboard(group.id);
                          setSelectedGroup(details);
                          setGroupLeaderboard(leaderboard);
                          setShowGroupDetail(true);
                        }}
                        actionLabel="Voir"
                        isDark={isDark}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">Vous n'êtes membre d'aucun groupe</p>
                    <p className="text-slate-500 text-sm">Créez votre premier groupe ou rejoignez-en un !</p>
                  </div>
                )}
              </div>

              {/* Groupes Publics */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  🌐 Groupes Publics
                  {studyGroups.availableGroups.length > 0 && (
                    <span className="text-lg text-indigo-400">({studyGroups.availableGroups.length})</span>
                  )}
                </h3>
                
                {studyGroups.isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Chargement...</p>
                  </div>
                ) : studyGroups.availableGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyGroups.availableGroups.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onAction={async () => {
                          try {
                            await studyGroups.joinGroup(group.id);
                            showSuccess('Groupe rejoint avec succès !');
                          } catch (error) {
                            showWarning(error.message || 'Erreur lors de la tentative de rejoindre le groupe');
                          }
                        }}
                        actionLabel="Rejoindre"
                        isDark={isDark}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg mb-2">Aucun groupe public disponible</p>
                    <p className="text-slate-500 text-sm">Soyez le premier à créer un groupe public !</p>
                  </div>
                )}
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

              <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                <p className="text-xs text-indigo-300 mb-3">Choisir une méthode :</p>
                
                {/* Option 1 : Par date */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-indigo-300 mb-2">📅 Date exacte (recommandé)</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value, week: '', day: ''})}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  />
                  {newEvent.date && (
                    <p className="text-xs text-green-300 mt-1">
                      ✔ {new Date(newEvent.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="text-center text-slate-500 text-xs mb-4">- OU -</div>

                {/* Option 2 : Par semaine/jour */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-indigo-300 mb-2">📊 Semaine</label>
                    <select
                      value={newEvent.week}
                      onChange={(e) => setNewEvent({...newEvent, week: parseInt(e.target.value), date: ''})}
                      disabled={newEvent.date !== ''}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                    >
                      {Object.keys(weekCalendar).map(week => (
                        <option key={week} value={week}>
                          {weekCalendar[week].label} ({weekCalendar[week].dates})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-indigo-300 mb-2">📆 Jour</label>
                    <select
                      value={newEvent.day}
                      onChange={(e) => setNewEvent({...newEvent, day: e.target.value, date: ''})}
                      disabled={newEvent.date !== ''}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Horaire</label>
                <input
                  type="text"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="14h-16h ou 14h00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Durée (optionnel)</label>
                <input
                  type="text"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="2h ou 120min"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddEvent(false);
                  setNewEvent({
                    week: currentWeek,
                    day: 'Lundi',
                    type: 'DS',
                    subject: '',
                    time: '',
                    duration: '',
                    date: ''
                  });
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={addCustomEvent}
                disabled={!newEvent.subject || !newEvent.time || (!newEvent.week && !newEvent.date)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h3 className="text-2xl font-bold text-white mb-6">Ajouter un cours</h3>
            
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

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Liens OneDrive</label>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="Nom du document (optionnel)"
                  />
                  
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newOneDriveLink}
                      onChange={(e) => setNewOneDriveLink(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="https://onedrive.live.com/..."
                    />
                    <button
                      onClick={() => addOneDriveLink(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {newCourse.oneDriveLinks && newCourse.oneDriveLinks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {newCourse.oneDriveLinks.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <File className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-white truncate">{link.name}</span>
                        </div>
                        <button
                          onClick={() => deleteOneDriveLinkFromNewCourse(link.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  setNewOneDriveLink('');
                  setNewLinkName('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={addCourse}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Flashcard */}
      {showAddFlashcard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Créer une flashcard</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Cours</label>
                <select
                  value={newFlashcard.courseId}
                  onChange={(e) => setNewFlashcard({...newFlashcard, courseId: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Sélectionner un cours...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.subject} - {course.chapter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Question</label>
                <textarea
                  value={newFlashcard.question}
                  onChange={(e) => setNewFlashcard({...newFlashcard, question: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  rows="3"
                  placeholder="Entrez la question..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Réponse</label>
                <textarea
                  value={newFlashcard.answer}
                  onChange={(e) => setNewFlashcard({...newFlashcard, answer: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  rows="4"
                  placeholder="Entrez la réponse..."
                />
              </div>

              {/* Preview */}
              {(newFlashcard.question || newFlashcard.answer) && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowFlashcardPreview(!showFlashcardPreview)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 mb-2"
                  >
                    {showFlashcardPreview ? '👁️ Masquer' : '👁️ Prévisualiser'} la carte
                  </button>
                  
                  {showFlashcardPreview && (
                    <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg">
                      <div className="mb-3">
                        <div className="text-xs text-indigo-300 mb-1">Question:</div>
                        <MathText className="text-white">{newFlashcard.question || '(vide)'}</MathText>
                      </div>
                      <div>
                        <div className="text-xs text-purple-300 mb-1">Réponse:</div>
                        <MathText className="text-white whitespace-pre-wrap">{newFlashcard.answer || '(vide)'}</MathText>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddFlashcard(false);
                  setNewFlashcard({ courseId: '', question: '', answer: '' });
                  setShowFlashcardPreview(false);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFlashcard}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier Flashcard */}
      {showEditFlashcard && editingFlashcard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Modifier la flashcard</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Cours</label>
                {(() => {
                  const course = courses.find(c => c.id === newFlashcard.courseId);
                  return (
                    <div className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400">
                      {course?.subject} - {course?.chapter}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Question</label>
                <textarea
                  value={newFlashcard.question}
                  onChange={(e) => setNewFlashcard({...newFlashcard, question: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  rows="3"
                  placeholder="Entrez la question..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Réponse</label>
                <textarea
                  value={newFlashcard.answer}
                  onChange={(e) => setNewFlashcard({...newFlashcard, answer: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  rows="4"
                  placeholder="Entrez la réponse..."
                />
              </div>

              {/* Preview */}
              {(newFlashcard.question || newFlashcard.answer) && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowFlashcardPreview(!showFlashcardPreview)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 mb-2"
                  >
                    {showFlashcardPreview ? '👁️ Masquer' : '👁️ Prévisualiser'} la carte
                  </button>
                  
                  {showFlashcardPreview && (
                    <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg">
                      <div className="mb-3">
                        <div className="text-xs text-indigo-300 mb-1">Question:</div>
                        <MathText className="text-white">{newFlashcard.question}</MathText>
                      </div>
                      <div>
                        <div className="text-xs text-purple-300 mb-1">Réponse:</div>
                        <MathText className="text-white whitespace-pre-wrap">{newFlashcard.answer}</MathText>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditFlashcard(false);
                  setEditingFlashcard(null);
                  setNewFlashcard({ courseId: '', question: '', answer: '' });
                  setShowFlashcardPreview(false);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateFlashcard}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Anki */}
      {showAnkiImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              📥 Importer depuis Anki
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300 mb-2">📋 Format attendu :</p>
                <code className="text-xs text-slate-300 block bg-slate-900/50 p-2 rounded">
                  Question[TAB]Réponse[TAB]Tags (optionnel)
                </code>
                <p className="text-xs text-slate-400 mt-2">
                  Les fichiers Anki exportés en format texte utilisent des tabulations (TAB) pour séparer les colonnes
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Associer au cours</label>
                <select
                  value={importCourseId}
                  onChange={(e) => setImportCourseId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Sélectionner un cours...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.subject} - {course.chapter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Fichier</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleAnkiImport}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-white hover:border-indigo-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Glissez-déposer un fichier .txt ou .csv, ou cliquez pour sélectionner
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAnkiImport(false);
                  setImportCourseId('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Notion */}
      {showNotionImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Copy className="w-6 h-6" />
              📥 Importer depuis Notion
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-300 mb-2">📋 Instructions :</p>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                  <li>Dans Notion, créez un tableau avec les colonnes "Question" et "Réponse"</li>
                  <li>Sélectionnez le tableau et copiez-le (Ctrl+C / Cmd+C)</li>
                  <li>Collez le contenu dans la zone ci-dessous</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Associer au cours</label>
                <select
                  value={importCourseId}
                  onChange={(e) => setImportCourseId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Sélectionner un cours...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.subject} - {course.chapter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Contenu du tableau Notion</label>
                <textarea
                  value={notionImportText}
                  onChange={(e) => setNotionImportText(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none font-mono text-sm"
                  rows="10"
                  placeholder="Collez votre tableau Notion ici...&#10;Format attendu :&#10;| Question | Réponse |&#10;|----------|---------|&#10;| Q1 | R1 |&#10;| Q2 | R2 |"
                />
              </div>

              {notionImportText && (
                <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">
                    ✓ Prévisualisation : {notionImportText.split('\n').filter(line => line.trim() && !line.includes('---')).slice(1).length} flashcards détectées
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNotionImport(false);
                  setNotionImportText('');
                  setImportCourseId('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleNotionImport}
                disabled={!notionImportText.trim() || !importCourseId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showCsvImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <File className="w-6 h-6" />
              📥 Importer depuis CSV
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300 mb-2">📋 Formats acceptés :</p>
                <code className="text-xs text-slate-300 block bg-slate-900/50 p-2 rounded mb-2">
                  question,answer,subject,chapter
                </code>
                <p className="text-xs text-slate-400 mt-2">
                  Séparateurs supportés : virgule (,), point-virgule (;), ou tabulation
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Le fichier peut avoir ou non une ligne d'en-tête
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Associer au cours</label>
                <select
                  value={importCourseId}
                  onChange={(e) => setImportCourseId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Sélectionner un cours...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.subject} - {course.chapter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Fichier CSV</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVImport}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-white hover:border-green-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Glissez-déposer un fichier .csv, ou cliquez pour sélectionner
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCsvImport(false);
                  setImportCourseId('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Noji IA */}
      {showNojiImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              📥 Importer depuis Noji IA
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300 mb-2">📋 Format attendu (JSON) :</p>
                <code className="text-xs text-slate-300 block bg-slate-900/50 p-2 rounded whitespace-pre">
{`{
  "cards": [
    {
      "front": "Question",
      "back": "Réponse",
      "tags": ["tag1", "tag2"]
    }
  ]
}`}
                </code>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Associer au cours</label>
                <select
                  value={importCourseId}
                  onChange={(e) => setImportCourseId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Sélectionner un cours...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.subject} - {course.chapter}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">Fichier JSON</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleNojiImport}
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-white hover:border-blue-500 transition-all cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Glissez-déposer un fichier .json exporté depuis Noji IA
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNojiImport(false);
                  setImportCourseId('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Paramètres de Révision */}
      {showRevisionSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">⚙️ Paramètres de révision</h3>
            
            <div className="space-y-6">
              {/* Heure de début */}
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">
                  🕐 Heure de début des révisions
                </label>
                <input
                  type="time"
                  value={revisionSettings.startTime}
                  onChange={(e) => setRevisionSettings({...revisionSettings, startTime: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Durée totale */}
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">
                  ⏱️ Durée totale de révision (minutes)
                </label>
                <select
                  value={revisionSettings.totalDuration}
                  onChange={(e) => setRevisionSettings({...revisionSettings, totalDuration: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="60">1h00</option>
                  <option value="90">1h30</option>
                  <option value="120">2h00</option>
                  <option value="150">2h30</option>
                  <option value="180">3h00</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Temps total disponible pour les révisions chaque soir
                </p>
              </div>

              {/* Durée par session */}
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">
                  📚 Durée par session/matière (minutes)
                </label>
                <select
                  value={revisionSettings.sessionDuration}
                  onChange={(e) => setRevisionSettings({...revisionSettings, sessionDuration: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1h00</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Temps consacré à chaque matière suggérée
                </p>
              </div>

              {/* Matières prioritaires */}
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">
                  ⭐ Matières prioritaires
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map(subject => (
                    <label key={subject} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 transition-all">
                      <input
                        type="checkbox"
                        checked={revisionSettings.prioritySubjects.includes(subject)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRevisionSettings({
                              ...revisionSettings,
                              prioritySubjects: [...revisionSettings.prioritySubjects, subject]
                            });
                          } else {
                            setRevisionSettings({
                              ...revisionSettings,
                              prioritySubjects: revisionSettings.prioritySubjects.filter(s => s !== subject)
                            });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                      />
                      <span className="text-white text-sm">{subject}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ces matières seront favorisées dans les suggestions
                </p>
              </div>

              {/* Jours de repos */}
              <div>
                <label className="block text-sm font-semibold text-indigo-300 mb-2">
                  🛌 Jours de repos (sans révision)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {days.map(day => (
                    <label key={day} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 transition-all">
                      <input
                        type="checkbox"
                        checked={revisionSettings.restDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRevisionSettings({
                              ...revisionSettings,
                              restDays: [...revisionSettings.restDays, day]
                            });
                          } else {
                            setRevisionSettings({
                              ...revisionSettings,
                              restDays: revisionSettings.restDays.filter(d => d !== day)
                            });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
                      />
                      <span className="text-white text-sm">{day}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Aucune suggestion de révision pour ces jours
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowRevisionSettings(false)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <Onboarding onClose={() => setShowOnboarding(false)} />
      )}

      {/* Badge Unlock Modal */}
      {newBadge && (
        <BadgeUnlockModal
          badge={newBadge}
          xpEarned={newBadge.xp_reward}
          onClose={() => setNewBadge(null)}
        />
      )}

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <NotificationSettings
          settings={notificationSettings}
          onUpdate={updateNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
          onRequestPermission={requestNotificationPermission}
          permission={notificationPermission}
        />
      )}

      {/* Study Groups Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={async (data) => {
            try {
              const newGroup = await studyGroups.createGroup(data);
              showSuccess(`Groupe "${newGroup.name}" créé avec succès !`);
              setShowCreateGroup(false);
            } catch (error) {
              showWarning(error.message || 'Erreur lors de la création du groupe');
              throw error;
            }
          }}
          isDark={isDark}
        />
      )}

      {showJoinByCode && (
        <JoinGroupModal
          onClose={() => setShowJoinByCode(false)}
          onJoin={async (code) => {
            try {
              const group = await studyGroups.joinByCode(code);
              showSuccess(`Vous avez rejoint le groupe "${group.name}" !`);
            } catch (error) {
              throw error;
            }
          }}
          isDark={isDark}
        />
      )}

      {showGroupDetail && selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          onClose={() => {
            setShowGroupDetail(false);
            setSelectedGroup(null);
            setGroupLeaderboard([]);
          }}
          onLeave={async (groupId) => {
            try {
              await studyGroups.leaveGroup(groupId);
              showSuccess('Vous avez quitté le groupe');
              setShowGroupDetail(false);
              setSelectedGroup(null);
            } catch (error) {
              showWarning(error.message || 'Erreur lors de la sortie du groupe');
            }
          }}
          onDelete={async (groupId) => {
            try {
              await studyGroups.deleteGroup(groupId);
              showSuccess('Groupe supprimé avec succès');
            } catch (error) {
              showWarning(error.message || 'Erreur lors de la suppression du groupe');
            }
          }}
          onGenerateCode={async (groupId) => {
            try {
              const newCode = await studyGroups.generateInviteCode(groupId);
              showSuccess(`Nouveau code généré : ${newCode}`);
              // Recharger les détails du groupe
              const details = await studyGroups.loadGroupDetails(groupId);
              setSelectedGroup(details);
            } catch (error) {
              showWarning(error.message || 'Erreur lors de la génération du code');
            }
          }}
          onShareDecks={async (groupId, deckIds) => {
            try {
              await studyGroups.shareDecksToGroup(groupId, deckIds);
              showSuccess(`${deckIds.length} deck(s) partagé(s) avec le groupe`);
              // Recharger les détails du groupe
              const details = await studyGroups.loadGroupDetails(groupId);
              setSelectedGroup(details);
            } catch (error) {
              showWarning(error.message || 'Erreur lors du partage des decks');
            }
          }}
          leaderboard={groupLeaderboard}
          availableDecks={courses}
          isDark={isDark}
          currentUserId={user?.id}
          isAdmin={selectedGroup?.members?.find(m => m.user_id === user?.id)?.role === 'admin'}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
