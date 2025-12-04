# TSI Manager

Application de gestion pour étudiants TSI (Technologie et Sciences Industrielles).

## Description

TSI Manager est une application web full-stack conçue pour aider les étudiants TSI à gérer leurs études, leurs devoirs et leurs ressources pédagogiques. L'application utilise React pour le frontend, Node.js/Express pour le backend, et Supabase comme base de données.

**✨ Nouveautés :**
- 📚 **Cours partagés** : Tous les utilisateurs peuvent ajouter et consulter les cours
- 🎴 **Flashcards partagées** : Créez et révisez des flashcards accessibles à tous
- 🎯 **Planning adaptatif** : Le planning du soir s'adapte automatiquement selon les DS/Colles/DM à venir
- 🔗 **Liens OneDrive** : Attachez des documents OneDrive à chaque cours

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
├── database/               # Schémas SQL
│   └── schema.sql         # Script de création des tables
├── .gitignore
└── README.md
```

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Poloiste/Tsi-manager.git
cd Tsi-manager
```

### 2. Configuration de Supabase

#### 2.1. Créer les tables dans Supabase

1. Connectez-vous à [supabase.com](https://supabase.com/)
2. Sélectionnez votre projet (ou créez-en un nouveau)
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `database/schema.sql` de ce projet
5. Copiez tout le contenu et collez-le dans l'éditeur SQL
6. Cliquez sur **Run** pour exécuter le script
7. Vérifiez que les tables sont créées dans **Table Editor** :
   - `shared_courses`
   - `shared_course_links`
   - `shared_flashcards`

#### 2.2. Obtenir les clés d'API

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Notez :
   - **Project URL** : `https://your-project.supabase.co`
   - **anon public key** : pour le frontend
   - **service_role key** : pour le backend (⚠️ gardez-la secrète !)

### 3. Configuration du Backend

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
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Server Configuration
PORT=3000
```

### 4. Configuration du Frontend

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

### 📚 Gestion des cours
- **Cours partagés** : Tous les utilisateurs authentifiés peuvent ajouter des cours visibles par tous
- Organisez les cours par matière et chapitre
- Attachez des liens OneDrive pour chaque cours
- Système de révision espacée avec suivi de maîtrise

### 🎴 Flashcards de révision
- **Flashcards partagées** : Créez des flashcards accessibles à tous les utilisateurs
- Liées aux cours pour une révision organisée
- Système de révision active avec feedback immédiat
- Statistiques de progression (correctes/incorrectes)

### 📅 Planning intelligent
- Emploi du temps hebdomadaire complet
- Ajout d'événements personnalisés (DS, DM, Colles)
- **Planning du soir adaptatif** : S'adapte automatiquement selon les évaluations à venir
  - Code couleur selon l'urgence (rouge pour J-1, orange pour J-3, jaune pour J-7)
  - Priorise automatiquement les révisions
- Calendrier sur 33 semaines TSI

### 🎯 Suggestions intelligentes
- Recommandations de révision basées sur :
  - La dernière date de révision
  - Le niveau de maîtrise
  - Les évaluations à venir
- Algorithme de révision espacée
- Priorisation automatique des chapitres urgents

### 👤 Authentification
- Système d'authentification sécurisé avec Supabase
- Chaque utilisateur peut contribuer aux données partagées
- Les événements personnels restent privés

## Technologies utilisées

### Backend
- Node.js
- Express.js
- Supabase (base de données)
- CORS
- dotenv

### Frontend
- React
- Supabase Client (@supabase/supabase-js)
- Lucide React (icônes)
- Tailwind CSS (styling)

## 📊 Données partagées

**Important** : Les cours et flashcards sont **partagés entre tous les utilisateurs** de l'application.

### Ce qui est partagé :
- ✅ **Cours** : Tous les cours ajoutés sont visibles par tous
- ✅ **Liens OneDrive** : Les documents attachés aux cours sont partagés
- ✅ **Flashcards** : Toutes les flashcards créées sont accessibles à tous

### Ce qui reste privé :
- 🔒 **Événements personnalisés** : Vos DS, DM et Colles restent privés
- 🔒 **Statistiques de révision** : Votre progression personnelle (mastery, review count)

### Avantages :
- 🤝 **Collaboration** : Profitez des cours ajoutés par d'autres étudiants
- 📚 **Base de connaissances commune** : Créez ensemble une bibliothèque complète
- 🎴 **Flashcards enrichies** : Bénéficiez des flashcards créées par la communauté
- ⏱️ **Gain de temps** : Pas besoin de tout créer soi-même

### Permissions :
- **Lecture** : Tout le monde peut consulter les cours et flashcards (même non authentifié)
- **Création** : Les utilisateurs authentifiés peuvent ajouter du contenu
- **Suppression** : Vous ne pouvez supprimer que vos propres contributions

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est sous licence MIT.

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
