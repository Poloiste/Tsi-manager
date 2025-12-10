import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook de gestion des quiz/examens
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions de quiz
 */
export function useQuiz(userId) {
  // États
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref pour le timer
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  /**
   * Créer un nouveau quiz
   * @param {Object} options - Configuration du quiz
   * @param {string} options.title - Titre du quiz (optionnel)
   * @param {string} options.mode - Mode: 'training' | 'exam' | 'preparation'
   * @param {Array<string>} options.courseIds - IDs des cours sélectionnés
   * @param {number} options.questionCount - Nombre de questions
   * @param {number} options.timeLimitMinutes - Limite de temps en minutes (null = pas de limite)
   * @returns {Promise<Object>} Le quiz créé
   */
  const createQuiz = useCallback(async (options) => {
    if (!userId) return null;
    
    setIsLoading(true);
    try {
      const { title, mode, courseIds, questionCount, timeLimitMinutes } = options;

      // Récupérer les flashcards correspondantes
      let query = supabase
        .from('shared_flashcards')
        .select(`
          *,
          shared_courses!inner(subject, chapter)
        `);

      // Filtrer par cours si spécifié
      if (courseIds && courseIds.length > 0) {
        query = query.in('course_id', courseIds);
      }

      const { data: flashcards, error: flashcardsError } = await query;
      
      if (flashcardsError) throw flashcardsError;

      if (!flashcards || flashcards.length === 0) {
        throw new Error('Aucune flashcard trouvée avec ces critères');
      }

      // Sélectionner des questions aléatoires avec Fisher-Yates shuffle
      const shuffled = [...flashcards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, flashcards.length));

      // Créer la session de quiz dans la base de données
      const { data: quiz, error: quizError } = await supabase
        .from('quiz_sessions')
        .insert([{
          user_id: userId,
          title: title || `Quiz ${mode === 'training' ? 'Entraînement' : mode === 'exam' ? 'Examen' : 'Préparation DS'}`,
          mode,
          question_count: selectedQuestions.length,
          time_limit_minutes: timeLimitMinutes,
          total_questions: selectedQuestions.length,
          score: 0,
          time_spent_seconds: 0
        }])
        .select()
        .single();

      if (quizError) throw quizError;

      // Initialiser l'état du quiz
      setCurrentQuiz(quiz);
      setQuestions(selectedQuestions);
      setCurrentIndex(0);
      setAnswers([]);
      
      if (timeLimitMinutes) {
        setTimeRemaining(timeLimitMinutes * 60); // Convertir en secondes
      } else {
        setTimeRemaining(null);
      }

      return quiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Démarrer le chronomètre du quiz
   */
  const startQuiz = useCallback(() => {
    if (!currentQuiz) return;

    startTimeRef.current = Date.now();

    // Démarrer le timer si limite de temps
    if (timeRemaining !== null) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [currentQuiz, timeRemaining]);

  /**
   * Enregistrer une réponse
   * @param {string} flashcardId - ID de la flashcard
   * @param {string} userAnswer - Réponse de l'utilisateur (optionnel en mode training)
   * @param {boolean} isCorrect - La réponse est-elle correcte
   * @returns {Promise<void>}
   */
  const submitAnswer = useCallback(async (flashcardId, userAnswer, isCorrect) => {
    if (!currentQuiz) return;

    try {
      // Enregistrer la réponse dans la base de données
      const { error } = await supabase
        .from('quiz_answers')
        .insert([{
          quiz_session_id: currentQuiz.id,
          flashcard_id: flashcardId,
          user_answer: userAnswer || null,
          is_correct: isCorrect,
          time_spent_seconds: 0 // Can be calculated later if needed
        }]);

      if (error) throw error;

      // Ajouter à l'état local
      setAnswers(prev => [...prev, {
        flashcard_id: flashcardId,
        user_answer: userAnswer,
        is_correct: isCorrect
      }]);

    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }, [currentQuiz]);

  /**
   * Passer à la question suivante
   */
  const nextQuestion = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  }, [questions.length]);

  /**
   * Terminer le quiz et calculer le score
   * @returns {Promise<Object>} Le quiz complété avec le score
   */
  const finishQuiz = useCallback(async () => {
    if (!currentQuiz) return null;

    try {
      // Arrêter le timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Calculer le temps écoulé
      const timeSpent = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      // Calculer le score
      const correctCount = answers.filter(a => a.is_correct).length;
      const score = Math.round((correctCount / questions.length) * 100);

      // Mettre à jour la session dans la base de données
      const { data: updatedQuiz, error } = await supabase
        .from('quiz_sessions')
        .update({
          score,
          time_spent_seconds: timeSpent,
          completed_at: new Date().toISOString()
        })
        .eq('id', currentQuiz.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentQuiz(updatedQuiz);
      return updatedQuiz;
    } catch (error) {
      console.error('Error finishing quiz:', error);
      throw error;
    }
  }, [currentQuiz, answers, questions.length]);

  /**
   * Charger l'historique des quiz
   * @returns {Promise<Array>} Liste des quiz passés
   */
  const loadQuizHistory = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setQuizHistory(data || []);
      return data;
    } catch (error) {
      console.error('Error loading quiz history:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Réinitialiser le quiz en cours
   */
  const resetQuiz = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentQuiz(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setTimeRemaining(null);
    startTimeRef.current = null;
  }, []);

  /**
   * Obtenir les statistiques globales
   * @returns {Object} Statistiques des quiz
   */
  const getQuizStats = useCallback(() => {
    if (quizHistory.length === 0) {
      return {
        totalCompleted: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0
      };
    }

    const totalCompleted = quizHistory.length;
    const averageScore = Math.round(
      quizHistory.reduce((sum, q) => sum + (q.score || 0), 0) / totalCompleted
    );
    const bestScore = Math.max(...quizHistory.map(q => q.score || 0));
    const totalTimeSpent = quizHistory.reduce((sum, q) => sum + (q.time_spent_seconds || 0), 0);

    return {
      totalCompleted,
      averageScore,
      bestScore,
      totalTimeSpent
    };
  }, [quizHistory]);

  // Charger l'historique au montage
  useEffect(() => {
    if (userId) {
      loadQuizHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only re-run when userId changes to avoid infinite loops

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    // États
    currentQuiz,
    questions,
    currentIndex,
    answers,
    timeRemaining,
    quizHistory,
    isLoading,

    // Fonctions
    createQuiz,
    startQuiz,
    submitAnswer,
    nextQuestion,
    finishQuiz,
    loadQuizHistory,
    resetQuiz,
    getQuizStats
  };
}

export default useQuiz;
