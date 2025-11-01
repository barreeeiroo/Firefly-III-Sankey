# Firefly III Sankey Diagram Generator

A powerful command-line tool that generates Sankey diagrams from your [Firefly III](https://www.firefly-iii.org/) financial data. Visualize your money flows with ease - see where your income comes from and where your expenses go, all in a beautiful, interactive diagram.

![SankeyMatic Compatible](https://img.shields.io/badge/SankeyMatic-Compatible-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎨 **Multiple Output Formats**: SankeyMatic (default), JSON, or human-readable text
- 📊 **Smart Aggregation**: All income flows through "All Funds", then distributes to expenses
- 🏷️ **Category & Budget Tracking**: Visualize how money flows through your budgets and categories
- 🔍 **Flexible Filtering**: Exclude accounts, categories, or budgets; set minimum amounts
- 🎯 **Duplicate Handling**: Automatically handles accounts that appear as both income and expense sources
- 🚫 **Transfer Exclusion**: Ignores internal transfers between your own accounts
- 🌈 **Color Coded**: Different node types get distinct colors for easy identification
- 📅 **Date Range Support**: Analyze any time period with customizable start/end dates

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
- A running Firefly III instance
- API token from your Firefly III account

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
   npx firefly-iii-sankey -u https://your-firefly-instance.com -t your-api-token
   ```

   Or if installed globally:
   ```bash
   firefly-iii-sankey -u https://your-firefly-instance.com -t your-api-token
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
  --min-amount 50

# Combine filters
firefly-iii-sankey -u https://firefly.example.com -t token \
  --exclude-accounts "Savings" \
  --exclude-categories "Internal" \
  --min-amount 10
```

### Output Formats

```bash
# SankeyMatic format (default) - paste into sankeymatic.com
firefly-iii-sankey -u https://firefly.example.com -t token

# JSON format - for custom processing
firefly-iii-sankey -u https://firefly.example.com -t token -f json

# Human-readable text - for quick review
firefly-iii-sankey -u https://firefly.example.com -t token -f readable
```

## How It Works

### Money Flow Model

The tool creates a clear visualization of your finances by routing all money through a central "All Funds" node:

```
Income Flow:
Revenue Accounts → [Income Categories] → All Funds

Expense Flow:
All Funds → [Budgets] → [Expense Categories] → Expense Accounts
```

### Key Concepts

1. **Revenue Accounts**: Where your money comes from (salary, freelance, investments)
2. **All Funds**: Central aggregation point - represents all available money
3. **Budgets**: How you allocate your funds (optional)
4. **Categories**: Classification of income/expenses (optional)
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
- Asset-to-asset transfers are excluded (they're internal movements, not income/expenses)

### Duplicate Account Handling

If an account appears as both a revenue source and expense destination (e.g., "Cash"), the tool automatically:
- Adds `(+)` suffix to the revenue instance
- Adds `(-)` suffix to the expense instance

This prevents the diagram from incorrectly merging these flows.

## Options Reference

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--base-url <url>` | `-u` | Firefly III base URL | - |
| `--api-token <token>` | `-t` | API bearer token | - |
| `--period <period>` | `-p` | Period: YYYY, YYYY-MM, YYYY-QX, or YYYY-MM-DD | - |
| `--start <date>` | `-s` | Start date (YYYY-MM-DD) | First day of current month |
| `--end <date>` | `-e` | End date (YYYY-MM-DD) | Last day of current month |
| `--output <file>` | `-o` | Write to file instead of console | - |
| `--format <type>` | `-f` | Output format: sankeymatic, json, readable | readable |
| `--exclude-accounts <list>` | | Comma-separated account names to exclude | - |
| `--exclude-categories <list>` | | Comma-separated category names to exclude | - |
| `--exclude-budgets <list>` | | Comma-separated budget names to exclude | - |
| `--min-amount <amount>` | | Minimum transaction amount to include | - |
| `--version` | `-V` | Show version number | - |
| `--help` | `-h` | Show help | - |

> **Note**: `--period` cannot be used together with `--start` or `--end`.

## Output Formats

### SankeyMatic Format (Default)

Ready-to-use format for [SankeyMatic](https://sankeymatic.com/build/):

```
// Firefly III Sankey Diagram
// Period: 2024-01-01 to 2024-01-31

:Salary (+) #28a745
:All Funds #6610f2
:Groceries #ffc107
:Supermarket (-) #dc3545

// Income Accounts -> Income Categories
Salary (+) [3000.00] Salary Category

// Income -> All Funds
Salary Category [3000.00] All Funds

// All Funds -> Budgets
All Funds [1000.00] Monthly Budget

// Budgets -> Expense Categories
Monthly Budget [500.00] Groceries

// Expense Categories -> Expense Accounts
Groceries [500.00] Supermarket (-)
```

**Color Scheme:**
- 🟢 Revenue Accounts (Green)
- 🔴 Expense Accounts (Red)
- 🔵 Asset Accounts (Blue)
- 🟡 Categories (Yellow)
- 🔵 Budgets (Cyan)
- 🟣 All Funds (Purple)

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

### Readable Format

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

### Example 4: Significant Expenses Only

Focus on major transactions for the year:

```bash
firefly-iii-sankey \
  -u https://firefly.example.com \
  -t token \
  -p 2024 \
  --min-amount 100 \
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

Highly inspired by the original but now deprecated [Firefly-III/Sankey](https://github.com/firefly-iii/sankey) written in PHP by JC5.

This tool was built with the assistance of Generative AI. All final decisions, content, and project direction were made by the repository owner.

## License

MIT
