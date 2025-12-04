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

- **Gestion du planning TSI** : Emploi du temps hebdomadaire avec planning du soir
- **Bibliothèque de cours** : Organisez vos cours par matière avec liens OneDrive
- **Système de révision** : Flashcards interactives avec génération automatique par IA
- **Suggestions intelligentes** : Recommandations de révision basées sur vos DS et votre progression
- **💬 Discussions** : Chat en temps réel pour l'entraide entre étudiants TSI
  - Salons par matière (Maths, Physique, Méca, Elec, Anglais, Français, Informatique)
  - Salon général pour discussions diverses
  - Messages en temps réel avec Supabase Realtime
  - Suppression de vos propres messages
- **Statistiques** : Vue d'ensemble de votre progression
- **Interface utilisateur moderne** : Dark theme avec design responsive

## Configuration de la base de données

### Tables Supabase

Pour activer la fonctionnalité de chat, vous devez exécuter le script SQL dans `database/schema.sql` sur votre instance Supabase :

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `database/schema.sql`
4. Vérifiez que les tables `chat_channels` et `chat_messages` sont créées

Ce script crée :
- Les tables nécessaires pour le chat
- Les politiques de sécurité (RLS)
- Les salons par défaut (Général, Maths, Physique, etc.)

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
