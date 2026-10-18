import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import OrderList from "./components/order-list";

interface OrdersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    cpf?: string;
    orderId?: string;
    mesa?: string;
    table?: string;
  }>;
}

const OrdersPage = async ({ params, searchParams }: OrdersPageProps) => {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const { cpf, orderId } = resolvedSearchParams;
  const mesa = resolvedSearchParams.mesa || resolvedSearchParams.table;

  let restaurant = await db.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    restaurant = await db.restaurant.findFirst();
  }

  if (!restaurant) {
    return notFound();
  }

  // Define critério de busca flexível (por ID do pedido, por mesa, por CPF ou pedidos recentes)
  let whereClause: Record<string, unknown> = {
    restaurantId: restaurant.id,
  };

  if (orderId) {
    whereClause = {
      ...whereClause,
      id: Number(orderId),
    };
  } else if (mesa) {
    whereClause = {
      ...whereClause,
      tableNumber: mesa,
    };
  } else if (cpf) {
    whereClause = {
      ...whereClause,
      customerCpf: cpf.replace(/\D/g, ""),
    };
  }

  const orders = await db.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: whereClause,
    take: 20,
    include: {
      restaurant: {
        select: {
          name: true,
          avatarImageUrl: true,
        },
      },
      orderProducts: {
        include: {
          product: true,
        },
      },
    },
  });

  return <OrderList orders={orders} />;
};

export default OrdersPage;