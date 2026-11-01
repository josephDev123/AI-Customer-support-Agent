/*
  Warnings:

  - A unique constraint covering the columns `[customerEmail,customerQuestion]` on the table `HumanEscalationTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HumanEscalationTicket_customerEmail_customerQuestion_key" ON "HumanEscalationTicket"("customerEmail", "customerQuestion");
