import React, { useState } from 'react';
import { Calendar, BookOpen, Brain, Lightbulb, MessageCircle, ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';
import { ONBOARDING_COMPLETED_KEY } from '../constants';

const Onboarding = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const slides = [
    {
      title: "🎉 Salut ! Bienvenue sur TSI Manager",
      subtitle: "L'app qui va te sauver la vie en prépa 😎",
      icon: <HelpCircle className="w-20 h-20 text-indigo-400" />,
      content: (
        <div className="text-center space-y-6">
          <p className="text-xl text-slate-300">
            Fini le stress de savoir quoi réviser ce soir !
          </p>
          <p className="text-lg text-slate-400">
            On t'a préparé un petit tour pour te montrer comment ça marche.
          </p>
        </div>
      )
    },
    {
      title: "📅 Le Planning",
      subtitle: "Ton emploi du temps, mais en mieux !",
      icon: <Calendar className="w-20 h-20 text-blue-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Navigue entre les semaines (S1 à S33) avec les flèches
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Clique sur un jour pour voir ce qui t'attend
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Ajoute tes DS, colles et autres galères avec le +
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Check le travail du soir (oui, y'en a tous les jours 😅)
            </p>
          </div>
          <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <p className="text-base text-indigo-300">
              💡 <span className="font-semibold">Pro tip :</span> Les trucs importants sont colorés pour pas les louper !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "📚 Les Cours",
      subtitle: "Tous les cours de la classe au même endroit !",
      icon: <BookOpen className="w-20 h-20 text-purple-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Triés par matière (Maths, Physique, SII...)
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Avec les liens vers les docs (OneDrive & co)
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Tu peux en ajouter pour aider les autres 🤝
            </p>
          </div>
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-base text-purple-300">
              💡 <span className="font-semibold">Pro tip :</span> Clique sur une matière pour voir les chapitres !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🧠 Les Flashcards",
      subtitle: "La méthode ultime pour retenir les formules !",
      icon: <Brain className="w-20 h-20 text-green-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Crée des cartes question/réponse
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Les formules LaTeX marchent : $\frac{'{a}'}{'{b}'}$, $\int$, etc.
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Mode révision pour t'entraîner
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Importe/exporte pour partager avec la classe
            </p>
          </div>
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-base text-green-300">
              💡 <span className="font-semibold">Pro tip :</span> Révise 15 min par jour, c'est plus efficace que 3h la veille du DS 😉
            </p>
          </div>
        </div>
      )
    },
    {
      title: "💡 Les Suggestions",
      subtitle: "L'app réfléchit pour toi (enfin presque)",
      icon: <Lightbulb className="w-20 h-20 text-yellow-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Elle te dit quoi bosser ce soir selon ton planning
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → 🔥 URGENT = le DS c'est demain, bouge-toi !
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → ⚠️ BIENTÔT = t'as encore un peu de temps
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Perso dans les paramètres (jours off, durée...)
            </p>
          </div>
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-base text-yellow-300">
              💡 <span className="font-semibold">Pro tip :</span> Le samedi c'est DM et colles, le dimanche on prépare la semaine !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "💬 Le Chat",
      subtitle: "Pour poser des questions sans spammer le groupe WhatsApp 😄",
      icon: <MessageCircle className="w-20 h-20 text-pink-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Un salon par matière
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Un salon général pour papoter
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-base">
              → Pose tes questions, aide les autres
            </p>
          </div>
          <div className="p-4 bg-pink-900/20 border border-pink-500/30 rounded-lg">
            <p className="text-base text-pink-300">
              💡 <span className="font-semibold">Pro tip :</span> Si t'as pas compris un truc, y'a sûrement quelqu'un qui peut t'aider !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🎓 T'es prêt !",
      subtitle: "Maintenant tu sais tout, go réviser ! 💪",
      icon: <span className="text-8xl">🎓</span>,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/50 rounded-lg">
            <h4 className="font-bold text-white text-xl mb-4">Rappel rapide :</h4>
            <ul className="space-y-3 text-slate-300 text-base">
              <li>📅 <span className="font-semibold">Planning</span> = ton emploi du temps</li>
              <li>📚 <span className="font-semibold">Cours</span> = les docs de la classe</li>
              <li>🧠 <span className="font-semibold">Flashcards</span> = pour mémoriser</li>
              <li>💡 <span className="font-semibold">Suggestions</span> = quoi bosser ce soir</li>
              <li>💬 <span className="font-semibold">Chat</span> = pour s'entraider</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 text-indigo-600 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            />
            <label htmlFor="dontShowAgain" className="text-slate-300 cursor-pointer text-base">
              ☐ Ne plus afficher ce tuto au démarrage
            </label>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    }
    onClose();
  };

  const handleSkipAndDisable = () => {
    // Skipping the tutorial always prevents it from showing again
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    onClose();
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-subtitle"
    >
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-indigo-500/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-indigo-500/30">
          <button
            onClick={handleSkipAndDisable}
            className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-400 hover:text-white"
            title="Passer le tutoriel"
            aria-label="Passer le tutoriel"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              {currentSlideData.icon}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2" id="onboarding-title">
              {currentSlideData.title}
            </h2>
            <p className="text-xl text-indigo-300" id="onboarding-subtitle">
              {currentSlideData.subtitle}
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  index === currentSlide
                    ? 'bg-indigo-500'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
                title={`Aller à l'étape ${index + 1}`}
                aria-label={`Aller à l'étape ${index + 1}`}
                aria-current={index === currentSlide ? 'step' : undefined}
              >
                <span className={`block h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-indigo-300' : 'w-2 bg-current'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[50vh]">
          {currentSlideData.content}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              currentSlide === 0
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          <div className="text-slate-400 font-semibold">
            {currentSlide + 1} / {slides.length}
          </div>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
            >
              Let's go ! 🚀
            </button>
          ) : currentSlide === 0 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
            >
              C'est parti ! 🚀
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
