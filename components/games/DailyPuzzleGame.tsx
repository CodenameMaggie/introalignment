'use client';

import { useState } from 'react';

interface Puzzle {
  id: string;
  title: string;
  puzzle_type: string;
  puzzle_data: {
    scenario?: string;
    question: string;
    hint?: string;
    problem?: string;
  };
  points_value: number;
  time_limit_seconds?: number;
}

interface Props {
  puzzle: Puzzle;
  userId: string;
  onComplete: (result: { insight: string; points: number }) => void;
  onClose: () => void;
}

export default function DailyPuzzleGame({ puzzle, userId, onComplete, onClose }: Props) {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MIN_CHARS = 10;
  const MAX_CHARS = 1000;
  const charCount = response.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submitResponse = await fetch('/api/puzzles/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          puzzleId: puzzle.id,
          response,
          timeSpentSeconds: 0 // Could track this if needed
        })
      });

      if (!submitResponse.ok) throw new Error('Failed to submit');

      const result = await submitResponse.json();
      onComplete(result);
    } catch (error) {
      console.error('Error submitting puzzle:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-serif text-3xl text-navy mb-1">{puzzle.title}</h2>
            <span className="text-sm text-gray-600 uppercase tracking-wide">
              Daily Puzzle • {puzzle.points_value} points
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Puzzle Content */}
      <div className="mb-6 bg-cream/50 p-6 rounded-xl">
        {puzzle.puzzle_data.scenario && (
          <p className="text-lg text-navy mb-4 leading-relaxed">
            {puzzle.puzzle_data.scenario}
          </p>
        )}

        {puzzle.puzzle_data.problem && (
          <p className="text-lg text-navy mb-4 font-medium">
            {puzzle.puzzle_data.problem}
          </p>
        )}

        <p className="text-xl font-serif text-navy">
          {puzzle.puzzle_data.question}
        </p>

        {puzzle.puzzle_data.hint && (
          <div className="mt-4 p-3 bg-blush/20 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Hint:</span> {puzzle.puzzle_data.hint}
            </p>
          </div>
        )}
      </div>

      {/* Response Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-navy mb-2">
          Your Answer
        </label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Share your reasoning and answer..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl
                     focus:border-gold focus:outline-none resize-none
                     text-navy placeholder-gray-400"
          rows={5}
          maxLength={MAX_CHARS}
          disabled={isSubmitting}
        />

        {/* Character Count */}
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className={charCount < MIN_CHARS ? 'text-gray-400' : 'text-green-600'}>
            {charCount < MIN_CHARS
              ? `${MIN_CHARS - charCount} more characters needed`
              : 'Minimum reached ✓'
            }
          </span>
          <span className="text-gray-500">
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all
          ${isValid && !isSubmitting
            ? 'bg-gold text-white hover:bg-gold/90 cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Analyzing...
          </span>
        ) : (
          'Submit Answer'
        )}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        Explain your reasoning - there's no single right answer
      </p>
    </div>
  );
}
