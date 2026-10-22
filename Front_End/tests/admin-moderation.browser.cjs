/* Real UI/API/SQL moderation regression. Writes require a fresh isolated test manifest. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
assert.ok(process.env.ADMIN_TEST_MANIFEST, "An isolated SQL test manifest is required");
const manifest = JSON.parse(fs.readFileSync(process.env.ADMIN_TEST_MANIFEST, "utf8"));
assert.match(manifest.database, /^ChayBook_AdminApi_IT_\d{8}_[a-f0-9]{8}$/);
assert.ok(manifest.url.includes(`databaseName=${manifest.database}`));
assert.match(manifest.adminEmail, /@admin-api-it\.invalid$/);
assert.ok(["localhost", "127.0.0.1"].includes(new URL(manifest.api).hostname));
const base = process.env.ADMIN_FRONTEND_URL || "http://localhost:5177";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const receipts = [];
  const runtimeErrors = [];
  const passed = [];
  let authenticated = false;
  const pass = (label) => { passed.push(label); console.log(`PASS real moderation browser: ${label}`); };
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await context.route("http://localhost:8080/**", (route) => route.abort("blockedbyclient"));
  await context.route(`${manifest.api}/**`, async (route) => {
    const req = route.request();
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method()) && !new URL(req.url()).pathname.startsWith("/api/auth/")) {
      assert.ok(authenticated, "Refusing business writes without verified synthetic admin identity");
    }
    await route.continue();
  });
  page.on("response", (response) => {
    if (response.url().startsWith(manifest.api + "/api/admin/posts-videos")) {
      receipts.push({ method: response.request().method(), endpoint: new URL(response.url()).pathname, status: response.status() });
    }
  });
  const login = async (email) => {
    const response = await context.request.post(`${manifest.api}/api/auth/login`, { data: { email, password: manifest.password } });
    assert.equal(response.status(), 200);
    const identity = (await response.json()).user;
    assert.equal(identity.email, email);
    return identity;
  };
  const patchResponse = (type, id) => page.waitForResponse((response) =>
    response.request().method() === "PATCH" && response.url() === `${manifest.api}/api/admin/posts-videos/${type}/${id}/status`);
  try {
    const identity = await login(manifest.adminEmail);
    assert.equal(identity.role, "ADMIN");
    authenticated = true;
    await page.goto(`${base}/admin/posts-videos`);
    await page.getByRole("button", { name: "Next page", exact: true }).waitFor();
    await page.locator("tbody tr").first().waitFor();
    const firstPageTitles = await page.locator("tbody tr td:nth-child(3)").allTextContents();
    assert.equal(firstPageTitles.length, 7);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page.getByText(/Showing 8 to/).waitFor();
    const secondPageTitles = await page.locator("tbody tr td:nth-child(3)").allTextContents();
    assert.ok(secondPageTitles.length > 0);
    assert.ok(secondPageTitles.every((title) => !firstPageTitles.includes(title)));
    await page.getByRole("tab", { name: "Post", exact: true }).click();
    await page.getByText(/Showing 1 to/).waitFor();
    const search = page.getByRole("searchbox");
    await search.fill("no_such_moderation_item");
    await page.getByText("No submissions found", { exact: true }).waitFor();
    await search.fill("IT Page Post");
    await page.locator("tbody tr").filter({ hasText: "IT Page Post" }).first().waitFor();
    assert.ok((await page.locator("tbody").textContent()).includes("Pending"));
    await page.getByRole("tab", { name: "Video", exact: true }).click();
    await page.getByText("No submissions found", { exact: true }).waitFor();
    await search.fill("IT Page Video");
    await page.locator("tbody tr").filter({ hasText: "IT Page Video" }).first().waitFor();
    const stats = await (await context.request.get(`${manifest.api}/api/admin/posts-videos/statistics`)).json();
    assert.equal(stats.totalSubmission, stats.pendingModeration + stats.approvedLive + stats.rejectedEntries);
    pass("real pagination, page reset, type/status/search filters, empty state and SQL statistics");

    await page.goto(`${base}/admin/posts-videos`);
    await page.locator("#post-video-status-filter").selectOption("ALL");
    await page.getByRole("searchbox").fill("IT Post PENDING");
    await page.getByRole("button", { name: "View post IT Post PENDING", exact: true }).click();
    await page.getByRole("dialog").getByText("AI-only assessment; not an admin rejection reason", { exact: true }).waitFor();
    await page.getByRole("dialog").getByText("IT Reviewer Two", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
    pass("AI reason displayed separately from Admin decision and reviewer");

    for (const type of ["POST", "VIDEO"]) {
      const title = `IT ${type === "POST" ? "Post" : "Video"} REJECTED`;
      const reason = `Lý do Admin cho ${type}: nội dung cần chỉnh sửa.\nVui lòng bổ sung thông tin.`;
      await page.goto(`${base}/admin/posts-videos`);
      await page.locator("#post-video-status-filter").selectOption("ALL");
      await page.getByRole("searchbox").fill(title);
      let row = page.getByRole("row").filter({ hasText: title });
      await row.getByRole("button", { name: `Approve ${title}`, exact: true }).click();
      const [approved] = await Promise.all([patchResponse(type, 3), page.getByRole("button", { name: "Confirm approval", exact: true }).click()]);
      assert.equal(approved.status(), 204);
      assert.deepEqual(approved.request().postDataJSON(), { status: "APPROVED" });
      await row.getByText("Approved", { exact: true }).waitFor();
      await row.getByRole("button", { name: `Reject ${title}`, exact: true }).click();
      const textarea = page.getByLabel("Rejection reason", { exact: false });
      assert.equal(await textarea.inputValue(), "");
      const writesBefore = receipts.filter((item) => item.method === "PATCH").length;
      await textarea.fill("   ");
      await page.getByRole("button", { name: "Confirm rejection", exact: true }).click();
      await page.getByText("Please enter a rejection reason.", { exact: true }).waitFor();
      assert.equal(receipts.filter((item) => item.method === "PATCH").length, writesBefore);
      await textarea.fill(`  ${reason}  `);
      const [rejected] = await Promise.all([patchResponse(type, 3), page.evaluate(() => {
        const form = document.querySelector("#admin-rejection-reason").form;
        form.requestSubmit(); form.requestSubmit();
      })]);
      assert.equal(rejected.status(), 204);
      assert.deepEqual(rejected.request().postDataJSON(), { status: "REJECTED", reason });
      await row.getByText("Rejected", { exact: true }).waitFor();
      assert.equal(receipts.filter((item) => item.method === "PATCH").length, writesBefore + 1);
      assert.ok((await row.textContent()).includes(reason));
      pass(`${type} approve, whitespace validation, trimmed rejection payload and list refresh`);

      await page.reload();
      await page.locator("#post-video-status-filter").selectOption("REJECTED");
      await page.getByRole("searchbox").fill(title);
      row = page.getByRole("row").filter({ hasText: title });
      await row.getByText("IT Reviewer One", { exact: true }).waitFor();
      assert.ok((await row.textContent()).includes(reason));
      const detailResponse = await context.request.get(`${manifest.api}/api/admin/posts-videos/${type}/3`);
      assert.equal(detailResponse.status(), 200);
      const detail = await detailResponse.json();
      assert.equal(detail.reviewerId, identity.userId);
      assert.equal(detail.adminReason, reason);
      assert.ok(detail.reviewedAt);
      assert.notEqual(detail.creator, detail.reviewer);
      await row.getByRole("button", { name: `View ${type.toLowerCase()} ${title}`, exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByText("IT Reviewer One", { exact: true }).waitFor();
      assert.ok((await dialog.textContent()).includes(reason));
      assert.ok((await dialog.textContent()).includes("Creator: @IT Creator"));
      assert.ok((await dialog.textContent()).includes("Reviewed at"));
      assert.ok(!(await dialog.textContent()).includes("Invalid Date"));
      await page.getByRole("button", { name: "Close dialog", exact: true }).click();
      pass(`${type} reason, Creator/Reviewer and review time persist after browser reload and detail GET`);

      await page.locator("#post-video-status-filter").selectOption("APPROVED");
      const removeTitle = `IT ${type === "POST" ? "Post" : "Video"} PENDING`;
      await page.getByRole("searchbox").fill(removeTitle);
      const removeRow = page.getByRole("row").filter({ hasText: removeTitle });
      await removeRow.getByRole("button", { name: `Remove ${removeTitle}`, exact: true }).click();
      const [removed] = await Promise.all([patchResponse(type, 1), page.getByRole("button", { name: "Remove submission", exact: true }).click()]);
      assert.equal(removed.status(), 204);
      assert.deepEqual(removed.request().postDataJSON(), { status: "REMOVED" });
      await removeRow.waitFor({ state: "detached" });
      assert.equal((await context.request.get(`${manifest.api}/api/admin/posts-videos/${type}/1`)).status(), 404);
      pass(`${type} Remove still works without a rejection reason`);
    }

    await page.goto(`${base}/admin/posts-videos`);
    await page.getByRole("searchbox").fill("IT Page Post 3");
    const staleRow = page.getByRole("row").filter({ hasText: "IT Page Post 3" });
    await staleRow.getByRole("button", { name: "Approve IT Page Post 3", exact: true }).click();
    assert.equal((await context.request.patch(`${manifest.api}/api/admin/posts-videos/POST/8/status`, { data: { status: "APPROVED" } })).status(), 204);
    const [conflict] = await Promise.all([patchResponse("POST", 8), page.getByRole("button", { name: "Confirm approval", exact: true }).click()]);
    assert.equal(conflict.status(), 409);
    await page.getByRole("alert").waitFor();
    await page.getByText("No submissions found", { exact: true }).waitFor();
    pass("real stale decision returns 409, closes dialog and refreshes queue");

    const listPattern = `${manifest.api}/api/admin/posts-videos?**`;
    await context.route(listPattern, (route) => route.abort("failed"));
    await page.getByRole("button", { name: "Refresh submissions", exact: true }).click();
    await page.getByRole("alert").filter({ has: page.getByRole("button", { name: "Retry", exact: true }) }).waitFor();
    await context.unroute(listPattern);
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page.getByText("No submissions found", { exact: true }).waitFor();
    pass("network error state and successful Retry against real API");

    await login("user@admin-api-it.invalid");
    authenticated = false;
    await page.goto(`${base}/profile`);
    await page.getByRole("heading", { name: "My Posts", exact: true }).waitFor();
    await page.getByRole("button", { name: /^Rejected \(/ }).click();
    await page.getByRole("heading", { name: "IT Post REJECTED", exact: true }).waitFor();
    await page.getByText("Rejected", { exact: true }).waitFor();
    assert.ok(!(await page.locator("main").last().textContent()).includes("IT Post REMOVED"));
    assert.ok(!(await page.locator("main").last().textContent()).includes("IT Post DELETED"));
    assert.ok(!(await page.locator("main").last().textContent()).includes("IT Post PENDING"));
    await page.reload();
    await page.getByRole("heading", { name: "IT Post REJECTED", exact: true }).waitFor();
    await page.goto(`${base}/community`);
    await page.getByRole("heading", { name: "IT Page Post 3", exact: true }).waitFor();
    for (const title of ["IT Post REMOVED", "IT Post DELETED", "IT Post PENDING", "IT Post APPROVED", "IT Post REJECTED"]) {
      assert.equal(await page.getByRole("heading", { name: title, exact: true }).count(), 0);
    }
    pass("Community and Profile exclude REMOVED/DELETED after reload; REJECTED badge/filter matches API");
    await page.goto(`${base}/admin/posts-videos`);
    await page.waitForURL(`${base}/`);
    assert.equal((await context.request.post(`${manifest.api}/api/auth/logout`)).status(), 200);
    await page.goto(`${base}/admin/posts-videos`);
    await page.waitForURL(`${base}/login`);
    pass("USER and anonymous frontend authorization guards");
    assert.deepEqual(runtimeErrors, []);
    assert.ok(receipts.every((item) => item.status < 400 || item.status === 409));
  } finally {
    fs.writeFileSync(path.join(manifest.runDirectory, "moderation-browser-results.json"), JSON.stringify({ database: manifest.database, passed, runtimeErrors, receipts }, null, 2));
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
