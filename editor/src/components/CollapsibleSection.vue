<script setup lang="ts">
import { ref, watch, useSlots } from 'vue';

const props = defineProps<{
  label: string;
  storageKey: string;
  defaultExpanded?: boolean;
}>();

const slots = useSlots();

const expanded = ref(
  localStorage.getItem(props.storageKey) !== null
    ? localStorage.getItem(props.storageKey) !== 'false'
    : (props.defaultExpanded ?? true)
);

watch(expanded, (val) => {
  localStorage.setItem(props.storageKey, val.toString());
});

function toggle(): void {
  if (slots.default) expanded.value = !expanded.value;
}
</script>

<template>
  <div class="cs-header" :class="{ 'cs-header--clickable': !!slots.default }" @click="toggle">
    <span v-if="slots.default" class="cs-arrow" :class="{ expanded }">▸</span>
    <span class="cs-label">{{ label }}</span>
    <slot name="right" />
  </div>
  <div v-if="slots.default && expanded" class="cs-content">
    <slot />
  </div>
</template>

<style scoped>
.cs-header {
  border-top: 1px solid rgba(52, 204, 153, 0.3);
  margin: 4px 0 0;
  padding-top: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
  user-select: none;
}

.cs-header--clickable {
  cursor: pointer;
}

.cs-header--clickable:hover .cs-label {
  color: #F1F700;
}

.cs-header--clickable:hover .cs-arrow {
  color: #F1F700;
}

.cs-arrow {
  color: #34cc99;
  font-size: 10px;
  transition: transform 0.2s ease;
  display: inline-block;
  flex-shrink: 0;
}

.cs-arrow.expanded {
  transform: rotate(90deg);
}

.cs-label {
  color: #34cc99;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.cs-content {
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
