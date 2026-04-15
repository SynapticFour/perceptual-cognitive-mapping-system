// RESEARCH-GRADE: Assessment Versioning System for Research Integrity

import { isRecord } from './type-guards';
import { COGNITIVE_DIMENSION_KEYS } from '@/model/cognitive-dimensions';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';

function isLegacySixDProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const v = value.vector;
  const c = value.confidence;
  if (!isRecord(v) || !isRecord(c)) return false;
  const keys = ['F', 'P', 'S', 'E', 'R', 'C'];
  return keys.every((k) => typeof v[k] === 'number' && typeof c[k] === 'number');
}

function isTenDimensionRoutingSnapshot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const v = value.vector;
  const c = value.confidence;
  if (!isRecord(v) || !isRecord(c)) return false;
  return COGNITIVE_DIMENSION_KEYS.every((k) => typeof v[k] === 'number' && typeof c[k] === 'number');
}

function isPipelineStoredSession(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.version !== PIPELINE_STORAGE_VERSION) return false;
  const sr = value.scoringResult;
  if (!isRecord(sr) || !isRecord(sr.confidenceComponents)) return false;
  return (
    typeof value.completedAt === 'string' &&
    typeof value.responseCount === 'number' &&
    isRecord(value.publicProfile) &&
    isRecord(value.embedding) &&
    isRecord(value.featureHighlights)
  );
}

export interface AssessmentVersion {
  version: string;
  name: string;
  description: string;
  releaseDate: string;
  deprecated: boolean;
  changes: string[];
  compatibility: {
    minCompatibleVersion: string;
    maxCompatibleVersion: string;
  };
  researchMetrics: {
    totalAssessments: number;
    averageCompletionTime: number;
    completionRate: number;
    reliabilityScore: number;
  };
}

export class AssessmentVersionManager {
  private static readonly CURRENT_VERSION = "v1.0";
  private static readonly VERSION_HISTORY: AssessmentVersion[] = [
    {
      version: "v1.0",
      name: "Research-Grade Adaptive Assessment",
      description: "Initial research-grade implementation with adaptive questioning, confidence-based stopping, and structured data collection",
      releaseDate: "2026-04-12",
      deprecated: false,
      changes: [
        "Implemented 15 core questions with balanced dimensional coverage",
        "Added 12 refinement questions for targeted confidence building",
        "CTT-style weighted evidence confidence with consistency penalty (see docs/confidence-model.md)",
        "Adaptive engine with phase-based progression (core -> refinement)",
        "Structured data collection with question path tracking",
        "Dynamic insights generation with personalized recommendations",
        "Assessment versioning for research integrity"
      ],
      compatibility: {
        minCompatibleVersion: "v1.0",
        maxCompatibleVersion: "v1.0"
      },
      researchMetrics: {
        totalAssessments: 0,
        averageCompletionTime: 0,
        completionRate: 0,
        reliabilityScore: 0
      }
    }
  ];

  /**
   * Get current assessment version
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Get version information for a specific version
   */
  static getVersionInfo(version: string): AssessmentVersion | null {
    return this.VERSION_HISTORY.find(v => v.version === version) || null;
  }

  /**
   * Get all version history
   */
  static getVersionHistory(): AssessmentVersion[] {
    return [...this.VERSION_HISTORY];
  }

  /**
   * Check if a version is compatible with current version
   */
  static isVersionCompatible(version: string): boolean {
    const currentInfo = this.getVersionInfo(this.CURRENT_VERSION);
    const versionInfo = this.getVersionInfo(version);
    
    if (!currentInfo || !versionInfo) return false;
    
    return version >= currentInfo.compatibility.minCompatibleVersion && 
           version <= currentInfo.compatibility.maxCompatibleVersion;
  }

  /**
   * Validate assessment data for version compatibility
   */
  static validateAssessmentData(data: unknown, expectedVersion?: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isRecord(data)) {
      errors.push('Assessment data must be an object');
      return { isValid: false, errors, warnings };
    }

    const version =
      expectedVersion ||
      (typeof data.assessment_version === 'string' ? data.assessment_version : undefined);

    if (!version) {
      errors.push("Missing assessment version");
      return { isValid: false, errors, warnings };
    }

    const versionInfo = this.getVersionInfo(version);
    if (!versionInfo) {
      errors.push(`Unknown assessment version: ${version}`);
      return { isValid: false, errors, warnings };
    }

    if (versionInfo.deprecated) {
      warnings.push(`Using deprecated version: ${version}`);
    }

    // Validate required fields for current version
    if (version === "v1.0") {
      const requiredFields = [
        'session_id',
        'assessment_version', 
        'timestamp',
        'duration_ms',
        'question_path',
        'responses',
        'final_profile',
        'completion_status',
        'cultural_context'
      ];

      for (const field of requiredFields) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      const finalProfile = data.final_profile;
      if (finalProfile !== undefined) {
        if (
          !isRecord(finalProfile) ||
          (!isLegacySixDProfile(finalProfile) &&
            !isTenDimensionRoutingSnapshot(finalProfile) &&
            !isPipelineStoredSession(finalProfile))
        ) {
          errors.push(
            'Invalid final_profile structure (expected pipeline stored session, legacy 6D snapshot, or 10D routing snapshot)'
          );
        }
      }

      if (data.responses !== undefined && !Array.isArray(data.responses)) {
        errors.push("Responses must be an array");
      }

      if (data.question_path !== undefined && !Array.isArray(data.question_path)) {
        errors.push("Question path must be an array");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Migrate assessment data from older versions
   */
  static migrateAssessmentData(data: unknown, fromVersion: string, toVersion: string): unknown {
    if (fromVersion === toVersion) return data;

    // Migration logic for future versions
    // For now, v1.0 is the first version, so no migration needed
    if (fromVersion === "v1.0" && toVersion === "v1.0") {
      return data;
    }

    throw new Error(`Migration from ${fromVersion} to ${toVersion} not yet implemented`);
  }

  /**
   * Update research metrics for a version
   */
  static updateResearchMetrics(version: string, metrics: Partial<AssessmentVersion['researchMetrics']>): void {
    const versionInfo = this.getVersionInfo(version);
    if (versionInfo) {
      Object.assign(versionInfo.researchMetrics, metrics);
    }
  }

  /**
   * Get version comparison for research analysis
   */
  static compareVersions(version1: string, version2: string): {
    version1Info: AssessmentVersion | null;
    version2Info: AssessmentVersion | null;
    compatibility: 'compatible' | 'incompatible' | 'unknown';
    changes: string[];
  } {
    const v1Info = this.getVersionInfo(version1);
    const v2Info = this.getVersionInfo(version2);
    
    let compatibility: 'compatible' | 'incompatible' | 'unknown' = 'unknown';
    
    if (v1Info && v2Info) {
      compatibility = this.isVersionCompatible(version2) ? 'compatible' : 'incompatible';
    }

    const changes: string[] = [];
    if (v1Info && v2Info) {
      changes.push(...v2Info.changes);
    }

    return {
      version1Info: v1Info,
      version2Info: v2Info,
      compatibility,
      changes
    };
  }

  /**
   * Generate version manifest for research documentation
   */
  static generateVersionManifest(): {
    currentVersion: string;
    totalVersions: number;
    versions: AssessmentVersion[];
    compatibilityMatrix: Record<string, string[]>;
  } {
    const compatibilityMatrix: Record<string, string[]> = {};
    
    for (const version of AssessmentVersionManager.VERSION_HISTORY) {
      compatibilityMatrix[version.version] = AssessmentVersionManager.VERSION_HISTORY
        .filter(v => AssessmentVersionManager.isVersionCompatible(v.version))
        .map(v => v.version);
    }

    return {
      currentVersion: AssessmentVersionManager.CURRENT_VERSION,
      totalVersions: AssessmentVersionManager.VERSION_HISTORY.length,
      versions: [...AssessmentVersionManager.VERSION_HISTORY],
      compatibilityMatrix
    };
  }
}

// RESEARCH-GRADE: Version validation middleware
export function validateAssessmentVersion(data: unknown): {
  isValid: boolean;
  version: string;
  errors: string[];
  warnings: string[];
} {
  const validation = AssessmentVersionManager.validateAssessmentData(data);
  const version =
    isRecord(data) && typeof data.assessment_version === 'string'
      ? data.assessment_version
      : 'unknown';
  
  return {
    isValid: validation.isValid,
    version,
    errors: validation.errors,
    warnings: validation.warnings
  };
}

// RESEARCH-GRADE: Version tracking utility
export class AssessmentTracker {
  private version: string;
  private startTime: Date;
  private checkpoints: Array<{
    timestamp: Date;
    event: string;
    data?: unknown;
  }> = [];

  constructor(version?: string) {
    this.version = version || AssessmentVersionManager.getCurrentVersion();
    this.startTime = new Date();
    this.addCheckpoint('assessment_started');
  }

  addCheckpoint(event: string, data?: unknown): void {
    this.checkpoints.push({
      timestamp: new Date(),
      event,
      data
    });
  }

  getVersion(): string {
    return this.version;
  }

  getDuration(): number {
    return new Date().getTime() - this.startTime.getTime();
  }

  getCheckpoints(): typeof this.checkpoints {
    return [...this.checkpoints];
  }

  generateTrackingData(): {
    version: string;
    startTime: string;
    duration: number;
    checkpoints: Array<{
      timestamp: Date;
      event: string;
      data?: unknown;
    }>;
  } {
    return {
      version: this.version,
      startTime: this.startTime.toISOString(),
      duration: this.getDuration(),
      checkpoints: [...this.checkpoints]
    };
  }
}
