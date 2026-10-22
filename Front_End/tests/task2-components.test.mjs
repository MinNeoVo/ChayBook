import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

process.env.VITE_API_BASE_URL = 'http://localhost:8082/api';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const originalFetch = globalThis.fetch;
after(async () => { globalThis.fetch = originalFetch; await server.close(); });

test('Input labels have unique linked IDs and accessible error text', async () => {
  const { default: Input } = await server.ssrLoadModule('/src/components/common/Input.jsx');
  const html = renderToStaticMarkup(React.createElement('form', null,
    React.createElement(Input, { label: 'First', error: 'Required' }),
    React.createElement(Input, { label: 'Second' }),
    React.createElement(Input, { id: 'explicit', label: 'Third' })));
  const ids = [...html.matchAll(/<input[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 3);
  for (const id of ids) assert.ok(html.includes(`for="${id}"`));
  assert.ok(html.includes(`aria-describedby="${ids[0]}-error"`));
  assert.ok(ids.includes('explicit'));
});

test('Media URLs use the configured API origin and preserve external/blob URLs', async () => {
  const { resolveMediaUrl } = await server.ssrLoadModule('/src/services/app.js');
  assert.equal(resolveMediaUrl('/uploads/avatar.png'), 'http://localhost:8082/uploads/avatar.png');
  assert.equal(resolveMediaUrl('https://example.com/a.png'), 'https://example.com/a.png');
  assert.equal(resolveMediaUrl('blob:local-preview'), 'blob:local-preview');
  assert.equal(resolveMediaUrl(null), null);
});

test('Related article service creates numeric page/size and reads Spring Page', async () => {
  let seen;
  globalThis.fetch = async (url, options) => { seen = { url, options }; return new Response(JSON.stringify({ content: [], number: 0 }), { status: 200 }); };
  const { getArticles } = await server.ssrLoadModule('/src/services/articleServices.js');
  assert.deepEqual((await getArticles(null, 0, 10, 'PUBLISHED')).content, []);
  assert.ok(seen.url.includes('page=0') && seen.url.includes('size=10'));
  assert.equal(seen.options.credentials, 'include');
});

test('Post Edit/Delete and password services use existing methods and JSON DTOs', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, ...options }); return new Response('{}', { status: 200 }); };
  const posts = await server.ssrLoadModule('/src/services/postServices.js');
  const users = await server.ssrLoadModule('/src/services/userServices.js');
  await posts.updatePost(2, { title: 'Updated' }); await posts.deletePost(2);
  await users.changePassword(2, { currentPassword: 'synthetic', newPassword: 'synthetic-new' });
  assert.deepEqual(calls.map((c) => c.method), ['PUT', 'DELETE', 'PUT']);
  assert.deepEqual(JSON.parse(calls[0].body), { title: 'Updated' });
  assert.ok(calls[2].url.endsWith('/users/2/password'));
});

test('AI request keeps conversation context and uses cookies without a spoofable guest header', async () => {
  let seen;
  globalThis.fetch = async (url, options) => { seen = { url, options }; return new Response(JSON.stringify({ content: 'Synthetic', conversationId: 7, messageId: 2 }), { status: 200 }); };
  const { sendAIMessage } = await server.ssrLoadModule('/src/services/aiAssistantService.js');
  const result = await sendAIMessage('Follow-up', 7);
  assert.equal(result.content, 'Synthetic');
  assert.deepEqual(JSON.parse(seen.options.body), { message: 'Follow-up', conversationId: 7 });
  assert.equal(seen.options.credentials, 'include');
  assert.equal(seen.options.headers['X-Guest-Id'], undefined);
});

test('API errors retain HTTP status and backend message', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Account disabled' }), { status: 403 });
  const { apiFetch } = await server.ssrLoadModule('/src/services/api.js');
  await assert.rejects(apiFetch('/users/me/profile'), (error) => error.status === 403 && error.message === 'Account disabled');
});
