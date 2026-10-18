"use client";

import { MenuCategory, Product, Restaurant, WaiterCall } from "@prisma/client";
import {
  BellRingIcon,
  Building2Icon,
  ChefHatIcon,
  ChevronDownIcon,
  FilmIcon,
  LogOutIcon,
  RadioIcon,
  ShieldCheckIcon,
  TimerIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { soundAlert } from "@/helpers/audio-alert";

import {
  getLatestAdminData,
  getRestaurantDetails,
  logoutAdmin,
} from "../actions";
import CompaniesManager, { CompanyWithCounts } from "./companies-manager";
import MenuManager from "./menu-manager";
import NfcGenerator from "./nfc-generator";
import OrdersManager, { OrderWithDetails } from "./orders-manager";
import VideoAnalyticsManager, { VideoAnalyticsData } from "./video-analytics-manager";
import WaiterCallsManager from "./waiter-calls-manager";

interface AdminDashboardProps {
  restaurant: Restaurant;
  categories: MenuCategory[];
  products: Product[];
  orders: OrderWithDetails[];
  waiterCalls: WaiterCall[];
  initialVideoAnalytics?: VideoAnalyticsData | null;
  allCompanies?: CompanyWithCounts[];
}

const AdminDashboard = ({
  restaurant: initialRestaurant,
  categories: initialCategories,
  products: initialProducts,
  orders: initialOrders,
  waiterCalls: initialWaiterCalls,
  initialVideoAnalytics = null,
  allCompanies = [],
}: AdminDashboardProps) => {
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant>(initialRestaurant);
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [companiesList, setCompaniesList] = useState<CompanyWithCounts[]>(
    allCompanies.length > 0 ? allCompanies : [initialRestaurant as CompanyWithCounts]
  );

  const [activeTab, setActiveTab] = useState<
    "orders" | "waiter" | "menu" | "videos" | "nfc" | "companies"
  >("orders");
  const [ordersList, setOrdersList] = useState<OrderWithDetails[]>(initialOrders);
  const [waiterCallsList, setWaiterCallsList] = useState<WaiterCall[]>(initialWaiterCalls);
  const [videoAnalytics, setVideoAnalytics] = useState<VideoAnalyticsData | null>(
    initialVideoAnalytics
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);

  // Mantém controle de chamados pendentes já conhecidos
  const knownPendingIdsRef = useRef<Set<string>>(
    new Set(initialWaiterCalls.filter((c) => c.status === "PENDING").map((c) => c.id))
  );

  const pendingCallsCount = waiterCallsList.filter((c) => c.status === "PENDING").length;

  // Função para alternar entre empresas clientes do SaaS
  const handleSelectCompany = async (companyId: string) => {
    if (companyId === currentRestaurant.id) return;
    try {
      setIsSwitchingCompany(true);
      const [details, adminData] = await Promise.all([
        getRestaurantDetails(companyId),
        getLatestAdminData(companyId),
      ]);

      if (details) {
        setCurrentRestaurant(details.restaurant);
        setCategories(details.categories);
        setProducts(details.products);
      }

      if (adminData) {
        setOrdersList(adminData.orders as OrderWithDetails[]);
        setWaiterCallsList(adminData.waiterCalls as WaiterCall[]);
        if (adminData.videoAnalytics) {
          setVideoAnalytics(adminData.videoAnalytics as VideoAnalyticsData);
        }
        if (adminData.allRestaurants) {
          setCompaniesList(adminData.allRestaurants as CompanyWithCounts[]);
        }
      }

      toast.success(
        `Visualizando painel de: ${
          companiesList.find((c) => c.id === companyId)?.name || "Empresa selecionada"
        }`
      );
    } catch {
      toast.error("Erro ao carregar dados da empresa.");
    } finally {
      setIsSwitchingCompany(false);
    }
  };

  // Polling automático a cada 5 segundos para som e atualização em tempo real
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getLatestAdminData(currentRestaurant.id);
        if (!data) return;

        setOrdersList(data.orders as OrderWithDetails[]);
        setWaiterCallsList(data.waiterCalls as WaiterCall[]);
        if (data.videoAnalytics) {
          setVideoAnalytics(data.videoAnalytics as VideoAnalyticsData);
        }
        if (data.allRestaurants && data.allRestaurants.length > 0) {
          setCompaniesList(data.allRestaurants as CompanyWithCounts[]);
        }

        // Verifica se há novos chamados pendentes
        const pendingCalls = data.waiterCalls.filter((c) => c.status === "PENDING");
        let hasNewCall = false;

        for (const call of pendingCalls) {
          if (!knownPendingIdsRef.current.has(call.id)) {
            hasNewCall = true;
            knownPendingIdsRef.current.add(call.id);
            toast.warning(`🔔 Mesa ${call.tableNumber} chamou o garçom!`, {
              description: `Motivo: ${call.reason}`,
              duration: 8000,
            });
          }
        }

        if (hasNewCall && soundEnabled) {
          soundAlert.playWaiterBell();
        }
      } catch {
        // Erro silencioso em segundo plano
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [soundEnabled, currentRestaurant.id]);

  const handleTestSound = () => {
    soundAlert.playWaiterBell();
    toast.success("Som de sino testado com sucesso!");
    setSoundEnabled(true);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col">
      {/* HEADER PRINCIPAL DO PAINEL */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
              <Image
                src={currentRestaurant.avatarImageUrl || "/burger-craft-logo.png"}
                alt={currentRestaurant.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {/* SELETOR RÁPIDO DE EMPRESAS CLIENTES */}
                {companiesList.length > 1 ? (
                  <div className="relative inline-flex items-center">
                    <select
                      value={currentRestaurant.id}
                      onChange={(e) => handleSelectCompany(e.target.value)}
                      disabled={isSwitchingCompany}
                      className="text-base font-extrabold text-slate-900 bg-transparent pr-6 cursor-pointer focus:outline-none focus:ring-0"
                    >
                      {companiesList.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name} {comp.isActive ? "" : "(Bloqueado)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-0 h-4 w-4 pointer-events-none text-slate-500" />
                  </div>
                ) : (
                  <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
                    {currentRestaurant.name}
                  </h1>
                )}

                <span className="flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 text-[10px] font-bold shrink-0">
                  <ShieldCheckIcon className="h-3 w-3" /> SaaS Master
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Painel Multitenant • {currentRestaurant.name} (/{currentRestaurant.slug})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* BOTÃO TESTAR SOM DO SINO */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSound}
              className="rounded-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs gap-1.5 font-bold shadow-xs"
              title="Testar toque de sino do garçom"
            >
              <BellRingIcon className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span className="hidden sm:inline">Testar Som</span>
            </Button>

            {/* MUTE / UNMUTE */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) soundAlert.playWaiterBell();
              }}
              className="h-8 w-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-xs"
              title={soundEnabled ? "Som Ativado (clique para mutar)" : "Som Mutado"}
            >
              {soundEnabled ? (
                <Volume2Icon className="h-4 w-4 text-emerald-600" />
              ) : (
                <VolumeXIcon className="h-4 w-4 text-slate-400" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs gap-1.5 ml-2 shadow-xs"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* SUB-HEADER COM ABAS DE NAVEGAÇÃO */}
      <div className="border-b border-slate-200 bg-white px-6 py-2 shadow-xs">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {/* ABA PEDIDOS KDS */}
          <Button
            size="sm"
            variant={activeTab === "orders" ? "default" : "ghost"}
            onClick={() => setActiveTab("orders")}
            className={`rounded-xl text-xs font-semibold gap-2 transition-all ${
              activeTab === "orders"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ChefHatIcon className="h-4 w-4" />
            <span>Pedidos (KDS)</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "orders"
                  ? "bg-slate-950/20 text-slate-950 font-extrabold"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {ordersList.length}
            </span>
          </Button>

          {/* ABA GARÇOM */}
          <Button
            size="sm"
            variant={activeTab === "waiter" ? "default" : "ghost"}
            onClick={() => setActiveTab("waiter")}
            className={`rounded-xl text-xs font-semibold gap-2 transition-all ${
              activeTab === "waiter"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : pendingCallsCount > 0
                ? "border border-amber-400 bg-amber-50 text-amber-900 animate-pulse hover:bg-amber-100 font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <BellRingIcon className="h-4 w-4" />
            <span>Chamados de Garçom</span>
            {pendingCallsCount > 0 && (
              <span className="ml-1 rounded-full bg-red-600 px-2 py-0.2 text-[10px] font-extrabold text-white animate-bounce shadow-xs">
                {pendingCallsCount}
              </span>
            )}
          </Button>

          {/* ABA CARDÁPIO & VÍDEOS */}
          <Button
            size="sm"
            variant={activeTab === "menu" ? "default" : "ghost"}
            onClick={() => setActiveTab("menu")}
            className={`rounded-xl text-xs font-semibold gap-2 transition-all ${
              activeTab === "menu"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FilmIcon className="h-4 w-4" />
            <span>Cardápio &amp; Vídeos</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "menu"
                  ? "bg-slate-950/20 text-slate-950 font-extrabold"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {products.length}
            </span>
          </Button>

          {/* ABA MÉTRICAS DE VÍDEO */}
          <Button
            size="sm"
            variant={activeTab === "videos" ? "default" : "ghost"}
            onClick={() => setActiveTab("videos")}
            className={`rounded-xl text-xs font-semibold gap-2 transition-all ${
              activeTab === "videos"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TimerIcon className="h-4 w-4 text-amber-600" />
            <span>Métricas de Vídeo</span>
            {videoAnalytics?.summary?.totalViewsCount ? (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "videos"
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {videoAnalytics.summary.totalViewsCount}
              </span>
            ) : null}
          </Button>

          {/* ABA MESAS NFC & QR CODE */}
          <Button
            size="sm"
            variant={activeTab === "nfc" ? "default" : "ghost"}
            onClick={() => setActiveTab("nfc")}
            className={`rounded-xl text-xs font-semibold gap-2 transition-all ${
              activeTab === "nfc"
                ? "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <RadioIcon className="h-4 w-4" />
            <span>Mesas (NFC &amp; QR Code)</span>
          </Button>

          {/* ABA EXCLUSIVA SAAS: EMPRESAS */}
          <Button
            size="sm"
            variant={activeTab === "companies" ? "default" : "ghost"}
            onClick={() => setActiveTab("companies")}
            className={`rounded-xl text-xs font-bold gap-2 transition-all ${
              activeTab === "companies"
                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Building2Icon className="h-4 w-4 text-amber-600" />
            <span>Empresas (SaaS)</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                activeTab === "companies"
                  ? "bg-white/20 text-white font-extrabold"
                  : "bg-amber-100 text-amber-900 font-bold"
              }`}
            >
              {companiesList.length}
            </span>
          </Button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DA ABA SELECIONADA */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">
        {activeTab === "orders" && <OrdersManager initialOrders={ordersList} />}
        {activeTab === "waiter" && (
          <WaiterCallsManager initialCalls={waiterCallsList} />
        )}
        {activeTab === "menu" && (
          <MenuManager
            restaurant={currentRestaurant}
            categories={categories}
            products={products}
          />
        )}
        {activeTab === "videos" && (
          <VideoAnalyticsManager data={videoAnalytics} />
        )}
        {activeTab === "nfc" && <NfcGenerator restaurant={currentRestaurant} />}
        {activeTab === "companies" && (
          <CompaniesManager
            companies={companiesList}
            selectedCompanyId={currentRestaurant.id}
            onSelectCompany={(companyId) => {
              handleSelectCompany(companyId);
              setActiveTab("orders");
            }}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
