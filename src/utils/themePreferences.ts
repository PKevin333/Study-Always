export type ThemePreference = 'dark' | 'light' | 'bw';
export type AccentPreference = 'green' | 'blue' | 'purple' | 'orange';

const THEME_STORAGE_KEY = 'study-always:theme-preference';
const ACCENT_STORAGE_KEY = 'study-always:accent-preference';

const DEFAULT_THEME: ThemePreference = 'dark';
const DEFAULT_ACCENT: AccentPreference = 'green';

const THEME_VALUES: ThemePreference[] = ['dark', 'light', 'bw'];
const ACCENT_VALUES: AccentPreference[] = ['green', 'blue', 'purple', 'orange'];

const isThemePreference = (value: unknown): value is ThemePreference => {
  return typeof value === 'string' && THEME_VALUES.includes(value as ThemePreference);
};

const isAccentPreference = (value: unknown): value is AccentPreference => {
  return typeof value === 'string' && ACCENT_VALUES.includes(value as AccentPreference);
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

export const applyThemePreferences = (theme: ThemePreference, accent: AccentPreference) => {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-accent', accent);
};

export const resolveThemePreferences = (profile?: { theme?: unknown; accentColor?: unknown } | null) => {
  const storedTheme = getStoredThemePreference();
  const storedAccent = getStoredAccentPreference();

  const theme = storedTheme || (isThemePreference(profile?.theme) ? profile.theme : DEFAULT_THEME);
  const accent = storedAccent || (isAccentPreference(profile?.accentColor) ? profile.accentColor : DEFAULT_ACCENT);

  if (!storedTheme) setStoredThemePreference(theme);
  if (!storedAccent) setStoredAccentPreference(accent);

  return { theme, accent };
};
