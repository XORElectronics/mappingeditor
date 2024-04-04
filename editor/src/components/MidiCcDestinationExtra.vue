<script setup lang="ts">
import { defineModel, onMounted, ref, defineEmits } from 'vue';
import { EMPTY_ABBR, EMPTY_DESCRIPTION, EMPTY_KEY, genMidiCcDestinationDnA, type MappingTuple } from '../modules/dataModel';
import { DestinationExtra } from '../modules/documentModel';

const MAX_VALUE = 4095;
const model = defineModel<DestinationExtra>({ required: true });
const props = defineProps({ midiCcExtras: { type: Array<MappingTuple>, required: true } });
const nrpnInput = ref<HTMLInputElement>();
const nrpnSelect = ref<HTMLSelectElement>();
const nrpnCheck = ref<HTMLInputElement>();
const showNrpn = ref<boolean>(false);
const nrpnValue = ref<number>(EMPTY_KEY);

function checkChanged() {
    if (nrpnCheck.value?.checked) {
        showNrpn.value = true;
        return;
    }

    showNrpn.value = false;
}

function numChanged() {
    const actualKey = nrpnValue.value + 127;
    const { abbr, description } = genMidiCcDestinationDnA(actualKey);
    model.value = new DestinationExtra(actualKey, abbr, description);
}

function selectChanged() {
    const actualKey = parseInt(nrpnSelect.value?.value || "0");
    const { abbr, description } = genMidiCcDestinationDnA(actualKey);
    model.value = new DestinationExtra(actualKey, abbr, description);
}   

defineEmits(['update:modelValue']);

</script>

<template>
    <div class="extras-container">
        <div class="first" :class="{ 'input-disabled': !showNrpn }" :title="model.abbr">
            <label for="nrpnCheck">NRPN:</label>
            <div>
                <input type="checkbox" class="form-check-input" id="nrpnCheck" ref="nrpnCheck" @change="checkChanged" />
            </div>
        </div>
        <div class="second">
            <select v-if="!showNrpn" :value="model.keyOrValue" :title="model.abbr" class="form-select border-dark pt-1" id="nrpnSelect" ref="nrpnSelect" @change="selectChanged"
                :class="{ 'select-empty': model.keyOrValue === EMPTY_KEY }">
                <option v-for="extra in props.midiCcExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
                    {{ extra.description }}</option>
            </select>
            <input v-else type="number" class="form-control" id="nrpnInput" ref="nrpnInput" v-model="nrpnValue"
                @change="numChanged()" :max="MAX_VALUE" :min="0" :title="model.description" />
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
    width: 10em;
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
    width: 6em;
    color: #000;
}

.second {
    display: flex;
    flex-direction: row;
    justify-content: right;
    align-items: middle;
    height: 100%;
    width: 30em;
    background-color: #34cc99;
    margin-left: 0.25em;
}

.second>input {
    padding-top: 0.75em;
    background-color: #34cc99;
}

.second>select {
  background-color: #34cc99;
  color: black;
  padding-top: 0.7em !important;
}

.input-disabled {
    background-color: grey !important;
}

.select-empty {
  background-color: grey !important;
  color: black;
}
/* TODO: create customer spinner style */
</style>