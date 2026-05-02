'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

export default function IntroductionPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const t = useTranslations('introduction');

  const introductionSteps = useMemo(
    () => [
      {
        title: t('step1_title'),
        content: [t('step1_p1'), t('step1_p2'), t('step1_p3')],
        keyPoints: [t('step1_k1'), t('step1_k2'), t('step1_k3')],
      },
      {
        title: t('step2_title'),
        content: [t('step2_p1'), t('step2_p2'), t('step2_p3')],
        keyPoints: [t('step2_k1'), t('step2_k2'), t('step2_k3')],
      },
      {
        title: t('step3_title'),
        content: [t('step3_p1'), t('step3_p2'), t('step3_p3')],
        keyPoints: [t('step3_k1'), t('step3_k2'), t('step3_k3')],
      },
      {
        title: t('step4_title'),
        content: [t('step4_p1'), t('step4_p2'), t('step4_p3')],
        keyPoints: [t('step4_k1'), t('step4_k2'), t('step4_k3')],
      },
      {
        title: t('step5_title'),
        content: [t('step5_p1'), t('step5_p2'), t('step5_p3'), t('step5_p4')],
        keyPoints: [t('step5_k1'), t('step5_k2'), t('step5_k3')],
      },
    ],
    [t]
  );

  const handleNext = () => {
    if (currentStep < introductionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/consent');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = introductionSteps[currentStep]!;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t('step_counter', { current: currentStep + 1, total: introductionSteps.length })}
            </span>
            <span className="text-sm text-gray-600">{t('badge')}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / introductionSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">{currentStepData.title}</h1>

            <div className="mb-6 space-y-4">
              {currentStepData.content.map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">{t('key_points_heading')}</h3>
              <ul className="space-y-2">
                {currentStepData.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-blue-600">-</span>
                    <span className="text-blue-800">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-600 transition-colors hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('previous')}
            </button>

            <div className="flex space-x-2">
              {introductionSteps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={t('aria_goto_step', { n: index + 1 })}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {currentStep === introductionSteps.length - 1 ? t('continue_consent') : t('next')}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">{t('footer_ethics')}</p>
          <p className="mt-2 text-xs text-gray-500">{t('footer_contact')}</p>
        </div>
      </div>
    </div>
  );
}
