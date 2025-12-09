# Configuration de la base de données

## Installation

Pour utiliser l'application TSI Manager, vous devez créer toutes les tables nécessaires dans votre base de données Supabase.

### Étapes d'installation

1. **Connectez-vous à Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor**
   - Dans le menu de gauche, cliquez sur **SQL Editor**
   - Cliquez sur **New query**

3. **Exécutez les migrations dans l'ordre**
   
   **IMPORTANT**: Exécutez les migrations dans cet ordre exact :
   
   a. **Base Schema** - Exécutez `schema.sql` en premier
      - Crée les tables de base : courses, flashcards, événements, chat
   
   b. **Migration 1** - `add_user_flashcard_srs.sql`
      - Ajoute le système de répétition espacée (SRS)
   
   c. **Migration 2** - `add_flashcard_author_and_import_tracking.sql`
      - Ajoute le suivi des auteurs et imports de flashcards
   
   d. **Migration 3** - `add_gamification_tables.sql`
      - Ajoute badges, profils utilisateurs, statistiques journalières
   
   e. **Migration 4** - `add_quiz_tables.sql`
      - Ajoute les sessions de quiz et réponses
   
   f. **Migration 5** - `add_notification_tables.sql`
      - Ajoute les paramètres de notification et rappels
   
   g. **Migration 6** - `add_study_groups_tables.sql`
      - Ajoute les groupes d'étude et leurs fonctionnalités
   
   h. **Migration 7** - `add_missing_tables.sql` (NOUVEAU)
      - Ajoute toutes les tables manquantes référencées dans le code
      - Inclut : historique révisions, emplois du temps, examens, planning hebdomadaire, objectifs, révisions partagées, decks publics, challenges de groupe

4. **Vérifiez l'installation**
   - Allez dans **Table Editor**
   - Vérifiez que toutes les tables sont créées (voir liste complète ci-dessous)

## Liste complète des tables

Après avoir exécuté toutes les migrations, vous devriez avoir les tables suivantes :

### Données partagées (visibles par tous)
- `shared_courses` - Cours partagés
- `shared_course_links` - Liens OneDrive des cours
- `shared_flashcards` - Flashcards partagées
- `shared_revisions` - Matériel de révision partagé
- `public_decks` - Decks publics (communauté)
- `deck_ratings` - Notes et avis sur les decks
- `deck_downloads` - Suivi des téléchargements
- `deck_likes` - Likes sur les decks

### Données personnelles utilisateur
- `user_events` - Événements personnels (DS, Colles, DM)
- `user_revision_progress` - Progression sur les cours
- `user_revision_history` - Historique des révisions
- `user_flashcard_stats` - Statistiques par flashcard
- `user_flashcard_srs` - Données de répétition espacée (SRS)
- `user_schedules` - Emplois du temps hebdomadaires
- `user_exams` - Examens (DS/DM/Colles)
- `user_weekly_planning` - Planning hebdomadaire
- `user_goals` - Objectifs hebdomadaires

### Gamification
- `badges` - Badges disponibles
- `user_badges` - Badges débloqués par utilisateur
- `user_profiles` - Profils utilisateurs (XP, stats)
- `user_daily_stats` - Statistiques journalières

### Quiz
- `quiz_sessions` - Sessions de quiz
- `quiz_answers` - Réponses aux questions de quiz

### Notifications
- `user_notification_settings` - Paramètres de notification
- `scheduled_reminders` - Rappels planifiés

### Groupes d'étude
- `study_groups` - Groupes d'étude
- `study_group_members` - Membres des groupes
- `study_group_shared_decks` - Decks partagés dans les groupes
- `study_group_activities` - Activités des groupes
- `group_challenges` - Défis de groupe
- `group_challenge_progress` - Progression sur les défis

### Chat
- `chat_channels` - Salons de discussion
- `chat_messages` - Messages

## Politiques de sécurité (RLS)

Toutes les tables ont Row Level Security (RLS) activée avec les politiques appropriées :

### Données partagées
- **Lecture** : Tous les utilisateurs authentifiés
- **Écriture** : Tous les utilisateurs authentifiés
- **Mise à jour/Suppression** : Seulement le créateur

### Données personnelles
- **Toutes opérations** : Seulement l'utilisateur propriétaire (via `auth.uid()`)

### Groupes d'étude
- **Lecture** : Membres du groupe
- **Écriture** : Membres du groupe
- **Administration** : Admins du groupe

### Decks publics
- **Lecture** : Tous (pour decks publiés), Créateur (pour decks non publiés)
- **Création** : Utilisateurs authentifiés
- **Modification/Suppression** : Créateur uniquement

## Données initiales

### Salons de chat par défaut
Le script crée automatiquement ces salons :
- **Général** : Discussions diverses
- **Maths** : Questions de mathématiques
- **Physique** : Questions de physique
- **Méca** : Questions de mécanique
- **Elec** : Questions d'électricité
- **Anglais** : Questions d'anglais
- **Français** : Questions de français
- **Informatique** : Questions d'informatique

### Badges par défaut
14 badges sont créés automatiquement :
- Badges de série (3, 7, 30, 100 jours)
- Badges de maîtrise (10, 50, 100, 500 cartes)
- Badges de création (1, 50 cartes)
- Badges de sessions (1, 10, 50, 100 sessions)

## Fonctionnalités temps réel

Plusieurs fonctionnalités utilisent **Supabase Realtime** :
- Messages de chat
- Activités de groupe
- Notifications

Pour vérifier/activer Realtime :
1. Allez dans **Database** > **Replication**
2. Activez Realtime pour les tables suivantes :
   - `chat_messages`
   - `chat_channels`
   - `study_group_activities`
   - `scheduled_reminders`

## Triggers et fonctions automatiques

Les migrations créent plusieurs fonctions et triggers automatiques :

### Mise à jour automatique des timestamps
- Toutes les tables avec `updated_at` sont automatiquement mises à jour

### Statistiques des decks publics
- Les notes, likes et téléchargements sont automatiquement comptés
- Le nombre de cartes est automatiquement calculé

### Profils utilisateur
- Les profils sont créés automatiquement lors de la première activité

### Groupes d'étude
- Le créateur est automatiquement ajouté comme admin
- Un code d'invitation unique est généré automatiquement

## Dépannage

### Erreur "relation does not exist"

Les tables n'ont pas été créées. Exécutez les migrations dans l'ordre indiqué ci-dessus.

### Erreur "permission denied"

Les politiques RLS ne sont pas correctement configurées. Réexécutez les migrations.

### Les données ne s'affichent pas

1. Vérifiez que vous êtes authentifié
2. Vérifiez les politiques RLS
3. Consultez les logs Supabase (Settings > Logs)

### Les triggers ne fonctionnent pas

Vérifiez que les fonctions ont été créées :
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

### Réinitialisation complète

Si vous devez tout réinitialiser :
```sql
-- ⚠️ ATTENTION : Cela supprime TOUTES les données
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Puis réexécutez toutes les migrations dans l'ordre.

## Migration depuis une ancienne version

Si vous avez une base de données existante et souhaitez ajouter les nouvelles tables :

1. Identifiez quelles migrations ont déjà été appliquées
2. Exécutez uniquement les migrations manquantes
3. La migration `add_missing_tables.sql` peut être exécutée en toute sécurité (utilise `IF NOT EXISTS`)

## Support

Pour plus d'informations sur la structure de la base de données, consultez :
- `schema.sql` - Schéma de base complet avec commentaires
- Fichiers de migration individuels pour des détails spécifiques
- Documentation de chaque table dans les commentaires SQL
