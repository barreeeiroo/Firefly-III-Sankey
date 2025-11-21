/**
 * SankeyMatic Formatter for Sankey Diagrams
 */

import { SankeyDiagram } from '../entities';
import * as LZString from 'lz-string';

/**
 * Generate a SankeyMatic URL with encoded diagram data
 * @param diagramText The diagram text to encode
 * @param baseUrl Optional custom SankeyMatic base URL (defaults to https://sankeymatic.com)
 */
export function generateSankeyMaticUrl(diagramText: string, baseUrl?: string): string {
  const compressed = LZString.compressToEncodedURIComponent(diagramText);
  const url = baseUrl || 'https://sankeymatic.com';
  // Remove trailing slash if present
  const cleanUrl = url.replace(/\/$/, '');
  return `${cleanUrl}/build/?i=${compressed}`;
}

/**
 * Format Sankey diagram data in SankeyMatic format
 * Output can be directly pasted into https://sankeymatic.com/build/
 */
export function formatSankeyMatic(data: SankeyDiagram, options?: { includeUrl?: boolean; baseUrl?: string }): string {
  const baseUrl = options?.baseUrl || 'https://sankeymatic.com';
  const cleanUrl = baseUrl.replace(/\/$/, '');

  let output = `// Firefly III Sankey Diagram
// Period: ${data.metadata.startDate} to ${data.metadata.endDate}
// Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}
// Currency: ${data.metadata.currency}
// Paste this into ${cleanUrl}/build/

`;

  // Categorize flows into sections
  const incomeToCategories: typeof data.links = [];
  const categoriesToAllFunds: typeof data.links = [];
  const incomeDirectToAllFunds: typeof data.links = [];
  const allFundsToBudgets: typeof data.links = [];
  const allFundsToCategories: typeof data.links = [];
  const allFundsToExpenses: typeof data.links = [];
  const budgetsToCategories: typeof data.links = [];
  const budgetsToExpenses: typeof data.links = [];
  const categoriesToExpenses: typeof data.links = [];
  const otherFlows: typeof data.links = [];  // Catch-all for unmatched flows (e.g., asset account flows)

  for (const link of data.links) {
    const source = data.nodes.find((n) => n.id === link.source);
    const target = data.nodes.find((n) => n.id === link.target);

    if (!source || !target) continue;

    // Income Accounts -> Income Categories
    if (source.type === 'revenue' && target.type === 'category') {
      incomeToCategories.push(link);
    }
    // Income Categories -> All Funds (or Asset+)
    else if (source.type === 'category' && (target.name === 'All Funds' || target.type === 'asset')) {
      categoriesToAllFunds.push(link);
    }
    // Income Accounts -> All Funds (direct)
    else if (source.type === 'revenue' && target.name === 'All Funds') {
      incomeDirectToAllFunds.push(link);
    }
    // All Funds (or Asset-) -> Budgets
    else if ((source.name === 'All Funds' || source.type === 'asset') && target.type === 'budget') {
      allFundsToBudgets.push(link);
    }
    // All Funds (or Asset-) -> Expense Categories
    else if ((source.name === 'All Funds' || source.type === 'asset') && target.type === 'category') {
      allFundsToCategories.push(link);
    }
    // All Funds (or Asset-) -> Expense Accounts (direct)
    else if ((source.name === 'All Funds' || source.type === 'asset') && target.type === 'expense') {
      allFundsToExpenses.push(link);
    }
    // Budgets -> Expense Categories
    else if (source.type === 'budget' && target.type === 'category') {
      budgetsToCategories.push(link);
    }
    // Budgets -> Expense Accounts
    else if (source.type === 'budget' && target.type === 'expense') {
      budgetsToExpenses.push(link);
    }
    // Expense Categories -> Expense Accounts
    else if (source.type === 'category' && target.type === 'expense') {
      categoriesToExpenses.push(link);
    }
    // Asset -> Asset transfers and any other unmatched flows
    else {
      otherFlows.push(link);
    }
  }

  // Add flows in organized sections
  if (incomeToCategories.length > 0) {
    output += '// Income Accounts -> Income Categories\n';
    for (const link of incomeToCategories) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (categoriesToAllFunds.length > 0 || incomeDirectToAllFunds.length > 0) {
    output += '// Income -> Assets\n';
    for (const link of [...categoriesToAllFunds, ...incomeDirectToAllFunds]) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (allFundsToBudgets.length > 0) {
    output += '// Assets -> Budgets\n';
    for (const link of allFundsToBudgets) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (budgetsToCategories.length > 0) {
    output += '// Budgets -> Expense Categories\n';
    for (const link of budgetsToCategories) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (allFundsToCategories.length > 0) {
    output += '// Assets -> Expense Categories (no budget)\n';
    for (const link of allFundsToCategories) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (categoriesToExpenses.length > 0) {
    output += '// Expense Categories -> Expense Accounts\n';
    for (const link of categoriesToExpenses) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (budgetsToExpenses.length > 0) {
    output += '// Budgets -> Expense Accounts (no category)\n';
    for (const link of budgetsToExpenses) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (allFundsToExpenses.length > 0) {
    output += '// Assets -> Expense Accounts (no budget or category)\n';
    for (const link of allFundsToExpenses) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
    output += '\n';
  }

  if (otherFlows.length > 0) {
    output += '// Other Flows (Transfers, etc.)\n';
    for (const link of otherFlows) {
      const source = data.nodes.find((n) => n.id === link.source);
      const target = data.nodes.find((n) => n.id === link.target);
      output += `${source?.name} [${link.value.toFixed(2)}] ${target?.name}\n`;
    }
  }

  // Append URL if requested
  if (options?.includeUrl !== false) {
    // Generate URL from the diagram data (without comments)
    const diagramData = output.split('\n')
      .filter(line => !line.trim().startsWith('//') && line.trim().length > 0)
      .join('\n');

    const url = generateSankeyMaticUrl(diagramData, options?.baseUrl);
    output += `\n// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `// 🔗 Direct Link (click to open in SankeyMatic):\n`;
    output += `// ${url}\n`;
  }

  return output;
}
