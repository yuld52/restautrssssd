import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import { getVideoAnalytics } from "../../painel-secreto/actions";
import AdminDashboard from "../../painel-secreto/components/admin-dashboard";
import AdminLogin from "../../painel-secreto/components/admin-login";

export const dynamic = "force-dynamic";

interface CompanyAdminPageProps {
  params: Promise<{ slug: string }>;
}

const CompanyAdminPage = async ({ params }: CompanyAdminPageProps) => {
  const { slug } = await params;

  let restaurant = await db.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    restaurant = await db.restaurant.findFirst();
  }

  if (!restaurant) {
    return notFound();
  }

  if (!restaurant.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md rounded-3xl bg-white border border-slate-200 p-8 shadow-xl">
          <h1 className="text-xl font-bold text-red-600 mb-2">Conta Temporariamente Suspensa</h1>
          <p className="text-xs text-slate-500">
            O acesso administrativo para <strong>{restaurant.name}</strong> está inativo no momento.
            Entre em contato com o suporte ou renove sua assinatura para reativar.
          </p>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const session =
    cookieStore.get("admin_session") ||
    cookieStore.get("super_admin_session") ||
    cookieStore.get(`company_session_${restaurant.slug}`);

  if (!session) {
    return (
      <AdminLogin
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        isSuperAdmin={false}
      />
    );
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
      allCompanies={[restaurant]}
      isSuperAdmin={false}
      defaultTab="orders"
    />
  );
};

export default CompanyAdminPage;
