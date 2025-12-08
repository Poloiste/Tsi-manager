import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

/**
 * Composant MathText - Rendu des équations LaTeX avec KaTeX
 */
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
            throwOnError: false
          });
        } catch (e) {
          // Silently ignore KaTeX errors
        }
      }
    };

    if (window.katex && window.renderMathInElement) {
      setTimeout(renderMath, 50);
    } else {
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
  
  return <div ref={ref} className={className}>{children}</div>;
};

/**
 * Composant QuizSession - Affichage d'un quiz en cours
 * @param {Object} quiz - Session de quiz active
 * @param {Array} questions - Liste des questions (flashcards)
 * @param {number} currentIndex - Index de la question actuelle
 * @param {Array} answers - Réponses déjà données
 * @param {number} timeRemaining - Temps restant en secondes (null si pas de limite)
 * @param {Function} onSubmitAnswer - Callback pour soumettre une réponse
 * @param {Function} onNextQuestion - Callback pour passer à la question suivante
 * @param {Function} onFinish - Callback pour terminer le quiz
 */
export function QuizSession({
  quiz,
  questions,
  currentIndex,
  answers,
  timeRemaining,
  onSubmitAnswer,
  onNextQuestion,
  onFinish
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const correctCount = answers.filter(a => a.is_correct).length;
  const incorrectCount = answers.filter(a => !a.is_correct).length;

  // Formater le temps restant
  const formatTime = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset l'état quand on change de question
  useEffect(() => {
    setShowAnswer(false);
    setCurrentAnswer(null);
  }, [currentIndex]);

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleAnswerResponse = async (isCorrect) => {
    setCurrentAnswer(isCorrect);
    await onSubmitAnswer(currentQuestion.id, null, isCorrect);

    // En mode examen, passer automatiquement à la question suivante après un délai
    if (quiz.mode === 'exam') {
      setTimeout(() => {
        if (isLastQuestion) {
          onFinish();
        } else {
          onNextQuestion();
        }
      }, 800);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onFinish();
    } else {
      onNextQuestion();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec progression et chronomètre */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          {/* Progression */}
          <div className="flex items-center gap-4">
            <div className="text-white">
              <span className="text-2xl font-bold">{currentIndex + 1}</span>
              <span className="text-slate-400">/{questions.length}</span>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">{correctCount}</span>
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-bold">{incorrectCount}</span>
              </div>
            </div>
          </div>

          {/* Chronomètre */}
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mt-4 bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Carte de question (style flashcard) */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8 mb-6 min-h-[400px] flex flex-col">
        {/* Question */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6 mb-6">
            <div className="text-xs text-indigo-400 font-semibold mb-2 uppercase tracking-wider">
              Question
            </div>
            <MathText className="text-white text-xl leading-relaxed">
              {currentQuestion.question}
            </MathText>
          </div>

          {/* Réponse (révélée ou cachée) */}
          {showAnswer ? (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
              <div className="text-xs text-purple-400 font-semibold mb-2 uppercase tracking-wider">
                Réponse
              </div>
              <MathText className="text-white text-xl leading-relaxed">
                {currentQuestion.answer}
              </MathText>
            </div>
          ) : (
            <button
              onClick={handleRevealAnswer}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all hover:scale-[1.02]"
            >
              👁️ Voir la réponse
            </button>
          )}
        </div>

        {/* Boutons de réponse */}
        {showAnswer && currentAnswer === null && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-slate-400 mb-4">Avez-vous répondu correctement ?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswerResponse(false)}
                className="px-6 py-4 bg-red-500/20 border-2 border-red-500/50 text-red-300 rounded-xl font-bold text-lg hover:bg-red-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <XCircle className="w-6 h-6" />
                Incorrect
              </button>
              <button
                onClick={() => handleAnswerResponse(true)}
                className="px-6 py-4 bg-green-500/20 border-2 border-green-500/50 text-green-300 rounded-xl font-bold text-lg hover:bg-green-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                Correct
              </button>
            </div>
          </div>
        )}

        {/* Feedback et bouton suivant */}
        {currentAnswer !== null && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className={`text-center mb-4 text-xl font-bold ${
              currentAnswer ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentAnswer ? '✅ Bonne réponse !' : '❌ Réponse incorrecte'}
            </div>
            {quiz.mode !== 'exam' && (
              <button
                onClick={handleNext}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {isLastQuestion ? 'Terminer le Quiz' : 'Question suivante'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info mode examen */}
      {quiz.mode === 'exam' && (
        <div className="text-center text-slate-400 text-sm">
          <p>📝 Mode Examen : La correction détaillée sera affichée à la fin</p>
        </div>
      )}
    </div>
  );
}

export default QuizSession;
