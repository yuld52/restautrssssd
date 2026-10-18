"use client";

import { ConsumptionMethod, OrderStatus, Prisma } from "@prisma/client";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChefHatIcon,
  ClockIcon,
  RefreshCwIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/helpers/format-currency";

import { deleteOrder, updateOrderStatus } from "../actions";

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    orderProducts: {
      include: {
        product: true;
      };
    };
  };
}>;

interface OrdersManagerProps {
  initialOrders: OrderWithDetails[];
}

const OrdersManager = ({ initialOrders }: OrdersManagerProps) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
  const [filter, setFilter] = useState<string>("ALL");
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    try {
      setIsUpdating(orderId);
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Pedido #${orderId} atualizado!`);
    } catch {
      toast.error("Erro ao atualizar status do pedido.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm(`Tem certeza que deseja excluir o pedido #${orderId}?`)) return;
    try {
      setIsUpdating(orderId);
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(`Pedido #${orderId} excluído.`);
    } catch {
      toast.error("Erro ao excluir pedido.");
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "PENDING") return order.status === "PENDING";
    if (filter === "IN_PREPARATION") return order.status === "IN_PREPARATION";
    if (filter === "FINISHED") return order.status === "FINISHED";
    if (filter === "CONFIRMED") return order.status === "PAYMENT_CONFIRMED";
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-xs font-semibold">
            <ClockIcon className="h-3 w-3" /> Pendente
          </span>
        );
      case "IN_PREPARATION":
        return (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 text-blue-800 border border-blue-300 px-2.5 py-0.5 text-xs font-semibold animate-pulse">
            <ChefHatIcon className="h-3 w-3" /> Em Preparo
          </span>
        );
      case "PAYMENT_CONFIRMED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-semibold">
            <CheckCircle2Icon className="h-3 w-3" /> Pago
          </span>
        );
      case "FINISHED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 text-xs font-semibold">
            <CheckCircle2Icon className="h-3 w-3" /> Concluído
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-red-50 text-red-800 border border-red-300 px-2.5 py-0.5 text-xs font-semibold">
            <AlertCircleIcon className="h-3 w-3" /> Falhou
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTROS E AÇÕES DO TOPO */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: `Todos (${orders.length})` },
            {
              id: "PENDING",
              label: `Pendentes (${orders.filter((o) => o.status === "PENDING").length})`,
            },
            {
              id: "IN_PREPARATION",
              label: `Na Cozinha (${orders.filter((o) => o.status === "IN_PREPARATION").length})`,
            },
            {
              id: "FINISHED",
              label: `Concluídos (${orders.filter((o) => o.status === "FINISHED").length})`,
            },
          ].map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              onClick={() => setFilter(item.id)}
              className={`rounded-full text-xs font-medium transition-all ${
                filter === item.id
                  ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100 gap-1.5 text-xs shadow-xs"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* LISTAGEM DE PEDIDOS EM CARDS (KDS) */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-xs">
          <UtensilsIcon className="h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            Nenhum pedido encontrado
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Os novos pedidos dos totens e das mesas aparecerão aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isLoadingThis = isUpdating === order.id;
            return (
              <Card
                key={order.id}
                className="overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                {/* CABEÇALHO DO PEDIDO */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-amber-600">
                      #{order.id}
                    </span>
                    {order.tableNumber ? (
                      <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold shadow-xs">
                        📍 Mesa {order.tableNumber}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-150 text-slate-600 border border-slate-200 px-2 py-0.5 text-xs">
                        {order.consumptionMethod === ConsumptionMethod.DINE_IN
                          ? "Comer no local"
                          : "Para levar"}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* DETALHES DO CLIENTE */}
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {order.customerName}
                      </p>
                      {order.customerCpf && (
                        <p className="text-[11px] text-slate-400">
                          CPF: {order.customerCpf}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* ITENS DO PEDIDO */}
                  <div className="space-y-2">
                    {order.orderProducts.map((op) => (
                      <div
                        key={op.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                            {op.quantity}x
                          </span>
                          <span className="font-medium text-slate-800">
                            {op.product.name}
                          </span>
                        </div>
                        <span className="text-slate-600 font-mono">
                          {formatCurrency(op.price * op.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500 font-medium">Total:</span>
                    <span className="text-base font-extrabold text-amber-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {/* BOTÕES DE FLUXO DA COZINHA */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {order.status === "PENDING" && (
                      <Button
                        size="sm"
                        disabled={isLoadingThis}
                        onClick={() =>
                          handleStatusChange(order.id, "IN_PREPARATION")
                        }
                        className="flex-1 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 text-xs py-1 shadow-xs"
                      >
                        <ChefHatIcon className="mr-1 h-3.5 w-3.5" />
                        Preparar
                      </Button>
                    )}

                    {order.status === "IN_PREPARATION" && (
                      <Button
                        size="sm"
                        disabled={isLoadingThis}
                        onClick={() =>
                          handleStatusChange(order.id, "FINISHED")
                        }
                        className="flex-1 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-xs py-1 shadow-xs"
                      >
                        <CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />
                        Pronto / Entregar
                      </Button>
                    )}

                    {order.status === "PAYMENT_CONFIRMED" && (
                      <Button
                        size="sm"
                        disabled={isLoadingThis}
                        onClick={() =>
                          handleStatusChange(order.id, "IN_PREPARATION")
                        }
                        className="flex-1 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 text-xs py-1 shadow-xs"
                      >
                        <ChefHatIcon className="mr-1 h-3.5 w-3.5" />
                        Enviar Cozinha
                      </Button>
                    )}

                    {order.status === "FINISHED" && (
                      <span className="text-[11px] text-slate-500 italic py-1">
                        Pedido finalizado e entregue
                      </span>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isLoadingThis}
                      onClick={() => handleDelete(order.id)}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                      title="Excluir pedido"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
