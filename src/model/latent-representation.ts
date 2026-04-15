/**
 * High-Dimensional Latent Cognitive Representation
 * 
 * Moves beyond fixed 6D scoring to rich, learnable representations
 * that can capture complex cognitive patterns and relationships.
 */

import type { RawResponse } from '@/types/raw-session';

export type { RawResponse } from '@/types/raw-session';
export type { SessionRaw } from '@/types/raw-session';

export interface CognitiveFeatures {
  // Temporal features
  averageResponseTime: number;
  responseTimeVariance: number;
  responseTimeTrend: number; // speeding up or slowing down
  
  // Consistency features
  answerConsistency: number; // how consistent responses are to similar questions
  intraCategoryVariance: number; // variance within same category
  crossCategoryCorrelation: number; // correlation between categories
  
  // Behavioral features
  ambiguityTolerance: number; // comfort with ambiguous questions
  switchingBehavior: number; // pattern of switching between answers
  decisionLatency: number; // time to commit to answer
  
  // Confidence features
  overallConfidence: number;
  confidenceVariance: number;
  confidenceCalibration: number; // how well confidence matches accuracy
  
  // Pattern features
  responsePattern: number[]; // sequential pattern of responses
  entropy: number; // randomness vs predictability in responses
  clusteringCoefficient: number; // how responses cluster together
  
  // Contextual features
  categoryBalance: Record<string, number>; // balance across categories
  difficultyPreference: number; // preference for easy vs hard questions
  culturalAlignment: number; // alignment with cultural context
}

export interface LatentCognitiveVector {
  id: string;
  vector: number[]; // High-dimensional (32-128D)
  dimension: number; // Actual dimension size
  version: string; // Model version used
  confidence: number; // Overall representation confidence
  features: CognitiveFeatures; // Extracted features
  metadata: {
    createdAt: string;
    responseCount: number;
    assessmentDuration: number;
    modelVersion: string;
    extractionMethod: string;
    culturalContext?: string;
    deviceInfo?: Record<string, string>;
    browserInfo?: Record<string, string>;
  };
}

/** Alias for architecture docs (embedding layer). */
export type CognitiveEmbedding = LatentCognitiveVector;

export interface FeatureExtractor {
  version: string;
  extract(responses: RawResponse[]): CognitiveFeatures;
  getFeatureNames(): string[];
  getFeatureImportance(): Record<string, number>;
}

/**
 * Statistical Feature Extractor
 * 
 * Implements basic statistical feature extraction from raw responses
 * Foundation for more sophisticated ML-based extractors
 */
export class StatisticalFeatureExtractor implements FeatureExtractor {
  version = 'statistical-v1.0';

  extract(responses: RawResponse[]): CognitiveFeatures {
    if (responses.length === 0) {
      return this.neutralFeatures();
    }

    return {
      // Temporal features
      averageResponseTime: this.calculateAverageResponseTime(responses),
      responseTimeVariance: this.calculateResponseTimeVariance(responses),
      responseTimeTrend: this.calculateResponseTimeTrend(responses),
      
      // Consistency features
      answerConsistency: this.calculateAnswerConsistency(responses),
      intraCategoryVariance: this.calculateIntraCategoryVariance(responses),
      crossCategoryCorrelation: this.calculateCrossCategoryCorrelation(responses),
      
      // Behavioral features
      ambiguityTolerance: this.calculateAmbiguityTolerance(responses),
      switchingBehavior: this.calculateSwitchingBehavior(responses),
      decisionLatency: this.calculateDecisionLatency(responses),
      
      // Confidence features
      overallConfidence: this.calculateOverallConfidence(responses),
      confidenceVariance: this.calculateConfidenceVariance(responses),
      confidenceCalibration: this.calculateConfidenceCalibration(responses),
      
      // Pattern features
      responsePattern: this.extractResponsePattern(responses),
      entropy: this.calculateEntropy(responses),
      clusteringCoefficient: this.calculateClusteringCoefficient(responses),
      
      // Contextual features
      categoryBalance: this.calculateCategoryBalance(responses),
      difficultyPreference: this.calculateDifficultyPreference(responses),
      culturalAlignment: this.calculateCulturalAlignment(responses)
    };
  }

  getFeatureNames(): string[] {
    return [
      'averageResponseTime', 'responseTimeVariance', 'responseTimeTrend',
      'answerConsistency', 'intraCategoryVariance', 'crossCategoryCorrelation',
      'ambiguityTolerance', 'switchingBehavior', 'decisionLatency',
      'overallConfidence', 'confidenceVariance', 'confidenceCalibration',
      'responsePattern', 'entropy', 'clusteringCoefficient',
      'categoryBalance', 'difficultyPreference', 'culturalAlignment'
    ];
  }

  private neutralFeatures(): CognitiveFeatures {
    return {
      averageResponseTime: 0,
      responseTimeVariance: 0,
      responseTimeTrend: 0,
      answerConsistency: 0.5,
      intraCategoryVariance: 0,
      crossCategoryCorrelation: 0,
      ambiguityTolerance: 0.5,
      switchingBehavior: 0.5,
      decisionLatency: 0,
      overallConfidence: 0,
      confidenceVariance: 0,
      confidenceCalibration: 0.5,
      responsePattern: [],
      entropy: 0,
      clusteringCoefficient: 0,
      categoryBalance: {},
      difficultyPreference: 0.5,
      culturalAlignment: 0.5
    };
  }

  getFeatureImportance(): Record<string, number> {
    // Return relative importance of each feature
    return {
      averageResponseTime: 0.8,
      responseTimeVariance: 0.7,
      responseTimeTrend: 0.6,
      answerConsistency: 0.9,
      intraCategoryVariance: 0.8,
      crossCategoryCorrelation: 0.7,
      ambiguityTolerance: 0.8,
      switchingBehavior: 0.7,
      decisionLatency: 0.6,
      overallConfidence: 0.9,
      confidenceVariance: 0.7,
      confidenceCalibration: 0.8,
      responsePattern: 0.6,
      entropy: 0.7,
      clusteringCoefficient: 0.8,
      categoryBalance: 0.9,
      difficultyPreference: 0.6,
      culturalAlignment: 0.5
    };
  }

  // Private feature calculation methods
  private calculateAverageResponseTime(responses: RawResponse[]): number {
    return responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
  }

  private calculateResponseTimeVariance(responses: RawResponse[]): number {
    const avg = this.calculateAverageResponseTime(responses);
    const variance = responses.reduce((sum, r) => sum + Math.pow(r.responseTime - avg, 2), 0);
    return variance / responses.length;
  }

  private calculateResponseTimeTrend(responses: RawResponse[]): number {
    if (responses.length < 3) return 0;
    
    // Simple linear trend calculation
    const n = responses.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = responses.reduce((sum, r, i) => sum + i * r.responseTime, 0);
    const sumXY = responses.reduce((sum, r, i) => sum + i * r.responseTime, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope; // Positive = speeding up, negative = slowing down
  }

  private calculateAnswerConsistency(responses: RawResponse[]): number {
    // Group responses by category
    const categoryGroups: Record<string, number[]> = {};
    
    responses.forEach(r => {
      const category = r.questionContext.category;
      if (!categoryGroups[category]) categoryGroups[category] = [];
      categoryGroups[category].push(r.selectedAnswer);
    });

    // Calculate consistency within categories
    const consistencies = Object.values(categoryGroups).map(values => {
      if (values.length < 2) return 1;
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      return 1 / (1 + variance); // Higher consistency = lower variance
    });

    return consistencies.reduce((sum, c) => sum + c, 0) / consistencies.length;
  }

  private calculateIntraCategoryVariance(responses: RawResponse[]): number {
    const categoryGroups: Record<string, number[]> = {};
    
    responses.forEach(r => {
      const category = r.questionContext.category;
      if (!categoryGroups[category]) categoryGroups[category] = [];
      categoryGroups[category].push(r.selectedAnswer);
    });

    const variances = Object.values(categoryGroups).map(values => {
      if (values.length < 2) return 0;
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    });

    return variances.reduce((sum, v) => sum + v, 0) / variances.length;
  }

  private calculateCrossCategoryCorrelation(responses: RawResponse[]): number {
    const categoryGroups: Record<string, number[]> = {};
    
    responses.forEach(r => {
      const category = r.questionContext.category;
      if (!categoryGroups[category]) categoryGroups[category] = [];
      categoryGroups[category].push(r.selectedAnswer);
    });

    const categories = Object.keys(categoryGroups);
    if (categories.length < 2) return 0;

    // Calculate average correlation between categories
    let totalCorrelation = 0;
    let correlationCount = 0;

    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const correlation = this.calculateCorrelation(
          categoryGroups[categories[i]], 
          categoryGroups[categories[j]]
        );
        totalCorrelation += Math.abs(correlation);
        correlationCount++;
      }
    }

    return correlationCount > 0 ? totalCorrelation / correlationCount : 0;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = x.reduce((sum, v) => sum + v, 0) / n;
    const meanY = y.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateAmbiguityTolerance(responses: RawResponse[]): number {
    // Higher tolerance = less variance on ambiguous (broad) questions
    const broadQuestions = responses.filter(r => r.questionContext.difficulty === 'broad');
    const specificQuestions = responses.filter(r => r.questionContext.difficulty === 'specific');

    if (broadQuestions.length === 0 || specificQuestions.length === 0) return 0.5;

    const broadVariance = this.calculateVariance(broadQuestions.map(r => r.selectedAnswer));
    const specificVariance = this.calculateVariance(specificQuestions.map(r => r.selectedAnswer));

    // Lower variance on broad questions = higher ambiguity tolerance
    return 1 / (1 + broadVariance) / (1 / (1 + specificVariance));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculateSwitchingBehavior(responses: RawResponse[]): number {
    if (responses.length < 3) return 0;

    let switches = 0;
    for (let i = 1; i < responses.length; i++) {
      const prevCategory = responses[i - 1].questionContext.category;
      const currCategory = responses[i].questionContext.category;
      if (prevCategory !== currCategory) {
        switches++;
      }
    }

    return switches / (responses.length - 1);
  }

  private calculateDecisionLatency(responses: RawResponse[]): number {
    // Use answer changes as proxy for decision difficulty
    const changes = responses.filter(r => (r.answerChanges || 0) > 0);
    return changes.length / responses.length;
  }

  private calculateOverallConfidence(responses: RawResponse[]): number {
    const confidences = responses
      .filter(r => r.confidence !== undefined)
      .map(r => r.confidence!);
    
    return confidences.length > 0 
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0.5; // Default confidence
  }

  private calculateConfidenceVariance(responses: RawResponse[]): number {
    const confidences = responses
      .filter(r => r.confidence !== undefined)
      .map(r => r.confidence!);
    
    if (confidences.length < 2) return 0;
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    return confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
  }

  private calculateConfidenceCalibration(responses: RawResponse[]): number {
    // Simplified calibration - consistency of confidence with response patterns
    const avgConfidence = this.calculateOverallConfidence(responses);
    const responseVariance = this.calculateVariance(responses.map(r => r.selectedAnswer));
    
    // Higher calibration = confidence matches response consistency
    return 1 / (1 + Math.abs(avgConfidence - 0.5) * responseVariance);
  }

  private extractResponsePattern(responses: RawResponse[]): number[] {
    // Extract first 10 responses as pattern (normalized)
    const patternLength = Math.min(10, responses.length);
    const pattern = responses.slice(0, patternLength).map(r => r.selectedAnswer);
    
    // Normalize to [0, 1]
    const max = Math.max(...pattern);
    const min = Math.min(...pattern);
    const range = max - min;
    
    return range === 0 ? pattern : pattern.map(p => (p - min) / range);
  }

  private calculateEntropy(responses: RawResponse[]): number {
    // Calculate Shannon entropy of responses
    const valueCounts: Record<number, number> = {};
    
    responses.forEach(r => {
      valueCounts[r.selectedAnswer] = (valueCounts[r.selectedAnswer] || 0) + 1;
    });

    const total = responses.length;
    let entropy = 0;

    Object.values(valueCounts).forEach(count => {
      const probability = count / total;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    return entropy;
  }

  private calculateClusteringCoefficient(responses: RawResponse[]): number {
    // How much responses cluster together (simplified)
    const values = responses.map(r => r.selectedAnswer);
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 1) return 1; // Perfect clustering
    if (uniqueValues.length === values.length) return 0; // No clustering

    // Calculate clustering based on value distribution
    const clusters: Record<number, number[]> = {};
    values.forEach(v => {
      if (!clusters[v]) clusters[v] = [];
      clusters[v].push(v);
    });

    const clusterSizes = Object.values(clusters).map(c => c.length);
    const avgClusterSize = clusterSizes.reduce((sum, size) => sum + size, 0) / clusterSizes.length;
    
    // Higher clustering coefficient = more similar responses
    return avgClusterSize / values.length;
  }

  private calculateCategoryBalance(responses: RawResponse[]): Record<string, number> {
    const categoryCounts: Record<string, number> = {};
    
    responses.forEach(r => {
      categoryCounts[r.questionContext.category] = (categoryCounts[r.questionContext.category] || 0) + 1;
    });

    const total = responses.length;
    const balance: Record<string, number> = {};
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      balance[category] = count / total;
    });

    return balance;
  }

  private calculateDifficultyPreference(responses: RawResponse[]): number {
    const broadQuestions = responses.filter(r => r.questionContext.difficulty === 'broad');
    const specificQuestions = responses.filter(r => r.questionContext.difficulty === 'specific');
    
    if (broadQuestions.length === 0 || specificQuestions.length === 0) return 0.5;

    const broadAvg = broadQuestions.reduce((sum, r) => sum + r.selectedAnswer, 0) / broadQuestions.length;
    const specificAvg = specificQuestions.reduce((sum, r) => sum + r.selectedAnswer, 0) / specificQuestions.length;
    
    // Preference for specific questions = higher specific average
    return (specificAvg - broadAvg + 5) / 10; // Normalize to [0, 1]
  }

  private calculateCulturalAlignment(responses: RawResponse[]): number {
    void responses;
    // Simplified alignment based on response patterns
    // In practice, this would use cultural calibration data
    return 0.5; // Neutral for now
  }
}

/**
 * Latent Vector Generator
 * 
 * Converts extracted features into high-dimensional vectors
 */
export class LatentVectorGenerator {
  private targetDimension: number;
  private version: string;

  constructor(targetDimension: number = 64, version: string = 'latent-v1.0') {
    this.targetDimension = targetDimension;
    this.version = version;
  }

  generate(features: CognitiveFeatures): number[] {
    // Convert features to high-dimensional vector
    // This is a simplified implementation - in production, use learned embeddings
    
    const featureVector = this.featuresToArray(features);
    const normalizedFeatures = this.normalizeFeatures(featureVector);
    
    // Project to target dimension
    return this.projectToDimension(normalizedFeatures, this.targetDimension);
  }

  getVersion(): string {
    return this.version;
  }

  getTargetDimension(): number {
    return this.targetDimension;
  }

  private featuresToArray(features: CognitiveFeatures): number[] {
    return [
      features.averageResponseTime,
      features.responseTimeVariance,
      features.responseTimeTrend,
      features.answerConsistency,
      features.intraCategoryVariance,
      features.crossCategoryCorrelation,
      features.ambiguityTolerance,
      features.switchingBehavior,
      features.decisionLatency,
      features.overallConfidence,
      features.confidenceVariance,
      features.confidenceCalibration,
      ...features.responsePattern.slice(0, 10), // First 10 pattern features
      features.entropy,
      features.clusteringCoefficient,
      ...Object.values(features.categoryBalance),
      features.difficultyPreference,
      features.culturalAlignment
    ];
  }

  private normalizeFeatures(features: number[]): number[] {
    // Min-max normalization
    const min = Math.min(...features);
    const max = Math.max(...features);
    const range = max - min;
    
    return range === 0 
      ? features 
      : features.map(f => (f - min) / range);
  }

  private projectToDimension(features: number[], targetDim: number): number[] {
    // Simple projection - in production, use learned transformation
    if (features.length >= targetDim) {
      return features.slice(0, targetDim);
    }

    // If we need to expand dimensions, use simple interpolation
    const projected = new Array(targetDim).fill(0);
    for (let i = 0; i < features.length; i++) {
      projected[i] = features[i];
    }

    // Fill remaining dimensions with interpolated values
    for (let i = features.length; i < targetDim; i++) {
      const sourceIndex = i % features.length;
      const weight = (targetDim - i) / targetDim;
      projected[i] = features[sourceIndex] * weight;
    }

    return projected;
  }
}

/**
 * Latent Representation Manager
 * 
 * Orchestrates the conversion from raw responses to latent vectors
 */
export class LatentRepresentationManager {
  private featureExtractor: FeatureExtractor;
  private vectorGenerator: LatentVectorGenerator;
  private version: string;

  constructor(
    featureExtractor?: FeatureExtractor,
    targetDimension: number = 64,
    version: string = 'latent-v1.0'
  ) {
    this.featureExtractor = featureExtractor || new StatisticalFeatureExtractor();
    this.vectorGenerator = new LatentVectorGenerator(targetDimension, version);
    this.version = version;
  }

  async generateLatentVector(
    responses: RawResponse[],
    metadata: Partial<LatentCognitiveVector['metadata']> = {}
  ): Promise<LatentCognitiveVector> {
    // Extract features
    const features = this.featureExtractor.extract(responses);
    
    // Generate latent vector
    const vector = this.vectorGenerator.generate(features);
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(features, responses);
    
    return {
      id: this.generateVectorId(),
      vector,
      dimension: this.vectorGenerator.getTargetDimension(),
      version: this.version,
      confidence,
      features,
      metadata: {
        createdAt: new Date().toISOString(),
        responseCount: responses.length,
        assessmentDuration: this.calculateAssessmentDuration(responses),
        modelVersion: this.version,
        extractionMethod: this.featureExtractor.version,
        ...metadata
      }
    };
  }

  getVersion(): string {
    return this.version;
  }

  getFeatureExtractor(): FeatureExtractor {
    return this.featureExtractor;
  }

  getVectorGenerator(): LatentVectorGenerator {
    return this.vectorGenerator;
  }

  private generateVectorId(): string {
    return `latent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateOverallConfidence(features: CognitiveFeatures, responses: RawResponse[]): number {
    void responses;
    // Combine multiple confidence measures
    const responseConfidence = features.overallConfidence;
    const consistencyConfidence = features.answerConsistency;
    const calibrationConfidence = features.confidenceCalibration;
    
    return (responseConfidence + consistencyConfidence + calibrationConfidence) / 3;
  }

  private calculateAssessmentDuration(responses: RawResponse[]): number {
    if (responses.length < 2) return 0;
    
    const startTime = responses[0].timestamp;
    const endTime = responses[responses.length - 1].timestamp;
    
    return endTime - startTime;
  }
}
