<script setup lang="ts">
import { defineModel, ref, watch, onMounted } from 'vue';
import { genCalcSkipSourceByteExtras, genCalcSkipSourceExtraDnA, EMPTY_KEY_SHORT} from '../modules/dataModel';
import { SourceExtra } from '../modules/documentModel';

const model = defineModel<SourceExtra>({ required: true });
const extraVal1 = ref<number>(EMPTY_KEY_SHORT);
const extraVal2 = ref<number>(EMPTY_KEY_SHORT);
const extras = genCalcSkipSourceByteExtras();

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
    if (newParam1) { extraVal1.value = newParam1 };
    const newParam2 = model.value.keyOrValue & 0xFF;
    if (newParam2) { extraVal2.value = newParam2 };
}

function updateModel() {
    const newKey = (extraVal1.value << 8) | extraVal2.value;
    const {abbr, description} = genCalcSkipSourceExtraDnA(newKey);
    model.value = new SourceExtra(newKey, abbr, description);
}
</script>

<template>
    <div class="extras-container">
        <select v-model="extraVal1" class="extra-select es1 form-select border-dark pt-1" :title="extras?.[extraVal1 + 1]?.abbr"
            :class="{ 'select-empty': extraVal1 === EMPTY_KEY_SHORT }">
            <option v-for="ex in extras" :key="ex.key" :value="ex.key" :title="ex.abbr">{{ ex.description }}</option>
        </select>
        <select v-model="extraVal2" class="extra-select es2 form-select border-dark pt-1" :title="extras?.[extraVal2 + 1]?.abbr"
            :class="{ 'select-empty': extraVal2 === EMPTY_KEY_SHORT }">
            <option v-for="ex in extras" :key="ex.key" :value="ex.key" :title="ex.abbr">{{ ex.description }}</option>
        </select>
    </div>
</template>

<style scoped> .extras-container {
     display: flex;
     flex-direction: row;
     justify-content: space-between;
     align-items: center;
     width: 100%;
 }

 .select-empty {
     background-color: grey !important;
 }

 .extra-select {
     width: 15em;
     background-color: #34cc99;
 }

 .es1 {
     margin-right: 2px;
 }

 .es2 {
     margin-left: 2px;
 }
</style>

