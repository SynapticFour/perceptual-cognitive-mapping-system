# Contributing to PCMS
## Perceptual & Cognitive Mapping System

Thank you for your interest in contributing to the Perceptual & Cognitive Mapping System! This document provides guidelines and procedures for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Race, ethnicity, or national origin
- Gender, gender identity, or expression
- Sexual orientation
- Age
- Disability
- Religion or belief
- Technical experience level

### Expected Behavior

- Be respectful and considerate
- Use welcoming and inclusive language
- Focus on constructive feedback
- Be empathetic toward other contributors
- Respect different viewpoints and experiences

### Unacceptable Behavior

- Harassment, discrimination, or hate speech
- Personal attacks or insults
- Public or private harassment
- Publishing private information
- Any other unprofessional conduct

## Getting Started

### Prerequisites

- Node.js 18+ 
- Git
- Basic knowledge of TypeScript and React

### Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/perceptual-cognitive-mapping-system.git
   cd perceptual-cognitive-mapping-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Verify setup**
   ```bash
   npm run check
   npm run test
   ```

## Development Workflow

### 1. Create a Branch

```bash
# Create feature branch from main
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b fix/issue-description
```

### 2. Make Changes

- Follow the coding standards below
- Add tests for new functionality
- Update documentation as needed
- Keep changes focused and atomic

### 3. Test Your Changes

```bash
# Run all quality checks
npm run check

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Build project
npm run build
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add new cognitive dimension visualization"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over implicit `any`
- Use interfaces for object shapes
- Add JSDoc comments for complex functions

```typescript
// Good
interface CognitiveProfile {
  dimensions: Record<CognitiveDimension, number>;
  confidence: number;
}

function calculateProfile(responses: QuestionResponse[]): CognitiveProfile {
  // Implementation
}

// Bad
function calculateProfile(responses: any): any {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Prefer composition over inheritance
- Add proper TypeScript props interfaces
- Include displayName for debugging

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children }) => {
  return <button className={`btn-${variant} btn-${size}`}>{children}</button>;
};

Button.displayName = 'Button';
```

### File Organization

- Use kebab-case for file names
- Group related files in directories
- Keep components in `src/components/`
- Use `index.ts` for barrel exports

```
src/
  components/
    ui/
      Button.tsx
      index.ts
  lib/
    monitoring.ts
    worker.ts
```

### Import Order

1. React and Next.js imports
2. External library imports
3. Internal imports (absolute paths with `@/`)
4. Relative imports

```typescript
import React from 'react';
import { NextPage } from 'next';
import { clsx } from 'clsx';

import { Button } from '@/components/ui/Button';
import { monitoring } from '@/lib/monitoring';
import './styles.css';
```

### Naming Conventions

- **Components**: PascalCase (`Button`, `CognitiveLandscape`)
- **Functions**: camelCase (`calculateProfile`, `trackInteraction`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RESPONSES`)
- **Files**: kebab-case (`cognitive-profile.ts`, `api-client.ts`)

## Testing

### Unit Tests

- Write tests for all public functions
- Use Vitest for unit testing
- Mock external dependencies
- Aim for high code coverage

```typescript
import { describe, it, expect } from 'vitest';
import { calculateProfile } from '@/lib/cognitive-profile';

describe('calculateProfile', () => {
  it('should calculate profile from responses', () => {
    const responses = [
      { questionId: 'F-001', response: 4, timestamp: new Date(), responseTimeMs: 1000 }
    ];
    
    const profile = calculateProfile(responses);
    
    expect(profile.dimensions.focus).toBeGreaterThan(0);
    expect(profile.confidence).toBeBetween(0, 1);
  });
});
```

### Integration Tests

- Test component interactions
- Test API endpoints
- Use realistic test data

### E2E Tests

- Test user workflows
- Use Playwright for browser testing
- Include accessibility testing

```typescript
import { test, expect } from '@playwright/test';

test('complete questionnaire flow', async ({ page }) => {
  await page.goto('/consent');
  await page.getByRole('button', { name: 'I agree' }).click();
  await page.goto('/questionnaire');
  
  // Complete questionnaire
  for (let i = 0; i < 15; i++) {
    await page.getByRole('radio', { name: '4' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
  }
  
  await expect(page.getByText('Your cognitive profile')).toBeVisible();
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Include usage examples

```typescript
/**
 * Calculates cognitive profile from questionnaire responses
 * @param responses - Array of question responses with timing data
 * @returns Cognitive profile with dimensional scores and confidence
 * @example
 * ```typescript
 * const profile = calculateProfile(responses);
 * console.log(profile.dimensions.focus); // 75.5
 * ```
 */
export function calculateProfile(responses: QuestionResponse[]): CognitiveProfile {
  // Implementation
}
```

### README Updates

- Update README.md for new features
- Add API documentation for new endpoints
- Update contributing guide as needed

### Component Documentation

- Document props and usage patterns directly in component docs/README sections
- Include accessibility notes in component-level comments and test cases

## Submitting Changes

### Pull Request Requirements

1. **Clear title and description**
   - Use conventional commit format
   - Describe what changes and why
   - Include screenshots for UI changes

2. **Tests pass**
   - All unit tests pass
   - E2E tests pass
   - Code coverage maintained

3. **Code quality**
   - No ESLint errors
   - TypeScript compilation succeeds
   - Follows coding standards

4. **Documentation**
   - Updated for new features
   - API documentation current
   - README updated if needed

### PR Template

```markdown
## Description
Brief description of the change and why it's needed.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Review Process

### Review Criteria

1. **Code Quality**
   - Follows project standards
   - Well-tested and documented
   - No security vulnerabilities

2. **Functionality**
   - Works as intended
   - Handles edge cases
   - Performance acceptable

3. **User Experience**
   - Accessible and usable
   - Consistent with existing patterns
   - Proper error handling

4. **Research Integrity**
   - Maintains scientific validity
   - Follows ethical guidelines
   - Preserves data quality

### Review Guidelines

- Be constructive and specific
- Focus on the code, not the person
- Ask questions if unclear
- Suggest improvements

### Merge Process

1. **Requirements met**
   - All checks pass
   - Reviews approved
   - Conflicts resolved

2. **Merge strategy**
   - Use squash merge for feature branches
   - Preserve important commit messages
   - Update version as needed

3. **Post-merge**
   - Monitor for issues
   - Update documentation
   - Celebrate contributions!

## Getting Help

### Resources

- **Documentation**: Check `/docs` directory
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions

### Contact

- **Maintainers**: Tag maintainainers in issues
- **Community**: Join our discussions
- **Security**: Report security issues privately

## Recognition

All contributors are recognized in:

- **README.md**: Contributors section
- **Release notes**: For significant contributions
- **Community**: Highlight outstanding contributions

Thank you for contributing to PCMS! Your contributions help advance cognitive diversity research and provide valuable tools for self-understanding.
