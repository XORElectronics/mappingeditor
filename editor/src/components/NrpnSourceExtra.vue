<script setup lang="ts">
import { defineModel, onMounted, ref } from 'vue';
import { EMPTY_KEY, genNrpnSourceExtraDnA } from '../modules/dataModel';
import { SourceExtra } from '../modules/documentModel';

const props = defineProps<{
  isLocked?: boolean
}>();

const LABEL_TEXT = "NRPN Controller #";
const MAX_VALUE = 9999;
const model = defineModel<SourceExtra>({ required: true });
const nrpnInput = ref<HTMLInputElement>();

function numChanged(key: number) {
    const {abbr, description} = genNrpnSourceExtraDnA(key);
    model.value = new SourceExtra(key, abbr, description);
}

onMounted(() => {
    if (model.value.keyOrValue === EMPTY_KEY) {
        if (nrpnInput?.value) { nrpnInput.value.value = ""; }
    }
});

defineEmits(['update:modelValue']);

</script>

<template>
    <div class="extras-container" :class="{ 'container-locked': isLocked }">
        <label class="form-label" for="nrpn" :class="{ 'label-locked': isLocked }">{{ LABEL_TEXT }}</label>
        <input type="number" class="form-control" id="nrpn" ref="nrpnInput" v-model="model.keyOrValue" @change="numChanged(model.keyOrValue)"
            :max="MAX_VALUE" :min="0" :disabled="isLocked" :class="{ 'input-locked': isLocked }" />
    </div>
</template>

<style scoped>
.extras-container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 100%;
    width: 100%;
}

.extras-container input {
    padding: var(--form-padding-vertical) var(--form-padding-horizontal);
    height: 100%;
    width: 80px;
    background-color: var(--color-primary);
    border: none;
    color: black;
}

.extras-container label {
    display: flex;
    align-items: center;
    padding-left: var(--extras-label-padding-left);
    height: 100%;
    flex: 1;
    color: var(--color-text-primary);
    background-color: var(--color-primary);
    white-space: nowrap;
    font-size: 12px;
    margin: 0;
}
</style>