import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, X, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

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
 * Composant QuizResults - Affichage des résultats du quiz
 * @param {Object} quiz - Session de quiz complétée
 * @param {Array} answers - Réponses données par l'utilisateur
 * @param {Array} questions - Liste des questions (flashcards)
 * @param {Function} onRetry - Callback pour refaire le quiz
 * @param {Function} onClose - Callback pour fermer les résultats
 */
export function QuizResults({ quiz, answers, questions, onRetry, onClose }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const correctCount = answers.filter(a => a.is_correct).length;
  const incorrectCount = answers.filter(a => !a.is_correct).length;
  const scorePercentage = quiz.score || 0;

  // Animation du score
  useEffect(() => {
    let start = 0;
    const end = scorePercentage;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
        
        // Déclencher les confettis si score > 90%
        if (end > 90) {
          setShowConfetti(true);
        }
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [scorePercentage]);

  // Format du temps
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const avgTimePerQuestion = quiz.time_spent_seconds 
    ? Math.floor(quiz.time_spent_seconds / questions.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)]
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Score principal */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8 mb-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Terminé !</h2>
        <p className="text-indigo-300 mb-6">{quiz.title}</p>

        {/* Score animé */}
        <div className="relative inline-block">
          <div className="text-8xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {animatedScore}%
          </div>
          {scorePercentage >= 90 && (
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🎉</div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{correctCount}</span>
            </div>
            <div className="text-slate-400 text-sm">Bonnes réponses</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
              <XCircle className="w-5 h-5" />
              <span className="text-2xl font-bold">{incorrectCount}</span>
            </div>
            <div className="text-slate-400 text-sm">Erreurs</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-indigo-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold">{formatTime(quiz.time_spent_seconds)}</span>
            </div>
            <div className="text-slate-400 text-sm">Temps total</div>
          </div>
        </div>

        {avgTimePerQuestion > 0 && (
          <div className="mt-4 text-slate-400 text-sm">
            ⏱️ Temps moyen par question : {avgTimePerQuestion}s
          </div>
        )}
      </div>

      {/* Liste des questions avec correction */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8 mb-6">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          📝 Correction détaillée
        </h3>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const answer = answers[index];
            const isCorrect = answer?.is_correct;

            return (
              <div
                key={question.id}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isCorrect
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icône de statut */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">Question {index + 1}</span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Question */}
                    <MathText className="text-slate-300 mb-3 text-sm">
                      {question.question}
                    </MathText>

                    {/* Réponse (affichée seulement si incorrecte ou en mode examen) */}
                    {!isCorrect && (
                      <div className="mt-3 pl-4 border-l-2 border-purple-500/50">
                        <div className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wider">
                          Bonne réponse :
                        </div>
                        <MathText className="text-white text-sm">
                          {question.answer}
                        </MathText>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onRetry}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Refaire un Quiz
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-6 py-4 bg-slate-800/50 border-2 border-slate-700 text-slate-300 rounded-xl font-bold text-lg hover:border-indigo-500/50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Fermer
        </button>
      </div>
    </div>
  );
}

// CSS pour l'animation des confettis (à ajouter dans index.css ou App.css)
const confettiStyles = `
@keyframes confetti {
  0% {
    transform: translateY(0) rotateZ(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotateZ(360deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti linear forwards;
}
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = confettiStyles;
  document.head.appendChild(style);
}

export default QuizResults;
