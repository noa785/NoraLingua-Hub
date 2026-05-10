-- CreateEnum
CREATE TYPE "SpeakingBookingStatus" AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "SpeakingBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "status" "SpeakingBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpeakingBooking_userId_idx" ON "SpeakingBooking"("userId");

-- CreateIndex
CREATE INDEX "SpeakingBooking_sessionDate_idx" ON "SpeakingBooking"("sessionDate");

-- AddForeignKey
ALTER TABLE "SpeakingBooking" ADD CONSTRAINT "SpeakingBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
