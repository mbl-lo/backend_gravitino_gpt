export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function safeParseNumber(
  value: string | undefined,
  fallback = 0,
): number {
  const parsed = parseFloat(value ?? '');
  return isNaN(parsed) ? fallback : parsed;
}

export function generateRandomString(length = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }
  return result;
}
