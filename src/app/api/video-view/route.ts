import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, duration, tableNumber } = body;

    if (!productId || typeof duration !== "number" || duration < 0.5) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { restaurantId: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const safeDuration = Math.min(Math.round(duration * 10) / 10, 600);

    const view = await db.videoView.create({
      data: {
        productId,
        restaurantId: product.restaurantId,
        duration: safeDuration,
        tableNumber: tableNumber ? String(tableNumber).trim() : null,
      },
    });

    return NextResponse.json({ success: true, id: view.id });
  } catch (error) {
    console.error("Erro na API de video-view:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
