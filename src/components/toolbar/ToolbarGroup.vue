<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div class="toolbar-group">
    <div v-if="label" class="toolbar-group__label">{{ label }}</div>
    <div class="toolbar-group__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: 0 var(--spacing-3);
  border-right: 1px solid var(--color-border-light);

  &__label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-right: var(--spacing-2);
  }

  &__content {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
  }

  &:last-child {
    border-right: none;
  }
}
</style>
