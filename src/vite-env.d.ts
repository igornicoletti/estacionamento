/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_ERP_CATALOG_MOCK_ENABLED?: string
  readonly VITE_OPERATIONAL_MOCK_ENABLED?: string
  readonly VITE_OPERATIONAL_CAPTURES_MOCK_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
