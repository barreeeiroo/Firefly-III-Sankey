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
    ├── models.ts            # Sankey data structures
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

1. **Duplicate Account Detection**
   - First pass identifies accounts appearing as both revenue and expense
   - Adds `(+)` suffix to revenue accounts and `(-)` to expense accounts
   - Only applies suffixes when necessary to prevent node conflicts

2. **Transaction Processing**
   - **Deposits (Income)**: `Revenue Account → [Category] → All Funds`
   - **Withdrawals (Expenses)**: `All Funds → [Budget] → [Category] → Expense Account`
   - **Transfers**: Excluded (internal account movements)

3. **Flow Aggregation**
   - Combines multiple transactions between same nodes
   - Accumulates amounts by currency
   - Maintains node uniqueness via type-prefixed keys

4. **Filtering**
   - Exclude specific accounts, categories, or budgets
   - Minimum transaction amount threshold
   - Respects user-defined exclusions

**Implementation Details:**

```typescript
// Node creation uses type-based keys to prevent conflicts
const key = `${type}:${name}`;  // e.g., "revenue:Salary" vs "expense:Salary"

// Flows stored with source→target:currency format
const flowKey = `${sourceId}->${targetId}:${currency}`;

// All Funds acts as central aggregation node
const allFundsId = this.getOrCreateNode('All Funds', 'asset');
```

#### Formatters (`formatters/`)

Transform processed Sankey data into various output formats.

**SankeyMatic Formatter** (`sankeymatic.ts`)
- Outputs format compatible with https://sankeymatic.com/build/
- Color-coded nodes by type:
  - Revenue: Green (`#28a745`)
  - Expense: Red (`#dc3545`)
  - Asset: Blue (`#007bff`)
  - Category: Yellow (`#ffc107`)
  - Budget: Cyan (`#17a2b8`)
  - All Funds: Purple (`#6610f2`)
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
- Date range selection with sensible defaults
- Filtering options (accounts, categories, budgets, minimum amount)
- Output format selection
- File output support
- Comprehensive help text with examples
- Error handling with user-friendly messages

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
- **Pass 1**: Identify duplicate account names
- **Pass 2**: Process and transform data

This ensures correct suffix application without requiring complex lookahead logic.

### 2. Type-Based Node Keys

Nodes are keyed by `type:name` to allow same name across different types:
- `revenue:Cash` is different from `expense:Cash`
- Prevents incorrect flow merging
- Enables proper node separation in visualization

### 3. Central "All Funds" Node

All money flows through a central aggregation point:
- **Benefits**: Clear visualization of total income vs total expenses
- **Trade-off**: Loses visibility of which specific account held the money
- **Rationale**: Focus on financial flows rather than account balances

### 4. Module-Based Architecture

Each major component is self-contained:
- Client layer doesn't know about Sankey logic
- Sankey processor doesn't know about CLI
- Formatters are independent and extensible
- **Benefits**: Easy testing, clear responsibilities, simple extension

### 5. Transfer Exclusion

Asset-to-asset transfers are excluded:
- **Rationale**: These are internal movements, not income or expenses
- **Result**: Cleaner diagram focused on financial inflows/outflows
- **Note**: Users who want transfers can modify `processTransactions()`

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

### Prerequisites

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
