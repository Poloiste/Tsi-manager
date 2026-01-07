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

  return (
    <div className={`
      help-page min-h-screen
      ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}
    `}>
      <h1 className={isDark ? 'text-white' : 'text-gray-900'}>
        📚 Guide d'utilisation de TSI Manager
      </h1>
      
      <nav className="help-nav">
        <a href="#auth" onClick={(e) => { e.preventDefault(); scrollToSection('auth'); }}>
          🔐 Authentification
        </a>
        <a href="#channels" onClick={(e) => { e.preventDefault(); scrollToSection('channels'); }}>
          💬 Salons
        </a>
        <a href="#flashcards" onClick={(e) => { e.preventDefault(); scrollToSection('flashcards'); }}>
          🎴 Flashcards
        </a>
        <a href="#suggestions" onClick={(e) => { e.preventDefault(); scrollToSection('suggestions'); }}>
          📚 Suggestions
        </a>
        <a href="#schedule" onClick={(e) => { e.preventDefault(); scrollToSection('schedule'); }}>
          📅 Planning
        </a>
        <a href="#settings" onClick={(e) => { e.preventDefault(); scrollToSection('settings'); }}>
          ⚙️ Paramètres
        </a>
        <a href="#groups" onClick={(e) => { e.preventDefault(); scrollToSection('groups'); }}>
          👥 Groupes
        </a>
        <a href="#achievements" onClick={(e) => { e.preventDefault(); scrollToSection('achievements'); }}>
          🏆 Succès
        </a>
        <a href="#quiz" onClick={(e) => { e.preventDefault(); scrollToSection('quiz'); }}>
          🎯 Quiz
        </a>
        <a href="#stats" onClick={(e) => { e.preventDefault(); scrollToSection('stats'); }}>
          📊 Statistiques
        </a>
        <a href="#theme" onClick={(e) => { e.preventDefault(); scrollToSection('theme'); }}>
          🌙 Thème
        </a>
      </nav>
      
      <section id="auth">
        <h2>🔐 Authentification</h2>
        <p>
          Pour utiliser TSI Manager, vous devez créer un compte ou vous connecter avec vos identifiants.
        </p>
        <h3>Créer un compte</h3>
        <p>
          1. Cliquez sur "S'inscrire" sur la page de connexion<br/>
          2. Entrez votre adresse email et choisissez un mot de passe sécurisé<br/>
          3. Vérifiez votre email pour confirmer votre compte<br/>
          4. Connectez-vous avec vos identifiants
        </p>
        <h3>Se connecter</h3>
        <p>
          1. Entrez votre email et mot de passe<br/>
          2. Cliquez sur "Se connecter"<br/>
          3. Vous serez redirigé vers la page d'accueil
        </p>
      </section>
      
      <section id="channels">
        <h2>💬 Salons de discussion</h2>
        <p>
          Les salons de discussion fonctionnent comme sur Discord. Vous pouvez créer des catégories pour organiser
          vos salons, et des salons publics ou privés pour discuter avec d'autres utilisateurs.
        </p>
        
        <h3>Créer une catégorie</h3>
        <p>
          1. Cliquez sur le bouton "+" à côté de "Discussions" dans la barre latérale<br/>
          2. Entrez le nom de la catégorie<br/>
          3. Cliquez sur "Créer"<br/>
          4. La catégorie apparaît dans la liste
        </p>
        
        <h3>Créer un canal</h3>
        <p>
          1. Cliquez sur le bouton "+" à côté d'une catégorie<br/>
          2. Entrez le nom du canal<br/>
          3. Choisissez la visibilité : Public ou Privé<br/>
          4. Cliquez sur "Créer"<br/>
          5. Le canal apparaît dans la catégorie
        </p>
        
        <h3>Canaux privés</h3>
        <p>
          Les canaux privés ne sont visibles que par les membres invités. Seul le créateur et les modérateurs
          peuvent gérer les membres.
        </p>
        <p>
          <strong>Gérer les membres d'un canal privé :</strong><br/>
          1. Survolez le canal privé que vous avez créé<br/>
          2. Cliquez sur l'icône d'engrenage (⚙️) qui apparaît<br/>
          3. Dans le modal, recherchez des utilisateurs par nom ou email<br/>
          4. Cliquez sur "+" pour ajouter un membre<br/>
          5. Cliquez sur l'icône poubelle pour retirer un membre
        </p>
        
        <h3>Envoyer des messages</h3>
        <p>
          1. Sélectionnez un canal<br/>
          2. Tapez votre message dans le champ en bas<br/>
          3. Appuyez sur Entrée ou cliquez sur "Envoyer"<br/>
          4. Votre message apparaît dans le canal
        </p>
      </section>
      
      <section id="flashcards">
        <h2>🎴 Flashcards et Révisions</h2>
        <p>
          Les flashcards sont des cartes de révision avec une question au recto et une réponse au verso.
          Elles vous aident à mémoriser efficacement vos cours.
        </p>
        
        <h3>Créer une flashcard</h3>
        <p>
          1. Allez dans l'onglet "Cours"<br/>
          2. Sélectionnez un cours ou créez-en un nouveau<br/>
          3. Cliquez sur "➕ Créer 1ère carte" ou "Ajouter une carte"<br/>
          4. Remplissez la question (recto) et la réponse (verso)<br/>
          5. Vous pouvez utiliser LaTeX pour les formules mathématiques (entre $ ou $$)<br/>
          6. Cliquez sur "Créer"
        </p>
        
        <h3>Réviser avec les flashcards</h3>
        <p>
          1. Allez dans l'onglet "Révisions"<br/>
          2. Cliquez sur "🎯 Réviser" pour un cours<br/>
          3. Lisez la question et essayez de répondre mentalement<br/>
          4. Cliquez sur "Voir la réponse"<br/>
          5. Évaluez votre réponse : Facile, Moyen, ou Difficile<br/>
          6. L'algorithme ajustera la fréquence de révision en fonction de votre réponse
        </p>
        
        <h3>Système de répétition espacée (SRS)</h3>
        <p>
          TSI Manager utilise un algorithme de répétition espacée pour optimiser vos révisions.
          Les cartes que vous maîtrisez seront revues moins souvent, tandis que les cartes difficiles
          reviendront plus fréquemment.
        </p>
      </section>
      
      <section id="suggestions">
        <h2>📚 Suggestions de révision</h2>
        <p>
          L'algorithme analyse votre emploi du temps et vous suggère automatiquement quoi réviser en priorité
          en fonction de vos prochains DS, colles et DM.
        </p>
        
        <h3>Niveaux d'urgence</h3>
        <ul>
          <li><strong>🔥 URGENT</strong> : Test dans 1-2 jours - À réviser immédiatement !</li>
          <li><strong>⚠️ BIENTÔT</strong> : Test dans 3-4 jours - Commencez à réviser</li>
          <li><strong>📖 NORMAL</strong> : Test dans 5+ jours - Révision régulière recommandée</li>
        </ul>
        
        <h3>Score de priorité</h3>
        <p>
          Chaque suggestion a un score calculé en fonction de :
        </p>
        <ul>
          <li>Le type d'évaluation (DS = prioritaire, Colle = important, DM = normal)</li>
          <li>Le temps restant avant l'évaluation</li>
          <li>Votre progression actuelle dans la matière</li>
        </ul>
      </section>
      
      <section id="schedule">
        <h2>📅 Emploi du temps</h2>
        <p>
          L'emploi du temps affiche vos cours de la semaine. Vous pouvez également ajouter vos DS, 
          Colles et DM personnalisés pour mieux vous organiser.
        </p>
        
        <h3>Ajouter un événement</h3>
        <p>
          1. Cliquez sur "+ Ajouter un événement"<br/>
          2. Remplissez les informations :<br/>
          &nbsp;&nbsp;&nbsp;- Titre de l'événement<br/>
          &nbsp;&nbsp;&nbsp;- Type (DS, Colle, DM, ou Autre)<br/>
          &nbsp;&nbsp;&nbsp;- Matière<br/>
          &nbsp;&nbsp;&nbsp;- Date<br/>
          &nbsp;&nbsp;&nbsp;- Heure (optionnel)<br/>
          &nbsp;&nbsp;&nbsp;- Salle (optionnel)<br/>
          3. Cliquez sur "Ajouter"<br/>
          4. L'événement apparaît dans votre planning
        </p>
        
        <h3>Modifier ou supprimer un événement</h3>
        <p>
          1. Cliquez sur l'événement dans le planning<br/>
          2. Modifiez les informations ou cliquez sur "Supprimer"<br/>
          3. Confirmez la suppression si nécessaire
        </p>
      </section>
      
      <section id="settings">
        <h2>⚙️ Paramètres de révision</h2>
        <p>
          Personnalisez vos sessions de révision selon vos préférences et votre emploi du temps.
        </p>
        
        <h3>Options disponibles</h3>
        <ul>
          <li><strong>Heure de début</strong> : À quelle heure commencer vos révisions</li>
          <li><strong>Durée totale</strong> : Combien de temps réviser chaque jour</li>
          <li><strong>Durée par session</strong> : Durée de chaque session avant une pause</li>
          <li><strong>Matières prioritaires</strong> : Sélectionnez les matières à privilégier</li>
          <li><strong>Jours de repos</strong> : Choisissez les jours sans révision</li>
        </ul>
        
        <h3>Accéder aux paramètres</h3>
        <p>
          Cliquez sur l'icône d'engrenage (⚙️) dans la barre de navigation.
        </p>
      </section>
      
      <section id="groups">
        <h2>👥 Groupes d'étude</h2>
        <p>
          Les groupes d'étude vous permettent de collaborer avec d'autres étudiants, partager des ressources
          et réviser ensemble.
        </p>
        
        <h3>Créer un groupe</h3>
        <p>
          1. Cliquez sur "Créer un groupe" dans l'onglet Discussions<br/>
          2. Entrez le nom du groupe<br/>
          3. Ajoutez une description (optionnel)<br/>
          4. Choisissez si le groupe est public ou privé<br/>
          5. Cliquez sur "Créer"
        </p>
        
        <h3>Rejoindre un groupe</h3>
        <p>
          1. Parcourez la liste des groupes publics<br/>
          2. Cliquez sur "Rejoindre" sur le groupe de votre choix<br/>
          3. Vous recevrez une notification de confirmation
        </p>
        
        <h3>Fonctionnalités des groupes</h3>
        <ul>
          <li>Chat en temps réel avec tous les membres</li>
          <li>Partage de fichiers (PDF, images, documents)</li>
          <li>Classement des membres selon leur activité</li>
          <li>Création de canaux thématiques</li>
        </ul>
      </section>
      
      <section id="achievements">
        <h2>🏆 Succès et XP</h2>
        <p>
          Gagnez de l'expérience (XP) en révisant et débloquez des badges pour célébrer vos progrès !
        </p>
        
        <h3>Comment gagner de l'XP</h3>
        <ul>
          <li><strong>Bonne réponse</strong> : +10 XP</li>
          <li><strong>Mauvaise réponse</strong> : +2 XP (pour l'effort !)</li>
          <li><strong>Session complète</strong> : +25 XP bonus</li>
          <li><strong>Streak de 7 jours</strong> : +100 XP</li>
          <li><strong>Première révision du jour</strong> : +5 XP</li>
        </ul>
        
        <h3>Niveaux et rangs</h3>
        <p>
          Vous progressez en niveau au fur et à mesure que vous gagnez de l'XP. Chaque niveau débloque
          de nouveaux badges et fonctionnalités.
        </p>
        
        <h3>Badges disponibles</h3>
        <ul>
          <li>🔰 Débutant - Première connexion</li>
          <li>📖 Lecteur assidu - 10 sessions complétées</li>
          <li>🎯 Expert - 100 cartes maîtrisées</li>
          <li>🔥 En feu - Streak de 30 jours</li>
          <li>👑 Champion - Classé #1 dans un groupe</li>
        </ul>
      </section>
      
      <section id="quiz">
        <h2>🎯 Quiz</h2>
        <p>
          Testez vos connaissances avec des quiz personnalisés basés sur vos flashcards.
        </p>
        
        <h3>Créer un quiz</h3>
        <p>
          1. Allez dans l'onglet "Quiz"<br/>
          2. Sélectionnez les matières à inclure<br/>
          3. Choisissez le nombre de questions<br/>
          4. Définissez le temps limite (optionnel)<br/>
          5. Cliquez sur "Commencer le quiz"
        </p>
        
        <h3>Répondre aux questions</h3>
        <p>
          1. Lisez attentivement la question<br/>
          2. Sélectionnez votre réponse parmi les choix proposés<br/>
          3. Cliquez sur "Suivant" pour passer à la question suivante<br/>
          4. À la fin, consultez vos résultats et votre score
        </p>
        
        <h3>Types de questions</h3>
        <ul>
          <li>Questions à choix multiples</li>
          <li>Questions vrai/faux</li>
          <li>Questions à réponse courte</li>
          <li>Questions de correspondance</li>
        </ul>
      </section>
      
      <section id="stats">
        <h2>📊 Statistiques</h2>
        <p>
          Suivez votre progression avec des graphiques détaillés et des heatmaps d'activité.
        </p>
        
        <h3>Métriques disponibles</h3>
        <ul>
          <li><strong>Taux de réussite</strong> : Pourcentage de bonnes réponses</li>
          <li><strong>Cartes révisées</strong> : Nombre total de cartes étudiées</li>
          <li><strong>Temps de révision</strong> : Heures passées à réviser</li>
          <li><strong>Streak actuel</strong> : Jours consécutifs de révision</li>
          <li><strong>Meilleur streak</strong> : Record de jours consécutifs</li>
          <li><strong>XP total</strong> : Points d'expérience accumulés</li>
        </ul>
        
        <h3>Heatmap d'activité</h3>
        <p>
          La heatmap affiche votre activité de révision sur l'année. Les jours avec plus de révisions
          sont plus foncés. C'est une excellente façon de visualiser votre régularité.
        </p>
        
        <h3>Graphiques par matière</h3>
        <p>
          Consultez vos statistiques détaillées par matière pour identifier vos points forts
          et les domaines à améliorer.
        </p>
      </section>
      
      <section id="theme">
        <h2>🌙 Thème</h2>
        <p>
          Basculez entre le mode sombre et le mode clair selon vos préférences.
        </p>
        
        <h3>Changer de thème</h3>
        <p>
          1. Cliquez sur l'icône soleil/lune (☀️/🌙) dans la barre de navigation<br/>
          2. Le thème change instantanément<br/>
          3. Votre préférence est sauvegardée automatiquement
        </p>
        
        <h3>Avantages du mode sombre</h3>
        <ul>
          <li>Réduit la fatigue oculaire dans les environnements sombres</li>
          <li>Économise la batterie sur les écrans OLED</li>
          <li>Look moderne et élégant</li>
        </ul>
        
        <h3>Avantages du mode clair</h3>
        <ul>
          <li>Meilleure lisibilité en pleine lumière</li>
          <li>Contraste plus élevé pour certains contenus</li>
          <li>Look professionnel et épuré</li>
        </ul>
      </section>
      
      <div className={`
        mt-12 pt-8 border-t text-center
        ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-600'}
      `}>
        <p>
          Besoin d'aide supplémentaire ? Contactez-nous dans le canal #support ou par email.
        </p>
        <p className="mt-4 text-sm">
          © 2024 TSI Manager - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
