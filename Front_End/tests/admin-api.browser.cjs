/* Browser contract tests use isolated fixtures. Set ADMIN_LIVE_API and
 * ADMIN_SAMPLE_REQUESTS_PATH for a separate read-only run against local SQL Server.
 * Requires an existing Playwright installation (PLAYWRIGHT_MODULE); installs nothing.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.ADMIN_FRONTEND_URL || "http://localhost:5175";
const live = process.env.ADMIN_LIVE_API;
const sample = process.env.ADMIN_SAMPLE_REQUESTS_PATH;
const pageOf = (items, page = 0, size = 10, total = items.length) => ({ items, page, size, totalElements: total, totalPages: Math.ceil(total / size) });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  const consoleErrors = [];
  const networkFailures = [];
  const calls = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/\/auth\/me|\/bmi\/latest/.test(message.location().url || "")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText !== "net::ERR_ABORTED") networkFailures.push({ path: new URL(request.url()).pathname, type: request.resourceType(), error: request.failure()?.errorText });
  });
  const user = { userId: 1, username: "admin-test", email: "admin@example.test", role: "ADMIN" };
  const categories = [{ categoryId: 1, name: "Test category", status: "ACTIVE", type: "ARTICLE" }];
  const article = { articleId: 1, categoryId: 1, title: "Existing article", content: "Existing body", status: "DRAFT", createdBy: 1, createdAt: "2026-01-01T12:00:00", updatedAt: "2026-01-01T12:00:00" };
  const recipe = { recipeId: 1, categoryId: 1, categoryName: "Test category", name: "Existing recipe", description: "Soup", instructions: "Cook gently", prepTime: 5, cookTime: 10, status: "ACTIVE", ingredients: [{ ingredientId: 1, name: "Tofu", quantity: 100, unit: "g" }] };
  const submissions = ["POST", "VIDEO"].map((type) => ({ id: 7, type, title: `${type} submission`, description: "Full moderation content", creator: "member", submittedAt: "2026-01-01T12:00:00", status: "PENDING" }));
  let articles = [{ ...article }, ...Array.from({ length: 7 }, (_, index) => ({ ...article, articleId: 100 + index, title: `Other article ${index}` }))];
  let recipes = [{ ...recipe }, ...Array.from({ length: 11 }, (_, index) => ({ ...recipe, recipeId: 100 + index, name: `Other recipe ${index}` }))];
  let failArticles = false;
  let adminRole = "ADMIN";
  let fixtureSignedIn = true;
  const responseErrors = [];
  try {
    await context.route("http://localhost:8080/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/api/, "");
      const method = request.method();
      calls.push({ path, method, query: url.search, body: request.headers()["content-type"]?.includes("application/json") ? request.postDataJSON() : null });
      if (method === "OPTIONS") {
        await route.fulfill({ status: 204, headers: { "access-control-allow-origin": base, "access-control-allow-credentials": "true", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "access-control-allow-headers": "Content-Type" } });
        return;
      }
      if (live) {
        assert.ok(method === "GET" || path === "/auth/login" || path === "/auth/logout", "Live run must not mutate business data");
        const headers = { ...request.headers() };
        delete headers.origin;
        delete headers.host;
        const response = await context.request.fetch(`${live}${url.pathname}${url.search}`, { method, headers, data: request.postDataBuffer() || undefined });
        if (response.status() >= 400 && path !== "/auth/me" && !/\/bmi\/latest$/.test(path)) responseErrors.push(`${path}: ${response.status()}`);
        await route.fulfill({ response, headers: { ...response.headers(), "access-control-allow-origin": base, "access-control-allow-credentials": "true" } });
        return;
      }
      let data;
      let status = 200;
      if (path === "/auth/me") { status = fixtureSignedIn ? 200 : 401; data = fixtureSignedIn ? { ...user, role: adminRole } : { detail: "Please log in" }; }
      else if (/\/bmi\/latest$/.test(path)) { status = 404; data = { detail: "No BMI" }; }
      else if (path === "/admin/categories") data = categories.map((item) => ({ ...item, type: url.searchParams.get("type") }));
      else if (path === "/ingredients") data = [{ ingredientId: 1, name: "Tofu" }];
      else if (path === "/admin/articles/images") { status = 201; data = { coverImage: "/api/article-images/fixture.png" }; }
      else if (path === "/article-images/fixture.png") {
        await route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=", "base64") });
        return;
      }
      else if (path === "/admin/users/statistics") data = { totalAccounts: 1, activeAccounts: 1, disabledAccounts: 0, newAccountsThisWeek: 1 };
      else if (path === "/admin/users") data = pageOf([{ userId: 2, username: "member", email: "member@example.test", fullName: "Member", status: "ACTIVE" }]);
      else if (path.endsWith("/status") && path.startsWith("/admin/users/")) data = { userId: 2, status: request.postDataJSON().status };
      else if (path === "/admin/articles" && failArticles) { status = 500; data = { detail: "Article service unavailable" }; }
      else if (path === "/admin/articles" && method === "POST") { data = { ...article, ...request.postDataJSON(), articleId: 2 }; articles.unshift(data); status = 201; }
      else if (/^\/admin\/articles\/\d+$/.test(path)) {
        const id = Number(path.split("/").pop());
        if (method === "DELETE") { articles = articles.filter((item) => item.articleId !== id); status = 204; }
        else { if (method === "PUT") articles = articles.map((item) => item.articleId === id ? { ...item, ...request.postDataJSON() } : item); data = articles.find((item) => item.articleId === id); }
      }
      else if (path === "/admin/articles") {
        const statusFilter = url.searchParams.get("status");
        const q = url.searchParams.get("q") || "";
        const filtered = articles.filter((item) => (!statusFilter || item.status === statusFilter) && item.title.includes(q));
        const pageNumber = Number(url.searchParams.get("page"));
        const size = Number(url.searchParams.get("size"));
        data = pageOf(filtered.slice(pageNumber * size, (pageNumber + 1) * size), pageNumber, size, filtered.length);
      }
      else if (path === "/admin/recipes" && method === "POST") { data = { ...recipe, ...request.postDataJSON(), recipeId: 2 }; recipes.unshift(data); status = 201; }
      else if (/^\/admin\/recipes\/\d+$/.test(path)) {
        const id = Number(path.split("/").pop());
        if (method === "DELETE") { recipes = recipes.map((item) => item.recipeId === id ? { ...item, status: "DELETED" } : item); data = { message: "Deleted" }; }
        else { if (method === "PUT") recipes = recipes.map((item) => item.recipeId === id ? { ...item, ...request.postDataJSON() } : item); data = recipes.find((item) => item.recipeId === id); }
      }
      else if (path === "/admin/recipes") {
        const pageNumber = Number(url.searchParams.get("page"));
        const size = Number(url.searchParams.get("size"));
        const q = url.searchParams.get("keyword") || "";
        const statusFilter = url.searchParams.get("status");
        const filtered = recipes.filter((item) => item.name.includes(q) && (!statusFilter || item.status === statusFilter));
        data = pageOf(filtered.slice(pageNumber * size, (pageNumber + 1) * size), pageNumber, size, filtered.length);
      }
      else if (path === "/admin/posts-videos/statistics") data = { totalSubmission: 2, pendingModeration: submissions.filter((item) => item.status === "PENDING").length, approvedLive: 0, rejectedEntries: 0 };
      else if (/^\/admin\/posts-videos\/(POST|VIDEO)\/\d+/.test(path)) {
        const [, , , type, id] = path.split("/");
        data = submissions.find((item) => item.type === type && item.id === Number(id));
        if (method === "PATCH") { data.status = request.postDataJSON().status; status = 204; }
      }
      else if (path === "/admin/posts-videos") data = pageOf(submissions.filter((item) => item.status === "PENDING"), 0, 7);
      else if (path === "/posts") data = pageOf([]);
      else if (path.endsWith("/ai-messages")) data = { totalMessages: 3, includedSenders: ["USER", "AI"] };
      else if (path.endsWith("/interaction-rate")) data = { postsWithInteractions: 0, totalApprovedPosts: 0, ratePercent: null };
      else if (path.endsWith("/top-contributors")) data = { metric: "Approved posts", items: [] };
      else if (path.endsWith("/interactions")) {
        const days = Number(url.searchParams.get("days"));
        data = { days, timezone: "Asia/Ho_Chi_Minh", items: Array.from({ length: days }, (_, index) => ({ date: new Date(Date.now() - (days - index - 1) * 86400000).toISOString().slice(0, 10), likeCount: 0, bookmarkCount: 0, commentCount: 0, totalCount: 0 })) };
      }
      else throw new Error(`Unexpected fixture request: ${method} ${path}`);
      await route.fulfill({ status, contentType: "application/json", body: status === 204 ? "" : JSON.stringify(data), headers: { "access-control-allow-origin": base, "access-control-allow-credentials": "true" } });
    });

    if (live) {
      const samples = fs.readFileSync(sample, "utf8").match(/\{[^{}]*\}/g) || [];
      const credentials = samples.map((text) => { try { return JSON.parse(text); } catch { return {}; } })
        .find((body) => /admin/i.test(body.email || "") && body.password);
      assert.ok(credentials, "A local admin login sample is required");
      await page.goto(`${base}/login`);
      await page.locator('input[name="email"]').fill(credentials.email);
      await page.locator('input[name="password"]').fill(credentials.password);
      await page.getByRole("button", { name: "Login", exact: true }).click();
      await page.waitForURL(`${base}/admin`);
      consoleErrors.length = 0;
      networkFailures.length = 0;
    }
    for (const [path, heading] of [["/admin", "Admin Dashboard"], ["/admin/users", "User Management"], ["/admin/articles", "Article Management"], ["/admin/recipes", "Recipe Management"], ["/admin/posts-videos", "Manage Post & Video"]]) {
      await page.goto(`${base}${path}`);
      await page.locator("h1").filter({ hasText: heading }).waitFor();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.getByRole("alert").count(), 0, `${path} must load without an error`);
      console.log(`PASS ${live ? "LIVE read-only" : "fixture"} ${path}`);
    }
    if (live) {
      await page.goto(`${base}/admin/articles`);
      const link = page.getByRole("link", { name: /^View article / }).first();
      await link.waitFor(); await link.click(); await page.getByRole("heading", { name: "Article Detail", exact: true }).waitFor();
      await page.goto(`${base}/admin/recipes`);
      await page.getByRole("link", { name: "View details", exact: true }).first().click();
      await page.getByRole("heading", { name: "Ingredients", exact: true }).waitFor();
      await page.goto(`${base}/admin/posts-videos`);
      const allSubmissions = page.waitForRequest((request) => request.url().includes("/admin/posts-videos?") && request.url().includes("status=ALL"));
      await page.locator("#post-video-status-filter").selectOption("ALL");
      await (await allSubmissions).response();
      const preview = page.getByRole("button", { name: /^View (post|video) / }).first();
      if (await preview.count()) {
        await preview.click();
        await page.getByRole("dialog").waitFor();
      }
      await page.waitForLoadState("networkidle");
      assert.deepEqual(responseErrors, []);
      assert.deepEqual(errors, []);
      assert.deepEqual(consoleErrors, []);
      const assetFailures = networkFailures.filter((failure) => ["image", "media"].includes(failure.type));
      assert.deepEqual(networkFailures.filter((failure) => !["image", "media"].includes(failure.type)), []);
      if (assetFailures.length) console.log(`UNVERIFIED existing database media URLs: ${JSON.stringify(assetFailures)}`);
      console.log("PASS LIVE detail routes, login and runtime checks; business writes deliberately excluded");
      return;
    }

    // All writes below are intercepted fixtures, never sent to SQL Server.
    await page.goto(`${base}/admin/articles/new`);
    await page.getByRole("button", { name: "Create Article", exact: true }).click();
    await page.getByText("Enter an article title.", { exact: true }).waitFor();
    await page.locator("#article-title").fill("Created article");
    await page.locator("#article-category").selectOption("1");
    await page.locator("#article-content").fill("Article body");
    await page.locator('input[type="file"]').setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=", "base64") });
    await page.getByAltText("Selected article cover preview").waitFor();
    await page.getByRole("button", { name: "Create Article", exact: true }).click();
    await page.waitForURL(`${base}/admin/articles`);
    await page.getByRole("link", { name: "View article Created article", exact: true }).click();
    await page.getByRole("button", { name: "Edit Article", exact: true }).click();
    await page.locator("#article-title").fill("Updated article");
    await page.getByRole("button", { name: "Update Article", exact: true }).click();
    await page.getByRole("heading", { name: "Updated article", exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Article", exact: true }).click();
    await page.waitForURL(`${base}/admin/articles`);
    console.log("PASS fixture article validation/create/update/delete and refresh");

    await page.goto(`${base}/admin/recipes/new`);
    await page.getByLabel("Recipe name").fill("Created recipe");
    await page.getByLabel("Category", { exact: false }).selectOption("1");
    await page.getByLabel("Instructions").fill("Cook gently");
    await page.getByLabel(/^Ingredient/).selectOption("1");
    await page.getByLabel("Quantity", { exact: true }).fill("100");
    await page.getByLabel("Unit", { exact: true }).fill("g");
    await page.getByRole("button", { name: "Save Recipe", exact: true }).click();
    await page.waitForURL(`${base}/admin/recipes/2`);
    await page.getByRole("link", { name: "Edit Recipe", exact: true }).click();
    await page.getByLabel("Recipe name").fill("Updated recipe");
    await page.getByRole("button", { name: "Save Recipe", exact: true }).click();
    await page.getByRole("heading", { name: "Updated recipe", exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Recipe", exact: true }).click();
    await page.waitForURL(`${base}/admin/recipes`);
    console.log("PASS fixture recipe create/update/soft delete and refresh");

    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForLoadState("networkidle");
    assert.ok(calls.some((call) => call.path === "/admin/recipes" && new URLSearchParams(call.query).get("page") === "1"));
    await page.getByLabel("Search by name").fill("does-not-exist");
    await page.getByText("No recipes match the current filters.", { exact: true }).waitFor();
    assert.ok(calls.some((call) => call.path === "/admin/recipes" && new URLSearchParams(call.query).get("keyword") === "does-not-exist" && new URLSearchParams(call.query).get("page") === "0"));
    await page.goto(`${base}/admin/articles`);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForLoadState("networkidle");
    assert.ok(calls.some((call) => call.path === "/admin/articles" && new URLSearchParams(call.query).get("page") === "1"));
    const sortedRequest = page.waitForRequest((request) => request.url().includes("sort=oldest"));
    await page.getByRole("combobox", { name: "Sort articles" }).selectOption("oldest");
    await (await sortedRequest).response();
    assert.ok(calls.some((call) => call.path === "/admin/articles" && new URLSearchParams(call.query).get("sort") === "oldest" && new URLSearchParams(call.query).get("page") === "0"));
    console.log("PASS fixture server pagination, search, sorting and empty state");

    await page.goto(`${base}/admin/posts-videos`);
    await page.getByRole("button", { name: "Approve VIDEO submission", exact: true }).click();
    await page.getByRole("button", { name: "Confirm approval", exact: true }).click();
    await page.getByText("Submission updated successfully.", { exact: true }).waitFor();
    assert.equal(submissions.find((item) => item.type === "VIDEO").status, "APPROVED");
    assert.equal(submissions.find((item) => item.type === "POST").status, "PENDING");
    console.log("PASS fixture moderation keeps overlapping POST/VIDEO IDs separate");

    await page.goto(`${base}/admin/users`);
    await page.getByRole("button", { name: "Deactivate member", exact: true }).click();
    await page.getByText("Account member is now disabled.", { exact: true }).waitFor();
    failArticles = true;
    await page.goto(`${base}/admin/articles`);
    await page.getByRole("alert").first().waitFor();
    failArticles = false;
    await page.getByRole("button", { name: "Retry", exact: true }).first().click();
    await page.waitForLoadState("networkidle");
    console.log("PASS fixture users success feedback and article error/retry");
    adminRole = "USER";
    await page.goto(`${base}/admin/recipes`);
    await page.waitForURL(`${base}/`);
    fixtureSignedIn = false;
    await page.goto(`${base}/admin/articles`);
    await page.waitForURL(`${base}/login`);
    console.log("PASS fixture admin route rejects USER and anonymous sessions");
    assert.deepEqual(errors, []);
    assert.ok(calls.some((call) => call.path === "/admin/recipes/2" && call.method === "PUT"));
    assert.equal(calls.find((call) => call.path === "/admin/articles" && call.method === "POST").body.coverImage, "/api/article-images/fixture.png");
  } catch (error) {
    console.error(JSON.stringify({ url: page.url(), alerts: await page.getByRole("alert").allTextContents(), runtimeErrors: errors, responseErrors, recentRequests: calls.slice(-10).map(({ path, method, query }) => ({ path, method, query })) }));
    throw error;
  } finally { await browser.close(); }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
