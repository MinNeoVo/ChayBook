/* Production frontend + real API/SQL, with a LOCAL Gemini protocol provider. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const manifest = JSON.parse(fs.readFileSync(process.env.ADMIN_TEST_MANIFEST, "utf8"));
assert.match(manifest.database, /^ChayBook_AdminApi_IT_\d{8}_[a-f0-9]{8}$/);
assert.ok(manifest.url.includes(`databaseName=${manifest.database}`));
assert.equal(manifest.api, "http://localhost:8082");
const base = process.env.ADMIN_FRONTEND_URL || "http://localhost:5177";
const state = JSON.parse(fs.readFileSync(path.join(manifest.runDirectory, "task2-api-state.json"), "utf8"));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ permissions: ["geolocation"], geolocation: { latitude: 10.8, longitude: 106.7 } });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  const visit = async (url) => {
    await page.goto(url);
    // Initial auth lookup switches BMI providers and remounts route forms.
    await page.waitForLoadState("networkidle");
  };
  const passed = [], runtimeErrors = [], receipts = [];
  let verified = false;
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await context.route("http://localhost:8080/**", (route) => route.abort());
  await context.route(`${manifest.api}/**`, async (route) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(route.request().method()) && !route.request().url().includes("/api/auth/")) assert.ok(verified);
    await route.continue();
  });
  page.on("response", (r) => { if (r.url().startsWith(manifest.api + "/api/")) receipts.push({ method: r.request().method(), url: r.url(), status: r.status() }); });
  const pass = (label) => { passed.push(label); console.log("PASS Task2 browser: " + label); };
  const wait = (method, endpoint) => page.waitForResponse((r) => r.request().method() === method && r.url() === manifest.api + endpoint);
  const login = async (email, password = manifest.password) => {
    assert.match(email, /@admin-api-it\.invalid$/);
    const response = await context.request.post(manifest.api + "/api/auth/login", { data: { email, password } });
    assert.equal(response.status(), 200); assert.equal((await response.json()).user.email, email); verified = true;
  };
  try {
    await visit(base + "/login");
    await page.getByLabel("Email", { exact: true }).fill(manifest.adminEmail);
    await page.getByLabel("Password", { exact: true }).fill(manifest.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await page.waitForURL(base + "/admin");
    const identity = await (await context.request.get(manifest.api + "/api/auth/me")).json();
    assert.equal(identity.email, manifest.adminEmail); verified = true;
    pass("Admin login through linked-label form and real JWT cookie");

    await visit(base + "/admin/recipes/new");
    await page.getByLabel("Recipe name", { exact: false }).fill("IT Browser Recipe");
    await page.getByLabel("Category", { exact: false }).selectOption("2");
    await page.getByLabel("Servings (servings)", { exact: false }).fill("3");
    await page.getByLabel("Difficulty", { exact: false }).selectOption("Medium");
    for (const [id, value] of [["calories", "234.5"], ["protein", "12.25"], ["carbs", "30.5"], ["fat", "7.75"]]) await page.locator(`#recipe-${id}`).fill(value);
    await page.getByLabel("Instructions", { exact: false }).fill("Cook the synthetic ingredients.");
    await page.getByLabel(/^Ingredient/).selectOption("1");
    await page.getByLabel("Quantity", { exact: true }).fill("123.5");
    await page.getByLabel("Unit", { exact: true }).fill("g");
    const [created] = await Promise.all([wait("POST", "/api/admin/recipes"), page.getByRole("button", { name: "Save Recipe", exact: true }).click()]);
    assert.equal(created.status(), 201);
    const body = created.request().postDataJSON();
    assert.equal(body.servings, 3); assert.equal(body.difficulty, "Medium"); assert.equal(body.protein, 12.25);
    await page.waitForURL(/\/admin\/recipes\/\d+$/); const recipeUrl = page.url(); const id = recipeUrl.split("/").pop();
    await page.reload(); await page.getByRole("link", { name: "Edit Recipe", exact: true }).click();
    assert.equal(await page.locator("#recipe-calories").inputValue(), "234.5");
    await page.getByLabel("Recipe name", { exact: false }).fill("IT Browser Recipe revised");
    const [edited] = await Promise.all([wait("PUT", `/api/admin/recipes/${id}`), page.getByRole("button", { name: "Save Recipe", exact: true }).click()]);
    assert.equal(edited.status(), 200);
    for (const field of ["servings", "difficulty", "calories", "protein", "carbs", "fat"]) assert.equal(edited.request().postDataJSON()[field], body[field]);
    await page.waitForURL(recipeUrl); await page.reload();
    await page.getByRole("heading", { name: "IT Browser Recipe revised", exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Recipe", exact: true }).click();
    await page.waitForURL(base + "/admin/recipes");
    const legacy = await context.request.post(manifest.api + "/api/admin/recipes", { data: { ...body, name: "IT Legacy Recipe", difficulty: "Legacy level" } });
    assert.equal(legacy.status(), 201);
    const legacyId = (await legacy.json()).recipeId;
    await visit(base + `/admin/recipes/${legacyId}/edit`);
    assert.equal(await page.getByLabel("Difficulty", { exact: false }).inputValue(), "Legacy level");
    await page.getByRole("button", { name: "Save Recipe", exact: true }).click();
    await page.waitForURL(base + `/admin/recipes/${legacyId}`);
    assert.equal((await (await context.request.get(manifest.api + `/api/admin/recipes/${legacyId}`)).json()).difficulty, "Legacy level");
    assert.equal((await context.request.delete(manifest.api + `/api/admin/recipes/${legacyId}`)).status(), 200);
    pass("Recipe Create/Edit/Delete, numeric DTO, ingredient/category mapping and unchanged nutrition persistence");

    await visit(base + "/content/1");
    await page.getByRole("heading", { name: "IT Article 1", exact: true }).waitFor();
    await page.locator('aside a[href^="/content/"]').first().waitFor();
    const related = await page.locator('aside a[href^="/content/"]').evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
    assert.ok(!related.includes("/content/1") && !related.includes(`/content/${state.draftId}`));
    assert.equal((await context.request.get(manifest.api + `/api/articles/${state.draftId}`)).status(), 404);
    await visit(base + "/");
    await page.getByRole("heading", { name: "Featured Articles", exact: true }).waitFor();
    await page.locator('#featured-recipes a[href^="/content/"]').first().waitFor();
    assert.equal(await page.getByText("IT Task2 Hidden Draft", { exact: true }).count(), 0);
    pass("Related Articles parses Spring Page; Home uses published API data without DRAFT exposure");

    await login("user@admin-api-it.invalid");
    await visit(base + "/profile");
    const post = page.locator("article").filter({ has: page.getByRole("heading", { name: "IT Post APPROVED", exact: true }) });
    await post.getByRole("button", { name: "Edit Post", exact: true }).click();
    await page.getByLabel("Post title", { exact: true }).fill("IT Browser Edited Post");
    const [postSaved] = await Promise.all([wait("PUT", "/api/posts/2"), page.getByRole("button", { name: "Save Post", exact: true }).click()]);
    assert.equal(postSaved.status(), 200);
    await page.getByRole("heading", { name: "IT Browser Edited Post", exact: true }).waitFor();
    await page.reload();
    const pending = page.locator("article").filter({ has: page.getByRole("heading", { name: "IT Browser Edited Post", exact: true }) });
    await pending.getByText("Pending Review", { exact: true }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    const [postDeleted] = await Promise.all([wait("DELETE", "/api/posts/2"), pending.getByRole("button", { name: "Withdraw Submission", exact: true }).click()]);
    assert.equal(postDeleted.status(), 200);
    await pending.waitFor({ state: "detached" }); await page.reload();
    await page.getByRole("heading", { name: "My Posts", exact: true }).waitFor();
    assert.equal(await page.getByRole("heading", { name: "IT Browser Edited Post", exact: true }).count(), 0);
    pass("Profile edits return to PENDING, Delete confirms, API persistence survives reload");

    await page.getByRole("button", { name: "Edit Profile", exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles(path.join(manifest.runDirectory, "uploads/posts/fixture.png"));
    await page.getByRole("img", { name: "Avatar preview", exact: true }).waitFor();
    const [avatar] = await Promise.all([wait("POST", "/api/users/me/avatar"), page.locator('form:has(#edit-username) button[type="submit"]').click()]);
    assert.equal(avatar.status(), 200);
    await page.locator("#edit-username").waitFor({ state: "detached" });
    await page.reload(); await page.getByRole("heading", { name: "My Posts", exact: true }).waitFor();
    const images = page.locator('img[src^="http://localhost:8082/uploads/avatars/"]');
    await images.first().waitFor();
    assert.ok(await images.first().evaluate((image) => image.complete && image.naturalWidth > 0));
    await context.route("**/uploads/avatars/**", (route) => route.abort("failed"));
    await page.reload(); await page.getByRole("heading", { name: "My Posts", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelectorAll('img[src*="/uploads/avatars/"]').length === 0);
    await context.unroute("**/uploads/avatars/**");
    pass("Profile/avatar upload persists, uses configured API origin and falls back when image loading fails");

    await visit(base + "/community");
    await page.getByLabel("Sort posts", { exact: true }).selectOption("top");
    const feed = await (await context.request.get(manifest.api + "/api/posts?sort=top&size=10")).json();
    const target = feed.items[0];
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: target.title, exact: true }) });
    await card.waitFor();
    const failedPattern = `${manifest.api}/api/posts/${target.postId}/interactions**`;
    await context.route(failedPattern, (route) => route.abort("failed"));
    const refreshed = page.waitForResponse((r) => r.url().startsWith(manifest.api + "/api/posts?") && r.request().method() === "GET");
    await card.getByRole("button", { name: /likes$/ }).click(); await refreshed;
    await card.getByRole("button", { name: `${target.likeCount} likes`, exact: true }).waitFor();
    await context.unroute(failedPattern);
    await card.getByRole("button", { name: /likes$/ }).click();
    const bookmark = card.locator("button:has(svg.lucide-bookmark)");
    await bookmark.click();
    await page.getByLabel("Search loaded posts", { exact: true }).fill(target.title);
    await card.waitFor(); await page.reload();
    await page.getByLabel("Search loaded posts", { exact: true }).waitFor();
    const savedFeed = await (await context.request.get(manifest.api + "/api/posts?size=100")).json();
    const savedPost = savedFeed.items.find((p) => p.postId === target.postId);
    assert.equal(savedPost.likedByCurrentUser, !target.likedByCurrentUser);
    assert.equal(savedPost.bookmarkedByCurrentUser, !target.bookmarkedByCurrentUser);
    pass("Community server sort, loaded-post search, like/bookmark persistence and failed request recovery");

    await visit(base + "/");
    await page.getByLabel("Ask nutrition AI", { exact: true }).fill("IT Browser nutrition");
    const [ai] = await Promise.all([wait("POST", "/api/chatbot/messages"), page.getByRole("button", { name: "Ask AI", exact: true }).click()]);
    assert.equal(ai.status(), 200);
    await page.getByText("MOCK_AI: Plant-based answer from local test provider.", { exact: true }).waitFor();
    await page.getByLabel("Ask nutrition AI", { exact: true }).fill("FAIL_PROVIDER");
    const [failure] = await Promise.all([wait("POST", "/api/chatbot/messages"), page.getByRole("button", { name: "Ask AI", exact: true }).click()]);
    assert.equal(failure.status(), 502); await page.getByRole("alert").waitFor();
    assert.equal(await page.getByText("MOCK_AI: Plant-based answer from local test provider.", { exact: true }).count(), 0);
    await visit(base + "/ai-assistant");
    await page.getByRole("button", { name: "Recent Sessions", exact: true }).click();
    await page.getByRole("button", { name: /IT Browser nutrition/ }).first().click();
    await page.getByText("IT Browser nutrition", { exact: true }).waitFor();
    await page.getByText("MOCK_AI: Plant-based answer from local test provider.", { exact: true }).waitFor();
    pass("Home Ask AI uses local provider; 502 shows error without fake answer; Assistant reloads stored history");

    await visit(base + "/places");
    await page.getByRole("alert").waitFor();
    await page.getByText(/We couldn.t load places/).waitFor();
    assert.ok(receipts.some((r) => r.url.endsWith("/api/shops/recommendations") && r.status === 503));
    pass("Places disabled-provider 503 is visible and retryable");

    await visit(base + "/meal-plan");
    await page.getByRole("heading", { name: /Meal Plan/i }).first().waitFor();
    assert.equal((await context.request.get(manifest.api + "/api/meal-plans")).status(), 200);
    await visit(base + "/bmi");
    await page.getByLabel(/Height/).first().waitFor();
    assert.equal((await context.request.get(manifest.api + "/api/users/2/bmi/latest")).status(), 200);
    pass("Saved BMI and Meal Plan remain available through authenticated frontend routes");

    await visit(base + "/profile");
    await page.getByRole("button", { name: "Change Password", exact: true }).click();
    await page.getByLabel("Current password", { exact: true }).fill("wrong");
    await page.getByLabel("New password", { exact: true }).fill("IT_Browser_New_Password");
    await page.getByLabel("Confirm new password", { exact: true }).fill("IT_Browser_New_Password");
    await page.getByRole("button", { name: "Update Password", exact: true }).click();
    await page.getByRole("dialog").getByRole("alert").waitFor();
    await page.getByLabel("Current password", { exact: true }).fill(manifest.password);
    await page.getByRole("button", { name: "Update Password", exact: true }).click();
    await page.waitForURL(base + "/login");
    await page.getByText("Password changed. Please sign in again.", { exact: true }).waitFor();
    await page.getByLabel("Email", { exact: true }).fill("user@admin-api-it.invalid");
    await page.getByLabel("Password", { exact: true }).fill("IT_Browser_New_Password");
    await page.getByRole("button", { name: "Login", exact: true }).click(); await page.waitForURL(base + "/");
    assert.equal((await context.request.put(manifest.api + "/api/users/2/password", { data: { currentPassword: "IT_Browser_New_Password", newPassword: manifest.password } })).status(), 200);
    pass("Change Password surfaces wrong-password error, logs out after success and accepts new credentials");

    assert.deepEqual(runtimeErrors, []);
    assert.ok(receipts.every((r) => !r.url.includes("page=false") && !r.url.includes("object%20Object")));
  } finally {
    fs.writeFileSync(path.join(manifest.runDirectory, "task2-browser-results.json"), JSON.stringify({ passed, runtimeErrors, receipts }, null, 2));
    await browser.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
