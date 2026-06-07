export interface FormatConfig {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline' | 'line-through' | 'underline line-through'
  color: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  lineHeight: number
  letterSpacing: number
  textIndent: number
}

export interface FormatPreset {
  id: string
  name: string
  format: Partial<FormatConfig>
}

export const defaultFormatConfig: FormatConfig = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#1a1a2e',
  backgroundColor: 'transparent',
  textAlign: 'left',
  lineHeight: 1.75,
  letterSpacing: 0,
  textIndent: 0,
}
