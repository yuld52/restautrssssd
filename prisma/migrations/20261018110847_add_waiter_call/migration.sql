-- CreateEnum
CREATE TYPE "WaiterCallStatus" AS ENUM ('PENDING', 'ATTENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WaiterCall" (
    "id" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'Atendimento na mesa',
    "status" "WaiterCallStatus" NOT NULL DEFAULT 'PENDING',
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaiterCall_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WaiterCall" ADD CONSTRAINT "WaiterCall_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
