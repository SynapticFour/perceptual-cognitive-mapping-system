'use client';

import { type AssessmentQuestion, type LikertResponse } from '@/data/questions';

interface QuestionCardProps {
  question: AssessmentQuestion;
  onResponse: (response: LikertResponse) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({ question, onResponse, questionNumber, totalQuestions }: QuestionCardProps) {
  const likertOptions: { value: LikertResponse; label: string; description: string }[] = [
    { value: 1, label: 'Strongly Disagree', description: 'This does not describe me at all' },
    { value: 2, label: 'Disagree', description: 'This rarely describes me' },
    { value: 3, label: 'Neutral', description: 'This sometimes describes me' },
    { value: 4, label: 'Agree', description: 'This often describes me' },
    { value: 5, label: 'Strongly Agree', description: 'This describes me very well' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {question.text}
        </h2>
        <p className="text-gray-600 text-sm">
          Please rate how much this statement describes you in your daily life.
        </p>
      </div>

      {/* Likert Scale Options */}
      <div className="space-y-3">
        {likertOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onResponse(option.value)}
            className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-blue-500 flex items-center justify-center transition-colors">
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    {option.value}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Dimension Weights Info (Research transparency) */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <details className="cursor-pointer">
          <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Research Information: How this question contributes to your profile
          </summary>
          <div className="mt-3 text-xs text-gray-600 space-y-1">
            <p>This question measures the following cognitive dimensions:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {Object.entries(question.dimensionWeights)
                .filter(([, weight]) => weight > 0.1)
                .map(([dimension, weight]) => (
                  <div key={dimension} className="flex justify-between">
                    <span className="font-medium">{dimension}:</span>
                    <span>{Math.round(weight * 100)}%</span>
                  </div>
                ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Information gain score: {question.informationGain.toFixed(2)}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
