-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanEscalationTicket" (
    "id" UUID NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerQuestion" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" "EscalationStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "lastHumanResponseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HumanEscalationTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "HumanEscalationTicket_status_idx" ON "HumanEscalationTicket"("status");
CREATE INDEX "HumanEscalationTicket_customerEmail_idx" ON "HumanEscalationTicket"("customerEmail");
