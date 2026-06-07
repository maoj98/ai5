<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, Check } from 'lucide-vue-next'
import { useFormatStore } from '@/stores/format'
import { useEditor } from '@/composables/useEditor'
import type { FormatConfig } from '@/types/format'
import { defaultFormatConfig } from '@/types/format'

const formatStore = useFormatStore()
const { activeColumnId, activeParagraphId, handleParagraphFormat, handleUpdateGlobalFormat } = useEditor()

const { isPanelOpen, globalFormat, selectionFormat, formatPresets } = formatStore

const localFormat = ref<FormatConfig>({ ...defaultFormatConfig })

watch(
  () => formatStore.globalFormat,
  (newFormat) => {
    localFormat.value = { ...newFormat }
  },
  { immediate: true, deep: true }
)

const fontFamilies = [
  { label: 'Inter (无衬线)', value: 'Inter, system-ui, sans-serif' },
  { label: 'Cormorant Garamond (衬线)', value: 'Cormorant Garamond, Georgia, serif' },
  { label: 'JetBrains Mono (等宽)', value: 'JetBrains Mono, Consolas, monospace' },
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
]

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48]

const colors = [
  '#1a1a2e', '#4a4a5a', '#666666', '#999999',
  '#d4a574', '#e83e8c', '#007bff', '#28a745',
  '#dc3545', '#ffc107', '#17a2b8', '#6f42c1',
]

const bgColors = [
  'transparent', '#f5f0e8', '#fff3cd', '#d4edda',
  '#cce5ff', '#f8d7da', '#e2e3e5', '#d6d8db',
]

function updateFormat<K extends keyof FormatConfig>(key: K, value: FormatConfig[K]) {
  localFormat.value[key] = value
  
  if (activeColumnId.value && activeParagraphId.value) {
    handleParagraphFormat(activeColumnId.value, activeParagraphId.value, { [key]: value } as Partial<FormatConfig>)
  } else {
    handleUpdateGlobalFormat({ [key]: value } as Partial<FormatConfig>)
  }
}

function applyPreset(preset: any) {
  Object.entries(preset.format).forEach(([key, value]) => {
    updateFormat(key as keyof FormatConfig, value as FormatConfig[keyof FormatConfig])
  })
}

function closePanel() {
  formatStore.closePanel()
}

function resetFormat() {
  localFormat.value = { ...defaultFormatConfig }
  if (activeColumnId.value && activeParagraphId.value) {
    handleParagraphFormat(activeColumnId.value, activeParagraphId.value, defaultFormatConfig)
  } else {
    handleUpdateGlobalFormat(defaultFormatConfig)
  }
}
</script>

<template>
  <Transition name="panel">
    <div v-if="isPanelOpen" class="format-panel">
      <div class="format-panel__header">
        <h3 class="format-panel__title">
          <Palette :size="20" />
          <span>格式设置</span>
        </h3>
        <button class="format-panel__close" @click="closePanel">
          <X :size="20" />
        </button>
      </div>

      <div class="format-panel__content">
        <div class="format-section">
          <h4 class="format-section__title">样式预设</h4>
          <div class="format-presets">
            <button
              v-for="preset in formatPresets"
              :key="preset.id"
              class="format-preset-btn"
              @click="applyPreset(preset)"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <div class="format-section">
          <h4 class="format-section__title">
            <Type :size="16" />
            <span>字体</span>
          </h4>
          <div class="format-row">
            <label class="format-label">字体</label>
            <select
              class="format-select"
              :value="localFormat.fontFamily"
              @change="(e) => updateFormat('fontFamily', (e.target as HTMLSelectElement).value)"
            >
              <option v-for="font in fontFamilies" :key="font.value" :value="font.value">
                {{ font.label }}
              </option>
            </select>
          </div>
          <div class="format-row">
            <label class="format-label">字号</label>
            <select
              class="format-select"
              :value="localFormat.fontSize"
              @change="(e) => updateFormat('fontSize', parseInt((e.target as HTMLSelectElement).value))"
            >
              <option v-for="size in fontSizes" :key="size" :value="size">
                {{ size }}px
              </option>
            </select>
          </div>
        </div>

        <div class="format-section">
          <h4 class="format-section__title">样式</h4>
          <div class="format-buttons">
            <button
              class="format-btn"
              :class="{ active: localFormat.fontWeight === 'bold' }"
              @click="updateFormat('fontWeight', localFormat.fontWeight === 'bold' ? 'normal' : 'bold')"
            >
              <strong>B</strong>
            </button>
            <button
              class="format-btn"
              :class="{ active: localFormat.fontStyle === 'italic' }"
              @click="updateFormat('fontStyle', localFormat.fontStyle === 'italic' ? 'normal' : 'italic')"
            >
              <em>I</em>
            </button>
            <button
              class="format-btn"
              :class="{ active: localFormat.textDecoration === 'underline' }"
              @click="updateFormat('textDecoration', localFormat.textDecoration === 'underline' ? 'none' : 'underline')"
            >
              <u>U</u>
            </button>
            <button
              class="format-btn"
              :class="{ active: localFormat.textDecoration === 'line-through' }"
              @click="updateFormat('textDecoration', localFormat.textDecoration === 'line-through' ? 'none' : 'line-through')"
            >
              <s>S</s>
            </button>
          </div>
        </div>

        <div class="format-section">
          <h4 class="format-section__title">
            <AlignLeft :size="16" />
            <span>对齐</span>
          </h4>
          <div class="format-buttons">
            <button
              class="format-btn"
              :class="{ active: localFormat.textAlign === 'left' }"
              @click="updateFormat('textAlign', 'left')"
            >
              <AlignLeft :size="18" />
            </button>
            <button
              class="format-btn"
              :class="{ active: localFormat.textAlign === 'center' }"
              @click="updateFormat('textAlign', 'center')"
            >
              <AlignCenter :size="18" />
            </button>
            <button
              class="format-btn"
              :class="{ active: localFormat.textAlign === 'right' }"
              @click="updateFormat('textAlign', 'right')"
            >
              <AlignRight :size="18" />
            </button>
            <button
              class="format-btn"
              :class="{ active: localFormat.textAlign === 'justify' }"
              @click="updateFormat('textAlign', 'justify')"
            >
              <AlignJustify :size="18" />
            </button>
          </div>
        </div>

        <div class="format-section">
          <h4 class="format-section__title">颜色</h4>
          <div class="format-row">
            <label class="format-label">文字颜色</label>
            <div class="color-picker">
              <button
                v-for="color in colors"
                :key="color"
                class="color-swatch"
                :class="{ active: localFormat.color === color }"
                :style="{ backgroundColor: color }"
                @click="updateFormat('color', color)"
              >
                <Check v-if="localFormat.color === color" :size="12" :class="{ white: color !== '#1a1a2e' && color !== '#666666' }" />
              </button>
            </div>
          </div>
          <div class="format-row">
            <label class="format-label">背景颜色</label>
            <div class="color-picker">
              <button
                v-for="color in bgColors"
                :key="color"
                class="color-swatch"
                :class="{ active: localFormat.backgroundColor === color }"
                :style="{ backgroundColor: color === 'transparent' ? 'transparent' : color, border: color === 'transparent' ? '1px dashed #ccc' : 'none' }"
                @click="updateFormat('backgroundColor', color)"
              >
                <Check v-if="localFormat.backgroundColor === color" :size="12" />
              </button>
            </div>
          </div>
        </div>

        <div class="format-section">
          <h4 class="format-section__title">间距</h4>
          <div class="format-row">
            <label class="format-label">行高</label>
            <input
              type="range"
              class="format-range"
              min="1"
              max="3"
              step="0.1"
              :value="localFormat.lineHeight"
              @input="(e) => updateFormat('lineHeight', parseFloat((e.target as HTMLInputElement).value))"
            />
            <span class="format-value">{{ localFormat.lineHeight.toFixed(1) }}</span>
          </div>
          <div class="format-row">
            <label class="format-label">字间距</label>
            <input
              type="range"
              class="format-range"
              min="0"
              max="10"
              step="0.5"
              :value="localFormat.letterSpacing"
              @input="(e) => updateFormat('letterSpacing', parseFloat((e.target as HTMLInputElement).value))"
            />
            <span class="format-value">{{ localFormat.letterSpacing.toFixed(1) }}px</span>
          </div>
          <div class="format-row">
            <label class="format-label">首行缩进</label>
            <input
              type="range"
              class="format-range"
              min="0"
              max="48"
              step="2"
              :value="localFormat.textIndent"
              @input="(e) => updateFormat('textIndent', parseInt((e.target as HTMLInputElement).value))"
            />
            <span class="format-value">{{ localFormat.textIndent }}px</span>
          </div>
        </div>

        <div class="format-section">
          <button class="reset-btn" @click="resetFormat">
            重置为默认格式
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.format-panel {
  position: fixed;
  top: var(--height-toolbar);
  right: 0;
  width: 320px;
  height: calc(100vh - var(--height-toolbar) - var(--height-statusbar));
  background-color: var(--color-bg-panel);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-modal);
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4) var(--spacing-5);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    transition: all var(--transition-fast);

    &:hover {
      background-color: var(--color-bg-hover);
      color: var(--color-text-primary);
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-4) var(--spacing-5);
  }
}

.format-section {
  margin-bottom: var(--spacing-6);

  &__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-3);
  }
}

.format-presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.format-preset-btn {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-hover);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--color-accent-light);
    border-color: var(--color-accent);
  }
}

.format-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.format-label {
  width: 80px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.format-select {
  flex: 1;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-editor);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--color-accent);
  }
}

.format-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.format-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: var(--color-bg-editor);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-accent);
  }

  &.active {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-bg-primary);
  }
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  flex: 1;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: var(--color-accent);
  }

  :deep(svg) {
    color: var(--color-bg-primary);

    &.white {
      color: var(--color-bg-panel);
    }
  }
}

.format-range {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background-color: var(--color-border);
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: var(--color-accent);
    cursor: pointer;
    transition: transform var(--transition-fast);

    &:hover {
      transform: scale(1.2);
    }
  }
}

.format-value {
  width: 50px;
  text-align: right;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
}

.reset-btn {
  width: 100%;
  padding: var(--spacing-3);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-hover);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--color-error);
    color: white;
  }
}

.panel-enter-active,
.panel-leave-active {
  transition: transform var(--transition-base) ease-out;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}
</style>
