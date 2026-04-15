import { CANONICAL_TRAIT_EMBEDDING_DIM, TRAIT_DEFINITIONS, type TraitDefinition } from '@/core/traits/trait-definitions';
import { TRAIT_DOMAINS, TRAIT_DOMAIN_HEX, type TraitDomain } from '@/core/traits/trait-domains';

const DOMAIN_SET = new Set<string>(TRAIT_DOMAINS);

function l2Norm(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

function isNearlyUnit(v: number[], tol = 0.02): boolean {
  const n = l2Norm(v);
  return n > 1e-6 && Math.abs(n - 1) <= tol;
}

function coordsInUnitInterval(v: number[]): boolean {
  return v.every((x) => x >= -1e-9 && x <= 1 + 1e-9);
}

/**
 * Sanity checks for the trait catalog (duplicates, shape, normalization, domain labels).
 * Call from tests or tooling; safe to run at startup in CI.
 */
export function validateTraitSystem(defs: readonly TraitDefinition[] = TRAIT_DEFINITIONS): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seen = new Map<string, number>();

  for (const d of defs) {
    seen.set(d.id, (seen.get(d.id) ?? 0) + 1);
    if (!DOMAIN_SET.has(d.domain)) {
      errors.push(`Trait "${d.id}": unknown domain "${d.domain as string}"`);
    }
    if (d.mapping.length === 0) {
      errors.push(`Trait "${d.id}": mapping must have at least one pole`);
    }
    if (d.baseVector.length !== CANONICAL_TRAIT_EMBEDDING_DIM) {
      errors.push(
        `Trait "${d.id}": baseVector length ${d.baseVector.length} !== ${CANONICAL_TRAIT_EMBEDDING_DIM}`
      );
    }
    if (!coordsInUnitInterval(d.baseVector)) {
      errors.push(`Trait "${d.id}": baseVector coordinates should stay in [0,1] after lift`);
    }
    if (!isNearlyUnit(d.baseVector)) {
      errors.push(`Trait "${d.id}": baseVector L2 norm should be ~1 (got ${l2Norm(d.baseVector).toFixed(4)})`);
    }
  }

  for (const [id, c] of seen) {
    if (c > 1) errors.push(`Duplicate trait id: "${id}" (${c} definitions)`);
  }

  return { ok: errors.length === 0, errors };
}

/** Runtime guard: every domain key has a valid hex in the palette. */
export function validateTraitDomainColors(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const d of TRAIT_DOMAINS) {
    const domain = d as TraitDomain;
    const hex = TRAIT_DOMAIN_HEX[domain];
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
      errors.push(`Invalid hex for domain "${domain}"`);
    }
  }
  return { ok: errors.length === 0, errors };
}
