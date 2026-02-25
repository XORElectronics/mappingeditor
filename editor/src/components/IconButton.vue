<script setup lang="ts">
/**
 * IconButton - Small action button component for icons or short labels
 *
 * Complements MenuButton for inline actions like copy/paste/clear.
 * Designed for toolbars and row actions.
 */

defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'clear' | 'success';
  size?: 'sm' | 'md';
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    class="icon-btn"
    :class="[variant, size]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.icon-btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.icon-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.icon-btn.primary {
  background: #375a7f;
  border-color: #375a7f;
}

.icon-btn.primary:hover:not(:disabled) {
  background: #2c4866;
  border-color: #2c4866;
}

.icon-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}

.icon-btn.danger {
  background: #e74c3c;
  border-color: #e74c3c;
}

.icon-btn.danger:hover:not(:disabled) {
  background: #c0392b;
  border-color: #c0392b;
}

.icon-btn.clear {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.15);
  color: #000;
}

.icon-btn.clear:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  color: #000;
}

.icon-btn.success {
  background: #00bc8c;
  border-color: #00bc8c;
}

.icon-btn.success:hover:not(:disabled) {
  background: #00a077;
  border-color: #00a077;
}

/* Sizes */
.icon-btn.sm {
  padding: 2px 6px;
  font-size: 0.75rem;
  min-width: 24px;
  min-height: 24px;
}

.icon-btn.md {
  padding: 6px 12px;
  font-size: 0.875rem;
  min-width: 32px;
  min-height: 32px;
}
</style>
