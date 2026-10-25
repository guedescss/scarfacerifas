-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "drawnAt" TIMESTAMP(3),
ADD COLUMN     "winnerUserId" TEXT;

-- CreateIndex
CREATE INDEX "Campaign_winnerUserId_idx" ON "Campaign"("winnerUserId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
