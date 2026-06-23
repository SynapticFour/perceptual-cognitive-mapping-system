import { NextResponse } from 'next/server';
import { ROUTING_WEIGHT_KEYS } from '@/adaptive/routing-tags';
import { buildCohortCognitiveMap } from '@/cohort/cohort-cognitive-map';
import { buildCognitiveModel } from '@/core/cognitive-pipeline';
import type { DimensionDisplayModel } from '@/lib/dimension-display';
import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import type { ConfidenceComponents } from '@/scoring';

const MAX_MEMBERS = 48;
const MIN_MEMBERS = 2;

type AggregateMemberInput = {
  routingPercent: Partial<Record<(typeof COGNITIVE_DIMENSION_KEYS)[number], number>>;
};

function isValidMember(m: unknown): m is AggregateMemberInput {
  if (!m || typeof m !== 'object') return false;
  const rp = (m as AggregateMemberInput).routingPercent;
  if (!rp || typeof rp !== 'object') return false;
  return COGNITIVE_DIMENSION_KEYS.some((k) => typeof rp[k] === 'number' && Number.isFinite(rp[k]));
}

function displayFromRouting(rp: AggregateMemberInput['routingPercent']): DimensionDisplayModel {
  const rawPercent = Object.fromEntries(
    ROUTING_WEIGHT_KEYS.map((d) => [d, typeof rp[d] === 'number' ? rp[d]! : 50])
  ) as DimensionDisplayModel['rawPercent'];
  return {
    rawPercent,
    weightedPercent: { ...rawPercent },
    itemsContributing: Object.fromEntries(ROUTING_WEIGHT_KEYS.map((d) => [d, 0])) as DimensionDisplayModel['itemsContributing'],
  };
}

function neutralConfidence(): ConfidenceComponents {
  return Object.fromEntries(
    ROUTING_WEIGHT_KEYS.map((d) => [
      d,
      {
        effectiveEvidence: 0.5,
        reliability: 0.5,
        consistency: 0.8,
        finalConfidence: 0.5,
        meetsMinimumSample: false,
      },
    ])
  ) as ConfidenceComponents;
}

/**
 * POST /api/cohort/aggregate
 * Privacy-tier: accepts only anonymous routing vectors; returns pooled cohort metrics.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  if (!Array.isArray(o.members)) {
    return NextResponse.json({ error: 'members_required' }, { status: 400 });
  }
  for (const key of Object.keys(o)) {
    if (key !== 'members') {
      return NextResponse.json({ error: 'only_members_allowed' }, { status: 400 });
    }
  }
  const members = o.members;
  if (members.length < MIN_MEMBERS || members.length > MAX_MEMBERS) {
    return NextResponse.json({ error: 'member_count_out_of_range' }, { status: 400 });
  }
  if (!members.every(isValidMember)) {
    return NextResponse.json({ error: 'invalid_member_shape' }, { status: 400 });
  }

  const models = members.map((m) => {
    const display = displayFromRouting(m.routingPercent);
    return buildCognitiveModel({
      display,
      confidenceComponents: neutralConfidence(),
      embeddingVector: [],
      embeddingDimension: 32,
    });
  });
  const cohort = buildCohortCognitiveMap(models);

  return NextResponse.json({
    aggregateOnly: true,
    memberCount: members.length,
    diversityIndex: cohort.diversityIndex,
    regionBalance: cohort.regionBalance,
    dominantTraits: cohort.dominantTraits,
    spreadMetrics: cohort.spreadMetrics,
    regionCount: cohort.regions.length,
  });
}
