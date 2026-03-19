import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("shows title and start button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Klangfarbe" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Starten" })).toBeVisible();
  });

  test("has footer links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Impressum" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Datenschutz" })).toBeVisible();
    await expect(page.getByRole("link", { name: "GitHub" })).toBeVisible();
  });

  test("navigates to visualizer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Starten" }).click();
    await expect(page).toHaveURL(/\/visualizer/);
  });
});

test.describe("Legal Pages", () => {
  test("impressum loads", async ({ page }) => {
    await page.goto("/impressum");
    await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible();
    await expect(page.getByText("Haftungsausschluss")).toBeVisible();
  });

  test("datenschutz loads", async ({ page }) => {
    await page.goto("/datenschutz");
    await expect(page.getByRole("heading", { name: "Datenschutzerklärung" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deezer-API" })).toBeVisible();
  });
});

test.describe("Visualizer Page", () => {
  test("loads with search bar and controls", async ({ page }) => {
    await page.goto("/visualizer");
    await expect(page.getByPlaceholder("Song suchen...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Suchen" })).toBeVisible();
  });

  test("shows demo track buttons", async ({ page }) => {
    await page.goto("/visualizer");
    await expect(page.getByText("Schnellstart:")).toBeVisible();
    await expect(page.getByRole("button", { name: "Get Lucky" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Strobe" })).toBeVisible();
  });

  test("shows file upload area", async ({ page }) => {
    await page.goto("/visualizer");
    await expect(page.getByText("Audiodatei hierher ziehen")).toBeVisible();
  });

  test("shows microphone button", async ({ page }) => {
    await page.goto("/visualizer");
    await expect(page.getByRole("button", { name: /Mikrofon/ })).toBeVisible();
  });

  test("deezer search returns results", async ({ page }) => {
    await page.goto("/visualizer");
    await page.getByPlaceholder("Song suchen...").fill("Daft Punk");
    await page.getByRole("button", { name: "Suchen" }).click();

    // Wait for results to appear
    await expect(page.getByRole("button", { name: /Daft Punk/ }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("selecting a song shows playback controls", async ({ page }) => {
    await page.goto("/visualizer");
    await page.getByPlaceholder("Song suchen...").fill("Deadmau5 Strobe");
    await page.getByRole("button", { name: "Suchen" }).click();

    // Click first result
    const firstResult = page.locator("ul button").first();
    await firstResult.waitFor({ timeout: 10000 });
    await firstResult.click();

    // Playback controls should appear
    await expect(page.getByRole("button", { name: /Spectrum|Waveform|Radial|Immersive/ }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("visualizer mode switcher works", async ({ page }) => {
    await page.goto("/visualizer");

    // Load a song via demo button
    await page.getByRole("button", { name: "Get Lucky" }).click();

    // Wait for controls to appear
    const waveformBtn = page.getByRole("button", { name: "Waveform" });
    await waveformBtn.waitFor({ timeout: 10000 });

    // Switch to Waveform
    await waveformBtn.click();
    await expect(waveformBtn).toHaveClass(/bg-white/);

    // Switch to Radial
    const radialBtn = page.getByRole("button", { name: "Radial" });
    await radialBtn.click();
    await expect(radialBtn).toHaveClass(/bg-white/);
  });

  test("URL params persist settings", async ({ page }) => {
    await page.goto("/visualizer?viz=2&color=1");

    // Load a song to see the switchers
    await page.getByRole("button", { name: "Strobe" }).click();

    // Wait for controls
    const radialBtn = page.getByRole("button", { name: "Radial" });
    await radialBtn.waitFor({ timeout: 10000 });

    // Radial (index 2) should be active
    await expect(radialBtn).toHaveClass(/bg-white/);

    // Inferno (index 1) should be active
    const infernoBtn = page.getByRole("button", { name: "Inferno" });
    await expect(infernoBtn).toHaveClass(/bg-white/);
  });
});

test.describe("Deezer API Proxy", () => {
  test("search endpoint returns tracks", async ({ request }) => {
    const response = await request.get("/api/deezer/search?q=test");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.tracks).toBeDefined();
    expect(data.tracks.length).toBeGreaterThan(0);
    expect(data.tracks[0]).toHaveProperty("title");
    expect(data.tracks[0]).toHaveProperty("artist");
    expect(data.tracks[0]).toHaveProperty("preview");
  });

  test("search endpoint rejects empty query", async ({ request }) => {
    const response = await request.get("/api/deezer/search?q=");
    expect(response.status()).toBe(400);
  });

  test("preview endpoint rejects invalid URLs", async ({ request }) => {
    const response = await request.get("/api/deezer/preview?url=https://evil.com/malware.mp3");
    expect(response.status()).toBe(400);
  });
});
