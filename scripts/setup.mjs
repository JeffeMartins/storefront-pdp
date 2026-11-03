import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env já existe; credenciais preservadas.");
  process.exit(0);
}
const keys = [
  "CATALOG_DB_PASSWORD",
  "RATINGS_DB_PASSWORD",
  "ADMIN_PASSWORD",
  "REVIEWER_PASSWORD",
];
writeFileSync(
  ".env",
  keys.map((key) => `${key}=${randomBytes(24).toString("hex")}`).join("\n") +
    "\n",
  { mode: 0o600, flag: "wx" },
);
console.log(".env criado com senhas aleatórias. Não publique este arquivo.");
