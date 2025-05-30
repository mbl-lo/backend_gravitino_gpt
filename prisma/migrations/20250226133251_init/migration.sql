-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "data";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "users";

-- CreateEnum
CREATE TYPE "data"."MessageRole" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "data"."MessageType" AS ENUM ('TEXT', 'FILE', 'PHOTO', 'VIDEO', 'VOICE', 'AUDIO');

-- CreateTable
CREATE TABLE "users"."User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"."Auth" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."Chat" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."Message" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "role" "data"."MessageRole" NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentVersionId" UUID,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data"."MessageVersion" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "type" "data"."MessageType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auth_email_key" ON "users"."Auth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_userId_key" ON "users"."Auth"("userId");

-- AddForeignKey
ALTER TABLE "users"."Auth" ADD CONSTRAINT "Auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "data"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."Message" ADD CONSTRAINT "Message_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "data"."MessageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data"."MessageVersion" ADD CONSTRAINT "MessageVersion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "data"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
