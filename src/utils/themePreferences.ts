export type ThemePreference = 'dark' | 'light' | 'bw';
export type AccentPreference =
  | 'emerald'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'cyan'
  | 'amber'
  | 'slate';

type AccentPaletteEntry = {
  id: AccentPreference;
  name: string;
  fill: string;
  rgb: string;
  text: string;
};

const THEME_STORAGE_KEY = 'study-always:theme-preference';
const ACCENT_STORAGE_KEY = 'study-always:accent-preference';

export const DEFAULT_THEME: ThemePreference = 'dark';
export const DEFAULT_ACCENT: AccentPreference = 'emerald';

const THEME_VALUES: ThemePreference[] = ['dark', 'light', 'bw'];

export const ACCENT_PALETTE: AccentPaletteEntry[] = [
  { id: 'emerald', name: 'Esmeralda', fill: '#22c55e', rgb: '34, 197, 94', text: '#ffffff' },
  { id: 'blue', name: 'Azul', fill: '#3b82f6', rgb: '59, 130, 246', text: '#ffffff' },
  { id: 'violet', name: 'Violeta', fill: '#7c3aed', rgb: '124, 58, 237', text: '#ffffff' },
  { id: 'rose', name: 'Rosa', fill: '#f43f5e', rgb: '244, 63, 94', text: '#ffffff' },
  { id: 'orange', name: 'Laranja', fill: '#ea580c', rgb: '234, 88, 12', text: '#ffffff' },
  { id: 'cyan', name: 'Teal', fill: '#0f766e', rgb: '15, 118, 110', text: '#ffffff' },
  { id: 'amber', name: 'Âmbar', fill: '#d97706', rgb: '217, 119, 6', text: '#ffffff' },
  { id: 'slate', name: 'Grafite', fill: '#475569', rgb: '71, 85, 105', text: '#ffffff' },
];

const ACCENT_VALUES = ACCENT_PALETTE.map((accent) => accent.id);

const isThemePreference = (value: unknown): value is ThemePreference => {
  return typeof value === 'string' && THEME_VALUES.includes(value as ThemePreference);
};

export const isAccentPreference = (value: unknown): value is AccentPreference => {
  return typeof value === 'string' && ACCENT_VALUES.includes(value as AccentPreference);
};

export const getAccentPaletteEntry = (accent?: AccentPreference | null) => {
  return ACCENT_PALETTE.find((entry) => entry.id === accent) || ACCENT_PALETTE[0];
};

export const getStoredThemePreference = () => {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(value) ? value : null;
};

export const getStoredAccentPreference = () => {
  const value = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return isAccentPreference(value) ? value : null;
};

export const setStoredThemePreference = (theme: ThemePreference) => {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const setStoredAccentPreference = (accent: AccentPreference) => {
  window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
};

const applyAccentVariables = (theme: ThemePreference, accent: AccentPreference) => {
  const root = document.documentElement;
  const palette = getAccentPaletteEntry(accent);
  const effectiveFill = theme === 'bw' ? '#000000' : palette.fill;
  const effectiveRgb = theme === 'bw' ? '0, 0, 0' : palette.rgb;
  const effectiveText = theme === 'bw' ? '#ffffff' : palette.text;

  root.style.setProperty('--fill-accent', effectiveFill);
  root.style.setProperty('--fill-accent-rgb', effectiveRgb);
  root.style.setProperty('--bg-accent', `rgba(${effectiveRgb}, 0.12)`);
  root.style.setProperty('--text-accent', effectiveFill);
  root.style.setProperty('--accent-contrast', effectiveText);
  root.style.setProperty('--chrome-accent', effectiveFill);
  root.style.setProperty('--brand-primary', effectiveFill);
};

export const applyThemePreferences = (theme: ThemePreference, accent: AccentPreference) => {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-accent', accent);
  applyAccentVariables(theme, accent);
};

export const resolveThemePreferences = (profile?: { theme?: unknown; accentColor?: unknown } | null) => {
  const storedTheme = getStoredThemePreference();
  const theme = storedTheme || (isThemePreference(profile?.theme) ? profile.theme : DEFAULT_THEME);

  const profileAccent = isAccentPreference(profile?.accentColor) ? profile.accentColor : null;
  const storedAccent = getStoredAccentPreference();
  const accent = profileAccent || storedAccent || DEFAULT_ACCENT;

  if (!storedTheme) setStoredThemePreference(theme);
  if (storedAccent !== accent) setStoredAccentPreference(accent);

  return { theme, accent };
};
