'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  AdaptiveQuestionnaireEngine,
  ENGINE_HARD_CAP_TOTAL_QUESTIONS,
  ROUTING_WEIGHT_KEYS,
  type RoutingWeightKey,
} from '@/adaptive';
import {
  type AssessmentQuestion,
  getAssessmentQuestions,
  type QuestionResponse,
  type LikertResponse,
} from '@/data/questions';
import { loadQuestions } from '@/data/question-loader-browser';
import {
  buildScoringResultFromHistory,
  buildSessionRawFromHistory,
  createResearchQuestionResolver,
  runResearchPipeline,
  toStoredPipelineSession,
} from '@/lib/cognitive-pipeline';
import { computeEightConstructScores } from '@/scoring/eight-construct-scores';
import { parseStoredPipelineSession } from '@/lib/parse-pipeline-session';
import { readQuestionHistoryFromStorage } from '@/lib/question-history-storage';
import { dimensionsBelowConfidenceThreshold } from '@/lib/below-threshold-dimensions';
import { getDimensionUi } from '@/lib/cognitive-dimensions-ui';
import { formatUiString } from '@/lib/ui-strings';
import { useUiStrings } from '@/lib/use-ui-strings';
import { tagCoverageFromScoringResult } from '@/scoring';
import QuestionCard from '@/components/questionnaire/question-card';
import ProgressIndicator from '@/components/questionnaire/progress-indicator';
import LiveRefinementConfidence from '@/components/questionnaire/live-refinement-confidence';
import { appendEthicsAuditEvent } from '@/lib/ethics-audit';
import { seedConsentIfSkipMode } from '@/lib/ethics-flow-config';
import { Link } from '@/i18n/navigation';
import QuestionnaireOfflineTools from '@/components/questionnaire/QuestionnaireOfflineTools';
import { resolveQuestionDisplayText } from '@/lib/resolve-question-display-text';

function QuestionnaireSuspenseFallback() {
  const t = useTranslations('questionnaire');
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    </div>
  );
}

function QuestionnairePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionnaireSearchKey = searchParams?.toString() ?? '';
  const locale = useLocale();
  const tQ = useTranslations('questionnaire');
  const ui = useUiStrings();
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const [engine, setEngine] = useState<AdaptiveQuestionnaireEngine | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [, setRenderTick] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [bankError, setBankError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [uiMode, setUiMode] = useState<'initial' | 'refinement'>('initial');
  const [refinementProgressDims, setRefinementProgressDims] = useState<RoutingWeightKey[]>([]);
  const [refinementBadgeText, setRefinementBadgeText] = useState<string | null>(null);
  const persistAsRefinementRound = useRef(false);
  /** Prevents overlapping submits while async recording runs (engine clears currentQuestion until next is selected). */
  const responseInFlightRef = useRef(false);

  /** Mount-only bootstrap: do not depend on `ui` or the engine resets when flattened messages refresh mid-session. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadQuestions('universal');
        if (cancelled) return;

        const params = new URLSearchParams(
          typeof window !== 'undefined' ? window.location.search : ''
        );
        const mode = params.get('mode');
        const sessionQ = params.get('session');

        const eng = new AdaptiveQuestionnaireEngine();

        if (mode === 'refinement') {
          setResumeError(null);
          const storedSid = localStorage.getItem('pcms-session-id');
          if (sessionQ && storedSid && sessionQ !== storedSid) {
            setResumeError(uiRef.current['questionnaire.session_mismatch']);
            return;
          }

          const history = readQuestionHistoryFromStorage();
          if (history.length === 0) {
            setResumeError(uiRef.current['results.no_results_body']);
            return;
          }

          persistAsRefinementRound.current = true;

          const rawPipe = localStorage.getItem('pcms-pipeline-result');
          let belowFromPipe: RoutingWeightKey[] = [];
          if (rawPipe) {
            try {
              const parsed = parseStoredPipelineSession(JSON.parse(rawPipe));
              if (parsed) {
                belowFromPipe = dimensionsBelowConfidenceThreshold(parsed.scoringResult.confidenceComponents);
              }
            } catch {
              /* ignore */
            }
          }

          const scoringFromHistory = buildScoringResultFromHistory(
            history,
            eng.getState().culturalContext
          );
          const belowLive = dimensionsBelowConfidenceThreshold(scoringFromHistory.confidenceComponents);
          const mergedBelow: RoutingWeightKey[] = [...new Set([...belowFromPipe, ...belowLive])];
          const belowThreshold: RoutingWeightKey[] | undefined =
            mergedBelow.length > 0 ? mergedBelow : undefined;

          eng.resumeFrom(history, belowThreshold);
          const focus = eng.getRefinementFocusDimensions();
          const fallbackBelow = dimensionsBelowConfidenceThreshold(scoringFromHistory.confidenceComponents);
          const progressDims: RoutingWeightKey[] =
            focus && focus.length > 0
              ? [...focus]
              : fallbackBelow.length > 0
                ? fallbackBelow
                : [...ROUTING_WEIGHT_KEYS];

          setRefinementProgressDims(progressDims);
          const uiNow = uiRef.current;
          if (focus && focus.length > 0) {
            const titles = focus.map((d) => getDimensionUi(d, uiNow).title);
            setRefinementBadgeText(
              formatUiString(uiNow['questionnaire.refinement_badge'], { dims: titles.join(', ') })
            );
          } else {
            setRefinementBadgeText(uiNow['questionnaire.refinement_badge_generic']);
          }

          const next = eng.selectNextQuestion();
          if (!next) {
            router.replace('/results');
            return;
          }

          setUiMode('refinement');
          setEngine(eng);
          setCurrentQuestion(next);
          setQuestionNumber(history.length + 1);
          setQuestionStartTime(Date.now());
          return;
        }

        persistAsRefinementRound.current = false;
        setUiMode('initial');
        setRefinementBadgeText(null);
        setRefinementProgressDims([]);
        setEngine(eng);
        setCurrentQuestion(eng.selectNextQuestion());
        setQuestionNumber(1);
        setQuestionStartTime(Date.now());
      } catch (e) {
        if (!cancelled) {
          if (process.env.NODE_ENV === 'development' && e instanceof Error) {
            console.warn('[PCMS] question bank load failed', e);
          }
          setBankError(uiRef.current['questionnaire.load_failed']);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, questionnaireSearchKey]);

  useEffect(() => {
    if (seedConsentIfSkipMode(locale)) {
      appendEthicsAuditEvent({
        type: 'consent_flow_completed',
        meta: { consentVersion: '2.0', consentMode: 'skip', source: 'questionnaire_gate' },
      });
    }
    const consent = localStorage.getItem('pcms-consent-timestamp');
    if (!consent) {
      router.push('/consent');
      return;
    }
  }, [router, locale]);

  const persistPipelineAndNavigate = useCallback(
    async (eng: AdaptiveQuestionnaireEngine, finalState: ReturnType<AdaptiveQuestionnaireEngine['getState']>) => {
      const completionReason = finalState.completionReason ?? 'user_exit';
      const existingSid = localStorage.getItem('pcms-session-id') ?? `local_${Date.now()}`;
      if (!localStorage.getItem('pcms-session-id')) {
        localStorage.setItem('pcms-session-id', existingSid);
      }
      let nextRevision = 0;
      let pipelineSessionId = existingSid;
      const prevPipe = localStorage.getItem('pcms-pipeline-result');
      if (persistAsRefinementRound.current && prevPipe) {
        try {
          const prev = parseStoredPipelineSession(JSON.parse(prevPipe));
          if (prev?.sessionId) pipelineSessionId = prev.sessionId;
          nextRevision = (prev?.revision ?? 0) + 1;
        } catch {
          /* ignore */
        }
      }

      const resolve = createResearchQuestionResolver(finalState.culturalContext);
      const sessionRaw = buildSessionRawFromHistory(pipelineSessionId, finalState.questionHistory, resolve);
      const pipeline = await runResearchPipeline(sessionRaw, { targetDimension: 64 });
      const scoringResult = buildScoringResultFromHistory(
        finalState.questionHistory,
        finalState.culturalContext
      );
      const questionsById = new Map(
        getAssessmentQuestions('all', finalState.culturalContext).map((q) => [q.id, q])
      );
      const eightConstructScores = computeEightConstructScores(finalState.questionHistory, questionsById);
      const stored = toStoredPipelineSession(
        pipeline,
        finalState.questionHistory.length,
        undefined,
        scoringResult,
        {
          sessionId: pipelineSessionId,
          revision: nextRevision,
          eightConstructScores: eightConstructScores ?? undefined,
        }
      );

      localStorage.setItem('pcms-pipeline-result', JSON.stringify(stored));

      try {
        const { dataCollectionService } = await import('@/lib/data-collection');
        await dataCollectionService.saveFinalPipeline(stored, finalState.questionHistory, completionReason);
      } catch (error) {
        console.error('Error saving pipeline session:', error);
      }

      localStorage.setItem('pcms-question-history', JSON.stringify(finalState.questionHistory));
      localStorage.setItem('pcms-completion-reason', completionReason);

      if (completionReason === 'confidence_met') {
        const coreAnswered = finalState.questionHistory.filter((h) =>
          getAssessmentQuestions('core', finalState.culturalContext).some((q) => q.id === h.questionId)
        ).length;
        if (coreAnswered > 0 && coreAnswered < 15) {
          sessionStorage.setItem('pcms-sufficient-confidence-banner', '1');
        } else {
          sessionStorage.removeItem('pcms-sufficient-confidence-banner');
        }
      } else {
        sessionStorage.removeItem('pcms-sufficient-confidence-banner');
      }

      router.push('/results');
    },
    [router]
  );

  const handleResponse = useCallback(
    async (response: LikertResponse) => {
      if (!engine || !currentQuestion) return;
      if (responseInFlightRef.current) return;
      responseInFlightRef.current = true;

      setIsLoading(true);

      const respondedQuestion = currentQuestion;
      const responseTime = Date.now() - questionStartTime;
      const questionResponse: QuestionResponse = {
        questionId: respondedQuestion.id,
        response,
        timestamp: new Date(),
        responseTimeMs: responseTime,
      };

      try {
        const applied = engine.submitResponse(questionResponse);
        if (!applied) {
          return;
        }
        setRenderTick((n) => n + 1);
        const nextQuestion = engine.selectNextQuestion();

        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
          setQuestionNumber((prev) => prev + 1);
          setQuestionStartTime(Date.now());
        }

        try {
          const { dataCollectionService } = await import('@/lib/data-collection');
          await dataCollectionService.recordQuestionResponse(
            questionResponse,
            respondedQuestion.category || 'general',
            respondedQuestion.dimensionWeights
          );
        } catch (error) {
          console.error('Error recording response:', error);
        }

        if (!nextQuestion) {
          const finalState = engine.getState();
          await persistPipelineAndNavigate(engine, finalState);
        }
      } catch (error) {
        console.error('Error processing response:', error);
      } finally {
        responseInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [engine, currentQuestion, questionStartTime, persistPipelineAndNavigate]
  );

  const stats = engine?.getCompletionStats();

  const liveScoring =
    engine && uiMode === 'refinement'
      ? buildScoringResultFromHistory(engine.getState().questionHistory, engine.getState().culturalContext)
      : null;

  if (bankError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-lg rounded-lg bg-white p-6 text-center shadow-lg">
          <p className="text-red-700">{bankError}</p>
          <p className="mt-3 text-sm text-slate-600">{ui['field.bank_error_hint']}</p>
          <QuestionnaireOfflineTools strings={ui} />
          <button
            type="button"
            className="mt-4 min-h-11 text-blue-600 underline"
            onClick={() => router.push('/')}
          >
            {tQ('return_home')}
          </button>
          <p className="mt-4 text-xs">
            <Link href="/field-import" className="text-indigo-600 underline">
              {ui['field.paper_csv_link']}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (resumeError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
          <p className="text-gray-800">{resumeError}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => router.push('/results')}
          >
            {ui['results.page_title']}
          </button>
        </div>
      </div>
    );
  }

  if (!engine || !stats || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{tQ('loading')}</p>
        </div>
      </div>
    );
  }

  const totalQuestionsForCard =
    uiMode === 'refinement'
      ? ENGINE_HARD_CAP_TOTAL_QUESTIONS
      : stats.questionsAnswered + stats.estimatedQuestionsRemaining;

  const highlightDims =
    engine.getRefinementFocusDimensions() ?? (refinementProgressDims.length > 0 ? refinementProgressDims : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <QuestionnaireOfflineTools strings={ui} />
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tQ('page_title')}</h1>
          <p className="text-gray-600">{tQ('page_subtitle')}</p>
          {uiMode === 'refinement' && refinementBadgeText ? (
            <p className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-950">
              {refinementBadgeText}
            </p>
          ) : null}
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {liveScoring && uiMode === 'refinement' ? (
              <LiveRefinementConfidence
                tagCoverage={tagCoverageFromScoringResult(liveScoring)}
                highlightDimensions={highlightDims}
                strings={ui}
              />
            ) : null}
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{tQ('processing')}</p>
              </div>
            ) : (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                displayText={resolveQuestionDisplayText(currentQuestion, locale)}
                onResponse={handleResponse}
                questionNumber={questionNumber}
                totalQuestions={totalQuestionsForCard}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <ProgressIndicator
              mode={uiMode}
              targetDimensions={uiMode === 'refinement' ? refinementProgressDims : undefined}
              strings={ui}
              questionsAnswered={stats.questionsAnswered}
              estimatedQuestionsRemaining={stats.estimatedQuestionsRemaining}
              tagCoverage={stats.tagCoverage}
              averageTagCoverage={stats.averageTagCoverage}
            />

            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">{tQ('quick_stats_heading')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{tQ('stats_answered_label')}</span>
                  <span className="text-sm font-medium">{stats.questionsAnswered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{tQ('stats_avg_time_label')}</span>
                  <span className="text-sm font-medium">{tQ('stats_avg_time_value')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{tQ('stats_time_left_label')}</span>
                  <span className="text-sm font-medium">
                    {tQ('stats_time_left_value', { minutes: Math.ceil(stats.estimatedQuestionsRemaining * 0.5) })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">{tQ('help_heading')}</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• {tQ('help_bullet_1')}</p>
                <p>• {tQ('help_bullet_2')}</p>
                <p>• {tQ('help_bullet_3')}</p>
                <p>• {tQ('help_bullet_4')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(tQ('withdraw_confirm'))) {
                    localStorage.removeItem('pcms-consent-timestamp');
                    router.push('/');
                  }
                }}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {tQ('withdraw')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<QuestionnaireSuspenseFallback />}>
      <QuestionnairePageContent />
    </Suspense>
  );
}
