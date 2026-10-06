# Contributing to DH Araria Hospital Portal

Thank you for your interest in contributing to the District Hospital Araria Digital Healthcare Portal! This project follows the Government of India's MeitY Open Source Policy and is intended for publication on OpenForge.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Accessibility Requirements](#accessibility-requirements)
- [Security Requirements](#security-requirements)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## 🤝 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm 10+ (or pnpm/yarn)
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/dh-araria.git
   cd dh-araria
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env.local
   ```
5. Configure your `.env` files with local settings
6. Start development servers:
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates
- `chore/description` - Maintenance tasks

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance
- `style` - Formatting
- `perf` - Performance
- `ci` - CI/CD

Examples:
```
feat(appointments): add teleconsultation booking option
fix(auth): resolve token refresh race condition
docs(api): update Swagger documentation for blood bank endpoints
```

## 📝 Coding Standards

### TypeScript

- Use strict mode (`"strict": true`)
- Avoid `any` type - use proper typing
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` over `let`
- Use functional programming patterns where appropriate

### Frontend (Next.js/React)

- Use Server Components by default
- Client components only when necessary (`'use client'`)
- Follow React best practices (hooks rules, component composition)
- Use Tailwind CSS for styling
- Implement proper accessibility (ARIA, semantic HTML)
- Use React Hook Form + Zod for forms

### Backend (NestJS)

- Follow NestJS modular architecture
- Use dependency injection properly
- Implement proper error handling with filters
- Use DTOs with class-validator for validation
- Implement proper logging
- Use Swagger decorators for API documentation

### Code Style

- 2 spaces indentation
- Single quotes for strings
- Trailing commas (es5)
- Max line width: 100 characters
- Use Prettier for formatting
- ESLint for linting

## ✅ Testing Requirements

### Coverage Targets

- **Unit tests**: 80%+ coverage
- **Integration tests**: Critical paths covered
- **E2E tests**: Core user flows covered

### Test Types

1. **Unit Tests** - Test individual functions/components in isolation
2. **Integration Tests** - Test module interactions
3. **E2E Tests** - Test complete user flows

### Running Tests

```bash
# All tests
npm run test

# Backend only
cd apps/backend && npm run test
npm run test:e2e

# Frontend only
cd apps/frontend && npm run test
npm run test:watch
```

### Writing Tests

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests fast and independent

## ♿ Accessibility Requirements

All UI changes must meet **WCAG 2.2 Level AA** and **GIGW 3.0** standards:

### Mandatory Checks

- [ ] Semantic HTML5 elements
- [ ] Proper heading hierarchy (h1-h6)
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text)
- [ ] Focus indicators visible
- [ ] Keyboard navigation support
- [ ] ARIA labels for interactive elements
- [ ] Alt text for images
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Reduced motion support
- [ ] High contrast mode support

### Testing Tools

- axe-core (automated)
- NVDA/JAWS (manual screen reader testing)
- Keyboard-only navigation testing
- Browser DevTools accessibility panel

## 🔒 Security Requirements

### Code Security

- No hardcoded secrets/tokens
- Input validation on all endpoints
- Parameterized queries (Prisma ORM)
- Proper authentication/authorization
- Rate limiting on all endpoints
- Security headers (Helmet.js)

### Dependency Security

- Run `npm audit` regularly
- Update dependencies monthly
- Use `npm audit fix` for vulnerabilities
- Review new dependencies for:
  - License compatibility (MIT/Apache-2.0 preferred)
  - Maintenance status
  - Security history
  - Bundle size impact

### Compliance

- CERT-In logging requirements (180-day retention)
- Data encryption at rest and in transit
- PII/PHI protection
- Audit logging for sensitive operations

## 🔀 Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm run test`
2. Run linting: `npm run lint`
3. Run type checking: `npm run type-check` (frontend)
4. Ensure code is formatted: `npx prettier --check .`
5. Update documentation if needed
6. Add/update tests for new functionality

### PR Requirements

- [ ] Clear title following conventional commits
- [ ] Description of changes
- [ ] Link to related issue
- [ ] Screenshots for UI changes
- [ ] Accessibility checklist completed
- [ ] Security checklist completed
- [ ] Tests added/updated
- [ ] Documentation updated

### Review Process

1. Automated checks must pass (CI)
2. At least 1 approval from maintainer
3. No unresolved security issues
4. Accessibility review for UI changes
5. Performance impact assessed

## 🚀 Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):
- MAJOR - Breaking changes
- MINOR - New features (backward compatible)
- PATCH - Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release branch: `release/vX.Y.Z`
4. Run full test suite
5. Build production artifacts
6. Create GitHub release with notes
7. Deploy to staging
8. Production deployment after approval

## 📦 Deployment

### Environments

- **Development** - Local development
- **Staging** - Pre-production testing
- **Production** - Live environment (MeghRaj Cloud)

### Deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Database migrations ready
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

## 📚 Documentation

### Required Documentation Updates

- API documentation (Swagger)
- README.md for new features
- Architecture decision records (ADRs)
- Deployment guides
- User guides (if applicable)

## 🏷️ Labels

| Label | Description |
|-------|-------------|
| `good first issue` | Good for newcomers |
| `help wanted` | Community help needed |
| `bug` | Bug report |
| `feature` | Feature request |
| `accessibility` | Accessibility related |
| `security` | Security related |
| `performance` | Performance related |
| `documentation` | Documentation updates |
| `breaking change` | Breaking changes |

## 📞 Getting Help

- **GitHub Discussions** - General questions
- **GitHub Issues** - Bug reports, feature requests
- **Email** - dh.araria@bihar.gov.in (for sensitive issues)

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- OpenForge publication credits

---

**Thank you for contributing to digital healthcare in India!** 🇮🇳

*This project is part of the Digital India initiative and follows MeitY Open Source Policy for government software.*