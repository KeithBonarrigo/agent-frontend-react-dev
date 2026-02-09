/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MODE: 'local' | 'dev' | 'staging' | 'production';
  readonly VITE_FB_APP_ID: string;
  readonly VITE_WA_CONFIG_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
