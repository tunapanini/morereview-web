-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" SERIAL NOT NULL,
    "source_site" VARCHAR(255) NOT NULL,
    "campaign_id" VARCHAR(255) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_image" TEXT,
    "detail_url" TEXT,
    "remaining_days" INTEGER,
    "applications_current" INTEGER DEFAULT 0,
    "applications_total" INTEGER DEFAULT 0,
    "reward_points" INTEGER DEFAULT 0,
    "category" VARCHAR(255),
    "location_type" VARCHAR(255),
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "raw_data_id" INTEGER,
    "extracted_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_hidden" BOOLEAN DEFAULT false,
    "is_invalid" BOOLEAN DEFAULT false,
    "deadline" TIMESTAMPTZ(6),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."extractor_versions" (
    "id" SERIAL NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "extraction_logic" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT false,

    CONSTRAINT "extractor_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."regions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "official_code" VARCHAR(10),
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sub_regions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_code" VARCHAR(10) NOT NULL,
    "official_code" VARCHAR(10),
    "region_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."region_sync_logs" (
    "id" SERIAL NOT NULL,
    "last_sync_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(10) NOT NULL,
    "error_message" TEXT,
    "total_regions" INTEGER NOT NULL DEFAULT 0,
    "total_sub_regions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "region_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."raw_crawl_data" (
    "id" SERIAL NOT NULL,
    "source_site" VARCHAR(255) NOT NULL,
    "source_url" TEXT NOT NULL,
    "raw_html" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_crawl_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_campaigns_category" ON "public"."campaigns"("category");

-- CreateIndex
CREATE INDEX "idx_campaigns_created_at" ON "public"."campaigns"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_campaigns_data_quality" ON "public"."campaigns"("is_hidden", "is_invalid");

-- CreateIndex
CREATE INDEX "idx_campaigns_deadline" ON "public"."campaigns"("deadline");

-- CreateIndex
CREATE INDEX "idx_campaigns_remaining_days" ON "public"."campaigns"("remaining_days");

-- CreateIndex
CREATE INDEX "idx_campaigns_source_site" ON "public"."campaigns"("source_site");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_source_site_campaign_id_key" ON "public"."campaigns"("source_site", "campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "extractor_versions_version_key" ON "public"."extractor_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "public"."regions"("code");

-- CreateIndex
CREATE INDEX "idx_regions_code" ON "public"."regions"("code");

-- CreateIndex
CREATE INDEX "idx_regions_name" ON "public"."regions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_regions_code_key" ON "public"."sub_regions"("code");

-- CreateIndex
CREATE INDEX "idx_sub_regions_code" ON "public"."sub_regions"("code");

-- CreateIndex
CREATE INDEX "idx_sub_regions_name" ON "public"."sub_regions"("name");

-- CreateIndex
CREATE INDEX "idx_sub_regions_parent_code" ON "public"."sub_regions"("parent_code");

-- CreateIndex
CREATE INDEX "idx_sub_regions_region_id" ON "public"."sub_regions"("region_id");

-- CreateIndex
CREATE INDEX "idx_region_sync_logs_last_sync_at" ON "public"."region_sync_logs"("last_sync_at");

-- CreateIndex
CREATE INDEX "idx_region_sync_logs_status" ON "public"."region_sync_logs"("status");

-- CreateIndex
CREATE INDEX "idx_raw_crawl_data_created_at" ON "public"."raw_crawl_data"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_raw_crawl_data_source_site" ON "public"."raw_crawl_data"("source_site");

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_raw_data_id_fkey" FOREIGN KEY ("raw_data_id") REFERENCES "public"."raw_crawl_data"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sub_regions" ADD CONSTRAINT "fk_sub_regions_parent_code" FOREIGN KEY ("parent_code") REFERENCES "public"."regions"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sub_regions" ADD CONSTRAINT "fk_sub_regions_region_id" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

