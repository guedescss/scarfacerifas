import "dotenv/config";
import { assertSafeDatabaseScripts } from "../scripts/assert-safe-db-scripts";

async function main() {
  assertSafeDatabaseScripts();
  const { db } = await import("../src/lib/db");

  try {
    await db.campaign.upsert({
      where: { slug: "juliet-24k-ou-3000" },
      update: {},
      create: {
        title: "Juliet 24K ou R$ 3.000",
        slug: "juliet-24k-ou-3000",
        prize: "JULIET 24K OU R$3000 EM DINHEIRO",
        imageUrl: "/assets/campanhas/juliet24k.jpeg",
        rules: "O resultado será definido pelo resultado da Loteria Federal.",
        ticketPrice: 45,
        totalTickets: 100,
        status: "ACTIVE",
      },
    });
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Falha ao criar a campanha de teste:", error);
  process.exitCode = 1;
});
