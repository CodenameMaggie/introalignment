'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/questionnaire/conditional-questions';

interface QuestionnaireProps {
  userId: string;
  onComplete: () => void;
}

export default function Questionnaire({ userId, onComplete }: QuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Load first question
  useEffect(() => {
    loadFirstQuestion();
  }, []);

  async function loadFirstQuestion() {
    try {
      const response = await fetch('/api/questionnaire');
      const data = await response.json();
      setCurrentQuestion(data.question);
      setLoading(false);
    } catch (error) {
      console.error('Error loading question:', error);
    }
  }

  async function handleAnswer(answerId: string) {
    if (!currentQuestion) return;

    setLoading(true);

    try {
      // Save answer
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: answerId
      };
      setAnswers(newAnswers);

      // Submit and get next question
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          questionId: currentQuestion.id,
          answerId,
          allAnswers: newAnswers
        })
      });

      const data = await response.json();

      if (data.completed) {
        // Questionnaire complete!
        onComplete();
      } else {
        // Load next question
        setCurrentQuestion(data.nextQuestion);
        setProgress(Object.keys(newAnswers).length);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-navy">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <p className="text-navy">No question available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-navy mb-2">Getting to Know You</h1>
          <p className="font-serif italic text-medium-gray">Take your time. There are no wrong answers.</p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-navy">Question {progress + 1}</span>
            <span className="text-sm text-medium-gray">{Math.round((progress / 40) * 100)}% complete</span>
          </div>
          <div className="w-full bg-soft-gray rounded-full h-2">
            <div
              className="bg-gold rounded-full h-2 transition-all duration-500"
              style={{ width: `${(progress / 40) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-serif text-navy mb-6 leading-relaxed">
            {currentQuestion.text}
          </h2>

          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.answers?.map((answer) => (
              <button
                key={answer.id}
                onClick={() => handleAnswer(answer.id)}
                disabled={loading}
                className="w-full text-left p-4 rounded-xl border-2 border-cream-dark hover:border-gold hover:bg-cream transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="text-navy group-hover:text-navy transition-colors">
                  {answer.text}
                </span>
              </button>
            ))}

            {currentQuestion.type === 'scale' && (
              <div className="py-6">
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-navy">
                    {currentQuestion.scaleLabels?.min}
                  </span>
                  <span className="text-sm text-navy">
                    {currentQuestion.scaleLabels?.max}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  {Array.from(
                    { length: (currentQuestion.scaleMax || 10) - (currentQuestion.scaleMin || 1) + 1 },
                    (_, i) => i + (currentQuestion.scaleMin || 1)
                  ).map((num) => (
                    <button
                      key={num}
                      onClick={() => handleAnswer(num.toString())}
                      disabled={loading}
                      className="flex-1 py-3 px-2 rounded-lg border-2 border-cream-dark hover:border-gold hover:bg-gold hover:text-white transition-all duration-200 disabled:opacity-50 text-navy font-medium"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand footer */}
        <div className="text-center">
          <p className="text-sm font-serif italic text-medium-gray">
            How you legally architect your dynasty
          </p>
        </div>
      </div>
    </div>
  );
}
