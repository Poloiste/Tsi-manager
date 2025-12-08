import React, { useState } from 'react';
import { Zap, Target, Clock } from 'lucide-react';

/**
 * Composant QuizSetup - Configuration d'un nouveau quiz
 * @param {Array} courses - Liste des cours disponibles
 * @param {Function} onStartQuiz - Callback au démarrage du quiz
 */
export function QuizSetup({ courses, onStartQuiz }) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('training');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(null);

  // Extraire les matières uniques des cours
  const subjects = [...new Set(courses.map(c => c.subject))].sort();

  const handleSubjectToggle = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleStart = () => {
    // Récupérer les IDs des cours des matières sélectionnées
    const courseIds = selectedSubjects.length > 0
      ? courses.filter(c => selectedSubjects.includes(c.subject)).map(c => c.id)
      : courses.map(c => c.id);

    onStartQuiz({
      title: title || undefined,
      mode,
      courseIds,
      questionCount,
      timeLimitMinutes: timeLimit
    });
  };

  const canStart = (selectedSubjects.length > 0 || courses.length > 0) && questionCount > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/20 shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Nouveau Quiz</h2>
          <p className="text-indigo-300">Configurez votre session de révision</p>
        </div>

        {/* Titre du quiz */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">
            Titre du quiz (optionnel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Quiz Révision Maths"
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Mode de quiz */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">
            Mode de quiz
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { value: 'training', label: 'Entraînement', icon: '🎯', desc: 'Feedback immédiat' },
              { value: 'exam', label: 'Examen', icon: '📝', desc: 'Correction à la fin' },
              { value: 'preparation', label: 'Préparation DS', icon: '🎓', desc: 'Mode intensif' }
            ].map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === m.value
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="text-white font-semibold mb-1">{m.label}</div>
                <div className="text-xs text-indigo-300">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sélection des matières */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">
            Matières à réviser
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {subjects.map(subject => (
              <button
                key={subject}
                onClick={() => handleSubjectToggle(subject)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedSubjects.includes(subject)
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          {selectedSubjects.length === 0 && (
            <p className="text-xs text-indigo-300 mt-2">
              💡 Aucune matière sélectionnée = Toutes les matières
            </p>
          )}
        </div>

        {/* Nombre de questions */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">
            Nombre de questions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 30, 50].map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-4 py-3 rounded-lg font-bold transition-all ${
                  questionCount === count
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Limite de temps */}
        <div className="mb-8">
          <label className="block text-white font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Limite de temps
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: null, label: 'Aucune' },
              { value: 10, label: '10 min' },
              { value: 20, label: '20 min' },
              { value: 30, label: '30 min' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTimeLimit(option.value)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  timeLimit === option.value
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bouton de démarrage */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
            canStart
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 hover:scale-[1.02]'
              : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-6 h-6" />
          Commencer le Quiz
        </button>

        {!canStart && (
          <p className="text-center text-red-400 text-sm mt-3">
            ⚠️ Sélectionnez au moins une matière ou assurez-vous d'avoir des cours
          </p>
        )}
      </div>
    </div>
  );
}

export default QuizSetup;
