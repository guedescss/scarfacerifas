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
import { rejectAwaitingOrder } from "../../../actions";

export function RejectOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleReject() {
    startTransition(async () => {
      try {
        const result = await rejectAwaitingOrder(orderId);
        if (!result.ok) {
          toast.error(result.error);
          setOpen(false);
          return;
        }
        setOpen(false);
        toast.success("Pedido rejeitado e números liberados");
        router.refresh();
      } catch {
        toast.error("Não foi possível rejeitar o pedido. Tente novamente.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !pending && setOpen(nextOpen)}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={pending}
          className="border-red-500/40 text-red-500 hover:border-red-500 hover:bg-red-600 hover:text-white">
          Rejeitar/liberar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rejeitar este pagamento?</AlertDialogTitle>
          <AlertDialogDescription>
            O pedido será cancelado e os números ficarão disponíveis novamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              handleReject();
            }}
          >
            {pending ? "Rejeitando..." : "Sim, rejeitar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
