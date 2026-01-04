// BaZi (Chinese Four Pillars) Calculation Engine
// Based on Chinese calendar conversions and stem-branch system

import { addDays, differenceInDays } from 'date-fns';

// Heavenly Stems (Tiangan)
export const HEAVENLY_STEMS = [
  '甲 Wood+', '乙 Wood-', '丙 Fire+', '丁 Fire-', '戊 Earth+',
  '己 Earth-', '庚 Metal+', '辛 Metal-', '壬 Water+', '癸 Water-'
] as const;

// Earthly Branches (Dizhi)
export const EARTHLY_BRANCHES = [
  '子 Rat', '丑 Ox', '寅 Tiger', '卯 Rabbit', '辰 Dragon', '巳 Snake',
  '午 Horse', '未 Goat', '申 Monkey', '酉 Rooster', '戌 Dog', '亥 Pig'
] as const;

// Five Elements
export type Element = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

// Element cycle for each stem/branch
const STEM_ELEMENTS: Element[] = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
const BRANCH_ELEMENTS: Element[] = ['Water', 'Earth', 'Wood', 'Wood', 'Earth', 'Fire', 'Fire', 'Earth', 'Metal', 'Metal', 'Earth', 'Water'];

export interface BaZiChart {
  // Four Pillars
  year: { stem: string; branch: string; };
  month: { stem: string; branch: string; };
  day: { stem: string; branch: string; };
  hour: { stem: string; branch: string; };

  // Day Master (the day stem - represents the person)
  dayMaster: string;

  // Element balance
  elementBalance: {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
  };

  // Yin/Yang balance
  yinYangBalance: {
    yin: number;
    yang: number;
  };
}

// Reference date for Chinese calendar calculations
// This is a known date with a known stem-branch
const REFERENCE_DATE = new Date('1900-01-31'); // Start of Chinese year 4597
const REFERENCE_DAY_STEM = 0; // 甲 (Wood+)
const REFERENCE_DAY_BRANCH = 4; // 辰 (Dragon)

/**
 * Calculate the day pillar (stem and branch) for a given date
 */
function calculateDayPillar(date: Date): { stem: number; branch: number } {
  const daysDiff = differenceInDays(date, REFERENCE_DATE);

  const stemIndex = (REFERENCE_DAY_STEM + daysDiff) % 10;
  const branchIndex = (REFERENCE_DAY_BRANCH + daysDiff) % 12;

  return {
    stem: stemIndex < 0 ? stemIndex + 10 : stemIndex,
    branch: branchIndex < 0 ? branchIndex + 12 : branchIndex
  };
}

/**
 * Calculate the year pillar based on Chinese New Year
 * Note: This is a simplified calculation. Full implementation would need
 * precise Chinese New Year dates for each year.
 */
function calculateYearPillar(date: Date): { stem: number; branch: number } {
  // Simplified: assuming Chinese New Year is late Jan/early Feb
  // For production, use a lookup table of actual Chinese New Year dates

  const year = date.getFullYear();
  const month = date.getMonth();

  // If before February, use previous year
  const chineseYear = month < 1 ? year - 1 : year;

  // 1984 was Year of the Rat (甲子), which is stem 0, branch 0
  const yearsSince1984 = chineseYear - 1984;

  const stemIndex = yearsSince1984 % 10;
  const branchIndex = yearsSince1984 % 12;

  return {
    stem: stemIndex < 0 ? stemIndex + 10 : stemIndex,
    branch: branchIndex < 0 ? branchIndex + 12 : branchIndex
  };
}

/**
 * Calculate the month pillar
 * Note: Chinese months are determined by solar terms, not Western calendar
 * This is a simplified calculation
 */
function calculateMonthPillar(date: Date, yearStem: number): { stem: number; branch: number } {
  const month = date.getMonth(); // 0-11

  // Map Western months to approximate Chinese solar months
  // This is simplified - proper calculation uses exact solar term dates
  const solarMonth = month; // Would need adjustment based on solar terms

  // Branch is determined by the solar month (approximately)
  // Starting with 寅 (Tiger) in February
  const branchIndex = (solarMonth + 2) % 12;

  // Stem is calculated from year stem and month branch
  // This follows a specific formula in BaZi
  const stemIndex = ((yearStem % 5) * 2 + branchIndex) % 10;

  return {
    stem: stemIndex,
    branch: branchIndex
  };
}

/**
 * Calculate the hour pillar
 */
function calculateHourPillar(hour: number, dayStem: number): { stem: number; branch: number } {
  // Hour branches: 23-01=Rat, 01-03=Ox, etc.
  const branchIndex = Math.floor((hour + 1) / 2) % 12;

  // Hour stem is calculated from day stem and hour branch
  const stemIndex = ((dayStem % 5) * 2 + branchIndex) % 10;

  return {
    stem: stemIndex,
    branch: branchIndex
  };
}

/**
 * Calculate element balance from the four pillars
 */
function calculateElementBalance(chart: { stem: number; branch: number }[]): BaZiChart['elementBalance'] {
  const balance = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0
  };

  chart.forEach(pillar => {
    const stemElement = STEM_ELEMENTS[pillar.stem];
    const branchElement = BRANCH_ELEMENTS[pillar.branch];

    balance[stemElement]++;
    balance[branchElement]++;
  });

  return balance;
}

/**
 * Calculate Yin/Yang balance
 */
function calculateYinYangBalance(chart: { stem: number; branch: number }[]): { yin: number; yang: number } {
  let yin = 0;
  let yang = 0;

  chart.forEach(pillar => {
    // Even indices are Yang, odd indices are Yin
    if (pillar.stem % 2 === 0) yang++; else yin++;
    if (pillar.branch % 2 === 0) yang++; else yin++;
  });

  return { yin, yang };
}

/**
 * Main function to calculate a complete BaZi chart
 */
export function calculateBaZiChart(
  birthDate: Date,
  birthHour?: number, // 0-23, undefined if unknown
  birthTimeKnown: boolean = false
): BaZiChart {
  const year = calculateYearPillar(birthDate);
  const month = calculateMonthPillar(birthDate, year.stem);
  const day = calculateDayPillar(birthDate);

  // If birth time is known, calculate hour pillar
  const hour = birthTimeKnown && birthHour !== undefined
    ? calculateHourPillar(birthHour, day.stem)
    : { stem: 0, branch: 0 }; // Unknown hour

  const pillars = [year, month, day, hour];
  const elementBalance = calculateElementBalance(pillars);
  const yinYangBalance = calculateYinYangBalance(pillars);

  return {
    year: {
      stem: HEAVENLY_STEMS[year.stem],
      branch: EARTHLY_BRANCHES[year.branch]
    },
    month: {
      stem: HEAVENLY_STEMS[month.stem],
      branch: EARTHLY_BRANCHES[month.branch]
    },
    day: {
      stem: HEAVENLY_STEMS[day.stem],
      branch: EARTHLY_BRANCHES[day.branch]
    },
    hour: birthTimeKnown ? {
      stem: HEAVENLY_STEMS[hour.stem],
      branch: EARTHLY_BRANCHES[hour.branch]
    } : {
      stem: 'Unknown',
      branch: 'Unknown'
    },
    dayMaster: HEAVENLY_STEMS[day.stem],
    elementBalance,
    yinYangBalance
  };
}

/**
 * Calculate BaZi compatibility between two charts
 * Returns a score from 0-100
 */
export function calculateBaZiCompatibility(chart1: BaZiChart, chart2: BaZiChart): number {
  let score = 50; // Base score

  // 1. Day Master compatibility (most important)
  // Check if day masters support each other in the five element cycle
  // This is simplified - full analysis is complex
  score += 10; // Placeholder

  // 2. Element balance compatibility
  // Partners with complementary element balances score higher
  const balance1 = chart1.elementBalance;
  const balance2 = chart2.elementBalance;

  // Calculate how well they balance each other
  // If one is weak in Wood and the other is strong, that's complementary
  let balanceScore = 0;
  (['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as Element[]).forEach(element => {
    const diff = Math.abs(balance1[element] - balance2[element]);
    balanceScore += (4 - Math.min(diff, 4)) * 2; // Higher score for similar balance
  });
  score += balanceScore;

  // 3. Yin/Yang balance
  // Similar yin/yang distributions tend to be compatible
  const yinDiff = Math.abs(chart1.yinYangBalance.yin - chart2.yinYangBalance.yin);
  score += Math.max(0, 10 - yinDiff * 2);

  // 4. Branch clashes and combinations
  // Certain branches clash (oppose) or combine (attract)
  // This is a complex system - simplified here
  score += 5; // Placeholder

  // Ensure score is within 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get element from day master string
 */
export function getElementFromDayMaster(dayMaster: string): Element {
  const index = HEAVENLY_STEMS.indexOf(dayMaster as any);
  return STEM_ELEMENTS[index];
}
