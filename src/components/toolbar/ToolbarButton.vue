<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active?: boolean
  disabled?: boolean
  title?: string
}>()

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const classes = computed(() => ({
  'toolbar-btn': true,
  'toolbar-btn--active': props.active,
  'toolbar-btn--disabled': props.disabled,
}))
</script>

<template>
  <button
    :class="classes"
    :title="title"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  transition: all var(--transition-fast);
  position: relative;

  &:hover:not(.toolbar-btn--disabled) {
    background-color: var(--color-bg-hover);
    transform: translateY(-1px);
  }

  &--active {
    background-color: var(--color-accent) !important;
    color: var(--color-bg-primary);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
