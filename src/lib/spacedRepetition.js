// SM-2 Spaced Repetition Algorithm (Anki-style)
// Based on the original SuperMemo 2 algorithm

/**
 * Calculate the next review interval and ease factor for a flashcard
 * @param {number} quality - User's rating (0-5): 0=again, 1=hard, 2=good, 3=easy
 * @param {number} interval - Current interval in days
 * @param {number} repetitions - Number of successful reviews
 * @param {number} easeFactor - Current ease factor (default 2.5)
 * @returns {object} - { interval, repetitions, easeFactor, nextReviewDate }
 */
export function calculateNextReview(quality, interval = 0, repetitions = 0, easeFactor = 2.5) {
  // If user rated "again" (0), reset the card
  if (quality < 2) {
    return {
      interval: 1,
      repetitions: 0,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    }
  }

  // Update ease factor based on quality
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = Math.max(1.3, easeFactor)

  // Calculate new interval based on repetitions
  if (repetitions === 0) {
    interval = 1
  } else if (repetitions === 1) {
    interval = 6
  } else {
    interval = Math.round(interval * easeFactor)
  }

  // Cap interval at 365 days (1 year max)
  interval = Math.min(interval, 365)

  const nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000)

  return {
    interval,
    repetitions: repetitions + 1,
    easeFactor,
    nextReviewDate
  }
}

/**
 * Get cards due for review today
 * @param {array} cards - Array of flashcard objects
 * @returns {array} - Cards that are due for review
 */
export function getDueCards(cards) {
  const now = new Date()
  return cards.filter(card => {
    if (!card.nextReviewDate) return true // New cards are due immediately
    return new Date(card.nextReviewDate) <= now
  })
}

/**
 * Get cards due within the next N days
 * @param {array} cards - Array of flashcard objects
 * @param {number} days - Number of days to look ahead
 * @returns {array} - Cards due within the specified timeframe
 */
export function getCardsDueIn(cards, days) {
  const now = new Date()
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return cards.filter(card => {
    if (!card.nextReviewDate) return true
    const reviewDate = new Date(card.nextReviewDate)
    return reviewDate >= now && reviewDate <= future
  })
}

/**
 * Update a card's review data based on user rating
 * @param {object} card - The flashcard object
 * @param {number} quality - User's rating (0-5)
 * @returns {object} - Updated card object
 */
export function updateCardReview(card, quality) {
  const { interval, repetitions, easeFactor, nextReviewDate } = calculateNextReview(
    quality,
    card.interval || 0,
    card.repetitions || 0,
    card.easeFactor || 2.5
  )

  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
    totalReviews: (card.totalReviews || 0) + 1
  }
}

/**
 * Get statistics about flashcard progress
 * @param {array} cards - Array of flashcard objects
 * @returns {object} - Statistics object
 */
export function getFlashcardStats(cards) {
  const total = cards.length
  const due = getDueCards(cards).length
  const learned = cards.filter(c => c.repetitions > 0).length
  const newCards = cards.filter(c => !c.repetitions).length
  
  // Calculate average ease factor
  const cardsWithEase = cards.filter(c => c.easeFactor)
  const avgEaseFactor = cardsWithEase.length > 0
    ? cardsWithEase.reduce((sum, c) => sum + c.easeFactor, 0) / cardsWithEase.length
    : 2.5

  // Calculate retention rate (cards with ease factor > 2.0)
  const retained = cards.filter(c => c.easeFactor > 2.0).length
  const retentionRate = total > 0 ? (retained / total) * 100 : 0

  return {
    total,
    due,
    learned,
    newCards,
    avgEaseFactor,
    retentionRate
  }
}

/**
 * Sort cards by priority (due cards first, then by ease factor)
 * @param {array} cards - Array of flashcard objects
 * @returns {array} - Sorted cards
 */
export function sortCardsByPriority(cards) {
  const now = new Date()
  
  return [...cards].sort((a, b) => {
    const aDue = a.nextReviewDate ? new Date(a.nextReviewDate) <= now : true
    const bDue = b.nextReviewDate ? new Date(b.nextReviewDate) <= now : true
    
    // Due cards come first
    if (aDue && !bDue) return -1
    if (!aDue && bDue) return 1
    
    // Among due cards, sort by next review date
    if (aDue && bDue) {
      const aDate = a.nextReviewDate ? new Date(a.nextReviewDate) : now
      const bDate = b.nextReviewDate ? new Date(b.nextReviewDate) : now
      return aDate - bDate
    }
    
    // Among non-due cards, sort by ease factor (lower ease = harder)
    const aEase = a.easeFactor || 2.5
    const bEase = b.easeFactor || 2.5
    return aEase - bEase
  })
}
