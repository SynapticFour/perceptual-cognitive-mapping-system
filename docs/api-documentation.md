# API Documentation v1.0
## Perceptual & Cognitive Mapping System

### Overview

The PCMS API provides endpoints for questionnaire management, result processing, and research data export. All endpoints follow RESTful conventions and return JSON responses.

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### Research API Endpoints
- **Header**: `x-research-api-key: <RESEARCH_API_KEY>` or `Authorization: Bearer <RESEARCH_API_KEY>`
- **Cookie**: HttpOnly cookie set by `/research/login`

#### Public Endpoints
No authentication required for questionnaire and results endpoints.

### Endpoints

#### GET /api/questions
**Description**: Retrieve adaptive questionnaire questions
**Authentication**: None
**Query Parameters**:
- `locale` (optional): Language code (`en`, `de`, `wo`, `tw`)
- `session` (optional): Session ID for adaptive state

**Response**:
```json
{
  "questions": [
    {
      "id": "F-core-001",
      "text": "How do you prefer to focus on tasks?",
      "dimensionWeights": {
        "focus": 0.8,
        "pattern": 0.2
      },
      "type": "core",
      "difficulty": "broad",
      "category": "focus"
    }
  ],
  "sessionState": {
    "completedQuestions": 5,
    "currentPhase": "core",
    "confidenceThreshold": 0.75
  }
}
```

#### POST /api/responses
**Description**: Submit questionnaire responses
**Authentication**: None
**Body**:
```json
{
  "responses": [
    {
      "questionId": "F-core-001",
      "response": 4,
      "timestamp": "2026-01-01T12:00:00Z",
      "responseTimeMs": 2100
    }
  ],
  "sessionId": "session_12345"
}
```

**Response**:
```json
{
  "success": true,
  "nextQuestion": {
    "id": "P-core-001",
    "text": "How do you approach patterns?"
  },
  "isComplete": false,
  "confidence": {
    "focus": 0.65,
    "pattern": 0.72
  }
}
```

#### GET /api/results/[sessionId]
**Description**: Retrieve cognitive profile results
**Authentication**: None
**Response**:
```json
{
  "profile": {
    "dimensions": {
      "focus": 78.5,
      "pattern": 62.3,
      "sensory": 45.1
    },
    "confidence": 0.82,
    "insights": [
      "You show strong focus preferences",
      "Pattern processing is moderate"
    ]
  },
  "visualization": {
    "activations": [...],
    "density": [...],
    "clusters": [...]
  }
}
```

#### POST /api/research/export
**Description**: Export research data (authenticated)
**Authentication**: Research API key required
**Headers**:
- `x-research-api-key: <RESEARCH_EXPORT_API_KEY>`

**Body**:
```json
{
  "format": "csv|json",
  "dateRange": {
    "start": "2026-01-01",
    "end": "2026-12-31"
  },
  "includeRaw": false,
  "locales": ["en", "de"]
}
```

**Response**:
```json
{
  "downloadUrl": "/api/research/download/export_20260101_123456.csv",
  "recordCount": 1250,
  "expiresAt": "2026-01-01T18:00:00Z"
}
```

#### GET /api/research/download/[filename]
**Description**: Download exported research data
**Authentication**: Research API key required
**Response**: File download (CSV/JSON)

#### POST /api/delete-session
**Description**: Delete user session data (GDPR compliance)
**Authentication**: Service role key required
**Headers**:
- `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

**Body**:
```json
{
  "sessionId": "session_12345",
  "reason": "user_request"
}
```

**Response**:
```json
{
  "success": true,
  "deletedRecords": 3
}
```

#### GET /api/health
**Description**: System health check endpoint
**Authentication**: None
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": true,
    "storage": true
  }
}
```

#### POST /api/ethics/compliance-report
**Description**: Generate ethics compliance report
**Authentication**: Research API key required
**Headers**:
- `x-research-api-key: <RESEARCH_API_KEY>`

**Body** (optional):
```json
{
  "dateRange": {
    "start": "2026-01-01",
    "end": "2026-12-31"
  },
  "includeDetails": false
}
```

**Response**:
```json
{
  "reportId": "report_12345",
  "generatedAt": "2026-01-01T12:00:00Z",
  "summary": {
    "totalSessions": 1250,
    "completionRate": 0.85,
    "averageTime": 12.5,
    "consentRate": 0.92
  },
  "downloadUrl": "/api/research/download/compliance_report_12345.pdf"
}
```

#### POST /api/ethics-audit
**Description**: Log ethics audit events
**Authentication**: Service role key required
**Headers**:
- `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`

**Body**:
```json
{
  "eventType": "data_access",
  "userId": "user_123",
  "resource": "session_data",
  "timestamp": "2026-01-01T12:00:00Z",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "auditId": "audit_12345",
  "timestamp": "2026-01-01T12:00:00Z"
}
```

### Error Responses

All endpoints return consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid response format",
    "details": {
      "field": "response",
      "issue": "Must be between 1-5"
    }
  }
}
```

#### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Missing/invalid authentication
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

### Rate Limiting

- **Public endpoints**: 100 requests/minute per IP
- **Research endpoints**: 1000 requests/minute per API key
- **Export endpoints**: 10 requests/hour per API key

### Data Models

#### QuestionResponse
```typescript
interface QuestionResponse {
  questionId: string;
  response: 1 | 2 | 3 | 4 | 5;
  timestamp: Date;
  responseTimeMs: number;
}
```

#### CognitiveProfile
```typescript
interface CognitiveProfile {
  dimensions: Record<CognitiveDimension, number>;
  confidence: number;
  insights: string[];
  potentialStressors: string[];
}
```

#### SessionStats
```typescript
interface SessionStats {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  questionCount: number;
  averageResponseTime: number;
  completionRate: number;
}
```

### SDK Examples

#### JavaScript/TypeScript
```typescript
// Submit response
const response = await fetch('/api/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    responses: [{
      questionId: 'F-core-001',
      response: 4,
      timestamp: new Date().toISOString(),
      responseTimeMs: 1500
    }],
    sessionId: 'session_123'
  })
});

// Get results
const results = await fetch('/api/results/session_123');
const profile = await results.json();
```

#### Python
```python
import requests

# Export research data
headers = {'x-research-api-key': 'your_api_key'}
data = {
    'format': 'csv',
    'dateRange': {'start': '2026-01-01', 'end': '2026-12-31'}
}

response = requests.post(
    'http://localhost:3000/api/research/export',
    headers=headers,
    json=data
)
```

### WebSocket Events (Future)

Real-time updates for research dashboard:

```javascript
const ws = new WebSocket('ws://localhost:3000/api/research/live');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'new_session':
      console.log('New assessment started:', data.sessionId);
      break;
    case 'completion':
      console.log('Assessment completed:', data.results);
      break;
  }
};
```

### Versioning

API versioning follows semantic versioning:
- `v1.0.0`: Current stable version
- Breaking changes increment major version
- New features increment minor version
- Bug fixes increment patch version

### Testing

Use the provided test endpoints:
- `GET /api/test/health` - Health check
- `POST /api/test/mock-session` - Create test session
- `GET /api/test/sample-data` - Sample questionnaire data

### Support

For API issues:
1. Check error codes and messages
2. Review this documentation
3. Check `/api/test/health` for system status
4. Contact research team with API key and request details
