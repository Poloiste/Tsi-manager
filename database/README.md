# Configuration de la base de données

## Installation

Pour utiliser la fonctionnalité de chat/discussions, vous devez créer les tables nécessaires dans votre base de données Supabase.

### Étapes d'installation

1. **Connectez-vous à Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor**
   - Dans le menu de gauche, cliquez sur **SQL Editor**
   - Cliquez sur **New query**

3. **Exécutez le script**
   - Copiez le contenu du fichier `schema.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur **Run** pour exécuter

4. **Vérifiez l'installation**
   - Allez dans **Table Editor**
   - Vérifiez que les tables suivantes sont créées :
     - `chat_channels` (salons de discussion)
     - `chat_messages` (messages)

## Structure des tables

### Table `chat_channels`

Stocke les différents salons de discussion.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique du salon |
| name | TEXT | Nom du salon (ex: "Maths", "Général") |
| type | TEXT | Type de salon ('general', 'subject', 'course') |
| subject | TEXT | Matière associée (pour les salons de type 'subject') |
| course_id | UUID | ID du cours associé (pour les discussions par cours) |
| created_at | TIMESTAMP | Date de création |

### Table `chat_messages`

Stocke tous les messages envoyés dans les salons.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique du message |
| channel_id | UUID | ID du salon où le message a été envoyé |
| user_id | UUID | ID de l'utilisateur qui a envoyé le message |
| user_name | TEXT | Nom d'affichage de l'utilisateur |
| content | TEXT | Contenu du message |
| created_at | TIMESTAMP | Date d'envoi |

## Politiques de sécurité (RLS)

Le script configure automatiquement les politiques Row Level Security (RLS) suivantes :

### Pour `chat_channels`
- **Lecture** : Tout le monde peut voir les salons

### Pour `chat_messages`
- **Lecture** : Tout le monde peut voir les messages
- **Écriture** : Seuls les utilisateurs authentifiés peuvent envoyer des messages
- **Suppression** : Les utilisateurs peuvent supprimer uniquement leurs propres messages

## Salons par défaut

Le script crée automatiquement les salons suivants :
- **Général** : Pour les discussions diverses
- **Maths** : Pour les questions de mathématiques
- **Physique** : Pour les questions de physique
- **Méca** : Pour les questions de mécanique
- **Elec** : Pour les questions d'électricité
- **Anglais** : Pour les questions d'anglais
- **Français** : Pour les questions de français
- **Informatique** : Pour les questions d'informatique

## Temps réel

Les messages sont synchronisés en temps réel grâce à **Supabase Realtime**. Aucune configuration supplémentaire n'est nécessaire si Realtime est activé sur votre projet Supabase.

Pour vérifier/activer Realtime :
1. Allez dans **Database** > **Replication**
2. Activez Realtime pour les tables `chat_messages` et `chat_channels`

## Dépannage

### Les messages n'apparaissent pas

1. Vérifiez que les tables sont créées correctement
2. Vérifiez que les politiques RLS sont bien configurées
3. Vérifiez que Realtime est activé
4. Vérifiez les variables d'environnement Supabase dans `.env`

### Erreur "permission denied"

Les politiques RLS sont probablement mal configurées. Réexécutez le script `schema.sql` pour les recréer.

### Les salons n'apparaissent pas

Vérifiez que les données ont bien été insérées :
```sql
SELECT * FROM chat_channels;
```

Si aucun salon n'apparaît, exécutez manuellement la partie INSERT du script.
