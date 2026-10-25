import Link from "next/link";
import { db } from "@/lib/db";
import { brl } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignForm } from "./campaign-form";

export const dynamic = "force-dynamic";
const STATUS = { DRAFT: "Rascunho", ACTIVE: "Aberta", CLOSED: "Encerrada" } as const;

export default async function AdminHome() {
  const campaigns = await db.campaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 font-display text-3xl uppercase tracking-[0.06em] text-gold">Campanhas</h1>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-64">
                    <Link href={`/admin/campanhas/${c.id}`} className="break-words font-medium text-white underline-offset-4 hover:text-gold hover:underline">
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-gold">{brl(c.ticketPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>{STATUS[c.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-muted-foreground">Crie a primeira campanha abaixo.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      <CampaignForm />
    </div>
  );
}
