"use client";

import { Prisma } from "@prisma/client";
import { ClockIcon, FilmIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/helpers/format-currency";

import { CartContext } from "../contexts/cart";
import CallWaiterDialog from "./call-waiter-dialog";
import CartSheet from "./cart-sheet";
import FoodReelsModal from "./food-reels-modal";
import Products from "./products";

interface RestaurantCategoriesProps {
  restaurant: Prisma.RestaurantGetPayload<{
    include: {
      menuCategories: {
        include: { products: true };
      };
    };
  }>;
  mesa?: string;
}

type MenuCategoriesWithProducts = Prisma.MenuCategoryGetPayload<{
  include: { products: true };
}>;

const RestaurantCategories = ({
  restaurant,
  mesa,
}: RestaurantCategoriesProps) => {
  const [selectedCategory, setSelectedCategory] =
    useState<MenuCategoriesWithProducts>(restaurant.menuCategories[0]);
  const [isReelsOpen, setIsReelsOpen] = useState(false);

  const { products, total, toggleCart, totalQuantity } =
    useContext(CartContext);

  const allProducts = restaurant.menuCategories.flatMap((c) => c.products);

  const handleCategoryClick = (category: MenuCategoriesWithProducts) => {
    setSelectedCategory(category);
  };

  const getCategoryButtonVariant = (category: MenuCategoriesWithProducts) => {
    return selectedCategory.id === category.id ? "default" : "secondary";
  };

  return (
    <div className="relative z-50 mt-[-1.5rem] flex flex-1 flex-col overflow-hidden rounded-t-3xl bg-white">
      
      {/* 1. CABEÇALHO DO CARD (Fixo: Não rola) */}
      <div className="flex-none p-4 pb-0 space-y-3">
        {/* Linha 1: Avatar, Nome, Descrição e Mesa/Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src={restaurant.avatarImageUrl}
              alt={restaurant.name}
              height={46}
              width={46}
              className="rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate leading-tight">
                {restaurant.name}
              </h2>
              <p className="text-xs opacity-60 truncate">
                {restaurant.description}
              </p>
            </div>
          </div>

          {mesa ? (
            <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700 shrink-0 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Mesa {mesa}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-green-600 font-semibold shrink-0">
              <ClockIcon size={12} />
              <p>Aberto!</p>
            </div>
          )}
        </div>

        {/* Linha 2: BARRA DE AÇÕES MOBILE-FIRST (Touch targets grandes para o polegar) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <CallWaiterDialog mesa={mesa} />

          <Button
            onClick={() => setIsReelsOpen(true)}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white font-bold text-xs shadow-sm hover:opacity-95 gap-2 transition-all active:scale-[0.98]"
          >
            <FilmIcon className="h-4 w-4 animate-pulse" />
            <span>Vídeos dos Pratos 🔥</span>
          </Button>
        </div>
      </div>

      {/* 2. BOTÕES DE CATEGORIAS (Fixo verticalmente, scroll apenas lateral) */}
      <div className="flex-none mt-2">
        <ScrollArea className="w-full">
          <div className="flex w-max space-x-3 p-4 pt-2">
            <Button
              onClick={() => setIsReelsOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-full border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 gap-1"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-red-500" />
              <span>Ver em Vídeo</span>
            </Button>

            {restaurant.menuCategories.map((category) => (
              <Button
                onClick={() => handleCategoryClick(category)}
                key={category.id}
                variant={getCategoryButtonVariant(category)}
                size="sm"
                className="rounded-full font-medium"
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <h3 className="px-5 pt-2 font-semibold">{selectedCategory.name}</h3>
      </div>

      {/* 3. ÁREA DOS PRODUTOS (Scroll Vertical travado apenas aqui) */}
      <div className="flex-1 overflow-hidden mt-2">
        <ScrollArea className="h-full w-full overscroll-contain">
          <div className={`px-1 ${products.length > 0 ? "pb-32" : "pb-6"}`}>
            <Products products={selectedCategory.products} />
          </div>
        </ScrollArea>
      </div>

      {/* 4. RODAPÉ DA SACOLA (Fixo embaixo de tudo) */}
      {products.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] flex w-full items-center justify-between border-t bg-white px-5 py-4 shadow-[0_-4px_15px_rgba(0,0,0,0.1)]">
          <div>
            <p className="text-xs text-muted-foreground">Total dos pedidos</p>
            <p className="text-sm font-semibold">
              {formatCurrency(total)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}/ {totalQuantity} {totalQuantity > 1 ? "itens" : "item"}
              </span>
            </p>
          </div>
          <Button onClick={toggleCart} className="rounded-full px-6">
            Ver sacola
          </Button>
          <CartSheet />
        </div>
      )}

      {/* MODAL / FEED VERTICAL DE REELS (VÍDEOS DOS PRATOS) */}
      <FoodReelsModal
        products={allProducts}
        isOpen={isReelsOpen}
        onClose={() => setIsReelsOpen(false)}
        mesa={mesa}
      />
    </div>
  );
};

export default RestaurantCategories;