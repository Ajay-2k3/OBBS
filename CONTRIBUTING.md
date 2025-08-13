# Contributing to Online Blood Bank System

Thank you for your interest in contributing to the Online Blood Bank System! This document provides guidelines and information for contributors.

## Code of Conduct

Please read and follow our Code of Conduct to ensure a welcoming environment for all contributors.

## Getting Started

1. **Fork the Repository**
   \`\`\`bash
   git clone https://github.com/your-username/online-blood-bank.git
   cd online-blood-bank
   \`\`\`

2. **Set Up Development Environment**
   Follow the setup instructions in README.md

3. **Create a Branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Component Guidelines
- Use functional components with hooks
- Implement proper TypeScript types
- Include JSDoc comments for complex functions
- Follow the existing component structure

### Database Changes
- Create migration scripts for schema changes
- Update TypeScript types after schema changes
- Test migrations on development database first
- Document breaking changes

## Testing

### Running Tests
\`\`\`bash
npm run test
npm run test:watch
npm run test:coverage
\`\`\`

### Writing Tests
- Write unit tests for utility functions
- Include integration tests for API routes
- Test components with React Testing Library
- Mock external dependencies

## Submitting Changes

### Pull Request Process
1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit pull request with clear description

### Pull Request Template
\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
\`\`\`

## Issue Reporting

### Bug Reports
Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details

### Feature Requests
Include:
- Problem description
- Proposed solution
- Alternative solutions considered
- Additional context

## Development Setup

### Required Tools
- Node.js 18+
- Git
- Code editor (VS Code recommended)
- Supabase CLI (optional)

### Recommended Extensions (VS Code)
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- GitLens

## Project Structure

\`\`\`
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                # Utilities and configurations
├── scripts/            # Database scripts
├── public/             # Static assets
└── docs/               # Documentation
\`\`\`

## Questions?

- Create an issue for bugs or feature requests
- Join our Discord community
- Email: support@bloodbank.example.com

Thank you for contributing! 🩸❤️
