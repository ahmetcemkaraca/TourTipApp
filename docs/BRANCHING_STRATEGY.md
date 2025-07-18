# Branching Strategy

## Overview
This project follows a Git Flow branching strategy with the following branch structure:

## Branch Types

### Main Branches
- **main**: Production-ready code. All releases are tagged from this branch.
- **develop**: Integration branch for features. Contains the latest development changes.

### Supporting Branches
- **feature/**: New features and enhancements
  - Branch from: `develop`
  - Merge back to: `develop`
  - Naming: `feature/feature-name` or `feature/TICKET-123-feature-name`

- **release/**: Preparation for production releases
  - Branch from: `develop`
  - Merge back to: `main` and `develop`
  - Naming: `release/v1.0.0`

- **hotfix/**: Critical fixes for production
  - Branch from: `main`
  - Merge back to: `main` and `develop`
  - Naming: `hotfix/v1.0.1-critical-fix`

## Workflow

### Feature Development
1. Create feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. Develop and commit changes
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create Pull Request to `develop`
   ```bash
   git push origin feature/new-feature
   ```

### Release Process
1. Create release branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. Finalize release (version bumps, documentation)
3. Merge to `main` and tag
   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   ```

4. Merge back to `develop`
   ```bash
   git checkout develop
   git merge release/v1.0.0
   ```

### Hotfix Process
1. Create hotfix branch from `main`
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/v1.0.1-critical-fix
   ```

2. Fix and test
3. Merge to `main` and `develop`

## Commit Message Convention
Follow Conventional Commits specification:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

## Pull Request Guidelines
- All changes must go through Pull Request review
- Require at least 1 approval for feature branches
- Require at least 2 approvals for main branch
- All CI checks must pass before merging
- Use squash and merge for feature branches