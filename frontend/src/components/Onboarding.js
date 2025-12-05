import React, { useState } from 'react';
import { Calendar, BookOpen, Brain, Lightbulb, MessageCircle, ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';

const Onboarding = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const slides = [
    {
      title: "Bienvenue sur TSI Manager ! 🎓",
      subtitle: "Votre assistant pour réussir en TSI1",
      icon: <HelpCircle className="w-20 h-20 text-indigo-400" />,
      content: (
        <div className="text-center space-y-6">
          <p className="text-xl text-slate-300">
            Découvrez toutes les fonctionnalités pour organiser votre travail,
            réviser efficacement et communiquer avec vos camarades.
          </p>
          <div className="p-4 bg-indigo-900/30 border border-indigo-500/50 rounded-lg">
            <p className="text-indigo-200 font-semibold">
              🚀 Commencez la visite guidée pour découvrir comment TSI Manager peut vous aider !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Planning 📅",
      subtitle: "Visualisez votre emploi du temps semaine par semaine",
      icon: <Calendar className="w-20 h-20 text-blue-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Navigation entre les semaines</h4>
            <p className="text-slate-300 text-sm">
              Parcourez les 33 semaines de l'année scolaire avec les flèches ← →
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Emploi du temps complet</h4>
            <p className="text-slate-300 text-sm">
              Consultez vos cours, TD et TP pour chaque jour de la semaine
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Événements personnalisés</h4>
            <p className="text-slate-300 text-sm">
              Ajoutez vos DS, colles et autres événements importants avec le bouton +
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Travail du soir recommandé</h4>
            <p className="text-slate-300 text-sm">
              Consultez les suggestions de révision adaptées à chaque jour
            </p>
          </div>
          <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <p className="text-sm text-indigo-300">
              💡 Astuce : Les événements importants sont surlignés en couleur !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Cours 📚",
      subtitle: "Organisez et partagez vos cours par matière",
      icon: <BookOpen className="w-20 h-20 text-purple-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Organisation par matière et chapitre</h4>
            <p className="text-slate-300 text-sm">
              Structurez vos cours de Maths, Physique, SII, Anglais, Français, Informatique...
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Niveau de difficulté</h4>
            <p className="text-slate-300 text-sm">
              Définissez l'importance et la difficulté de chaque chapitre
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Liens vers ressources</h4>
            <p className="text-slate-300 text-sm">
              Ajoutez des liens OneDrive vers vos documents de cours
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Partage avec la classe</h4>
            <p className="text-slate-300 text-sm">
              Tous les cours sont partagés et accessibles à toute la classe
            </p>
          </div>
          <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300">
              💡 Astuce : Ajoutez du contenu pour enrichir vos cours !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Flashcards 🧠",
      subtitle: "Révisez efficacement avec des cartes mémoire",
      icon: <Brain className="w-20 h-20 text-green-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Créer des flashcards</h4>
            <p className="text-slate-300 text-sm">
              Question/réponse pour mémoriser efficacement vos cours
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Support LaTeX pour les formules</h4>
            <p className="text-slate-300 text-sm">
              Écrivez des équations mathématiques : $\frac{`{`}a{`}`}{`{`}b{`}`}$, $\int$, $\sum$
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Mode révision avec suivi</h4>
            <p className="text-slate-300 text-sm">
              Révisez en mode aléatoire et suivez votre progression (correct/incorrect)
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Import/Export</h4>
            <p className="text-slate-300 text-sm">
              Importez depuis Anki, Notion, CSV ou exportez au format JSON
            </p>
          </div>
          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300">
              💡 Astuce : Révisez régulièrement pour une meilleure mémorisation !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Suggestions 💡",
      subtitle: "Recommandations de révision personnalisées",
      icon: <Lightbulb className="w-20 h-20 text-yellow-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Basées sur vos évaluations</h4>
            <p className="text-slate-300 text-sm">
              Suggestions adaptées aux DS et colles à venir
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Planning de travail du soir</h4>
            <p className="text-slate-300 text-sm">
              Recommandations quotidiennes adaptées à chaque jour de la semaine
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Paramètres personnalisables</h4>
            <p className="text-slate-300 text-sm">
              Définissez vos jours de repos, durée de révision, matières prioritaires
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Indicateurs d'urgence</h4>
            <p className="text-slate-300 text-sm">
              🔥 URGENT (J-2), ⚠️ BIENTÔT (J-4), révisions prioritaires
            </p>
          </div>
          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              💡 Astuce : Configurez vos paramètres pour des suggestions optimales !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Chat 💬",
      subtitle: "Communiquez avec vos camarades de classe",
      icon: <MessageCircle className="w-20 h-20 text-pink-400" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Salons par matière</h4>
            <p className="text-slate-300 text-sm">
              Discutez dans des salons dédiés à chaque matière
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Salon général</h4>
            <p className="text-slate-300 text-sm">
              Échangez librement sur tous les sujets
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Partage de questions</h4>
            <p className="text-slate-300 text-sm">
              Posez vos questions et aidez vos camarades
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-2">✓ Messages en temps réel</h4>
            <p className="text-slate-300 text-sm">
              Communication instantanée avec toute la classe
            </p>
          </div>
          <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
            <p className="text-sm text-pink-300">
              💡 Astuce : Soyez respectueux et entraidez-vous !
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Prêt à commencer ! 🚀",
      subtitle: "Vous avez découvert toutes les fonctionnalités",
      icon: <span className="text-8xl">🚀</span>,
      content: (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/50 rounded-lg">
            <h4 className="font-bold text-white text-lg mb-3">📝 Raccourcis utiles</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Bouton <span className="text-indigo-400 font-semibold">+</span> : Ajouter rapidement un cours, flashcard ou événement</li>
              <li>• Onglets : Naviguez entre Planning, Cours, Flashcards, Suggestions, Chat et Stats</li>
              <li>• Menu utilisateur (en haut à droite) : Déconnexion</li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg">
            <h4 className="font-bold text-white text-lg mb-3">🎯 Conseils pour réussir</h4>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Ajoutez vos DS et colles dès que vous les connaissez</li>
              <li>• Créez des flashcards régulièrement pendant vos révisions</li>
              <li>• Consultez les suggestions chaque jour pour rester organisé</li>
              <li>• Partagez vos cours et ressources avec la classe</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-slate-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="dontShowAgain" className="text-slate-300 cursor-pointer">
              Ne plus afficher ce tutoriel au démarrage
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
      localStorage.setItem('tsi_manager_onboarding_completed', 'true');
    }
    onClose();
  };

  const handleSkipAndDisable = () => {
    // Skipping the tutorial always prevents it from showing again
    localStorage.setItem('tsi_manager_onboarding_completed', 'true');
    onClose();
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-indigo-500/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-b border-indigo-500/30">
          <button
            onClick={handleSkipAndDisable}
            className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-400 hover:text-white"
            title="Passer le tutoriel"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              {currentSlideData.icon}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              {currentSlideData.title}
            </h2>
            <p className="text-xl text-indigo-300">
              {currentSlideData.subtitle}
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-indigo-500'
                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                }`}
                title={`Aller à l'étape ${index + 1}`}
              />
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Commencer à utiliser TSI Manager
              <span className="text-xl">🚀</span>
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
