import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FormatConfig, FormatPreset } from '@/types/format'
import { defaultFormatConfig } from '@/types/format'

export const useFormatStore = defineStore('format', () => {
  const globalFormat = ref<FormatConfig>({ ...defaultFormatConfig })
  const selectionFormat = ref<Partial<FormatConfig>>({})
  const isPanelOpen = ref(false)
  const formatPresets = ref<FormatPreset[]>([
    {
      id: 'preset-1',
      name: '正文',
      format: {
        fontSize: 16,
        lineHeight: 1.75,
        fontWeight: 'normal',
      },
    },
    {
      id: 'preset-2',
      name: '标题一',
      format: {
        fontSize: 32,
        lineHeight: 1.3,
        fontWeight: 'bold',
      },
    },
    {
      id: 'preset-3',
      name: '标题二',
      format: {
        fontSize: 24,
        lineHeight: 1.4,
        fontWeight: 'bold',
      },
    },
    {
      id: 'preset-4',
      name: '标题三',
      format: {
        fontSize: 20,
        lineHeight: 1.5,
        fontWeight: 'bold',
      },
    },
    {
      id: 'preset-5',
      name: '引用',
      format: {
        fontSize: 15,
        lineHeight: 1.8,
        fontStyle: 'italic',
        color: '#666666',
        textIndent: 24,
      },
    },
    {
      id: 'preset-6',
      name: '代码',
      format: {
        fontSize: 14,
        lineHeight: 1.6,
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        color: '#e83e8c',
      },
    },
  ])

  const mergedFormat = computed<FormatConfig>(() => ({
    ...globalFormat.value,
    ...selectionFormat.value,
  }))

  function setGlobalFormat(format: Partial<FormatConfig>) {
    globalFormat.value = { ...globalFormat.value, ...format }
  }

  function setSelectionFormat(format: Partial<FormatConfig>) {
    selectionFormat.value = { ...selectionFormat.value, ...format }
  }

  function resetSelectionFormat() {
    selectionFormat.value = {}
  }

  function applyPreset(presetId: string) {
    const preset = formatPresets.value.find((p) => p.id === presetId)
    if (preset) {
      setSelectionFormat(preset.format)
    }
  }

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value
  }

  function openPanel() {
    isPanelOpen.value = true
  }

  function closePanel() {
    isPanelOpen.value = false
  }

  return {
    globalFormat,
    selectionFormat,
    isPanelOpen,
    formatPresets,
    mergedFormat,
    setGlobalFormat,
    setSelectionFormat,
    resetSelectionFormat,
    applyPreset,
    togglePanel,
    openPanel,
    closePanel,
  }
})
