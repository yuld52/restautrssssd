"use client";

import { KeyRoundIcon, LockIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { verifyAdminPin, verifyCompanyPin, verifySuperAdminPin } from "../actions";

interface AdminLoginProps {
  restaurantSlug?: string;
  restaurantName?: string;
  isSuperAdmin?: boolean;
}

const AdminLogin = ({
  restaurantSlug,
  restaurantName,
  isSuperAdmin = false,
}: AdminLoginProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsLoading(true);
    setError("");

    try {
      let res;
      if (isSuperAdmin) {
        res = await verifySuperAdminPin(pin);
      } else if (restaurantSlug) {
        res = await verifyCompanyPin(restaurantSlug, pin);
      } else {
        res = await verifyAdminPin(pin, restaurantSlug);
      }

      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || "Acesso negado.");
        setPin("");
      }
    } catch {
      setError("Erro ao autenticar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyClick = (digit: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-900">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-inner">
            {isSuperAdmin ? (
              <ShieldCheckIcon className="h-8 w-8 text-amber-600" />
            ) : (
              <LockIcon className="h-8 w-8" />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {isSuperAdmin
              ? "Super Admin SaaS"
              : restaurantName
              ? restaurantName
              : "Painel Administrativo"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {isSuperAdmin
              ? "Admin do Admin • Gestão de Empresas e Plataforma SaaS"
              : "Painel da Loja • Gestão de pedidos, cardápio e mesas"}
          </p>
          {isSuperAdmin && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
              🛡️ Modo Master Multitenant
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full border transition-all ${
                    pin.length > idx
                      ? "border-amber-500 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      : "border-slate-300 bg-slate-100"
                  }`}
                />
              ))}
            </div>

            <div className="relative mt-4">
              <Input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={
                  isSuperAdmin
                    ? "Digite o PIN Master (Padrão: 1234)"
                    : "Digite o PIN da Loja (Padrão: 1234)"
                }
                className="rounded-xl border-slate-300 bg-slate-50 text-center text-lg font-mono tracking-widest text-slate-900 placeholder:text-xs placeholder:tracking-normal placeholder:text-slate-400 focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
              <ShieldAlertIcon className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* TECLADO NUMÉRICO RÁPIDO */}
          <div className="grid grid-cols-3 gap-2.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                onClick={() => handleKeyClick(num)}
                className="h-12 rounded-xl border-slate-200 bg-slate-50 text-lg font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 active:scale-95 transition-all shadow-sm"
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Apagar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleKeyClick("0")}
              className="h-12 rounded-xl border-slate-200 bg-slate-50 text-lg font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
            >
              0
            </Button>
            <Button
              type="submit"
              disabled={isLoading || pin.length === 0}
              className="h-12 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20"
            >
              <KeyRoundIcon className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            {isSuperAdmin
              ? "Acesso exclusivo para administradores da plataforma SaaS."
              : "Acesso restrito para a equipe operacional da loja."}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
