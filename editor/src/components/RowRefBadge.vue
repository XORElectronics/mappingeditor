<script setup lang="ts">
defineProps<{
  rowIndex: number
  displayAsHex: boolean
}>()

const emit = defineEmits<{
  click: [rowIndex: number]
}>()

function formatIndex(index: number, asHex: boolean): string {
  if (asHex) {
    return index.toString(16).toUpperCase().padStart(2, '0')
  }
  return index.toString()
}
</script>

<template>
  <span
    class="row-ref-badge"
    @click.stop="emit('click', rowIndex)"
    title="Click to scroll to row"
  >{{ formatIndex(rowIndex, displayAsHex) }}</span>
</template>

<style scoped>
.row-ref-badge {
  font-size: 10px;
  /* font-weight: bold; */
  color: #F1F700;
  background: rgba(241, 247, 0, 0.2);
  padding: 0 1px;
  border-radius: 2px;
  cursor: pointer;
  display: inline-block;
  margin: 0 1px;
  transition: background 0.15s ease;
}

.row-ref-badge:hover {
  background: rgba(241, 247, 0, 0.4);
}
</style>
