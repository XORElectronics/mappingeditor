<script setup lang="ts">
import type { AnalyzerWarning } from '../composables/useStaticAnalyzer';

defineProps<{
  rowIndex: number;
  sourceEmpty: boolean;
  destinationEmpty: boolean;
  hasCopiedSource: boolean;
  hasCopiedDestination: boolean;
  modelValue: string;
  warnings: AnalyzerWarning[];
  sourceValue: number;
  destinationValue: number;
  isSourceSkip: boolean;
  isDestinationSkip: boolean;
  sourceSkipActive: boolean;
  destinationSkipActive: boolean;
  isLocked?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'copySource': [rowIndex: number];
  'pasteSource': [rowIndex: number];
  'clearSource': [rowIndex: number];
  'copyDestination': [rowIndex: number];
  'pasteDestination': [rowIndex: number];
  'clearDestination': [rowIndex: number];
  'noticeWarning': [warningId: string, warning: AnalyzerWarning];
}>();

function getWarningIcon(severity: string): string {
  switch (severity) {
    case 'error': return '!';
    case 'warning': return '!';
    case 'info': return 'i';
    default: return '!';
  }
}

// Value formatting helpers
function toHex(value: number): string {
  return '0x' + value.toString(16).toUpperCase().padStart(4, '0');
}

function toBinary(value: number): string {
  return '0b' + value.toString(2).padStart(16, '0');
}

function toPercent(value: number): number {
  return Math.round((value / 4095) * 100);
}

// Compute boolean value
// For normal values: true if value > 0
// For Skip commands: true if skip is active (will skip rows)
function getBoolValue(value: number, isSkip: boolean, skipActive: boolean): string {
  if (isSkip) {
    return skipActive ? 'TRUE' : 'FALSE';
  }
  return value > 0 ? 'TRUE' : 'FALSE';
}
</script>

<template>
  <div class="row-comment-section">
    <div class="comment-sections">
      <div class="source-section">
        <div class="section-header">
          <span class="section-label">Source:</span>
          <button
            class="action-btn"
            @click="emit('copySource', rowIndex)"
            title="Copy Source"
            :disabled="sourceEmpty"
          >C</button>
          <button
            class="action-btn"
            @click="emit('pasteSource', rowIndex)"
            title="Paste Source"
            :disabled="!hasCopiedSource"
          >P</button>
          <button
            class="action-btn"
            @click="emit('clearSource', rowIndex)"
            title="Clear Source"
            :disabled="sourceEmpty || isLocked"
          >X</button>
        </div>
        <div class="value-display">
          <span class="value-item value-dec">{{ sourceValue }}</span>
          <span class="value-item value-hex">{{ toHex(sourceValue) }}</span>
          <span class="value-item value-bin">{{ toBinary(sourceValue) }}</span>
          <span class="value-item value-bool" :class="{ 'bool-true': getBoolValue(sourceValue, isSourceSkip, sourceSkipActive) === 'TRUE' }">
            {{ getBoolValue(sourceValue, isSourceSkip, sourceSkipActive) }}
          </span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: toPercent(sourceValue) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="section-separator"></div>

      <div class="destination-section">
        <div class="section-header">
          <span class="section-label">Dest:</span>
          <button
            class="action-btn"
            @click="emit('copyDestination', rowIndex)"
            title="Copy Destination"
            :disabled="destinationEmpty"
          >C</button>
          <button
            class="action-btn"
            @click="emit('pasteDestination', rowIndex)"
            title="Paste Destination"
            :disabled="!hasCopiedDestination"
          >P</button>
          <button
            class="action-btn"
            @click="emit('clearDestination', rowIndex)"
            title="Clear Destination"
            :disabled="destinationEmpty || isLocked"
          >X</button>
        </div>
        <div class="value-display">
          <span class="value-item value-dec">{{ destinationValue }}</span>
          <span class="value-item value-hex">{{ toHex(destinationValue) }}</span>
          <span class="value-item value-bin">{{ toBinary(destinationValue) }}</span>
          <span class="value-item value-bool" :class="{ 'bool-true': getBoolValue(destinationValue, isDestinationSkip, destinationSkipActive) === 'TRUE' }">
            {{ getBoolValue(destinationValue, isDestinationSkip, destinationSkipActive) }}
          </span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: toPercent(destinationValue) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings Section -->
    <div v-if="warnings.length > 0" class="warnings-section">
      <div
        v-for="(warning, idx) in warnings"
        :key="warning.id || idx"
        class="warning-item"
        :class="`warning-${warning.severity}`"
      >
        <span class="warning-badge" :class="`badge-${warning.severity}`">
          {{ getWarningIcon(warning.severity) }}
        </span>
        <div class="warning-content">
          <span class="warning-message">{{ warning.message }}</span>
          <span v-if="warning.details" class="warning-details">{{ warning.details }}</span>
        </div>
        <button
          class="action-btn notice-btn"
          @click="emit('noticeWarning', warning.id, warning)"
          title="Acknowledge this warning"
        >&#10003;</button>
      </div>
    </div>

    <textarea
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      class="comment-textarea"
      placeholder="Add a comment for this row..."
      rows="2"
    ></textarea>
  </div>
</template>

<style scoped>
.row-comment-section {
  grid-column: 1 / -1;
  background-color: rgba(241, 247, 0, 0.1);
  border: 2px solid #F1F700;
  border-radius: 4px;
  padding: 8px;
  margin-top: 4px;
  margin-bottom: 4px;
  animation: unfold 0.2s ease-out;
}

@keyframes unfold {
  from {
    opacity: 0;
    max-height: 0;
    padding: 0 8px;
  }
  to {
    opacity: 1;
    max-height: 200px;
    padding: 8px;
  }
}

.comment-sections {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 8px;
  padding: 4px 6px;
  background-color: rgba(52, 204, 153, 0.05);
  border-radius: 3px;
}

.source-section,
.destination-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.section-separator {
  width: 2px;
  height: 24px;
  background-color: #F1F700;
  margin: 0 8px;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.section-label {
  font-size: 11px;
  color: #F1F700;
  font-weight: bold;
  min-width: 50px;
}

.value-display {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  font-family: monospace;
  font-size: 12px;
}

.value-item {
  white-space: nowrap;
}

.value-dec {
  color: #F1F700;
  font-weight: bold;
  min-width: 50px;
}

.value-hex {
  color: #34cc99;
  min-width: 70px;
}

.value-bin {
  color: rgba(52, 204, 153, 0.7);
}

.value-bool {
  color: #888;
  font-weight: bold;
  min-width: 50px;
}

.value-bool.bool-true {
  color: #F1F700;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: #000;
  border: 1px solid #34cc99;
  overflow: hidden;
  min-width: 80px;
  max-width: 150px;
}

.progress-fill {
  height: 100%;
  background-color: #34cc99;
  transition: width 0.2s ease;
}

.action-btn {
  padding: 3px 8px;
  font-size: 10px;
  font-weight: bold;
  border: 1px solid #F1F700;
  border-radius: 3px;
  background-color: var(--color-primary);
  color: #F1F700;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.action-btn:hover:not(:disabled) {
  background-color: #F1F700;
  color: #000;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Warnings Section */
.warnings-section {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.warning-error {
  background-color: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.5);
}

.warning-warning {
  background-color: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.5);
}

.warning-info {
  background-color: rgba(13, 202, 240, 0.15);
  border: 1px solid rgba(13, 202, 240, 0.4);
}

.warning-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
  flex-shrink: 0;
}

.badge-error {
  background-color: #dc3545;
  color: #fff;
}

.badge-warning {
  background-color: #ffc107;
  color: #000;
}

.badge-info {
  background-color: #0dcaf0;
  color: #000;
}

.notice-btn {
  border-color: #34cc99;
  color: #34cc99;
  margin-left: auto;
  flex-shrink: 0;
  font-size: 12px;
  padding: 2px 6px;
}

.notice-btn:hover:not(:disabled) {
  background-color: #34cc99;
  color: #000;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.warning-message {
  color: #fff;
  font-weight: 500;
}

.warning-details {
  color: #aaa;
  font-size: 10px;
}

.comment-textarea {
  width: 100%;
  background-color: #1a1a1a;
  border: 1px solid #F1F700;
  border-radius: 4px;
  color: #F1F700;
  padding: 6px;
  font-size: 12px;
  resize: vertical;
  min-height: 40px;
}

.comment-textarea:focus {
  outline: none;
  border-color: #34cc99;
  box-shadow: 0 0 4px rgba(52, 204, 153, 0.5);
}

.comment-textarea::placeholder {
  color: #666;
}
</style>
