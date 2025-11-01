#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { FireflyClient } from './client';
import { SankeyProcessor, formatJson, formatSankeyMatic, formatReadable } from './sankey';
import packageJson from '../package.json';

const program = new Command();

/**
 * Display connection information
 */
async function displayConnectionInfo(client: FireflyClient): Promise<void> {
  console.log('\nConnecting to Firefly III...\n');

  try {
    // Get system and user information
    const about = await client.getAbout();
    const user = await client.getAboutUser();

    // Display connection information
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Connected to Firefly III');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('System Information:');
    console.log(`  Firefly III Version: ${about.data.version}`);
    console.log(`  API Version:         ${about.data.api_version}`);
    console.log(`  OS:                  ${about.data.os}`);
    console.log(`  PHP Version:         ${about.data.php_version}`);

    console.log('\nAuthenticated User:');
    console.log(`  User ID:             ${user.data.id}`);
    console.log(`  Email:               ${user.data.attributes.email}`);
    if (user.data.attributes.role) {
      console.log(`  Role:                ${user.data.attributes.role}`);
    }
    console.log(`  Account Status:      ${user.data.attributes.blocked ? 'Blocked' : 'Active'}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // Provide helpful error messages based on the type of error
      if (errorMsg.includes('401') || errorMsg.includes('unauthenticated')) {
        console.error('\n❌ Authentication Failed');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('The API token provided is invalid or has expired.');
        console.error('\nPlease check:');
        console.error('  • Your API token is correct');
        console.error('  • The token has not been revoked');
        console.error('  • You have copied the entire token without extra spaces');
        console.error('\nYou can generate a new token in Firefly III:');
        console.error('  Profile → OAuth → Personal Access Tokens\n');
      } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.error('\n❌ Connection Failed');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Could not reach the Firefly III API.');
        console.error('\nPlease check:');
        console.error('  • Your base URL is correct');
        console.error('  • Firefly III is running and accessible');
        console.error('  • The URL does not include /api (it will be added automatically)\n');
      } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
        console.error('\n❌ Network Error');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Could not connect to the Firefly III server.');
        console.error('\nPlease check:');
        console.error('  • Your internet connection');
        console.error('  • The Firefly III server is online');
        console.error('  • There are no firewall or proxy issues\n');
      } else {
        console.error('\n❌ Error');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error(error.message);
        console.error('');
      }
    }
    process.exit(1);
  }
}

/**
 * Generate the output content
 */
async function generateOutput(
  client: FireflyClient,
  options: {
    start: string;
    end: string;
    excludeAccounts?: string[];
    excludeCategories?: string[];
    excludeBudgets?: string[];
    minAmount?: number;
    format?: 'sankeymatic' | 'json' | 'readable';
  }
): Promise<string> {
  console.log(`\nFetching transactions from ${options.start} to ${options.end}...\n`);

  // Fetch all transactions in the date range
  const transactions = await client.transactions.getAllTransactions({
    start: options.start,
    end: options.end,
    type: 'all',
  });

  console.log(`✓ Fetched ${transactions.length} transactions\n`);

  // Process transactions into Sankey diagram
  const processor = new SankeyProcessor({
    startDate: options.start,
    endDate: options.end,
    excludeAccounts: options.excludeAccounts,
    excludeCategories: options.excludeCategories,
    excludeBudgets: options.excludeBudgets,
    minAmount: options.minAmount,
  });

  const sankeyData = processor.processTransactions(transactions);

  console.log(`✓ Generated Sankey diagram with ${sankeyData.nodes.length} nodes and ${sankeyData.links.length} links\n`);

  // Format output
  if (options.format === 'json') {
    return formatJson(sankeyData);
  } else if (options.format === 'readable') {
    return formatReadable(sankeyData);
  } else {
    // Default to SankeyMatic format
    return formatSankeyMatic(sankeyData);
  }
}

/**
 * Write content to a file
 */
function writeToFile(content: string, filename: string): void {
  try {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✓ Output written to: ${path.resolve(filename)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error writing to file: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Parse comma-separated list option
 */
function parseList(value: string): string[] {
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Get default date range (current month)
 */
function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Main entry point
 */
function main(): void {
  const defaultDates = getDefaultDateRange();

  program
    .name('firefly-iii-sankey')
    .description('Generate Sankey diagrams from Firefly III data')
    .version(packageJson.version)
    .option('-u, --base-url <url>', 'Firefly III base URL (e.g., https://firefly.example.com)')
    .option('-t, --api-token <token>', 'Firefly III API bearer token')
    .option('-s, --start <date>', `start date (YYYY-MM-DD) [default: ${defaultDates.start}]`)
    .option('-e, --end <date>', `end date (YYYY-MM-DD) [default: ${defaultDates.end}]`)
    .option('-o, --output <filename>', 'write output to file instead of console')
    .option('-f, --format <type>', 'output format: sankeymatic, json, or readable [default: readable]', 'readable')
    .option('--exclude-accounts <list>', 'comma-separated list of account names to exclude', parseList)
    .option('--exclude-categories <list>', 'comma-separated list of category names to exclude', parseList)
    .option('--exclude-budgets <list>', 'comma-separated list of budget names to exclude', parseList)
    .option('--min-amount <amount>', 'minimum transaction amount to include', parseFloat)
    .addHelpText('after', `
Environment Variables:
  FIREFLY_BASE_URL    Firefly III base URL (alternative to --base-url)
  FIREFLY_API_TOKEN   API bearer token (alternative to --api-token)

Examples:
  # Generate SankeyMatic diagram for current month
  $ firefly-iii-sankey -u https://firefly.example.com -t your-token-here

  # Generate diagram for specific date range and save to file
  $ firefly-iii-sankey -u https://firefly.example.com -t token \\
      -s 2024-01-01 -e 2024-01-31 -o sankey.txt

  # Exclude specific accounts and output as JSON
  $ firefly-iii-sankey -u https://firefly.example.com -t token \\
      --exclude-accounts "Savings,Investment" -f json -o sankey.json

  # Human-readable format with minimum amount filter
  $ firefly-iii-sankey -u https://firefly.example.com -t token \\
      --format readable --min-amount 10

  # Using environment variables
  $ FIREFLY_BASE_URL=https://firefly.example.com FIREFLY_API_TOKEN=token firefly-iii-sankey
    `)
    .action(async (options) => {
      // Get credentials from options or environment variables
      const baseUrl = options.baseUrl || process.env.FIREFLY_BASE_URL;
      const token = options.apiToken || process.env.FIREFLY_API_TOKEN;

      if (!baseUrl || !token) {
        console.error('\n❌ Missing Required Parameters');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Base URL and API token are required.\n');
        console.error('You can provide them via:');
        console.error('  • Command line flags: --base-url and --api-token');
        console.error('  • Environment variables: FIREFLY_BASE_URL and FIREFLY_API_TOKEN\n');
        console.error('Example:');
        console.error('  $ firefly-iii-sankey -u https://firefly.example.com -t your-token\n');
        process.exit(1);
      }

      // Get date range
      const start = options.start || defaultDates.start;
      const end = options.end || defaultDates.end;

      // Validate dates
      if (new Date(start) > new Date(end)) {
        console.error('\n❌ Invalid Date Range');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Start date must be before or equal to end date.\n');
        process.exit(1);
      }

      // Create client and display connection information
      const client = new FireflyClient({ baseUrl, token });
      await displayConnectionInfo(client);

      // Generate and output diagram data
      const output = await generateOutput(client, {
        start,
        end,
        excludeAccounts: options.excludeAccounts,
        excludeCategories: options.excludeCategories,
        excludeBudgets: options.excludeBudgets,
        minAmount: options.minAmount,
        format: options.format,
      });

      if (options.output) {
        writeToFile(output, options.output);
      } else {
        console.log(output);
      }
    });

  program.parse();
}

// Run the program
main();
