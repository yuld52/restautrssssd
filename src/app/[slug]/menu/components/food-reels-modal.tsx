"use client";

import { Product } from "@prisma/client";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  ShoppingBagIcon,
  TimerIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";

import { CartContext } from "../contexts/cart";

interface FoodReelsModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  mesa?: string;
}

const FoodReelsModal = ({
  products,
  isOpen,
  onClose,
  mesa,
}: FoodReelsModalProps) => {
  const { addProduct, totalQuantity, toggleCart } = useContext(CartContext);
  const [isMuted, setIsMuted] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({});
  const [activeWatchSeconds, setActiveWatchSeconds] = useState(0);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rastreamento preciso de tempo assistido
  const currentSessionStartRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const activeProductRef = useRef<Product | null>(null);

  // Filtra produtos que tenham vídeo ou fallback para produtos disponíveis
  const reelProducts = products.filter((p) => p.videoUrl) || products;

  // Envia métrica para a API de analytics
  const sendWatchMetric = useCallback(
    (product: Product, duration: number) => {
      if (!product || duration < 0.5) return;
      const safeDuration = Math.min(Math.round(duration * 10) / 10, 600);

      try {
        fetch("/api/video-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            duration: safeDuration,
            tableNumber: mesa || null,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Silencioso
      }
    },
    [mesa]
  );

  // Finaliza a sessão do vídeo atual e envia os segundos assistidos
  const flushCurrentWatchSession = useCallback(() => {
    if (!activeProductRef.current) return;

    let totalDuration = accumulatedTimeRef.current;
    if (currentSessionStartRef.current !== null) {
      totalDuration += (performance.now() - currentSessionStartRef.current) / 1000;
    }

    if (totalDuration >= 0.5) {
      sendWatchMetric(activeProductRef.current, totalDuration);
    }

    accumulatedTimeRef.current = 0;
    currentSessionStartRef.current = null;
    setActiveWatchSeconds(0);
  }, [sendWatchMetric]);

  // Atualiza produto ativo e inicia cronômetro
  useEffect(() => {
    if (!isOpen || reelProducts.length === 0) {
      flushCurrentWatchSession();
      activeProductRef.current = null;
      return;
    }

    // Se mudou de produto ou acabou de abrir
    const newProduct = reelProducts[activeIdx];
    if (activeProductRef.current?.id !== newProduct?.id) {
      flushCurrentWatchSession();
      activeProductRef.current = newProduct;
      accumulatedTimeRef.current = 0;
      currentSessionStartRef.current = performance.now();
      setActiveWatchSeconds(0);
    }
  }, [activeIdx, isOpen, reelProducts, flushCurrentWatchSession]);

  // Contador em tempo real na tela para o usuário ver o tempo assistido
  useEffect(() => {
    if (!isOpen) return;

    const ticker = setInterval(() => {
      let currentTotal = accumulatedTimeRef.current;
      if (currentSessionStartRef.current !== null) {
        currentTotal += (performance.now() - currentSessionStartRef.current) / 1000;
      }
      setActiveWatchSeconds(Math.floor(currentTotal));
    }, 1000);

    return () => clearInterval(ticker);
  }, [isOpen]);

  // Garante envio ao fechar a janela ou navegar
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushCurrentWatchSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushCurrentWatchSession();
    };
  }, [flushCurrentWatchSession]);

  // Gerencia reprodução automática do vídeo ativo
  useEffect(() => {
    if (!isOpen) {
      videoRefs.current.forEach((v) => v?.pause());
      return;
    }

    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIdx) {
        video.currentTime = 0;
        video.play().catch(() => {
          // Autoplay com som bloqueado pelo navegador
        });
      } else {
        video.pause();
      }
    });
  }, [activeIdx, isOpen]);

  // Observer de scroll snap
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    if (itemHeight === 0) return;
    const currentIndex = Math.round(scrollPos / itemHeight);
    if (
      currentIndex !== activeIdx &&
      currentIndex >= 0 &&
      currentIndex < reelProducts.length
    ) {
      setActiveIdx(currentIndex);
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
    });
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    toast.success(`${product.name} adicionado à sacola!`);
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleNext = () => {
    if (activeIdx < reelProducts.length - 1 && containerRef.current) {
      containerRef.current.scrollTo({
        top: (activeIdx + 1) * containerRef.current.clientHeight,
        behavior: "smooth",
      });
    }
  };

  const handlePrev = () => {
    if (activeIdx > 0 && containerRef.current) {
      containerRef.current.scrollTo({
        top: (activeIdx - 1) * containerRef.current.clientHeight,
        behavior: "smooth",
      });
    }
  };

  const togglePlayPause = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
      currentSessionStartRef.current = performance.now();
    } else {
      video.pause();
      if (currentSessionStartRef.current !== null) {
        accumulatedTimeRef.current +=
          (performance.now() - currentSessionStartRef.current) / 1000;
        currentSessionStartRef.current = null;
      }
    }
  };

  const handleClose = () => {
    flushCurrentWatchSession();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      {/* BARRA SUPERIOR FIXA */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
        >
          <XIcon className="h-5 w-5" />
        </Button>

        {/* PILL CENTRAL COM CRONÔMETRO DE RETENÇÃO DO VÍDEO */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>Cardápio em Vídeo</span>
          {activeWatchSeconds > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono font-bold border-l border-white/20 pl-2">
              <TimerIcon className="h-3 w-3" />
              {activeWatchSeconds}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted((prev) => !prev)}
            className="h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
          >
            {isMuted ? (
              <VolumeXIcon className="h-5 w-5" />
            ) : (
              <Volume2Icon className="h-5 w-5 text-green-400" />
            )}
          </Button>

          {totalQuantity > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                handleClose();
                toggleCart();
              }}
              className="relative rounded-full bg-primary font-bold shadow-lg"
            >
              <ShoppingBagIcon className="mr-1 h-4 w-4" />
              <span>{totalQuantity}</span>
            </Button>
          )}
        </div>
      </div>

      {/* CONTAINER VERTICAL DE REELS (SNAP SCROLL) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll scrollbar-none"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {reelProducts.map((product, index) => {
          const isAdded = !!addedIds[product.id];
          return (
            <div
              key={product.id}
              className="relative flex h-[100dvh] w-full snap-start snap-always items-end justify-center overflow-hidden"
              onClick={() => togglePlayPause(index)}
            >
              {/* VIDEO BACKGROUND */}
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={product.videoUrl || "/videos/burger-video.webm"}
                loop
                muted={isMuted}
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* OVERLAY ESCURO PARA LEGIBILIDADE */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20" />

              {/* CONTROLES LATERAIS DE NAVEGAÇÃO RÁPIDA (UP / DOWN) */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  disabled={index === 0}
                  className="h-9 w-9 rounded-full bg-black/40 text-white backdrop-blur-md disabled:opacity-30"
                >
                  <ChevronUpIcon className="h-5 w-5" />
                </Button>
                <div className="text-center text-[10px] font-semibold text-white/70">
                  {index + 1}/{reelProducts.length}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={index === reelProducts.length - 1}
                  className="h-9 w-9 rounded-full bg-black/40 text-white backdrop-blur-md disabled:opacity-30"
                >
                  <ChevronDownIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* INFORMAÇÕES DO PRATO E BOTÃO DE COMPRA */}
              <div className="relative z-20 flex w-full max-w-lg flex-col gap-3 p-6 pb-12">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-white/40 shadow-lg">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-tight drop-shadow-md">
                      {product.name}
                    </h3>
                    <p className="text-lg font-extrabold text-amber-400 drop-shadow-md">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-2 text-xs text-white/80 drop-shadow">
                  {product.description}
                </p>

                {product.ingredients && product.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.ingredients.slice(0, 3).map((ingredient, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                      >
                        {ingredient}
                      </span>
                    ))}
                    {product.ingredients.length > 3 && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                        +{product.ingredients.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* BOTÃO ADICIONAR AO PEDIDO */}
                <div className="pt-2">
                  <Button
                    onClick={(e) => handleAddToCart(product, e)}
                    className={`w-full rounded-2xl py-6 font-bold text-base shadow-xl transition-all ${
                      isAdded
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckIcon className="mr-2 h-5 w-5" />
                        Adicionado à Sacola!
                      </>
                    ) : (
                      <>
                        <PlusIcon className="mr-2 h-5 w-5" />
                        Pedir Agora • {formatCurrency(product.price)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FoodReelsModal;
