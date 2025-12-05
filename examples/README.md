# Exemples de Fichiers pour Import/Export

Ce dossier contient des exemples de fichiers pour tester les fonctionnalités d'import/export de flashcards de TSI-Manager.

## Fichiers Disponibles

### 1. `flashcards_example.csv`
**Format:** CSV (Comma-Separated Values)  
**Utilisation:** Import/Export standard de flashcards  
**Encodage:** UTF-8

**Structure:**
```csv
question,answer,subject,chapter
"Question","Réponse","Matière","Chapitre"
```

**Comment l'utiliser:**
1. Allez dans l'onglet "Révision" (🎴)
2. Cliquez sur "🔄 Import / Export"
3. Dans la section "📥 Importer", cliquez sur "CSV"
4. Sélectionnez un cours de destination
5. Uploadez le fichier `flashcards_example.csv`

### 2. `flashcards_anki_example.txt`
**Format:** TSV (Tab-Separated Values) - Format Anki  
**Utilisation:** Import depuis Anki  
**Encodage:** UTF-8

**Structure:**
```
Question[TAB]Réponse[TAB]Tags
```

**Comment l'utiliser:**
1. Allez dans l'onglet "Révision" (🎴)
2. Cliquez sur "🔄 Import / Export"
3. Dans la section "📥 Importer", cliquez sur "Anki"
4. Sélectionnez un cours de destination
5. Uploadez le fichier `flashcards_anki_example.txt`

### 3. `flashcards_noji_example.json`
**Format:** JSON - Format Noji IA  
**Utilisation:** Import depuis Noji IA  
**Encodage:** UTF-8

**Structure:**
```json
{
  "cards": [
    {
      "front": "Question",
      "back": "Réponse",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

**Comment l'utiliser:**
1. Allez dans l'onglet "Révision" (🎴)
2. Cliquez sur "🔄 Import / Export"
3. Dans la section "📥 Importer", cliquez sur "Noji IA"
4. Sélectionnez un cours de destination
5. Uploadez le fichier `flashcards_noji_example.json`

## Créer Vos Propres Fichiers

### CSV
Utilisez n'importe quel éditeur de texte ou Excel:
- Séparateurs supportés: `,` (virgule), `;` (point-virgule), `\t` (tabulation)
- Guillemets pour les valeurs contenant des virgules ou des retours à la ligne
- En-tête optionnel (sera détecté automatiquement)

### Anki (TXT)
Utilisez un éditeur de texte:
- Les colonnes sont séparées par des tabulations
- Format: Question[TAB]Réponse[TAB]Tags (optionnel)
- Pas d'en-tête

### Noji IA (JSON)
Utilisez un éditeur de texte ou JSON:
- Structure JSON valide requise
- Tableau "cards" obligatoire
- Chaque carte avec "front" et "back"
- Tags optionnels

## Export

Pour exporter vos flashcards:
1. Allez dans l'onglet "Révision" (🎴)
2. Cliquez sur "🔄 Import / Export"
3. Sélectionnez les cours à exporter (cochez les cases)
4. Cliquez sur le format souhaité dans la section "📤 Exporter"
5. Le fichier sera téléchargé automatiquement

## Notes

- **Accents:** Tous les formats supportent les caractères accentués français
- **Encodage:** UTF-8 avec BOM pour une meilleure compatibilité Excel
- **Validation:** L'application valide les fichiers avant l'import
- **Erreurs:** Les lignes invalides sont ignorées et comptées
