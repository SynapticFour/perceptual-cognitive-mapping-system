# Data Model Documentation v1.0
## Perceptual & Cognitive Mapping System (Research-Grade)

### Overview

The PCMS v1.0 data model is designed to support **research-grade adaptive assessment** with pseudonymous data collection while maintaining strict privacy standards. This document outlines the complete data structure, relationships, and implementation details for scientific studies.

### Research-Grade Enhancements

- **Assessment Versioning**: Track assessment versions for research reproducibility
- **Question Path Tracking**: Complete audit trail of question sequence
- **Structured Research Data**: Dedicated table for publication-quality datasets
- **Completion Status Granularity**: Detailed completion reasons for research analysis

### Core Data Entities

#### 1. Sessions

**Purpose**: Tracks individual assessment sessions with pseudonymous identifiers.

**Schema**:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  user_agent TEXT,
  ip_hash VARCHAR(64),
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_status VARCHAR(20) NOT NULL DEFAULT 'in_progress' 
    CHECK (completion_status IN ('in_progress', 'completed', 'abandoned', 'confidence_met', 'max_questions', 'user_exit')),
  
  -- RESEARCH-GRADE: Additional fields for research integrity
  assessment_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  question_path TEXT[], -- Array of question IDs in order asked
  duration_ms BIGINT, -- Total assessment duration in milliseconds
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `id`: Anonymous session identifier (UUID)
- `started_at`: Session initiation timestamp
- `completed_at`: Session completion timestamp (null if incomplete)
- `cultural_context`: Assessment cultural context ('western', 'ghana', 'universal')
- `user_agent`: Browser user agent string (optional)
- `ip_hash`: Hashed IP address for basic rate limiting
- `consent_timestamp`: When user provided informed consent
- `completion_status`: Session status ('in_progress', 'completed', 'abandoned')

**Constraints**:
- `completion_status` limited to predefined values
- `consent_timestamp` required (ensures consent before data collection)
- `ip_hash` stored as one-way hash for privacy

#### 2. Profiles

**Purpose**: Stores final cognitive profiles with dimensional vectors and confidence metrics.

**Schema**:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  cognitive_vector JSONB NOT NULL,
  confidence_vector JSONB NOT NULL,
  response_count INTEGER NOT NULL DEFAULT 0,
  completion_time_seconds INTEGER NOT NULL,
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `id`: Profile identifier (UUID)
- `session_id`: Reference to parent session
- `cognitive_vector`: JSON document storing the **completed pipeline session** (`StoredPipelineSession` from `src/types/pipeline-session.ts`, built by `toStoredPipelineSession` in `src/lib/cognitive-pipeline.ts`). Routing / confidence detail for **F–V** is carried under **`scoringResult`** (and latent space projection metadata under the persisted field name **`embedding`**), not as a flat six-key map at the column root.
- `confidence_vector`: JSON object summarizing interpretation / latent space projection confidence and highlights (see `src/lib/data-collection.ts` — not limited to ten scalar keys)
- `response_count`: Total questions answered
- `completion_time_seconds`: Time from start to completion
- `cultural_context`: Cultural context during assessment
- `consent_timestamp`: Copy of session consent timestamp

**JSON shape (illustrative)** — real rows store **`StoredPipelineSession`** (`src/types/pipeline-session.ts`): narrative `publicProfile`, latent space projection data (field name `embedding`), `featureHighlights`, and **`scoringResult`** (per-axis routing confidence from `src/scoring/scoring-model.ts`).

```json
{
  "version": 3,
  "responseCount": 18,
  "completedAt": "2026-04-12T12:00:00.000Z",
  "publicProfile": {
    "summary": "…",
    "patterns": ["…"],
    "notes": ["…"],
    "confidence": 0.82
  },
  "embedding": {
    "dimension": 32,
    "version": "latent-v1",
    "confidence": 0.71,
    "vector": [0.01, -0.02]
  },
  "featureHighlights": {
    "overallConfidence": 0.8,
    "answerConsistency": 0.9,
    "entropy": 0.4
  },
  "scoringResult": {
    "confidenceComponents": {
      "F": { "finalConfidence": 0.85, "meetsMinimumSample": true }
    }
  }
}
```

`confidence_vector` column example:

```json
{
  "interpretationConfidence": 0.82,
  "embeddingConfidence": 0.71,
  "highlights": []
}
```

#### 3. Question Responses

**Purpose**: Stores individual question responses with timing and metadata.

**Schema**:
```sql
CREATE TABLE question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL,
  response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5),
  response_time_ms INTEGER NOT NULL,
  question_category VARCHAR(50) NOT NULL,
  dimension_weights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `id`: Response identifier (UUID)
- `session_id`: Reference to parent session
- `question_id`: Question identifier (e.g., 'f1', 'p2')
- `response`: Likert scale response (1-5)
- `response_time_ms`: Time to answer in milliseconds
- `question_category`: Question category ('focus', 'pattern', 'sensory', etc.)
- `dimension_weights`: JSON object with dimension weight mappings

**Dimension weights example** (routing keys **F–V**; any axis may be zero for a given item):

```json
{
  "F": 0.8,
  "P": 0.1,
  "S": 0.05,
  "E": 0.0,
  "R": 0.05,
  "C": 0.0,
  "T": 0.0,
  "I": 0.0,
  "A": 0.0,
  "V": 0.0
}
```

#### 4. Research Assessments (NEW v1.0)

**Purpose**: Stores structured research-grade assessment data for publication-quality datasets.

**Schema**:
```sql
CREATE TABLE research_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  assessment_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_ms BIGINT NOT NULL,
  question_path TEXT[] NOT NULL,
  responses JSONB NOT NULL, -- Array of response objects with timing
  final_profile JSONB NOT NULL, -- Complete profile with vector and confidence
  completion_status VARCHAR(20) NOT NULL 
    CHECK (completion_status IN ('confidence_met', 'max_questions', 'user_exit')),
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields**:
- `id`: Research assessment identifier (UUID)
- `session_id`: Reference to parent session
- `assessment_version`: Assessment version (e.g., 'v1.0')
- `timestamp`: Assessment completion timestamp
- `duration_ms`: Total assessment duration in milliseconds
- `question_path`: Array of question IDs in order asked
- `responses`: Complete response history with timing data
- `final_profile`: Final cognitive profile with vector and confidence
- `completion_status`: Detailed completion reason
- `cultural_context`: Assessment cultural context

**Research Data Structure Example**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "assessment_version": "v1.0",
  "timestamp": "2026-04-12T12:00:00Z",
  "duration_ms": 845000,
  "question_path": ["f1", "p1", "s1", "e1", "r1", "c1", "f2", "p2", "s2"],
  "responses": [
    {
      "question_id": "f1",
      "response": 4,
      "response_time_ms": 8500,
      "timestamp": "2026-04-12T12:01:00Z"
    }
  ],
  "final_profile": {
    "version": 3,
    "responseCount": 18,
    "completedAt": "2026-04-12T12:10:00.000Z",
    "publicProfile": { "summary": "…", "patterns": [], "notes": [], "confidence": 0.8 },
    "embedding": { "dimension": 32, "version": "latent-v1", "confidence": 0.7, "vector": [] },
    "featureHighlights": { "overallConfidence": 0.8, "answerConsistency": 0.85, "entropy": 0.5 },
    "scoringResult": { "confidenceComponents": {} }
  },
  "completion_status": "confidence_met",
  "cultural_context": "universal"
}
```

### Data Relationships

#### Entity Relationship Diagram

```
Sessions (1) -----> (N) Question Responses
  |
  |
  v
Profiles (1) -----> (1) Sessions
```

**Relationship Rules**:
- Each session can have multiple question responses
- Each session has at most one final profile
- Profiles inherit session metadata (consent, cultural context)
- Deleting a session cascades to delete all related data

### Indexing Strategy

#### Performance Indexes

**Sessions Table**:
```sql
CREATE INDEX idx_sessions_cultural_context ON sessions(cultural_context);
CREATE INDEX idx_sessions_completion_status ON sessions(completion_status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
```

**Profiles Table**:
```sql
CREATE INDEX idx_profiles_session_id ON profiles(session_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
CREATE INDEX idx_profiles_cultural_context ON profiles(cultural_context);
```

**Question Responses Table**:
```sql
CREATE INDEX idx_question_responses_session_id ON question_responses(session_id);
CREATE INDEX idx_question_responses_question_id ON question_responses(question_id);
CREATE INDEX idx_question_responses_category ON question_responses(question_category);
CREATE INDEX idx_question_responses_created_at ON question_responses(created_at);
```

#### JSONB Indexes

**Profiles JSONB Indexes**:
```sql
CREATE INDEX idx_profiles_cognitive_vector ON profiles USING GIN(cognitive_vector);
CREATE INDEX idx_profiles_confidence_vector ON profiles USING GIN(confidence_vector);
```

**Question Responses JSONB Indexes**:
```sql
CREATE INDEX idx_question_responses_dimension_weights ON question_responses USING GIN(dimension_weights);
```

### Data Access Patterns

#### Common Query Patterns

**1. Session Analytics**:
```sql
SELECT 
  cultural_context,
  completion_status,
  COUNT(*) as session_count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM sessions
GROUP BY cultural_context, completion_status;
```

**2. Profile Statistics**:
```sql
SELECT 
  cultural_context,
  AVG(cognitive_vector->>'F'::numeric) as avg_focus,
  AVG(cognitive_vector->>'P'::numeric) as avg_pattern,
  AVG(confidence_vector->>'F'::numeric) as avg_focus_confidence
FROM profiles
GROUP BY cultural_context;
```

**3. Question Performance**:
```sql
SELECT 
  question_id,
  question_category,
  COUNT(*) as response_count,
  AVG(response) as avg_response,
  AVG(response_time_ms) as avg_response_time
FROM question_responses
GROUP BY question_id, question_category;
```

#### Research Queries

**1. Dimension Correlations**:
```sql
SELECT 
  CORR(
    cognitive_vector->>'F'::numeric,
    cognitive_vector->>'P'::numeric
  ) as focus_pattern_correlation,
  cultural_context
FROM profiles
GROUP BY cultural_context;
```

**2. Confidence Analysis**:
```sql
SELECT 
  AVG(confidence_vector->>'F'::numeric) as avg_focus_confidence,
  AVG(confidence_vector->>'P'::numeric) as avg_pattern_confidence,
  AVG(confidence_vector->>'S'::numeric) as avg_sensory_confidence,
  AVG(confidence_vector->>'E'::numeric) as avg_social_confidence,
  AVG(confidence_vector->>'R'::numeric) as avg_structure_confidence,
  AVG(confidence_vector->>'C'::numeric) as avg_flexibility_confidence
FROM profiles
WHERE response_count >= 10;
```

### Data Validation

#### Input Validation Rules

**Likert Scale Responses**:
- Must be integer between 1 and 5
- Validated at application and database level
- Automatic rejection of invalid values

**Stored profiles**:
- `cognitive_vector` must be valid JSON matching the pipeline session shape expected by the app version
- Numeric scores inside `publicProfile` are validated at write time where applicable
- `confidence_vector` is a structured JSON object (see data collection code), not only per-axis scalars

**Session Data**:
- Cultural context limited to predefined values
- Completion status limited to valid states
- Timestamps must be valid ISO dates

#### Data Quality Checks

**Completeness Validation**:
```sql
-- Check for complete profiles
SELECT COUNT(*) FROM profiles 
WHERE response_count < 10;

-- Check for missing dimensions
SELECT COUNT(*) FROM profiles 
WHERE cognitive_vector->'scoringResult' IS NULL
   OR cognitive_vector->'publicProfile' IS NULL;
```

**Range Validation**:
```sql
-- Check for out-of-range values
SELECT COUNT(*) FROM profiles 
WHERE (cognitive_vector->>'F'::numeric < 0 OR cognitive_vector->>'F'::numeric > 1)
   OR (cognitive_vector->>'P'::numeric < 0 OR cognitive_vector->>'P'::numeric > 1);
```

### Privacy and Security

#### Anonymization Techniques

**Session Identification**:
- UUID generation for unique, non-sequential identifiers
- No sequential patterns that could enable identification
- No relationship to user accounts or personal data

**IP Address Handling**:
- One-way hashing of IP addresses
- Salted hash to prevent rainbow table attacks
- Used only for rate limiting, not user tracking

**Data Minimization**:
- Only collect data necessary for research
- No behavioral tracking beyond assessment
- No third-party analytics or tracking pixels

#### Security Measures

**Encryption**:
- TLS 1.3 for all data transmission
- Database encryption at rest
- Application-level encryption for sensitive fields

**Access Control**:
- Row-level security (RLS) enabled
- Role-based access permissions
- Audit logging for all data access

**Data Retention**:
- Configurable retention periods
- Automatic data cleanup processes
- Right to deletion implementation

### Migration and Versioning

#### Schema Evolution

**Backward Compatibility**:
- Additive changes only when possible
- Default values for new fields
- View-based compatibility layers

**Migration Strategy**:
```sql
-- Example: Adding new dimension
ALTER TABLE profiles 
ADD COLUMN cognitive_vector_v2 JSONB;

-- Migrate existing data
UPDATE profiles 
SET cognitive_vector_v2 = cognitive_vector;

-- Create compatibility view
CREATE VIEW profiles_v1 AS 
SELECT 
  id, session_id, cognitive_vector_v2 as cognitive_vector,
  confidence_vector, response_count, completion_time_seconds,
  cultural_context, consent_timestamp, created_at
FROM profiles;
```

**Version Tracking**:
- Schema version metadata
- Migration history logging
- Rollback procedures

### Analytics and Reporting

#### Research Analytics View

```sql
CREATE VIEW research_analytics AS
SELECT 
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT p.id) as completed_profiles,
  COUNT(DISTINCT CASE WHEN s.completion_status = 'completed' THEN s.id END) as completion_rate_sessions,
  AVG(p.completion_time_seconds) as avg_completion_time_seconds,
  AVG(p.response_count) as avg_response_count,
  s.cultural_context,
  DATE_TRUNC('day', s.created_at) as date
FROM sessions s
LEFT JOIN profiles p ON s.id = p.session_id
GROUP BY s.cultural_context, DATE_TRUNC('day', s.created_at)
ORDER BY date DESC;
```

#### Export Formats

**JSON Export**:
```json
{
  "session_id": "uuid",
  "profile": {
    "cognitive_vector": {...},
    "confidence_vector": {...},
    "response_count": 15,
    "completion_time_seconds": 480
  },
  "responses": [
    {
      "question_id": "f1",
      "response": 4,
      "response_time_ms": 8500,
      "dimension_weights": {...}
    }
  ]
}
```

**CSV Export**:
```csv
session_id,cultural_context,completion_status,response_count,avg_focus,avg_pattern,avg_sensory,avg_social,avg_structure,avg_flexibility
uuid,universal,completed,15,0.72,0.68,0.45,0.38,0.79,0.61
```

### API Integration

#### Data Access Patterns

**Session Management**:
```typescript
// Create session
const session = await supabase
  .from('sessions')
  .insert({
    cultural_context: 'universal',
    consent_timestamp: new Date().toISOString(),
    completion_status: 'in_progress'
  })
  .select()
  .single();

// Update session completion
await supabase
  .from('sessions')
  .update({
    completed_at: new Date().toISOString(),
    completion_status: 'completed'
  })
  .eq('id', sessionId);
```

**Profile Storage**:
```typescript
// Save final profile
await supabase
  .from('profiles')
  .insert({
    session_id: sessionId,
    cognitive_vector: profile.vector,
    confidence_vector: profile.confidence,
    response_count: profile.responseCount,
    completion_time_seconds: completionTime,
    cultural_context: 'universal',
    consent_timestamp: consentTimestamp
  });
```

**Response Recording**:
```typescript
// Record question response
await supabase
  .from('question_responses')
  .insert({
    session_id: sessionId,
    question_id: questionId,
    response: response,
    response_time_ms: responseTime,
    question_category: category,
    dimension_weights: dimensionWeights
  });
```

### Cohort intelligence (derived, in-memory)

Group-level **cohort** views are **not** a separate database table. They are **derived** in the client or tooling from multiple `CognitiveModel` instances: see `CohortModel` in `src/cohort/types.ts` and `buildCohortCognitiveMap` in `src/cohort/cohort-cognitive-map.ts`. Pooled activations are projected in one shared 2D space; **no** per-user keys belong in published cohort JSON (see `validateCohortIntelligenceBundle` in `src/cohort/cohort-validation.ts`).

- **Full spec:** [COHORT-INTELLIGENCE.md](./COHORT-INTELLIGENCE.md)

### Conclusion

The PCMS data model provides a robust, privacy-preserving foundation for cognitive research while maintaining the flexibility needed for future enhancements. The pseudonymous, session-based approach ensures participant privacy while enabling sophisticated research analyses.

The modular design supports easy extension, cultural adaptation, and integration with research workflows while maintaining strict ethical and privacy standards.

---

**Version**: 1.0
**Last Updated**: Current as of system initial release
**Review Schedule**: Annual review with updates as needed
