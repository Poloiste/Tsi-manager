import React from 'react';

/**
 * HelpPage - Comprehensive user guide for TSI Manager
 */
export function HelpPage({ isDark = true }) {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigationItems = [
    { id: 'auth', label: '🔐 Connexion' },
    { id: 'planning', label: '📅 Planning' },
    { id: 'courses', label: '📚 Cours' },
    { id: 'flashcards', label: '🎴 Flashcards' },
    { id: 'quiz', label: '📝 Quiz' },
    { id: 'discussions', label: '💬 Discussions' },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'stats', label: '📊 Progression' },
    { id: 'tools', label: '🛠️ Outils' }
  ];

  return (
    <div className={`
      help-page min-h-screen
      ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}
    `}>
      <h1 className={isDark ? 'text-white' : 'text-gray-900'}>
        📚 Guide d'utilisation de TSI Manager
      </h1>
      <p className={`mb-8 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        Retrouvez ici toutes les fonctionnalités actuellement disponibles pour organiser vos cours, révisions et échanges à l'université.
      </p>

      <nav className="help-nav">
        {navigationItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); scrollToSection(item.id); }}>
            {item.label}
          </a>
        ))}
      </nav>

      <section id="auth">
        <h2>🔐 Connexion et démarrage</h2>
        <p>
          TSI Manager fonctionne avec un compte personnel. Une fois connecté, vous accédez à votre planning, vos cours, vos flashcards, vos quiz et vos statistiques.
        </p>
        <h3>Première connexion</h3>
        <p>
          1. Créez votre compte avec votre adresse email<br/>
          2. Confirmez votre adresse si nécessaire<br/>
          3. Connectez-vous pour ouvrir l'application<br/>
          4. Le tutoriel d'accueil apparaît automatiquement lors de la première visite
        </p>
        <h3>Navigation générale</h3>
        <p>
          Les onglets principaux sont : Planning, Cours, Révision, Quiz, Discussions et Stats. En haut à droite, vous retrouvez aussi l'aide, les notifications, le changement de thème et la déconnexion.
        </p>
      </section>

      <section id="planning">
        <h2>📅 Planning universitaire</h2>
        <p>
          Le planning centralise votre emploi du temps universitaire, vos évaluations et vos priorités de révision.
        </p>
        <h3>Synchroniser l'emploi du temps</h3>
        <p>
          1. Ouvrez l'onglet Planning<br/>
          2. Cliquez sur "Configurer l’EDT" ou "Changer l’EDT"<br/>
          3. Collez votre lien ICS universitaire (edt.univ-angers.fr)<br/>
          4. Sauvegardez pour synchroniser automatiquement les cours
        </p>
        <h3>Gérer les semaines et les jours</h3>
        <p>
          Utilisez les flèches pour changer de semaine, le bouton "Aujourd'hui" pour revenir à la semaine courante, puis cliquez sur un jour pour afficher son détail.
        </p>
        <h3>Ajouter une évaluation ou un événement personnel</h3>
        <p>
          Avec le bouton "Ajouter", vous pouvez créer un événement en choisissant une matière, un type et un horaire.
        </p>
        <ul>
          <li>Types disponibles : DS, DM, Colle, Examen, TP noté</li>
          <li>Choix par date précise ou par semaine/jour</li>
          <li>Heure et durée personnalisables</li>
          <li>Suppression possible des événements ajoutés manuellement</li>
        </ul>
        <h3>Suggestions intelligentes</h3>
        <p>
          Le bloc "Suggestions" utilise votre emploi du temps, vos évaluations à venir, votre niveau de maîtrise et les matières prévues le lendemain pour recommander quoi réviser en priorité.
        </p>
        <h3>Paramètres de révision</h3>
        <ul>
          <li>Durée totale de révision disponible</li>
          <li>Durée par session ou par matière</li>
          <li>Moteur de suggestion V2 ou Legacy</li>
          <li>Matières prioritaires</li>
          <li>Jours de repos sans suggestion</li>
        </ul>
        <h3>Rappels complémentaires</h3>
        <p>
          Des rappels visuels sont aussi affichés dans cette vue, notamment pour penser au portfolio et à la messagerie Zimbra.
        </p>
      </section>

      <section id="courses">
        <h2>📚 Bibliothèque de cours</h2>
        <p>
          L'onglet Cours sert à organiser vos matières, vos chapitres et les ressources associées.
        </p>
        <h3>Ajouter un cours</h3>
        <p>
          1. Cliquez sur "Ajouter un cours"<br/>
          2. Choisissez la matière<br/>
          3. Renseignez le chapitre<br/>
          4. Ajoutez une description si besoin<br/>
          5. Associez un ou plusieurs liens OneDrive
        </p>
        <h3>Ressources et suivi</h3>
        <ul>
          <li>Organisation par matière puis par chapitre</li>
          <li>Ajout et suppression de liens OneDrive</li>
          <li>Affichage de la date d'ajout, du taux de maîtrise et du nombre de révisions</li>
          <li>Bouton "Marquer révisé" pour mettre à jour la progression</li>
        </ul>
        <h3>Recherche</h3>
        <p>
          Une barre de recherche est disponible dans l'onglet Cours pour retrouver rapidement une matière ou un chapitre.
        </p>
      </section>

      <section id="flashcards">
        <h2>🎴 Flashcards et révision SRS</h2>
        <p>
          Les flashcards servent à mémoriser activement vos cours avec un système de répétition espacée.
        </p>
        <h3>Créer et modifier des cartes</h3>
        <ul>
          <li>Association de chaque carte à un cours</li>
          <li>Question et réponse personnalisées</li>
          <li>Prévisualisation avant enregistrement</li>
          <li>Support du LaTeX pour les formules</li>
        </ul>
        <h3>Révisions du jour</h3>
        <p>
          L'écran principal de révision affiche vos cartes à revoir selon quatre catégories : à réviser, en apprentissage, maîtrisées et nouvelles.
        </p>
        <h3>Import / Export</h3>
        <ul>
          <li>Import CSV</li>
          <li>Import Anki au format texte tabulé</li>
          <li>Import Noji IA au format JSON</li>
          <li>Import Notion depuis un tableau Markdown</li>
          <li>Export des flashcards par cours</li>
        </ul>
        <h3>Recherche</h3>
        <p>
          Une recherche dédiée est aussi disponible dans l'onglet Révision pour retrouver une carte plus vite.
        </p>
      </section>

      <section id="quiz">
        <h2>📝 Quiz</h2>
        <p>
          Les quiz utilisent vos flashcards pour vous entraîner dans un format plus proche d'une évaluation.
        </p>
        <h3>Lancer un quiz</h3>
        <ul>
          <li>Quiz rapide : 10 questions toutes matières</li>
          <li>Nouveau quiz personnalisé avec titre optionnel</li>
          <li>Sélection des matières incluses</li>
          <li>Choix du nombre de questions et de la limite de temps</li>
        </ul>
        <h3>Modes disponibles</h3>
        <ul>
          <li>Entraînement : correction immédiate</li>
          <li>Examen : correction détaillée à la fin</li>
          <li>Préparation DS : session intensive</li>
        </ul>
        <h3>Après le quiz</h3>
        <p>
          La page de résultat affiche le score, le temps passé, la correction détaillée, l'historique des quiz et les statistiques globales.
        </p>
      </section>

      <section id="discussions">
        <h2>💬 Discussions</h2>
        <p>
          L'espace Discussions reprend une organisation de type Discord pour centraliser les échanges entre étudiants.
        </p>
        <h3>Organisation</h3>
        <ul>
          <li>Création de catégories</li>
          <li>Création de salons dans une catégorie</li>
          <li>Salons publics ou privés</li>
          <li>Suppression des salons ou catégories créés par vous</li>
        </ul>
        <h3>Salons privés</h3>
        <p>
          Le créateur d'un salon privé peut gérer les membres depuis l'icône dédiée affichée au survol du salon.
        </p>
        <h3>Messagerie</h3>
        <ul>
          <li>Messages en temps réel</li>
          <li>Indicateur de messages non lus</li>
          <li>Accès rapide aux salons depuis la barre latérale</li>
        </ul>
      </section>

      <section id="notifications">
        <h2>🔔 Notifications</h2>
        <p>
          Le centre de notifications regroupe vos rappels et alertes. Il est accessible depuis l'icône cloche en haut de l'application.
        </p>
        <h3>Depuis le centre de notifications</h3>
        <ul>
          <li>Consulter les notifications non lues</li>
          <li>Marquer une notification comme lue</li>
          <li>Tout marquer comme lu</li>
          <li>Ouvrir directement les paramètres de notifications</li>
        </ul>
        <h3>Paramètres disponibles</h3>
        <ul>
          <li>Notifications navigateur</li>
          <li>Rappel quotidien avec heure configurable</li>
          <li>Rappel si des cartes sont dues</li>
          <li>Alerte streak en danger</li>
          <li>Rappel avant une évaluation</li>
          <li>Objectif quotidien de cartes et notification d'objectif atteint</li>
        </ul>
      </section>

      <section id="stats">
        <h2>📊 Progression et statistiques</h2>
        <p>
          L'onglet Stats vous aide à suivre votre régularité et vos progrès sur le long terme.
        </p>
        <h3>Vue d'ensemble</h3>
        <ul>
          <li>XP total</li>
          <li>Streak actuel</li>
          <li>Nombre de révisions</li>
          <li>Maîtrise moyenne</li>
          <li>Nombre d'évaluations à venir</li>
        </ul>
        <h3>Gamification</h3>
        <p>
          Vous débloquez des badges au fil de votre progression. Une heatmap annuelle permet aussi de visualiser votre activité jour après jour.
        </p>
        <h3>Statistiques SRS</h3>
        <p>
          La page détaille également la répartition des cartes à réviser, en apprentissage, maîtrisées et nouvelles, avec un accès direct aux sessions correspondantes.
        </p>
      </section>

      <section id="tools">
        <h2>🛠️ Outils pratiques</h2>
        <h3>Thème</h3>
        <p>
          Utilisez le bouton soleil/lune en haut à droite pour passer du mode sombre au mode clair. Votre préférence est mémorisée automatiquement.
        </p>
        <h3>Aide</h3>
        <p>
          Le bouton "Aide" ouvre ce guide complet à tout moment, y compris sur mobile depuis le menu.
        </p>
        <h3>Conseil d'utilisation</h3>
        <ul>
          <li>Commencez par configurer votre EDT</li>
          <li>Ajoutez vos chapitres et vos liens de cours</li>
          <li>Créez vos flashcards, puis utilisez le SRS et les quiz pour vous entraîner</li>
        </ul>
      </section>

      <div className={`
        mt-12 pt-8 border-t text-center
        ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-600'}
      `}>
        <p>
          Besoin d'aide supplémentaire ? Consultez l'équipe pédagogique ou votre canal d'entraide habituel.
        </p>
        <p className="mt-4 text-sm">
          © {new Date().getFullYear()} TSI Manager - Tous droits réservés
        </p>
      </div>
    </div>
  );
}

export default HelpPage;
