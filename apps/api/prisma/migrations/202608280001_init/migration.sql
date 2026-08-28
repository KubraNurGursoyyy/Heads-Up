-- CreateEnum
CREATE TYPE "Category" AS ENUM ('GAME', 'BOOK', 'MOVIE_TV', 'TECHNOLOGY', 'GENERAL');
CREATE TYPE "NotificationMode" AS ENUM ('IMPORTANT_ONLY', 'ALL_RELEVANT', 'SELECTED_EVENTS', 'OFF');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "deviceName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Watch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "aliases" JSONB NOT NULL,
    "searchQueries" JSONB NOT NULL,
    "notifyEvents" JSONB NOT NULL,
    "notificationMode" "NotificationMode" NOT NULL DEFAULT 'IMPORTANT_ONLY',
    "importanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.72,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Watch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceName" TEXT,
    "sourceType" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WatchArticle" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "importanceScore" DOUBLE PRECISION NOT NULL,
    "isNewInformation" BOOLEAN NOT NULL,
    "eventType" TEXT,
    "eventKey" TEXT,
    "summary" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchArticle_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE UNIQUE INDEX "Device_expoPushToken_key" ON "Device"("expoPushToken");
CREATE INDEX "Device_userId_idx" ON "Device"("userId");
CREATE INDEX "Watch_userId_active_idx" ON "Watch"("userId", "active");
CREATE UNIQUE INDEX "Article_canonicalUrl_key" ON "Article"("canonicalUrl");
CREATE UNIQUE INDEX "Article_fingerprint_key" ON "Article"("fingerprint");
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");
CREATE UNIQUE INDEX "WatchArticle_watchId_articleId_key" ON "WatchArticle"("watchId", "articleId");
CREATE INDEX "WatchArticle_watchId_createdAt_idx" ON "WatchArticle"("watchId", "createdAt");
CREATE INDEX "WatchArticle_watchId_eventKey_idx" ON "WatchArticle"("watchId", "eventKey");
CREATE UNIQUE INDEX "Notification_watchId_articleId_key" ON "Notification"("watchId", "articleId");
CREATE UNIQUE INDEX "Notification_watchId_eventKey_key" ON "Notification"("watchId", "eventKey");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- Foreign Keys
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchArticle" ADD CONSTRAINT "WatchArticle_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "Watch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchArticle" ADD CONSTRAINT "WatchArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "Watch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
