'use client';

import { useState, useEffect } from 'react';

interface GameQuestion {
  id: string;
  question_text: string;
  sequence_order: number;
}

interface Game {
  id: string;
  title: string;
  description: string;
  points_value: number;
  game_questions: GameQuestion[];
}

interface Props {
  game: Game;
  userId: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function FinishSentenceGame({ game, userId, onComplete, onClose }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const questions = game.game_questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const MIN_CHARS = 20;
  const MAX_CHARS = 500;
  const charCount = response.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  useEffect(() => {
    setStartTime(Date.now());
    setResponse('');
  }, [currentQuestionIndex]);

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    const responseTime = Date.now() - startTime;

    try {
      // Submit response
      const submitResponse = await fetch('/api/games/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId: game.id,
          questionId: currentQuestion.id,
          selectedOption: response,
          responseTimeMs: responseTime
        })
      });

      if (!submitResponse.ok) throw new Error('Failed to submit response');

      // Trigger AI extraction (fire and forget - don't wait)
      fetch('/api/games/finish-sentence/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          questionId: currentQuestion.id,
          questionText: currentQuestion.question_text,
          response
        })
      }).catch(err => console.error('Extraction error:', err));

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentQuestion) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-navy">No questions available</p>
        <button
          onClick={onClose}
          className="mt-4 py-2 px-6 bg-gold text-white rounded-lg hover:bg-gold/90 transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-3xl text-navy">{game.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Prompt */}
      <div className="mb-6">
        <p className="text-2xl font-serif text-navy mb-4">
          {currentQuestion.question_text}
        </p>
      </div>

      {/* Text Input */}
      <div className="mb-4">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl
                     focus:border-gold focus:outline-none resize-none
                     text-navy placeholder-gray-400"
          rows={6}
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
          <span className={charCount > MAX_CHARS - 50 ? 'text-orange-600' : 'text-gray-500'}>
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
            Reflecting...
          </span>
        ) : currentQuestionIndex < questions.length - 1 ? (
          'Next'
        ) : (
          'Complete'
        )}
      </button>

      {/* Help Text */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Be thoughtful and authentic - your response helps us understand you better
      </p>
    </div>
  );
}
