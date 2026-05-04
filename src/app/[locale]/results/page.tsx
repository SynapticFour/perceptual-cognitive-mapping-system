'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import type { CognitiveProfilePublic } from '@/types/profile-public';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { ENGINE_HARD_CAP_TOTAL_QUESTIONS } from '@/adaptive';
import CognitiveLandscapeGate from '@/components/results/CognitiveLandscapeGate';
import ResultsInterpretationSection from '@/components/results/ResultsInterpretationSection';
import ConfidenceSummaryBanner from '@/components/results/confidence-summary-banner';
import InsightCards from '@/components/results/insight-cards';
import {
  buildSharePayload,
  buildShareableResultsUrl,
  confidenceComponentsFromSharePayload,
  decodeLandscapeSharePayload,
  displayModelFromSharePayload,
  encodeLandscapeSharePayload,
  readShareEncodedPayloadFromWindow,
  type LandscapeSharePayload,
} from '@/lib/landscape-share-codec';
import { parseStoredPipelineSession } from '@/lib/parse-pipeline-session';
import { buildDimensionDisplayModel } from '@/lib/dimension-display';
import { readQuestionHistoryFromStorage } from '@/lib/question-history-storage';
import { formatUiString, type UiStrings } from '@/lib/ui-strings';
import { useUiStrings } from '@/lib/use-ui-strings';
import { loadQuestions } from '@/data/question-loader-browser';
import type { ConfidenceComponents } from '@/scoring';
import type { AssessmentContext } from '@/types/assessment-context';
import { readAssessmentContextFromStorage } from '@/types/assessment-context';
import EightConstructSummary from '@/components/results/EightConstructSummary';
import EthicsResultsBanner from '@/components/ethics/EthicsResultsBanner';
import ResultsAssentGate from '@/components/ethics/ResultsAssentGate';
import DeleteMyDataButton from '@/components/ethics/DeleteMyDataButton';
import { encodeProfileVectorCode } from '@/lib/sms-export';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { computeEarlySupportSignals } from '@/cohort';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import SupportInsightsSection from '@/components/cohort/SupportInsightsSection';
import { isSupabaseConfigured } from '@/lib/supabase';
import { appendEthicsAuditEvent } from '@/lib/ethics-audit';
import { seedConsentIfSkipMode } from '@/lib/ethics-flow-config';
import {
  buildFullSessionExportV1,
  buildResearchSessionZip,
  downloadUint8ArrayFile,
} from '@/lib/research-session-bundle';
import { isResearchModeActive } from '@/lib/adaptive-mode-resolution';
import ParticipantPrintSheet from '@/components/results/ParticipantPrintSheet';
import FacilitatorInsights from '@/components/results/FacilitatorInsights';
import type { FacilitatorDimensionScores } from '@/components/results/FacilitatorInsights';
import SiteFooter from '@/components/layout/SiteFooter';
import SelfNominationModule from '@/atlas/self-nomination/SelfNominationModule';
import SelfNominationResearchNote from '@/atlas/self-nomination/SelfNominationResearchNote';
import { persistSelfNomination } from '@/lib/atlas-self-nomination-persist';
import { putAtlasSelfNominationRow } from '@/lib/offline-storage';

const PIPELINE_STORAGE_KEY = 'pcms-pipeline-result';

function selfNominationStorageKey(sessionId: string): string {
  return `pcms-self-nomination-v1:${sessionId}`;
}

function publicProfileFromShare(payload: LandscapeSharePayload, ui: UiStrings): CognitiveProfilePublic {
  const cc = confidenceComponentsFromSharePayload(payload);
  const avgC =
    ROUTING_WEIGHT_KEYS.reduce((s, d) => s + cc[d].finalConfidence, 0) / ROUTING_WEIGHT_KEYS.length;
  return {
    summary: ui['landscape.url_profile.summary'],
    patterns: [],
    notes: [],
    confidence: avgC,
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const locale = useLocale();
  const ui = useUiStrings();
  const [session, setSession] = useState<StoredPipelineSession | null>(null);
  const [urlShare, setUrlShare] = useState<LandscapeSharePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentCtx, setAssessmentCtx] = useState<AssessmentContext | null>(null);
  const [needsAssent, setNeedsAssent] = useState(false);
  const [groupInsightsAvailable, setGroupInsightsAvailable] = useState(false);
  const [sufficientConfidenceBanner, setSufficientConfidenceBanner] = useState(false);
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [selfNomComplete, setSelfNomComplete] = useState(false);
  const [selfNomRecord, setSelfNomRecord] = useState<{
    ids: string[];
    explicitNone: boolean;
    skipped: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (seedConsentIfSkipMode(locale)) {
        appendEthicsAuditEvent({
          type: 'consent_flow_completed',
          meta: { consentVersion: '2.0', consentMode: 'skip', source: 'results_gate' },
        });
      }
      const consent = localStorage.getItem('pcms-consent-timestamp');
      if (!consent) {
        router.push('/consent');
        if (!cancelled) setLoading(false);
        return;
      }

      const p = readShareEncodedPayloadFromWindow(window.location.search, window.location.hash);
      const decoded = p ? decodeLandscapeSharePayload(p) : null;
      if (decoded && !cancelled) {
        setUrlShare(decoded);
      }

      const saved = localStorage.getItem(PIPELINE_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = parseStoredPipelineSession(JSON.parse(saved));
          if (!parsed) {
            router.push('/questionnaire');
            if (!cancelled) setLoading(false);
            return;
          }
          await loadQuestions('universal');
          if (!cancelled) {
            setSession(parsed);
            setUrlShare(null);
          }
        } catch (error) {
          console.error('Error loading pipeline result:', error);
          router.push('/questionnaire');
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (decoded) {
        if (!cancelled) setLoading(false);
        return;
      }

      router.push('/questionnaire');
      if (!cancelled) setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, locale]);

  useEffect(() => {
    if (loading) return;
    const hasData = session !== null || urlShare !== null;
    if (!hasData) return;
    const ctx = readAssessmentContextFromStorage();
    setAssessmentCtx(ctx);
    setNeedsAssent(!ctx);
  }, [loading, session, urlShare]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('groupInsights') === '1') {
      setGroupInsightsAvailable(true);
      return;
    }
    if (localStorage.getItem('pcms-show-group-insights') === '1') {
      setGroupInsightsAvailable(true);
      return;
    }
    if (process.env.NEXT_PUBLIC_PCMS_SHOW_COHORT_INSIGHTS === '1') {
      setGroupInsightsAvailable(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('pcms-sufficient-confidence-banner') === '1') {
      setSufficientConfidenceBanner(true);
      sessionStorage.removeItem('pcms-sufficient-confidence-banner');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !session?.sessionId) return;
    const raw = localStorage.getItem(selfNominationStorageKey(session.sessionId));
    if (!raw) return;
    try {
      const j = JSON.parse(raw) as {
        v?: number;
        selectedIds?: string[];
        explicitNone?: boolean;
        skipped?: boolean;
      };
      if (j.v !== 1) return;
      setSelfNomComplete(true);
      setSelfNomRecord({
        ids: Array.isArray(j.selectedIds) ? j.selectedIds : [],
        explicitNone: !!j.explicitNone,
        skipped: !!j.skipped,
      });
    } catch {
      /* ignore corrupt storage */
    }
  }, [session?.sessionId]);

  const confidenceComponents: ConfidenceComponents | null = useMemo(() => {
    if (session) return session.scoringResult.confidenceComponents;
    if (urlShare) return confidenceComponentsFromSharePayload(urlShare);
    return null;
  }, [session, urlShare]);

  const display = useMemo(() => {
    if (session && confidenceComponents) {
      const history = readQuestionHistoryFromStorage();
      return buildDimensionDisplayModel(history, 'universal', confidenceComponents);
    }
    if (urlShare) return displayModelFromSharePayload(urlShare);
    return null;
  }, [session, urlShare, confidenceComponents]);

  const viewProfile = useMemo((): CognitiveProfilePublic | null => {
    if (session) return session.publicProfile;
    if (urlShare) return publicProfileFromShare(urlShare, ui);
    return null;
  }, [session, urlShare, ui]);

  const cognitiveModel = useMemo(() => {
    if (!display || !confidenceComponents) return null;
    return buildCognitiveModel({
      embeddingVector: session?.embedding.vector ?? null,
      embeddingDimension: session?.embedding.dimension ?? 64,
      display,
      confidenceComponents,
    });
  }, [session, display, confidenceComponents]);

  const facilitatorScores: FacilitatorDimensionScores | null = useMemo(() => {
    if (!cognitiveModel) return null;
    const m = cognitiveModel.routingScores;
    return {
      F: Math.round((m.F ?? 0.5) * 100),
      P: Math.round((m.P ?? 0.5) * 100),
      S: Math.round((m.S ?? 0.5) * 100),
      E: Math.round((m.E ?? 0.5) * 100),
      R: Math.round((m.R ?? 0.5) * 100),
      C: Math.round((m.C ?? 0.5) * 100),
    };
  }, [cognitiveModel]);

  const supportSignals = useMemo(() => {
    if (!cognitiveModel) return [];
    return computeEarlySupportSignals(cognitiveModel, { maxSignals: 4 });
  }, [cognitiveModel]);

  const handleSelfNomComplete = useCallback(
    async (selectedIds: string[], options?: { explicitNone?: boolean }) => {
      if (!session?.sessionId || typeof window === 'undefined') return;
      const browserKey = localStorage.getItem('pcms-session-id') ?? session.sessionId;
      const explicitNone = !!options?.explicitNone;
      await persistSelfNomination({
        locale: String(locale),
        browserSessionKey: browserKey,
        linkedPcmsSessionId: session.sessionId,
        selectedDescriptorIds: selectedIds,
        explicitNone,
      });
      localStorage.setItem(
        selfNominationStorageKey(session.sessionId),
        JSON.stringify({
          v: 1,
          selectedIds,
          explicitNone,
          skipped: false,
          completedAt: new Date().toISOString(),
        })
      );
      setSelfNomRecord({ ids: selectedIds, explicitNone, skipped: false });
      setSelfNomComplete(true);
    },
    [locale, session]
  );

  const handleSelfNomSkip = useCallback(async () => {
    if (!session?.sessionId || typeof window === 'undefined') {
      setSelfNomComplete(true);
      return;
    }
    const browserKey = localStorage.getItem('pcms-session-id') ?? session.sessionId;
    await putAtlasSelfNominationRow({
      sessionId: browserKey,
      locale: String(locale),
      selectedDescriptorIds: [],
      explicitNone: false,
      skipped: true,
      completedAt: new Date().toISOString(),
    });
    localStorage.setItem(
      selfNominationStorageKey(session.sessionId),
      JSON.stringify({
        v: 1,
        selectedIds: [],
        explicitNone: false,
        skipped: true,
        completedAt: new Date().toISOString(),
      })
    );
    setSelfNomRecord({ ids: [], explicitNone: false, skipped: true });
    setSelfNomComplete(true);
  }, [locale, session]);

  const handleRestart = useCallback(() => {
    localStorage.removeItem(PIPELINE_STORAGE_KEY);
    localStorage.removeItem('pcms-question-history');
    router.push('/questionnaire');
  }, [router]);

  const handleContinueAssessment = useCallback(() => {
    const sid = localStorage.getItem('pcms-session-id');
    const q = new URLSearchParams({ mode: 'refinement' });
    if (sid) q.set('session', sid);
    router.push(`/questionnaire?${q.toString()}`);
  }, [router]);

  const handleShare = useCallback(() => {
    if (isResearchModeActive(session)) return;
    if (!session || !display || !confidenceComponents) return;

    const payload = buildSharePayload(display, confidenceComponents, session.completedAt);
    const encoded = encodeLandscapeSharePayload(payload);
    const href = typeof window !== 'undefined' ? window.location.href : 'http://localhost/results';
    const built = buildShareableResultsUrl(href, encoded);
    if (!built.ok) {
      alert(ui['results.share_url_too_long']);
      return;
    }
    const shareUrl = built.url;

    if (navigator.share) {
      void navigator.share({
        title: ui['results.share_title'],
        text: ui['results.share_text'],
        url: shareUrl,
      });
    } else {
      void navigator.clipboard.writeText(shareUrl);
      alert(ui['results.share_copied']);
    }
  }, [session, display, confidenceComponents, ui]);

  const handleDownload = useCallback(() => {
    if (!session) return;

    const dataStr = JSON.stringify(session, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = formatUiString(ui['results.download_filename'], {
      date: new Date().toISOString().split('T')[0],
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [session, ui]);

  const handleDownloadFullSession = useCallback(() => {
    if (!session) return;
    const history = readQuestionHistoryFromStorage();
    if (history.length === 0) {
      window.alert(ui['results.download_full_session_no_history']);
      return;
    }
    const payload = buildFullSessionExportV1(session, history);
    const dataStr = JSON.stringify(payload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = formatUiString(ui['results.download_full_session_filename'], {
      date: new Date().toISOString().split('T')[0],
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [session, ui]);

  const handleResearchBundle = useCallback(async () => {
    if (!session) return;
    const history = readQuestionHistoryFromStorage();
    if (history.length === 0) {
      window.alert(ui['results.research_bundle_no_history']);
      return;
    }
    let bankItemCount = history.length;
    try {
      const { getAssessmentQuestions } = await import('@/data/questions');
      bankItemCount = getAssessmentQuestions('all', 'universal').length;
    } catch {
      /* question bank not loaded in memory */
    }
    const zip = await buildResearchSessionZip({
      stored: session,
      history,
      locale: String(locale),
      consentTimestamp: typeof window !== 'undefined' ? localStorage.getItem('pcms-consent-timestamp') : null,
      bankItemCount,
    });
    downloadUint8ArrayFile(zip, `pcms-research-${session.sessionId ?? 'session'}.zip`);
  }, [session, locale, ui]);

  const handleCopySmsCode = useCallback(() => {
    if (isResearchModeActive(session)) return;
    if (!display) return;
    const code = encodeProfileVectorCode(display.rawPercent);
    void navigator.clipboard.writeText(code).then(
      () => {
        alert(ui['results.sms_code_copied']);
      },
      () => {
        alert(code);
      }
    );
  }, [display, session, ui]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden />
          <p className="text-gray-600">{ui['results.loading']}</p>
        </div>
      </div>
    );
  }

  if (!display || !confidenceComponents || !viewProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{ui['results.no_results_title']}</h2>
          <p className="text-gray-600 mb-6">{ui['results.no_results_body']}</p>
          <button
            type="button"
            onClick={() => router.push('/questionnaire')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {ui['results.start_questionnaire']}
          </button>
        </div>
      </div>
    );
  }

  if (needsAssent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <ResultsAssentGate
          onComplete={(c) => {
            setAssessmentCtx(c);
            setNeedsAssent(false);
          }}
        />
      </div>
    );
  }

  const showMaxLengthNotice = (session?.responseCount ?? 0) >= ENGINE_HARD_CAP_TOTAL_QUESTIONS;
  const responseCount = session?.responseCount ?? 0;
  const completedAt = session?.completedAt ?? urlShare?.completedAt ?? new Date().toISOString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <main id="main-content" className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <EthicsResultsBanner context={assessmentCtx} />
        {sufficientConfidenceBanner ? (
          <p
            className="mx-auto mb-6 max-w-3xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-950"
            role="status"
          >
            {ui['results.sufficient_confidence_banner']}
          </p>
        ) : null}
        {viewProfile ? (
          <ParticipantPrintSheet
            profile={viewProfile}
            responseCount={responseCount}
            completedLabel={new Date(completedAt).toLocaleDateString()}
            strings={ui}
          />
        ) : null}
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-4xl">{ui['results.page_title']}</h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base" suppressHydrationWarning>
            {formatUiString(ui['results.page_subtitle'], {
              count: responseCount,
              date: new Date(completedAt).toLocaleDateString(),
            })}
          </p>
          {session && (session.revision ?? 0) > 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              {formatUiString(ui['results.revision_notice'], { n: session.revision ?? 0 })}
            </p>
          ) : null}
        </header>

        <p
          className="mx-auto mb-6 max-w-3xl rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm leading-relaxed text-slate-800 shadow-sm"
          role="note"
        >
          {ui['results.public_map_disclaimer']}
        </p>

        {showMaxLengthNotice ? (
          <p
            className="mx-auto mb-6 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
            role="status"
          >
            {ui['results.max_length_notice']}
          </p>
        ) : null}

        <div className="mb-6 flex max-w-full flex-wrap items-center justify-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:shadow-md sm:px-6"
          >
            {session ? ui['results.retake'] : ui['results.start_questionnaire']}
          </button>
          <DeleteMyDataButton sessionId={session?.sessionId ?? null} variant="prominent" />
          {session ? (
            <>
              {!isResearchModeActive(session) ? (
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 sm:px-6"
                >
                  {ui['results.share']}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleDownload}
                className="min-h-11 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-purple-700 sm:px-6"
              >
                {ui['results.download']}
              </button>
              <button
                type="button"
                onClick={handleDownloadFullSession}
                className="min-h-11 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-950 shadow-sm hover:bg-purple-100 sm:px-6"
              >
                {ui['results.download_full_session']}
              </button>
              <button
                type="button"
                onClick={() => void handleResearchBundle()}
                className="min-h-11 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-900 sm:px-6"
              >
                {ui['results.research_bundle']}
              </button>
            </>
          ) : null}
          {display && !isResearchModeActive(session) ? (
            <button
              type="button"
              onClick={handleCopySmsCode}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 sm:px-6"
            >
              {ui['results.sms_code_copy']}
            </button>
          ) : null}
          {FEATURE_FLAGS.FACILITATOR_VIEW && facilitatorScores ? (
            <button
              type="button"
              onClick={() => setShowFacilitator((v) => !v)}
              className="rounded-lg border border-teal-600 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-950 shadow-sm hover:bg-teal-100 sm:px-6"
              aria-pressed={showFacilitator}
            >
              {showFacilitator ? ui['facilitator.toggle_hide'] : ui['facilitator.toggle_show']}
            </button>
          ) : null}
        </div>

        <div className="mb-6">
          <ConfidenceSummaryBanner
            confidenceComponents={confidenceComponents}
            strings={ui}
            onContinueAssessment={session ? handleContinueAssessment : undefined}
          />
        </div>

        {groupInsightsAvailable ? (
          <div className="mb-6 text-center">
            <Link
              href="/cohort-insights"
              className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-900 shadow-sm hover:bg-indigo-100"
            >
              {ui['results.group_insights_link']}
            </Link>
            <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-600">{ui['results.group_insights_hint']}</p>
          </div>
        ) : null}

        {display ? (
          <div className="mb-6 text-center">
            <Link
              href="/group-cognitive-analysis"
              className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {ui['results.group_analysis_link']}
            </Link>
            <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-600">{ui['results.group_analysis_hint']}</p>
          </div>
        ) : null}

        {session ? (
          <section
            className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            aria-labelledby="session-overview-heading"
          >
            <h2 id="session-overview-heading" className="text-lg font-semibold text-slate-900">
              {ui['results.overview_heading']}
            </h2>
            <p className="sr-only">{ui['results.overview_sr_only_lang']}</p>
            <div lang="en" className="mt-2">
              <p className="text-sm leading-relaxed text-slate-800 sm:text-base">{session.publicProfile.summary}</p>
              <h3 className="mt-4 text-sm font-semibold text-slate-800">{ui['results.patterns_heading']}</h3>
              {session.publicProfile.patterns.length ? (
                <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                  {session.publicProfile.patterns.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{ui['results.patterns_empty']}</p>
              )}
              <h3 className="mt-4 text-sm font-semibold text-slate-800">{ui['results.notes_heading']}</h3>
              {session.publicProfile.notes.length ? (
                <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                  {session.publicProfile.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{ui['results.notes_empty']}</p>
              )}
            </div>
          </section>
        ) : null}

        {session?.eightConstructScores ? (
          <EightConstructSummary outcome={session.eightConstructScores} strings={ui} />
        ) : null}

        <div className="mb-10 max-w-full">
          <CognitiveLandscapeGate
            profile={viewProfile}
            confidenceComponents={confidenceComponents}
            display={display}
            strings={ui}
            embeddingVector={session?.embedding.vector ?? null}
            embeddingDimension={session?.embedding.dimension ?? 64}
            shareCompletedAt={session?.completedAt ?? urlShare?.completedAt}
            jsonExportExtra={
              session
                ? {
                    pipelineVersion: session.version,
                    responseCount: session.responseCount,
                    completedAt: session.completedAt,
                  }
                : { source: 'url_share', completedAt }
            }
          />
        </div>

        <ResultsInterpretationSection display={display} />

        {session && supportSignals.length > 0 ? (
          <SupportInsightsSection signals={supportSignals} strings={ui} />
        ) : null}

        {session ? (
          <div className="mb-10 max-w-full">
            <InsightCards
              confidenceComponents={session.scoringResult.confidenceComponents}
              display={display}
              strings={ui}
            />
          </div>
        ) : null}

        {facilitatorScores ? (
          <FacilitatorInsights
            profile={viewProfile}
            locale={String(locale)}
            dimensionScores={facilitatorScores}
            showFacilitatorView={showFacilitator}
          />
        ) : null}

        {FEATURE_FLAGS.ATLAS_SELF_NOMINATION && session && !urlShare && !selfNomComplete ? (
          <SelfNominationModule
            locale={String(locale)}
            linkedSessionId={session.sessionId}
            onComplete={(ids, opts) => void handleSelfNomComplete(ids, opts)}
            onSkip={() => void handleSelfNomSkip()}
          />
        ) : null}

        {FEATURE_FLAGS.ATLAS_SELF_NOMINATION &&
        FEATURE_FLAGS.VALIDATION_STATUS_BANNER &&
        selfNomRecord &&
        session &&
        !urlShare ? (
          <div className="mx-auto mb-10 max-w-5xl">
            <SelfNominationResearchNote
              session={session}
              selectedDescriptorIds={selfNomRecord.ids}
              explicitNone={selfNomRecord.explicitNone}
              skipped={selfNomRecord.skipped}
            />
          </div>
        ) : null}

        <section
          className="rounded-lg bg-white p-6 shadow-lg sm:p-8"
          aria-labelledby="research-heading"
        >
          <h2 id="research-heading" className="mb-4 text-center text-xl font-semibold sm:text-2xl">
            {ui['results.research_heading']}
          </h2>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-6 text-sm text-gray-600 sm:text-base">{ui['results.research_body']}</p>
            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-blue-600">{responseCount}</div>
                <div className="text-sm text-gray-600">{ui['results.research_questions_label']}</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-green-600">
                  {Math.round(viewProfile.confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">{ui['results.research_interpretation_confidence']}</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-purple-600">
                  {session ? Math.round(session.embedding.confidence * 100) : '—'}
                </div>
                <div className="text-sm text-gray-600">{ui['results.research_embedding_confidence']}</div>
              </div>
            </div>
            {isSupabaseConfigured() ? (
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-800">{ui['results.research_consent_note']}</p>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-700">{ui['results.research_consent_local_only']}</p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-12 space-y-4 text-center text-sm text-gray-600">
          <SiteFooter className="pb-2" />
          <p className="mb-2">{ui['results.footer_line1']}</p>
          <p>{ui['results.footer_line2']}</p>
        </footer>
      </main>
    </div>
  );
}
