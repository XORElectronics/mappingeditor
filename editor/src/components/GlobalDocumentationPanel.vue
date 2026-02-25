<script setup lang="ts">
/**
 * GlobalDocumentationPanel - Compact panel for mapping description
 *
 * Allows users to add a description to their mappings.
 * Data is saved in JSON format only (not in binary .MAP files).
 */

const globalComment = defineModel<string>('globalComment');

defineProps<{
  expanded: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div
    class="global-doc-panel"
    :class="{ expanded: expanded, minimized: !expanded }"
  >
    <div class="panel-header" @click="emit('toggle')">
      <span class="title">Description</span>
      <span class="toggle">{{ expanded ? '▼' : '▲' }}</span>
    </div>

    <div v-if="expanded" class="panel-body">
      <textarea
        v-model="globalComment"
        placeholder="Add a description for this mapping..."
        rows="3"
        class="doc-textarea"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.global-doc-panel {
  background-color: #34cc99;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 12px;
  display: inline-block;
  min-width: 300px;
  vertical-align: middle;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 32px;
  cursor: pointer;
  user-select: none;
  font-weight: bold;
  color: black;
  background-color: #34cc99;
  white-space: nowrap;
  gap: 2px;
}

.global-doc-panel.expanded .panel-header {
  border-bottom: 2px solid #000;
}

.panel-header:hover {
  background-color: #F1F700;
}

.title {
  flex: 1;
  font-size: 11px;
}

.toggle {
  font-size: 10px;
  color: #000;
}

.panel-body {
  position: absolute;
  top: 100%;
  left: 0;
  padding: 6px 8px;
  background-color: #000;
  width: 300px;
  box-sizing: border-box;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.doc-textarea {
  width: 100%;
  background-color: #1a1a1a;
  border: 1px solid #34cc99;
  border-radius: 3px;
  color: #fff;
  padding: 6px;
  font-size: 11px;
  font-family: inherit;
  resize: none;
  min-height: 50px;
  box-sizing: border-box;
}

.doc-textarea:focus {
  outline: none;
  border-color: #F1F700;
  box-shadow: 0 0 4px rgba(241, 247, 0, 0.3);
}

.doc-textarea::placeholder {
  color: #666;
}
</style>
