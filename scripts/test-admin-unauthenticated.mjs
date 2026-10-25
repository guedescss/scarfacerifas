import assert from "node:assert/strict";

const baseUrl = process.env.BASE_URL;
const campaignId = process.env.ADMIN_CAMPAIGN_ID;

if (!baseUrl || !campaignId) {
  console.error("Defina BASE_URL e ADMIN_CAMPAIGN_ID para executar o teste.");
  process.exit(1);
}

const base = new URL(baseUrl);
const sensitiveValues = (process.env.ADMIN_ACCESS_TEST_SENSITIVE_VALUES ?? "")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);
const orderIdPattern = /\b(?:c[a-z0-9]{20,}|[a-f0-9]{8}-[a-f0-9-]{27})\b/i;
const phonePattern = /(?<!\d)(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}(?!\d)/;

function assertNoPrivateData(body, route) {
  for (const value of sensitiveValues) {
    assert.equal(body.includes(value), false, `Resposta de ${route} contém dado sensível configurado.`);
  }
  assert.equal(orderIdPattern.test(body), false, `Resposta de ${route} parece conter ID de pedido.`);
  assert.equal(phonePattern.test(body), false, `Resposta de ${route} parece conter telefone.`);
}

async function request(route, options = {}) {
  const response = await fetch(new URL(route, base), {
    ...options,
    redirect: "manual",
    headers: { ...options.headers },
  });
  const body = await response.text();
  assertNoPrivateData(body, route);
  return { response, body };
}

const pageRoutes = [
  "/admin",
  `/admin/campanhas/${encodeURIComponent(campaignId)}`,
];

for (const route of pageRoutes) {
  for (const headers of [{ accept: "text/html" }, { accept: "text/x-component", RSC: "1" }]) {
    const { response } = await request(route, { headers });
    assert.ok(
      [307, 401, 403].includes(response.status),
      `${route} respondeu ${response.status} sem cookie; esperado 307, 401 ou 403.`,
    );
    if (response.status === 307) {
      assert.match(response.headers.get("location") ?? "", /\/admin\/login(?:$|\?)/);
    }
  }
}

const apiRoutes = [
  {
    route: `/admin/api/campanhas/${encodeURIComponent(campaignId)}/numeros-pagos`,
    method: "GET",
  },
  {
    route: `/admin/api/campanhas/${encodeURIComponent(campaignId)}/sorteio`,
    method: "POST",
  },
];

for (const { route, method } of apiRoutes) {
  const { response, body } = await request(route, { method });
  assert.ok([401, 403].includes(response.status), `${method} ${route} respondeu ${response.status} sem cookie.`);
  assert.equal(body, "", `${method} ${route} deve negar acesso sem retornar corpo de dados.`);
}

console.log("Rotas admin protegidas: sem dados privados em respostas sem cookie.");
