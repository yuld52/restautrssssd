import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import RestaurantCategories from "./components/categories";
import RestaurantHeader from "./components/header";

interface RestaurantMenuPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ consumptionMethod: string; mesa?: string; table?: string }>;
}

const isConsumptionMethodValid = (consumptionMethod: string) => {
  return ["DINE_IN", "TAKEAWAY"].includes(consumptionMethod?.toUpperCase());
};

const RestaurantMenuPage = async ({
  params,
  searchParams,
}: RestaurantMenuPageProps) => {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const { consumptionMethod } = resolvedSearchParams;
  const mesa = resolvedSearchParams.mesa || resolvedSearchParams.table;

  if (!isConsumptionMethodValid(consumptionMethod)) {
    return notFound();
  }

  let restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      menuCategories: {
        include: { products: true },
      },
    },
  });

  if (!restaurant) {
    restaurant = await db.restaurant.findFirst({
      include: {
        menuCategories: {
          include: { products: true },
        },
      },
    });
  }

  if (!restaurant) {
    return notFound();
  }

  const allProducts = restaurant.menuCategories.flatMap((cat) => cat.products);

  return (
    // Container principal trava a tela
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <RestaurantHeader restaurant={restaurant} products={allProducts} />
      <RestaurantCategories restaurant={restaurant} mesa={mesa} />
    </div>
  );
};

export default RestaurantMenuPage;