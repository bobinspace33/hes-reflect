import { sql } from "@vercel/postgres";

export { sql };

export const SCHEMA_SQL = /* sql */ `
  CREATE TABLE IF NOT EXISTS documents (
    id            TEXT PRIMARY KEY,
    slug          TEXT UNIQUE NOT NULL,
    title         TEXT NOT NULL,
    pdf_url       TEXT NOT NULL,
    page_count    INT  NOT NULL DEFAULT 1,
    page_texts    JSONB NOT NULL DEFAULT '[]'::jsonb,
    "order"       INT NOT NULL DEFAULT 0,
    visible       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS themes (
    id                   TEXT PRIMARY KEY,
    label                TEXT NOT NULL,
    color                TEXT NOT NULL,
    "order"              INT NOT NULL DEFAULT 0,
    personal_reflection  TEXT NOT NULL DEFAULT '',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS theme_sources (
    id            TEXT PRIMARY KEY,
    theme_id      TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    document_id   TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number   INT NOT NULL,
    quote         TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS theme_sources_theme_idx ON theme_sources(theme_id);

  CREATE TABLE IF NOT EXISTS reflections (
    id          TEXT PRIMARY KEY,
    theme_id    TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    name        TEXT,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS reflections_theme_idx ON reflections(theme_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS analysis_runs (
    id          TEXT PRIMARY KEY,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status      TEXT NOT NULL DEFAULT 'running',
    error       TEXT
  );
`;
