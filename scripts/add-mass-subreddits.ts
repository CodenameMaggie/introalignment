/**
 * Add 200+ Dating/Relationship Subreddits for 1M Lead Target
 * Run with: npx ts-node scripts/add-mass-subreddits.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 200+ Dating, Relationship, and Singles Subreddits
const subreddits = [
  // General Dating & Relationships
  'dating', 'relationships', 'relationship_advice', 'dating_advice',
  'datingoverthirty', 'datingoverforty', 'datingoverfifty',
  'OnlineDating', 'Tinder', 'Bumble', 'Hinge', 'OkCupid',

  // Age-specific dating
  'R4R30Plus', 'R4R40Plus', 'R4R50Plus', 'DatingOverSeventy',
  'youngadults', 'AskMenOver30', 'AskWomenOver30', 'AskMenOver40',
  'AskWomenOver40', 'AskWomenOver50', 'GenX', 'GenXDating',

  // Singles & Personals
  'r4r', 'ForeverAlone', 'ForeverAloneDating', 'single',
  'singles', 'SoloTravel', 'solotravel30plus',

  // Location-based dating
  'r4rSeattle', 'r4rNYC', 'LosAngelesRams', 'chicagor4r',
  'BostonR4R', 'PhillyR4R', 'atlantar4r', 'austinr4r',
  'PortlandR4R', 'DenverR4R', 'SanDiegoR4R', 'SFr4r',
  'FloridaR4R', 'TexasR4R', 'CaliforniaR4R', 'NYr4r',
  'CanadaR4R', 'UKr4r', 'EuropeR4R', 'AustraliaR4R',

  // Long Distance & Travel
  'LongDistance', 'LDR', 'wemetonline', 'travelpartners',

  // Specific Interest Dating
  'geek4geek', 'gamergirls', 'GamerPals', 'LesbianGamers',
  'nerdydating', 'sciencenerds', 'bookclub', 'FitnessDating',
  'FitAndNatural', 'PlantBasedDiet', 'vegan', 'vegetarian',

  // Older/Widowed
  'widowers', 'widows', 'GriefSupport', 'GriefAndLoss',
  'seniormoments', 'AskOldPeople',

  // Faith-based
  'ChristianDating', 'CatholicDating', 'JewishDating',
  'MuslimMarriage', 'ExMormon', 'Exvangelical',

  // LGBTQ+
  'LesbianActually', 'actuallesbians', 'lgbt', 'bisexual',
  'gay', 'gaybros', 'AskGayMen', 'AskLesbians',
  'TransDateUS', 'QueerDating', 'NonBinary',

  // Divorced/Separated
  'Divorce', 'DivorceSupport', 'DivorcedDads', 'DivorcedMoms',
  'SingleParents', 'SingleDads', 'SingleMothers',

  // Dating After Trauma
  'BreakUps', 'ExNoContact', 'NarcissisticAbuse',
  'AbusiveRelationships', 'JustNoSO',

  // Social Skills & Self Improvement
  'socialskills', 'selfimprovement', 'DecidingToBeBetter',
  'getdisciplined', 'confidence', 'seduction', 'AskWomen',
  'AskMen', 'AskReddit',

  // Body Positive / Size specific
  'PlusSize', 'CurvyGirls', 'tall', 'short', 'PetiteFashionAdvice',

  // Activity-based
  'hiking', 'camping', 'running', 'cycling', 'yoga',
  'fitness', 'bodyweightfitness', 'swimming', 'tennis',
  'golf', 'skiing', 'snowboarding', 'surfing',
  'photography', 'travel', 'backpacking', 'cocktails',
  'wine', 'beer', 'coffee', 'tea', 'cooking',
  'Baking', 'gardening', 'HomeImprovement', 'DIY',

  // Professional/Career
  'careeradvice', 'jobs', 'EngineeringStudents', 'cscareerquestions',
  'medicine', 'nursing', 'Teachers', 'sales',
  'Entrepreneur', 'smallbusiness', 'startups',

  // Music/Arts
  'Music', 'Jazz', 'classicalmusic', 'metal', 'hiphop',
  'indiemusic', 'WeAreTheMusicMakers', 'Art', 'painting',
  'drawing', 'photography', 'writing', 'Poetry',

  // Hobbies
  'boardgames', 'DnD', 'rpg', 'gaming', 'pcgaming',
  'PS4', 'PS5', 'NintendoSwitch', 'Xbox', 'Playstation',
  'movies', 'television', 'books', 'Fantasy', 'scifi',
  'horrorlit', 'TrueCrime',

  // Pets/Animals
  'dogs', 'cats', 'pets', 'puppy', 'Dogtraining',
  'CatAdvice', 'Rabbits', 'parrots', 'BeardedDragons',

  // Mental Health/Wellness
  'mentalhealth', 'Anxiety', 'depression', 'ADHD',
  'therapy', 'Meditation', 'mindfulness', 'sleep',
  'GetMotivated',

  // Life Stages
  'TwoXChromosomes', 'AskWomen', 'AskMen', 'TrollXChromosomes',
  'MiddleAgedReddit', 'RedditForGrownups',

  // Specific Demographics
  'AsianMasculinity', 'AsianTwoX', 'blackladies', 'BlackMentalHealth',
  'LatinoPeopleTwitter', 'NativeAmerican',

  // Introverts/Social Anxiety
  'introvert', 'INTJ', 'INFJ', 'infp', 'entp', 'mbti',
  'SocialAnxiety', 'AvoidantAttachment',

  // Specific Interests
  'astronomy', 'space', 'science', 'Physics', 'biology',
  'chemistry', 'Environment', 'ClimateChange',
  'ZeroWaste', 'Frugal', 'personalfinance', 'FinancialPlanning',

  // Local Communities (expand with more cities)
  'Miami', 'Houston', 'Phoenix', 'Philadelphia', 'SanAntonio',
  'SanJose', 'Dallas', 'Jacksonville', 'Indianapolis',
  'Columbus', 'Charlotte', 'Nashville', 'Detroit', 'Memphis',
  'Portland', 'OklahomaCity', 'LasVegas', 'Louisville',
  'Milwaukee', 'Albuquerque', 'Tucson', 'Sacramento',
  'KansasCity', 'Minneapolis', 'Cleveland', 'Omaha',
  'Raleigh', 'VirginiaBeach', 'Oakland', 'Tampa',

  // International
  'London', 'Toronto', 'Vancouver', 'Montreal', 'Sydney',
  'Melbourne', 'Auckland', 'Dublin', 'Edinburgh', 'Manchester',
  'Berlin', 'Paris', 'Amsterdam', 'Barcelona', 'Rome',
  'Tokyo', 'Singapore', 'HongKong', 'Seoul',

  // Additional Relationship Topics
  'polyamory', 'nonmonogamy', 'OpenMarriage', 'Swingers',
  'DeadBedrooms', 'marriedredpill', 'Marriage',
  'AskMarriedPeople', 'datingoverforty', 'CouplesSupportGroup'
];

const keywords = [
  'single', 'dating', 'looking for', 'seeking', 'lonely',
  'meet', 'connect', 'relationship', 'partner', 'girlfriend',
  'boyfriend', 'companionship', 'alone', 'solo', 'divorced',
  'widowed', 'separated', 'available', 'interested in meeting',
  'would love to meet', 'hope to find', 'searching for'
];

async function addSubreddits() {
  console.log(`Adding ${subreddits.length} subreddits...`);

  let added = 0;
  let skipped = 0;

  for (const subreddit of subreddits) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('lead_sources')
        .select('id')
        .eq('source_name', `r/${subreddit}`)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping r/${subreddit} (already exists)`);
        skipped++;
        continue;
      }

      // Add new source
      const { error } = await supabase
        .from('lead_sources')
        .insert({
          source_name: `r/${subreddit}`,
          source_type: 'reddit',
          source_url: `https://www.reddit.com/r/${subreddit}`,
          is_active: true,
          scrape_frequency: 'hourly', // Hourly for faster collection
          scrape_config: {
            subreddit: subreddit,
            sort: 'new',
            time_filter: 'day',
            keywords: keywords,
            exclude_keywords: ['bot', 'spam', 'scam'],
            min_karma: 10, // Relaxed from higher values
            min_account_age_days: 7 // Relaxed from higher values
          }
        });

      if (error) {
        console.error(`❌ Error adding r/${subreddit}:`, error.message);
      } else {
        console.log(`✅ Added r/${subreddit}`);
        added++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error: any) {
      console.error(`❌ Error processing r/${subreddit}:`, error.message);
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total sources: ${added + skipped}`);
  console.log(`\nWith 1000 posts/subreddit and ${added + skipped} sources,`);
  console.log(`you can collect up to ${(added + skipped) * 1000} leads per scrape!`);
}

addSubreddits()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
