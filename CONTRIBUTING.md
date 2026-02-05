# Contributing to Feen

First off, thank you for considering contributing to Feen! It's people like you that make Feen such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (OS, Node version, browser)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **A clear and descriptive title**
- **Detailed description of the proposed feature**
- **Explain why this feature would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** for any new functionality
5. **Ensure all tests pass**: `npm test`
6. **Run linting**: `npm run lint`
7. **Update documentation** if needed
8. **Submit your PR** with a clear description

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Git

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/feen.git
cd feen

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development database and Redis
docker-compose -f docker-compose.dev.yml up -d

# Push database schema
npm run db:push

# Seed development data
npm run db:seed

# Start the development server
npm run dev
```

### Project Structure

```
feen/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   └── dashboard/    # Dashboard pages
│   ├── components/       # React components
│   │   ├── ui/           # Base UI components
│   │   └── dashboard/    # Dashboard-specific components
│   ├── lib/              # Utility libraries
│   │   ├── auth.ts       # Authentication configuration
│   │   ├── crypto.ts     # Encryption utilities
│   │   ├── db.ts         # Database client
│   │   └── redis.ts      # Redis client
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── docs/                 # Documentation
└── public/               # Static assets
```

### Coding Standards

#### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for functions

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

// Avoid
type User = {
  id: string;
  name: string;
  email: string;
};

function getUser(id) {
  return db.user.findUnique({ where: { id } });
}
```

#### React Components

- Use functional components with hooks
- Use named exports for components
- Keep components small and focused
- Use proper TypeScript props interfaces

```typescript
// Good
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ children, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button onClick={onClick} className={styles[variant]}>
      {children}
    </button>
  );
}
```

#### Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Use CSS variables for theme colors
- Keep utility classes organized (layout, spacing, typography, colors)

#### Git Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add GitHub OAuth provider
fix(proxy): handle rate limit errors correctly
docs(readme): update installation instructions
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/lib/crypto.test.ts
```

Write tests for:
- All new utility functions
- API route handlers
- Critical business logic
- Bug fixes (regression tests)

### Database Changes

When making database schema changes:

1. Update `prisma/schema.prisma`
2. Create a migration: `npm run db:migrate -- --name your_migration_name`
3. Update seed data if needed
4. Test with a fresh database

## Review Process

1. All PRs require at least one review
2. CI checks must pass (tests, linting, build)
3. Documentation must be updated if needed
4. Breaking changes must be clearly documented

## Release Process

Releases follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

## Getting Help

- Check existing [issues](https://github.com/yethikrishna/feen/issues)
- Read the [documentation](docs/)
- Ask questions in [discussions](https://github.com/yethikrishna/feen/discussions)

## Recognition

Contributors will be recognized in:
- The README file
- Release notes
- Our website (if applicable)

Thank you for contributing to Feen! 🎉
