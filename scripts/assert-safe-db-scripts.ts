export function assertSafeDatabaseScripts() {
  if (process.env.ALLOW_DB_SCRIPTS !== "true") {
    throw new Error("Execução bloqueada. Defina ALLOW_DB_SCRIPTS=true explicitamente para liberar scripts de banco.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Execução bloqueada: scripts de banco não podem rodar com NODE_ENV=production.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  const productionHost = process.env.PRODUCTION_DB_HOST;
  if (!databaseUrl || !productionHost) {
    throw new Error("DATABASE_URL e PRODUCTION_DB_HOST precisam estar configurados para validar o banco.");
  }

  let databaseHostname: string;
  let productionHostname: string;
  try {
    databaseHostname = new URL(databaseUrl).hostname.toLowerCase();
    productionHostname = new URL(
      productionHost.includes("://") ? productionHost : `https://${productionHost}`,
    ).hostname.toLowerCase();
  } catch {
    throw new Error("DATABASE_URL ou PRODUCTION_DB_HOST não contém um host válido.");
  }

  if (databaseHostname === productionHostname) {
    throw new Error("Execução bloqueada: DATABASE_URL aponta para o host configurado como produção.");
  }
}
