// Brutalist sport design tokens. Single source of truth for the whole app.
// Touch this file to retheme everything.

export const colors = {
  // Surfaces
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceAlt: '#0F0F0F',
  border: '#1F1F1F',
  borderStrong: '#333333',

  // Text
  text: '#FFFFFF',
  textMuted: '#888888',
  textDim: '#555555',

  // Accent — electric blue. We keep the variable name `volt` throughout the
  // codebase so a re-theme later only touches this file. Same role, different hue.
  volt: '#00E5FF',
  voltDark: '#0A0A0A', // text color when sitting on the accent fill
  voltSoft: '#001A1F', // dark accent-tinted bg, used sparingly

  // Semantic
  danger: '#FF2D2D',
  success: '#00D26A',
};

export const radii = {
  sm: 2,
  md: 4,
  lg: 8,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Typography. We use system fonts for now. To wire up Inter / a condensed
// display face, install `expo-font` and load it in app/_layout.tsx — the
// font names below are forward-compatible.
export const fonts = {
  display: 'System', // swap to 'Inter-Black' once loaded
  body: 'System',
  mono: 'Menlo', // iOS default; Android falls back to monospace
};

export const type = {
  // Eyebrow / metadata labels — small caps, tracked, monospace
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
  },
  eyebrowVolt: {
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.volt,
  },
  // Display sizes — condensed feel via tight letter spacing + heavy weight
  displayXL: {
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: '900' as const,
    letterSpacing: -2,
    color: colors.text,
  },
  displayL: {
    fontFamily: fonts.display,
    fontSize: 38,
    fontWeight: '900' as const,
    letterSpacing: -1.2,
    color: colors.text,
  },
  displayM: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '900' as const,
    letterSpacing: -0.5,
    textTransform: 'uppercase' as const,
    color: colors.text,
  },
  // UI label — always uppercase, bold
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
    color: colors.text,
  },
  // Body
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
    lineHeight: 20,
  },
  bodyMuted: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
    lineHeight: 16,
  },
  // Mono numeric — for timers, weights, reps
  numeric: {
    fontFamily: fonts.mono,
    fontWeight: '700' as const,
    color: colors.text,
  },
};
