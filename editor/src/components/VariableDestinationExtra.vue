<script setup lang="ts">
import { computed } from 'vue';
import { EMPTY_ABBR, EMPTY_DESCRIPTION, EMPTY_KEY } from '../modules/dataModel';
import { DestinationExtra } from '../modules/documentModel';

const props = defineProps<{
  isLocked?: boolean
}>();

const model = defineModel<DestinationExtra>({ required: true });

const options = [
  { key: EMPTY_KEY, abbr: "----", description: "No Action" },
  { key: 0, abbr: "SRC ", description: "Set Variable/Row" },
  { key: 1, abbr: "RST ", description: "Reset Variable/Row if Source == true" }
];

const selectedKey = computed({
  get() {
    return model.value.keyOrValue;
  },
  set(newKey: number) {
    const option = options.find(opt => opt.key === newKey);
    if (option) {
      model.value = new DestinationExtra(newKey, option.abbr, option.description);
    }
  }
});

</script>

<template>
    <select v-model.number="selectedKey" :title="model.abbr" class="form-select border-dark pt-1"
        :class="{ 'select-empty': model.keyOrValue === EMPTY_KEY, 'select-locked': isLocked }"
        :disabled="isLocked">
        <option v-for="option in options" :key="option.key" :value="option.key" :title="option.abbr">
            {{ option.description }}
        </option>
    </select>
</template>

<style scoped>
.select-empty {
    background-color: grey !important;
    color: black;
}
</style>