# Publishing Edge Memory Protocol SDK to npm

This guide covers how to publish `@edge-memory/core` to npm and distribute it to the mobile AI ecosystem.

## Prerequisites

1. **npm Account**: Create one at https://www.npmjs.com/signup
2. **npm CLI**: Already installed with Node.js
3. **GitHub Account**: For source control and CI/CD

## Publishing Strategy

### Monorepo Approach (Current)

We're keeping the SDK in the main repo under `/sdk` directory:

**Advantages:**
- ✅ Spec and SDK stay synchronized
- ✅ Demo app proves SDK works
- ✅ Single source of truth for issues/PRs
- ✅ Easier to maintain consistency

**Package Name:** `@edge-memory/core`
- Scoped package (looks professional)
- Allows future packages: `@edge-memory/react`, `@edge-memory/swift`, etc.

---

## Step-by-Step Publishing Process

### 1. Initial Setup (One-Time)

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami

# Navigate to SDK directory
cd sdk
```

### 2. Pre-Publish Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] README.md is complete and accurate
- [ ] package.json has correct version
- [ ] CHANGELOG.md is updated
- [ ] GitHub repo URL is correct
- [ ] Author info is filled in

### 3. Test the Package Locally

```bash
# Build the package
npm run build

# Create a tarball to inspect
npm pack

# This creates edge-memory-core-1.0.0.tgz
# Extract and inspect to verify contents
tar -xzf edge-memory-core-1.0.0.tgz
ls package/

# Test in another project
cd /path/to/test-project
npm install /path/to/edge-memory/sdk/edge-memory-core-1.0.0.tgz
```

### 4. Publish to npm

```bash
# Dry run to see what would be published
npm publish --dry-run

# Publish for real (first time requires --access public for scoped packages)
npm publish --access public

# For subsequent updates
npm publish
```

### 5. Verify Publication

```bash
# Check on npm registry
npm view @edge-memory/core

# Install in a test project
npm install @edge-memory/core
```

---

## Version Management

We follow **Semantic Versioning** (semver):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Updating Versions

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major

# This automatically:
# 1. Updates package.json version
# 2. Creates a git commit
# 3. Creates a git tag
# 4. Runs prepublishOnly script (builds)
```

---

## Automated Publishing with GitHub Actions

### Setup CI/CD Pipeline

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        working-directory: ./sdk
        run: npm ci
      
      - name: Build
        working-directory: ./sdk
        run: npm run build
      
      - name: Publish to npm
        working-directory: ./sdk
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup npm Token

1. Generate token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add to GitHub: Settings → Secrets → Actions → New repository secret
3. Name: `NPM_TOKEN`
4. Value: Your npm token

### Publishing Workflow

```bash
# 1. Update version and changelog
npm version minor
git push && git push --tags

# 2. Create GitHub release
# Go to: https://github.com/yourusername/edge-memory/releases/new
# Tag: v1.1.0
# Title: v1.1.0 - Feature Name
# Description: Copy from CHANGELOG.md

# 3. GitHub Action automatically publishes to npm
```

---

## Distribution Strategy

### 1. npm Registry (Primary)

**Target Audience:** React Native/Expo developers

```bash
npm install @edge-memory/core
```

**Usage:**
```typescript
import { createMemoryStore } from '@edge-memory/core';
```

### 2. Documentation Site

**Recommended:** Create docs with:
- [Docusaurus](https://docusaurus.io/) - React-based
- [VitePress](https://vitepress.dev/) - Vue-based
- [MkDocs](https://www.mkdocs.org/) - Python-based

**Host on:** GitHub Pages, Vercel, or Netlify (free)

**Content:**
- Getting Started guide
- API Reference
- Integration examples
- Protocol specification
- Migration guides

### 3. Example Projects

Create separate repos demonstrating:
- Chat app with memory (current demo)
- Notes app with shared memory
- Task manager with memory
- Cross-app memory sharing demo

### 4. Community Building

**GitHub:**
- Add topics: `ai`, `memory`, `react-native`, `edge-computing`, `llm`
- Create issue templates
- Add contributing guidelines
- Enable discussions

**Social:**
- Dev.to article: "Building an Open Standard for AI Memory"
- Twitter/X thread showing the demo
- Reddit posts in r/reactnative, r/LocalLLaMA
- Hacker News "Show HN" post

**Developer Relations:**
- Submit to Awesome lists (awesome-react-native, awesome-ai)
- Present at React Native meetups
- Write integration guides for popular frameworks

---

## Maintenance Best Practices

### Regular Updates

1. **Security:** Run `npm audit` monthly
2. **Dependencies:** Update peer dependencies as ecosystem evolves
3. **Testing:** Add tests before each release
4. **Documentation:** Keep README in sync with features

### Issue Management

- Label issues: `bug`, `enhancement`, `documentation`, `question`
- Use milestones for version planning
- Respond to issues within 48 hours
- Close stale issues after 30 days of inactivity

### Breaking Changes

When making breaking changes:
1. Announce in advance (GitHub discussion)
2. Provide migration guide
3. Bump major version
4. Support previous major version for 6 months

---

## Marketing the SDK

### Launch Checklist

- [ ] Publish v1.0.0 to npm
- [ ] Create documentation site
- [ ] Write launch blog post
- [ ] Post on social media
- [ ] Submit to Product Hunt
- [ ] Post "Show HN" on Hacker News
- [ ] Share in React Native communities
- [ ] Email Cactus team about integration
- [ ] Add to Awesome lists

### Ongoing Promotion

- Monthly blog posts about use cases
- Video tutorials on YouTube
- Integration examples with popular tools
- Conference talk proposals
- Podcast appearances

---

## Future Package Ecosystem

```
@edge-memory/core          # Current SDK (React Native/Expo)
@edge-memory/react         # React hooks wrapper
@edge-memory/swift         # Native iOS SDK
@edge-memory/kotlin        # Native Android SDK
@edge-memory/cli           # CLI tools for debugging
@edge-memory/server        # Optional sync server
@edge-memory/embeddings    # Embedding providers
```

---

## Quick Reference

```bash
# Test locally
cd sdk && npm run build && npm pack

# Publish new version
npm version patch  # or minor/major
npm publish

# View published package
npm view @edge-memory/core

# Install in project
npm install @edge-memory/core
```

---

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [React Native Library Guide](https://reactnative.dev/docs/the-new-architecture/create-module-library)
- [TypeScript Library Starter](https://github.com/alexjoverm/typescript-library-starter)

---

## Support

For questions about publishing:
- GitHub Discussions: https://github.com/yourusername/edge-memory/discussions
- npm Support: https://www.npmjs.com/support
- React Native Community: https://reactnative.dev/community/overview
