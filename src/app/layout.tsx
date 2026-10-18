import "./globals.css";

import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import { CartProvider } from "./[slug]/menu/contexts/cart";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burger Craft • Hamburgueria Artesanal & Grill",
  description:
    "Cardápio digital, vídeos dos pratos, pedidos na mesa e totem de autoatendimento do Burger Craft.",
  icons: {
    icon: "/burger-craft-logo.png",
    shortcut: "/burger-craft-logo.png",
    apple: "/burger-craft-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.className} antialiased`}>
        <CartProvider>{children}</CartProvider>

        <Toaster/>
      </body>
    </html>
  );
}