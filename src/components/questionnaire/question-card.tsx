'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { type AssessmentQuestion, type LikertResponse } from '@/data/questions';

const CATEGORY_LABEL_KEY: Record<AssessmentQuestion['category'], 'category_focus' | 'category_pattern' | 'category_sensory' | 'category_social' | 'category_structure' | 'category_flexibility'> = {
  focus: 'category_focus',
  pattern: 'category_pattern',
  sensory: 'category_sensory',
  social: 'category_social',
  structure: 'category_structure',
  flexibility: 'category_flexibility',
};

interface QuestionCardProps {
  question: AssessmentQuestion;
  /** Localized stem for display; scoring uses `question.text` / id in history. */
  displayText: string;
  onResponse: (response: LikertResponse) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  displayText,
  onResponse,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const [choiceLocked, setChoiceLocked] = useState(false);
  const t = useTranslations('questionnaire');

  const categoryLabel = t(CATEGORY_LABEL_KEY[question.category]);

  const likertOptions: { value: LikertResponse; label: string; description: string }[] = useMemo(() => {
    if (question.responseScale === 'likert3') {
      return [
        { value: 1, label: t('likert3_low_label'), description: t('likert3_low_desc') },
        { value: 2, label: t('likert3_mid_label'), description: t('likert3_mid_desc') },
        { value: 3, label: t('likert3_high_label'), description: t('likert3_high_desc') },
      ];
    }
    return [
      { value: 1, label: t('likert5_strongly_disagree_label'), description: t('likert5_strongly_disagree_desc') },
      { value: 2, label: t('likert5_disagree_label'), description: t('likert5_disagree_desc') },
      { value: 3, label: t('likert5_neutral_label'), description: t('likert5_neutral_desc') },
      { value: 4, label: t('likert5_agree_label'), description: t('likert5_agree_desc') },
      { value: 5, label: t('likert5_strongly_agree_label'), description: t('likert5_strongly_agree_desc') },
    ];
  }, [question.responseScale, t]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-500">
            {t('card_progress', { current: questionNumber, total: totalQuestions })}
          </span>
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{categoryLabel}</span>
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{displayText}</h2>
        <p className="text-gray-600 text-sm">
          {question.responseScale === 'likert3' ? t('prompt_likert3') : t('prompt_likert5')}
        </p>
      </div>

      {/* Likert Scale Options */}
      <div className="space-y-3">
        {likertOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={choiceLocked}
            onClick={() => {
              if (choiceLocked) return;
              setChoiceLocked(true);
              onResponse(option.value);
            }}
            className="w-full min-h-[44px] text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group disabled:pointer-events-none disabled:opacity-60"
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
                <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Dimension Weights Info (Research transparency) */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <details className="cursor-pointer">
          <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">{t('research_summary')}</summary>
          <div className="mt-3 text-xs text-gray-600 space-y-1">
            <p>{t('research_measures')}</p>
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
            <p className="mt-2 text-xs text-gray-500">{t('research_info_gain', { value: question.informationGain.toFixed(2) })}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
