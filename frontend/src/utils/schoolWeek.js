/**
 * Calculate current school week number (S1 starts early September)
 * 
 * The academic year runs from September 2 to June, with 33 weeks total.
 * This function determines which academic year we're currently in based on the month,
 * then calculates the week number from the start of that academic year.
 * 
 * @returns {number} Current school week number (1-33)
 */
export const getCurrentSchoolWeek = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11 (0 = January, 8 = September)
  
  // Determine the start of the school year
  // If we're between January (0) and August (7), the school year started last September
  // If we're between September (8) and December (11), the school year started this September
  let schoolYearStart;
  if (currentMonth >= 8) { // September to December
    schoolYearStart = new Date(currentYear, 8, 2); // September 2 of this year
  } else { // January to August
    schoolYearStart = new Date(currentYear - 1, 8, 2); // September 2 of last year
  }
  
  // Calculate the number of weeks since the start of the school year
  const diffTime = today - schoolYearStart;
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  const diffWeeks = Math.floor(diffDays / 7);
  
  // Week 1 starts on September 2
  // Limit between 1 and 33
  return Math.max(1, Math.min(33, diffWeeks + 1));
};
