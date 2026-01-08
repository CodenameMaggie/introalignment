'use client';

import { useState, useEffect } from 'react';

interface QuestionnaireFormProps {
  userId: string;
  onComplete: () => void;
}

interface ChapterInfo {
  number: number;
  title: string;
  emoji: string;
  isNew?: boolean;
}

export default function QuestionnaireForm({ userId, onComplete }: QuestionnaireFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionText, setQuestionText] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    startQuestionnaire();
  }, []);

  async function startQuestionnaire() {
    try {
      const response = await fetch('/api/conversation/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'start' })
      });

      if (!response.ok) {
        throw new Error('Failed to start questionnaire');
      }

      const data = await response.json();
      setCurrentQuestion(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);
      setQuestionText(data.question);
      setGreeting(data.greeting);
      setChapter(data.chapter);
      setProgress(data.progress);
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting questionnaire:', error);
      alert('Failed to load questionnaire. Please try again.');
    }
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();

    if (!answer.trim()) {
      alert('Please provide an answer before continuing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/conversation/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'answer',
          questionNumber: currentQuestion,
          answer: answer.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();

      if (data.isComplete) {
        setIsComplete(true);
        setCompletionMessage(data.message);
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        // Move to next question
        setCurrentQuestion(data.currentQuestion);
        setQuestionText(data.question);
        setChapter(data.chapter);
        setProgress(data.progress);
        setAnswer(''); // Clear the answer field

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            All Done!
          </h2>
          <p className="text-lg text-gray-600 mb-6 whitespace-pre-wrap">
            {completionMessage}
          </p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gold border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestion} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {progress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-gold to-gold-dark h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Greeting (only shown for first question) */}
      {currentQuestion === 1 && greeting && (
        <div className="bg-blush-light border-l-4 border-gold rounded-lg p-6 mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{greeting}</p>
        </div>
      )}

      {/* Chapter Header */}
      {chapter && chapter.isNew && (
        <div className="bg-gradient-to-r from-gold/10 to-blush/10 rounded-xl p-6 mb-6 text-center">
          <div className="text-4xl mb-2">{chapter.emoji}</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            Chapter {chapter.number}: {chapter.title}
          </h3>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Current Chapter Indicator */}
        {chapter && (
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-2xl">{chapter.emoji}</span>
            <span className="text-sm font-medium text-gray-600">
              Chapter {chapter.number}: {chapter.title}
            </span>
          </div>
        )}

        {/* Question */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {questionText}
        </h2>

        {/* Answer Form */}
        <form onSubmit={submitAnswer}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Take your time and be as detailed as you'd like."
            className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none resize-none text-gray-800 transition-colors"
            disabled={isSubmitting}
          />

          {/* Character Count */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              {answer.length > 0 && `${answer.length} characters`}
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !answer.trim()}
              className="bg-gradient-to-r from-gold to-gold-dark text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </span>
              ) : (
                currentQuestion === totalQuestions ? 'Complete' : 'Continue'
              )}
            </button>
          </div>
        </form>

        {/* Helper Text */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            💡 There are no wrong answers. We're just getting to know you. Be honest and authentic.
          </p>
        </div>
      </div>

      {/* Cost Savings Indicator */}
      <div className="mt-6 text-center">
        <div className="inline-block bg-green-50 border border-green-200 rounded-full px-4 py-2">
          <span className="text-sm text-green-700 font-medium">
            ✅ Free Mode Active - No AI costs
          </span>
        </div>
      </div>
    </div>
  );
}
