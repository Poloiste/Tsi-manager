# Guide Visuel - Gestion des Groupes d'Étude

## 🎯 Présentation

Ce guide explique les nouvelles fonctionnalités de gestion des groupes d'étude dans TSI Manager, incluant la création, le partage via codes d'invitation, et la suppression sécurisée des groupes.

---

## 📋 Table des Matières

1. [Types de Groupes](#types-de-groupes)
2. [Créer un Groupe](#créer-un-groupe)
3. [Rejoindre un Groupe](#rejoindre-un-groupe)
4. [Gérer un Groupe (Créateur)](#gérer-un-groupe-créateur)
5. [Supprimer un Groupe](#supprimer-un-groupe)
6. [Badges et Indicateurs](#badges-et-indicateurs)

---

## 🏷️ Types de Groupes

### Groupe Public 🌐
```
┌─────────────────────────────────┐
│ 🌐 PUBLIC                       │
│                                 │
│ Groupe de révision TSI1        │
│ Révisons ensemble les maths !   │
│                                 │
│ 👥 8 / 20 membres               │
│ ████████░░░░░░░░░░ 40%         │
│                                 │
│ [     Rejoindre     ]           │
└─────────────────────────────────┘
```

**Caractéristiques :**
- ✅ Visible dans la liste "Groupes Publics"
- ✅ N'importe qui peut rejoindre
- ✅ Pas besoin de code d'invitation
- ✅ Idéal pour les groupes ouverts à tous

### Groupe Privé 🔒
```
┌─────────────────────────────────┐
│ 🔒 PRIVÉ                        │
│                                 │
│ Groupe TSI Élite                │
│ Groupe privé pour les membres   │
│                                 │
│ 👥 5 / 10 membres               │
│ ██████████░░░░░░░░░ 50%        │
│                                 │
│ [    Voir (membre)    ]         │
└─────────────────────────────────┘
```

**Caractéristiques :**
- 🔒 Non visible dans "Groupes Publics"
- 🔒 Accessible uniquement par code d'invitation
- 🔒 Visible uniquement dans "Mes Groupes" pour les membres
- 🔒 Idéal pour les groupes restreints

---

## ➕ Créer un Groupe

### Étapes de création

1. **Cliquer sur "Créer un groupe"**
   ```
   [➕ Créer un groupe] [🔗 Rejoindre par code]
   ```

2. **Remplir le formulaire**
   ```
   ┌────────────────────────────────────┐
   │ ➕ Créer un groupe                 │
   ├────────────────────────────────────┤
   │                                    │
   │ Nom du groupe *                    │
   │ ┌────────────────────────────────┐ │
   │ │ Groupe de révision TSI1        │ │
   │ └────────────────────────────────┘ │
   │ 25/100 caractères                  │
   │                                    │
   │ Description                        │
   │ ┌────────────────────────────────┐ │
   │ │ Groupe d'entraide pour réviser │ │
   │ │ ensemble les cours de TSI1...  │ │
   │ └────────────────────────────────┘ │
   │ 60/500 caractères                  │
   │                                    │
   │ Visibilité                         │
   │ ┌────────┐ ┌────────┐             │
   │ │🌐PUBLIC│ │🔒PRIVÉ │             │
   │ │✓       │ │        │             │
   │ └────────┘ └────────┘             │
   │                                    │
   │ 👥 Nombre maximum de membres       │
   │ [20 membres ▼]                     │
   │                                    │
   │ [Annuler] [Créer le groupe]        │
   └────────────────────────────────────┘
   ```

3. **Résultat : Groupe créé !**
   - Vous êtes automatiquement membre avec le statut "👑 Créateur"
   - Un code d'invitation est généré automatiquement
   - Le groupe apparaît dans "Mes Groupes"

---

## 🔗 Rejoindre un Groupe

### Méthode 1 : Rejoindre un groupe public

1. Parcourir la section "🌐 Groupes Publics"
2. Cliquer sur "Rejoindre" sur la carte du groupe
3. Vous êtes immédiatement membre !

### Méthode 2 : Rejoindre par code d'invitation

1. **Cliquer sur "Rejoindre par code"**
   ```
   [➕ Créer un groupe] [🔗 Rejoindre par code]
   ```

2. **Entrer le code à 6 caractères**
   ```
   ┌────────────────────────────────────┐
   │ 🔗 Rejoindre un groupe             │
   ├────────────────────────────────────┤
   │                                    │
   │ ℹ️ Entrez le code d'invitation à  │
   │    6 caractères pour rejoindre     │
   │    un groupe privé.                │
   │                                    │
   │ 🔑 Code d'invitation               │
   │ ┌────────────────────────────────┐ │
   │ │      A B C 1 2 3               │ │
   │ └────────────────────────────────┘ │
   │ 6/6 caractères                     │
   │                                    │
   │ 💡 Astuce : Le code vous est       │
   │    fourni par l'administrateur.    │
   │    Il est valide pendant 7 jours.  │
   │                                    │
   │ [Annuler] [Rejoindre]              │
   └────────────────────────────────────┘
   ```

3. **Validation automatique**
   - ✅ Code vérifié
   - ✅ Expiration vérifiée
   - ✅ Capacité du groupe vérifiée
   - ✅ Accès accordé !

---

## 👑 Gérer un Groupe (Créateur)

### Vue d'ensemble du groupe
```
┌──────────────────────────────────────────────────┐
│ Groupe de révision TSI1                      [✕] │
│ Révisons ensemble les maths !                    │
│                                                  │
│ 🔑 Code d'invitation            [🔒 Groupe privé]│
│ ┌──────────────────────────┐                     │
│ │     A B C 1 2 3          │                     │
│ └──────────────────────────┘                     │
│ [📋 Copier] [🔄 Nouveau code]                    │
│                                                  │
│ 💡 Ce code expire le 17 janvier 2025            │
├──────────────────────────────────────────────────┤
│ [💬 Chat] [👥 Membres] [🏆 Classement] [📚 Decks]│
└──────────────────────────────────────────────────┘
```

### Fonctionnalités du créateur

#### 1. **Code d'invitation**
- **Affichage agrandi** : Code visible en grand (taille 2xl)
- **Copier** : Bouton pour copier dans le presse-papiers
  - Feedback visuel "✓ Copié !" pendant 2 secondes
- **Nouveau code** : Générer un nouveau code (ancien code invalide)
  - Renouvelle automatiquement l'expiration (+7 jours)

#### 2. **Gérer les membres**
```
👥 Membres (8/20)

┌─────────────────────────────────────┐
│ 👤  Membre #abc12345                │
│     👑 Créateur                     │
│     Rejoint le 5 janvier 2025       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👤  Membre #def67890                │
│     Membre                          │
│     Rejoint le 6 janvier 2025       │
└─────────────────────────────────────┘
```

#### 3. **Supprimer le groupe** (voir section suivante)

---

## 🗑️ Supprimer un Groupe

### ⚠️ Important : Restriction au créateur
Seul le **créateur** du groupe peut le supprimer. Les autres administrateurs ne peuvent pas supprimer le groupe.

### Processus de suppression

1. **Cliquer sur "Supprimer le groupe"**
   ```
   [🚪 Quitter le groupe] [🗑️ Supprimer le groupe]
   ```

2. **Confirmation détaillée**
   ```
   ┌──────────────────────────────────────┐
   │ ⚠️ Confirmer la suppression          │
   ├──────────────────────────────────────┤
   │                                      │
   │ Êtes-vous sûr de vouloir supprimer   │
   │ définitivement ce groupe ?           │
   │                                      │
   │ ┌──────────────────────────────────┐ │
   │ │ ⚠️ Cette action est irréversible │ │
   │ │    et supprimera :               │ │
   │ │                                  │ │
   │ │ • Tous les membres du groupe     │ │
   │ │ • Tous les messages du chat      │ │
   │ │ • Tous les decks partagés        │ │
   │ │ • Toutes les activités           │ │
   │ └──────────────────────────────────┘ │
   │                                      │
   │ [Annuler] [Supprimer]                │
   └──────────────────────────────────────┘
   ```

3. **Suppression confirmée**
   - ✅ Groupe supprimé
   - ✅ Toutes les données liées supprimées (CASCADE)
   - ✅ Plus aucune trace du groupe

### Données supprimées automatiquement
```
🗑️ Groupe supprimé
    └── 👥 Membres supprimés
    └── 💬 Messages du chat supprimés
    └── 📚 Decks partagés supprimés
    └── 📊 Activités supprimées
```

---

## 🏷️ Badges et Indicateurs

### Badges de Rôle

#### 👑 Créateur
```
┌─────────────────────────────┐
│ 🌐 PUBLIC  [👑 Créateur]    │
│ Mon groupe de révision      │
└─────────────────────────────┘
```
- **Couleur** : Jaune/Or
- **Permissions** :
  - ✅ Supprimer le groupe
  - ✅ Générer de nouveaux codes
  - ✅ Gérer les membres
  - ✅ Toutes les permissions

#### ⭐ Admin
```
┌─────────────────────────────┐
│ 🌐 PUBLIC  [⭐ Admin]       │
│ Groupe d'étude              │
└─────────────────────────────┘
```
- **Couleur** : Bleu
- **Permissions** :
  - ❌ Supprimer le groupe
  - ❌ Générer de nouveaux codes
  - ✅ Gérer les membres
  - ✅ Partager des decks

### Badges de Visibilité

#### 🌐 Public
```
[🌐 PUBLIC]
```
- **Couleur** : Vert
- Visible par tous
- Rejoignable librement

#### 🔒 Privé
```
[🔒 PRIVÉ]
```
- **Couleur** : Violet
- Visible uniquement par les membres
- Code d'invitation requis

### Badges de Capacité

#### Groupe complet
```
[🔴 Complet]
```
- **Couleur** : Rouge
- Nombre maximum de membres atteint
- Impossible de rejoindre

---

## 📱 Sections de l'Interface

### 📌 Mes Groupes
```
📌 Mes Groupes (3)

┌─────────────────┐ ┌─────────────────┐
│ 👑 Créateur     │ │ Membre          │
│ Mon groupe      │ │ Autre groupe    │
│ [Voir]          │ │ [Voir]          │
└─────────────────┘ └─────────────────┘
```

**Affiche :**
- Tous les groupes dont vous êtes membre
- Vos groupes créés (avec badge "👑 Créateur")
- Groupes rejoints (publics ou privés)

### 🌐 Groupes Publics
```
🌐 Groupes Publics (5)

┌─────────────────┐ ┌─────────────────┐
│ 🌐 PUBLIC       │ │ 🌐 PUBLIC       │
│ Groupe ouvert   │ │ Révision Maths  │
│ [Rejoindre]     │ │ [Rejoindre]     │
└─────────────────┘ └─────────────────┘
```

**Affiche :**
- Uniquement les groupes publics
- Uniquement les groupes non rejoints
- Groupes privés **non affichés**

---

## 🔐 Sécurité et Confidentialité

### Protections en Place

#### 1. Accès aux Groupes Privés
- ❌ Non listés dans "Groupes Publics"
- ❌ Non accessibles sans être membre
- ❌ Chat non accessible aux non-membres
- ✅ Accès uniquement via code d'invitation

#### 2. Suppression de Groupe
- ❌ Seul le créateur peut supprimer
- ❌ Confirmation obligatoire
- ✅ Suppression en cascade de toutes les données
- ✅ Pas de données orphelines

#### 3. Codes d'Invitation
- ✅ Générés aléatoirement (34^6 possibilités)
- ✅ Expiration automatique après 7 jours
- ✅ Renouvelables par le créateur
- ✅ Vérification de capacité du groupe

---

## 💡 Conseils d'Utilisation

### Pour les Créateurs
1. **Choisir la visibilité appropriée**
   - Public : Pour les groupes ouverts à tous
   - Privé : Pour les groupes restreints

2. **Partager le code d'invitation**
   - Utiliser le bouton "Copier"
   - Partager via message, email, etc.
   - Renouveler le code si compromis

3. **Gérer la capacité**
   - Définir une limite adaptée (5, 10, 20, 50)
   - Ajuster selon les besoins

4. **Suppression responsable**
   - Prévenir les membres avant suppression
   - Comprendre que c'est irréversible

### Pour les Membres
1. **Rejoindre des groupes**
   - Groupes publics : Cliquer sur "Rejoindre"
   - Groupes privés : Demander un code au créateur

2. **Participer activement**
   - Utiliser le chat de groupe
   - Partager des ressources
   - Contribuer au classement

3. **Quitter si nécessaire**
   - Bouton "Quitter le groupe" disponible
   - Attention : Si vous êtes le seul admin, nommez un remplaçant

---

## ❓ FAQ

### Puis-je récupérer un groupe supprimé ?
❌ Non, la suppression est définitive et irréversible.

### Combien de temps un code d'invitation est-il valide ?
⏰ 7 jours par défaut. Le créateur peut générer un nouveau code à tout moment.

### Puis-je être admin de plusieurs groupes ?
✅ Oui, vous pouvez être membre/admin de plusieurs groupes simultanément.

### Qui peut supprimer un groupe ?
👑 Uniquement le créateur du groupe (pas les autres admins).

### Les groupes privés sont-ils vraiment privés ?
🔒 Oui ! Ils ne sont visibles que par les membres et ne peuvent être rejoints que via code d'invitation.

### Que se passe-t-il si le groupe est plein ?
🔴 Les nouveaux membres ne peuvent plus rejoindre. Le créateur peut augmenter la limite si nécessaire.

---

## 📞 Support

Pour toute question ou problème, consultez la documentation complète ou ouvrez une issue sur GitHub.

**Documentation technique :**
- `GROUP_MANAGEMENT_IMPROVEMENTS.md` - Guide détaillé
- `GROUP_SECURITY_SUMMARY.md` - Analyse de sécurité

---

*Guide créé pour TSI Manager - Gestion des Groupes d'Étude*
