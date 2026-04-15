'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function IntroductionPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const introductionSteps = [
    {
      title: "Understanding This Research",
      content: [
        "This is a research tool designed to help understand how different people think and process information.",
        "The assessment measures ten dimensions of cognitive functioning using evidence-based questions.",
        "Your participation contributes to scientific understanding of cognitive diversity."
      ],
      keyPoints: [
        "Research-based assessment",
        "Measures cognitive patterns",
        "Anonymous and voluntary"
      ]
    },
    {
      title: "What to Expect",
      content: [
        "The assessment consists of questions about your preferences and typical behaviors.",
        "Most questions use a 5-point scale from 'Strongly Disagree' to 'Strongly Agree'.",
        "The questionnaire adapts based on your responses to provide the most relevant questions."
      ],
      keyPoints: [
        "10-15 minutes total",
        "Adaptive questioning",
        "No right or wrong answers"
      ]
    },
    {
      title: "Scientific Foundation",
      content: [
        "This assessment is based on established cognitive science research.",
        "It measures continuous dimensions rather than categorical labels.",
        "Results include confidence levels to indicate reliability of measurements."
      ],
      keyPoints: [
        "Evidence-based model",
        "Continuous dimensional approach",
        "Statistical confidence measures"
      ]
    },
    {
      title: "Your Privacy & Rights",
      content: [
        "Your participation is completely anonymous. No personal identifying information is collected.",
        "You can stop at any time without penalty.",
        "Your data will be used only for research purposes and may be shared in aggregated form."
      ],
      keyPoints: [
        "Complete anonymity",
        "Voluntary participation",
        "Right to withdraw data"
      ]
    },
    {
      title: "Important Limitations",
      content: [
        "This is NOT a medical or diagnostic tool.",
        "Results represent tendencies, not definitive characteristics.",
        "Individual variation is normal and expected.",
        "If you have health concerns, please consult a qualified professional."
      ],
      keyPoints: [
        "Not for diagnosis",
        "Probabilistic results",
        "Consult professionals for health concerns"
      ]
    }
  ];

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

  const currentStepData = introductionSteps[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {introductionSteps.length}
            </span>
            <span className="text-sm text-gray-600">
              Research Introduction
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / introductionSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {currentStepData.title}
            </h1>
            
            <div className="space-y-4 mb-6">
              {currentStepData.content.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">Key Points:</h3>
              <ul className="space-y-2">
                {currentStepData.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">-</span>
                    <span className="text-blue-800">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {introductionSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentStep === introductionSteps.length - 1 ? 'Continue to Consent' : 'Next'}
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            This research follows ethical guidelines for human subjects research.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            If you have questions, please contact: research@pcms.example
          </p>
        </div>
      </div>
    </div>
  );
}
