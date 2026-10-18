"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { db } from "@/lib/prisma";

const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

export async function verifySuperAdminPin(pin: string) {
  if (pin.trim() === ADMIN_PIN.trim()) {
    const cookieStore = await cookies();
    cookieStore.set("super_admin_session", "authenticated_super_admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    cookieStore.set("admin_session", "authenticated_admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return { success: true, isMaster: true };
  }
  return { success: false, error: "PIN Master incorreto. Tente novamente." };
}

export async function verifyCompanyPin(slug: string, pin: string) {
  // O PIN master sempre tem permissão de entrar para suporte
  if (pin.trim() === ADMIN_PIN.trim()) {
    const cookieStore = await cookies();
    cookieStore.set(`company_session_${slug}`, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return { success: true, isMaster: true };
  }

  const restaurant = await db.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    return { success: false, error: "Empresa não encontrada." };
  }

  if (!restaurant.isActive) {
    return {
      success: false,
      error: "Esta empresa está temporariamente suspensa. Contate o suporte.",
    };
  }

  if (restaurant.adminPin === pin.trim()) {
    const cookieStore = await cookies();
    cookieStore.set(`company_session_${restaurant.slug}`, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return { success: true, isMaster: false, companyId: restaurant.id };
  }

  return { success: false, error: "PIN incorreto. Tente novamente." };
}

export async function verifyAdminPin(pin: string, restaurantSlug?: string) {
  if (restaurantSlug) {
    return await verifyCompanyPin(restaurantSlug, pin);
  }

  return await verifySuperAdminPin(pin);
}

export async function logoutAdmin(restaurantSlug?: string) {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  cookieStore.delete("super_admin_session");
  if (restaurantSlug) {
    cookieStore.delete(`company_session_${restaurantSlug}`);
  }
  revalidatePath("/painel-secreto");
  revalidatePath("/super-admin");
  return { success: true };
}

export async function getAllRestaurants() {
  return await db.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          orders: true,
          products: true,
          waiterCalls: true,
        },
      },
    },
  });
}

export async function createCompany(data: {
  name: string;
  slug: string;
  description: string;
  avatarImageUrl?: string;
  adminPin?: string;
  plan?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");

  const existing = await db.restaurant.findUnique({
    where: { slug: cleanSlug },
  });

  if (existing) {
    return {
      success: false,
      error: "Já existe uma empresa cadastrada com esse slug/endereço.",
    };
  }

  const newCompany = await db.restaurant.create({
    data: {
      name: data.name.trim(),
      slug: cleanSlug,
      description: data.description.trim(),
      avatarImageUrl:
        data.avatarImageUrl?.trim() || "/burger-craft-logo.png",
      coverImageUrl:
        data.avatarImageUrl?.trim() || "/burger-craft-logo.png",
      adminPin: data.adminPin?.trim() || "1234",
      plan: data.plan || "PRO",
      contactPhone: data.contactPhone?.trim() || null,
      contactEmail: data.contactEmail?.trim() || null,
      isActive: true,
      menuCategories: {
        create: [
          { name: "Principais" },
          { name: "Bebidas" },
          { name: "Sobremesas" },
        ],
      },
    },
  });

  revalidatePath("/painel-secreto");
  return { success: true, company: newCompany };
}

export async function toggleCompanyStatus(
  restaurantId: string,
  isActive: boolean
) {
  await db.restaurant.update({
    where: { id: restaurantId },
    data: { isActive },
  });
  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function updateCompanyDetails(
  restaurantId: string,
  data: {
    name?: string;
    description?: string;
    adminPin?: string;
    plan?: string;
    contactPhone?: string;
    contactEmail?: string;
    avatarImageUrl?: string;
  }
) {
  await db.restaurant.update({
    where: { id: restaurantId },
    data,
  });
  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function deleteCompany(restaurantId: string) {
  const total = await db.restaurant.count();
  if (total <= 1) {
    return {
      success: false,
      error: "Você não pode excluir a única empresa ativa no sistema.",
    };
  }

  await db.restaurant.delete({
    where: { id: restaurantId },
  });

  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  await db.order.update({
    where: { id: orderId },
    data: { status },
  });
  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function deleteOrder(orderId: number) {
  await db.order.delete({
    where: { id: orderId },
  });
  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function updateWaiterCallStatus(
  callId: string,
  status: "PENDING" | "ATTENDED" | "CANCELLED"
) {
  await db.waiterCall.update({
    where: { id: callId },
    data: { status },
  });
  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function deleteWaiterCall(callId: string) {
  await db.waiterCall.delete({
    where: { id: callId },
  });
  revalidatePath("/painel-secreto");
  return { success: true };
}

export async function getVideoAnalytics(restaurantId?: string) {
  const restaurant = restaurantId
    ? await db.restaurant.findUnique({ where: { id: restaurantId } })
    : await db.restaurant.findFirst();

  if (!restaurant)
    return {
      summary: {
        totalWatchSeconds: 0,
        totalViewsCount: 0,
        overallAvg: 0,
        topProduct: null,
      },
      productMetrics: [],
      recentViews: [],
    };

  const [products, recentViews] = await Promise.all([
    db.product.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        videoViews: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.videoView.findMany({
      where: {
        product: {
          restaurantId: restaurant.id,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  let totalWatchSeconds = 0;
  let totalViewsCount = 0;

  const productMetrics = products
    .map((product) => {
      const views = product.videoViews;
      const count = views.length;
      const totalSeconds = views.reduce((acc, v) => acc + v.duration, 0);
      const avgSeconds =
        count > 0 ? Math.round((totalSeconds / count) * 10) / 10 : 0;

      totalWatchSeconds += totalSeconds;
      totalViewsCount += count;

      return {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        videoUrl: product.videoUrl,
        price: product.price,
        viewsCount: count,
        totalSeconds: Math.round(totalSeconds * 10) / 10,
        avgSeconds,
      };
    })
    .sort((a, b) => b.totalSeconds - a.totalSeconds);

  const topProduct = productMetrics.find((p) => p.totalSeconds > 0) || null;
  const overallAvg =
    totalViewsCount > 0
      ? Math.round((totalWatchSeconds / totalViewsCount) * 10) / 10
      : 0;

  return {
    summary: {
      totalWatchSeconds: Math.round(totalWatchSeconds * 10) / 10,
      totalViewsCount,
      overallAvg,
      topProduct,
    },
    productMetrics,
    recentViews,
  };
}

export async function getLatestAdminData(restaurantId?: string, isSuperAdmin = false) {
  const restaurant = restaurantId
    ? await db.restaurant.findUnique({ where: { id: restaurantId } })
    : await db.restaurant.findFirst();

  if (!restaurant)
    return { orders: [], waiterCalls: [], videoAnalytics: null, allRestaurants: [] };

  const [orders, waiterCalls, videoAnalytics, allRestaurants] =
    await Promise.all([
      db.order.findMany({
        where: { restaurantId: restaurant.id },
        include: {
          orderProducts: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.waiterCall.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      getVideoAnalytics(restaurant.id),
      isSuperAdmin ? getAllRestaurants() : Promise.resolve([]),
    ]);

  return { orders, waiterCalls, videoAnalytics, allRestaurants };
}

export async function getRestaurantDetails(restaurantId: string) {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menuCategories: {
        include: {
          products: true,
        },
      },
    },
  });

  if (!restaurant) return null;

  const products = restaurant.menuCategories.flatMap((c) => c.products);

  return {
    restaurant,
    categories: restaurant.menuCategories,
    products,
  };
}

interface UpsertProductInput {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  videoUrl?: string;
  ingredients: string[];
  menuCategoryId: string;
  restaurantId: string;
}

export async function upsertProduct(input: UpsertProductInput) {
  if (input.id) {
    await db.product.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl || null,
        ingredients: input.ingredients,
        menuCategoryId: input.menuCategoryId,
      },
    });
  } else {
    await db.product.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl || null,
        ingredients: input.ingredients,
        menuCategoryId: input.menuCategoryId,
        restaurantId: input.restaurantId,
      },
    });
  }
  revalidatePath("/painel-secreto");
  revalidatePath("/[slug]/menu", "page");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  await db.product.delete({
    where: { id: productId },
  });
  revalidatePath("/painel-secreto");
  revalidatePath("/[slug]/menu", "page");
  return { success: true };
}
