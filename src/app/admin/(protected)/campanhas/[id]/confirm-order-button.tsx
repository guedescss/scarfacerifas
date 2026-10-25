"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmOrder } from "../../../actions";

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await confirmOrder(orderId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Pagamento confirmado");
        router.refresh();
      } catch {
        toast.error("Não foi possível confirmar o pagamento. Tente novamente.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleConfirm}
      className="border-gold/40 text-gold hover:bg-gold hover:text-black"
    >
      {pending ? "Confirmando..." : "Confirmar pagamento"}
    </Button>
  );
}
