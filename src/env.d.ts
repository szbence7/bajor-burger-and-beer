/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public origin, e.g. https://bajorburgerandbeer.hu (no trailing slash needed). */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
