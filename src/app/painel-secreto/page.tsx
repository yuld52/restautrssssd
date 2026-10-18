import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import { getAllRestaurants, getVideoAnalytics } from "./actions";
import AdminDashboard from "./components/admin-dashboard";
import AdminLogin from "./components/admin-login";

export const dynamic = "force-dynamic";

const SecretAdminPage = async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "authenticated_admin") {
    return <AdminLogin />;
  }

  const allCompanies = await getAllRestaurants();
  const restaurant = allCompanies[0] || (await db.restaurant.findFirst());

  if (!restaurant) {
    return notFound();
  }

  const [categories, products, orders, waiterCalls, videoAnalytics] =
    await Promise.all([
      db.menuCategory.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: "asc" },
      }),
      db.product.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: "desc" },
      }),
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
    ]);

  return (
    <AdminDashboard
      restaurant={restaurant}
      categories={categories}
      products={products}
      orders={orders}
      waiterCalls={waiterCalls}
      initialVideoAnalytics={videoAnalytics}
      allCompanies={allCompanies}
    />
  );
};

export default SecretAdminPage;
