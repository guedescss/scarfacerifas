"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { claimPayment } from "./actions";

export function ClaimPaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      try {
        const result = await claimPayment(orderId);
        if (!result.ok) {
          toast.error(result.error);
          setOpen(false);
          return;
        }

        setOpen(false);
        toast.success("Pedido aguardando confirmação do pagamento");
        router.refresh();
      } catch {
        toast.error("Não foi possível informar o pagamento. Tente novamente.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !pending && setOpen(nextOpen)}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          disabled={pending}
          className="bg-green-600 text-white transition-all duration-300 ease-out hover:scale-105 hover:bg-green-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.28)] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
        >
          Já paguei
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar pagamento?</AlertDialogTitle>
          <AlertDialogDescription>
            Só clique se você já enviou o Pix. Envie o comprovante no WhatsApp.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-green-600 hover:bg-green-700 hover:shadow-[0_0_12px_rgba(34,197,94,0.28)]"
            onClick={(event) => {
              event.preventDefault();
              handleClaim();
            }}
          >
            {pending ? "Enviando..." : "Sim, já paguei"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
