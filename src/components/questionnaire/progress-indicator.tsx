'use client';

import { ROUTING_WEIGHT_KEYS, type TagCoverageVector } from '@/adaptive/coverage-model';
import type { RoutingWeightKey } from '@/adaptive/routing-tags';
import { getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import type { UiStrings } from '@/lib/ui-strings';

const BAND_COLORS = [
  'bg-slate-500',
  'bg-slate-600',
  'bg-slate-700',
  'bg-indigo-500',
  'bg-indigo-600',
  'bg-indigo-700',
  'bg-teal-500',
  'bg-teal-600',
  'bg-amber-500',
  'bg-amber-600',
];

const CONFIDENCE_GOAL = 0.75;

interface ProgressIndicatorProps {
  mode?: 'initial' | 'refinement';
  /** Routing dimensions currently prioritised (refinement); defaults to all below goal when omitted. */
  targetDimensions?: readonly RoutingWeightKey[];
  strings?: UiStrings;
  questionsAnswered: number;
  estimatedQuestionsRemaining: number;
  tagCoverage: TagCoverageVector;
  averageTagCoverage: number;
}

export default function ProgressIndicator({
  mode = 'initial',
  targetDimensions,
  strings,
  questionsAnswered,
  estimatedQuestionsRemaining,
  tagCoverage,
  averageTagCoverage,
}: ProgressIndicatorProps) {
  const refinementPool =
    targetDimensions && targetDimensions.length > 0
      ? targetDimensions
      : ROUTING_WEIGHT_KEYS.filter((k) => tagCoverage[k] < CONFIDENCE_GOAL);

  const refinementGoalProgress =
    refinementPool.length > 0
      ? refinementPool.reduce((acc, k) => acc + Math.min(1, tagCoverage[k] / CONFIDENCE_GOAL), 0) /
        refinementPool.length
      : 1;

  const completionPercentage =
    mode === 'refinement'
      ? Math.min(100, refinementGoalProgress * 100)
      : Math.min(
          100,
          (questionsAnswered / Math.max(1, questionsAnswered + estimatedQuestionsRemaining)) * 100
        );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Assessment Progress</h3>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {mode === 'refinement' ? 'Confidence toward goal' : 'Overall Progress'}
          </span>
          <span className="text-sm text-gray-500">{Math.round(completionPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {mode === 'refinement' ? (
            <>
              <span>Confidence reached (vs {Math.round(CONFIDENCE_GOAL * 100)}% goal)</span>
              <span>~{estimatedQuestionsRemaining} question slots left</span>
            </>
          ) : (
            <>
              <span>{questionsAnswered} questions answered</span>
              <span>~{estimatedQuestionsRemaining} remaining</span>
            </>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">Information coverage</span>
          <span className="text-sm font-medium text-green-600">
            {Math.round(averageTagCoverage * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${averageTagCoverage * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Coverage reflects how many prompts have touched each routing band (internal bookkeeping, not a clinical score).
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {mode === 'refinement' ? 'Target dimensions vs goal' : 'Per-band coverage'}
        </h4>
        <div className="space-y-2">
          {(mode === 'refinement' && refinementPool.length > 0 ? refinementPool : [...ROUTING_WEIGHT_KEYS]).map(
            (tag, i) => {
              const confidence = tagCoverage[tag];
              const color = BAND_COLORS[ROUTING_WEIGHT_KEYS.indexOf(tag)] ?? BAND_COLORS[i] ?? 'bg-gray-500';
              const label =
                mode === 'refinement' && strings
                  ? getDimensionUi(tag, strings).shortLabel
                  : `Band ${ROUTING_WEIGHT_KEYS.indexOf(tag) + 1}`;
              const vsGoal = Math.min(100, (confidence / CONFIDENCE_GOAL) * 100);
              return (
                <div key={tag} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm text-gray-700 w-28 truncate" title={label}>
                      {label}
                    </span>
                  </div>
                  <div className="flex-1">
                    {mode === 'refinement' ? (
                      <div className="relative w-full rounded-full bg-gray-200 h-2">
                        <div
                          className={`${color} relative z-[1] h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${vsGoal}%` }}
                        />
                        <div
                          className="pointer-events-none absolute inset-y-0 left-[75%] z-[2] w-px bg-amber-500"
                          aria-hidden
                        />
                      </div>
                    ) : (
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${confidence * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 w-14 text-right tabular-nums">
                    {Math.round(confidence * 100)}%
                    {mode === 'refinement' ? (
                      <span className="block text-[10px] text-amber-700">/{Math.round(CONFIDENCE_GOAL * 100)}%</span>
                    ) : null}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            {averageTagCoverage < 0.5 && (
              <p>Keep going! We&apos;re still gathering enough diverse responses for a stable summary.</p>
            )}
            {averageTagCoverage >= 0.5 && averageTagCoverage < 0.7 && (
              <p>Good progress — coverage is building across routing bands.</p>
            )}
            {averageTagCoverage >= 0.7 && (
              <p>Strong coverage — you can finish soon with a well-supported pipeline output.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
