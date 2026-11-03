import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
mkdirSync("docs/images", { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(
    "http://localhost:3000/p/FONE-BT-001/fone-bluetooth-aurora-grafite",
    { waitUntil: "networkidle" },
  );
  await page.screenshot({
    path: "docs/images/pdp-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/images/pdp-mobile.png", fullPage: true });
  console.log("Screenshots gerados a partir da PDP com dados reais das APIs.");
} finally {
  await browser.close();
}
