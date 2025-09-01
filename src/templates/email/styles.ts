// 웹사이트와 일치하는 이메일 스타일 시스템

export const EmailColors = {
  // Primary colors (웹사이트와 동일)
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    muted: '#9ca3af',
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    muted: '#f3f4f6',
  },
  
  // Border colors
  border: {
    light: '#e5e7eb',
    medium: '#d1d5db',
  },
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

export const EmailSpacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
} as const;

export const EmailFonts = {
  primary: 'Arial, sans-serif',
  secondary: '"Helvetica Neue", Helvetica, Arial, sans-serif',
} as const;

// 공통 스타일 객체들
export const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  fontFamily: EmailFonts.primary,
  backgroundColor: EmailColors.background.primary,
};

export const headerStyle = {
  textAlign: 'center' as const,
  padding: `${EmailSpacing['2xl']} ${EmailSpacing.xl}`,
  backgroundColor: EmailColors.background.secondary,
};

export const titleStyle = {
  color: EmailColors.primary,
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

export const bodyStyle = {
  padding: `${EmailSpacing.xl} ${EmailSpacing.xl}`,
  lineHeight: '1.6',
  color: EmailColors.text.primary,
};

export const buttonStyle = {
  backgroundColor: EmailColors.primary,
  color: EmailColors.background.primary,
  padding: `${EmailSpacing.md} ${EmailSpacing['2xl']}`,
  textDecoration: 'none',
  borderRadius: '6px',
  display: 'inline-block',
  fontWeight: 'bold',
  textAlign: 'center' as const,
};

export const footerStyle = {
  padding: `${EmailSpacing.xl} ${EmailSpacing.xl}`,
  borderTop: `1px solid ${EmailColors.border.light}`,
  fontSize: '12px',
  color: EmailColors.text.secondary,
  textAlign: 'center' as const,
};

export const highlightBoxStyle = {
  backgroundColor: EmailColors.background.muted,
  padding: EmailSpacing.xl,
  borderRadius: '8px',
  margin: `${EmailSpacing.xl} 0`,
};

export const listStyle = {
  margin: '0',
  paddingLeft: '20px',
  color: EmailColors.text.primary,
};