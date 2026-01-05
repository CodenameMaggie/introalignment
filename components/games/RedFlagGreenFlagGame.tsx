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

export default function RedFlagGreenFlagGame({ game, userId, onComplete, onClose }: Props) {
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
      await new Promise(resolve => setTimeout(resolve, 600));

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

      {/* Scenario */}
      <div className="mb-8 text-center bg-blush/20 p-8 rounded-xl">
        <p className="text-2xl text-navy font-serif mb-2">
          "{currentQuestion.question_text}"
        </p>
        <p className="text-gray-600 text-sm mt-4">
          Is this acceptable or a dealbreaker?
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleOptionSelect('green')}
          disabled={isSubmitting}
          className={`
            py-8 px-6 rounded-xl text-white font-semibold text-xl
            transition-all flex flex-col items-center gap-3
            ${selectedOption === 'green' && showSelection
              ? 'bg-green-600 scale-105 shadow-lg'
              : 'bg-green-500 hover:bg-green-600'
            }
            ${isSubmitting && selectedOption !== 'green' ? 'opacity-50' : ''}
          `}
        >
          <span className="text-4xl">💚</span>
          <span>Green Flag</span>
          <span className="text-sm opacity-90">Acceptable</span>
        </button>

        <button
          onClick={() => handleOptionSelect('red')}
          disabled={isSubmitting}
          className={`
            py-8 px-6 rounded-xl text-white font-semibold text-xl
            transition-all flex flex-col items-center gap-3
            ${selectedOption === 'red' && showSelection
              ? 'bg-red-600 scale-105 shadow-lg'
              : 'bg-red-500 hover:bg-red-600'
            }
            ${isSubmitting && selectedOption !== 'red' ? 'opacity-50' : ''}
          `}
        >
          <span className="text-4xl">🚩</span>
          <span>Red Flag</span>
          <span className="text-sm opacity-90">Dealbreaker</span>
        </button>
      </div>
    </div>
  );
}
