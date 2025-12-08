/**
 * Spaced Repetition System (SRS) - SM-2 Algorithm Implementation
 * 
 * The SM-2 algorithm calculates optimal review intervals based on:
 * - Quality of recall (0-5 scale)
 * - Ease Factor (difficulty multiplier, min 1.3)
 * - Number of consecutive successful repetitions
 * 
 * References:
 * - Original SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

/**
 * Calculate the next review date and updated SRS parameters based on response quality
 * 
 * @param {number} quality - Response quality (0-5): 0-2 = fail, 3-5 = success
 * @param {number} easeFactor - Current ease factor (default 2.5, min 1.3)
 * @param {number} interval - Current interval in days
 * @param {number} repetitions - Number of consecutive successful repetitions
 * @returns {Object} Updated SRS data: { easeFactor, interval, repetitions, nextReviewDate }
 */
export function calculateNextReview(quality, easeFactor = 2.5, interval = 0, repetitions = 0) {
  // Validate inputs
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }
  
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;
  
  // Calculate new ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ensure ease factor doesn't go below 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }
  
  // Round to 2 decimal places
  newEaseFactor = Math.round(newEaseFactor * 100) / 100;
  
  // If quality < 3 (incorrect), reset repetitions and interval
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1; // Review again tomorrow
  } else {
    // Quality >= 3 (correct), increase repetitions and calculate new interval
    newRepetitions = repetitions + 1;
    
    // Apply SM-2 interval rules
    if (newRepetitions === 1) {
      newInterval = 1; // First successful review: 1 day
    } else if (newRepetitions === 2) {
      newInterval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply previous interval by ease factor
      newInterval = Math.round(interval * newEaseFactor);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  // Set to midnight to avoid time comparison issues
  nextReviewDate.setHours(0, 0, 0, 0);
  
  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
  };
}

/**
 * Convert user response difficulty to SM-2 quality scale
 * 
 * @param {string} difficulty - User response: 'again', 'hard', 'good', 'easy'
 * @returns {number} Quality score (0-5)
 */
export function responseToQuality(difficulty) {
  const qualityMap = {
    'again': 1,  // Complete blackout, need to relearn
    'hard': 2,   // Incorrect response, but remembered after seeing answer
    'good': 3,   // Correct response with effort
    'easy': 5    // Perfect response, very easy
  };
  
  const quality = qualityMap[difficulty];
  if (quality === undefined) {
    throw new Error(`Invalid difficulty: ${difficulty}. Must be 'again', 'hard', 'good', or 'easy'`);
  }
  
  return quality;
}

/**
 * Get the status of a flashcard based on its SRS data
 * 
 * @param {Object|null} srsData - SRS data object with next_review_date and interval_days
 * @returns {string} Status: 'new', 'due', 'soon', or 'mastered'
 */
export function getCardStatus(srsData) {
  // If no SRS data exists, card is new
  if (!srsData || !srsData.next_review_date) {
    return 'new';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextReview = new Date(srsData.next_review_date);
  nextReview.setHours(0, 0, 0, 0);
  
  const daysUntilReview = Math.floor((nextReview - today) / (1000 * 60 * 60 * 24));
  
  // Card is due if next review date is today or in the past
  if (daysUntilReview <= 0) {
    return 'due';
  }
  
  // Card is mastered if interval is greater than 21 days
  if (srsData.interval_days > 21) {
    return 'mastered';
  }
  
  // Card is due soon if next review is within 1-3 days
  if (daysUntilReview >= 1 && daysUntilReview <= 3) {
    return 'soon';
  }
  
  // Otherwise, card is in learning phase
  return 'learning';
}

/**
 * Get emoji indicator for card status
 * 
 * @param {string} status - Card status from getCardStatus
 * @returns {string} Emoji representing the status
 */
export function getStatusEmoji(status) {
  const emojiMap = {
    'new': '🔵',      // Blue - new card
    'due': '🔴',      // Red - needs review now
    'soon': '🟡',     // Yellow - review soon
    'mastered': '🟢', // Green - mastered
    'learning': '⚪'  // White - in learning phase
  };
  
  return emojiMap[status] || '⚪';
}

/**
 * Get human-readable label for card status
 * 
 * @param {string} status - Card status from getCardStatus
 * @returns {string} Human-readable status label
 */
export function getStatusLabel(status) {
  const labelMap = {
    'new': 'Nouvelle',
    'due': 'À réviser',
    'soon': 'Bientôt',
    'mastered': 'Maîtrisée',
    'learning': 'En apprentissage'
  };
  
  return labelMap[status] || 'Inconnue';
}

/**
 * Check if a difficulty response is considered correct
 * 
 * @param {string} difficulty - User's response: 'again', 'hard', 'good', 'easy'
 * @returns {boolean} True if the response is considered correct
 */
export function isDifficultyCorrect(difficulty) {
  return difficulty !== 'again' && difficulty !== 'hard';
}
