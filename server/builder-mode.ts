/**
 * Builder Mode Configuration
 *
 * This module handles builder/test mode functionality.
 * Builder mode is ONLY enabled in test/development environments via environment variables.
 * It is completely disabled in production.
 */

const BUILDER_MODE_ENABLED = process.env.BUILDER_MODE_ENABLED === "true";
const BUILDER_USER_ID = process.env.BUILDER_USER_ID;

/**
 * Check if builder mode is enabled in the current environment
 */
export function isBuilderModeEnabled(): boolean {
  return BUILDER_MODE_ENABLED;
}

/**
 * Check if a user is a builder (only relevant if builder mode is enabled)
 */
export function isBuilder(userId: string): boolean {
  if (!isBuilderModeEnabled()) {
    return false;
  }

  if (!BUILDER_USER_ID) {
    console.warn("BUILDER_MODE_ENABLED is true but BUILDER_USER_ID is not set");
    return false;
  }

  return userId === BUILDER_USER_ID;
}

/**
 * Get the configured builder user ID (for reference/debugging)
 */
export function getBuilderUserId(): string | undefined {
  return BUILDER_MODE_ENABLED ? BUILDER_USER_ID : undefined;
}
