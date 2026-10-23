/* UI/API contract regression using explicit fixtures. This does not verify
 * production Cloudinary credentials, SQL persistence, or server authorization. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.ADMIN_FRONTEND_URL || 'http://localhost:5181';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=', 'base64');
const cloudImage = 'https://res.cloudinary.com/fixture/image/upload/chaybook/recipe.png';
const pageOf = (items, page, size) => ({ items: items.slice(page * size, (page + 1) * size), page, size, totalElements: items.length, totalPages: Math.ceil(items.length / size) });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const errors = [];
  context.on('page', page => { page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message)); });
  const calls = [];
  const passes = [];
  const pass = name => { passes.push(name); console.log('PASS fixture: ' + name); };
  let failPublish = false;
  let uploadMode = 'success';
  let uploadUrl = cloudImage;
  let failSave = false;
  const article = { articleId: 1, categoryId: 1, createdBy: 1, title: 'Private draft', content: 'Full private draft content', status: 'DRAFT', coverImage: '', createdAt: '2026-01-01T12:00:00', updatedAt: '2026-01-01T12:00:00' };
  let articles = [article];
  const existing = { recipeId: 1, categoryId: 2, categoryName: 'Recipes', name: 'Existing soup', description: 'Soup', imageUrl: cloudImage, prepTime: 5, cookTime: 10, servings: 2, difficulty: 'Easy', instructions: 'Cook gently', calories: 250, protein: 12, carbs: null, fat: 5, status: 'ACTIVE', ingredients: [{ ingredientId: 1, name: 'Tofu', quantity: 100, unit: 'g' }] };
  let recipes = [existing, ...Array.from({ length: 11 }, (_, i) => ({ ...existing, recipeId: i + 10, name: 'Other soup ' + i }))];
  await context.route('https://res.cloudinary.com/**', route => route.fulfill({ contentType: 'image/png', body: png }));
  await context.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'Content-Type' };
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = request.headers()['content-type']?.includes('application/json') ? request.postDataJSON() : null;
    calls.push({ path, method, body, query: url.search });
    let data = null;
    let status = 200;
    if (path === '/auth/me') data = { userId: 1, username: 'fixture-admin', email: 'admin@fixture.invalid', role: 'ADMIN' };
    else if (path === '/admin/categories' || path === '/categories') data = [{ categoryId: 1, name: 'Articles', type: 'ARTICLE', status: 'ACTIVE' }, { categoryId: 2, name: 'Recipes', type: 'RECIPE', status: 'ACTIVE' }].filter(c => !url.searchParams.get('type') || c.type === url.searchParams.get('type'));
    else if (path === '/ingredients') data = [{ ingredientId: 1, name: 'Tofu' }];
    else if (path === '/media/upload') {
      assert.ok(request.postDataBuffer().includes(Buffer.from('name="file"')), 'reuse the existing multipart file field');
      await new Promise(resolve => setTimeout(resolve, 200));
      if (uploadMode === 'fail') { status = 502; data = { message: 'Fixture upload failed' }; }
      else data = { url: uploadMode === 'invalid' ? 'data:image/png;base64,fake' : uploadUrl, mediaType: uploadMode === 'video' ? 'video' : 'image', publicId: 'fixture/recipe' };
    } else if (path === '/admin/articles' && method === 'POST') {
      data = { ...article, ...body, articleId: 2 }; articles.push(data); status = 201;
    } else if (/^\/admin\/articles\/\d+$/.test(path)) {
      const item = articles.find(a => a.articleId === Number(path.split('/').pop()));
      if (method === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (failPublish) { status = 503; data = { message: 'Fixture publish failed' }; }
        else { Object.assign(item, body); data = item; }
      } else if (method === 'DELETE') { articles = articles.filter(a => a !== item); status = 204; }
      else data = item;
    } else if (path === '/admin/articles') {
      let items = articles.filter(a => (!url.searchParams.get('status') || a.status === url.searchParams.get('status')) && a.title.includes(url.searchParams.get('q') || ''));
      if (url.searchParams.get('sort') === 'newest') items = [...items].reverse();
      data = pageOf(items, Number(url.searchParams.get('page') || 0), Number(url.searchParams.get('size') || 6));
    } else if (path === '/articles') {
      const items = articles.filter(a => a.status === 'PUBLISHED');
      data = { ...pageOf(items, 0, 10), content: items };
    } else if (/^\/articles\/\d+$/.test(path)) {
      data = articles.find(a => a.articleId === Number(path.split('/').pop()) && a.status === 'PUBLISHED');
      if (!data) { status = 404; data = { message: 'Article not found' }; }
    } else if (path === '/admin/recipes' && method === 'POST') {
      if (failSave) { status = 503; data = { message: 'Fixture save failed' }; }
      else { data = { ...existing, ...body, recipeId: 2 }; recipes.unshift(data); status = 201; }
    } else if (/^\/admin\/recipes\/\d+$/.test(path)) {
      const item = recipes.find(r => r.recipeId === Number(path.split('/').pop()));
      if (method === 'PUT') Object.assign(item, body);
      if (method === 'DELETE') item.status = 'DELETED';
      data = item;
    } else if (path === '/admin/recipes') {
      data = pageOf(recipes.filter(r => r.name.includes(url.searchParams.get('keyword') || '')), Number(url.searchParams.get('page') || 0), Number(url.searchParams.get('size') || 10));
    }
    await route.fulfill({ status, headers: { ...headers, 'content-type': 'application/json' }, body: status === 204 ? undefined : JSON.stringify(data) });
  });
  const page = await context.newPage();
  const writes = path => calls.filter(c => c.path === path && ['POST', 'PUT'].includes(c.method));
  const uploads = () => calls.filter(c => c.path === '/media/upload').length;
  const choose = () => page.getByLabel('Ảnh công thức', { exact: true }).setInputFiles({ name: 'recipe.png', mimeType: 'image/png', buffer: png });
  const save = () => page.getByRole('button', { name: 'Lưu công thức', exact: true }).click();
  const fillRecipe = async name => {
    await page.getByLabel('Tên công thức').fill(name);
    await page.getByLabel('Danh mục', { exact: false }).selectOption('2');
    await page.getByLabel('Cách thực hiện').fill('Cook tofu gently');
    await page.getByLabel(/^Nguyên liệu/).selectOption('1');
    await page.getByLabel('Số lượng', { exact: true }).fill('100');
    await page.getByLabel('Đơn vị', { exact: true }).fill('g');
    await page.getByLabel('Protein (g)').fill('12');
  };
  try {
    await page.goto(base + '/admin/articles/new');
    await page.getByLabel('Tiêu đề', { exact: false }).fill('Created draft');
    await page.getByLabel('Danh mục', { exact: false }).selectOption('1');
    await page.getByLabel('Nội dung bài viết').fill('Full created draft');
    await page.getByRole('button', { name: 'Tạo bài viết', exact: true }).click();
    await page.waitForURL(base + '/admin/articles');
    await page.getByRole('heading', { name: 'Created draft', exact: true }).waitFor();
    assert.equal(articles.find(a => a.articleId === 2).status, 'DRAFT');
    pass('create Draft and keep it visible to Admin');

    await page.goto(base + '/admin/articles/1');
    failPublish = true;
    await page.getByRole('button', { name: 'Publish', exact: true }).evaluate(button => { button.click(); button.click(); });
    await page.getByText('Fixture publish failed', { exact: true }).waitFor();
    assert.equal(writes('/admin/articles/1').length, 1);
    assert.equal(article.status, 'DRAFT');
    failPublish = false;
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByText('Đã xuất bản bài viết thành công.', { exact: true }).waitFor();
    assert.equal(article.content, 'Full private draft content');
    assert.equal(article.status, 'PUBLISHED');
    assert.equal(await page.getByRole('button', { name: 'Publish', exact: true }).count(), 0);
    pass('Publish uses existing PUT; double-click guard, failure/retry, content and refreshed status');

    await page.goto(base + '/content');
    await page.getByText('Private draft', { exact: true }).waitFor();
    assert.equal(await page.getByText('Created draft', { exact: true }).count(), 0);
    await page.goto(base + '/content/2');
    await page.getByText(/Article not found/).first().waitFor();
    assert.equal(await page.getByText('Full created draft', { exact: true }).count(), 0);
    pass('User pages consume published lists and handle direct Draft 404 without content');

    await page.goto(base + '/admin/recipes/new');
    await fillRecipe('Created image soup');
    await choose();
    await page.getByAltText('Ảnh xem trước công thức').waitFor();
    assert.ok((await page.getByAltText('Ảnh xem trước công thức').getAttribute('src')).startsWith('blob:'));
    await page.getByRole('button', { name: 'Lưu công thức', exact: true }).evaluate(button => { button.click(); button.click(); });
    await page.getByRole('button', { name: 'Đang tải ảnh…', exact: true }).waitFor();
    await page.waitForURL(base + '/admin/recipes/2');
    assert.equal(uploads(), 1);
    assert.equal(writes('/admin/recipes').length, 1);
    const created = recipes.find(r => r.recipeId === 2);
    assert.equal(created.imageUrl, cloudImage);
    assert.equal(created.servings, 1);
    assert.equal(created.protein, 12);
    assert.equal(created.calories, null);
    pass('Recipe preview, one shared upload, Cloudinary URL and complete DTO on create');

    await page.goto(base + '/admin/recipes/1/edit');
    await page.getByLabel('Tên công thức').fill('Edited old image soup');
    await save();
    await page.waitForURL(base + '/admin/recipes/1');
    assert.equal(uploads(), 1);
    assert.equal(existing.imageUrl, cloudImage);
    assert.equal(existing.servings, 2);
    assert.equal(existing.calories, 250);
    assert.equal(existing.carbs, null);
    pass('Edit without image preserves existing URL, servings and nullable nutrition');

    await page.goto(base + '/admin/recipes/1/edit');
    const beforeFailedEdit = structuredClone(existing);
    const writesBeforeFailedEdit = writes('/admin/recipes/1').length;
    await page.getByLabel('Tên công thức').fill('Unsaved edit');
    uploadMode = 'fail';
    await choose();
    await save();
    await page.getByText('Fixture upload failed', { exact: true }).waitFor();
    assert.deepEqual(existing, beforeFailedEdit);
    assert.equal(writes('/admin/recipes/1').length, writesBeforeFailedEdit);
    assert.equal(await page.getByLabel('Tên công thức').inputValue(), 'Unsaved edit');
    await page.getByAltText('Ảnh xem trước công thức').waitFor();
    pass('Failed replacement upload preserves saved Recipe and unsaved form input');
    uploadMode = 'success';

    await page.goto(base + '/admin/recipes/1/edit');
    uploadUrl = 'https://res.cloudinary.com/fixture/image/upload/chaybook/replacement.png';
    await choose();
    await save();
    await page.waitForURL(base + '/admin/recipes/1');
    assert.equal(uploads(), 3);
    assert.equal(writes('/admin/recipes/1').length, 2);
    assert.equal(existing.imageUrl, uploadUrl);
    pass('Edit with replacement uses existing media upload before recipe update');

    await page.goto(base + '/admin/recipes/new');
    await fillRecipe('Failure soup');
    await page.getByLabel('Ảnh công thức', { exact: true }).setInputFiles({ name: 'bad.mp4', mimeType: 'video/mp4', buffer: png });
    await page.getByText('Vui lòng chọn file ảnh không rỗng, dung lượng tối đa 50 MB.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Lưu công thức', exact: true }).isDisabled(), true);
    await page.getByLabel('Ảnh công thức', { exact: true }).evaluate(input => {
      const files = new DataTransfer();
      files.items.add(new File([new Uint8Array(50 * 1024 * 1024 + 1)], 'too-large.png', { type: 'image/png' }));
      input.files = files.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert.equal(await page.getByRole('button', { name: 'Lưu công thức', exact: true }).isDisabled(), true);
    for (const mode of ['fail', 'invalid', 'video']) {
      uploadMode = mode;
      await choose();
      await save();
      await page.getByRole('alert').filter({ hasText: mode === 'fail' ? 'Fixture upload failed' : /Cloudinary/ }).waitFor();
      assert.equal(writes('/admin/recipes').length, 1);
    }
    uploadMode = 'success';
    failSave = true;
    await choose();
    await save();
    await page.getByText('Fixture save failed', { exact: true }).waitFor();
    const uploadedBeforeRetry = uploads();
    failSave = false;
    await save();
    await page.waitForURL(base + '/admin/recipes/2');
    assert.equal(uploads(), uploadedBeforeRetry);
    pass('Invalid files, upload failures and invalid media never save; failed save retries reuse uploaded image');

    await page.goto(base + '/admin/recipes');
    await page.getByRole('button', { name: 'Sau', exact: true }).click();
    await page.getByText(/Trang 2/).waitFor();
    await page.getByLabel('Tìm theo tên').fill('no-matching-recipe');
    await page.getByText('Không có công thức nào phù hợp với bộ lọc hiện tại.', { exact: true }).waitFor();
    assert.ok(calls.some(c => c.path === '/admin/recipes' && c.query.includes('page=1')));
    pass('Recipe search and pagination remain functional');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: passes.length, runtimeErrors: errors.length, provider: 'fixtures only' }));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
