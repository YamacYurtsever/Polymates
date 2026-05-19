import { createTheme } from '@mui/material'

declare module '@mui/material/styles' {
  interface Palette {
    yes: Palette['primary']
    no: Palette['primary']
  }
  interface PaletteOptions {
    yes?: PaletteOptions['primary']
    no?: PaletteOptions['primary']
  }
}

const FONT_SERIF = '"Playfair Display", Georgia, "Times New Roman", serif'
const FONT_SANS =
  '"Inter", "Inter Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const FONT_MONO = '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

const BG = '#F7F3EA'
const SURFACE = '#FFFFFF'
const INK = '#1A1A1A'
const INK_SECONDARY = '#4A4A50'
const INK_MUTED = '#8A8A90'
const HAIRLINE = '#DDD8CC'

const BRAND = '#1C2A5E'
const BRAND_DARK = '#111C42'
const YES = '#27AE60'
const YES_TINT = '#EAF7EF'
const NO = '#E64556'
const NO_TINT = '#FDECEE'

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: BG, paper: SURFACE },
    text: { primary: INK, secondary: INK_SECONDARY, disabled: INK_MUTED },
    primary: { main: BRAND, dark: BRAND_DARK, contrastText: '#fff' },
    success: { main: YES, light: YES_TINT, contrastText: '#fff' },
    error: { main: NO, light: NO_TINT, contrastText: '#fff' },
    yes: { main: YES, light: YES_TINT, contrastText: '#fff' },
    no: { main: NO, light: NO_TINT, contrastText: '#fff' },
    divider: HAIRLINE,
    action: {
      hover: 'rgba(26,26,26,0.04)',
      selected: 'rgba(28,42,94,0.08)',
      disabledBackground: 'rgba(26,26,26,0.06)',
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: FONT_SANS,
    fontWeightLight: 400,
    fontWeightRegular: 450,
    fontWeightMedium: 550,
    fontWeightBold: 650,
    h1: { fontWeight: 650, letterSpacing: '-0.02em', fontSize: '2.75rem', lineHeight: 1.1 },
    h2: { fontWeight: 650, letterSpacing: '-0.02em', fontSize: '2.25rem', lineHeight: 1.15 },
    h3: { fontWeight: 650, letterSpacing: '-0.015em', fontSize: '1.75rem', lineHeight: 1.2 },
    h4: { fontWeight: 650, letterSpacing: '-0.015em', fontSize: '1.5rem', lineHeight: 1.25 },
    h5: { fontWeight: 650, letterSpacing: '-0.01em', fontSize: '1.25rem', lineHeight: 1.3 },
    h6: { fontWeight: 600, letterSpacing: '-0.005em', fontSize: '1rem', lineHeight: 1.4 },
    subtitle1: { fontWeight: 550, fontSize: '0.95rem' },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4, color: INK_SECONDARY },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"ss01", "cv11"',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '.mono, .tabular': {
          fontFamily: FONT_MONO,
          fontVariantNumeric: 'tabular-nums',
        },
      },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: HAIRLINE },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: {
        root: {
          borderRadius: 10,
          borderColor: HAIRLINE,
          backgroundColor: SURFACE,
          transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 14,
          paddingBlock: 8,
          fontWeight: 600,
          transition: 'background-color 150ms ease-out, border-color 150ms ease-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: { borderColor: HAIRLINE, color: INK, backgroundColor: SURFACE },
        sizeLarge: { paddingInline: 18, paddingBlock: 11, fontSize: '0.95rem' },
        sizeSmall: { paddingInline: 10, paddingBlock: 5, fontSize: '0.8125rem' },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: SURFACE,
          '& fieldset': { borderColor: HAIRLINE },
          '&:hover fieldset': { borderColor: '#B8B0A0 !important' },
        },
        input: { fontSize: '0.9375rem' },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontSize: '0.875rem' } },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 550,
          fontSize: '0.72rem',
          letterSpacing: '0.02em',
          textTransform: 'lowercase',
          height: 22,
        },
        outlined: { borderColor: HAIRLINE, backgroundColor: SURFACE },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: HAIRLINE } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12, border: `1px solid ${HAIRLINE}`, backgroundColor: SURFACE },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          borderColor: HAIRLINE,
          textTransform: 'none',
          fontWeight: 600,
          color: INK_SECONDARY,
          '&.Mui-selected': { color: INK },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: HAIRLINE },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: INK,
          fontSize: '0.75rem',
          borderRadius: 6,
          paddingInline: 8,
          paddingBlock: 4,
        },
      },
    },
  },
})

export const tokens = {
  fontSerif: FONT_SERIF,
  fontMono: FONT_MONO,
  bg: BG,
  surface: SURFACE,
  ink: INK,
  inkSecondary: INK_SECONDARY,
  hairline: HAIRLINE,
  brand: BRAND,
  yes: YES,
  yesTint: YES_TINT,
  no: NO,
  noTint: NO_TINT,
  controlHeightSm: 32,
  betCardHeight: 150,
}
