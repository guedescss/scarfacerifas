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
import { cancelOrder } from "./actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      try {
        const success = await cancelOrder(orderId);
        if (!success) {
          toast.error("Não foi possível cancelar. Tente novamente.");
          setOpen(false);
          return;
        }

        setOpen(false);
        router.push("/meus-numeros");
        router.refresh();
        toast.success("Cancelamento concluído");
      } catch {
        toast.error("Não foi possível cancelar. Tente novamente.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !pending && setOpen(nextOpen)}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="border-red-500/40 text-red-500 hover:border-red-500 hover:bg-red-600 hover:text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.28)]"
        >
          Cancelar pedido
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Os números selecionados serão liberados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              handleCancel();
            }}
          >
            {pending ? "Cancelando..." : "Sim, cancelar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
