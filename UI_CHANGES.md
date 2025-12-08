# Notification System - UI Changes

## 1. Header - Notification Bell Icon
```
┌────────────────────────────────────────────────────────────┐
│  TSI Manager    [Planning] [Chat] [Révision] [Cours]      │
│                                                             │
│  Search...   👤 Profile   ❓ Aide   🔔[3]   🚪 Déconnexion │
│                                       ↑                     │
│                              NEW: Bell with badge           │
└────────────────────────────────────────────────────────────┘
```

## 2. Notification Center Dropdown
Appears when clicking the bell icon:
```
┌─────────────────────────────────────┐
│ 🔔 Notifications              ⚙ ✖  │
├─────────────────────────────────────┤
│ 🔴 5 cartes à réviser aujourd'hui   │
│    Il y a 2 min     [Marquer lu]    │
├─────────────────────────────────────┤
│ 🔥 Ton streak de 7 jours est en     │
│    danger !                          │
│    Il y a 1h        [Marquer lu]    │
├─────────────────────────────────────┤
│ 📅 DS de Maths dans 3 jours         │
│    Il y a 3h        [Marquer lu]    │
├─────────────────────────────────────┤
│     ✓ Tout marquer comme lu         │
└─────────────────────────────────────┘
```

## 3. Toast Notifications
Appear in top-right corner:
```
              ┌───────────────────────────────┐
              │ ✓  Badge débloqué:            │
              │    Streak 7 jours !      ✖   │
              └───────────────────────────────┘
                      ↑ Auto-dismiss 5s
              
              ┌───────────────────────────────┐
              │ ℹ  5 cartes à réviser    ✖   │
              └───────────────────────────────┘
```

## 4. Notification Settings Modal
Opened from NotificationCenter gear icon:
```
┌──────────────────────────────────────────────┐
│  🔔 Paramètres de Notifications          ✖  │
├──────────────────────────────────────────────┤
│                                              │
│  🔔 Notifications navigateur                 │
│  ├─ [✓] Activer les notifications            │
│                                              │
│  📅 Rappels quotidiens                       │
│  ├─ [✓] Rappel de révision quotidien         │
│  │   └─ Heure: [19:00]                       │
│  ├─ [✓] Rappel si cartes à réviser           │
│                                              │
│  📊 Alertes                                  │
│  ├─ [✓] Alerte streak en danger              │
│  ├─ [✓] Rappel DS à venir                    │
│  │   └─ Jours avant: [3 jours ▼]            │
│                                              │
│  🎯 Objectifs                                │
│  ├─ Objectif quotidien: [20] cartes          │
│  └─ [✓] Notification quand objectif atteint  │
│                                              │
│  [Annuler]              [Enregistrer]        │
└──────────────────────────────────────────────┘
```

## 5. Browser Notifications
Native OS notifications (when enabled):
```
┌─────────────────────────────────┐
│ 🔔 TSI Manager                  │
├─────────────────────────────────┤
│ DS de Physique dans 3 jours     │
│ Révise les chapitres 1-3        │
└─────────────────────────────────┘
```

## Color Scheme
- **Notification Bell**: Indigo/Purple gradient (matches app theme)
- **Badge (unread count)**: Red background (#EF4444) with white text
- **Toast Types**:
  - Info: Blue border (#3B82F6)
  - Success: Green border (#10B981)
  - Warning: Yellow border (#F59E0B)
  - Error: Red border (#EF4444)
- **Notification Center**: Slate background with border-left color coding

## Responsive Design
- Bell icon: Hidden on mobile (< 640px)
- Toast notifications: Responsive width, stacks vertically
- Settings modal: Full-screen on mobile
- Notification center: Adapts to screen width
