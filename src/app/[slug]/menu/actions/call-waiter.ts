"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

interface CallWaiterInput {
  slug: string;
  tableNumber: string;
  reason?: string;
}

export async function callWaiter({
  slug,
  tableNumber,
  reason = "Atendimento na mesa",
}: CallWaiterInput) {
  if (!tableNumber || !tableNumber.trim()) {
    throw new Error("Número da mesa não informado.");
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    throw new Error("Restaurante não encontrado.");
  }

  const waiterCall = await db.waiterCall.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber: tableNumber.trim(),
      reason,
      status: "PENDING",
    },
  });

  revalidatePath(`/${slug}/menu`);
  revalidatePath("/painel-secreto");

  return { success: true, callId: waiterCall.id };
}
