export const colors = {
  accent: {
    DEFAULT: '#F97316',   // orange-500
    light:   '#FB923C',   // orange-400
    lighter: '#FED7AA',   // orange-200
    dark:    '#EA580C',   // orange-600
    darker:  '#C2410C',   // orange-700
    muted:   '#FFF7ED',   // orange-50
  },
  surface: {
    base:    '#FFFFFF',
    raised:  '#F9FAFB',   // gray-50
    sunken:  '#F3F4F6',   // gray-100
    border:  '#E5E7EB',   // gray-200
    borderStrong: '#D1D5DB', // gray-300
  },
  text: {
    primary:   '#111827', // gray-900
    secondary: '#4B5563', // gray-600
    muted:     '#9CA3AF', // gray-400
    inverse:   '#FFFFFF',
    accent:    '#EA580C', // orange-600
  },
  semantic: {
    success: '#16A34A',
    error:   '#DC2626',
    warning: '#D97706',
    info:    '#2563EB',
  }
}

export const typography = {
  fontSans:  "'Inter', 'SF Pro Display', system-ui, sans-serif",
  fontMono:  "'JetBrains Mono', 'Fira Code', monospace",
  sizes: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl':'1.5rem',    // 24px
    '3xl':'1.875rem',  // 30px
    '4xl':'2.25rem',   // 36px
    '5xl':'3rem',      // 48px
    '6xl':'3.75rem',   // 60px
    '7xl':'4.5rem',    // 72px
  },
  weights: { normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 },
  tracking: { tight: '-0.04em', normal: '0', wide: '0.02em', wider: '0.08em' },
  leading:  { tight: '1.1', snug: '1.3', normal: '1.5', relaxed: '1.7' },
}

export const spacing = {
  // 4px base unit
  px: '1px', 0:'0', 1:'4px', 2:'8px', 3:'12px', 4:'16px',
  5:'20px', 6:'24px', 8:'32px', 10:'40px', 12:'48px',
  16:'64px', 20:'80px', 24:'96px', 32:'128px',
}

export const radius = {
  sm: '6px', md: '10px', lg: '16px', xl: '24px', '2xl': '32px', full: '9999px'
}

export const animation = {
  durations: { fast: '150ms', base: '250ms', slow: '400ms', slower: '600ms', slowest: '900ms' },
  easings: {
    smooth:  'cubic-bezier(0.4, 0, 0.2, 1)',
    spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
    snappy:  'cubic-bezier(0.2, 0, 0, 1)',
    bounce:  'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
}
