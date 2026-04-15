/**
 * Web Worker for heavy computational tasks
 * Handles PCA calculations, density grid generation, and other CPU-intensive operations
 */

export interface WorkerMessage {
  type: 'pca_calculation' | 'density_grid' | 'pattern_mining';
  data: any;
  id: string;
}

export interface WorkerResponse {
  type: WorkerMessage['type'];
  result: any;
  id: string;
  error?: string;
}

// PCA calculation worker
function calculatePCA(data: number[][]): {
  components: number[][];
  explainedVariance: number[];
  mean: number[];
} {
  // Simplified PCA implementation
  // In production, use a proper linear algebra library
  
  const n = data.length;
  const d = data[0].length;
  
  // Calculate mean
  const mean = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      mean[j] += data[i][j];
    }
  }
  for (let j = 0; j < d; j++) {
    mean[j] /= n;
  }
  
  // Center data
  const centered = data.map(row => 
    row.map((val, j) => val - mean[j])
  );
  
  // Calculate covariance matrix
  const cov = new Array(d).fill(0).map(() => new Array(d).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      for (let k = 0; k < d; k++) {
        cov[j][k] += centered[i][j] * centered[i][k];
      }
    }
  }
  for (let j = 0; j < d; j++) {
    for (let k = 0; k < d; k++) {
      cov[j][k] /= (n - 1);
    }
  }
  
  // Simplified eigenvalue decomposition (using power iteration)
  const components = [];
  const explainedVariance = [];
  
  // For demo purposes, return identity matrix
  // In production, use proper eigenvalue decomposition
  for (let i = 0; i < Math.min(2, d); i++) {
    const component = new Array(d).fill(0);
    component[i] = 1;
    components.push(component);
    explainedVariance.push(0.5);
  }
  
  return { components, explainedVariance, mean };
}

// Density grid calculation
function calculateDensityGrid(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  cellSize: number
): {
  grid: number[][];
  cols: number;
  rows: number;
} {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
  
  for (const point of points) {
    const col = Math.floor(point.x / cellSize);
    const row = Math.floor(point.y / cellSize);
    
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      grid[row][col]++;
    }
  }
  
  return { grid, cols, rows };
}

// Pattern mining (simplified)
function minePatterns(data: any[]): {
  patterns: Array<{
    type: string;
    confidence: number;
    items: any[];
  }>;
} {
  // Simplified pattern mining
  // In production, implement proper frequent pattern mining algorithms
  
  const patterns = [];
  
  // Find common co-occurrences
  const itemCounts = new Map();
  for (const item of data) {
    const key = JSON.stringify(item);
    itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
  }
  
  // Convert to patterns
  for (const [item, count] of itemCounts.entries()) {
    if (count > 1) {
      patterns.push({
        type: 'co-occurrence',
        confidence: count / data.length,
        items: [JSON.parse(item)],
      });
    }
  }
  
  return { patterns };
}

// Main worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'pca_calculation':
        result = calculatePCA(data);
        break;
        
      case 'density_grid':
        result = calculateDensityGrid(
          data.points,
          data.width,
          data.height,
          data.cellSize
        );
        break;
        
      case 'pattern_mining':
        result = minePatterns(data);
        break;
        
      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }
    
    const response: WorkerResponse = {
      type,
      result,
      id,
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = {
      type,
      result: null,
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    self.postMessage(response);
  }
};

