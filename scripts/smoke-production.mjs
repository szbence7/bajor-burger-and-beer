import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const origin = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const noindex = process.env.EXPECT_NOINDEX === "true";
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH && { executablePath: process.env.CHROME_PATH }),
});
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const endpoint of process.env.SMOKE_LEGACY_BUILD === "true"
    ? ["/api/health"]
    : ["/api/health", "/api/ready"]) {
    const response = await page.request.get(origin + endpoint);
    assert.equal(response.status(), 200, `${endpoint} must succeed`);
  }
  const home = await page.goto(origin);
  assert.equal(home.status(), 200, "homepage SSR");
  const html = await home.text();
  assert.ok(html.includes("Prost,"), "hero must be server rendered");
  assert.ok(!html.includes("PGRST205"), "no internal error in HTML");
  await page.getByRole("heading", { name: "Prost, Budapest!" }).waitFor();
  if (process.env.EXPECT_SITE_URL) {
    assert.equal(
      await page.locator('link[rel="canonical"]').getAttribute("href"),
      process.env.EXPECT_SITE_URL + "/",
      "build-time canonical origin",
    );
  }
  const robots = await page
    .locator('meta[name="robots"]')
    .getAttribute("content")
    .catch(() => "");
  assert.equal(/noindex/.test(robots || ""), noindex, "homepage indexing");
  const robotsTxt = await (await page.request.get(origin + "/robots.txt")).text();
  assert.equal(/^Disallow: \/\s*$/m.test(robotsTxt), noindex, "robots.txt indexing");
  const books = page.getByRole("group", { name: "Étlap kiválasztása" }).getByRole("button");
  assert.ok(await books.count(), "at least one real menu required for deployment verification");
  for (let i = 0; i < (await books.count()); i++) {
    await books.nth(i).click();
    const languages = page.getByRole("group", { name: "Étlap nyelve" }).getByRole("button");
    const count = await languages.count();
    for (let j = 0; j < Math.max(count, 1); j++) {
      if (count) await languages.nth(j).click();
      const image = page.locator("#selected-menu img").first();
      await image.waitFor();
      await image.evaluate(async (img) => {
        await img.decode();
      });
      await page.getByRole("button", { name: "Nagyítás" }).click();
      await page.getByRole("dialog").waitFor();
      await page.getByRole("button", { name: /Bezár/ }).click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
    }
  }
  const legacy = await page.request.get(origin + "/menu", { maxRedirects: 0 });
  assert.equal(legacy.status(), 301, "legacy menu redirect");
  const pdf = await page.request.get(origin + "/etlap.pdf", { maxRedirects: 0 });
  if (pdf.status() === 200) {
    assert.match(pdf.headers()["content-type"], /application\/pdf/);
    assert.equal((await pdf.body()).subarray(0, 5).toString(), "%PDF-", "real PDF bytes");
  } else {
    assert.equal(pdf.status(), 302);
    assert.equal(pdf.headers().location, "/#etlap", "bundled image menus have no PDF");
  }
  assert.equal((await page.goto(origin + "/admin")).status(), 200);
  await page.getByRole("heading", { name: "Bejelentkezés" }).waitFor();
  assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  assert.deepEqual(errors, [], "no render, hydration or browser console errors");
  console.log(
    "PASS: production SSR, hydration, all menu books/languages/images, enlargement, PDF endpoint, admin login and indexing",
  );
} finally {
  await browser.close();
}
