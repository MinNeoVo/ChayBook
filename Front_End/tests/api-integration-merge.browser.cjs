/* Regression for the develop/API-integration merge. All business writes require
 * AdminTestDatabase's guarded, synthetic local database; external tiles are fixtures. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const manifest = JSON.parse(fs.readFileSync(process.env.ADMIN_TEST_MANIFEST, 'utf8'));
assert.match(manifest.database, /^ChayBook_AdminApi_IT_\d{8}_[a-f0-9]{8}$/);
assert.ok(manifest.url.includes(`databaseName=${manifest.database}`));
assert.match(manifest.adminEmail, /@admin-api-it\.invalid$/);
const api = manifest.api;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(api).hostname));
const base = process.env.ADMIN_FRONTEND_URL || 'http://localhost:5177';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=', 'base64');
const title = 'Integration vegetarian dish ' + Date.now().toString(36).replace(/\d/g, c => String.fromCharCode(97 + Number(c)));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const passes = [];
  const pass = label => { passes.push(label); console.log('PASS merge browser: ' + label); };
  const makeContext = async () => {
    const context = await browser.newContext({ permissions: ['geolocation'], geolocation: { latitude: 10.8, longitude: 106.7 } });
    context.on('page', page => { page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message)); });
    await context.route('https://res.cloudinary.com/**', route => route.fulfill({ contentType: 'image/png', body: png }));
    await context.route('https://maps.geoapify.com/**', route => route.fulfill({ contentType: 'image/png', body: png }));
    return context;
  };
  const login = async (context, email) => {
    const response = await context.request.post(api + '/api/auth/login', { data: { email, password: manifest.password } });
    assert.equal(response.status(), 200);
    const user = (await response.json()).user;
    assert.equal(user.email, email);
    return user;
  };
  const visit = async (page, path) => { await page.goto(base + path); await page.waitForLoadState('networkidle'); };
  const patch = (page, type, id) => page.waitForResponse(r => r.request().method() === 'PATCH' && r.url() === `${api}/api/admin/posts-videos/${type}/${id}/status`);
  const admin = await makeContext();
  const member = await makeContext();
  try {
    const adminUser = await login(admin, manifest.adminEmail);
    const memberUser = await login(member, 'user@admin-api-it.invalid');
    const upload = await member.request.post(api + '/api/media/upload', { multipart: { file: { name: 'meal.png', mimeType: 'image/png', buffer: png } } });
    assert.equal(upload.status(), 200);
    const mediaUrl = (await upload.json()).url;
    assert.match(mediaUrl, /^https:\/\/res\.cloudinary\.com\//);
    const create = async name => {
      const response = await member.request.post(api + '/api/posts', { multipart: { categoryId: '3', title: name, content: 'Fresh vegetables and tofu.', imageUrl: mediaUrl } });
      assert.equal(response.status(), 201);
      const data = await response.json();
      const id = data.post?.postId;
      assert.ok(Number.isInteger(id));
      return id;
    };
    const id = await create(title);
    const detailUrl = `${api}/api/admin/posts-videos/POST/${id}`;
    const detail = await (await admin.request.get(detailUrl)).json();
    assert.equal(detail.aiReason, 'Local integration moderation fixture');
    assert.equal(detail.moderationStatus, 'COMPLETED');
    pass('Cloudinary media URL persists through the existing post endpoint and unified AI moderation');

    const page = await admin.newPage();
    await visit(page, '/admin/posts-videos');
    await page.locator('#post-video-status-filter').selectOption('ALL');
    await page.getByRole('searchbox').fill(title);
    const row = page.getByRole('row').filter({ hasText: title });
    await row.waitFor();
    await row.getByRole('button', { name: `Xem bài viết ${title}`, exact: true }).click();
    await page.getByRole('dialog').getByText('Local integration moderation fixture', { exact: true }).waitFor();
    await page.getByRole('dialog').getByText('Độ tin cậy 50%', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();

    let patchCount = 0;
    page.on('request', request => { if (request.method() === 'PATCH' && request.url().endsWith(`/POST/${id}/status`)) patchCount++; });
    await row.getByRole('button', { name: `Approve ${title}`, exact: true }).click();
    const [approval] = await Promise.all([patch(page, 'POST', id), page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).evaluate(button => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })]);
    assert.equal(approval.status(), 204);
    await row.getByRole('button', { name: `Reject ${title}`, exact: true }).waitFor();
    assert.equal(patchCount, 1);
    const approvedDetail = await (await admin.request.get(detailUrl)).json();
    assert.equal(approvedDetail.reviewerId, adminUser.userId);
    assert.ok(approvedDetail.reviewedAt);
    await row.getByRole('button', { name: `Reject ${title}`, exact: true }).click();
    await page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
    await page.getByRole('alert').getByText('Please enter a rejection reason.', { exact: true }).waitFor();
    assert.equal(patchCount, 1);
    const reason = 'Nội dung cần bổ sung ngữ cảnh.';
    await page.getByRole('textbox', { name: /Lý do từ chối/ }).fill('  ' + reason + '  ');
    const [rejected] = await Promise.all([patch(page, 'POST', id), page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click()]);
    assert.equal(rejected.status(), 204);
    assert.deepEqual(rejected.request().postDataJSON(), { status: 'REJECTED', reason });
    await row.getByText('Admin reason: ' + reason, { exact: true }).waitFor();
    const rejectedDetail = await (await admin.request.get(detailUrl)).json();
    assert.equal(rejectedDetail.aiReason, detail.aiReason);
    assert.equal(rejectedDetail.adminReason, reason);
    pass('Admin AI evidence, reviewer audit, reason validation and double-submit guard');

    const videos = await (await admin.request.get(api + '/api/admin/posts-videos?type=VIDEO&status=PENDING&size=1')).json();
    assert.ok(videos.items.length);
    const video = videos.items[0];
    await page.getByRole('searchbox').fill(video.title);
    const videoRow = page.getByRole('row').filter({ hasText: video.title });
    await videoRow.getByRole('button', { name: `Approve ${video.title}`, exact: true }).click();
    let videoPatch = patch(page, 'VIDEO', video.id);
    await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
    assert.equal((await videoPatch).status(), 204);
    await videoRow.getByRole('button', { name: `Reject ${video.title}`, exact: true }).click();
    await page.getByRole('textbox', { name: /Lý do từ chối/ }).fill(reason);
    videoPatch = patch(page, 'VIDEO', video.id);
    await page.getByRole('button', { name: 'Xác nhận từ chối', exact: true }).click();
    assert.equal((await videoPatch).status(), 204);
    await videoRow.getByRole('button', { name: `Approve ${video.title}`, exact: true }).click();
    videoPatch = patch(page, 'VIDEO', video.id);
    await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click();
    assert.equal((await videoPatch).status(), 204);
    await videoRow.getByRole('button', { name: `Remove ${video.title}`, exact: true }).click();
    videoPatch = patch(page, 'VIDEO', video.id);
    await page.getByRole('button', { name: 'Gỡ bài gửi', exact: true }).click();
    assert.equal((await videoPatch).status(), 204);
    await videoRow.waitFor({ state: 'detached' });
    assert.equal((await admin.request.get(`${api}/api/admin/posts-videos/VIDEO/${video.id}`)).status(), 404);
    pass('Video moderation preserves approve/reject/reapprove/remove transitions and terminal-state hiding');

    const profileTitle = title + ' profile';
    const profileId = await create(profileTitle);
    assert.equal((await admin.request.patch(`${api}/api/admin/posts-videos/POST/${profileId}/status`, { data: { status: 'APPROVED' } })).status(), 204);
    const avatar = await member.request.post(api + '/api/users/me/avatar', { multipart: { file: { name: 'avatar.png', mimeType: 'image/png', buffer: png } } });
    assert.equal(avatar.status(), 200);
    const memberPage = await member.newPage();
    await visit(memberPage, '/profile');
    await memberPage.locator(`img[src="${mediaUrl}"]`).first().waitFor();
    const profileCard = memberPage.locator('article').filter({ hasText: profileTitle });
    await profileCard.getByRole('button', { name: 'Chỉnh sửa bài viết', exact: true }).click();
    const revised = profileTitle + ' revised';
    await memberPage.locator('#post-title').fill(revised);
    const editedResponse = memberPage.waitForResponse(r => r.request().method() === 'PUT' && r.url() === `${api}/api/posts/${profileId}`);
    await memberPage.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    assert.equal((await editedResponse).status(), 200);
    const afterEdit = await (await admin.request.get(`${api}/api/admin/posts-videos/POST/${profileId}`)).json();
    assert.equal(afterEdit.status, 'PENDING');
    const pendingCard = memberPage.locator('article').filter({ hasText: revised });
    await pendingCard.waitFor();
    memberPage.once('dialog', dialog => dialog.accept());
    const removedResponse = memberPage.waitForResponse(r => r.request().method() === 'DELETE' && r.url() === `${api}/api/posts/${profileId}`);
    await pendingCard.getByRole('button', { name: /Rút bài viết/ }).click();
    assert.equal((await removedResponse).status(), 200);
    await pendingCard.waitFor({ state: 'detached' });
    pass('Profile uses the shared edit form, preserves approved-post editing, withdraws pending posts and displays Cloudinary avatars');

    // Exercise the upstream OTP UI without sending email or changing a password.
    let passwordBody;
    await member.route(api + '/api/auth/forgot-password', route => route.fulfill({ json: { message: 'Synthetic OTP sent' } }));
    await member.route(api + '/api/auth/forgot-password/verify', route => route.fulfill({ json: { resetToken: 'synthetic-otp-token' } }));
    await member.route(`${api}/api/users/${memberUser.userId}/password`, route => {
      passwordBody = route.request().postDataJSON();
      return route.fulfill({ json: { message: 'Synthetic password update' } });
    });
    await memberPage.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
    await memberPage.getByRole('button', { name: /Gửi mã OTP/ }).click();
    await memberPage.getByLabel(/Mã OTP/).fill('123456');
    await memberPage.getByRole('button', { name: /Xác minh OTP/ }).click();
    await memberPage.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(manifest.password);
    await memberPage.getByLabel('Mật khẩu mới', { exact: true }).fill('Integration_New_Password');
    await memberPage.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('Integration_New_Password');
    await memberPage.getByRole('button', { name: /Cập nhật mật khẩu/ }).click();
    await memberPage.waitForURL(base + '/login');
    assert.equal(passwordBody.resetToken, 'synthetic-otp-token');
    assert.equal(passwordBody.email, memberUser.email);
    assert.equal(passwordBody.currentPassword, manifest.password);
    pass('One OTP password dialog sends the expected DTO and clears local auth after success');

    const guest = await makeContext();
    const home = await guest.newPage();
    await visit(home, '/');
    await home.locator('#featured-recipes a[href^="/content/"]').first().waitFor();
    await home.getByLabel('Hỏi AI về dinh dưỡng', { exact: true }).fill('Suggest a tofu meal');
    await home.getByRole('button', { name: 'Hỏi AI', exact: true }).click();
    await home.getByText('MOCK_AI: Plant-based answer from local test provider.', { exact: true }).waitFor();
    pass('Home renders API articles and calls the real chatbot integration instead of a hard-coded answer');

    let placeBody;
    await guest.route(api + '/api/shops/recommendations', route => {
      placeBody = route.request().postDataJSON();
      return route.fulfill({ json: { items: [{ placeId: 'integration-place', name: 'IT Mock Vegan Cafe', address: 'Test street', latitude: 10.8001, longitude: 106.7001, distanceMeters: 50, attributions: [{ provider: 'Geoapify fixture' }] }] } });
    });
    await login(guest, 'user@admin-api-it.invalid');
    await visit(home, '/places');
    await home.getByRole('heading', { name: 'IT Mock Vegan Cafe', exact: true }).waitFor();
    assert.equal(placeBody.source, 'SEARCH');
    assert.equal(placeBody.latitude, 10.8);
    assert.ok(placeBody.query);
    const radiusResponse = home.waitForResponse(response => response.url() === api + '/api/shops/recommendations'
      && response.request().method() === 'POST' && response.request().postDataJSON().radiusMeters === 5000);
    await home.getByRole('combobox', { name: 'Bán kính tìm kiếm' }).selectOption('5000');
    await radiusResponse;
    assert.equal(placeBody.radiusMeters, 5000);
    assert.equal(await home.locator('.places-interactive-map').count(), 1);
    pass('Places keeps geolocation, one cancellable search flow, radius changes and the upstream Leaflet map');

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: passes.length, runtimeErrors: errors.length }));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
