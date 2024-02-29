<script setup lang="ts">
import { defineModel, onMounted, ref, defineEmits } from 'vue';
import { EMPTY_ABBR, EMPTY_DESCRIPTION, EMPTY_KEY, genNrpnSourceExtraDnA, genVarSourceExtraDnA } from '../modules/dataModel';
import { SourceExtra } from '../modules/documentModel';

const MAX_VALUE = 4095;
const model = defineModel<SourceExtra>({ required: true });
const varInput = ref<HTMLInputElement>();
const varCheck = ref<HTMLInputElement>();
const disableNum = ref<boolean>(false);
const varValue = ref<number>(EMPTY_KEY);

function checkChanged() {
    if (varCheck.value?.checked) {
        disableNum.value = true;
        const { abbr, description } = genVarSourceExtraDnA(0);
        model.value = new SourceExtra(0, abbr, description);
        varValue.value = EMPTY_KEY;
        return
    }

    varValue.value = EMPTY_KEY;
    disableNum.value = false;
    model.value = new SourceExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION);
}

function numChanged() {
    const actualKey = varValue.value + 1;
    const { abbr, description } = genVarSourceExtraDnA(actualKey);
    model.value = new SourceExtra(actualKey, abbr, description);
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

    disableNum.value = false
    varValue.value = model.value.keyOrValue - 1;
});

defineEmits(['update:modelValue']);

</script>

<template>
    <div class="extras-container">
        <div class="first" :class="{ 'input-disabled': !disableNum }" :title="model.abbr">
            <label for="varCheck">From Row/Var:</label>
            <div>
                <input type="checkbox" class="form-check-input" id="varCheck" ref="varCheck" @change="checkChanged" />
            </div>
        </div>
        <div class="second" :class="{ 'input-disabled': disableNum }">
            <input v-if="!disableNum" :disabled="disableNum" type="number" class="form-control" id="varInput" ref="varInput"
                v-model="varValue" @change="numChanged" :max="MAX_VALUE" :min="0" :title="model.description" />
        </div>
    </div>
</template>

<style scoped>
.extras-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: middle;
    height: 100%;
    width: 100%;
}

.first {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: middle;
    height: 100%;
    width: 15em;
    background-color: #34cc99;
    padding-top: 0.5em;
}

.first>div {
    display: flex;
    width: 1.2em;
    height: 1.2em;
    padding-right: 1.5em;
    padding-top: 0.25em;
}

.first>label {
    padding-top: 0.25em;
    padding-left: 1em;
    height: 100%;
    width: 15em;
    color: #000;
}

.second {
    display: flex;
    flex-direction: row;
    justify-content: right;
    align-items: middle;
    height: 100%;
    width: 15em;
    background-color: #34cc99;
    margin-left: 0.25em;
}

.second>input {
    padding-top: 0.75em;
    background-color: #34cc99;
}

.input-disabled {
    background-color: grey !important;
}

/* TODO: create customer spinner style */
</style>