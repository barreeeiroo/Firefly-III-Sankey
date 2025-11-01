/**
 * API Version Checker Utility
 * Validates that the Firefly III API version is compatible
 */

export const SUPPORTED_API_VERSION = {
  min: '6.3.0',
  max: '7.0.0',
};

/**
 * Compare two semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}

/**
 * Check if an API version is supported
 */
export function isApiVersionSupported(apiVersion: string): boolean {
  const minComparison = compareVersions(apiVersion, SUPPORTED_API_VERSION.min);
  const maxComparison = compareVersions(apiVersion, SUPPORTED_API_VERSION.max);

  // Version must be >= min and < max
  return minComparison >= 0 && maxComparison < 0;
}

/**
 * Get a user-friendly error message for unsupported API versions
 */
export function getVersionErrorMessage(apiVersion: string): string {
  const minComparison = compareVersions(apiVersion, SUPPORTED_API_VERSION.min);
  const maxComparison = compareVersions(apiVersion, SUPPORTED_API_VERSION.max);

  if (minComparison < 0) {
    return `API version ${apiVersion} is too old. Minimum supported version is ${SUPPORTED_API_VERSION.min}.`;
  }

  if (maxComparison >= 0) {
    return `API version ${apiVersion} is too new. Maximum supported version is below ${SUPPORTED_API_VERSION.max}.`;
  }

  return `API version ${apiVersion} is not supported.`;
}
