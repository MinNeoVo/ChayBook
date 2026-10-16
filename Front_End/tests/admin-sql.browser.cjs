/* Real browser/HTTP/SQL tests. No fulfilled fixture responses. Business writes
 * require the unique database + synthetic credentials from AdminTestDatabase.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, request: apiRequest } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const manifestPath = process.env.ADMIN_TEST_MANIFEST;
assert.ok(manifestPath, "ADMIN_TEST_MANIFEST must point to the private SQL test manifest");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.match(manifest.database, /^ChayBook_AdminApi_IT_\d{8}_[a-f0-9]{8}$/);
assert.ok(manifest.url.includes(`databaseName=${manifest.database}`));
assert.match(manifest.adminEmail, /@admin-api-it\.invalid$/);
assert.ok(["localhost", "127.0.0.1"].includes(new URL(manifest.api).hostname));
const base = process.env.ADMIN_FRONTEND_URL || "http://localhost:5175";

async function main() {
  const guard = await apiRequest.newContext();
  const verified = await guard.post(`${manifest.api}/api/auth/login`, { data: { email: manifest.adminEmail, password: manifest.password } });
  assert.equal(verified.status(), 200, "Synthetic credentials must authenticate before any browser write");
  assert.equal((await verified.json()).user.email, manifest.adminEmail);
  await guard.dispose();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const receipts = [];
  const runtimeErrors = [];
  const passed = [];
  let adminAuthenticated = false;
  let delayArticleList = false;
  let allowForbidden = false;
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  const pass = (label) => { passed.push(label); console.log(`PASS real SQL browser: ${label}`); };
  const api = (method, endpoint, data) => context.request.fetch(`${manifest.api}/api${endpoint}`, { method, data });
  const authenticate = async (email) => {
    const response = await api("POST", "/auth/login", { email, password: manifest.password });
    assert.equal(response.status(), 200);
    return response.json();
  };
  page.on("response", (response) => {
    if (response.url().startsWith(manifest.api + "/")) {
      const url = new URL(response.url());
      receipts.push({ method: response.request().method(), endpoint: url.pathname + url.search, status: response.status(), expectedForbidden: allowForbidden });
    }
  });
  await context.route("http://localhost:8080/**", (route) => route.abort("blockedbyclient"));
  await context.route(`${manifest.api}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === "OPTIONS") {
      await route.continue();
      return;
    }
    if (!["GET", "HEAD"].includes(req.method()) && !url.pathname.startsWith("/api/auth/")) {
      assert.ok(adminAuthenticated, "Refusing business writes without the isolated admin identity");
    }
    if (delayArticleList && url.pathname === "/api/admin/articles" && url.searchParams.get("size") === "6") {
      delayArticleList = false;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    // Native browser transport preserves multipart file bytes and exercises CORS.
    await route.continue();
  });
  const targetVideo = path.join(manifest.runDirectory, "uploads", "posts", "fixture.webm");
  let validVideo;
  try {
    await page.goto(`${base}/login`);
    // Generate an actual playable private WebM fixture, without external URLs.
    const webm = await page.evaluate(async () => {
      const canvas = document.createElement("canvas"); canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(10);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
      recorder.start();
      for (let index = 0; index < 5; index++) { ctx.fillStyle = index % 2 ? "#15803d" : "#dcfce7"; ctx.fillRect(0, 0, 32, 32); await new Promise((resolve) => setTimeout(resolve, 120)); }
      recorder.stop(); await stopped; stream.getTracks().forEach((track) => track.stop());
      return Array.from(new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer()));
    });
    validVideo = Buffer.from(webm); assert.ok(validVideo.length > 100);
    fs.writeFileSync(targetVideo, validVideo);
    await page.locator('input[name="email"]').fill(manifest.adminEmail);
    await page.locator('input[name="password"]').fill(manifest.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await page.waitForURL(`${base}/admin`);
    const current = await api("GET", "/auth/me");
    assert.equal((await current.json()).email, manifest.adminEmail);
    adminAuthenticated = true;
    await page.getByRole("heading", { name: "Admin Dashboard", exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.getByRole("alert").count(), 0);
    pass("UI admin login and persisted Dashboard statistics");

    await page.goto(`${base}/admin/users`);
    const memberSearch = page.getByPlaceholder("Search by name, username or email");
    await memberSearch.fill("it_member_16");
    await page.getByRole("button", { name: "Deactivate it_member_16", exact: true }).click();
    await page.getByText("Account it_member_16 is now disabled.", { exact: true }).waitFor();
    await page.reload(); await memberSearch.fill("it_member_16");
    await page.getByRole("button", { name: "Activate it_member_16", exact: true }).click();
    await page.getByText("Account it_member_16 is now active.", { exact: true }).waitFor();
    await memberSearch.fill("no_matching_member");
    await page.getByText(/No users match/).waitFor();
    pass("Users page-local search, block/unblock and refresh persistence");

    delayArticleList = true;
    await page.goto(`${base}/admin/articles`);
    await page.getByText("Loading…", { exact: true }).first().waitFor();
    await page.getByRole("link", { name: /^View article IT Article / }).first().waitFor();
    await page.getByRole("link", { name: "Create Article", exact: true }).click();
    await page.getByRole("button", { name: "Create Article", exact: true }).click();
    await page.getByText("Enter an article title.", { exact: true }).waitFor();
    await page.locator("#article-title").fill("Browser SQL article");
    await page.locator("#article-category").selectOption("1");
    await page.locator("#article-content").fill("Nội dung bài viết được lưu bằng API thật.");
    await page.locator('input[type="file"]').setInputFiles(path.join(manifest.runDirectory, "uploads/posts/fixture.png"));
    await page.getByAltText("Selected article cover preview").waitFor();
    await page.waitForFunction(() => document.querySelector('img[alt="Selected article cover preview"]')?.naturalWidth > 0);
    await page.getByRole("button", { name: "Create Article", exact: true }).click();
    await page.waitForURL(`${base}/admin/articles`);
    await page.getByRole("link", { name: "View article Browser SQL article", exact: true }).click();
    await page.reload();
    await page.getByRole("heading", { name: "Browser SQL article", exact: true }).waitFor();
    await page.getByRole("button", { name: "Edit Article", exact: true }).click();
    await page.locator("#article-title").fill("Browser SQL article updated");
    await page.getByRole("button", { name: "Update Article", exact: true }).click();
    await page.getByRole("heading", { name: "Browser SQL article updated", exact: true }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Browser SQL article updated", exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Article", exact: true }).click();
    await page.waitForURL(`${base}/admin/articles`);
    await page.getByRole("searchbox").fill("no_matching_article");
    await page.getByRole("heading", { name: "No articles match these filters", exact: true }).waitFor();
    pass("Article validation, real upload/display, CRUD and refresh persistence; loading/empty");

    await page.goto(`${base}/admin/recipes/new`);
    await page.getByLabel("Recipe name").fill("Browser SQL recipe");
    await page.getByLabel("Category").selectOption("2");
    await page.getByLabel("Instructions").fill("Cook with care");
    await page.getByLabel(/^Ingredient/).selectOption("1");
    await page.getByLabel("Quantity", { exact: true }).fill("100");
    await page.getByLabel("Unit", { exact: true }).fill("g");
    await page.getByLabel("Image URL").fill("/uploads/posts/not-present.png");
    await page.getByRole("img", { name: "Recipe image unavailable", exact: true }).waitFor();
    await page.getByRole("button", { name: "Save Recipe", exact: true }).click();
    await page.waitForURL(/\/admin\/recipes\/\d+$/);
    const recipeUrl = page.url();
    await page.reload(); await page.getByRole("heading", { name: "Browser SQL recipe", exact: true }).waitFor();
    await page.getByRole("link", { name: "Edit Recipe", exact: true }).click();
    await page.getByLabel("Recipe name").fill("Browser SQL recipe updated");
    await page.getByRole("button", { name: "Save Recipe", exact: true }).click();
    await page.waitForURL(recipeUrl);
    await page.getByRole("heading", { name: "Browser SQL recipe updated", exact: true }).waitFor();
    await page.reload(); await page.getByRole("heading", { name: "Browser SQL recipe updated", exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Recipe", exact: true }).click();
    await page.waitForURL(`${base}/admin/recipes`);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByText(/Page 2 of/).waitFor();
    await page.getByLabel("Search by name").fill("no_matching_recipe");
    await page.getByText("No recipes match the current filters.", { exact: true }).waitFor();
    pass("Recipe CRUD, missing-image fallback, refresh persistence, server pagination/search/empty");

    await page.goto(`${base}/admin/posts-videos`);
    await page.locator("#post-video-status-filter").selectOption("ALL");
    await page.getByRole("button", { name: "Approve IT Video REJECTED", exact: true }).click();
    await page.getByRole("button", { name: "Confirm approval", exact: true }).click();
    await page.getByText("Submission updated successfully.", { exact: true }).waitFor();
    await page.reload(); await page.locator("#post-video-status-filter").selectOption("ALL");
    const row = page.getByRole("row").filter({ hasText: "IT Video REJECTED" });
    await row.getByText("Approved", { exact: true }).waitFor();
    await row.getByRole("button", { name: "View video IT Video REJECTED", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.waitForFunction(() => document.querySelector("video")?.videoWidth > 0);
    await page.locator("video").evaluate((video) => video.play());
    pass("Post/Video real detail and playable locally stored media");
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
    fs.writeFileSync(targetVideo, Buffer.from("invalid webm test fixture"));
    await row.getByRole("button", { name: "View video IT Video REJECTED", exact: true }).click();
    await page.getByText(/This video could not be played/).waitFor();
    fs.writeFileSync(targetVideo, validVideo);
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
    await row.getByRole("button", { name: "Reject IT Video REJECTED", exact: true }).click();
    await page.getByRole("button", { name: "Confirm rejection", exact: true }).click();
    await page.getByText("Submission updated successfully.", { exact: true }).waitFor();
    await page.reload(); await page.locator("#post-video-status-filter").selectOption("ALL");
    await row.getByText("Rejected", { exact: true }).waitFor();
    pass("Approve/reject persistence and actual decoder-error fallback");

    await page.goto(`${base}/admin/recipes`);
    await page.getByRole("button", { name: "Refresh", exact: true }).waitFor();
    await authenticate("user@admin-api-it.invalid");
    adminAuthenticated = false; allowForbidden = true;
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.getByRole("alert").waitFor();
    await authenticate(manifest.adminEmail);
    adminAuthenticated = true;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).waitFor();
    allowForbidden = false;
    pass("Real backend 403 displayed as error; Retry recovers after restoring admin login");

    await authenticate("user@admin-api-it.invalid"); adminAuthenticated = false;
    await page.goto(`${base}/admin/articles`); await page.waitForURL(`${base}/`);
    await page.goto(`${base}/recipes`);
    await page.getByRole("link", { name: /^View recipe:/ }).first().waitFor();
    assert.equal(await page.getByRole("link", { name: /^View recipe:/ }).count(), 10);
    await page.getByRole("button", { name: /Next/ }).click();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.getByRole("link", { name: /^View recipe:/ }).count(), 2);
    await page.getByRole("link", { name: /^View recipe:/ }).first().click();
    await page.waitForURL(/\/recipes\/\d+$/);
    await page.waitForLoadState("networkidle");
    await context.clearCookies();
    await page.goto(`${base}/admin/users`); await page.waitForURL(`${base}/login`);
    pass("Real USER/anonymous admin route guards and User Recipes pagination/detail regression");
    assert.deepEqual(runtimeErrors, []);
    const unexpected = receipts.filter((item) => item.status >= 400 &&
      !/\/auth\/me|\/bmi\/latest|not-present\.png/.test(item.endpoint) && !(item.status === 403 && item.expectedForbidden));
    assert.deepEqual(unexpected, []);
  } catch (error) {
    console.error(JSON.stringify({ url: page.url(), alerts: await page.getByRole("alert").allTextContents(), runtimeErrors, recent: receipts.slice(-8) }));
    throw error;
  } finally {
    if (validVideo) fs.writeFileSync(targetVideo, validVideo);
    fs.writeFileSync(path.join(manifest.runDirectory, "browser-results.json"), JSON.stringify({ database: manifest.database, passed, runtimeErrors, receipts }, null, 2));
    await browser.close();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
