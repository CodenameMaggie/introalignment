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

export default function ThisOrThatGame({ game, userId, onComplete, onClose }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const questions = game.game_questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    setStartTime(Date.now());
    setSelectedOption(null);
    setShowSelection(false);
  }, [currentQuestionIndex]);

  async function handleOptionSelect(optionId: string) {
    if (isSubmitting) return;

    setSelectedOption(optionId);
    setShowSelection(true);
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
          selectedOption: optionId,
          responseTimeMs: responseTime
        })
      });

      if (!response.ok) throw new Error('Failed to submit response');

      // Brief pause to show selection
      await new Promise(resolve => setTimeout(resolve, 500));

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

  const options = currentQuestion.options || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
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

      {/* Question */}
      <div className="mb-8 text-center">
        <p className="text-xl text-navy mb-2">{currentQuestion.question_text}</p>
      </div>

      {/* Options - Side by Side */}
      <div className="grid grid-cols-2 gap-6">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={isSubmitting}
              className={`
                p-8 rounded-xl border-2 transition-all text-center
                min-h-[200px] flex items-center justify-center
                ${isSelected && showSelection
                  ? 'bg-gold border-gold text-white scale-105'
                  : 'border-gray-200 hover:border-blush hover:bg-blush/10'
                }
                ${isSubmitting && !isSelected ? 'opacity-50' : ''}
              `}
            >
              <div>
                <div className="text-6xl mb-4">
                  {option.id === 'a' ? '👈' : '👉'}
                </div>
                <p className="text-2xl font-medium">{option.text}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
