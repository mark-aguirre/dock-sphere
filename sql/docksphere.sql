-- Recommended, executable schema (non-destructive)
-- Enable pgcrypto extension for gen_random_uuid() if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE,
  name text,
  image text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.repositories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  default_branch text NOT NULL,
  dockerfile_path text NOT NULL DEFAULT 'Dockerfile',
  repository_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT repositories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.builds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL,
  branch text,
  tag text,
  commit text NOT NULL,
  image_name text NOT NULL,
  image_tag text NOT NULL,
  status text NOT NULL,
  output text NOT NULL DEFAULT ''::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT builds_pkey PRIMARY KEY (id),
  CONSTRAINT builds_repository_id_fkey FOREIGN KEY (repository_id) REFERENCES public.repositories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.git_provider_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT git_provider_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT git_provider_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.oauth_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  callback_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT oauth_providers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  expires timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamptz NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token)
);


-- Sample user data - modify values as needed
INSERT INTO "public"."users" (
  "email", 
  "name",
  "image",
  "is_active",
  "created_at",
  "updated_at",
  "last_login"
) VALUES ( 
  'YOUR_ADMIN_EMAIL_here',            -- Email address
  'YOUR_NAME',                                   -- Display name
  null,                                     -- Profile image URL
  'true',                                   -- Active status
  '2025-12-13 01:11:09+00',               -- Created timestamp
  '2025-12-13 01:11:17+00',               -- Updated timestamp
  '2025-12-13 01:11:35+00'                -- Last login timestamp
);
