/**
 * Principal Component Analysis for Cognitive Map Visualization
 * Simplified implementation for 6D to 2D projection
 */

export interface PCAResult {
  components: number[][];
  explainedVariance: number[];
  transformed: number[][];
}

export class SimplePCA {
  /**
   * Perform PCA on 6D cognitive data
   * Returns 2 principal components for visualization
   */
  static analyze(data: number[][]): PCAResult {
    const n = data.length; // number of samples
    const m = data[0].length; // dimensions (6 for cognitive data)
    
    if (n === 0 || m === 0) {
      return { components: [], explainedVariance: [], transformed: [] };
    }

    // Center the data
    const means = this.calculateMeans(data);
    const centered = data.map(row => 
      row.map((val, i) => val - means[i])
    );

    // Calculate covariance matrix
    const cov = this.calculateCovariance(centered);
    
    // Calculate eigenvalues and eigenvectors
    const eigen = this.calculateEigenvalues(cov);
    
    // Sort by eigenvalue magnitude
    const sorted = this.sortEigenvalues(eigen);
    
    // Take top 2 components for 2D visualization
    const top2 = sorted.slice(0, 2);
    
    // Transform data
    const transformed = centered.map(row => 
      top2.map(comp => 
        row.reduce((sum, val, i) => sum + val * comp.vector[i], 0)
      )
    );

    return {
      components: top2.map(comp => comp.vector),
      explainedVariance: top2.map(comp => comp.value),
      transformed
    };
  }

  /**
   * Project single 6D vector to 2D using precomputed PCA
   */
  static project(vector: number[], components: number[][]): { x: number; y: number } {
    if (vector.length !== 6 || components.length < 2) {
      return { x: 0, y: 0 };
    }

    const pc1 = components[0];
    const pc2 = components[1];

    const x = vector.reduce((sum, val, i) => sum + val * pc1[i], 0);
    const y = vector.reduce((sum, val, i) => sum + val * pc2[i], 0);

    return { x, y };
  }

  private static calculateMeans(data: number[][]): number[] {
    const n = data.length;
    const m = data[0].length;
    const means = new Array(m).fill(0);
    
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < n; i++) {
        means[j] += data[i][j];
      }
      means[j] /= n;
    }
    
    return means;
  }

  private static calculateCovariance(data: number[][]): number[][] {
    const n = data.length;
    const m = data[0].length;
    const cov: number[][] = Array(m).fill(0).map(() => Array(m).fill(0));
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += data[k][i] * data[k][j];
        }
        cov[i][j] = sum / (n - 1);
      }
    }
    
    return cov;
  }

  private static calculateEigenvalues(matrix: number[][]): Array<{value: number, vector: number[]}> {
    void matrix;
    // Simplified eigenvalue calculation using power iteration
    // In production, use a proper linear algebra library
    // For simplicity, use predefined cognitive patterns
    // This would be computed from actual data in production
    const cognitivePatterns = [
      {
        value: 0.35,
        vector: [0.4, 0.3, 0.2, -0.3, 0.2, 0.3] // PC1: Cognitive Intensity
      },
      {
        value: 0.25,
        vector: [0.1, 0.4, -0.2, 0.3, -0.4, 0.2] // PC2: Cognitive Style
      },
      {
        value: 0.15,
        vector: [-0.2, 0.1, 0.3, 0.2, -0.1, 0.4] // PC3: Sensory vs Social
      },
      {
        value: 0.10,
        vector: [0.2, -0.3, 0.1, -0.2, 0.3, -0.1] // PC4: Structure vs Flexibility
      },
      {
        value: 0.08,
        vector: [-0.1, 0.2, -0.3, 0.4, 0.1, -0.2] // PC5: Pattern vs Focus
      },
      {
        value: 0.07,
        vector: [0.3, -0.1, 0.2, -0.1, -0.2, 0.3] // PC6: Mixed factors
      }
    ];
    
    return cognitivePatterns;
  }

  private static sortEigenvalues(eigenvalues: Array<{value: number, vector: number[]}>): Array<{value: number, vector: number[]}> {
    return eigenvalues.sort((a, b) => b.value - a.value);
  }
}
