"use client";

import { MenuCategory, Product, Restaurant } from "@prisma/client";
import {
  Edit2Icon,
  FilmIcon,
  PlusIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/helpers/format-currency";

import { deleteProduct, upsertProduct } from "../actions";

interface MenuManagerProps {
  restaurant: Restaurant;
  categories: MenuCategory[];
  products: Product[];
}

const MenuManager = ({
  restaurant,
  categories,
  products: initialProducts,
}: MenuManagerProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isEditing, setIsEditing] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Partial<Product> | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [ingredientsStr, setIngredientsStr] = useState("");

  const handleOpenCreate = () => {
    setActiveProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setVideoUrl("/videos/burger-video.webm");
    setCategoryId(categories[0]?.id || "");
    setIngredientsStr("");
    setIsEditing(true);
  };

  const handleOpenEdit = (product: Product) => {
    setActiveProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setImageUrl(product.imageUrl);
    setVideoUrl(product.videoUrl || "");
    setCategoryId(product.menuCategoryId);
    setIngredientsStr(product.ingredients.join(", "));
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !imageUrl || !categoryId) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setIsSaving(true);
      const ingredients = ingredientsStr
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      await upsertProduct({
        id: activeProduct?.id,
        name,
        description,
        price: parseFloat(price.replace(",", ".")),
        imageUrl,
        videoUrl: videoUrl || undefined,
        ingredients,
        menuCategoryId: categoryId,
        restaurantId: restaurant.id,
      });

      toast.success(
        activeProduct?.id
          ? "Prato atualizado com sucesso!"
          : "Novo prato cadastrado com sucesso!"
      );
      setIsEditing(false);
      window.location.reload();
    } catch {
      toast.error("Erro ao salvar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${productName}"?`)) return;
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Prato removido do cardápio.");
    } catch {
      toast.error("Erro ao excluir prato.");
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO CARDÁPIO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Cardápio &amp; Vídeos Promocionais
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre novos pratos, altere fotos e configure vídeos verticais para o feed de comida.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 gap-1.5 text-xs shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Novo Prato</span>
        </Button>
      </div>

      {/* GRID DE PRATOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const category = categories.find((c) => c.id === product.menuCategoryId);
          const hasVideo = !!product.videoUrl;

          return (
            <Card
              key={product.id}
              className="overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* IMAGEM E TAGS */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-slate-800 shadow-xs backdrop-blur-md">
                      {category?.name || "Geral"}
                    </span>
                  </div>

                  {/* INDICADOR DE VÍDEO */}
                  <div className="absolute top-2 right-2">
                    {hasVideo ? (
                      <button
                        type="button"
                        onClick={() => setPreviewVideo(product.videoUrl!)}
                        className="flex items-center gap-1 rounded-full bg-rose-600 hover:bg-rose-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs transition-all active:scale-95"
                      >
                        <FilmIcon className="h-3 w-3 animate-pulse" />
                        <span>Ver Vídeo</span>
                      </button>
                    ) : (
                      <span className="rounded-full bg-slate-200/90 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                        Sem vídeo
                      </span>
                    )}
                  </div>
                </div>

                {/* DETALHES */}
                <CardContent className="p-4 space-y-2 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <span className="text-amber-600 font-extrabold text-sm whitespace-nowrap">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {product.description}
                  </p>
                </CardContent>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-between border-t border-slate-100 p-3 bg-slate-50/70">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(product)}
                  className="rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 gap-1.5"
                >
                  <Edit2Icon className="h-3.5 w-3.5 text-amber-600" />
                  Editar
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(product.id, product.name)}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {activeProduct?.id ? "Editar Prato" : "Novo Prato no Cardápio"}
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="rounded-full text-slate-400 hover:text-slate-700"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Nome do Prato *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Big Burger Especial"
                  className="bg-white border-slate-300 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Preço (R$) *
                  </label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 34.90"
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Categoria *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Descrição apetitosa do produto..."
                  className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  URL da Foto (Imagem) *
                </label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... ou caminho local"
                  className="bg-white border-slate-300 text-slate-900"
                  required
                />
              </div>

              {/* URL DO VÍDEO (REELS) */}
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <VideoIcon className="h-4 w-4 text-amber-600" />
                  <span>Vídeo para o Feed de Reels (Opcional)</span>
                </div>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Ex: /videos/burger-video.webm ou link MP4/WebM"
                  className="bg-white border-amber-300 text-slate-900 placeholder:text-slate-400 text-xs"
                />
                <p className="text-[11px] text-amber-700">
                  Vídeos de exemplo prontos para testar: <code className="text-amber-900 font-mono bg-amber-100 px-1 py-0.5 rounded">/videos/burger-video.webm</code> ou <code className="text-amber-900 font-mono bg-amber-100 px-1 py-0.5 rounded">/videos/sample-food.webm</code>.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Ingredientes (separados por vírgula)
                </label>
                <Input
                  value={ingredientsStr}
                  onChange={(e) => setIngredientsStr(e.target.value)}
                  placeholder="Pão, Carne 100% bovina, Queijo cheddar, Bacon"
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                >
                  {isSaving ? "Salvando..." : "Salvar Prato"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PREVIEW DE VÍDEO */}
      {previewVideo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-sm w-full rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-black">
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <video
              src={previewVideo}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
