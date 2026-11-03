import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const path = "/p/FONE-BT-001/fone-bluetooth-aurora-grafite";
test("APIs reais: cinco reviews, média, variação de preço e validação", async ({
  request,
}) => {
  const r = await request.get("/api/pdp/FONE-BT-001");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body.ratings.data.summary).toMatchObject({
    averageRating: 4.2,
    totalReviews: 5,
  });
  expect(body.ratings.data.reviews.content).toHaveLength(5);
  expect(body.offer.price).toBe("199.90");
  const pickup = await request.get(
    "/api/pdp/FONE-BT-001?channel=PICKUP&locationId=LOJA-PAULISTA",
  );
  expect((await pickup.json()).offer.price).toBe("189.90");
  expect(
    (await request.get("/api/pdp/FONE-BT-001?reviewSize=200")).status(),
  ).toBe(400);
  expect((await request.get("/api/pdp/UNKNOWN")).status()).toBe(404);
});
test("PDP, troca de loja, variantes e sacola demonstrativa", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Descobrir o Aurora" }).click();
  await expect(
    page.getByRole("heading", { name: "Fone Bluetooth Aurora", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("review")).toHaveCount(5);
  await page
    .getByLabel("Como você quer receber?")
    .selectOption("LOJA-PAULISTA");
  await expect(page.getByTestId("price")).toHaveText(/189,90/);
  await page.getByRole("button", { name: "Adicionar à sacola demo" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Nenhum pedido foi criado",
  );
  await page.getByRole("link", { name: "Cor Areia", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Produto indisponível" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Este produto ainda não tem avaliações.", { exact: true }),
  ).toBeVisible();
});
test("acessibilidade automatizada e viewport móvel", async ({ page }) => {
  await page.goto(path);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Fone Bluetooth Aurora", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".artifacts/pdp-mobile.png", fullPage: true });
});
test("resposta de reviews indisponível não inventa estrelas", async ({
  page,
}) => {
  await page.goto(path);
  await page.route("**/api/pdp/FONE-BT-001?**", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.ratings = { status: "UNAVAILABLE", data: null };
    data.degradedSections = ["ratings"];
    await route.fulfill({ response, json: data });
  });
  await page.getByLabel("Como você quer receber?").selectOption("LOJA-CENTRO");
  await expect(
    page.getByText("As avaliações estão fazendo uma pausa."),
  ).toBeVisible();
  await expect(page.getByTestId("price")).toHaveText(/199,90/);
  await expect(page.getByTestId("review")).toHaveCount(0);
});
test("SKU inexistente tem status HTTP 404", async ({ request }) => {
  const response = await request.get("/p/UNKNOWN/inexistente");
  expect(response.status()).toBe(404);
});

test("paginação preserva a média de todas as avaliações", async ({ page }) => {
  await page.goto(path + "?reviewSize=2");
  await expect(page.getByTestId("review")).toHaveCount(2);
  await expect(page.getByText("Página 1 de 3")).toBeVisible();
  await page.getByRole("button", { name: "Próxima" }).click();
  await expect(page.getByText("Página 2 de 3")).toBeVisible();
  await expect(page.getByTestId("review")).toHaveCount(2);
  await expect(page.locator(".big-rating")).toHaveText("4,2");
});

test("PDP standalone carrega imagens e interações", async ({ page }) => {
  await page.goto(
    (process.env.STANDALONE_URL || "http://localhost:3002") + path,
  );
  await expect(page.locator(".hero-product")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".hero-product")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page
    .getByLabel("Como você quer receber?")
    .selectOption("LOJA-PAULISTA");
  await expect(page.getByTestId("price")).toHaveText(/189,90/);
});
