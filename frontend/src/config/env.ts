/**
 * Frontend environment — only VITE_* variables (safe for client bundle).
 * Never put secrets here; they are embedded in the build.
 */

const LOCALHOST_URL_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/;

function readEnv(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function assertProductionEnv() {
  if (!import.meta.env.PROD) return;
  if (!readEnv('VITE_API_URL')) {
    throw new Error('VITE_API_URL must be set in production builds.');
  }
}

function assertLocalDevUrls() {
  if (!import.meta.env.DEV) return;

  const apiUrl = readEnv('VITE_API_URL');
  if (apiUrl && !apiUrl.startsWith('/') && !LOCALHOST_URL_RE.test(apiUrl)) {
    throw new Error('VITE_API_URL must use localhost or a relative path in development.');
  }

  const wsUrl = readEnv('VITE_WS_URL');
  if (wsUrl && !LOCALHOST_URL_RE.test(wsUrl)) {
    throw new Error('VITE_WS_URL must point to localhost in development.');
  }
}

assertProductionEnv();
assertLocalDevUrls();

export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  apiUrl: readEnv('VITE_API_URL') ?? '/api/v1',
  wsUrl: readEnv('VITE_WS_URL') ?? '',
  enableWs: readEnv('VITE_ENABLE_WS') === 'true',
} as const;
