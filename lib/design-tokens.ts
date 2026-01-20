// MotorSafe Design Tokens
// Design system inspired by Linear, Stripe, and Vercel

export const tokens = {
  colors: {
    // Brand
    brand: {
      primary: 'hsl(239, 84%, 67%)',      // #6366F1 - Primary indigo
      secondary: 'hsl(210, 40%, 96%)',    // #F0F4F8 - Light grey
      accent: 'hsl(263, 70%, 50%)',       // #8B5CF6 - Purple accent
    },
    // Semantic
    success: 'hsl(158, 64%, 52%)',        // #10B981 - Emerald
    warning: 'hsl(38, 92%, 50%)',         // #F59E0B - Amber
    danger: 'hsl(0, 84%, 60%)',           // #EF4444 - Red
    info: 'hsl(217, 91%, 60%)',           // #3B82F6 - Blue
    // Neutrals
    background: 'hsl(210, 20%, 98%)',     // #FAFBFC
    foreground: 'hsl(222, 14%, 14%)',     // #1A1D21
    muted: 'hsl(215, 14%, 34%)',          // #5E6670
    mutedForeground: 'hsl(215, 8%, 57%)', // #8B929B
    border: 'hsl(220, 13%, 91%)',         // #E5E7EB
    input: 'hsl(220, 13%, 91%)',          // #E5E7EB
    ring: 'hsl(239, 84%, 67%)',           // #6366F1
  },
  radius: {
    none: '0',
    sm: '0.375rem',      // 6px
    md: '0.5rem',        // 8px
    lg: '0.75rem',       // 12px
    xl: '1rem',          // 16px
    '2xl': '1.5rem',     // 24px
    full: '9999px',
  },
  spacing: {
    page: '2rem',        // Padding global pages
    section: '1.5rem',   // Entre sections
    card: '1.5rem',      // Padding cards
    inline: '0.5rem',    // Spacing inline
  },
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
    focus: '0 0 0 3px rgba(99, 102, 241, 0.15)',
  },
  typography: {
    h1: 'text-4xl font-bold tracking-tight',        // 36px
    h2: 'text-3xl font-semibold tracking-tight',    // 30px
    h3: 'text-2xl font-semibold',                   // 24px
    h4: 'text-xl font-semibold',                    // 20px
    h5: 'text-lg font-medium',                      // 18px
    body: 'text-base',                               // 16px
    small: 'text-sm',                                // 14px
    caption: 'text-xs text-muted-foreground',        // 12px
  },
  animations: {
    // Framer Motion variants
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2 }
    },
    slideIn: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: { duration: 0.3 }
    },
    slideUp: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0.3 }
    },
    scaleIn: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.2 }
    }
  }
} as const;

// Type exports for TypeScript
export type DesignTokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type RadiusToken = keyof typeof tokens.radius;
export type SpacingToken = keyof typeof tokens.spacing;
export type ShadowToken = keyof typeof tokens.shadows;
