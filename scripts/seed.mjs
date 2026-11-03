import assert from "node:assert/strict";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const base = process.env.RATINGS_URL || "http://localhost:8082";
const names = [
  "demo-ana",
  "demo-bruno",
  "demo-carla",
  "demo-diego",
  "demo-elisa",
];
const reviews = [
  [
    5,
    "O som que eu procurava",
    "Uso para trabalhar e caminhar. A bateria acompanha o dia inteiro e o encaixe é muito confortável.",
  ],
  [
    4,
    "Boa companhia para o dia a dia",
    "Conexão rápida e áudio equilibrado. O microfone poderia isolar melhor o barulho da rua.",
  ],
  [
    5,
    "Conforto mesmo depois de horas",
    "As almofadas são macias e os controles são simples. Gostei muito do acabamento.",
  ],
  [
    3,
    "Bom som, ajuste poderia melhorar",
    "A qualidade do áudio é boa, mas senti um pouco de pressão após muitas horas de uso.",
  ],
  [
    4,
    "Valeu pela autonomia",
    "Carrego poucas vezes na semana. O fone conecta bem no notebook e no celular.",
  ],
];
class Session {
  constructor(user, password) {
    this.auth = Buffer.from(`${user}:${password}`).toString("base64");
    this.cookies = new Map();
  }
  async call(path, method = "GET", body) {
    const headers = {
      Authorization: `Basic ${this.auth}`,
      Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
    };
    if (method !== "GET") {
      headers["X-XSRF-TOKEN"] = decodeURIComponent(
        this.cookies.get("XSRF-TOKEN") || "",
      );
      headers["Content-Type"] = "application/json";
    }
    const r = await fetch(new URL(path, base), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    for (const cookie of r.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    if (!r.ok) throw new Error(`Seed: ${method} ${path} retornou ${r.status}`);
    return r.json();
  }
}
if (!process.env.ADMIN_PASSWORD || !process.env.REVIEWER_PASSWORD)
  throw new Error("Execute setup e mantenha .env local.");
const admin = new Session("admin", process.env.ADMIN_PASSWORD);
await admin.call("/api/v1/csrf");
for (const sku of ["FONE-BT-001", "FONE-BT-AZUL", "FONE-BT-AREIA"]) {
  const existing = await fetch(`${base}/api/v1/products/by-sku/${sku}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (existing.status === 404)
    await admin.call("/api/v1/products", "POST", {
      sku,
      name: `Fone Bluetooth Aurora ${sku}`,
      description: "Produto fictício da demonstração integrada Aurora.",
    });
  else if (!existing.ok)
    throw new Error(`Não foi possível consultar ${sku}: ${existing.status}`);
}
let overview = await admin.call("/api/v1/products/by-sku/FONE-BT-001?size=100");
for (let i = 0; i < names.length; i++) {
  if (overview.reviews.content.some((r) => r.author === names[i])) continue;
  const session = new Session(names[i], process.env.REVIEWER_PASSWORD);
  await session.call("/api/v1/csrf");
  await session.call(
    `/api/v1/products/${overview.product.id}/reviews`,
    "POST",
    { rating: reviews[i][0], title: reviews[i][1], content: reviews[i][2] },
  );
}
overview = await admin.call("/api/v1/products/by-sku/FONE-BT-001?size=100");
const own = overview.reviews.content.filter((r) => names.includes(r.author));
assert.equal(own.length, 5);
assert.equal(
  own.reduce((n, r) => n + r.rating, 0),
  21,
);
console.log(
  JSON.stringify({
    sku: overview.product.sku,
    totalReviews: overview.summary.totalReviews,
    averageRating: overview.summary.averageRating,
    demoReviews: own.length,
  }),
);
if (overview.summary.totalReviews !== 5)
  console.log(
    "Existem avaliações adicionais; média total reflete todos os autores e foi preservada.",
  );
