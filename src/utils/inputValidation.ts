export const MAX_PROFILE_NAME_LENGTH = 200;
export const MAX_PROFILE_URL_LENGTH = 2000;
export const MAX_TARGET_EXAM_LENGTH = 80;
export const MAX_ERROR_CONTENT_LENGTH = 5000;
export const MAX_CALENDAR_TITLE_LENGTH = 200;
export const MAX_CALENDAR_NOTES_LENGTH = 1000;

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getOptionalUrlError(value: string): string | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  if (trimmedValue.length > MAX_PROFILE_URL_LENGTH) {
    return `O link deve ter no máximo ${MAX_PROFILE_URL_LENGTH} caracteres.`;
  }

  if (!isValidHttpUrl(trimmedValue)) {
    return 'Informe uma URL válida começando com http:// ou https://';
  }

  return undefined;
}
