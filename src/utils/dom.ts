export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
}

export function getElementOffset(element: HTMLElement): { top: number; left: number } {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
  }
}

export function isDescendant(parent: HTMLElement, child: Node | null): boolean {
  let node = child
  while (node !== null) {
    if (node === parent) return true
    node = node.parentNode
  }
  return false
}

export function getCaretCoordinates(): { x: number; y: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0).cloneRange()
  range.collapse(true)

  const rect = range.getBoundingClientRect()
  return {
    x: rect.left,
    y: rect.top,
  }
}

export function formatStyleToString(style: CSSStyleDeclaration): string {
  return Array.from(style)
    .map((prop) => `${prop}: ${style.getPropertyValue(prop)}`)
    .join('; ')
}

export function parseStyleString(styleString: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!styleString) return result

  styleString.split(';').forEach((declaration) => {
    const [prop, value] = declaration.split(':').map((s) => s.trim())
    if (prop && value) {
      result[prop] = value
    }
  })

  return result
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
