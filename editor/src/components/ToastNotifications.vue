<script setup lang="ts">
import { ref } from 'vue'

/**
 * ToastNotifications - Transient notification display component
 * 
 * Shows temporary toast messages for important user feedback.
 * Use sparingly for significant events that need immediate attention.
 */

export interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

const toasts = ref<ToastMessage[]>([])
let idCounter = 0

function show(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', duration = 5000): void {
  const toast: ToastMessage = {
    id: ++idCounter,
    message,
    type
  }
  toasts.value.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      dismiss(toast.id)
    }, duration)
  }
}

function dismiss(id: number): void {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for parent component
defineExpose({
  show,
  dismiss
})
</script>

<template>
  <div class="toast-container position-fixed bottom-0 start-0 p-3" style="z-index: 1100;">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast show"
      :class="{
        'bg-success text-white': toast.type === 'success',
        'bg-info text-white': toast.type === 'info',
        'bg-warning text-dark': toast.type === 'warning',
        'bg-danger text-white': toast.type === 'error'
      }"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="toast-header">
        <strong class="me-auto">
          <span class="toast-type-label" :class="'toast-type-' + toast.type">
            {{ toast.type.toUpperCase() }}
          </span>
        </strong>
        <button type="button" class="btn-close" @click="dismiss(toast.id)" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-type-label {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 2px;
}

.toast-type-success {
  background: #28a745;
  color: #fff;
}

.toast-type-info {
  background: #34cc99;
  color: #000;
}

.toast-type-warning {
  background: #ffc107;
  color: #000;
}

.toast-type-error {
  background: #dc3545;
  color: #fff;
}
</style>
