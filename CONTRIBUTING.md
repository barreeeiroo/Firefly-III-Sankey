# Contributing to Firefly III Sankey

Thank you for your interest in contributing! This document provides an overview of the project structure and implementation details to help you get started.

## Project Structure

```
src/
├── index.ts                  # Main library export (for npm package)
├── cli.ts                    # Main CLI entry point
├── client/                   # Firefly III API client modules
│   ├── index.ts             # Main client export
│   ├── base-client.ts       # Base HTTP client with common methods
│   ├── about.ts             # System and user info endpoints
│   └── transactions.ts      # Transaction and insight endpoints
├── models/                   # Data models and type definitions
│   ├── index.ts             # Model exports
│   ├── about.ts             # About/system models
│   └── transaction.ts       # Transaction and insight models
└── sankey/                   # Sankey diagram generation module
    ├── index.ts             # Sankey module exports
    ├── entities.ts            # Sankey data structures
    ├── processor.ts         # Transaction processing logic
    └── formatters/          # Output format generators
        ├── index.ts         # Formatter exports
        ├── json.ts          # JSON formatter
        ├── sankeymatic.ts   # SankeyMatic format
        └── readable.ts      # Human-readable text format
```

## Architecture Overview

### 1. Client Layer (`src/client/`)

The client layer handles all communication with the Firefly III API.

**BaseFireflyClient** (`base-client.ts`)
- Provides HTTP methods (`get`, `post`, `put`, `delete`)
- Handles authentication via Bearer tokens
- Manages API endpoint construction
- Centralizes error handling

**Specialized Clients**
- `AboutClient`: System information and user details
- `TransactionsClient`: Transaction data, insights, and pagination
- Each client extends `BaseFireflyClient` for consistent behavior

**Main Client** (`index.ts`)
- `FireflyClient` aggregates all specialized clients
- Single entry point for all API operations
- Configuration passed once at construction

### 2. Models Layer (`src/models/`)

Type-safe data models for API responses and internal data structures.

**Transaction Models** (`transaction.ts`)
- `Transaction`: Complete transaction object from API
- `TransactionSplit`: Individual transaction details
- `InsightResponse`: Aggregated financial insights
- Includes all Firefly III API fields for comprehensive data access

**About Models** (`about.ts`)
- System version and configuration
- User account information

### 3. Sankey Module (`src/sankey/`)

Core business logic for generating Sankey diagrams.

#### Processor (`processor.ts`)

The `SankeyProcessor` class transforms Firefly III transactions into Sankey diagram data.

**Key Features:**

1. **Duplicate Detection**
   - First pass identifies accounts and categories appearing as both revenue/income and expense
   - Adds `(+)` suffix to revenue/income and `(-)` to expense
   - Only applies suffixes when necessary to prevent node conflicts

2. **Transaction Processing**
   - **Default Mode**:
     - Deposits (Income): `[Category] → All Funds`
     - Withdrawals (Expenses): `All Funds → [Budget] → [Category]`
     - Transfers: Excluded (internal movements)

   - **With `--with-accounts`**:
     - Deposits: `Revenue Account → [Category] → All Funds`
     - Withdrawals: `All Funds → [Budget] → [Category] → Expense Account`

   - **With `--with-assets`**:
     - Deposits: `[Category] → Asset Account (+)`
     - Withdrawals: `Asset Account (-) → [Budget] → [Category]`
     - Transfers: `Source Asset (+) → Destination Asset (-)`
     - Each asset appears twice with (+) and (-) suffixes

3. **Missing Data Handling**
   - Transactions without categories use `[NO CATEGORY] (+)` or `[NO CATEGORY] (-)`
   - Expenses without budgets use `[NO BUDGET]`
   - Ensures all transactions are included in visualization

4. **Flow Aggregation**
   - Combines multiple transactions between same nodes
   - Accumulates amounts by currency
   - Maintains node uniqueness via type-prefixed keys

5. **Filtering**
   - Exclude specific accounts, categories, or budgets
   - Minimum transaction amount threshold (`--min-amount-transaction`)
   - Minimum account total threshold (`--min-amount-account`)
   - Respects user-defined exclusions

6. **Smart Grouping**
   - Group small accounts below threshold into `[OTHER ACCOUNTS] (+)` or `[OTHER ACCOUNTS] (-)`
   - Group small categories below threshold into `[OTHER CATEGORIES] (+)` or `[OTHER CATEGORIES] (-)`
   - Simplifies diagrams with many small flows

**Implementation Details:**

```typescript
// Node creation uses type-based keys to prevent conflicts
const key = `${type}:${name}`;  // e.g., "revenue:Salary" vs "expense:Salary"

// Flows stored with source→target:currency format
const flowKey = `${sourceId}->${targetId}:${currency}`;

// All Funds acts as central aggregation node (default mode)
const allFundsId = this.getOrCreateNode('All Funds', 'asset');

// With --with-assets, asset accounts are duplicated
const assetInId = this.getOrCreateNode(`${accountName} (+)`, 'asset');  // Receives income
const assetOutId = this.getOrCreateNode(`${accountName} (-)`, 'asset'); // Pays expenses

// Default category/budget names for missing data
const categoryName = split.category_name || '[NO CATEGORY]';
const budgetName = split.budget_name || '[NO BUDGET]';
```

**Processing Pipeline:**

1. **Identify Duplicates** - First pass to find accounts/categories appearing in both income and expenses
2. **Process Transactions** - Transform each transaction into flows between nodes
3. **Build Links** - Convert flow accumulations into Sankey links
4. **Group Small Nodes** - Aggregate accounts/categories below thresholds (if enabled)
5. **Filter Accounts** - Remove accounts below minimum total (if enabled)
6. **Return Diagram** - Final nodes and links with metadata

#### Formatters (`formatters/`)

Transform processed Sankey data into various output formats.

**SankeyMatic Formatter** (`sankeymatic.ts`)
- Outputs format compatible with https://sankeymatic.com/build/
- Colors are automatically assigned by SankeyMatic
- Organized into commented sections:
  1. Income Accounts → Income Categories
  2. Income → All Funds
  3. All Funds → Budgets
  4. Budgets → Expense Categories
  5. Expense Categories → Expense Accounts
  6. Direct flows (when budget/category absent)

**JSON Formatter** (`json.ts`)
- Standard JSON output with full metadata
- Preserves all node and link information
- Useful for further processing or custom visualizations

**Readable Formatter** (`readable.ts`)
- Human-readable text summary
- Lists all nodes with IDs and types
- Shows flows with formatted amounts

### 4. CLI Layer (`src/cli.ts`)

Command-line interface implementation using Commander.js.

**Features:**
- Credential management (flags or environment variables)
- API version compatibility checking (supports API 6.3.0 - 6.x.x)
- Date range selection with sensible defaults and period shortcuts (YYYY, YYYY-MM, YYYY-QX, YYYY-MM-DD)
- Granularity control (`--with-accounts`, `--with-assets`)
- Category/budget toggling (`--no-categories`, `--no-budgets`)
- Filtering options:
  - Exclude lists (accounts, categories, budgets)
  - Minimum transaction amount (`--min-amount-transaction`)
  - Minimum account total (`--min-amount-account`)
  - Account grouping (`--min-account-grouping-amount`)
  - Category grouping (`--min-category-grouping-amount`)
- Output format selection (SankeyMatic, JSON, readable)
- File output support
- Comprehensive help text with examples
- Error handling with user-friendly messages
- Validation of option combinations

## Data Flow

```
User Input (CLI)
    ↓
FireflyClient (API calls)
    ↓
Transaction Data
    ↓
SankeyProcessor (transformation)
    ↓
SankeyDiagram (internal representation)
    ↓
Formatter (output generation)
    ↓
Console or File
```

## Key Design Decisions

### 1. Two-Pass Processing

The processor makes two passes over transactions:
- **Pass 1**: Identify duplicate account and category names
- **Pass 2**: Process and transform data

This ensures correct suffix application without requiring complex lookahead logic. Duplicates are tracked separately for accounts and categories.

### 2. Type-Based Node Keys

Nodes are keyed by `type:name` to allow same name across different types:
- `revenue:Cash` is different from `expense:Cash`
- Prevents incorrect flow merging
- Enables proper node separation in visualization

### 3. Central "All Funds" Node (Default Mode)

By default, all money flows through a central aggregation point:
- **Benefits**: Clear visualization of total income vs total expenses
- **Trade-off**: Loses visibility of which specific account held the money
- **Rationale**: Focus on financial flows rather than account balances
- **Alternative**: Use `--with-assets` to break down into individual asset accounts

### 4. Module-Based Architecture

Each major component is self-contained:
- Client layer doesn't know about Sankey logic
- Sankey processor doesn't know about CLI
- Formatters are independent and extensible
- **Benefits**: Easy testing, clear responsibilities, simple extension

### 5. Transfer Handling

Asset-to-asset transfers are handled differently based on mode:

**Default Mode (transfers excluded):**
- Transfers are skipped during processing
- **Rationale**: These are internal movements, not income or expenses
- **Result**: Cleaner diagram focused on financial inflows/outflows

**With `--with-assets` (transfers included):**
- Each asset account appears twice: `Account (+)` and `Account (-)`
- Transfers flow from `Source (+)` → `Destination (-)`
- **Rationale**: Shows how money moves between accounts
- **Result**: Complete picture of asset account flows including internal transfers
- **Caveat**: This mode represents cash flows (money in motion) rather than account balances (money at rest). Transfers between accounts create "circular" movements that can inflate total flow values, as the same money gets counted multiple times. The diagram is useful for understanding how money moves through accounts but doesn't directly represent actual balances or total income/expenses.

This design allows users to choose the level of detail they need.

### 6. API Version Compatibility

The tool enforces API version compatibility to ensure reliable operation.

**Version Checking** (`src/utils/version-checker.ts`)
- Validates that the Firefly III API version is within the supported range
- Currently supports: **API version 6.3.0 or higher, below 7.0.0**
- Checks are performed during connection establishment
- Users can bypass checks with `--disable-api-version-check` flag (not recommended)

**Updating Supported Versions:**
1. Modify `SUPPORTED_API_VERSION` constants in `src/utils/version-checker.ts`
2. Test thoroughly with the new API version
3. Update version requirements in README.md and CONTRIBUTING.md
4. Document any breaking changes or new features in release notes

**Version Comparison Logic:**
- Uses semantic versioning comparison (major.minor.patch)
- Minimum check: API version >= 6.3.0
- Maximum check: API version < 7.0.0 (exclusive upper bound)
- Falls back to comparing numeric parts if version format differs

Users encountering unsupported versions are directed to open a GitHub issue to request support.

## Adding New Features

### Adding a New Output Format

1. Create `src/sankey/formatters/yourformat.ts`
2. Implement function: `export function formatYourFormat(data: SankeyDiagram): string`
3. Export from `src/sankey/formatters/index.ts`
4. Update CLI format options in `src/cli.ts`

### Adding New API Endpoints

1. Create or extend client in `src/client/`
2. Add corresponding models in `src/models/`
3. Expose via `FireflyClient` in `src/client/index.ts`
4. Use in processor or CLI as needed

### Adding New Filtering Options

1. Add option to `SankeyProcessorOptions` interface
2. Update `shouldExclude()` or add new filtering logic
3. Add CLI flag in `src/cli.ts`
4. Update documentation

## Development Workflow

### Setup

```bash
npm install
```

### Development

```bash
# Run with ts-node (no build needed)
npm run dev -- -u https://firefly.example.com -t token

# Build
npm run build

# Run built version
npm start
```

### Code Style

- Use TypeScript strict mode
- Prefer explicit types over inference for public APIs
- Document complex logic with comments
- Keep functions focused and single-purpose
- Use descriptive variable names

### Testing Your Changes

1. Test with real Firefly III instance
2. Verify all output formats work correctly
3. Test edge cases:
   - Empty date ranges
   - Accounts with special characters
   - Large transaction volumes
   - Duplicate account names
   - Missing categories/budgets

## Architecture Benefits

- **Separation of Concerns**: Each module has clear responsibility
- **Type Safety**: TypeScript prevents common errors
- **Extensibility**: Easy to add new formats or features
- **Maintainability**: Clear structure makes navigation easy
- **Testability**: Modules can be tested independently

## Common Tasks

### Debugging Transaction Processing

Add logging in `processTransactions()`:

```typescript
console.log('Processing:', split.description, split.amount);
```

### Viewing Raw API Responses

Add logging in `BaseFireflyClient.get()`:

```typescript
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
return data;
```

### Testing Format Output

Create a sample SankeyDiagram and test formatter directly:

```typescript
import { formatSankeyMatic } from './sankey/formatters';

const sample = {
  nodes: [/* ... */],
  links: [/* ... */],
  metadata: {/* ... */}
};

console.log(formatSankeyMatic(sample));
```

## Publishing to npm

This section is for maintainers who have publish rights.

### Automated Publishing (Recommended)

The project uses GitHub Actions to automatically publish to npm when a new version tag is pushed.

#### Setup (One-Time)

1. **Create npm Access Token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type (for CI/CD)
   - Copy the token (you'll only see it once!)

2. **Add Token to GitHub Secrets:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

#### Publishing a New Version

1. **Update version and create tag:**
   ```bash
   # Ensure you're on main branch with latest changes
   git checkout main
   git pull origin main

   # Update version (this creates a git tag automatically)
   npm version patch  # or minor, or major

   # Push commits and tags
   git push origin main --follow-tags
   ```

2. **GitHub Actions will automatically:**
   - Build the project
   - Run tests (when implemented)
   - Publish to npm with provenance
   - Create a GitHub release

3. **Monitor the workflow:**
   - Go to GitHub → Actions tab
   - Watch the "Publish to npm" workflow
   - Verify it completes successfully

#### What the Workflow Does

- ✅ Builds the TypeScript project
- ✅ Verifies package contents
- ✅ Publishes to npm with provenance (authenticity verification)
- ✅ Creates a GitHub release with installation instructions
- ✅ Links to the npm package page

### Manual Publishing (Alternative)

If you need to publish manually:

#### Prerequisites

1. **npm Account**: Ensure you have an npm account with publish permissions
2. **Authentication**: Login to npm via CLI:
   ```bash
   npm login
   ```

3. **Clean State**: Ensure working directory is clean:
   ```bash
   git status
   ```

### Pre-publish Checklist

Before publishing a new version:

- [ ] All tests pass (once tests are implemented)
- [ ] Code builds successfully: `npm run build`
- [ ] Version number updated in `package.json`
- [ ] CHANGELOG.md updated with changes (if exists)
- [ ] README.md is up to date
- [ ] All dependencies are production-ready (no beta versions)
- [ ] Git working directory is clean
- [ ] All changes committed to git

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

Update version using npm:

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

This will:
1. Update version in `package.json`
2. Create a git commit
3. Create a git tag

### Publishing Steps

1. **Ensure you're on main branch:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Update version:**
   ```bash
   npm version <patch|minor|major>
   ```

3. **Verify package contents:**
   ```bash
   npm pack --dry-run
   ```

   This shows what will be included in the published package. Verify:
   - Only `dist/` folder included
   - No `src/` or `node_modules/`
   - README, LICENSE, CONTRIBUTING included

4. **Build the project:**
   ```bash
   npm run build
   ```

   The `prepublishOnly` script will also run automatically before publishing.

5. **Publish to npm:**

   For first release:
   ```bash
   npm publish --access public
   ```

   For subsequent releases:
   ```bash
   npm publish
   ```

6. **Push to git:**
   ```bash
   git push origin main --follow-tags
   ```

7. **Create GitHub release:**
   - Go to GitHub repository
   - Click "Releases" → "Create a new release"
   - Select the version tag
   - Add release notes
   - Publish release

### Testing the Published Package

After publishing, test the package:

```bash
# Install globally from npm
npm install -g firefly-iii-sankey

# Test the CLI
firefly-iii-sankey --version
firefly-iii-sankey --help

# Uninstall
npm uninstall -g firefly-iii-sankey
```

### Rolling Back a Release

If you need to unpublish (within 72 hours):

```bash
npm unpublish firefly-iii-sankey@<version>
```

**Warning**: Unpublishing is discouraged. Prefer publishing a new version with fixes.

### Package Configuration

The package is configured for npm in `package.json`:

- **files**: Specifies what to include (`dist/`, `README.md`, `LICENSE`, `CONTRIBUTING.md`)
- **main**: Entry point for Node.js require/import
- **types**: TypeScript definitions entry point
- **bin**: CLI command mapping
- **engines**: Required Node.js version
- **prepublishOnly**: Runs build before publishing

### What Gets Published

✅ **Included:**
- `dist/` - Compiled JavaScript and type definitions
- `README.md` - User documentation
- `LICENSE` - License file
- `CONTRIBUTING.md` - Contributor guide
- `package.json` - Package metadata

❌ **Excluded** (via `.npmignore`):
- `src/` - TypeScript source files
- `node_modules/` - Dependencies
- `tsconfig.json` - TypeScript configuration
- Development files (`.env`, IDE configs, etc.)

### Troubleshooting Publishing

#### GitHub Actions Issues

**"Error: Unable to authenticate"**
- Verify `NPM_TOKEN` secret is set in GitHub repository settings
- Ensure the token is an "Automation" token, not "Publish" or "Read-only"
- Check token hasn't expired (tokens can expire after 1 year)
- Regenerate token on npm and update GitHub secret

**"Workflow not triggering"**
- Ensure you pushed tags: `git push origin main --follow-tags`
- Verify tag follows pattern `v*.*.*` (e.g., `v1.0.0`)
- Check GitHub Actions are enabled for the repository

**"Build failed in workflow"**
- Check the Actions tab for detailed error logs
- Ensure all files are committed to git
- Try building locally: `npm run build`
- Check `package-lock.json` is committed

**"Publish failed: Package already published"**
- Each version can only be published once
- Increment version: `npm version patch`
- Push new tag: `git push --follow-tags`

#### Manual Publishing Issues

**"You do not have permission to publish"**
- Ensure you're logged in: `npm whoami`
- Check package name isn't taken: `npm view firefly-iii-sankey`
- Verify you have publish rights for scoped packages

**"Package name too similar to existing package"**
- npm may reject names similar to popular packages
- Consider adding a scope: `@yourname/firefly-iii-sankey`

**"prepublishOnly script failed"**
- Build errors prevent publishing
- Fix TypeScript errors: `npm run build`
- Check for missing dependencies

## Questions or Issues?

Feel free to open an issue on GitHub if you have questions or suggestions!

## Acknowledgements

This project is inspired by the original [Firefly-III/Sankey](https://github.com/firefly-iii/sankey) written in PHP by JC5.
