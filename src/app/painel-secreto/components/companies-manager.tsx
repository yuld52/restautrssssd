"use client";

import { Restaurant } from "@prisma/client";
import {
  Building2Icon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  PowerIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  createCompany,
  deleteCompany,
  toggleCompanyStatus,
  updateCompanyDetails,
} from "../actions";

export type CompanyWithCounts = Restaurant & {
  _count?: {
    orders: number;
    products: number;
    waiterCalls: number;
  };
};

interface CompaniesManagerProps {
  companies: CompanyWithCounts[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

const CompaniesManager = ({
  companies: initialCompanies,
  selectedCompanyId,
  onSelectCompany,
}: CompaniesManagerProps) => {
  const [companies, setCompanies] = useState<CompanyWithCounts[]>(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states para nova empresa cliente
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [adminPin, setAdminPin] = useState("1234");
  const [plan, setPlan] = useState("PRO");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Nome e Slug da empresa são obrigatórios.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await createCompany({
        name,
        slug,
        description: description || "Restaurante com autoatendimento e cardápio digital.",
        adminPin,
        plan,
        contactPhone,
        contactEmail,
      });

      if (res.success && res.company) {
        toast.success(`Empresa "${name}" cadastrada com sucesso!`);
        setIsModalOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Erro ao cadastrar empresa.");
      }
    } catch {
      toast.error("Falha ao comunicar com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (company: CompanyWithCounts) => {
    const nextStatus = !company.isActive;
    try {
      await toggleCompanyStatus(company.id, nextStatus);
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, isActive: nextStatus } : c))
      );
      toast.success(
        nextStatus
          ? `Empresa "${company.name}" ativada!`
          : `Empresa "${company.name}" suspensa/bloqueada.`
      );
    } catch {
      toast.error("Erro ao alterar status da empresa.");
    }
  };

  const handleDelete = async (company: CompanyWithCounts) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir "${company.name}" e todos os seus pedidos/produtos? Esta ação é irreversível.`
      )
    )
      return;

    try {
      const res = await deleteCompany(company.id);
      if (res.success) {
        setCompanies((prev) => prev.filter((c) => c.id !== company.id));
        toast.success(`Empresa "${company.name}" excluída.`);
        if (selectedCompanyId === company.id && companies.length > 1) {
          const next = companies.find((c) => c.id !== company.id);
          if (next) onSelectCompany(next.id);
        }
      } else {
        toast.error(res.error || "Erro ao excluir empresa.");
      }
    } catch {
      toast.error("Erro ao excluir empresa.");
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Building2Icon className="h-6 w-6 text-amber-600" />
              <span>Gestão de Empresas &amp; Clientes SaaS</span>
            </h2>
            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold">
              {companies.length} {companies.length === 1 ? "Empresa" : "Empresas"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre novos restaurantes, controle assinaturas ativas/bloqueadas e acesse o painel individual de cada cliente.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 gap-1.5 text-xs shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Cadastrar Nova Empresa</span>
        </Button>
      </div>

      {/* GRID DE EMPRESAS CADASTRADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((company) => {
          const isSelected = company.id === selectedCompanyId;

          return (
            <Card
              key={company.id}
              className={`overflow-hidden border transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-amber-400 bg-amber-50/20 shadow-md ring-2 ring-amber-400/40"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
              }`}
            >
              <div>
                {/* CABEÇALHO DO CARD */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-white">
                      <Image
                        src={company.avatarImageUrl || "/burger-craft-logo.png"}
                        alt={company.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-slate-900 truncate">
                        {company.name}
                      </h3>
                      <p className="text-xs text-amber-700 font-mono font-bold">
                        /{company.slug}
                      </p>
                    </div>
                  </div>

                  {/* STATUS ATIVO / SUSPENSO */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      company.isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : "bg-red-50 text-red-700 border border-red-300"
                    }`}
                  >
                    {company.isActive ? "Ativo" : "Bloqueado"}
                  </span>
                </div>

                {/* DETALHES DA EMPRESA */}
                <CardContent className="p-5 space-y-3.5 text-xs text-slate-600 bg-white">
                  <p className="line-clamp-2 text-slate-500">
                    {company.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-medium">Pedidos</span>
                      <strong className="text-sm font-black text-slate-900">
                        {company._count?.orders ?? 0}
                      </strong>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-medium">Pratos</span>
                      <strong className="text-sm font-black text-slate-900">
                        {company._count?.products ?? 0}
                      </strong>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-medium">Plano</span>
                      <strong className="text-xs font-bold text-amber-700">
                        {company.plan || "PRO"}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <KeyRoundIcon className="h-3.5 w-3.5 text-amber-600" />
                        PIN Administrativo:
                      </span>
                      <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-900">
                        {company.adminPin}
                      </code>
                    </div>

                    {company.contactPhone && (
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon className="h-3 w-3 text-slate-400" />
                        <span>{company.contactPhone}</span>
                      </div>
                    )}
                    {company.contactEmail && (
                      <div className="flex items-center gap-1.5">
                        <MailIcon className="h-3 w-3 text-slate-400" />
                        <span className="truncate">{company.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* AÇÕES DE GESTÃO */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => onSelectCompany(company.id)}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex-1 rounded-xl text-xs font-bold gap-1.5 shadow-xs ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2Icon className="h-3.5 w-3.5" />
                  <span>{isSelected ? "Gerenciando Agora" : "Gerenciar Empresa"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs px-2.5"
                  title="Abrir cardápio público"
                >
                  <a href={`/${company.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(company)}
                  className={`rounded-xl text-xs px-2.5 border shadow-2xs ${
                    company.isActive
                      ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                      : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                  title={company.isActive ? "Suspender / Bloquear empresa" : "Ativar empresa"}
                >
                  <PowerIcon className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(company)}
                  className="h-8 w-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Excluir empresa"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO DE NOVA EMPRESA CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2Icon className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Cadastrar Novo Restaurante Cliente
                </h3>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full text-slate-400 hover:text-slate-700"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Nome do Restaurante / Empresa *
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-")
                      );
                    }
                  }}
                  placeholder="Ex: Pizzaria Bella Napoli"
                  className="bg-white border-slate-300 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Slug / Link da URL *
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-300 px-2 py-2 text-slate-500 rounded-l-md font-mono text-[11px]">
                      /
                    </span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="pizzaria-bella-napoli"
                      className="bg-white border-slate-300 text-slate-900 rounded-l-none font-mono text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    PIN de Acesso da Empresa *
                  </label>
                  <Input
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    maxLength={8}
                    placeholder="Ex: 5544"
                    className="bg-white border-slate-300 text-slate-900 font-mono text-center font-bold tracking-widest"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  Descrição Curta do Restaurante
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Pizzas artesanais no forno a lenha e massas italianas"
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    Plano Contratado
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 text-xs focus:border-amber-500"
                  >
                    <option value="BASIC">Básico (R$ 99/mês)</option>
                    <option value="PRO">Pro com Vídeos (R$ 199/mês)</option>
                    <option value="ENTERPRISE">Enterprise Completo (R$ 349/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    WhatsApp / Telefone do Dono
                  </label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="bg-white border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  E-mail de Contato
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contato@restaurante.com"
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm"
                >
                  {isSaving ? "Criando..." : "Criar Empresa e Liberar Acesso"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesManager;
