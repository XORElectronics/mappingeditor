/**
 * Color definitions for row highlighting in the mapping editor.
 */

export interface ColorDefinition {
  name: string;
  value: string;
}

/**
 * Available row highlight colors with their RGBA values.
 * Used by MultiSelectionToolbar for the color picker UI.
 */
export const ROW_COLORS: ColorDefinition[] = [
  { name: 'red', value: 'rgba(220, 53, 69, 0.35)' },
  { name: 'orange', value: 'rgba(253, 126, 20, 0.35)' },
  { name: 'yellow', value: 'rgba(255, 193, 7, 0.35)' },
  { name: 'green', value: 'rgba(40, 167, 69, 0.35)' },
  { name: 'teal', value: 'rgba(52, 204, 153, 0.35)' },
  { name: 'blue', value: 'rgba(13, 110, 253, 0.35)' },
  { name: 'purple', value: 'rgba(111, 66, 193, 0.35)' },
  { name: 'gray', value: 'rgba(108, 117, 125, 0.35)' }
];

/**
 * Lookup map for efficient color resolution by name.
 * Used by EditorApp for applying colors to rows.
 */
export const COLOR_PALETTE: Record<string, string> = Object.fromEntries(
  ROW_COLORS.map(c => [c.name, c.value])
);
