import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(
  readFileSync(resolve(root, "repositories.lock.json"), "utf8"),
);
function git(args) {
  const r = spawnSync("git", args, { stdio: "inherit" });
  if (r.status !== 0)
    throw new Error("Falha no Git; verifique conectividade e permissões.");
}
for (const [name, repo] of Object.entries(lock)) {
  if (
    !/^[a-z0-9-]+$/.test(name) ||
    !/^https:\/\/github.com\/JeffeMartins\/[a-z0-9-]+\.git$/.test(repo.url) ||
    !/^([a-f0-9]{40})$/.test(repo.ref)
  )
    throw new Error("Lock inválido");
  const target = resolve(root, "..", name);
  if (existsSync(target)) {
    console.log(
      `${name}: pasta existente preservada; revisão esperada ${repo.ref}`,
    );
    git(["-C", target, "rev-parse", "HEAD"]);
    continue;
  }
  git(["clone", "--no-checkout", repo.url, target]);
  git(["-C", target, "checkout", "--detach", repo.ref]);
}
