CREATE TABLE IF NOT EXISTS discord_servers (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    discord_id TEXT NOT NULL,
    discord_name TEXT NOT NULL,
    nsfw_filter boolean default true,
    blocked boolean default false,
    blocked_reason text,
    server_credits numeric NOT NULL DEFAULT 0
);

ALTER TABLE discord_servers ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
ALTER TABLE discord_servers ADD COLUMN IF NOT EXISTS blocked_reason text;
ALTER TABLE discord_servers ADD COLUMN IF NOT EXISTS server_credits numeric NOT NULL DEFAULT 0;


CREATE TABLE IF NOT EXISTS discord_users (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    discord_id TEXT NOT NULL,
    discord_name TEXT NOT NULL,
    is_subscriber BOOLEAN NOT NULL DEFAULT FALSE,
    user_credits numeric NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    first_message_sent BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id TEXT,
    free_credits_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    images_generated numeric NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS index_discord_users_on_discord_id ON discord_users (discord_id);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  running BOOLEAN NOT NULL DEFAULT FALSE,
  args JSONB,
  logs TEXT,
  done boolean NOT NULL DEFAULT FALSE,
  prio numeric NOT NULL DEFAULT 0,
  discord_message_id TEXT,
  -- migration #1
  results JSONB,
  -- migration #2
  is_deleted boolean NOT NULL DEFAULT FALSE
);

-- migration #1
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS results JSONB;
-- migration #2
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS index_jobs_on_running ON jobs (running);

CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY,
    job_id UUID,
    uri TEXT,
    nsfw BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS index_images_on_job_id ON images (job_id);
