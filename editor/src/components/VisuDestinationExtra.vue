<script setup lang="ts">
import { computed } from 'vue';
import { DestinationExtra } from '../modules/documentModel';
import { type MappingTuple, EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION } from '../modules/dataModel';

const props = defineProps<{
  modelValue: DestinationExtra,
  visuExtras: MappingTuple[],
  isLocked?: boolean
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DestinationExtra]
}>();

const keyOrValue = computed({
  get() {
    return props.modelValue.keyOrValue;
  },
  set(newValue: number) {
    const selectedExtra = props.visuExtras?.find(x => x.key === newValue);
    if (selectedExtra) {
      emit('update:modelValue', new DestinationExtra(newValue, selectedExtra.abbr, selectedExtra.description));
    } else {
      emit('update:modelValue', new DestinationExtra(EMPTY_KEY, EMPTY_ABBR, EMPTY_DESCRIPTION));
    }
  }
});

</script>

<template>
  <select v-model.number="keyOrValue" :title="props.modelValue.abbr" class="form-select border-dark pt-1"
    :class="{ 'select-empty': props.modelValue.keyOrValue === EMPTY_KEY, 'select-locked': isLocked }"
    :disabled="isLocked">
    <option v-for="extra in props.visuExtras" :key="extra.key" :value="extra.key" :title="extra.abbr">
      {{ extra.description }}
    </option>
  </select>
</template>

<style scoped>
.select-empty {
  background-color: grey !important;
  color: black;
}
</style>