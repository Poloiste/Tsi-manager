# Test Plan - TSI Manager Shared Data Migration

## Objectif

Vérifier que la migration de localStorage vers Supabase fonctionne correctement et que les données sont bien partagées ou isolées selon les spécifications.

## Prérequis

1. ✅ Script SQL `database/schema.sql` exécuté sur Supabase
2. ✅ Au moins 2 comptes utilisateurs de test créés
3. ✅ Variables d'environnement configurées
4. ✅ Application déployée

## Tests fonctionnels

### 1. Authentification

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Login | 1. Ouvrir l'application<br>2. Se connecter avec un compte | Redirection vers l'app | ⬜ |
| Logout | 1. Cliquer sur "Déconnexion" | Retour à l'écran de login | ⬜ |

### 2. Cours partagés

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Créer un cours | 1. Utilisateur A se connecte<br>2. Aller dans "📚 Cours"<br>3. Cliquer "Ajouter un cours"<br>4. Remplir : Maths, "Test Intégrales"<br>5. Valider | Cours créé et visible | ⬜ |
| Voir cours partagé | 1. Utilisateur B se connecte<br>2. Aller dans "📚 Cours"<br>3. Chercher le cours "Test Intégrales" | Cours visible par B | ⬜ |
| Supprimer son cours | 1. Utilisateur A essaie de supprimer "Test Intégrales" | Suppression réussie | ⬜ |
| Supprimer cours autre | 1. Utilisateur B essaie de supprimer un cours de A | Échec (policy RLS) | ⬜ |
| Ajouter lien OneDrive | 1. Ajouter un lien à un cours existant | Lien ajouté et visible | ⬜ |
| Voir lien partagé | 1. Autre utilisateur voit le lien | Lien visible | ⬜ |

### 3. Flashcards partagées

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Créer flashcard | 1. Utilisateur A crée un cours<br>2. Aller dans "🎴 Révision"<br>3. Créer une flashcard<br>4. Question: "Test Q", Réponse: "Test R" | Flashcard créée | ⬜ |
| Voir flashcard partagée | 1. Utilisateur B va dans "🎴 Révision"<br>2. Chercher la flashcard de A | Flashcard visible | ⬜ |
| Réviser flashcard | 1. Utilisateur B lance une session<br>2. Répondre correct/incorrect | Stats personnelles mises à jour | ⬜ |
| Stats personnelles | 1. Vérifier que les stats de A et B sont différentes | Chaque user a ses propres stats | ⬜ |
| Supprimer flashcard | 1. A supprime sa flashcard | Suppression réussie | ⬜ |
| Bouton IA absent | 1. Vérifier l'interface | Pas de bouton "Générer avec IA" | ⬜ |

### 4. Événements personnels

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Créer événement | 1. Utilisateur A va dans "📅 Planning"<br>2. Cliquer "Ajouter"<br>3. Créer DS Maths semaine prochaine | Événement créé | ⬜ |
| Isolation événements | 1. Utilisateur B va dans Planning<br>2. Chercher l'événement de A | Événement invisible pour B | ⬜ |
| Supprimer événement | 1. A supprime son événement | Suppression réussie | ⬜ |

### 5. Planning adaptatif

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Sans événements | 1. Utilisateur sans événements<br>2. Voir planning du soir | Planning normal (violet) | ⬜ |
| Avec DS proche | 1. Créer DS dans 3 jours<br>2. Sélectionner un jour avant le DS | Slots adaptés en rouge avec "🎯 RÉVISION DS" | ⬜ |
| Plusieurs DS | 1. Créer 2-3 DS dans la semaine<br>2. Vérifier adaptation | Plusieurs slots adaptés | ⬜ |
| DS lointain | 1. Créer DS dans 15 jours<br>2. Voir planning | Pas d'adaptation (>7 jours) | ⬜ |

### 6. Progression personnelle

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Marquer révisé | 1. Aller dans "🎯 Suggestions"<br>2. Marquer un cours comme révisé | Maîtrise augmente | ⬜ |
| Isolation progression | 1. A marque un cours révisé<br>2. B voit le même cours | B a progression à 0%, A a progression mise à jour | ⬜ |
| Historique révision | 1. Réviser un cours plusieurs fois<br>2. Vérifier historique | Historique personnel enregistré | ⬜ |

### 7. Chat (existant - vérifier non-régression)

| Test | Étapes | Résultat attendu | Status |
|------|--------|------------------|--------|
| Envoyer message | 1. Aller dans "💬 Discussions"<br>2. Envoyer un message | Message apparaît | ⬜ |
| Temps réel | 1. A envoie un message<br>2. B voit en temps réel | Message apparaît sans refresh | ⬜ |

## Tests de sécurité

### Row Level Security (RLS)

| Test | Description | Résultat attendu | Status |
|------|-------------|------------------|--------|
| Lecture cours anonyme | Tenter de lire `shared_courses` sans auth | Échec (policy) | ⬜ |
| Insertion cours anonyme | Tenter d'insérer dans `shared_courses` sans auth | Échec (policy) | ⬜ |
| Supprimer cours autre utilisateur | User B supprime cours de User A via SQL | Échec (policy) | ⬜ |
| Lire événements autre user | User A lit `user_events` de User B | Échec (policy - ne voit que les siens) | ⬜ |
| Modifier progression autre user | User A modifie `user_revision_progress` de User B | Échec (policy) | ⬜ |

## Tests de performance

| Test | Description | Résultat attendu | Status |
|------|-------------|------------------|--------|
| Chargement initial | Temps de chargement avec 50 cours | < 2 secondes | ⬜ |
| Chargement flashcards | Temps de chargement avec 100 flashcards | < 2 secondes | ⬜ |
| Création cours | Temps de création d'un cours | < 1 seconde | ⬜ |
| Révision flashcard | Temps de mise à jour des stats | < 500ms | ⬜ |

## Tests de migration

| Test | Description | Résultat attendu | Status |
|------|-------------|------------------|--------|
| Anciennes données | Ouvrir app avec anciennes données localStorage | Données localStorage ignorées | ⬜ |
| Nouvelles données | Créer des données, rafraîchir page | Données persistent (Supabase) | ⬜ |

## Critères d'acceptation

- [ ] Tous les tests fonctionnels passent
- [ ] Tous les tests de sécurité passent
- [ ] Performance acceptable (< 2s chargement)
- [ ] Pas d'erreurs dans la console browser
- [ ] Pas d'erreurs dans les logs Supabase
- [ ] Documentation à jour
- [ ] Migration guide disponible

## Bugs connus / À corriger

*Remplir pendant les tests*

## Notes

*Ajouter observations pendant les tests*

## Validation finale

- [ ] Product Owner valide les fonctionnalités
- [ ] Tests manuels complets effectués
- [ ] Revue de code effectuée
- [ ] Documentation validée
- [ ] Prêt pour le déploiement
