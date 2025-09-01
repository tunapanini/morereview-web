-- CreateEnum
CREATE TYPE "public"."EmailFrequency" AS ENUM ('DAILY', 'WEEKLY', 'TWICE_WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."PreferenceLevel" AS ENUM ('DISLIKE', 'NEUTRAL', 'LIKE', 'LOVE');

-- CreateEnum
CREATE TYPE "public"."EmailEventType" AS ENUM ('DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'DROPPED', 'SPAM_REPORTED', 'UNSUBSCRIBED', 'GROUP_UNSUBSCRIBED', 'GROUP_RESUBSCRIBED');

-- CreateTable
CREATE TABLE "public"."email_subscribers" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "subscription_token" VARCHAR(255) NOT NULL,
    "unsubscribe_token" VARCHAR(255) NOT NULL,
    "subscription_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_email_sent_at" TIMESTAMPTZ(6),
    "email_frequency" "public"."EmailFrequency" NOT NULL DEFAULT 'DAILY',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "id" SERIAL NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "preference" "public"."PreferenceLevel" NOT NULL DEFAULT 'NEUTRAL',
    "is_explicit" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_events" (
    "id" SERIAL NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "message_id" VARCHAR(255) NOT NULL,
    "event_type" "public"."EmailEventType" NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "campaign_id" VARCHAR(255),
    "url" TEXT,
    "reason" TEXT,
    "response" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."personalization_logs" (
    "id" SERIAL NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "algorithm_version" VARCHAR(50) NOT NULL,
    "recommended_campaigns" JSONB NOT NULL,
    "personalization_score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "execution_time" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalization_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_email_key" ON "public"."email_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_subscription_token_key" ON "public"."email_subscribers"("subscription_token");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscribers_unsubscribe_token_key" ON "public"."email_subscribers"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "email_subscribers_email_idx" ON "public"."email_subscribers"("email");

-- CreateIndex
CREATE INDEX "email_subscribers_is_active_idx" ON "public"."email_subscribers"("is_active");

-- CreateIndex
CREATE INDEX "email_subscribers_subscription_date_idx" ON "public"."email_subscribers"("subscription_date");

-- CreateIndex
CREATE INDEX "user_preferences_subscriber_id_idx" ON "public"."user_preferences"("subscriber_id");

-- CreateIndex
CREATE INDEX "user_preferences_category_idx" ON "public"."user_preferences"("category");

-- CreateIndex
CREATE INDEX "user_preferences_preference_idx" ON "public"."user_preferences"("preference");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_subscriber_id_category_key" ON "public"."user_preferences"("subscriber_id", "category");

-- CreateIndex
CREATE INDEX "email_events_subscriber_id_idx" ON "public"."email_events"("subscriber_id");

-- CreateIndex
CREATE INDEX "email_events_event_type_idx" ON "public"."email_events"("event_type");

-- CreateIndex
CREATE INDEX "email_events_timestamp_idx" ON "public"."email_events"("timestamp");

-- CreateIndex
CREATE INDEX "email_events_message_id_idx" ON "public"."email_events"("message_id");

-- CreateIndex
CREATE INDEX "personalization_logs_subscriber_id_idx" ON "public"."personalization_logs"("subscriber_id");

-- CreateIndex
CREATE INDEX "personalization_logs_algorithm_version_idx" ON "public"."personalization_logs"("algorithm_version");

-- CreateIndex
CREATE INDEX "personalization_logs_created_at_idx" ON "public"."personalization_logs"("created_at");

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."email_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_events" ADD CONSTRAINT "email_events_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."email_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."personalization_logs" ADD CONSTRAINT "personalization_logs_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."email_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
