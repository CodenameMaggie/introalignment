// Nine Star Ki Calculation Engine
// Based on Japanese/Chinese astrology system

export type NineStarElement = 'Water' | 'Earth' | 'Wood' | 'Tree' | 'Fire' | 'Metal' | 'Soil';

export interface NineStarKiChart {
  yearNumber: number; // 1-9
  monthNumber: number; // 1-9
  energyNumber: number; // 1-9 (adult energy)
  element: NineStarElement;
  characteristics: string[];
}

// Element associations for each number
const NINE_STAR_ELEMENTS: NineStarElement[] = [
  'Water',  // 1
  'Earth',  // 2
  'Wood',   // 3
  'Tree',   // 4
  'Earth',  // 5
  'Metal',  // 6
  'Metal',  // 7
  'Earth',  // 8
  'Fire'    // 9
];

// Characteristics for each number
const NINE_STAR_CHARACTERISTICS: Record<number, string[]> = {
  1: ['Introspective', 'Intuitive', 'Adaptable', 'Deep thinker', 'Spiritual'],
  2: ['Nurturing', 'Supportive', 'Patient', 'Detail-oriented', 'Grounded'],
  3: ['Ambitious', 'Pioneering', 'Energetic', 'Quick to act', 'Optimistic'],
  4: ['Creative', 'Communicative', 'Flexible', 'Diplomatic', 'Harmonious'],
  5: ['Powerful', 'Centered', 'Transformative', 'Magnetic', 'Influential'],
  6: ['Dignified', 'Responsible', 'Organized', 'Leadership', 'Principled'],
  7: ['Joyful', 'Expressive', 'Social', 'Persuasive', 'Charming'],
  8: ['Determined', 'Motivated', 'Competitive', 'Goal-oriented', 'Intense'],
  9: ['Passionate', 'Insightful', 'Visionary', 'Charismatic', 'Intellectual']
};

// Compatibility matrix (simplified - full version has more nuance)
const COMPATIBILITY_MATRIX: Record<number, Record<number, number>> = {
  1: { 1: 70, 2: 60, 3: 80, 4: 85, 5: 50, 6: 75, 7: 65, 8: 55, 9: 45 },
  2: { 1: 60, 2: 75, 3: 50, 4: 65, 5: 70, 6: 80, 7: 85, 8: 75, 9: 90 },
  3: { 1: 80, 2: 50, 3: 65, 4: 90, 5: 60, 6: 45, 7: 70, 8: 85, 9: 95 },
  4: { 1: 85, 2: 65, 3: 90, 4: 75, 5: 55, 6: 60, 7: 80, 8: 70, 9: 85 },
  5: { 1: 50, 2: 70, 3: 60, 4: 55, 5: 50, 6: 65, 7: 60, 8: 85, 9: 75 },
  6: { 1: 75, 2: 80, 3: 45, 4: 60, 5: 65, 6: 70, 7: 85, 8: 60, 9: 55 },
  7: { 1: 65, 2: 85, 3: 70, 4: 80, 5: 60, 6: 85, 7: 75, 8: 65, 9: 80 },
  8: { 1: 55, 2: 75, 3: 85, 4: 70, 5: 85, 6: 60, 7: 65, 8: 70, 9: 60 },
  9: { 1: 45, 2: 90, 3: 95, 4: 85, 5: 75, 6: 55, 7: 80, 8: 60, 9: 70 }
};

/**
 * Calculate the year number for Nine Star Ki
 * The year changes on February 4th (approximately - solar calendar)
 */
export function calculateYearNumber(birthDate: Date): number {
  let year = birthDate.getFullYear();
  const month = birthDate.getMonth(); // 0-11
  const day = birthDate.getDate();

  // If born before February 4, use previous year
  if (month < 1 || (month === 1 && day < 4)) {
    year--;
  }

  // Formula: (Base year sum - year) mod 9
  // Base year 1900 = 1 White Water
  // The cycle repeats every 9 years in reverse
  const baseYear = 1900;
  const yearDiff = year - baseYear;

  // Nine Star Ki years go in reverse order
  let yearNumber = 1 - (yearDiff % 9);

  // Adjust for negative results
  while (yearNumber <= 0) {
    yearNumber += 9;
  }

  return yearNumber;
}

/**
 * Calculate the month number for Nine Star Ki
 */
export function calculateMonthNumber(birthDate: Date, yearNumber: number): number {
  const month = birthDate.getMonth(); // 0-11
  const day = birthDate.getDate();

  // Solar months (approximate dates)
  // Each month starts around the 4th-8th of the Western calendar month
  const solarMonths = [
    { start: 1, startDay: 4 },   // Feb 4 - Mar 5
    { start: 2, startDay: 6 },   // Mar 6 - Apr 4
    { start: 3, startDay: 5 },   // Apr 5 - May 5
    { start: 4, startDay: 6 },   // May 6 - Jun 5
    { start: 5, startDay: 6 },   // Jun 6 - Jul 6
    { start: 6, startDay: 7 },   // Jul 7 - Aug 7
    { start: 7, startDay: 8 },   // Aug 8 - Sep 7
    { start: 8, startDay: 8 },   // Sep 8 - Oct 8
    { start: 9, startDay: 9 },   // Oct 9 - Nov 7
    { start: 10, startDay: 8 },  // Nov 8 - Dec 6
    { start: 11, startDay: 7 },  // Dec 7 - Jan 5
    { start: 0, startDay: 6 }    // Jan 6 - Feb 3
  ];

  // Determine solar month
  let solarMonth = 0;
  for (let i = 0; i < solarMonths.length; i++) {
    if (month === solarMonths[i].start && day >= solarMonths[i].startDay) {
      solarMonth = i;
      break;
    }
    if (month === (solarMonths[i].start + 1) % 12 && day < solarMonths[(i + 1) % 12].startDay) {
      solarMonth = i;
      break;
    }
  }

  // Month number calculation based on year number
  // This follows a specific pattern in Nine Star Ki
  const baseMonthNumber = (11 - solarMonth) % 9 || 9;

  // Adjust based on year number (specific Nine Star Ki formula)
  const yearAdjustment = (yearNumber % 3) * 3;
  let monthNumber = ((baseMonthNumber + yearAdjustment - 1) % 9) + 1;

  return monthNumber;
}

/**
 * Calculate the energy number (adult energy)
 * This is the number that represents your developed, adult self
 */
export function calculateEnergyNumber(yearNumber: number, monthNumber: number): number {
  // Energy number is calculated from year and month
  // Simple formula: 10 - ((year + month) % 9 or 9)
  const sum = yearNumber + monthNumber;
  let energyNumber = 10 - (sum % 9 || 9);

  if (energyNumber <= 0) energyNumber += 9;
  if (energyNumber > 9) energyNumber -= 9;

  return energyNumber;
}

/**
 * Calculate complete Nine Star Ki chart
 */
export function calculateNineStarKiChart(birthDate: Date): NineStarKiChart {
  const yearNumber = calculateYearNumber(birthDate);
  const monthNumber = calculateMonthNumber(birthDate, yearNumber);
  const energyNumber = calculateEnergyNumber(yearNumber, monthNumber);

  const element = NINE_STAR_ELEMENTS[energyNumber - 1];
  const characteristics = NINE_STAR_CHARACTERISTICS[energyNumber];

  return {
    yearNumber,
    monthNumber,
    energyNumber,
    element,
    characteristics
  };
}

/**
 * Calculate Nine Star Ki compatibility
 * Returns a score from 0-100
 */
export function calculateNineStarKiCompatibility(
  chart1: NineStarKiChart,
  chart2: NineStarKiChart
): number {
  // Primary compatibility based on energy numbers
  const energyCompatibility = COMPATIBILITY_MATRIX[chart1.energyNumber][chart2.energyNumber];

  // Secondary: Year number compatibility
  const yearCompatibility = COMPATIBILITY_MATRIX[chart1.yearNumber][chart2.yearNumber];

  // Weighted average: Energy number is more important (70%), year number (30%)
  const overallScore = (energyCompatibility * 0.7) + (yearCompatibility * 0.3);

  return Math.round(overallScore);
}

/**
 * Get compatibility interpretation
 */
export function getCompatibilityInterpretation(score: number): string {
  if (score >= 85) return 'Highly compatible - natural harmony and understanding';
  if (score >= 70) return 'Very compatible - supportive and complementary';
  if (score >= 55) return 'Compatible - can work well with effort';
  if (score >= 40) return 'Moderately compatible - requires understanding and compromise';
  return 'Challenging - significant differences to navigate';
}
