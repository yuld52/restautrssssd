"use client";

import { Restaurant } from "@prisma/client";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  HelpCircleIcon,
  LayersIcon,
  PrinterIcon,
  QrCodeIcon,
  RadioIcon,
  SmartphoneIcon,
  SparklesIcon,
} from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface NfcGeneratorProps {
  restaurant: Restaurant;
}

const DEFAULT_TABLES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "Balcão",
];

const NfcGenerator = ({ restaurant }: NfcGeneratorProps) => {
  const [table, setTable] = useState("1");
  const [host, setHost] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [batchMode, setBatchMode] = useState(false);
  const [batchQrs, setBatchQrs] = useState<
    Array<{ table: string; url: string; qrUrl: string }>
  >([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.origin);
    }
  }, []);

  const nfcUrl = `${host || "http://localhost:3000"}/${restaurant.slug}?mesa=${encodeURIComponent(
    table.trim() || "1"
  )}`;

  // Gera o QR Code da mesa selecionada
  useEffect(() => {
    if (!nfcUrl) return;

    QRCode.toDataURL(nfcUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("Erro gerando QR Code:", err));
  }, [nfcUrl]);

  // Gera em lote para todas as mesas padrão se ativar o modo lote
  useEffect(() => {
    if (!batchMode || !host) return;

    const generateBatch = async () => {
      const results = await Promise.all(
        DEFAULT_TABLES.map(async (t) => {
          const url = `${host}/${restaurant.slug}?mesa=${encodeURIComponent(t)}`;
          const qrUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" },
            errorCorrectionLevel: "M",
          });
          return { table: t, url, qrUrl };
        })
      );
      setBatchQrs(results);
    };

    generateBatch();
  }, [batchMode, host, restaurant.slug]);

  const handleCopy = () => {
    navigator.clipboard.writeText(nfcUrl);
    setCopied(true);
    toast.success("Link da mesa copiado com sucesso!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `qrcode-mesa-${table || "1"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`QR Code da Mesa ${table} baixado com sucesso!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Mesas: NFC &amp; QR Code
            </h2>
            <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold">
              2 em 1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere o link para gravar na tag <strong>NFC</strong> e o <strong>QR Code</strong> correspondente para imprimir nas mesas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => setBatchMode(!batchMode)}
            className={`rounded-full text-xs font-bold gap-1.5 shadow-xs ${
              batchMode
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <LayersIcon className="h-3.5 w-3.5" />
            <span>{batchMode ? "Modo Individual" : "Gerar Todas as Mesas em Lote"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold gap-1.5 shadow-xs"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            <span>Imprimir Placas</span>
          </Button>
        </div>
      </div>

      {/* MODO EM LOTE: GRID DE TODAS AS MESAS PARA IMPRESSÃO EM MASSA */}
      {batchMode ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <strong>Visualização em Lote de Todas as Mesas:</strong>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Você pode imprimir todas as placas de mesa de uma só vez clicando no botão &quot;Imprimir Placas&quot; no topo.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handlePrint}
              className="rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs gap-1.5 shadow-sm"
            >
              <PrinterIcon className="h-4 w-4" />
              Imprimir Todas (1 a 12)
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6">
            {batchQrs.map((item) => (
              <div
                key={item.table}
                className="rounded-3xl border-2 border-slate-200 bg-white p-5 text-center shadow-sm flex flex-col items-center justify-between space-y-3 print:border-black print:shadow-none print:break-inside-avoid"
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6 overflow-hidden rounded-full border border-slate-200">
                    <Image
                      src={restaurant.avatarImageUrl}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">
                    {restaurant.name}
                  </span>
                </div>

                <div className="border-t border-b border-slate-100 py-1 w-full">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    MESA {item.table}
                  </h3>
                </div>

                {/* QR CODE */}
                <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-inner">
                  {item.qrUrl && (
                    <Image
                      src={item.qrUrl}
                      alt={`QR Code Mesa ${item.table}`}
                      fill
                      className="object-contain p-1"
                    />
                  )}
                </div>

                {/* INSTRUÇÕES DUPLAS: NFC + QR CODE */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                    <RadioIcon className="h-3 w-3 text-emerald-600 animate-pulse" />
                    <span>Aproxime (NFC) ou Aponte a Câmera (QR Code)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Cardápio em vídeo e pedido direto
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MODO INDIVIDUAL: CONFIGURADOR + DISPLAY DETALHADO */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUNA 1: CONFIGURADOR E LINKS */}
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm flex flex-col justify-between">
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Número ou Identificação da Mesa / Comanda
                </label>
                <div className="flex gap-2">
                  <Input
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="Ex: 1, 05, Varanda 2, Comanda 12"
                    className="bg-white border-slate-300 text-slate-900 font-mono text-sm focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SELEÇÃO RÁPIDA DE MESAS */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 mb-2 block">
                  Atalhos rápidos de mesas:
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TABLES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTable(m)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold border transition-all ${
                        table === m
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80"
                      }`}
                    >
                      Mesa {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOX DO LINK GERADO */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                    <RadioIcon className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                    <span>Link Direto da Mesa:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (Mesmo link para NFC e QR Code)
                  </span>
                </div>

                <div className="font-mono text-xs text-slate-800 break-all select-all bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  {nfcUrl}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    onClick={handleCopy}
                    className="rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs gap-1.5 shadow-xs"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-4 w-4" /> Copiar Link
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    asChild
                    className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs gap-1.5 shadow-2xs"
                  >
                    <a href={nfcUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="h-3.5 w-3.5" /> Abrir Cardápio
                    </a>
                  </Button>
                </div>
              </div>

              {/* AÇÕES DE EXPORTAÇÃO DO QR CODE */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <QrCodeIcon className="h-4 w-4 text-slate-700" />
                    <span>Ações do QR Code</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleDownloadQr}
                    className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold gap-1.5 shadow-xs"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>Baixar QR Code (PNG)</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="rounded-xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold gap-1.5"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    <span>Imprimir</span>
                  </Button>
                </div>
              </div>

              {/* GUIA PASSO A PASSO */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <HelpCircleIcon className="h-4 w-4 text-amber-600" />
                  <span>Como funciona a combinação NFC + QR Code:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                  <li>
                    <strong>NFC:</strong> Grave o link acima em uma tag/adesivo NFC (ex: NTAG213/215). O cliente só encosta o celular na mesa.
                  </li>
                  <li>
                    <strong>QR Code:</strong> Imprima o display gerado ao lado. O cliente que preferir pode apenas apontar a câmera do celular.
                  </li>
                  <li>
                    <strong>Ambos direcionam para a mesma mesa:</strong> Qualquer um dos dois métodos abre o cardápio identificando a <strong>Mesa {table}</strong> automaticamente!
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* COLUNA 2: SIMULAÇÃO REALISTA DA PLACA / DISPLAY DA MESA (NFC + QR CODE) */}
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm flex flex-col justify-between print:shadow-none">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SmartphoneIcon className="h-4 w-4 text-emerald-600" />
                  <span>Placa Display da Mesa (Pronta para Acrílico)</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mesa {table || "1"}
                </span>
              </div>

              {/* TOTEM / DISPLAY DE ACRÍLICO COM QR CODE E NFC */}
              <div className="rounded-3xl border-2 border-slate-300 bg-gradient-to-b from-slate-50 via-white to-amber-50/40 p-6 text-center shadow-lg space-y-4 max-w-sm mx-auto print:max-w-none print:border-black">
                {/* CABEÇALHO DO DISPLAY */}
                <div className="flex items-center justify-center gap-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 shadow-xs">
                    <Image
                      src={restaurant.avatarImageUrl}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    {restaurant.name}
                  </h4>
                </div>

                {/* NÚMERO DA MESA EM DESTAQUE */}
                <div className="rounded-2xl bg-amber-500 text-slate-950 py-2 px-4 shadow-sm">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-80 block">
                    Autoatendimento
                  </span>
                  <span className="text-3xl font-black tracking-tight">
                    MESA {table || "1"}
                  </span>
                </div>

                {/* QR CODE NÍTIDO NO CENTRO */}
                <div className="relative mx-auto h-52 w-52 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-md">
                  {qrCodeDataUrl ? (
                    <Image
                      src={qrCodeDataUrl}
                      alt={`QR Code da Mesa ${table}`}
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                {/* INSTRUÇÕES CLARAS PARA O CLIENTE */}
                <div className="space-y-2">
                  <div className="rounded-full bg-emerald-50 border border-emerald-300 py-1.5 px-3 text-xs font-bold text-emerald-900 shadow-xs flex items-center justify-center gap-2">
                    <RadioIcon className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>Aproxime o celular (NFC)</span>
                    <span className="opacity-40">•</span>
                    <QrCodeIcon className="h-4 w-4 text-emerald-600" />
                    <span>Ou aponte a câmera</span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Veja vídeos dos pratos, faça seu pedido e chame o garçom direto da sua mesa!
                  </p>
                </div>
              </div>

              {/* BOTÃO DE IMPRESSÃO RÁPIDA DA PLACA */}
              <div className="pt-2">
                <Button
                  onClick={handlePrint}
                  className="w-full rounded-2xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 py-6 text-sm gap-2 shadow-sm"
                >
                  <PrinterIcon className="h-4 w-4" />
                  Imprimir Display desta Mesa (Mesa {table})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NfcGenerator;
