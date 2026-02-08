/**
 * Escapes special SQL LIKE characters (% _ \) in a string.
 * This prevents SQL injection via LIKE pattern matching.
 *
 * @param pattern - The string to escape
 * @returns The escaped string
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&')
}
