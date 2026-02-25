<script setup lang="ts">
/**
 * MenuButton - Reusable button component for the left menu area
 * 
 * Provides consistent styling across all menu buttons:
 * - A/B slot buttons (square, 30x30)
 * - Primary action buttons (Open, Reset, Analyze)
 * - Download buttons (HTML, Markdown, JSON, MAP)
 */

export interface MenuButtonProps {
  variant?: 'primary' | 'slot' | 'download'
  active?: boolean
  locked?: boolean
  hasData?: boolean
  disabled?: boolean
  borderRadius?: 'left' | 'right' | 'none' | 'all'
}

withDefaults(defineProps<MenuButtonProps>(), {
  variant: 'primary',
  active: false,
  locked: false,
  hasData: true,
  disabled: false,
  borderRadius: 'all'
})
</script>

<template>
  <button
    class="menu-btn"
    :class="[
      `menu-btn--${variant}`,
      `menu-btn--radius-${borderRadius}`,
      { 'menu-btn--active': active },
      { 'menu-btn--locked': locked },
      { 'menu-btn--has-data': hasData },
      { 'menu-btn--no-data': !hasData && variant === 'slot' }
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
/* Base button styles */
.menu-btn {
  height: var(--form-height);
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-dark-bg);
  font-weight: bold;
  font-size: var(--form-font-size);
  cursor: pointer;
  transition: background-color var(--transition-standard),
              box-shadow var(--transition-standard);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

.menu-btn:hover:not(:disabled) {
  background-color: var(--color-hover);
  color: var(--color-text-primary);
}

.menu-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variant: Primary (Open, Reset, Analyze) */
.menu-btn--primary {
  min-width: auto;
}

/* Variant: Slot (A/B toggle buttons - square) */
.menu-btn--slot {
  width: var(--form-height);
  padding: 0;
  border: 2px solid var(--color-primary);
  background-color: var(--color-dark-bg);
  color: #fff;
}

.menu-btn--slot:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.3);
}

.menu-btn--slot.menu-btn--active {
  background-color: #F1F700;
  color: #000;
  /* border-color: #F1F700; */
}

.menu-btn--slot.menu-btn--has-data:not(.menu-btn--active) {
  border-style: solid;
}

.menu-btn--slot.menu-btn--no-data {
  border-style: dashed;
  opacity: 0.7;
}

.menu-btn--slot.menu-btn--locked:not(.menu-btn--active) {
  border-color: #dc3545;
  border-style: solid;
  opacity: 0.75;
}

.menu-btn--slot.menu-btn--active.menu-btn--locked {
  box-shadow: 0 0 8px 2px #dc3545, inset 0 0 4px rgba(220, 53, 69, 0.3);
  border-color: #dc3545;
}

/* Variant: Download (HTML, Markdown, JSON, MAP) */
.menu-btn--download {
  min-width: auto;
}

/* Border radius positions for grouped buttons */
.menu-btn--radius-left {
  border-radius: var(--form-border-radius-left);
}

.menu-btn--radius-right {
  border-radius: var(--form-border-radius-right);
}

.menu-btn--radius-none {
  border-radius: 0;
}

.menu-btn--radius-all {
  border-radius: var(--form-border-radius);
}

/* Active state (yellow highlight) */
.menu-btn--active:not(.menu-btn--slot) {
  background-color: #F1F700;
  color: #000;
}

/* Locked state (red glow) - for non-slot buttons */
.menu-btn--locked:not(.menu-btn--slot) {
  box-shadow: 0 0 8px 2px #dc3545;
}

/* Reset button special styling */
.menu-btn[data-variant="reset"] {
  background-color: var(--color-reset);
}

.menu-btn[data-variant="reset"]:hover:not(:disabled) {
  background-color: var(--color-reset-hover);
}
</style>
