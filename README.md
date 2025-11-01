# Firefly III Sankey Diagram Generator

A powerful command-line tool that generates Sankey diagrams from your [Firefly III](https://www.firefly-iii.org/) financial data. Visualize your money flows with ease - see where your income comes from and where your expenses go, all in a beautiful, interactive diagram.

![SankeyMatic Compatible](https://img.shields.io/badge/SankeyMatic-Compatible-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎨 **Multiple Output Formats**: Human-readable text (default), SankeyMatic, or JSON
- 📊 **Smart Aggregation**: All income flows through "All Funds", then distributes to expenses
- 🎚️ **Granularity Control**: Choose between aggregated or account-level views; show asset account flows with transfers; include/exclude categories and budgets
- 🏷️ **Category & Budget Tracking**: Visualize how money flows through your budgets and categories
- 🔍 **Flexible Filtering**: Exclude accounts, categories, or budgets; filter by transaction amounts or account totals
- 📦 **Smart Grouping**: Aggregate small accounts and categories into "[OTHER]" buckets for cleaner visualizations
- 🎯 **Duplicate Handling**: Automatically handles accounts that appear as both income and expense sources
- 🔄 **Transfer Tracking**: Include transfer flows between asset accounts with `--with-assets` flag
- 🌈 **Auto-Colored**: SankeyMatic automatically assigns colors for easy visualization
- 📅 **Date Range Support**: Analyze any time period with customizable start/end dates or use period shortcuts

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Options Reference](#options-reference)
- [Output Formats](#output-formats)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites

- Node.js 18 or higher
- A running Firefly III instance with **API version 6.3.0 or higher (below 7.0.0)**
- API token from your Firefly III account

> **Note:** The tool validates API compatibility at startup. If your Firefly III instance uses an unsupported API version, you can:
> - Bypass the check with `--disable-api-version-check` (functionality may be limited or broken)
> - [Request support for your API version](https://github.com/barreeeiroo/Firefly-III-Sankey/issues) by opening a GitHub issue

### Quick Try with npx (No Installation Required!)

Run immediately without installing:

```bash
npx firefly-iii-sankey -u https://your-firefly-instance.com -t your-api-token
```

This downloads and runs the tool temporarily - perfect for one-time use or trying it out!

### Install via npm

**Global installation** (use CLI from anywhere):

```bash
npm install -g firefly-iii-sankey
```

**Local installation** (for use in a specific project):

```bash
npm install firefly-iii-sankey
```

### Install from Source

If you want to contribute or use the latest development version:

```bash
git clone https://github.com/barreeeiroo/Firefly-III-Sankey.git
cd Firefly-III-Sankey
npm install
npm run build
npm link  # Optional: for global CLI access
```

## Quick Start

1. **Get your Firefly III API token:**
   - Log into Firefly III
   - Go to Profile → OAuth → Personal Access Tokens
   - Create a new token and copy it

2. **Generate your first diagram:**

   Using npx (no installation):
   ```bash
   npx firefly-iii-sankey -u https://your-firefly-instance.com -t your-api-token -f sankeymatic
   ```

   Or if installed globally:
   ```bash
   firefly-iii-sankey -u https://your-firefly-instance.com -t your-api-token -f sankeymatic
   ```

3. **Copy the output and paste it into [SankeyMatic](https://sankeymatic.com/build/)** to see your visualization!

## Usage

### Basic Usage

**With npx (no installation):**

```bash
# Current month (default)
npx firefly-iii-sankey -u https://firefly.example.com -t your-token

# Full year
npx firefly-iii-sankey -u https://firefly.example.com -t token -p 2024

# Specific month
npx firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-01

# Quarter
npx firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-Q1

# Custom date range
npx firefly-iii-sankey -u https://firefly.example.com -t token \
  -s 2024-01-01 -e 2024-01-15

# Save to file
npx firefly-iii-sankey -u https://firefly.example.com -t token \
  -p 2024 -o my-sankey-diagram.txt
```

**With global installation:**

```bash
# Current month (default)
firefly-iii-sankey -u https://firefly.example.com -t your-token

# Full year
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024

# Specific month
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-01

# Quarter
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-Q1

# Custom date range
firefly-iii-sankey -u https://firefly.example.com -t token \
  -s 2024-01-01 -e 2024-01-15
```

> 💡 **Tip**: Use `npx` for one-time runs or trying the tool. Install globally if you use it regularly.

### Period Shortcuts

The `--period` (or `-p`) option provides convenient shortcuts for common date ranges:

| Format | Example | Description |
|--------|---------|-------------|
| `YYYY` | `2024` | Full year (Jan 1 - Dec 31) |
| `YYYY-MM` | `2024-01` | Specific month (all days) |
| `YYYY-QX` | `2024-Q1` | Quarter (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec) |
| `YYYY-MM-DD` | `2024-01-15` | Single specific day |

**Examples:**

```bash
# Full year 2024
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024

# January 2024
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-01

# First quarter of 2024
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-Q1

# Single day
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024-01-15
```

### Environment Variables

Set credentials once instead of passing them every time:

```bash
export FIREFLY_BASE_URL=https://firefly.example.com
export FIREFLY_API_TOKEN=your-token

# Works with both npx and installed versions
npx firefly-iii-sankey -p 2024  # Uses environment variables
firefly-iii-sankey -p 2024      # If installed globally
```

### Granularity Control

Control the level of detail in your Sankey diagram:

```bash
# Show individual revenue/expense accounts as start/end nodes
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024 --with-accounts

# Show individual asset accounts with transfer flows
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024 --with-assets

# Combine both for maximum detail
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024 \
  --with-accounts --with-assets

# Exclude categories for a simpler view
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024 --no-categories

# Exclude budgets for a simpler view
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024 --no-budgets

# Show individual accounts with categories but no budgets
firefly-iii-sankey -u https://firefly.example.com -t token -p 2024 \
  --with-accounts --no-budgets
```

**Default behavior:**
- Categories/budgets are the start and end nodes
- Flow: [Income Categories] → All Funds → [Budgets] → [Expense Categories]
- Individual revenue/expense accounts are not shown
- Transfer transactions are excluded

**With `--with-accounts`:**
- Shows individual revenue accounts (salary, freelance, etc.) and expense accounts (stores, restaurants, etc.)
- Flow: Revenue Accounts → [Categories] → All Funds → [Budgets] → [Categories] → Expense Accounts

**With `--with-assets`:**
- Breaks down "All Funds" into individual asset accounts
- Each asset account appears twice: `Account Name (+)` receives income, `Account Name (-)` pays expenses
- Transfer transactions flow from `Source (+)` to `Destination (-)`
- Flow: [Categories] → Asset (+) → Asset (-) → [Budgets] → [Categories]

**With both `--with-accounts` and `--with-assets`:**
- Maximum detail showing all account types
- Flow: Revenue Accounts → [Categories] → Asset (+) → Asset (-) → [Budgets] → [Categories] → Expense Accounts

**With `--no-categories` or `--no-budgets`:**
- Removes intermediate nodes for simplified visualization
- Creates more direct flows between remaining nodes

### Filtering

```bash
# Exclude specific accounts
firefly-iii-sankey -u https://firefly.example.com -t token \
  --exclude-accounts "Savings Account,Investment Account"

# Exclude categories
firefly-iii-sankey -u https://firefly.example.com -t token \
  --exclude-categories "Internal,Transfers"

# Exclude budgets
firefly-iii-sankey -u https://firefly.example.com -t token \
  --exclude-budgets "Irregular Expenses"

# Only show transactions above $50
firefly-iii-sankey -u https://firefly.example.com -t token \
  --min-amount-transaction 50

# Show accounts with totals above $100 (requires --with-accounts)
firefly-iii-sankey -u https://firefly.example.com -t token \
  --with-accounts --min-amount-account 100

# Combine filters: show accounts with totals > $100, hiding small transactions
firefly-iii-sankey -u https://firefly.example.com -t token \
  --with-accounts \
  --min-amount-transaction 10 \
  --min-amount-account 100

# Group small accounts and categories for cleaner view
firefly-iii-sankey -u https://firefly.example.com -t token \
  --with-accounts \
  --min-account-grouping-amount 50 \
  --min-category-grouping-amount 25
```

### Output Formats

```bash
# Human-readable text (default) - for quick review
firefly-iii-sankey -u https://firefly.example.com -t token

# SankeyMatic format - paste into sankeymatic.com for visualization
firefly-iii-sankey -u https://firefly.example.com -t token -f sankeymatic

# JSON format - for custom processing
firefly-iii-sankey -u https://firefly.example.com -t token -f json
```

## How It Works

### Money Flow Model

The tool creates a clear visualization of your finances by routing all money through a central "All Funds" node:

```
Income Flow (default):
[Income Categories] → All Funds

Expense Flow (default):
All Funds → [Budgets] → [Expense Categories]
```

With `--with-accounts`, individual revenue and expense accounts are shown:

```
Income Flow (with --with-accounts):
Revenue Accounts → [Income Categories] → All Funds

Expense Flow (with --with-accounts):
All Funds → [Budgets] → [Expense Categories] → Expense Accounts
```

With `--with-assets`, "All Funds" is broken down into individual asset accounts:

```
Income Flow (with --with-assets):
[Income Categories] → Checking Account (+)
                   → Savings Account (+)

Transfer Flow:
Checking Account (+) → Savings Account (-)

Expense Flow (with --with-assets):
Checking Account (-) → [Budgets] → [Expense Categories]
Savings Account (-)  → [Budgets] → [Expense Categories]
```

Each asset account has two nodes:
- `Account Name (+)` receives income and sends transfers
- `Account Name (-)` receives transfers and pays expenses

**⚠️ Important Note about `--with-assets`:**
This option can be confusing due to the way it represents cash flows through asset accounts. Because the diagram shows **cash flows** (money in motion) rather than **account balances** (money at rest), transfers between accounts create "circular" movements that may make total flow values appear inflated. The same money moving between accounts gets counted multiple times in the flow visualization. This is useful for understanding how money moves through your accounts, but the values don't directly represent your actual account balances or total income/expenses. For a clearer view of pure income vs. expenses, use the default mode without `--with-assets`.

Use `--no-categories` or `--no-budgets` to remove intermediate nodes for a simpler view.

### Key Concepts

1. **Revenue Accounts**: Where your money comes from (salary, freelance, investments)
2. **All Funds**: Central aggregation point - represents all available money
3. **Budgets**: How you allocate your funds (transactions without budgets use `[NO BUDGET]`)
4. **Categories**: Classification of income/expenses (transactions without categories use `[NO CATEGORY]`)
5. **Expense Accounts**: Where your money goes (stores, utilities, restaurants)

### Transaction Processing

**Deposits (Income):**
- If categorized: `Revenue Account → Category → All Funds`
- If not categorized: `Revenue Account → All Funds`

**Withdrawals (Expenses):**
- With budget and category: `All Funds → Budget → Category → Expense`
- With budget only: `All Funds → Budget → Expense`
- With category only: `All Funds → Category → Expense`
- Neither: `All Funds → Expense`

**Transfers:**
- By default, asset-to-asset transfers are excluded (they're internal movements, not income/expenses)
- With `--with-assets`, transfers flow from `Source Asset (+)` to `Destination Asset (-)`

### Duplicate Handling

If an account or category appears as both revenue/income and expense, the tool automatically adds suffixes to distinguish them:

**Accounts:**
- Revenue account: `Account Name (+)`
- Expense account: `Account Name (-)`

**Categories:**
- Income category: `Category Name (+)`
- Expense category: `Category Name (-)`

This prevents the diagram from incorrectly merging flows that should be separate.

### Missing Categories and Budgets

Transactions without categories or budgets are automatically grouped:

- **Transactions without a category**: Labeled as `[NO CATEGORY]`
- **Expenses without a budget**: Labeled as `[NO BUDGET]`

This allows you to identify uncategorized or unbudgeted transactions in your visualization.

You can exclude these nodes entirely using `--no-categories` or `--no-budgets` flags.

### Grouping Small Accounts and Categories

To simplify diagrams with many small accounts or categories, you can group them into aggregated buckets:

**Account Grouping** (`--min-account-grouping-amount`):
- Accounts with totals below this threshold are grouped into `[OTHER ACCOUNTS] (+)` (revenue) or `[OTHER ACCOUNTS] (-)` (expense)
- Only works when `--with-accounts` is enabled
- Example: With threshold of 100, ten accounts with €10 each combine into `[OTHER ACCOUNTS]`

**Category Grouping** (`--min-category-grouping-amount`):
- Categories with totals below this threshold are grouped into `[OTHER CATEGORIES] (+)` (income) or `[OTHER CATEGORIES] (-)` (expense)
- Works in both default and `--with-accounts` modes
- Example: With threshold of 50, small categories like "Coffee" (€5) and "Snacks" (€8) combine into `[OTHER CATEGORIES]`

```bash
# Group small accounts (< €50) when showing individual accounts
firefly-iii-sankey -p 2024 --with-accounts --min-account-grouping-amount 50

# Group small categories (< €25)
firefly-iii-sankey -p 2024 --min-category-grouping-amount 25

# Combine both for maximum clarity
firefly-iii-sankey -p 2024 --with-accounts \
  --min-account-grouping-amount 100 \
  --min-category-grouping-amount 50
```

## Options Reference

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--base-url <url>` | `-u` | Firefly III base URL | - |
| `--api-token <token>` | `-t` | API bearer token | - |
| `--period <period>` | `-p` | Period: YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD | - |
| `--start <date>` | `-s` | Start date (YYYY-MM-DD) | First day of current month |
| `--end <date>` | `-e` | End date (YYYY-MM-DD) | Last day of current month |
| `--output <file>` | `-o` | Write to file instead of console | - |
| `--format <type>` | `-f` | Output format: readable, sankeymatic, json | readable |
| `--with-accounts` | | Show individual revenue/expense accounts as start/end nodes | `false` |
| `--with-assets` | | Break down All Funds into individual asset accounts with transfers | `false` |
| `--no-categories` | | Exclude category nodes from the diagram | - |
| `--no-budgets` | | Exclude budget nodes from the diagram | - |
| `--exclude-accounts <list>` | | Comma-separated account names to exclude | - |
| `--exclude-categories <list>` | | Comma-separated category names to exclude | - |
| `--exclude-budgets <list>` | | Comma-separated budget names to exclude | - |
| `--min-amount-transaction <amount>` | | Minimum transaction amount to include | - |
| `--min-amount-account <amount>` | | Minimum total for accounts (requires `--with-accounts`) | - |
| `--min-account-grouping-amount <amount>` | | Group accounts below this into `[OTHER ACCOUNTS]` | - |
| `--min-category-grouping-amount <amount>` | | Group categories below this into `[OTHER CATEGORIES]` | - |
| `--disable-api-version-check` | | Bypass API version compatibility check (use at your own risk) | - |
| `--version` | `-V` | Show version number | - |
| `--help` | `-h` | Show help | - |

**Notes:**
- `--period` cannot be used together with `--start` or `--end`
- `--min-amount-account` requires `--with-accounts` to be set
- `--min-account-grouping-amount` requires `--with-accounts` to be set

## Output Formats

### Readable Format (Default)

Human-friendly text summary:

```
Firefly III Sankey Diagram
============================
Period: 2024-01-01 to 2024-01-31
Currency: USD

Nodes (5):
  [0] Salary (revenue)
  [1] All Funds (asset)
  [2] Groceries (category)
  [3] Supermarket (expense)

Flows (3):
  Salary → All Funds: 3000.00 USD
  All Funds → Groceries: 500.00 USD
  Groceries → Supermarket: 500.00 USD
```

### SankeyMatic Format

Ready-to-use format for [SankeyMatic](https://sankeymatic.com/build/):

```
// Firefly III Sankey Diagram
// Period: 2024-01-01 to 2024-01-31

// Income Accounts -> Income Categories
Salary (+) [3000.00] Salary Category

// Income -> Assets
Salary Category [3000.00] All Funds

// Assets -> Budgets
All Funds [1000.00] Monthly Budget

// Budgets -> Expense Categories
Monthly Budget [500.00] Groceries

// Expense Categories -> Expense Accounts
Groceries [500.00] Supermarket (-)
```

Colors are automatically assigned by SankeyMatic when you paste the output into https://sankeymatic.com/build/

### JSON Format

Structured data for custom processing:

```json
{
  "nodes": [
    { "id": 0, "name": "Salary", "type": "revenue" },
    { "id": 1, "name": "All Funds", "type": "asset" }
  ],
  "links": [
    { "source": 0, "target": 1, "value": 3000.00, "currency": "USD" }
  ],
  "metadata": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "generatedAt": "2024-01-31T12:00:00.000Z",
    "currency": "USD"
  }
}
```

## Examples

### Example 1: Year-End Review

Visualize your entire year's finances:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  -o 2024-financial-year.txt
```

### Example 2: Quarterly Review

Analyze first quarter spending:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024-Q1 \
  --format readable
```

### Example 3: Monthly Budget Review

See where your budgeted money went in November:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024-11 \
  --format readable
```

### Example 4: Significant Transactions Only

Focus on major transactions for the year:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --min-amount-transaction 100 \
  -o major-expenses.txt
```

### Example 5: Clean View Without Transfers

Exclude savings and investment transfers for Q4:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024-Q4 \
  --exclude-accounts "Savings Account,Investment Account,Emergency Fund"
```

### Example 6: Export as JSON for Analysis

Get structured data for the entire year:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  -f json \
  -o finances.json
```

### Example 7: Simplified View Without Budgets

Focus on category-level spending without budget breakdown:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --no-budgets
```

### Example 8: Account-Level Detail

See exactly which accounts money flows through:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024-Q4 \
  --with-accounts
```

### Example 9: Maximum Simplification

Direct flows from revenue sources to expense destinations:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --no-categories --no-budgets
```

### Example 10: Focus on Major Accounts

Show only accounts with significant activity (total > $500):

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --with-accounts \
  --min-amount-account 500
```

### Example 11: Group Small Categories

Simplify the view by grouping categories under €50:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --min-category-grouping-amount 50
```

### Example 12: Clean Diagram with Grouping

Show individual accounts but group small ones for clarity:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --with-accounts \
  --min-account-grouping-amount 100 \
  --min-category-grouping-amount 50
```

### Example 13: Asset Account Flows with Transfers

Show how money flows through your asset accounts including transfers:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --with-assets
```

### Example 14: Maximum Detail View

Show all accounts, assets, categories, and budgets:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --with-accounts \
  --with-assets
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (no build needed)
npm run dev -- -u https://firefly.example.com -t token

# Build
npm run build

# Run built version
npm start
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Project structure and architecture
- Implementation details
- How to add new features
- Development workflow
- Code style guidelines

## Troubleshooting

### "Authentication Failed"
- Check your API token is correct
- Verify the token hasn't expired
- Ensure you copied the entire token

### "Connection Failed"
- Verify your Firefly III instance is accessible
- Check the URL is correct (don't include `/api`)
- Ensure Firefly III is running

### "No transactions found"
- Check the date range includes transactions
- Verify filters aren't too restrictive
- Try without `--min-amount` or exclusions

## Acknowledgements

Highly inspired by the original but now deprecated [Firefly-III/Sankey](https://github.com/firefly-iii/sankey) written in PHP by
[JC5](https://github.com/JC5).

This tool was built with the assistance of Generative AI. All final decisions, content, and project direction were made by the repository owner.

## License

MIT
