import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, BookOpen, AlertCircle, Plus, X, Brain, Zap, Sparkles, Trash2, Upload, File, ChevronDown, ChevronLeft, ChevronRight, Folder, FolderOpen, LogOut, Send, MessageCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import Login from './Login';
import { supabase } from './supabaseClient';
// ==================== MAIN APP ====================
function App() {
  const { user, loading, signOut } = useAuth();
  
  // États pour Planning
  const [currentWeek, setCurrentWeek] = useState(10);
  const [selectedDay, setSelectedDay] = useState(null);
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
    date: '' // Nouvelle propriété pour stocker la date exacte
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
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  
  // États pour Chat/Discussions
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  
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

  // États pour gérer l'ajout de liens OneDrive
  const [newOneDriveLink, setNewOneDriveLink] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  
  // URL du backend - MODIFIEZ ICI selon votre configuration
  const BACKEND_URL = 'https://tsi-manager-backend.onrender.com'; // Port 5001

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

  // Fonctions
  const getUpcomingTests = (currentWeek, daysAhead = 14) => {
    const tests = [];
    const today = new Date();
    
    customEvents.forEach(event => {
      if (event.type === 'DS' || event.type === 'DM' || event.type === 'Colle' || event.type === 'Examen' || event.type === 'TP Noté') {
        let daysUntil = 0;
        
        // Si l'événement a une date exacte
        if (event.date) {
          const eventDate = new Date(event.date);
          daysUntil = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
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

  const markAsReviewed = (courseId, masteryIncrease = 10) => {
    setCourses(courses.map(c => {
      if (c.id === courseId) {
        const newMastery = Math.min(100, c.mastery + masteryIncrease);
        return {
          ...c,
          lastReviewed: new Date().toISOString().split('T')[0],
          reviewCount: c.reviewCount + 1,
          mastery: newMastery,
          reviewHistory: [...(c.reviewHistory || []), {
            date: new Date().toISOString().split('T')[0],
            masteryBefore: c.mastery,
            masteryAfter: newMastery
          }]
        };
      }
      return c;
    }));
  };

  const getSuggestedReviews = (day, weekNum = currentWeek) => {
    const availableSlots = eveningSchedule[day]?.filter(slot => slot.duration > 0) || [];
    let availableTime = availableSlots.reduce((sum, slot) => sum + slot.duration, 0);
    
    const upcomingTests = getUpcomingTests(weekNum);
    const weekContext = { upcomingTests };
    
    const urgentTests = upcomingTests.filter(t => t.daysUntil <= 3);
    if (urgentTests.length > 0) {
      availableTime += 30;
    }
    
    const coursesWithPriority = courses.map(course => ({
      ...course,
      ...calculateReviewPriority(course, weekContext)
    })).sort((a, b) => b.priority - a.priority);

    const suggestions = [];
    let timeUsed = 0;

    for (const course of coursesWithPriority) {
      if (timeUsed >= availableTime) break;
      if (course.priority > 30) {
        suggestions.push(course);
        timeUsed += 45;
      }
    }

    return suggestions;
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const coursesData = JSON.parse(localStorage.getItem('tsi-courses')) || [];
        const eventsData = JSON.parse(localStorage.getItem('tsi-custom-events')) || [];
        const flashcardsData = JSON.parse(localStorage.getItem('tsi-flashcards')) || [];
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setCustomEvents(Array.isArray(eventsData) ? eventsData : []);
        setFlashcards(Array.isArray(flashcardsData) ? flashcardsData : []);
      } catch (e) {
        console.log('Première utilisation');
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tsi-courses', JSON.stringify(courses));
    }
  }, [courses, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tsi-custom-events', JSON.stringify(customEvents));
    }
  }, [customEvents, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('tsi-flashcards', JSON.stringify(flashcards));
    }
  }, [flashcards, isLoading]);

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
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === payload.new.id);
          if (exists) return prev;
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
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel, user]);

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

  const addCourse = () => {
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
      setCourses([...courses, course]);
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

  const addOneDriveLink = (isNewCourse = false, courseId = null) => {
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
    } else if (courseId) {
      setCourses(courses.map(c =>
        c.id === courseId
          ? { ...c, oneDriveLinks: [...(c.oneDriveLinks || []), linkData] }
          : c
      ));
    }

    setNewOneDriveLink('');
    setNewLinkName('');
  };

  const deleteOneDriveLink = (courseId, linkId) => {
    setCourses(courses.map(c =>
      c.id === courseId
        ? { ...c, oneDriveLinks: c.oneDriveLinks.filter(link => link.id !== linkId) }
        : c
    ));
  };

  const deleteOneDriveLinkFromNewCourse = (linkId) => {
    setNewCourse(prev => ({
      ...prev,
      oneDriveLinks: prev.oneDriveLinks.filter(link => link.id !== linkId)
    }));
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
    // Supprimer aussi les flashcards associées
    setFlashcards(flashcards.filter(f => f.courseId !== id));
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

  const addFlashcard = (courseId, question, answer) => {
    const newFlashcard = {
      id: Date.now(),
      courseId,
      question,
      answer,
      createdAt: new Date().toISOString(),
      lastReviewed: null,
      correctCount: 0,
      incorrectCount: 0
    };
    setFlashcards([...flashcards, newFlashcard]);
  };

  const deleteFlashcard = (flashcardId) => {
    setFlashcards(flashcards.filter(f => f.id !== flashcardId));
  };

  const handleFlashcardAnswer = (isCorrect) => {
    const courseFlashcards = flashcards.filter(f => f.courseId === selectedCourseForFlashcards.id);
    const currentFlashcard = courseFlashcards[currentFlashcardIndex];
    
    // Mettre à jour les stats de la flashcard
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
      alert(`Session terminée !\n✅ Correct: ${flashcardStats.correct + (isCorrect ? 1 : 0)}\nâŒ Incorrect: ${flashcardStats.incorrect + (!isCorrect ? 1 : 0)}`);
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

  // Générer des flashcards avec l'IA
  const generateFlashcardsWithAI = async (course) => {
    setIsGeneratingFlashcards(true);
    
    try {
      const prompt = `Tu es un professeur expert en ${course.subject} niveau prépa TSI.
      
Génère exactement 5 flashcards de révision pour le chapitre : "${course.chapter}"
${course.content ? `\nContenu du cours : ${course.content}` : ''}

Format de réponse STRICT (JSON uniquement, sans markdown ni texte additionnel) :
[
  {
    "question": "Question claire et précise",
    "answer": "Réponse détaillée mais concise"
  }
]

Règles importantes :
- Questions progressives du plus simple au plus complexe
- Réponses complètes mais synthétiques
- Adapté au niveau prépa TSI
- Couvre les notions essentielles du chapitre`;

      // Appel au backend local
      const response = await fetch(`${BACKEND_URL}/api/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: course.subject,
          chapter: course.chapter,
          content: course.content,
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      let generatedCards = [];

      // Si votre backend retourne directement le tableau de cartes
      if (Array.isArray(data)) {
        generatedCards = data;
      } 
      // Si votre backend retourne la réponse Claude
      else if (data.content) {
        const responseText = data.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');

        const cleanedText = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        generatedCards = JSON.parse(cleanedText);
      }
      // Si votre backend retourne un objet avec les cartes
      else if (data.flashcards) {
        generatedCards = data.flashcards;
      }

      // Ajouter les flashcards générées
      if (Array.isArray(generatedCards) && generatedCards.length > 0) {
        const newFlashcards = generatedCards.map((card, index) => ({
          id: Date.now() + index,
          courseId: course.id,
          question: card.question,
          answer: card.answer,
          createdAt: new Date().toISOString(),
          lastReviewed: null,
          correctCount: 0,
          incorrectCount: 0,
          generatedByAI: true
        }));

        setFlashcards([...flashcards, ...newFlashcards]);
        alert(`✅ ${newFlashcards.length} flashcards générées avec succès !`);
      } else {
        throw new Error('Aucune flashcard générée');
      }

    } catch (error) {
      console.error('Erreur génération IA:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const userChoice = window.confirm(
          `âŒ Impossible de se connecter au backend (${BACKEND_URL})

Options :
- Cliquez "OK" pour créer des flashcards templates
- Cliquez "Annuler" pour réessayer plus tard

Vérifiez que :
1. Votre serveur backend est démarré
2. L'URL du backend est correcte
3. Le CORS est configuré

Voulez-vous créer des templates ?`
        );

        if (userChoice) {
          // Créer des flashcards template
          const templateCards = [
            {
              question: `Définition : Qu'est-ce que ${course.chapter} ?`,
              answer: `[À compléter] Définition du concept de ${course.chapter} en ${course.subject}`
            },
            {
              question: `Formule principale de ${course.chapter}`,
              answer: `[À compléter] Écrire la ou les formules clés avec leurs unités`
            },
            {
              question: `Application pratique : Donner un exemple d'utilisation de ${course.chapter}`,
              answer: `[À compléter] Décrire un cas concret d'application`
            },
            {
              question: `Pièges courants : Quelles erreurs éviter avec ${course.chapter} ?`,
              answer: `[À compléter] Lister les erreurs fréquentes et comment les éviter`
            },
            {
              question: `Lien avec le programme : Comment ${course.chapter} se relie-t-il aux autres chapitres ?`,
              answer: `[À compléter] Expliquer les liens avec les chapitres précédents et suivants`
            }
          ];

          const newFlashcards = templateCards.map((card, index) => ({
            id: Date.now() + index,
            courseId: course.id,
            question: card.question,
            answer: card.answer,
            createdAt: new Date().toISOString(),
            lastReviewed: null,
            correctCount: 0,
            incorrectCount: 0,
            generatedByAI: false
          }));

          setFlashcards([...flashcards, ...newFlashcards]);
          alert(`📝 5 flashcards templates créées !\n\nVous pouvez les modifier en les supprimant et recréant avec vos propres réponses.`);
        }
      } else {
        alert(`âŒ Erreur lors de la génération.\n${error.message}`);
      }
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // ==================== FONCTIONS CHAT ====================
  
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
        .limit(100);
      
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
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          channel_id: selectedChannel.id,
          user_id: user.id,
          user_name: user.user_metadata?.name || user.email?.split('@')[0] || DEFAULT_USERNAME,
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
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Retirer le message du state directement
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Erreur suppression message:', error);
      alert('Erreur lors de la suppression du message');
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

  const addCustomEvent = () => {
    if (newEvent.subject && newEvent.time && (newEvent.week || newEvent.date)) {
      const eventToAdd = { ...newEvent, id: Date.now() };
      
      // Si une date est fournie, calculer automatiquement la semaine et le jour
      if (newEvent.date) {
        const selectedDate = new Date(newEvent.date);
        const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][selectedDate.getDay()];
        eventToAdd.day = dayName;
        
        // Trouver la semaine TSI correspondante
        const startOfSchoolYear = new Date('2024-09-01');
        const diffTime = selectedDate - startOfSchoolYear;
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        
        // Ajuster pour correspondre aux semaines TSI (S1 = semaine du 1er septembre)
        let calculatedWeek = diffWeeks + 1;
        
        // Gérer les vacances (approximativement)
        if (selectedDate >= new Date('2024-10-19') && selectedDate <= new Date('2024-11-03')) {
          calculatedWeek -= 2; // Vacances Toussaint
        } else if (selectedDate >= new Date('2024-12-21') && selectedDate <= new Date('2025-01-05')) {
          calculatedWeek -= 2; // Vacances Noël
        } else if (selectedDate >= new Date('2025-02-08') && selectedDate <= new Date('2025-02-23')) {
          calculatedWeek -= 2; // Vacances Hiver
        } else if (selectedDate >= new Date('2025-04-05') && selectedDate <= new Date('2025-04-21')) {
          calculatedWeek -= 2; // Vacances Printemps
        }
        
        eventToAdd.week = Math.max(1, Math.min(33, calculatedWeek));
      }
      
      setCustomEvents([...customEvents, eventToAdd]);
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
    setCustomEvents(customEvents.filter(e => e.id !== id));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-b border-indigo-500/20 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TSI1 Manager</h1>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-900/50 border border-indigo-500/20 rounded-full p-1">
              {[
                { id: 'planning', label: '📅 Planning' },
                { id: 'chat', label: '💬 Discussions' },
                { id: 'flashcards', label: '🎴 Révision' },
                { id: 'courses', label: '📚 Cours' },
                { id: 'suggestions', label: '🎯 Suggestions' },
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

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text">{daysUntil}</div>
                <div className="text-xs text-indigo-300">jours avant concours</div>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-600/50 transition-all font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 min-h-screen w-full">
        <div className="max-w-7xl mx-auto px-6">
          
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
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition-all ${
                        selectedChannel?.id === channel.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                      }`}
                    >
                      {channel.name}
                    </button>
                  ))}
                </div>

                {selectedChannel ? (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                    {/* En-tête du salon */}
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-xl font-bold text-white">{selectedChannel.name}</h3>
                        {selectedChannel.subject && (
                          <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded text-xs">
                            {selectedChannel.type === 'subject' ? 'Matière' : selectedChannel.type}
                          </span>
                        )}
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
                                    onClick={() => {
                                      const link = prompt('Coller le lien OneDrive :');
                                      if (link) {
                                        const name = prompt('Nom du document (optionnel) :') || 'Document OneDrive';
                                        const linkData = {
                                          id: Date.now() + Math.random(),
                                          url: link.trim(),
                                          name: name.trim(),
                                          addedDate: new Date().toISOString().split('T')[0]
                                        };
                                        setCourses(courses.map(c =>
                                          c.id === course.id
                                            ? { ...c, oneDriveLinks: [...(c.oneDriveLinks || []), linkData] }
                                            : c
                                        ));
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

              {selectedCourseForFlashcards ? (
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
                                  <p className="text-2xl font-bold text-white">{currentCard.question}</p>
                                  <p className="text-sm text-slate-400 mt-6">👆 Cliquez pour voir la réponse</p>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-sm text-purple-300 mb-4">Réponse</div>
                                  <p className="text-xl text-white whitespace-pre-wrap">{currentCard.answer}</p>
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
                // Mode Sélection de cours
                <div className="space-y-6">
                  {courses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Ajoutez des cours pour créer des flashcards</p>
                    </div>
                  ) : (
                    subjects.map(subject => {
                      const subjectCourses = courses.filter(c => c.subject === subject);
                      if (subjectCourses.length === 0) return null;

                      return (
                        <div key={subject} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                          <h3 className={`text-2xl font-bold mb-4 bg-gradient-to-r ${getSubjectColor(subject)} bg-clip-text text-transparent`}>
                            {subject}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjectCourses.map(course => {
                              const courseFlashcards = flashcards.filter(f => f.courseId === course.id);
                              
                              return (
                                <div key={course.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                  <h4 className="font-bold text-white mb-2">{course.chapter}</h4>
                                  <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
                                    <span>🎴 {courseFlashcards.length} carte(s)</span>
                                  </div>
                                  
                                  <div className="flex gap-2 mb-2">
                                    {courseFlashcards.length > 0 ? (
                                      <button
                                        onClick={() => startFlashcardSession(course)}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
                                      >
                                        🎯 Réviser
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          const question = prompt('Question :');
                                          if (question) {
                                            const answer = prompt('Réponse :');
                                            if (answer) {
                                              addFlashcard(course.id, question, answer);
                                            }
                                          }
                                        }}
                                        className="flex-1 px-4 py-2 bg-green-600/30 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-600/50 transition-all font-semibold text-sm"
                                      >
                                        ➕ Créer 1ère carte
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => {
                                        const question = prompt('Question :');
                                        if (question) {
                                          const answer = prompt('Réponse :');
                                          if (answer) {
                                            addFlashcard(course.id, question, answer);
                                          }
                                        }
                                      }}
                                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Bouton Générer avec IA */}
                                  <button
                                    onClick={() => generateFlashcardsWithAI(course)}
                                    disabled={isGeneratingFlashcards}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isGeneratingFlashcards ? (
                                      <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Génération en cours...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4" />
                                        Générer 5 cartes avec IA
                                      </>
                                    )}
                                  </button>

                                  {/* Liste des flashcards */}
                                  {courseFlashcards.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {courseFlashcards.map(card => (
                                        <div key={card.id} className="p-2 bg-slate-800/50 rounded text-xs flex items-center justify-between">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {card.generatedByAI && (
                                              <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                            )}
                                            <span className="text-slate-300 truncate">{card.question}</span>
                                          </div>
                                          <button
                                            onClick={() => {
                                              if (window.confirm('Supprimer cette flashcard ?')) {
                                                deleteFlashcard(card.id);
                                              }
                                            }}
                                            className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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
                        Évaluations à venir (14 jours)
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
                      const suggestions = getSuggestedReviews(day, currentWeek);
                      if (suggestions.length === 0) return null;

                      return (
                        <div key={day} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                              <Calendar className="w-6 h-6 text-indigo-400" />
                              {day}
                            </h3>
                            <span className="px-4 py-2 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-semibold">
                              {suggestions.length} révision(s) suggérée(s)
                            </span>
                          </div>

                          <div className="space-y-4">
                            {suggestions.map(course => (
                              <div key={course.id} className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className={`px-3 py-1 bg-gradient-to-r ${getSubjectColor(course.subject)} rounded-full text-xs font-bold text-white`}>
                                        {course.subject}
                                      </span>
                                      <span className={`text-sm font-semibold ${
                                        course.priority > 80 ? 'text-red-400' : 
                                        course.priority > 50 ? 'text-orange-400' : 
                                        'text-green-400'
                                      }`}>
                                        {course.reason}
                                      </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">{course.chapter}</h4>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                      <span>🎯 Maîtrise: {course.mastery}%</span>
                                      <span>🔄 {course.reviewCount} révision(s)</span>
                                      {course.lastReviewed && (
                                        <span>📅 Dernière révision: {course.lastReviewed}</span>
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

                          {/* Temps de travail suggéré */}
                          {eveningSchedule[day] && (
                            <div className="mt-6 p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg">
                              <h4 className="text-sm font-bold text-indigo-300 mb-2">â±ï¸ Créneaux de travail suggérés:</h4>
                              <div className="flex flex-wrap gap-2">
                                {eveningSchedule[day].filter(slot => slot.duration > 0).map((slot, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-indigo-800/50 text-indigo-200 rounded-full text-xs">
                                    {slot.time} ({slot.duration}min)
                                  </span>
                                ))}
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
                  <p className="text-blue-200 font-semibold">Chapitres totaux</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-8 h-8 text-green-400" />
                    <div className="text-3xl font-bold text-green-300">
                      {courses.reduce((sum, c) => sum + c.reviewCount, 0)}
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
    </div>
  );
}

export default App;
