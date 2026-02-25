<script setup lang="ts">
import { defineModel, ref, watch, onMounted, computed } from 'vue';
import { genCalcSkipSourceByteExtras, genCalcSkipSourceExtraDnA, EMPTY_KEY_SHORT} from '../modules/dataModel';
import { SourceExtra } from '../modules/documentModel';

const props = defineProps<{
  displayRowIndexAsHex: boolean
  isLocked?: boolean
}>();

const model = defineModel<SourceExtra>({ required: true });
const extraVal1 = ref<number>(EMPTY_KEY_SHORT);
const extraVal2 = ref<number>(EMPTY_KEY_SHORT);
const baseExtras = genCalcSkipSourceByteExtras();

// Format row options based on hex/decimal preference
const extras = computed(() => {
  return baseExtras.map(ex => {
    // Row options are keys 26-95 (rows 0-69)
    if (ex.key >= 26 && ex.key <= 95) {
      const rowIndex = ex.key - 26;
      if (props.displayRowIndexAsHex) {
        const hexIndex = rowIndex.toString(16).toUpperCase().padStart(2, '0');
        return { ...ex, abbr: hexIndex, description: `Row ${hexIndex}` };
      }
    }
    return ex;
  });
});

// watch for changes to the model or the params and update the other if needed
watch([model, extraVal1, extraVal2], ([newModel, newParam1, newParam2], [oldModel, oldParam1, oldParam2]) => {
    // Note: this will get called twice for each change, once for the params and once for the model, 
    // with the order depending on what changed.
    // If the model has changed but the parms have not update the params
    if (newModel.keyOrValue !== oldModel.keyOrValue && newParam1 === oldParam1 && newParam2 === oldParam2) {
        updateParams();
        return;
    }

    // If the parms have changed but the model has not update the model
    if (newModel.keyOrValue === oldModel.keyOrValue && (newParam1 !== oldParam1 || newParam2 !== oldParam2)) {
        updateModel();
        return;
    };

    //if (newModel !== oldModel && (newParam1 !== oldParam1 || newParam2 !== oldParam2))
    //ASSERT: this should never be true because of the onMounted call below.
});

onMounted(() => {
    updateParams();
});

defineEmits(['update:modelValue']);

function updateParams() {
    const newParam1 = (model.value.keyOrValue >> 8) & 0xFF;
    extraVal1.value = newParam1;  // Always update, 0 is a valid constant
    const newParam2 = model.value.keyOrValue & 0xFF;
    extraVal2.value = newParam2;  // Always update, 0 is a valid constant
}

function updateModel() {
    const newKey = (extraVal1.value << 8) | extraVal2.value;
    const {abbr, description} = genCalcSkipSourceExtraDnA(newKey);
    model.value = new SourceExtra(newKey, abbr, description);
}
</script>

<template>
    <div class="extras-container" :class="{ 'container-locked': isLocked }">
        <select v-model="extraVal1" class="extra-select es1 form-select border-dark pt-1" :title="extras?.[extraVal1 + 1]?.abbr"
            :class="{ 'select-empty': extraVal1 === EMPTY_KEY_SHORT, 'select-locked': isLocked }"
            :disabled="isLocked">
            <option v-for="ex in extras" :key="ex.key" :value="ex.key" :title="ex.abbr">{{ ex.description }}</option>
        </select>
        <select v-model="extraVal2" class="extra-select es2 form-select border-dark pt-1" :title="extras?.[extraVal2 + 1]?.abbr"
            :class="{ 'select-empty': extraVal2 === EMPTY_KEY_SHORT, 'select-locked': isLocked }"
            :disabled="isLocked">
            <option v-for="ex in extras" :key="ex.key" :value="ex.key" :title="ex.abbr">{{ ex.description }}</option>
        </select>
    </div>
</template>

<style scoped>
/* Note: .extras-container and .select-empty are in global form-elements.css */

.extras-container {
  gap: var(--grid-gap);
}

.extra-select {
  width: calc(50% - 1px);
  background-color: var(--color-primary);
  color: var(--color-text-primary);
}
</style>

