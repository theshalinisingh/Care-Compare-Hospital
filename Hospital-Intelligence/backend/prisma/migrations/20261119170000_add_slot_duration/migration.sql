-- AlterTable
ALTER TABLE "DoctorAvailability" ADD COLUMN     "slotDuration" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAvailability_doctorId_dayLabel_key" ON "DoctorAvailability"("doctorId", "dayLabel");

