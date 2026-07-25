const PHONE_REGEX = /^\+?[0-9][0-9\s-]{5,17}$/;

export const isValidPhone = (value?: string | null): boolean => {
  const trimmed = (value || "").trim();
  return trimmed.length === 0 || PHONE_REGEX.test(trimmed);
};
