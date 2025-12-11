-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Account (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  userId text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT Account_pkey PRIMARY KEY (id),
  CONSTRAINT Account_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.Build (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  repositoryId text NOT NULL,
  branch text,
  tag text,
  commit text NOT NULL,
  imageName text NOT NULL,
  imageTag text NOT NULL,
  status text NOT NULL,
  output text NOT NULL DEFAULT ''::text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt timestamp without time zone,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Build_pkey PRIMARY KEY (id),
  CONSTRAINT Build_repositoryId_fkey FOREIGN KEY (repositoryId) REFERENCES public.Repository(id)
);
CREATE TABLE public.GitProviderToken (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  userId text NOT NULL,
  provider text NOT NULL,
  accessToken text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT GitProviderToken_pkey PRIMARY KEY (id)
);
CREATE TABLE public.OAuthProvider (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  provider text NOT NULL UNIQUE,
  clientId text NOT NULL,
  clientSecret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  callbackUrl text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT OAuthProvider_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Repository (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  provider text NOT NULL,
  name text NOT NULL,
  fullName text NOT NULL,
  defaultBranch text NOT NULL,
  dockerfilePath text NOT NULL DEFAULT 'Dockerfile'::text,
  repositoryUrl text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Repository_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Session (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  sessionToken text NOT NULL UNIQUE,
  userId text NOT NULL,
  expires timestamp without time zone NOT NULL,
  CONSTRAINT Session_pkey PRIMARY KEY (id),
  CONSTRAINT Session_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.User (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text,
  email text UNIQUE,
  emailVerified timestamp without time zone,
  image text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.VerificationToken (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamp without time zone NOT NULL
);
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  image text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);