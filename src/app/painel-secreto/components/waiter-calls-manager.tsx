"use client";

import { WaiterCall } from "@prisma/client";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ClockIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { deleteWaiterCall, updateWaiterCallStatus } from "../actions";

interface WaiterCallsManagerProps {
  initialCalls: WaiterCall[];
}

const WaiterCallsManager = ({ initialCalls }: WaiterCallsManagerProps) => {
  const [calls, setCalls] = useState<WaiterCall[]>(initialCalls);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    setCalls(initialCalls);
  }, [initialCalls]);

  const pendingCalls = calls.filter((c) => c.status === "PENDING");

  const handleAttend = async (callId: string) => {
    try {
      setIsUpdating(callId);
      await updateWaiterCallStatus(callId, "ATTENDED");
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, status: "ATTENDED" } : c))
      );
      toast.success("Chamado marcado como atendido!");
    } catch {
      toast.error("Erro ao atualizar chamado.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (callId: string) => {
    try {
      setIsUpdating(callId);
      await deleteWaiterCall(callId);
      setCalls((prev) => prev.filter((c) => c.id !== callId));
      toast.success("Chamado removido.");
    } catch {
      toast.error("Erro ao excluir chamado.");
    } finally {
      setIsUpdating(null);
    }
  };

  const displayedCalls = calls.filter((c) => {
    if (filter === "PENDING") return c.status === "PENDING";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* BANNER DE ALERTA SE HOUVER CHAMADOS PENDENTES */}
      {pendingCalls.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
              <BellRingIcon className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {pendingCalls.length}{" "}
                {pendingCalls.length === 1
                  ? "Mesa chamando garçom agora!"
                  : "Mesas chamando garçom agora!"}
              </h3>
              <p className="text-xs text-amber-700">
                Mesas: {pendingCalls.map((c) => `Mesa ${c.tableNumber}`).join(", ")}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-xs">
            Atenção Imediata
          </span>
        </div>
      )}

      {/* FILTROS E AÇÕES */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filter === "PENDING" ? "default" : "outline"}
            onClick={() => setFilter("PENDING")}
            className={`rounded-full text-xs font-semibold ${
              filter === "PENDING"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Apenas Pendentes ({pendingCalls.length})
          </Button>

          <Button
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => setFilter("ALL")}
            className={`rounded-full text-xs font-semibold ${
              filter === "ALL"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Todos os Chamados ({calls.length})
          </Button>
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

      {/* LISTAGEM DE CHAMADOS */}
      {displayedCalls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-xs">
          <BellRingIcon className="h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            Nenhum chamado de garçom no momento
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Quando um cliente clicar em &quot;Chamar Garçom&quot; em qualquer mesa, o alerta aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedCalls.map((call) => {
            const isPending = call.status === "PENDING";
            return (
              <Card
                key={call.id}
                className={`overflow-hidden border transition-all ${
                  isPending
                    ? "border-amber-300 bg-amber-50/40 shadow-md ring-1 ring-amber-300"
                    : "border-slate-200 bg-white shadow-xs opacity-80"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-sm font-black tracking-wide shadow-xs">
                      Mesa {call.tableNumber}
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isPending
                        ? "bg-red-50 text-red-700 border border-red-300 animate-pulse"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {isPending ? "Aguardando" : "Atendido"}
                  </span>
                </div>

                <CardContent className="p-4 space-y-3 bg-white">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                      Motivo do Chamado:
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {call.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Chamado às{" "}
                      {new Date(call.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {isPending ? (
                      <Button
                        size="sm"
                        disabled={isUpdating === call.id}
                        onClick={() => handleAttend(call.id)}
                        className="flex-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs shadow-xs"
                      >
                        <CheckCircle2Icon className="mr-1.5 h-4 w-4" />
                        Marcar como Atendido
                      </Button>
                    ) : (
                      <span className="flex-1 text-xs text-emerald-600 font-semibold py-1">
                        ✓ Atendido pela equipe
                      </span>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isUpdating === call.id}
                      onClick={() => handleDelete(call.id)}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Excluir chamado"
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

export default WaiterCallsManager;
