"use client";

import {
  ClockIcon,
  EyeIcon,
  FlameIcon,
  PlayCircleIcon,
  TimerIcon,
  TrendingUpIcon,
  UtensilsCrossedIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";

export interface ProductVideoMetric {
  id: string;
  name: string;
  imageUrl: string;
  videoUrl: string | null;
  price: number;
  viewsCount: number;
  totalSeconds: number;
  avgSeconds: number;
}

export interface RecentVideoView {
  id: string;
  duration: number;
  tableNumber: string | null;
  createdAt: Date | string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: number;
  };
}

export interface VideoAnalyticsData {
  summary: {
    totalWatchSeconds: number;
    totalViewsCount: number;
    overallAvg: number;
    topProduct: ProductVideoMetric | null;
  };
  productMetrics: ProductVideoMetric[];
  recentViews: RecentVideoView[];
}

interface VideoAnalyticsManagerProps {
  data: VideoAnalyticsData | null;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  return `${mins}m ${remainingSecs}s`;
}

function formatRelativeTime(dateString: Date | string): string {
  const date = new Date(dateString);
  const diffSecs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSecs < 10) return "agora mesmo";
  if (diffSecs < 60) return `há ${diffSecs}s`;
  const mins = Math.floor(diffSecs / 60);
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return date.toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const VideoAnalyticsManager = ({ data }: VideoAnalyticsManagerProps) => {
  const [previewVideo, setPreviewVideo] = useState<{
    name: string;
    videoUrl: string;
  } | null>(null);

  if (!data || !data.summary) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-xs">
        <TimerIcon className="h-12 w-12 text-slate-400 mb-3" />
        <p className="text-base font-semibold text-slate-800">Nenhum dado de vídeo disponível ainda.</p>
        <p className="text-xs text-slate-500 mt-1">
          Assim que os clientes assistirem aos vídeos dos pratos, as estatísticas de tempo aparecerão aqui.
        </p>
      </div>
    );
  }

  const { summary, productMetrics, recentViews } = data;
  const maxTotalSeconds = Math.max(
    ...productMetrics.map((p) => p.totalSeconds),
    1
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <TimerIcon className="h-6 w-6 text-amber-600" />
            <span>Tempo de Retenção nos Vídeos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe exatamente quanto tempo os clientes passam assistindo ao vídeo de cada prato do cardápio.
          </p>
        </div>
      </div>

      {/* 4 CARDS DE MÉTRICAS GERAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tempo Total Assistido */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tempo Total Assistido</span>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-amber-700">
              <ClockIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatDuration(summary.totalWatchSeconds)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Soma de todo o tempo de tela dos clientes
          </p>
        </div>

        {/* Card 2: Total de Visualizações */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total de Visualizações</span>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-2 text-blue-700">
              <EyeIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summary.totalViewsCount} <span className="text-sm font-normal text-slate-500">views</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Vezes que os vídeos foram reproduzidos
          </p>
        </div>

        {/* Card 3: Tempo Médio por Visualização */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tempo Médio / View</span>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-emerald-700">
              <TrendingUpIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {summary.overallAvg > 0 ? `${summary.overallAvg.toFixed(1)}s` : "0s"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Atenção média que cada cliente dedica
          </p>
        </div>

        {/* Card 4: Prato Campeão de Atenção */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Prato Mais Assistido</span>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-rose-700">
              <FlameIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-base font-extrabold text-slate-900 truncate" title={summary.topProduct?.name || "Nenhum"}>
            {summary.topProduct ? summary.topProduct.name : "Nenhum ainda"}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.topProduct
              ? `${formatDuration(summary.topProduct.totalSeconds)} total (${summary.topProduct.viewsCount} views)`
              : "Aguardando primeiras visualizações"}
          </p>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: TABELA DE RETENÇÃO POR PRATO + HISTÓRICO RECENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: RANKING DE TEMPO POR PRATO (2 COLS) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UtensilsCrossedIcon className="h-4 w-4 text-amber-600" />
              <span>Tempo de Assistência por Prato</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Ordenado por tempo total
            </span>
          </div>

          <div className="space-y-3">
            {productMetrics.map((product, idx) => {
              const percentage = Math.min(
                Math.round((product.totalSeconds / maxTotalSeconds) * 100),
                100
              );
              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    {/* Posição no ranking */}
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                        idx === 0 && product.totalSeconds > 0
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : idx === 1 && product.totalSeconds > 0
                          ? "bg-slate-300 text-slate-900"
                          : idx === 2 && product.totalSeconds > 0
                          ? "bg-amber-200 text-amber-900"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Foto do prato */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Detalhes do produto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {product.name}
                        </h4>
                        <span className="text-xs font-semibold text-amber-600 shrink-0">
                          {formatCurrency(product.price)}
                        </span>
                      </div>

                      {/* Métricas do produto */}
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          ⏱️ Total: <strong className="text-slate-900">{formatDuration(product.totalSeconds)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          👁️ Views: <strong className="text-slate-900">{product.viewsCount}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          ⚡ Média:{" "}
                          <strong className="text-emerald-700 font-bold">
                            {product.avgSeconds > 0 ? `${product.avgSeconds.toFixed(1)}s` : "0s"}
                          </strong>
                        </span>
                      </div>

                      {/* Barra de progresso visual de tempo assistido */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                          style={{ width: `${product.totalSeconds > 0 ? percentage : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Botão de preview do vídeo se cadastrado */}
                    {product.videoUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setPreviewVideo({
                            name: product.name,
                            videoUrl: product.videoUrl!,
                          })
                        }
                        className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50 shrink-0"
                        title="Ver vídeo do prato"
                      >
                        <PlayCircleIcon className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA DIREITA: FEED DE VISUALIZAÇÕES AO VIVO / RECENTES (1 COL) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Visualizações Recentes</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Tempo real</span>
          </div>

          {recentViews.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhuma sessão de vídeo registrada recentemente.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {recentViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-200">
                      <Image
                        src={view.product.imageUrl}
                        alt={view.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                        {view.product.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {view.tableNumber ? `Mesa ${view.tableNumber}` : "Balcão / Geral"} • {formatRelativeTime(view.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-md bg-amber-50 border border-amber-300 px-2 py-0.5 text-xs font-extrabold text-amber-900 shadow-2xs">
                      {view.duration.toFixed(1)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE PREVIEW DO VÍDEO */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm truncate">
                {previewVideo.name}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewVideo(null)}
                className="h-7 px-2 text-slate-500 hover:text-slate-900"
              >
                Fechar
              </Button>
            </div>
            <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-black mt-2">
              <video
                src={previewVideo.videoUrl}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyticsManager;
