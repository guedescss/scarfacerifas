import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { assertSafeDatabaseScripts } from "./assert-safe-db-scripts";

const slug = "juliet-24k-ou-3000";
const testProfileIds = [`test-concurrency-${randomUUID()}`, `test-concurrency-${randomUUID()}`];
let campaignId: string | undefined;
let db: typeof import("../src/lib/db").db | undefined;

async function main() {
  assertSafeDatabaseScripts();
  const database = await import("../src/lib/db");
  const ticketsLib = await import("../src/lib/tickets");
  db = database.db;

  try {
    const campaign = await db.campaign.findUnique({ where: { slug } });
    assert.ok(campaign, `Campanha "${slug}" não encontrada. Rode o seed primeiro.`);
    assert.equal(campaign.totalTickets, 100, "A campanha deve ter exatamente 100 números.");
    assert.equal(campaign.status, "ACTIVE", "A campanha deve estar aberta.");
    campaignId = campaign.id;
    await db.profile.createMany({
      data: testProfileIds.map((id, index) => ({
        id,
        name: `Teste concorrência ${index + 1}`,
        phone: `9900000000${index}`,
      })),
    });

    const results = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) =>
        ticketsLib.reserveRandom(slug, 5, testProfileIds[i % 2]),
      ),
    );

    const successes = results.flatMap((result) => {
      if (result.status !== "fulfilled") return [];
      return [result.value];
    });
    const failures = results.filter((result) => result.status === "rejected");
    const failureMessages = failures.map((result) =>
      result.status === "rejected" && result.reason instanceof Error ? result.reason.message : "",
    );
    const friendlyMessages = new Set([
      "Não há números suficientes disponíveis.",
      "Muita gente comprando ao mesmo tempo. Tente de novo.",
      "Você já tem um pedido em aberto. Finalize ou cancele para reservar novos números.",
    ]);
    const tickets = successes.length
      ? await db.ticket.findMany({
          where: { campaignId, orderId: { in: successes.map((order) => order.id) } },
          select: { number: true },
        })
      : [];
    const numbers = tickets.map((ticket) => ticket.number);
    const hasDuplicate = new Set(numbers).size !== numbers.length;
    const occupied = (await ticketsLib.takenNumbers(campaign.id)).size;
    const pendingCounts = await Promise.all(testProfileIds.map((userId) =>
      db!.order.count({
        where: { userId, status: "PENDING", expiresAt: { gt: new Date() } },
      }),
    ));

    console.log(`Pedidos com sucesso: ${successes.length}`);
    console.log(`Pedidos com falha: ${failures.length}`);
    console.log(`Números ocupados: ${occupied}`);
    console.log(`Máximo de pedidos pendentes por comprador: ${Math.max(...pendingCounts)}`);
    console.log(`Houve duplicata: ${hasDuplicate ? "sim" : "não"}`);

    assert.ok(
      failureMessages.every((message) => friendlyMessages.has(message)),
      "Toda falha deve ter uma mensagem amigável.",
    );
    assert.equal(hasDuplicate, false, "Um número foi reservado em mais de um pedido.");
    assert.ok(occupied <= campaign.totalTickets, "A quantidade ocupada excedeu o total da campanha.");
    assert.ok(pendingCounts.every((count) => count <= 1), "Um comprador ficou com mais de um pedido pendente.");
  } finally {
    if (campaignId) {
      const cleanup = await db.order.deleteMany({
        where: { campaignId, userId: { in: testProfileIds } },
      });
      await db.profile.deleteMany({ where: { id: { in: testProfileIds } } });
      console.log(`Pedidos de teste removidos: ${cleanup.count}`);
    }
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Falha no teste de concorrência:", error);
  process.exitCode = 1;
});
