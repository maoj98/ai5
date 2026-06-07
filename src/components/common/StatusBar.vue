<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { FileText, Hash, Clock, Save, CheckCircle } from 'lucide-vue-next'
import { useEditor } from '@/composables/useEditor'

const { wordCount, paragraphCount, document } = useEditor()

const currentTime = ref(new Date())
const saveStatus = ref<'saved' | 'saving'>('saved')

let timeInterval: ReturnType<typeof setInterval> | null = null

const updatedTime = computed(() => {
  const date = new Date(document.value.updatedAt)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

function triggerSaveAnimation() {
  saveStatus.value = 'saving'
  setTimeout(() => {
    saveStatus.value = 'saved'
  }, 1000)
}

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

defineExpose({
  triggerSaveAnimation,
})
</script>

<template>
  <div class="status-bar">
    <div class="status-bar__left">
      <div class="status-item">
        <FileText :size="14" />
        <span>{{ document.title || '未命名文档' }}</span>
      </div>
    </div>

    <div class="status-bar__right">
      <div class="status-item">
        <Hash :size="14" />
        <span>{{ wordCount }} 字</span>
      </div>
      <div class="status-item">
        <FileText :size="14" />
        <span>{{ paragraphCount }} 段</span>
      </div>
      <div class="status-item">
        <Clock :size="14" />
        <span>更新于 {{ updatedTime }}</span>
      </div>
      <div class="status-item status-item--save">
        <CheckCircle v-if="saveStatus === 'saved'" :size="14" class="status-icon--success" />
        <Save v-else :size="14" class="status-icon--saving" />
        <span>{{ saveStatus === 'saved' ? '已保存' : '保存中...' }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--height-statusbar);
  padding: 0 var(--spacing-4);
  background-color: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-light);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);

  &--save {
    min-width: 80px;
    justify-content: flex-end;
  }
}

.status-icon {
  &--success {
    color: var(--color-success);
  }

  &--saving {
    color: var(--color-warning);
    animation: pulse 1s infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
