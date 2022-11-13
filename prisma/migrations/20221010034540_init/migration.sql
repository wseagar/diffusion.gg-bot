-- CreateTable
CREATE TABLE "discord_servers" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discord_id" TEXT NOT NULL,
    "discord_name" TEXT NOT NULL,
    "nsfw_filter" BOOLEAN DEFAULT true,
    "blocked" BOOLEAN DEFAULT false,
    "blocked_reason" TEXT,
    "server_credits" DECIMAL NOT NULL DEFAULT 0,

    CONSTRAINT "discord_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_users" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discord_id" TEXT NOT NULL,
    "discord_name" TEXT NOT NULL,
    "is_subscriber" BOOLEAN NOT NULL DEFAULT false,
    "user_credits" DECIMAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "first_message_sent" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" TEXT,
    "free_credits_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "images_generated" DECIMAL NOT NULL DEFAULT 0,

    CONSTRAINT "discord_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" UUID NOT NULL,
    "job_id" UUID,
    "uri" TEXT,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "running" BOOLEAN NOT NULL DEFAULT false,
    "args" JSONB,
    "logs" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "prio" DECIMAL NOT NULL DEFAULT 0,
    "discord_message_id" TEXT,
    "results" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "index_discord_users_on_discord_id" ON "discord_users"("discord_id");

-- CreateIndex
CREATE INDEX "index_images_on_job_id" ON "images"("job_id");

-- CreateIndex
CREATE INDEX "index_jobs_on_running" ON "jobs"("running");