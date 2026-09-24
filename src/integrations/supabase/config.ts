/**
 * Supabase clients expect the project root (https://<ref>.supabase.co), not a
 * REST/Auth/Storage endpoint. Normalize common dashboard-copy mistakes so one
 * bad deployment variable cannot produce paths such as /rest/v1/auth/v1.
 */
export function normalizeSupabaseUrl(value: string): string {
  return value
    .trim()
    .replace(/\/(?:rest|auth|storage)\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}
