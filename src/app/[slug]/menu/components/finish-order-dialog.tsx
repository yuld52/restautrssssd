"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConsumptionMethod } from "@prisma/client";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2Icon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { createOrder } from "../actions/create-order";
import { createStripeCheckout } from "../actions/create-stripe-checkout";
import { CartContext } from "../contexts/cart";

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório.",
  }),
  tableNumber: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface FinishOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FinishOrderDialog = ({ open, onOpenChange }: FinishOrderDialogProps) => {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useContext(CartContext);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const mesaFromParams = searchParams.get("mesa") || searchParams.get("table");

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tableNumber: mesaFromParams || "",
    },
    shouldUnregister: true,
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      setIsLoading(true);
      const consumptionMethod = (searchParams.get(
        "consumptionMethod",
      ) || "DINE_IN") as ConsumptionMethod;

      const finalTableNumber = mesaFromParams || data.tableNumber || undefined;

      const order = await createOrder({
        consumptionMethod,
        customerName: data.name,
        products,
        slug,
        tableNumber: finalTableNumber,
      });

      if (process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
        try {
          const { sessionId } = await createStripeCheckout({
            products,
            orderId: order.id,
            slug,
            consumptionMethod,
          });
          const stripe = await loadStripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
          );
          if (stripe && sessionId) {
            stripe.redirectToCheckout({
              sessionId: sessionId,
            });
            return;
          }
        } catch (stripeErr) {
          console.warn("Stripe checkout error, redirecting to orders:", stripeErr);
        }
      }

      // Redireciona para a lista de pedidos com o ID do pedido e a mesa
      const tableParam = finalTableNumber ? `&mesa=${encodeURIComponent(finalTableNumber)}` : "";
      window.location.href = `/${slug}/orders?orderId=${order.id}${tableParam}`;
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Finalizar Pedido</DrawerTitle>
          <DrawerDescription>
            Insira suas informações abaixo para finalizar o seu pedido.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {mesaFromParams ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>📍 Pedido para a <strong>Mesa {mesaFromParams}</strong></span>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="tableNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Mesa / Comanda (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mesa 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu nome..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter>
                <Button
                  type="submit"
                  variant="destructive"
                  className="rounded-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2Icon className="animate-spin" />}
                  Finalizar
                </Button>
                <DrawerClose asChild>
                  <Button className="w-full rounded-full" variant="outline">
                    Cancelar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FinishOrderDialog;