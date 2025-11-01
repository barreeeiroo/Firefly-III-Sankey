/**
 * Firefly III Sankey - Main Library Export
 *
 * This package can be used both as a CLI tool and as a library.
 * Import the modules you need for programmatic access.
 */

// Export API client
export { FireflyClient, FireflyClientConfig } from './client';

// Export models
export * from './models';

// Export Sankey module (processor, models, formatters)
export * from './sankey';
