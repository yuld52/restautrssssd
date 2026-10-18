"use client";

import { Product, Restaurant } from "@prisma/client";
import { ChevronLeftIcon, ScrollTextIcon } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";

interface RestaurantHeaderProps {
  restaurant: Pick<Restaurant, "name" | "coverImageUrl">;
  products?: Array<Pick<Product, "id" | "name" | "price" | "imageUrl">>;
}

const RestaurantHeader = ({ restaurant, products = [] }: RestaurantHeaderProps) => {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleBackClick = () => router.back();
  const handleOrdersClick = () => router.push(`/${slug}/orders`);

  // Monta lista de slides com os produtos e foto de capa
  const slides =
    products.length > 0
      ? products.map((p) => ({
          id: p.id,
          imageUrl: p.imageUrl,
          name: p.name,
          price: p.price,
        }))
      : [
          {
            id: "cover",
            imageUrl: restaurant.coverImageUrl,
            name: restaurant.name,
            price: null,
          },
        ];

  // Alterna as fotos a cada 3 segundos exatos
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div className="relative h-[250px] w-full overflow-hidden bg-slate-900">
      {/* BOTÃO VOLTAR */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-4 top-4 z-50 rounded-full bg-white/80 backdrop-blur-md shadow-md hover:bg-white"
        onClick={handleBackClick}
      >
        <ChevronLeftIcon />
      </Button>

      {/* BOTÃO PEDIDOS */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-4 top-4 z-50 rounded-full bg-white/80 backdrop-blur-md shadow-md hover:bg-white"
        onClick={handleOrdersClick}
      >
        <ScrollTextIcon />
      </Button>

      {/* SLIDESHOW DE IMAGENS (TRANSIÇÃO SUAVE A CADA 3 SEGUNDOS) */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.name}
              fill
              priority={index === 0}
              className={`object-cover transition-transform duration-[3000ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
            />
          </div>
        );
      })}

      {/* GRADIENTE SUPERIOR E INFERIOR PARA LEGIBILIDADE */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

      {/* CARD FLUTUANTE COM NOME E PREÇO DO PRATO EM DESTAQUE */}
      {currentSlide.price !== null && (
        <div className="absolute bottom-6 left-4 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs text-white backdrop-blur-md shadow-lg">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-semibold line-clamp-1 max-w-[190px] sm:max-w-xs">
            {currentSlide.name}
          </span>
          <span className="font-extrabold text-amber-400 ml-1">
            {formatCurrency(currentSlide.price)}
          </span>
        </div>
      )}

      {/* INDICADORES DE PROGRESSO DO CARROSSEL (DOTS) */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-4 z-30 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md">
          {slides.slice(0, 7).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex % 7
                  ? "w-4 bg-amber-400"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
              title={`Foto ${idx + 1}`}
            />
          ))}
          {slides.length > 7 && (
            <span className="text-[9px] text-white/70 font-mono ml-0.5">
              +{slides.length - 7}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantHeader;