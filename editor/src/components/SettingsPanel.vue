<script setup lang="ts">
import BasePanel from './BasePanel.vue'
import CollapsibleSection from './CollapsibleSection.vue'

const props = defineProps<{
  displayRowIndexAsHex: boolean
  showSelectionToolbar: boolean
  showMidiMonitor: boolean
  showVariableMonitor: boolean
  showLogMonitor: boolean
  showDescription: boolean
  isLocked: boolean
  midiLearnAutoAdvance: boolean
  pasteAutoAdvance: 'disabled' | 'rows-only' | 'all'
  // Info section props
  headerText: string
  firmwareMajor: number
  firmwareMinor: number
}>()

const emit = defineEmits<{
  expandedChange: [expanded: boolean]
  'update:displayRowIndexAsHex': [value: boolean]
  'update:showSelectionToolbar': [value: boolean]
  'update:showMidiMonitor': [value: boolean]
  'update:showVariableMonitor': [value: boolean]
  'update:showLogMonitor': [value: boolean]
  'update:showDescription': [value: boolean]
  'update:midiLearnAutoAdvance': [value: boolean]
  'update:pasteAutoAdvance': [value: 'disabled' | 'rows-only' | 'all']
  'open-file': []
  'reset': []
  'download-html': []
  'download-markdown': []
  'download-markdown-ns': []
  'download-json': []
  'download-map': []
}>()

function toggleHexDisplay(): void {
  emit('update:displayRowIndexAsHex', !props.displayRowIndexAsHex)
}

function toggleSelectionToolbar(): void {
  emit('update:showSelectionToolbar', !props.showSelectionToolbar)
}

function toggleMidiMonitor(): void {
  emit('update:showMidiMonitor', !props.showMidiMonitor)
}

function toggleVariableMonitor(): void {
  emit('update:showVariableMonitor', !props.showVariableMonitor)
}

function toggleLogMonitor(): void {
  emit('update:showLogMonitor', !props.showLogMonitor)
}

function toggleDescription(): void {
  emit('update:showDescription', !props.showDescription)
}

function toggleMidiLearnAutoAdvance(): void {
  emit('update:midiLearnAutoAdvance', !props.midiLearnAutoAdvance)
}

function togglePasteAutoAdvance(): void {
  const states: Array<'disabled' | 'rows-only' | 'all'> = ['disabled', 'rows-only', 'all']
  const currentIndex = states.indexOf(props.pasteAutoAdvance)
  const nextIndex = (currentIndex + 1) % states.length
  emit('update:pasteAutoAdvance', states[nextIndex])
}

function getPasteAutoAdvanceLabel(): string {
  switch (props.pasteAutoAdvance) {
    case 'disabled': return 'OFF'
    case 'rows-only': return 'ROWS'
    case 'all': return 'ALL'
  }
}
</script>

<template>
  <BasePanel
    title="Settings"
    storage-key="settings-panel-expanded"
    right-position="10px"
    minimized-width="100px"
    expanded-width="220px"
    custom-max-height="none"
    @expanded-change="$emit('expandedChange', $event)"
  >
    <div class="settings-content">

      <CollapsibleSection label="File" storage-key="settings-file-expanded">
        <div class="setting-item file-actions">
          <button class="file-btn file-btn--open" @click="$emit('open-file')">Open Mapping File</button>
          <button class="file-btn file-btn--reset" :disabled="isLocked" @click="$emit('reset')">Reset</button>
        </div>
        <div class="setting-item">
          <span class="setting-label">Save as:</span>
          <div class="save-grid">
            <button class="save-btn" @click="$emit('download-html')">HTML</button>
            <button class="save-btn" @click="$emit('download-markdown')">MD</button>
            <button class="save-btn" @click="$emit('download-markdown-ns')">NS MD</button>
            <button class="save-btn" @click="$emit('download-json')">JSON</button>
            <button class="save-btn" @click="$emit('download-map')">MAP</button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Row Index Format" storage-key="settings-row-format-expanded">
        <div class="setting-item">
          <button
            class="toggle-btn"
            :class="{ active: displayRowIndexAsHex }"
            @click="toggleHexDisplay"
            :title="displayRowIndexAsHex ? 'Switch to decimal (0-69)' : 'Switch to hexadecimal (00-45)'"
          >
            {{ displayRowIndexAsHex ? 'HEX' : 'DEC' }}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Auto-Advance" storage-key="settings-auto-advance-expanded">
        <div class="setting-item">
          <label class="checkbox-label">
            <input
              type="checkbox"
              :checked="midiLearnAutoAdvance"
              @change="toggleMidiLearnAutoAdvance"
            />
            <span>MIDI Learn Auto-Advance</span>
          </label>
        </div>
        <div class="setting-item">
          <span class="setting-label">Paste Auto-Advance</span>
          <button
            class="toggle-btn"
            :class="{ active: pasteAutoAdvance !== 'disabled' }"
            @click="togglePasteAutoAdvance"
            :title="pasteAutoAdvance === 'disabled' ? 'Disabled' : pasteAutoAdvance === 'rows-only' ? 'Only for whole rows' : 'For all pastes (rows, source, destination)'"
          >
            {{ getPasteAutoAdvanceLabel() }}
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Panels" storage-key="settings-panels-expanded">
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" :checked="showSelectionToolbar" @change="toggleSelectionToolbar" />
            <span>Selection Toolbar</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" :checked="showMidiMonitor" @change="toggleMidiMonitor" />
            <span>MIDI Monitor</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" :checked="showVariableMonitor" @change="toggleVariableMonitor" />
            <span>Variable Monitor</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" :checked="showLogMonitor" @change="toggleLogMonitor" />
            <span>Log Monitor</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" :checked="showDescription" @change="toggleDescription" />
            <span>Description</span>
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Info" storage-key="settings-info-expanded">
        <div class="info-item">
          <span class="info-label">Header:</span>
          <span class="info-value">{{ headerText }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Firmware:</span>
          <span class="info-value">{{ firmwareMajor }}.{{ firmwareMinor }}</span>
        </div>
      </CollapsibleSection>

    </div>
  </BasePanel>
</template>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  padding: 4px;
}

/* First section needs no top border — the panel frame provides the visual boundary */
.settings-content :deep(.cs-header:first-child) {
  border-top: none;
  margin-top: 0;
  padding-top: 2px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px;
}

.setting-label {
  color: #34cc99;
  font-size: 11px;
  font-weight: 500;
}

.toggle-btn {
  width: 100%;
  font-size: 10px;
  padding: 4px 6px;
  background-color: rgba(52, 204, 153, 0.2);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

.toggle-btn:hover {
  background-color: rgba(52, 204, 153, 0.4);
}

.toggle-btn.active {
  background-color: #F1F700;
  color: #000;
  border-color: #F1F700;
}



.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #888;
  font-size: 11px;
  margin: 0;
}

.checkbox-label:hover {
  color: #fff;
}

.checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: #34cc99;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:checked + span {
  color: #34cc99;
}

/* File section styles */
.file-actions {
  display: flex;
  gap: 4px;
}

.file-btn {
  flex: 1;
  font-size: 10px;
  padding: 4px 6px;
  background-color: rgba(52, 204, 153, 0.15);
  border: 1px solid #34cc99;
  color: #34cc99;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s;
}

.file-btn:hover:not(:disabled) {
  background-color: rgba(52, 204, 153, 0.35);
}

.file-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.file-btn--reset {
  background-color: rgba(220, 53, 69, 0.15);
  border-color: #dc3545;
  color: #dc3545;
}

.file-btn--reset:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.35);
}

.save-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  margin-top: 4px;
}

.save-btn {
  font-size: 10px;
  padding: 3px 2px;
  background-color: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.5);
  color: #34cc99;
  cursor: pointer;
  transition: background-color 0.15s;
  text-align: center;
}

.save-btn:hover {
  background-color: rgba(52, 204, 153, 0.3);
}

/* Info section styles */
.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
}

.info-label {
  color: #888;
  font-size: 10px;
  font-weight: 500;
}

.info-value {
  color: #F1F700;
  font-size: 11px;
  font-weight: 500;
  word-break: break-all;
}
</style>
