<script setup lang="ts">
import { defineModel, onMounted, ref } from 'vue';
import { EMPTY_KEY, genNrpnSourceExtraDnA } from '../modules/dataModel';
import { SourceExtra } from '../modules/documentModel';

const LABEL_TEXT = "NPRN Controller #";
const MAX_VALUE = 9999;
const model = defineModel<SourceExtra>({ required: true });
const nprnInput = ref<HTMLInputElement>();

function numChanged(key: number) {
    const {abbr, description} = genNrpnSourceExtraDnA(key);
    model.value = new SourceExtra(key, abbr, description);
}

onMounted(() => {
    if (model.value.keyOrValue === EMPTY_KEY) {
        if (nprnInput?.value) { nprnInput.value.value = ""; }
    }
});

defineEmits(['update:modelValue']);

</script>

<template>
    <div class="extras-container">
        <label class="form-label" for="nprn">{{ LABEL_TEXT }}</label>
        <input type="number" class="form-control" id="nprn" ref="nprnInput" v-model="model.keyOrValue" @change="numChanged(model.keyOrValue)"
            :max="MAX_VALUE" :min="0" />
    </div>
</template>

<style scoped>
.extras-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: top;
    height: 100%;
}

.extras-container input {
    padding-top: 1px;
    height: 100%;
    width: 15em;
    background-color: #34cc99;
}

.extras-container label {
    padding-top: 3px;
    padding-left: 8px;
    height: 100%;
    width: 15em;
    color: black;
    background-color: #34cc99;
}

/* TODO: create customer spinner style */
</style>