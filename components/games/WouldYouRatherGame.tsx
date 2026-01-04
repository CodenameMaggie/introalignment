'use client';

import { useState, useEffect } from 'react';

interface GameQuestion {
  id: string;
  question_text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
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

export default function WouldYouRatherGame({ game, userId, onComplete, onClose }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const questions = game.game_questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Reset timer when question changes
    setStartTime(Date.now());
    setSelectedOption(null);
  }, [currentQuestionIndex]);

  async function handleSubmit() {
    if (!selectedOption || isSubmitting) return;

    setIsSubmitting(true);
    const responseTime = Date.now() - startTime;

    try {
      const response = await fetch('/api/games/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameId: game.id,
          questionId: currentQuestion.id,
          selectedOption,
          responseTimeMs: responseTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Game complete!
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
        <p className="text-charcoal">No questions available</p>
        <button
          onClick={onClose}
          className="mt-4 py-2 px-6 bg-burgundy text-white rounded-full hover:bg-burgundy-light transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-serif text-2xl text-burgundy">{game.title}</h3>
          <p className="text-charcoal-light">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-charcoal-light hover:text-burgundy transition text-2xl"
        >
          ×
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-ivory-dark rounded-full h-2 mb-8">
        <div
          className="bg-burgundy rounded-full h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h4 className="font-serif text-xl text-charcoal mb-6 text-center">
          {currentQuestion.question_text}
        </h4>

        <div className="space-y-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                selectedOption === option.id
                  ? 'border-burgundy bg-burgundy bg-opacity-5'
                  : 'border-ivory-dark hover:border-copper'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  selectedOption === option.id
                    ? 'border-burgundy bg-burgundy'
                    : 'border-charcoal-light'
                }`}>
                  {selectedOption === option.id && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="text-charcoal flex-1">{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="py-3 px-6 border-2 border-burgundy text-burgundy rounded-full hover:bg-burgundy hover:text-white transition font-medium disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className="py-3 px-8 bg-burgundy text-white rounded-full hover:bg-burgundy-light transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : currentQuestionIndex < questions.length - 1 ? 'Next →' : 'Complete ✓'}
        </button>
      </div>
    </div>
  );
}
