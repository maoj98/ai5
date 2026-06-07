<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import Toolbar from '@/components/toolbar/Toolbar.vue'
import ColumnEditor from '@/components/editor/ColumnEditor.vue'
import FormatPanel from '@/components/panel/FormatPanel.vue'
import StatusBar from '@/components/common/StatusBar.vue'
import { useHistory } from '@/composables/useHistory'

const statusBarRef = ref<InstanceType<typeof StatusBar> | null>(null)
const { saveToLocalStorage, loadFromLocalStorage, recordHistory } = useHistory()

async function handleSave() {
  saveToLocalStorage()
  statusBarRef.value?.triggerSaveAnimation()
}

onMounted(() => {
  nextTick(() => {
    loadFromLocalStorage()
    recordHistory('初始化文档', true)
  })
})
</script>

<template>
  <div class="app-container">
    <Toolbar @save="handleSave" />
    
    <main class="main-content">
      <ColumnEditor />
      <FormatPanel />
    </main>
    
    <StatusBar ref="statusBarRef" />
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}
</style>
