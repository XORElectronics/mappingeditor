<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import IconButton from './IconButton.vue';

// Props definition
const props = defineProps<{
  rowIndex: number;
  hasCopiedData: boolean;
  hasContent: boolean;
}>();

// Events definition
const emit = defineEmits<{
  copy: [rowIndex: number];
  paste: [rowIndex: number];
}>();

// Event handlers
function handleCopy(): void {
  emit('copy', props.rowIndex);
}

function handlePaste(): void {
  emit('paste', props.rowIndex);
}
</script>

<template>
  <!-- Copy column -->
  <div class="gridItem copy-column">
    <IconButton
      class="action-btn"
      size="sm"
      variant="secondary"
      @click="handleCopy"
      title="Copy this row"
      :disabled="!hasContent"
    >
      Copy
    </IconButton>
  </div>

  <!-- Paste column -->
  <div class="gridItem paste-column">
    <IconButton
      class="action-btn"
      size="sm"
      variant="secondary"
      @click="handlePaste"
      title="Paste copied row here"
      :disabled="!hasCopiedData"
    >
      Paste
    </IconButton>
  </div>
</template>

<style scoped>
/* Copy/Paste columns */
.copy-column,
.paste-column {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
}

/* Button styles */
.action-btn {
  font-size: var(--button-font-size);
  margin: 0;
  white-space: nowrap;
  height: 100%;
  width: 100%;
  border-radius: var(--form-border-radius);
}
</style>
