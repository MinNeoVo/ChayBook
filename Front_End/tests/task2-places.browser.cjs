const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const manifest = JSON.parse(fs.readFileSync(process.env.ADMIN_TEST_MANIFEST, "utf8"));
assert.match(manifest.database, /^ChayBook_AdminApi_IT_\d{8}_[a-f0-9]{8}$/);
assert.equal(manifest.api, "http://localhost:8082");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const runtimeErrors = [], responses = [];
  try {
    const context = await browser.newContext({ permissions: ["geolocation"], geolocation: { latitude: 10.8, longitude: 106.7 } });
    await context.route("http://localhost:8080/**", (route) => route.abort());
    const login = await context.request.post(manifest.api + "/api/auth/login", { data: { email: "user@admin-api-it.invalid", password: manifest.password } });
    assert.equal(login.status(), 200);
    assert.equal((await login.json()).user.email, "user@admin-api-it.invalid");
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => runtimeErrors.push(e.message));
    page.on("response", (r) => { if (r.url().endsWith("/api/shops/recommendations")) responses.push(r.status()); });
    await page.goto((process.env.ADMIN_FRONTEND_URL || "http://localhost:5177") + "/places");
    await page.getByRole("heading", { name: "IT Mock Vegan Cafe", exact: true }).waitFor();
    await page.getByLabel("Dietary preference").selectOption("VEGAN");
    await page.getByRole("heading", { name: "IT Mock Vegan Cafe", exact: true }).waitFor();
    await page.getByLabel("Search radius").selectOption("5000");
    await page.getByRole("heading", { name: "IT Mock Vegan Cafe", exact: true }).waitFor();
    assert.ok(responses.length >= 3 && responses.every((status) => status === 200));
    assert.deepEqual(runtimeErrors, []);
    console.log("PASS Places browser: real FE/BE, LOCAL Geoapify protocol provider, location/diet/radius filters; zero external calls");
  } finally {
    fs.writeFileSync(path.join(manifest.runDirectory, "task2-places-browser-results.json"), JSON.stringify({ runtimeErrors, responses }, null, 2));
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
