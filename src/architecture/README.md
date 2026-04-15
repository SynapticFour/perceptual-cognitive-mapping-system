# PCMS Architecture Overview

## Clean Architecture Principles

This system follows clean architecture principles with clear separation of concerns:

```
src/
|-- app/[locale]/           # Next.js App Router + next-intl locale segment
|-- i18n/                   # Locale routing and request config
|-- components/             # Reusable UI Components
|-- architecture/         # Architecture documentation (this folder)
|-- model/                  # Domain models (routing dimensions, latent stack)
|-- scoring/                # Application logic (scoring algorithms)
|-- adaptive/               # Application logic (adaptive engine)
|-- lib/                    # Infrastructure services (pipeline, Supabase, ethics)
|-- core/                   # Shared results model: PCA landscape, traits, in-browser pattern mining
|-- data/                   # Data access (question banks, loaders)
messages/                   # UI strings (en, de, wo, tw draft) for next-intl
```

## Layer Responsibilities

### 1. Presentation Layer (`app/[locale]/`, `components/`)
- **Purpose**: User interface and interaction handling
- **Dependencies**: Can depend on Application and Infrastructure layers
- **Rules**: 
  - No business logic
  - No direct database access
  - Clean separation between UI and business logic

### 2. Application Layer (`scoring/`, `adaptive/`)
- **Purpose**: Application-specific business rules
- **Dependencies**: Can depend on Domain and Infrastructure layers
- **Rules**:
  - Orchestrates domain objects
  - Implements use cases
  - No framework-specific code

### 3. Domain Layer (`model/`)
- **Purpose**: Core business logic and entities
- **Dependencies**: No dependencies on other layers
- **Rules**:
  - Pure business logic
  - Framework-agnostic
  - Testable in isolation

### 4. Infrastructure Layer (`lib/`, `data/`)
- **Purpose**: External concerns (database, APIs, file system)
- **Dependencies**: Can implement interfaces from Domain layer
- **Rules**:
  - Database access
  - External API calls
  - File system operations

## Data Flow

```
User Input (Presentation) 
    -> Application Logic (Scoring/Adaptive)
    -> Domain models (routing dimensions, pipeline session types, etc.)
    -> Infrastructure (Database/Storage)
```

## Key Architectural Decisions

### 1. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Abstractions don't depend on details

### 2. Single Responsibility
- Each class/module has one reason to change
- Clear boundaries between concerns

### 3. Open/Closed Principle
- Open for extension, closed for modification
- Plugin architecture for scoring algorithms

### 4. Interface Segregation
- Small, focused interfaces
- No fat interfaces

## Ethical Architecture Considerations

### 1. Data Privacy by Design
- Personal data never leaves infrastructure layer
- Anonymization at infrastructure boundary
- Audit trails for all data operations

### 2. Scientific Integrity
- Research models isolated in domain layer
- Version-controlled algorithms
- Reproducible computations

### 3. Accessibility First
- Presentation layer follows WCAG guidelines
- Semantic HTML structure
- Keyboard navigation support

## Technology Stack

### Frontend
- **Framework**: Next.js 16+ (App Router), **next-intl** for `en` / `de` / `wo` / `tw` (draft)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + context
- **Type Safety**: TypeScript

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API routes
- **Authentication**: Anonymous sessions only
- **File Storage**: Supabase Storage

### Infrastructure
- **Deployment**: Vercel (or similar)
- **Monitoring**: Custom error handling
- **Analytics**: Privacy-preserving only
- **CDN**: Vercel Edge Network

## Security Architecture

### 1. Data Protection
- TLS for data in transit (HTTPS in production); Supabase handles encryption at rest
- Hash-based identification where IP metadata is stored
- No personal identifiers collected in the default assessment flow

### 2. Access Control
- Row-level security in the Supabase schema (see `supabase-schema.sql`)
- Optional `/api/health` probe for client connectivity checks (not a substitute for edge rate limiting)
- Input validation at all layers

### 3. Audit Trail
- Comprehensive logging
- Immutable audit records
- GDPR compliance tracking

## Performance Architecture

### 1. Client-side
- Code splitting by route
- Lazy loading components
- Optimistic updates where appropriate

### 2. Server-side
- Database query optimization
- Response caching
- CDN for static assets

### 3. Database
- Indexed queries
- Connection pooling
- Read replicas for analytics

## Monitoring & Observability

### 1. Error Tracking
- Structured error logging
- Performance metrics
- User experience monitoring

### 2. Health Checks
- Database connectivity
- API response times
- Resource utilization

### 3. Research Analytics
- Aggregated, anonymized data
- Statistical quality metrics
- Model performance tracking

## Deployment Architecture

### 1. Environments
- **Development**: Local development with hot reload
- **Staging**: Production-like testing environment
- **Production**: Live system with full monitoring

### 2. CI/CD Pipeline
- Automated testing
- Security scanning
- Gradual rollout capability

### 3. Backup & Recovery
- Automated database backups
- Point-in-time recovery
- Disaster recovery procedures

## Future Extensibility

### 1. Multi-tenant Support
- Organization-based isolation
- Custom assessment versions
- Branded experiences

### 2. Advanced Analytics
- Optional server-side aggregation of pattern statistics (today: simple in-browser co-occurrence mining only)
- Research exports and dashboards already in `src/app/api/research` and related UI

### 3. Integration Capabilities
- Research data export
- Third-party integrations
- API for external tools

## Documentation Standards

### 1. Code Documentation
- JSDoc for all public methods
- Type annotations for all interfaces
- Usage examples for complex logic

### 2. Architecture Documentation
- Decision records (ADRs)
- System diagrams
- API documentation

### 3. Research Documentation
- Model documentation
- Data dictionaries
- Methodology explanations
