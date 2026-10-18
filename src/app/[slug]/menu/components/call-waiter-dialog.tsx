"use client";

import {
  BellRingIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  HelpCircleIcon,
  Loader2Icon,
  UtensilsIcon,
  XIcon,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { soundAlert } from "@/helpers/audio-alert";

import { callWaiter } from "../actions/call-waiter";

interface CallWaiterDialogProps {
  mesa?: string;
  triggerClassName?: string;
}

const REASONS = [
  { label: "Atendimento na mesa", icon: BellRingIcon },
  { label: "Trazer a conta / maquininha", icon: CreditCardIcon },
  { label: "Talheres / Guardanapos", icon: UtensilsIcon },
  { label: "Dúvida sobre o cardápio", icon: HelpCircleIcon },
];

const CallWaiterDialog = ({
  mesa: initialMesa,
  triggerClassName,
}: CallWaiterDialogProps) => {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const mesa =
    initialMesa || searchParams.get("mesa") || searchParams.get("table") || "";

  const [open, setOpen] = useState(false);
  const [tableInput, setTableInput] = useState(mesa);
  const [selectedReason, setSelectedReason] = useState(REASONS[0].label);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCallTime, setLastCallTime] = useState<Date | null>(null);

  const handleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTable = mesa || tableInput;

    if (!finalTable.trim()) {
      toast.error("Por favor, informe o número da mesa.");
      return;
    }

    try {
      setIsLoading(true);
      await callWaiter({
        slug,
        tableNumber: finalTable,
        reason: selectedReason,
      });

      setLastCallTime(new Date());
      soundAlert.playCustomerConfirmation();
      toast.success(`Garçom chamado para a Mesa ${finalTable}!`);
      setOpen(false);
    } catch {
      toast.error("Erro ao chamar o garçom. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className={
            triggerClassName ||
            "w-full h-11 rounded-2xl border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs gap-2 shadow-sm transition-all active:scale-[0.98]"
          }
        >
          <BellRingIcon className="h-4 w-4 text-amber-600 animate-bounce" />
          <span>Chamar Garçom</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[90dvh]">
        <div className="mx-auto w-full max-w-md p-5 pb-8 overflow-y-auto">
          <DrawerHeader className="px-0 pt-0 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
              <BellRingIcon className="h-7 w-7" />
            </div>
            <DrawerTitle className="text-xl font-bold">
              Chamar Garçom
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              A equipe do salão receberá seu chamado imediatamente no painel.
            </DrawerDescription>
          </DrawerHeader>

          {lastCallTime && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 border border-green-200 p-3 text-xs text-green-800">
              <CheckCircle2Icon className="h-4 w-4 text-green-600 shrink-0" />
              <span>
                Último chamado enviado às{" "}
                {lastCallTime.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . O garçom está a caminho!
              </span>
            </div>
          )}

          <form onSubmit={handleCall} className="space-y-4">
            {/* MESA */}
            {mesa ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <span className="text-muted-foreground font-semibold">
                  Sua Mesa:
                </span>
                <span className="font-extrabold text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-sm shadow-sm">
                  Mesa {mesa}
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Qual o número da sua mesa? *
                </label>
                <Input
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  placeholder="Ex: 5, 12, Varanda 1"
                  required
                  className="h-12 rounded-xl text-sm"
                />
              </div>
            )}

            {/* MOTIVO DO CHAMADO */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Como podemos te ajudar?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {REASONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedReason === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedReason(item.label)}
                      className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left text-xs font-medium transition-all active:scale-[0.99] ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-sm ring-1 ring-amber-400"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? "text-amber-600" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-2xl font-bold text-base bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="h-5 w-5 animate-spin" />
                    Chamando...
                  </>
                ) : (
                  <>
                    <BellRingIcon className="h-5 w-5" />
                    Chamar Agora
                  </>
                )}
              </Button>

              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-10 rounded-2xl text-xs text-muted-foreground"
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CallWaiterDialog;
