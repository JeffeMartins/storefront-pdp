import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
const url = `${process.env.BASE_URL || "http://localhost:3000"}/api/pdp/FONE-BT-001`;
const timings = [];
let errors = 0;
async function sample() {
  const start = performance.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const body = await response.json();
    if (!response.ok || body.ratings.status !== "AVAILABLE") errors++;
  } catch {
    errors++;
  }
  timings.push(performance.now() - start);
}
await sample();
const firstRequestMs = timings.pop();
const start = performance.now();
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let i = 0; i < 25; i++) await sample();
  }),
);
const durationMs = performance.now() - start;
timings.sort((a, b) => a - b);
const percentile = (q) =>
  Number(timings[Math.ceil(q * timings.length) - 1].toFixed(2));
const report = {
  timestamp: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  url,
  requests: timings.length,
  concurrency: 4,
  firstRequestMs: Number(firstRequestMs.toFixed(2)),
  durationMs: Number(durationMs.toFixed(2)),
  p50Ms: percentile(0.5),
  p95Ms: percentile(0.95),
  p99Ms: percentile(0.99),
  errors,
  caveat: "Local smoke only; warm cache, tiny dataset, not capacity or an SLA.",
};
mkdirSync(".artifacts", { recursive: true });
writeFileSync(
  ".artifacts/performance.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (errors) process.exitCode = 1;
