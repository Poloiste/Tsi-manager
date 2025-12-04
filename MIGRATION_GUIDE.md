# Guide de Migration - TSI Manager

## Vue d'ensemble

Cette version de TSI Manager migre de localStorage vers Supabase et introduit un système de données partagées et personnelles.

## Changements majeurs

### 1. Suppression de la génération IA de flashcards

**Avant** : Bouton "Générer 5 cartes avec IA" utilisant un backend externe

**Après** : Création manuelle de flashcards uniquement

**Raison** : Simplification du système et focus sur le partage collaboratif

### 2. Données partagées vs personnelles

#### Données PARTAGÉES (visibles par tous les utilisateurs)

- **Cours** (`shared_courses`) : Tous les étudiants peuvent ajouter des cours que tout le monde verra
- **Liens OneDrive** (`shared_course_links`) : Liens partagés pour les documents de cours
- **Flashcards** (`shared_flashcards`) : Flashcards créées par n'importe quel étudiant, accessibles à tous

**Avantages** :
- Collaboration entre étudiants
- Bibliothèque de ressources commune
- Gain de temps (pas besoin de recréer des flashcards existantes)

#### Données PERSONNELLES (filtrées par utilisateur)

- **Événements** (`user_events`) : Vos DS, Colles, DM personnels
- **Progression** (`user_revision_progress`) : Votre maîtrise et historique de révision pour chaque cours
- **Statistiques flashcards** (`user_flashcard_stats`) : Vos résultats personnels sur les flashcards

**Avantages** :
- Planning adapté à vos évaluations
- Suivi personnel de votre progression
- Confidentialité de vos résultats

### 3. Planning du soir adaptatif

Le planning du soir s'adapte maintenant automatiquement selon vos évaluations :

**Fonctionnement** :
- Analyse des DS/Colles/DM dans les 7 prochains jours
- Remplacement des activités génériques par des révisions ciblées
- Affichage visuel différent (rouge) pour les slots adaptés

**Exemple** :
```
Avant : "Maths : exercices"
Après : "🎯 RÉVISION DS Maths (J-2)"
```

## Migration de vos données

### Anciennes données localStorage

Les données stockées dans localStorage ne sont **plus utilisées** :
- `tsi-courses` → Maintenant dans `shared_courses`
- `tsi-flashcards` → Maintenant dans `shared_flashcards`
- `tsi-custom-events` → Maintenant dans `user_events`

### Comment migrer vos données ?

**Option 1 : Recréation manuelle** (recommandée pour peu de données)
1. Ouvrez l'ancienne version
2. Notez vos cours et flashcards importants
3. Recréez-les dans la nouvelle version

**Option 2 : Script de migration** (si vous avez beaucoup de données)
1. Exportez les données de localStorage dans la console :
```javascript
console.log(JSON.stringify({
  courses: JSON.parse(localStorage.getItem('tsi-courses')),
  flashcards: JSON.parse(localStorage.getItem('tsi-flashcards')),
  events: JSON.parse(localStorage.getItem('tsi-custom-events'))
}));
```
2. Copiez le résultat
3. Contactez les développeurs pour un script d'import

## Configuration requise

### Supabase

**IMPORTANT** : Vous devez exécuter le script SQL pour créer les tables :

1. Connectez-vous à votre projet Supabase
2. SQL Editor → New query
3. Copiez tout le contenu de `database/schema.sql`
4. Exécutez le script
5. Vérifiez dans "Table Editor" que les tables suivantes existent :
   - `shared_courses`
   - `shared_course_links`
   - `shared_flashcards`
   - `user_events`
   - `user_revision_progress`
   - `user_flashcard_stats`
   - `chat_channels`
   - `chat_messages`

### Variables d'environnement

Aucune variable supplémentaire n'est nécessaire. Les variables Supabase existantes suffisent :
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## Nouvelles fonctionnalités

### 1. Cours partagés

**Comment ça marche** :
- Vous ajoutez un cours → Visible par tous les étudiants
- Vous supprimez un cours → Seul le créateur peut supprimer
- Vous révisez un cours → Votre progression est personnelle

**Cas d'usage** :
- Un étudiant ajoute "Maths - Intégrales" avec des liens OneDrive
- Tous les autres peuvent le voir et ajouter leurs propres liens
- Chacun suit sa propre progression sur ce cours

### 2. Flashcards collaboratives

**Comment ça marche** :
- Créez une flashcard → Visible par tous
- Révisez une flashcard → Vos stats (correct/incorrect) sont personnelles
- Supprimez une flashcard → Seul le créateur peut supprimer

**Cas d'usage** :
- Un étudiant crée 10 flashcards sur "Thermodynamique"
- Tous les autres peuvent les réviser
- Chacun a ses propres statistiques de réussite

### 3. Planning adaptatif

**Comment ça marche** :
- Ajoutez un DS pour dans 3 jours
- Le planning du soir affiche automatiquement "🎯 RÉVISION DS [Matière] (J-3)"
- Les slots adaptés sont en rouge au lieu de violet

**Cas d'usage** :
- DS de Maths lundi
- Colle de Physique mercredi
- Le planning du weekend vous propose des révisions ciblées

## Résolution de problèmes

### "Erreur lors de l'ajout du cours"

**Cause** : Tables Supabase non créées ou RLS mal configuré

**Solution** :
1. Vérifiez que le script SQL a été exécuté
2. Vérifiez dans Supabase → Authentication que vous êtes connecté
3. Vérifiez les politiques RLS dans "Table Editor" → [table] → "Policies"

### "Je ne vois pas les cours des autres"

**Cause** : Problème de politique RLS

**Solution** :
Exécutez dans SQL Editor :
```sql
-- Vérifier les politiques
SELECT * FROM shared_courses LIMIT 5;
```
Si erreur "row-level security", réexécutez le script `database/schema.sql`

### "Mes événements ne s'affichent plus"

**Cause** : Migration de localStorage vers Supabase

**Solution** :
Vos anciens événements sont dans localStorage mais ne sont plus lus. Recréez-les dans l'application.

### "Le planning du soir ne s'adapte pas"

**Vérifications** :
1. Avez-vous des événements (DS/Colle/DM) dans les 7 prochains jours ?
2. Les événements ont-ils une date valide ?
3. Sélectionnez un jour dans le planning pour voir le détail

## Support

Pour toute question :
1. Vérifiez ce guide de migration
2. Consultez le README.md
3. Ouvrez une issue sur GitHub

## Checklist de déploiement

- [ ] Script SQL exécuté sur Supabase
- [ ] Variables d'environnement configurées
- [ ] Application déployée et testée
- [ ] Au moins un utilisateur de test a créé des données
- [ ] Vérification du partage des cours entre utilisateurs
- [ ] Vérification de l'isolation des événements personnels
- [ ] Test du planning adaptatif avec des événements à venir
