/**
 * Test suite for Unicode character handling in flashcards
 * Validates that special characters and mathematical symbols are properly handled
 */

describe('Unicode Character Handling', () => {
  describe('CSV escaping and normalization', () => {
    const escapeCSV = (str) => {
      if (!str) return '""';
      // Convert to string, normalize Unicode (NFC), escape quotes, and wrap in quotes
      const normalized = String(str).normalize('NFC').replace(/"/g, '""');
      return '"' + normalized + '"';
    };

    const removeBOM = (text) => text.charCodeAt(0) === 0xFEFF ? text.substring(1) : text;

    test('should normalize and escape mathematical symbols', () => {
      const symbols = ['√', '∑', '∫', '∂', '∆', '∇', '∞'];
      symbols.forEach(symbol => {
        const escaped = escapeCSV(symbol);
        expect(escaped).toBe(`"${symbol}"`);
        expect(escaped).not.toContain('\uFEFF'); // No BOM
      });
    });

    test('should normalize and escape special characters', () => {
      const specialChars = ['€', '≈', '×', '÷', '±', '≠', '≤', '≥'];
      specialChars.forEach(char => {
        const escaped = escapeCSV(char);
        expect(escaped).toBe(`"${char}"`);
      });
    });

    test('should handle Greek letters', () => {
      const greekLetters = ['α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'π', 'σ', 'ω', 'Ω'];
      greekLetters.forEach(letter => {
        const escaped = escapeCSV(letter);
        expect(escaped).toBe(`"${letter}"`);
      });
    });

    test('should handle mixed content with symbols and text', () => {
      const mixedContent = 'La vitesse est v = √(2gh) où g ≈ 9.81 m/s²';
      const escaped = escapeCSV(mixedContent);
      expect(escaped).toBe(`"${mixedContent}"`);
      expect(escaped).toContain('√');
      expect(escaped).toContain('≈');
      expect(escaped).toContain('²');
    });

    test('should handle quotes in content', () => {
      const withQuotes = 'La formule est "E = mc²"';
      const escaped = escapeCSV(withQuotes);
      expect(escaped).toBe('"La formule est ""E = mc²"""');
    });

    test('should handle accented characters', () => {
      const accented = ['é', 'è', 'ê', 'à', 'ù', 'ô', 'ç', 'î', 'ï', 'ü'];
      accented.forEach(char => {
        const escaped = escapeCSV(char);
        expect(escaped).toBe(`"${char}"`);
      });
    });

    test('should normalize composed vs decomposed Unicode', () => {
      // é can be represented as single character or e + combining accent
      const composed = 'é'; // NFC form (single character)
      const decomposed = 'é'; // NFD form (e + combining accent)
      
      const escapedComposed = escapeCSV(composed);
      const escapedDecomposed = escapeCSV(decomposed);
      
      // Both should normalize to the same NFC form
      expect(escapedComposed).toBe(escapedDecomposed);
    });

    test('should remove BOM if present', () => {
      const textWithBOM = '\uFEFFHello World';
      const cleaned = removeBOM(textWithBOM);
      expect(cleaned).toBe('Hello World');
      expect(cleaned).not.toContain('\uFEFF');
    });

    test('should not modify text without BOM', () => {
      const textWithoutBOM = 'Hello World';
      const result = removeBOM(textWithoutBOM);
      expect(result).toBe('Hello World');
    });

    test('should handle superscripts and subscripts', () => {
      const superSub = ['²', '³', '⁴', '₁', '₂', '₃'];
      superSub.forEach(char => {
        const escaped = escapeCSV(char);
        expect(escaped).toBe(`"${char}"`);
      });
    });

    test('should handle arrows and logical symbols', () => {
      const symbols = ['→', '←', '↔', '⇒', '⇐', '⇔', '∧', '∨', '¬'];
      symbols.forEach(symbol => {
        const escaped = escapeCSV(symbol);
        expect(escaped).toBe(`"${symbol}"`);
      });
    });

    test('should handle empty string', () => {
      const escaped = escapeCSV('');
      expect(escaped).toBe('""');
    });

    test('should handle null and undefined', () => {
      expect(escapeCSV(null)).toBe('""');
      expect(escapeCSV(undefined)).toBe('""');
    });
  });

  describe('String normalization', () => {
    test('should consistently normalize Unicode strings', () => {
      const testStrings = [
        'Résumé',
        'café',
        'naïve',
        'Ω ∑ ∫ ∂',
        'E = mc²'
      ];

      testStrings.forEach(str => {
        const normalized = str.normalize('NFC');
        expect(normalized).toBe(str.normalize('NFC'));
        // Normalizing again should give same result
        expect(normalized.normalize('NFC')).toBe(normalized);
      });
    });
  });
});
