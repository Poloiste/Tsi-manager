# Network and API Error Handling Guide

Ce guide documente les améliorations apportées à la gestion des erreurs réseau et API dans l'application TSI Manager.

## Vue d'ensemble

Les améliorations suivantes ont été implémentées pour résoudre les problèmes majeurs identifiés dans les journaux de l'application :

1. **Gestion de la déconnexion Internet** (`ERR_INTERNET_DISCONNECTED`)
2. **Mécanisme de nouvelle tentative pour les erreurs DNS** (`ERR_NAME_NOT_RESOLVED`)
3. **Amélioration de la gestion des erreurs `TypeError: Failed to fetch`**
4. **Validation du type de contenu des réponses** (prévention des réponses HTML au lieu de JSON)
5. **Correction des erreurs de méthode HTTP** (405 Method Not Allowed)
6. **Amélioration du mécanisme de rafraîchissement des jetons d'authentification**

## 1. Gestion de la déconnexion Internet

### Implémentation

Le fichier `frontend/src/utils/apiHelpers.js` contient maintenant une fonction `isOnline()` qui vérifie la connexion Internet avant chaque requête API.

```javascript
// Vérifie si l'utilisateur est en ligne
export function isOnline() {
  return navigator.onLine;
}
```

### Utilisation

La fonction `fetchWithLogging` vérifie automatiquement la connexion avant d'effectuer une requête :

```javascript
if (!isOnline()) {
  const error = new Error('No internet connection. Please check your network and try again.');
  error.code = NETWORK_ERRORS.INTERNET_DISCONNECTED;
  throw error;
}
```

### Comportement

- Si l'utilisateur est hors ligne, une erreur explicite est levée immédiatement
- L'utilisateur reçoit un message clair lui demandant de vérifier sa connexion
- Aucune requête réseau inutile n'est effectuée

## 2. Mécanisme de nouvelle tentative (Retry)

### Configuration

Les paramètres de nouvelle tentative sont configurables dans `apiHelpers.js` :

```javascript
const RETRY_CONFIG = {
  maxRetries: 3,              // Nombre maximum de tentatives
  initialDelay: 1000,         // Délai initial (1 seconde)
  maxDelay: 10000,            // Délai maximum (10 secondes)
  backoffMultiplier: 2        // Multiplicateur pour le backoff exponentiel
};
```

### Implémentation

La fonction `fetchWithRetry` implémente un mécanisme de nouvelle tentative avec backoff exponentiel et jitter :

```javascript
export async function fetchWithRetry(url, options = {}, context = 'API call', maxRetries = RETRY_CONFIG.maxRetries) {
  // Tente jusqu'à maxRetries fois
  // Utilise un délai exponentiel entre les tentatives
  // Ajoute du jitter pour éviter le "thundering herd"
}
```

### Erreurs concernées

Le mécanisme de nouvelle tentative est activé pour :

- `ERR_INTERNET_DISCONNECTED` - Déconnexion Internet
- `ERR_NAME_NOT_RESOLVED` - Échec de résolution DNS
- `ERR_CONNECTION_REFUSED` - Connexion refusée
- `ERR_NETWORK_CHANGED` - Changement de réseau
- `TypeError: Failed to fetch` - Échec général de fetch

### Utilisation

Par défaut, `fetchJson` utilise le mécanisme de nouvelle tentative :

```javascript
// Avec retry (par défaut)
const data = await fetchJson('/api/endpoint');

// Sans retry (si nécessaire)
const data = await fetchJson('/api/endpoint', {}, 'context', false);
```

## 3. Gestion améliorée de `TypeError: Failed to fetch`

### Problème

L'erreur `TypeError: Failed to fetch` est générique et ne donne pas d'informations sur la cause réelle.

### Solution

Le message d'erreur a été enrichi pour fournir plus de contexte :

```javascript
if (error.message === 'Failed to fetch') {
  error.message = 'Network request failed. This could be due to:\n' +
    '- Lost internet connection\n' +
    '- DNS resolution failure\n' +
    '- CORS or network configuration issues\n' +
    'Please check your connection and try again.';
  error.code = NETWORK_ERRORS.FAILED_TO_FETCH;
}
```

## 4. Validation du type de contenu (Content-Type)

### Côté Frontend

La fonction `safeJsonParse` valide maintenant le type de contenu avant de parser la réponse :

```javascript
export async function safeJsonParse(response) {
  const contentType = response.headers.get('content-type');
  
  // Vérifie si la réponse est bien du JSON
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  // Détecte les réponses HTML inattendues
  const text = await response.text();
  if (text.trim().toLowerCase().startsWith('<!doctype') || ...) {
    throw new Error(
      `Server returned HTML instead of JSON (status: ${response.status}). ` +
      'The API endpoint may not exist or returned an error page. ' +
      'Please verify the endpoint URL is correct.'
    );
  }
}
```

### Côté Backend

Un middleware a été ajouté dans `backend/server.js` pour garantir que toutes les réponses API ont le bon Content-Type :

```javascript
app.use('/api', (req, res, next) => {
  // Override res.json pour toujours définir Content-Type
  res.json = function(data) {
    res.set('Content-Type', 'application/json');
    return originalJson.call(this, data);
  };
  next();
});
```

## 5. Gestion des erreurs 405 Method Not Allowed

### Implémentation

La fonction `handleApiError` détecte spécifiquement les erreurs 405 :

```javascript
if (response.status === 405) {
  const error = new Error(
    `HTTP method not allowed for this endpoint (405). ` +
    `The server does not support the ${url} endpoint with the specified method. ` +
    `Allowed methods: ${response.headers.get('Allow') || 'unknown'}`
  );
  throw error;
}
```

### Messages d'erreur

Les messages d'erreur 405 incluent maintenant :
- L'URL de l'endpoint concerné
- Les méthodes HTTP autorisées (si disponibles dans l'en-tête `Allow`)
- Des suggestions pour résoudre le problème

## 6. Amélioration du rafraîchissement des jetons

### Configuration

Dans `frontend/src/AuthContext.js` :

```javascript
const TOKEN_REFRESH_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000  // 2 secondes entre chaque tentative
};
```

### Implémentation

La fonction `refreshSession` tente automatiquement de rafraîchir le jeton en cas d'erreur réseau :

```javascript
const refreshSession = async (retryCount = 0) => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;
    
    if (data.session) {
      setUser(data.session.user);
      setAuthError(null);
      return data.session;
    }
  } catch (error) {
    // Retry sur les erreurs réseau
    if (retryCount < TOKEN_REFRESH_CONFIG.maxRetries) {
      const isNetworkError = 
        error.message?.includes('network') ||
        error.message?.includes('fetch') ||
        error.message?.includes('connection');
      
      if (isNetworkError) {
        await new Promise(resolve => setTimeout(resolve, TOKEN_REFRESH_CONFIG.retryDelay));
        return refreshSession(retryCount + 1);
      }
    }
    
    // Si toutes les tentatives échouent
    setAuthError('Failed to refresh authentication. Please sign in again.');
    setUser(null);
    throw error;
  }
};
```

### Gestion des événements d'authentification

Le contexte d'authentification écoute maintenant les événements de changement d'état :

```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Auth] Token refreshed successfully');
    setUser(session?.user || null);
    setAuthError(null);
  }
  // ... autres événements
});
```

## Tests

### Tests unitaires

Des tests unitaires ont été ajoutés pour valider toutes les nouvelles fonctionnalités :

- `frontend/src/utils/apiHelpers.test.js` - Tests pour les utilitaires API
- `frontend/src/AuthContext.test.js` - Tests pour le contexte d'authentification

### Exécution des tests

```bash
cd frontend
npm test
```

### Couverture

Les tests couvrent :
- ✅ Détection de la connexion Internet
- ✅ Identification des erreurs réseau
- ✅ Parsing sécurisé du JSON
- ✅ Gestion des erreurs 405
- ✅ Amélioration des messages d'erreur "Failed to fetch"
- ✅ Mécanisme de rafraîchissement des jetons avec retry
- ✅ Gestion des événements d'authentification

## Recommandations d'utilisation

### Pour les développeurs

1. **Utiliser `fetchJson` par défaut** : Cette fonction inclut toutes les améliorations de gestion d'erreurs
2. **Gérer les erreurs de manière appropriée** : Afficher des messages clairs à l'utilisateur
3. **Logger les erreurs** : Utiliser `logApiError` pour faciliter le débogage
4. **Tester la connectivité** : Tester l'application en mode hors ligne

### Exemple d'utilisation

```javascript
import { fetchJson } from './utils/apiHelpers';

async function loadData() {
  try {
    const data = await fetchJson('/api/data', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }, 'Loading data');
    
    // Traiter les données
    return data;
  } catch (error) {
    // L'erreur contient déjà un message clair pour l'utilisateur
    console.error('Failed to load data:', error.message);
    
    // Afficher un message à l'utilisateur
    showErrorNotification(error.message);
  }
}
```

## Dépannage

### L'application ne détecte pas les erreurs réseau

- Vérifier que `navigator.onLine` est supporté par le navigateur
- Certains navigateurs peuvent ne pas détecter instantanément les changements de connexion

### Les tentatives de retry ne fonctionnent pas

- Vérifier les logs de la console pour voir les tentatives
- S'assurer que l'erreur est bien identifiée comme une erreur réseau
- Augmenter le `maxRetries` si nécessaire dans la configuration

### Le rafraîchissement des jetons échoue

- Vérifier la configuration Supabase
- S'assurer que les tokens ne sont pas expirés depuis trop longtemps
- Vérifier les logs pour voir les tentatives de retry

## Conclusion

Ces améliorations rendent l'application plus résiliente face aux problèmes réseau et fournissent une meilleure expérience utilisateur avec des messages d'erreur clairs et des mécanismes de récupération automatiques.

Pour toute question ou problème, consulter les logs de la console ou ouvrir une issue sur le repository GitHub.
