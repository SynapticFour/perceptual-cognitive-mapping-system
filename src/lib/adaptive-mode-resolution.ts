/**
 * Single source of truth for which adaptive selection policy is active.
 *
 * **Scoring-based routing (`routing_coverage`):**
 * `CoverageModel.coverageVectorFromResponses` uses `ScoringModel` / `calculateResearchConfidence`:
 * per F–V tag value = `finalConfidence` (evidence + Bayesian shrinkage + response consistency). The engine
 * uses this vector as `routingCoverage()` for thresholds and for the legacy core-score gap term.
 *
 * **Profile-based diagnostics (`profile_diagnostic`):**
 * `computeProfileAdaptiveSnapshot` builds per-dimension `mean01`, `variance01`, `contradiction01`, and
 * `confidence01` from within-session response patterns (reverse-split contradiction when possible).
 * The engine adds `profileCoreQuestionBoost` / `profileRefinementQuestionBoost` on top of legacy scores,
 * and may stop refinement using `sessionConfidence` / diminishing returns — orthogonal to the
 * scoring-model vector above. Do not conflate the two "confidences" in scientific reporting.
 */
export type ResolvedAdaptiveMode = 'routing_coverage' | 'profile_diagnostic';

export type AdaptiveModeResolution = {
  adaptiveMode: ResolvedAdaptiveMode;
  /** When true, `adaptiveMode` is forced to `profile_diagnostic` and lossy share flows should be disabled in UI. */
  researchMode: boolean;
  /** Whether `NEXT_PUBLIC_PCMS_ADAPTIVE_MODE` was set to a recognised value (not research override). */
  explicitEnvToken: boolean;
};

function parseResearchMode(): boolean {
  const v = process.env.NEXT_PUBLIC_PCMS_RESEARCH_MODE?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Resolves adaptive policy from env + optional constructor override.
 * Emits a **runtime warning** when neither research mode nor an explicit env token selects the policy
 * (falls back to `routing_coverage`), so deployments cannot claim ambiguity unknowingly.
 */
export function resolveAdaptiveModeResolution(
  configOverride?: Partial<{ adaptiveMode: ResolvedAdaptiveMode; researchMode?: boolean }>
): AdaptiveModeResolution {
  const researchMode = parseResearchMode() || configOverride?.researchMode === true;
  if (researchMode) {
    return { adaptiveMode: 'profile_diagnostic', researchMode: true, explicitEnvToken: false };
  }
  if (configOverride?.adaptiveMode) {
    return { adaptiveMode: configOverride.adaptiveMode, researchMode: false, explicitEnvToken: false };
  }
  const raw = process.env.NEXT_PUBLIC_PCMS_ADAPTIVE_MODE?.trim().toLowerCase();
  if (raw === 'profile_diagnostic' || raw === 'profile') {
    return { adaptiveMode: 'profile_diagnostic', researchMode: false, explicitEnvToken: true };
  }
  if (raw === 'routing_coverage' || raw === 'routing' || raw === 'legacy') {
    return { adaptiveMode: 'routing_coverage', researchMode: false, explicitEnvToken: true };
  }
  const suppress =
    process.env.VITEST === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_PCMS_SUPPRESS_ADAPTIVE_MODE_WARN === '1';
  if (!suppress && typeof console !== 'undefined') {
    console.warn(
      '[PCMS] NEXT_PUBLIC_PCMS_ADAPTIVE_MODE is not set to an explicit token (routing_coverage | profile_diagnostic). ' +
        'Defaulting to routing_coverage. Set the env var (or NEXT_PUBLIC_PCMS_RESEARCH_MODE=1) for reproducible studies.'
    );
  }
  return { adaptiveMode: 'routing_coverage', researchMode: false, explicitEnvToken: false };
}

export function isResearchModeEnv(): boolean {
  return parseResearchMode();
}

/**
 * Use for gating lossy share / SMS flows: deployment flag **or** a persisted research session
 * (e.g. ZIP re-import) must both be respected so analysis mode is not env-only.
 */
export function isResearchModeActive(session?: { researchMode?: boolean } | null): boolean {
  return isResearchModeEnv() || session?.researchMode === true;
}
