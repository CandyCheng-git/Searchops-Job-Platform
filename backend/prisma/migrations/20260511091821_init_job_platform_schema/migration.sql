-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('SOFTWARE_ENGINEERING', 'DATA_ANALYTICS', 'CLOUD_DEVOPS', 'PRODUCT', 'DESIGN', 'CYBERSECURITY');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('JOB_VIEW', 'APPLY_CLICK', 'SEARCH_PERFORMED', 'FILTER_USED');

-- CreateEnum
CREATE TYPE "ExperimentVariant" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "category" "JobCategory" NOT NULL,
    "workMode" "WorkMode" NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "datePosted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validThrough" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "jobId" TEXT,
    "variant" "ExperimentVariant",
    "searchTerm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "experimentKey" TEXT NOT NULL,
    "variant" "ExperimentVariant" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_location_idx" ON "Job"("location");

-- CreateIndex
CREATE INDEX "Job_category_idx" ON "Job"("category");

-- CreateIndex
CREATE INDEX "Job_workMode_idx" ON "Job"("workMode");

-- CreateIndex
CREATE INDEX "Job_employmentType_idx" ON "Job"("employmentType");

-- CreateIndex
CREATE INDEX "Job_datePosted_idx" ON "Job"("datePosted");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_jobId_idx" ON "Event"("jobId");

-- CreateIndex
CREATE INDEX "Event_searchTerm_idx" ON "Event"("searchTerm");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentKey_idx" ON "ExperimentAssignment"("experimentKey");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_variant_idx" ON "ExperimentAssignment"("variant");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_anonymousUserId_experimentKey_key" ON "ExperimentAssignment"("anonymousUserId", "experimentKey");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
