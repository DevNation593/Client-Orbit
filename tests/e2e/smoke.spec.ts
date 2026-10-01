import { test, expect } from "@playwright/test";

test("auth entry point is reachable", async ({ page }) => {
  await page.route("**/api/backend/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthenticated.", errors: {} }),
    }),
  );
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Bienvenido de nuevo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Iniciar sesión" }),
  ).toBeVisible();
});
