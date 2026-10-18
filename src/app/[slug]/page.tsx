import Image from "next/image";
import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import ConsumptionMethodOption from "./components/consumption-method-option";

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mesa?: string; table?: string }>;
}

const RestaurantPage = async ({ params, searchParams }: RestaurantPageProps) => {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const mesa = resolvedSearchParams?.mesa || resolvedSearchParams?.table;

  let restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    restaurant = await db.restaurant.findFirst();
  }
  if (!restaurant) {
    return notFound();
  }
  return (
    <div className="flex h-screen flex-col items-center justify-center px-6">
      {/* LOGO E TITULO */}
      <div className="flex flex-col items-center gap-2">
        <Image
          src={restaurant.avatarImageUrl}
          alt={restaurant.name}
          width={82}
          height={82}
        />
        <h2 className="font-semibold text-lg">{restaurant.name}</h2>
      </div>

      {/* MESA IDENTIFICADA */}
      {mesa && (
        <div className="mt-4 flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-semibold text-green-700 shadow-sm animate-pulse">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          <span>Mesa {mesa}</span>
        </div>
      )}

      {/* BEM VINDO */}
      <div className="space-y-2 pt-16 text-center">
        <h3 className="text-2xl font-semibold">Seja bem-vindo!</h3>
        <p className="opacity-55 text-sm">
          {mesa
            ? `Você está na Mesa ${mesa}. Faça seu pedido pelo celular e entregamos diretamente para você!`
            : "Escolha como prefere aproveitar sua refeição. Estamos aqui para oferecer praticidade e sabor em cada detalhe!"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-10 w-full max-w-sm">
        <ConsumptionMethodOption
          slug={slug}
          option="DINE_IN"
          buttonText={mesa ? `Comer na Mesa ${mesa}` : "Para comer aqui"}
          imageAlt="Comer aqui"
          imageUrl="/dine_in.png"
          mesa={mesa}
        />
        <ConsumptionMethodOption
          slug={slug}
          option="TAKEAWAY"
          buttonText="Para levar"
          imageAlt="Para levar"
          imageUrl="/takeaway.png"
          mesa={mesa}
        />
      </div>
    </div>
  );
};

export default RestaurantPage;