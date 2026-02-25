<script setup lang="ts">
import { defineModel, nextTick, onMounted, ref, watch } from 'vue';
import { EMPTY_ABBR, EMPTY_DESCRIPTION, EMPTY_KEY, genNrpnSourceExtraDnA, genVarSourceExtraDnA } from '../modules/dataModel';
import { SourceExtra } from '../modules/documentModel';

const props = defineProps<{
  isLocked?: boolean;
  incomingValue?: number;
}>();

const MAX_VALUE = 4095;
const model = defineModel<SourceExtra>({ required: true });
const varInput = ref<HTMLInputElement>();
const varCheck = ref<HTMLInputElement>();
const disableNum = ref<boolean>(false);
const varValue = ref<number>(EMPTY_KEY);

function toPercent(value: number): number {
  if (value === EMPTY_KEY) return 0;
  return Math.round((value / MAX_VALUE) * 100);
}

function checkChanged() {
    if (varCheck.value?.checked) {
        disableNum.value = true;
        const { abbr, description } = genVarSourceExtraDnA(0);
        model.value = new SourceExtra(0, abbr, description);
        varValue.value = EMPTY_KEY;
        return
    }

    // Switch to fader/write mode with default value 0 (internal key = 1)
    varValue.value = 0;
    disableNum.value = false;
    const { abbr, description } = genVarSourceExtraDnA(1);
    model.value = new SourceExtra(1, abbr, description);
}

function numChanged() {
    // Ensure we have a valid number
    const numValue = Number(varValue.value);
    if (isNaN(numValue)) return;

    // Clamp to valid range
    const clampedValue = Math.max(0, Math.min(MAX_VALUE, numValue));
    varValue.value = clampedValue;

    // Strip leading zeros from display (e.g. "05" → "5")
    nextTick(() => {
        if (varInput.value && varInput.value.value !== String(clampedValue)) {
            varInput.value.value = String(clampedValue);
        }
    });

    // Convert UI value (0-4095) to internal format (1-4096)
    const actualKey = clampedValue + 1;
    const { abbr, description } = genVarSourceExtraDnA(actualKey);
    model.value = new SourceExtra(actualKey, abbr, description);
}

function selectAllOnFocus(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        (event.target as HTMLInputElement).blur();
    }
}

onMounted(() => {
    if (model.value.keyOrValue === 0) {
        disableNum.value = true;
        varValue.value = EMPTY_KEY;

        if (varCheck.value) {
            varCheck.value.checked = true;
        }
        return;
    }

    if (varCheck.value) {
        varCheck.value.checked = false;
    }

    disableNum.value = false;

    // Handle EMPTY_KEY: treat as fader mode starting at 0
    if (model.value.keyOrValue === EMPTY_KEY) {
        varValue.value = 0;
        const { abbr, description } = genVarSourceExtraDnA(1);
        model.value = new SourceExtra(1, abbr, description);
    } else {
        varValue.value = model.value.keyOrValue - 1;
    }
});

// Sync local state when model changes externally (e.g. undo/redo)
watch(() => model.value?.keyOrValue, (newKey) => {
  if (newKey === undefined) return;
  if (newKey === 0) {
    disableNum.value = true;
    varValue.value = EMPTY_KEY;
    if (varCheck.value) varCheck.value.checked = true;
  } else if (newKey === EMPTY_KEY) {
    varValue.value = 0;
    disableNum.value = false;
    if (varCheck.value) varCheck.value.checked = false;
  } else {
    varValue.value = newKey - 1;
    disableNum.value = false;
    if (varCheck.value) varCheck.value.checked = false;
  }
});

defineEmits(['update:modelValue']);

</script>

<template>
    <div class="extras-container" :class="{ 'container-locked': isLocked }">
        <div class="first" :class="{ 'input-disabled': !disableNum, 'section-locked': isLocked }" :title="model.abbr">
            <label for="varCheck">From Row/Var:</label>
            <div>
                <input type="checkbox" class="form-check-input" id="varCheck" ref="varCheck" @change="checkChanged" :disabled="isLocked" />
            </div>
        </div>
        <div class="second" :class="{ 'input-disabled': disableNum, 'section-locked': isLocked }">
            <!-- Editable fader mode -->
            <div v-if="!disableNum" class="fader-container">
                <div class="fader-fill" :style="{ width: toPercent(varValue) + '%' }">
                    <div class="fader-handle"></div>
                </div>

                <!-- Invisible range slider for mouse interaction -->
                <input
                    type="range"
                    class="fader-slider"
                    min="0"
                    :max="MAX_VALUE"
                    v-model.number="varValue"
                    @input="numChanged"
                    :disabled="isLocked"
                />

                <!-- Number input for value display and keyboard entry -->
                <input
                    type="number"
                    class="fader-input"
                    min="0"
                    :max="MAX_VALUE"
                    v-model.number="varValue"
                    @input="numChanged"
                    @focus="selectAllOnFocus"
                    @keydown="onKeydown"
                    :disabled="isLocked"
                    ref="varInput"
                />
            </div>

            <!-- Read-only fader mode -->
            <div v-else class="fader-container">
                <div class="fader-fill" :style="{ width: toPercent(incomingValue ?? 0) + '%' }">
                    <div class="fader-handle"></div>
                </div>
                <div class="fader-display">{{ incomingValue ?? 0 }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Note: Base .extras-container, .input-disabled are in global form-elements.css */

.first {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
    height: 100%;
    width: 50%;
    background-color: var(--color-primary);
}

.first>div {
    display: flex;
    width: var(--extras-checkbox-size);
    height: var(--extras-checkbox-size);
    padding-right: var(--extras-checkbox-padding-right);
}

.first>label {
    padding-left: var(--extras-label-padding-left);
    height: 100%;
    width: 15em;
    color: var(--color-text-primary);
}

.second {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: stretch;
    height: 100%;
    width: 50%;
    background-color: var(--color-primary);
    padding: 0;
}

/* Fader container with technical hardware styling */
.fader-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0px, transparent 1px, transparent 4px), #1a1a1a;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid #0a0a0a;
    border-right: 1px solid #2a2a2a;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* Gradient fill showing current value */
.fader-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(180deg, rgba(52, 204, 153, 0.5) 0%, rgba(52, 204, 153, 0.4) 50%, rgba(52, 204, 153, 0.5) 100%);
    transition: width 0.1s ease;
    z-index: 0;
    pointer-events: none;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}

/* Position indicator handle */
.fader-handle {
    position: absolute;
    right: -1px;
    top: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, #aaa 0%, #888 50%, #666 100%);
    box-shadow: 1px 0 0 rgba(255, 255, 255, 0.3), -1px 0 2px rgba(0, 0, 0, 0.5);
    pointer-events: none;
}

/* Invisible range slider for mouse interaction */
.fader-slider {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: ew-resize;
    z-index: 1;
    margin: 0;
}

.fader-slider:disabled {
    cursor: not-allowed;
}

/* Number input field */
.fader-input {
    position: relative;
    z-index: 2;
    width: 70px;
    height: 70%;
    background: transparent;
    border: none;
    color: #34cc99;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Courier New', Courier, monospace;
    outline: none;
    padding: 4px 6px;
    -moz-appearance: textfield;
    text-shadow: 0 0 4px rgba(52, 204, 153, 0.5);
}

.fader-input:focus {
    color: #F1F700;
    text-shadow: 0 0 6px rgba(241, 247, 0, 0.6);
}

.fader-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Remove number input spinners */
.fader-input::-webkit-outer-spin-button,
.fader-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Display value in read-only mode */
.fader-display {
    position: relative;
    z-index: 2;
    color: #34cc99;
    font-size: 14px;
    font-weight: 700;
    font-family: 'Courier New', Courier, monospace;
    text-shadow: 0 0 4px rgba(52, 204, 153, 0.5);
}
</style>