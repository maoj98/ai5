import type { FormatConfig } from '@/types/format'
import type { Paragraph, ParagraphType } from '@/types/document'
import { defaultFormatConfig } from '@/types/format'
import { generateId } from './dom'

export function execCommand(command: string, value?: string): boolean {
  document.execCommand('styleWithCSS', false, 'true')
  return document.execCommand(command, false, value)
}

export function formatBold(): boolean {
  return execCommand('bold')
}

export function formatItalic(): boolean {
  return execCommand('italic')
}

export function formatUnderline(): boolean {
  return execCommand('underline')
}

export function formatStrikeThrough(): boolean {
  return execCommand('strikeThrough')
}

export function formatHeading(level: 1 | 2 | 3 | 4 | 5 | 6): boolean {
  return execCommand('formatBlock', `<h${level}>`)
}

export function formatParagraph(): boolean {
  return execCommand('formatBlock', '<p>')
}

export function formatUnorderedList(): boolean {
  return execCommand('insertUnorderedList')
}

export function formatOrderedList(): boolean {
  return execCommand('insertOrderedList')
}

export function formatQuote(): boolean {
  return execCommand('formatBlock', '<blockquote>')
}

export function formatCode(): boolean {
  return execCommand('formatBlock', '<pre>')
}

export function formatAlignLeft(): boolean {
  return execCommand('justifyLeft')
}

export function formatAlignCenter(): boolean {
  return execCommand('justifyCenter')
}

export function formatAlignRight(): boolean {
  return execCommand('justifyRight')
}

export function formatAlignJustify(): boolean {
  return execCommand('justifyFull')
}

export function formatIndent(): boolean {
  return execCommand('indent')
}

export function formatOutdent(): boolean {
  return execCommand('outdent')
}

export function formatColor(color: string): boolean {
  return execCommand('foreColor', color)
}

export function formatBackgroundColor(color: string): boolean {
  return execCommand('hiliteColor', color)
}

export function formatFontSize(size: number): boolean {
  return execCommand('fontSize', size.toString())
}

export function formatFontFamily(fontFamily: string): boolean {
  return execCommand('fontName', fontFamily)
}

export function insertLink(url: string): boolean {
  if (!url) return false
  return execCommand('createLink', url)
}

export function removeFormat(): boolean {
  return execCommand('removeFormat')
}

export function insertParagraph(type: ParagraphType, content: string = '', format?: Partial<FormatConfig>): Paragraph {
  return {
    id: generateId(),
    type,
    content,
    format: { ...defaultFormatConfig, ...format },
    level: type === 'heading' ? 1 : undefined,
  }
}

export function createEmptyParagraph(format?: Partial<FormatConfig>): Paragraph {
  return insertParagraph('text', '', format)
}

export function getParagraphTypeFromElement(element: HTMLElement): ParagraphType {
  const tagName = element.tagName.toLowerCase()
  
  switch (tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return 'heading'
    case 'ul':
    case 'ol':
    case 'li':
      return 'list'
    case 'blockquote':
      return 'quote'
    case 'pre':
    case 'code':
      return 'code'
    case 'img':
      return 'image'
    default:
      return 'text'
  }
}

export function formatToInlineStyle(format: Partial<FormatConfig>): string {
  const styles: string[] = []
  
  if (format.fontFamily) styles.push(`font-family: ${format.fontFamily}`)
  if (format.fontSize) styles.push(`font-size: ${format.fontSize}px`)
  if (format.fontWeight) styles.push(`font-weight: ${format.fontWeight}`)
  if (format.fontStyle) styles.push(`font-style: ${format.fontStyle}`)
  if (format.textDecoration) styles.push(`text-decoration: ${format.textDecoration}`)
  if (format.color) styles.push(`color: ${format.color}`)
  if (format.backgroundColor && format.backgroundColor !== 'transparent') {
    styles.push(`background-color: ${format.backgroundColor}`)
  }
  if (format.textAlign) styles.push(`text-align: ${format.textAlign}`)
  if (format.lineHeight) styles.push(`line-height: ${format.lineHeight}`)
  if (format.letterSpacing) styles.push(`letter-spacing: ${format.letterSpacing}px`)
  if (format.textIndent) styles.push(`text-indent: ${format.textIndent}px`)
  
  return styles.join('; ')
}

export function inlineStyleToFormat(styleString: string): Partial<FormatConfig> {
  const format: Partial<FormatConfig> = {}
  const styles = new Map<string, string>()
  
  styleString.split(';').forEach((declaration) => {
    const [prop, value] = declaration.split(':').map((s) => s.trim())
    if (prop && value) {
      styles.set(prop.toLowerCase(), value)
    }
  })
  
  if (styles.has('font-family')) format.fontFamily = styles.get('font-family')!
  if (styles.has('font-size')) {
    const size = parseFloat(styles.get('font-size')!)
    if (!isNaN(size)) format.fontSize = size
  }
  if (styles.has('font-weight')) {
    const weight = styles.get('font-weight')!
    format.fontWeight = weight === '700' || weight === 'bold' ? 'bold' : 'normal'
  }
  if (styles.has('font-style')) format.fontStyle = styles.get('font-style') as any
  if (styles.has('text-decoration')) format.textDecoration = styles.get('text-decoration') as any
  if (styles.has('color')) format.color = styles.get('color')!
  if (styles.has('background-color')) format.backgroundColor = styles.get('background-color')!
  if (styles.has('text-align')) format.textAlign = styles.get('text-align') as any
  if (styles.has('line-height')) {
    const lh = parseFloat(styles.get('line-height')!)
    if (!isNaN(lh)) format.lineHeight = lh
  }
  if (styles.has('letter-spacing')) {
    const ls = parseFloat(styles.get('letter-spacing')!)
    if (!isNaN(ls)) format.letterSpacing = ls
  }
  if (styles.has('text-indent')) {
    const ti = parseFloat(styles.get('text-indent')!)
    if (!isNaN(ti)) format.textIndent = ti
  }
  
  return format
}

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  
  const allowedTags = new Set([
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'a', 'img', 'br', 'span', 'div'
  ])
  
  const allowedAttributes = new Set([
    'href', 'src', 'alt', 'title', 'style', 'target'
  ])
  
  function cleanNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const tagName = element.tagName.toLowerCase()
      
      if (!allowedTags.has(tagName)) {
        const text = document.createTextNode(element.textContent || '')
        element.parentNode?.replaceChild(text, element)
        return
      }
      
      Array.from(element.attributes).forEach((attr) => {
        if (!allowedAttributes.has(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name)
        }
      })
      
      Array.from(element.childNodes).forEach(cleanNode)
    }
  }
  
  Array.from(div.childNodes).forEach(cleanNode)
  
  return div.innerHTML
}
