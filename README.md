# TSI Manager

Application de gestion pour étudiants TSI (Technologie et Sciences Industrielles).

## Description

TSI Manager est une application web full-stack conçue pour aider les étudiants TSI à gérer leurs études, leurs devoirs et leurs ressources pédagogiques. L'application utilise React pour le frontend, Node.js/Express pour le backend, et Supabase comme base de données.

## Prérequis

- **Node.js** (version 14 ou supérieure)
- **npm** (généralement installé avec Node.js)
- **Compte Supabase** (pour la base de données) - [Créer un compte gratuit](https://supabase.com/)

## Structure du projet

```
tsi-manager/
├── backend/                 # Serveur Node.js/Express
│   ├── config/
│   │   └── supabase.js     # Configuration Supabase
│   ├── .env.example        # Template des variables d'environnement
│   ├── package.json
│   └── server.js           # Point d'entrée du serveur
├── frontend/               # Application React
│   ├── src/
│   │   ├── App.js         # Composant principal
│   │   └── index.js       # Point d'entrée React
│   ├── public/
│   ├── .env.example       # Template des variables d'environnement
│   └── package.json
├── .gitignore
└── README.md
```

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Poloiste/Tsi-manager.git
cd Tsi-manager
```

### 2. Configuration du Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Éditer le fichier `.env` et remplir les variables avec vos informations Supabase :

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Server Configuration
PORT=3000
```

Pour obtenir vos identifiants Supabase :
1. Connectez-vous à [supabase.com](https://supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez l'URL du projet et la clé `service_role` (attention : gardez cette clé secrète !)

### 3. Configuration du Frontend

```bash
cd ../frontend
npm install
```

Créer un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Éditer le fichier `.env` :

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Lancement de l'application

### Démarrer le Backend

```bash
cd backend
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Démarrer le Frontend

Dans un nouveau terminal :

```bash
cd frontend
npm start
```

L'application React s'ouvre automatiquement dans votre navigateur sur `http://localhost:3001` (ou 3000 si le backend n'utilise pas ce port).

## Scripts disponibles

### Backend

- `npm start` - Démarre le serveur en mode production

### Frontend

- `npm start` - Démarre l'application en mode développement
- `npm run build` - Crée une version optimisée pour la production
- `npm test` - Lance les tests
- `npm run eject` - Éjecte la configuration (attention : opération irréversible)

## Fonctionnalités

- **Gestion du planning TSI** : Emploi du temps hebdomadaire avec planning du soir adaptatif
  - Planning du soir s'adapte automatiquement selon les DS/Colles/DM à venir
  - Révisions ciblées pour les évaluations dans les 7 prochains jours
- **Bibliothèque de cours partagée** : Cours collaboratifs entre tous les étudiants TSI
  - Organisez vos cours par matière avec liens OneDrive
  - Tous les étudiants peuvent ajouter et consulter les cours
  - Progression personnelle sur chaque cours
- **Système de révision collaborative** : Flashcards partagées entre tous les étudiants
  - Créez et partagez des flashcards
  - Statistiques personnelles de révision
  - Suivi de votre progression sur chaque carte
- **Suggestions intelligentes** : Recommandations de révision basées sur vos DS et votre progression
  - Analyse des évaluations à venir
  - Priorisation automatique selon l'urgence
  - Suggestions de créneaux de révision
- **💬 Discussions** : Chat en temps réel pour l'entraide entre étudiants TSI
  - Salons par matière (Maths, Physique, Méca, Elec, Anglais, Français, Informatique)
  - Salon général pour discussions diverses
  - Messages en temps réel avec Supabase Realtime
  - Suppression de vos propres messages
- **👥 Groupes d'étude** : Créez et rejoignez des groupes d'étude collaboratifs
  - Créez des groupes publics ou privés avec codes d'invitation
  - Chat en temps réel réservé aux membres du groupe
  - Partagez des decks de révision avec votre groupe
  - Classement des membres par XP et progression
  - Gestion des rôles (admin/membre)
- **Événements personnels** : DS, Colles, DM personnalisés par utilisateur
- **Statistiques** : Vue d'ensemble de votre progression personnelle
- **Interface utilisateur moderne** : Dark theme avec design responsive

## Configuration de la base de données

### Tables Supabase

**IMPORTANT** : Vous devez exécuter le script SQL dans `database/schema.sql` sur votre instance Supabase pour créer toutes les tables nécessaires :

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `database/schema.sql`
4. Vérifiez que toutes les tables sont créées

#### Tables créées par le script

**Données partagées (visibles par tous les utilisateurs) :**
- `shared_courses` - Cours partagés entre tous les étudiants
- `shared_course_links` - Liens OneDrive partagés pour les cours
- `shared_flashcards` - Flashcards partagées pour la révision

**Données personnelles (filtrées par user_id) :**
- `user_events` - Événements personnels (DS, Colles, DM)
- `user_revision_progress` - Progression personnelle sur les cours
- `user_flashcard_stats` - Statistiques personnelles sur les flashcards

**Système de chat :**
- `chat_channels` - Salons de discussion
- `chat_messages` - Messages en temps réel

**Système de groupes :**
- `groupes` - Groupes d'étude avec nom, description, date de création et créateur
- `group_chats` - Messages de chat pour les groupes d'étude (nouveau)

#### Politiques de sécurité (RLS)

Le script configure automatiquement les politiques de sécurité Row Level Security (RLS) :
- **Données partagées** : Tous peuvent lire, utilisateurs authentifiés peuvent ajouter, créateurs peuvent supprimer
- **Données personnelles** : Chaque utilisateur ne voit que ses propres données
- **Chat** : Tous peuvent lire les messages, utilisateurs authentifiés peuvent envoyer, chacun peut supprimer ses messages
- **Groupes** : Tous peuvent voir les groupes, seul le créateur peut modifier ou supprimer son groupe
- **Chat de groupe** : Seuls les membres d'un groupe peuvent lire et envoyer des messages dans leur groupe (nouveau)

### Migration depuis localStorage

Si vous avez des données existantes dans localStorage, elles ne seront plus utilisées. Les données sont maintenant stockées dans Supabase :
- Les **cours** sont maintenant partagés entre tous les utilisateurs
- Les **flashcards** sont partagées entre tous les utilisateurs
- Les **événements** (DS, Colles, DM) restent personnels mais sont stockés dans Supabase
- La **progression** sur les cours est personnelle et stockée dans Supabase

## Technologies utilisées

### Backend
- Node.js
- Express.js
- Supabase (base de données)
- CORS
- dotenv

### Frontend
- React
- Supabase Client (authentification et base de données temps réel)
- Lucide React (icônes)
- Tailwind CSS (styling)

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est sous licence MIT.

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
