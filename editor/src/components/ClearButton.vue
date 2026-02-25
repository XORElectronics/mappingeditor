<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <button class="clear-btn" v-bind="$attrs">
    <slot>Clear</slot>
  </button>
</template>

<style scoped>
.clear-btn {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(52, 204, 153, 0.1);
  border: 1px solid rgba(52, 204, 153, 0.3);
  color: #34cc99;
  border-radius: 3px;
  cursor: pointer;
}
.clear-btn:hover:not(:disabled) {
  background: rgba(52, 204, 153, 0.2);
  color: #34cc99;
}
.clear-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
