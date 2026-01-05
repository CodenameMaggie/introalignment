'use client';

interface ProfileData {
  profile_completeness: number;
  total_games_played: number;
  total_puzzles_solved: number;
  total_articles_read: number;
  total_discussions_joined: number;
  big_five: {
    openness: { value: number; confidence: number; data_points: number };
    conscientiousness: { value: number; confidence: number; data_points: number };
    extraversion: { value: number; confidence: number; data_points: number };
    agreeableness: { value: number; confidence: number; data_points: number };
    neuroticism: { value: number; confidence: number; data_points: number };
  };
}

interface Props {
  profile: ProfileData | null;
}

export default function ProfileProgress({ profile }: Props) {
  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-32 bg-cream-dark rounded"></div>
      </div>
    );
  }

  const completeness = Math.round(profile.profile_completeness * 100);
  const totalActivities =
    profile.total_games_played +
    profile.total_puzzles_solved +
    profile.total_articles_read +
    profile.total_discussions_joined;

  // Get strongest personality trait
  const traits = [
    { name: 'Openness', value: profile.big_five.openness.value, confidence: profile.big_five.openness.confidence },
    { name: 'Conscientiousness', value: profile.big_five.conscientiousness.value, confidence: profile.big_five.conscientiousness.confidence },
    { name: 'Extraversion', value: profile.big_five.extraversion.value, confidence: profile.big_five.extraversion.confidence },
    { name: 'Agreeableness', value: profile.big_five.agreeableness.value, confidence: profile.big_five.agreeableness.confidence },
    { name: 'Neuroticism', value: profile.big_five.neuroticism.value, confidence: profile.big_five.neuroticism.confidence }
  ];

  const strongestTrait = traits.reduce((prev, current) =>
    (current.confidence > prev.confidence) ? current : prev
  );

  const getTraitLevel = (value: number) => {
    if (value >= 0.7) return 'High';
    if (value >= 0.3) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-serif text-xl text-navy">Profile Building</h3>
          <p className="text-sm text-navy-light">
            {totalActivities} activities completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-serif text-navy">{completeness}%</div>
          <p className="text-xs text-navy-light">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-cream-dark rounded-full h-3">
          <div
            className="bg-gradient-to-r from-navy to-gold rounded-full h-3 transition-all duration-500"
            style={{ width: `${completeness}%` }}
          ></div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl text-navy font-semibold">{profile.total_games_played}</div>
          <div className="text-xs text-navy-light">Games</div>
        </div>
        <div className="text-center">
          <div className="text-2xl text-gold font-semibold">{profile.total_puzzles_solved}</div>
          <div className="text-xs text-navy-light">Puzzles</div>
        </div>
        <div className="text-center">
          <div className="text-2xl text-gold-muted font-semibold">{profile.total_articles_read}</div>
          <div className="text-xs text-navy-light">Articles</div>
        </div>
        <div className="text-center">
          <div className="text-2xl text-navy font-semibold">{profile.total_discussions_joined}</div>
          <div className="text-xs text-navy-light">Discussions</div>
        </div>
      </div>

      {/* Personality Insight */}
      {strongestTrait.confidence > 0.3 && (
        <div className="mt-4 p-4 bg-gold-muted bg-opacity-10 rounded-lg">
          <p className="text-sm text-navy">
            <span className="font-semibold text-navy">Emerging Trait:</span>{' '}
            {getTraitLevel(strongestTrait.value)} {strongestTrait.name}
            {strongestTrait.confidence > 0.6 && ' ✓'}
          </p>
          <div className="mt-2 w-full bg-white rounded-full h-1.5">
            <div
              className="bg-gold rounded-full h-1.5"
              style={{ width: `${strongestTrait.confidence * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {completeness < 50 && (
        <div className="mt-4 p-3 bg-copper bg-opacity-10 rounded-lg">
          <p className="text-sm text-gold">
            💡 Keep playing to build a richer profile and get better matches!
          </p>
        </div>
      )}
    </div>
  );
}
