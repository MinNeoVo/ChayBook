"""Real HTTP CRUD tests, opt-in ONLY against AdminTestDatabase's private SQL DB.
No fixtures intercept HTTP; credentials and target come from its ignored manifest.
Run from Back_End: python scripts/admin_sql_api_test.py
"""
import base64
import http.cookiejar
import json
import os
import re
import subprocess
import time
import unittest
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ARTIFACTS = Path("target/admin-verification")
DATABASE = (ARTIFACTS / "latest-test-db.txt").read_text().strip()
if not re.fullmatch(r"ChayBook_AdminApi_IT_\d{8}_[a-f0-9]{8}", DATABASE):
    raise RuntimeError("Refusing an application database or unrecognized manifest")
MANIFEST = json.loads((ARTIFACTS / DATABASE / "test-manifest.json").read_text())
if MANIFEST["database"] != DATABASE or f"databaseName={DATABASE}" not in MANIFEST["url"]:
    raise RuntimeError("Isolated database URL mismatch")
if urllib.parse.urlparse(MANIFEST["api"]).hostname not in ("localhost", "127.0.0.1"):
    raise RuntimeError("Integration writes must target localhost")
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=")
RECEIPTS = []


def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def request(session, method, path, body=None, raw=None, content_type=None):
    headers = {"Origin": "http://localhost:5173"}
    data = raw
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode()
        headers["Content-Type"] = "application/json"
    if content_type:
        headers["Content-Type"] = content_type
    url = MANIFEST["api"] + path
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        response = session.open(req, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        payload = response.read()
        try:
            result = json.loads(payload) if payload else None
        except (ValueError, UnicodeDecodeError):
            result = payload
        RECEIPTS.append({"method": method, "endpoint": path, "status": response.status})
        return response.status, result, dict(response.headers)


def login(email):
    session = client()
    code, result, _ = request(session, "POST", "/api/auth/login", {"email": email, "password": MANIFEST["password"]})
    if code != 200:
        raise AssertionError(f"Synthetic login failed ({code}); business writes were not authorized")
    return session, result["user"]


def multipart(data, filename="cover.png", mime="image/png"):
    boundary = "ChayBookAdminIntegrationBoundary"
    raw = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {mime}\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()
    return raw, f"multipart/form-data; boundary={boundary}"


class AdminSqlApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.admin, identity = login(MANIFEST["adminEmail"])
        assert identity["role"] == "ADMIN" and identity["email"].endswith("@admin-api-it.invalid")
        code, current, _ = request(cls.admin, "GET", "/api/auth/me")
        assert code == 200 and current["email"] == MANIFEST["adminEmail"]
        cls.user, identity = login("user@admin-api-it.invalid")
        assert identity["role"] == "USER"

    def check(self, session, method, path, expected=200, **kwargs):
        code, body, headers = request(session, method, path, **kwargs)
        self.assertEqual(expected, code, f"{method} {path}: {body}")
        return body, headers

    def test_01_dashboard_reads_persisted_statistics(self):
        users, headers = self.check(self.admin, "GET", "/api/admin/users/statistics")
        self.assertEqual(14, users["totalAccounts"])
        self.assertEqual("http://localhost:5173", headers.get("Access-Control-Allow-Origin"))
        rate, _ = self.check(self.admin, "GET", "/api/admin/dashboard/statistics/interaction-rate")
        self.assertEqual(1, rate["totalApprovedPosts"])
        self.assertEqual(100, rate["ratePercent"])
        messages, _ = self.check(self.admin, "GET", "/api/admin/dashboard/statistics/ai-messages")
        self.assertEqual(2, messages["totalMessages"])
        for days in (7, 30):
            chart, _ = self.check(self.admin, "GET", f"/api/admin/dashboard/statistics/interactions?days={days}")
            self.assertEqual(days, len(chart["items"]))
            self.assertEqual(3, sum(item["totalCount"] for item in chart["items"]))
        contributors, _ = self.check(self.admin, "GET", "/api/admin/dashboard/statistics/top-contributors")
        self.assertEqual(2, contributors["items"][0]["userId"])

    def test_02_real_anonymous_and_user_authorization(self):
        anonymous = client()
        paths = ["/api/admin/users", "/api/admin/articles", "/api/admin/recipes", "/api/admin/posts-videos", "/api/admin/dashboard/statistics/ai-messages"]
        for path in paths:
            self.check(anonymous, "GET", path, 401)
            self.check(self.user, "GET", path, 403)
        for method, path, body in [
            ("POST", "/api/admin/articles", {}), ("PUT", "/api/admin/articles/1", {}),
            ("DELETE", "/api/admin/articles/1", None), ("POST", "/api/admin/recipes", {}),
            ("PUT", "/api/admin/recipes/1", {}), ("DELETE", "/api/admin/recipes/1", None),
            ("PATCH", "/api/admin/users/16/status", {"status": "DISABLED"}),
            ("PATCH", "/api/admin/posts-videos/POST/1/status", {"status": "APPROVED"}),
        ]:
            self.check(self.user, method, path, 403, body=body)
        raw, content_type = multipart(PNG)
        self.check(self.user, "POST", "/api/admin/articles/images", 403, raw=raw, content_type=content_type)

    def test_03_users_block_unblock_persistence_and_role_protection(self):
        page, _ = self.check(self.admin, "GET", "/api/admin/users?page=0&size=10")
        self.assertEqual(14, page["totalElements"])
        self.assertEqual(2, page["totalPages"])
        self.assertTrue(all(item["userId"] not in (1, 4) for item in page["items"]))
        self.check(self.admin, "PATCH", "/api/admin/users/1/status", 403, body={"status": "DISABLED"})
        self.check(self.admin, "PATCH", "/api/admin/users/16/status", 400, body={"status": "ADMIN"})
        self.check(self.admin, "PATCH", "/api/admin/users/16/status", body={"status": "DISABLED"})
        page, _ = self.check(self.admin, "GET", "/api/admin/users?page=0&size=10")
        self.assertEqual("DISABLED", next(item for item in page["items"] if item["userId"] == 16)["status"])
        self.check(client(), "POST", "/api/auth/login", 403, body={"email": "member16@admin-api-it.invalid", "password": MANIFEST["password"]})
        self.check(self.admin, "PATCH", "/api/admin/users/16/status", body={"status": "ACTIVE"})
        refreshed, identity = login(MANIFEST["adminEmail"])
        self.assertEqual("ADMIN", identity["role"])
        page, _ = self.check(refreshed, "GET", "/api/admin/users")
        self.assertEqual("ACTIVE", next(item for item in page["items"] if item["userId"] == 16)["status"])

    def test_04_article_crud_sort_validation_and_image_storage(self):
        raw, content_type = multipart(PNG)
        image, _ = self.check(self.admin, "POST", "/api/admin/articles/images", 201, raw=raw, content_type=content_type)
        url = image["coverImage"]
        self.assertRegex(url, r"^/api/article-images/[a-f0-9-]{36}\.png$")
        self.assertTrue((Path(MANIFEST["runDirectory"]) / "uploads/articles" / url.rsplit("/", 1)[1]).is_file())
        binary, headers = self.check(client(), "GET", url)
        self.assertEqual(PNG, binary)
        self.assertEqual("image/png", headers.get("Content-Type"))
        self.assertEqual("nosniff", headers.get("X-Content-Type-Options"))
        raw, content_type = multipart(b"<svg>not an image</svg>", "fake.png")
        self.check(self.admin, "POST", "/api/admin/articles/images", 400, raw=raw, content_type=content_type)
        raw, content_type = multipart(b"x" * (5 * 1024 * 1024 + 1))
        self.check(self.admin, "POST", "/api/admin/articles/images", 413, raw=raw, content_type=content_type)
        body = {"categoryId": 1, "title": "Bài viết kiểm thử", "content": "Nội dung thật tiếng Việt", "coverImage": url, "status": "DRAFT"}
        self.check(self.admin, "POST", "/api/admin/articles", 400, body={**body, "title": ""})
        created, headers = self.check(self.admin, "POST", "/api/admin/articles", 201, body=body)
        identifier = created["articleId"]
        self.assertEqual(body["title"], created["title"])
        endpoint = f"/api/admin/articles/{identifier}"
        self.assertTrue(headers["Location"].endswith(str(identifier)))
        actual, _ = self.check(self.admin, "GET", endpoint)
        self.assertEqual(body["content"], actual["content"])
        newest, _ = self.check(self.admin, "GET", "/api/admin/articles?sort=newest&size=6")
        self.assertEqual(identifier, newest["items"][0]["articleId"])
        oldest, _ = self.check(self.admin, "GET", "/api/admin/articles?sort=oldest&size=6")
        self.assertEqual(1, oldest["items"][0]["articleId"])
        self.check(self.admin, "GET", "/api/admin/articles?sort=unsupported", 400)
        self.check(self.admin, "PUT", endpoint, body={**body, "title": "Updated SQL article", "status": "PUBLISHED"})
        fresh, _ = login(MANIFEST["adminEmail"])
        actual, _ = self.check(fresh, "GET", endpoint)
        self.assertEqual("Updated SQL article", actual["title"])
        self.assertEqual("PUBLISHED", actual["status"])
        filtered, _ = self.check(fresh, "GET", "/api/admin/articles?q=Updated%20SQL&status=PUBLISHED&categoryId=1")
        self.assertEqual(1, filtered["totalElements"])
        self.check(self.admin, "DELETE", endpoint, 204)
        self.check(fresh, "GET", endpoint, 404)

    def test_05_recipes_crud_ingredients_search_pagination_and_rollback(self):
        page, _ = self.check(self.admin, "GET", "/api/admin/recipes?page=1&size=10&keyword=IT%20Recipe")
        self.assertEqual(12, page["totalElements"])
        self.assertEqual(2, len(page["items"]))
        body = {"categoryId": 2, "name": "SQL test recipe", "description": "Test", "imageUrl": "/uploads/posts/fixture.png", "prepTime": 5, "cookTime": 10, "instructions": "Cook", "ingredients": [{"ingredientId": 1, "quantity": 100, "unit": "g"}, {"ingredientId": 2, "quantity": 50, "unit": "g"}]}
        self.check(self.admin, "POST", "/api/admin/recipes", 400, body={**body, "prepTime": -1})
        self.check(self.admin, "POST", "/api/admin/recipes", 400, body={**body, "ingredients": [body["ingredients"][0]] * 2})
        self.check(self.admin, "POST", "/api/admin/recipes", 404, body={**body, "ingredients": [{"ingredientId": 99999, "quantity": 1, "unit": "g"}]})
        before, _ = self.check(self.admin, "GET", "/api/admin/recipes?keyword=SQL%20test")
        self.assertEqual(0, before["totalElements"])
        created, _ = self.check(self.admin, "POST", "/api/admin/recipes", 201, body=body)
        endpoint = f"/api/admin/recipes/{created['recipeId']}"
        actual, _ = self.check(self.admin, "GET", endpoint)
        self.assertEqual(2, len(actual["ingredients"]))
        updated = {**body, "name": "Updated SQL recipe", "ingredients": [{"ingredientId": 2, "quantity": 75, "unit": "g"}]}
        self.check(self.admin, "PUT", endpoint, body=updated)
        fresh, _ = login(MANIFEST["adminEmail"])
        actual, _ = self.check(fresh, "GET", endpoint)
        self.assertEqual("Updated SQL recipe", actual["name"])
        self.assertEqual([2], [item["ingredientId"] for item in actual["ingredients"]])
        self.assertEqual(75, actual["ingredients"][0]["quantity"])
        self.check(self.admin, "DELETE", endpoint)
        actual, _ = self.check(fresh, "GET", endpoint)
        self.assertEqual("DELETED", actual["status"])
        self.check(self.admin, "PUT", endpoint, 409, body=updated)
        self.check(client(), "GET", endpoint.replace("/admin/", "/"), 404)

    def test_06_moderation_status_transitions_full_detail_and_persistence(self):
        post, _ = self.check(self.admin, "GET", "/api/admin/posts-videos/POST/1")
        self.assertGreater(len(post["description"]), 500)
        self.assertIn("tiếng Việt", post["description"])
        self.check(self.admin, "PATCH", "/api/admin/posts-videos/VIDEO/1/status", 204, body={"status": "APPROVED"})
        video, _ = self.check(self.admin, "GET", "/api/admin/posts-videos/VIDEO/1")
        post, _ = self.check(self.admin, "GET", "/api/admin/posts-videos/POST/1")
        self.assertEqual("APPROVED", video["status"])
        self.assertEqual("PENDING", post["status"])
        self.check(self.admin, "PATCH", "/api/admin/posts-videos/POST/1/status", 204, body={"status": "REJECTED"})
        fresh, _ = login(MANIFEST["adminEmail"])
        post, _ = self.check(fresh, "GET", "/api/admin/posts-videos/POST/1")
        self.assertEqual("REJECTED", post["status"])
        self.check(self.admin, "PATCH", "/api/admin/posts-videos/POST/1/status", 409, body={"status": "REJECTED"})
        self.check(self.admin, "PATCH", "/api/admin/posts-videos/POST/1/status", 400, body={"status": "INVALID"})
        self.check(self.admin, "GET", "/api/admin/posts-videos/ARTICLE/1", 400)
        self.check(self.admin, "GET", "/api/admin/posts-videos/POST/99999", 404)
        self.check(self.admin, "PATCH", "/api/admin/posts-videos/VIDEO/1/status", 204, body={"status": "REMOVED"})
        self.check(fresh, "GET", "/api/admin/posts-videos/VIDEO/1", 404)
        statistics, _ = self.check(fresh, "GET", "/api/admin/posts-videos/statistics")
        page, _ = self.check(fresh, "GET", "/api/admin/posts-videos?type=ALL&status=ALL")
        self.assertEqual(5, statistics["totalSubmission"])
        self.assertEqual(statistics["totalSubmission"], page["totalElements"])

    def test_07_public_read_regression(self):
        anonymous = client()
        first, _ = self.check(anonymous, "GET", "/api/recipes?page=0&size=10")
        second, _ = self.check(anonymous, "GET", "/api/recipes?page=1&size=10")
        self.assertEqual(12, first["totalElements"])
        self.assertEqual(10, len(first["content"]))
        self.assertEqual(2, len(second["content"]))
        self.assertEqual(0, first["number"])
        self.check(anonymous, "GET", "/api/recipes/1")
        self.check(anonymous, "GET", "/api/articles")
        self.check(anonymous, "GET", "/api/articles/1")
        feed, _ = self.check(self.user, "GET", "/api/posts")
        self.assertTrue(all(item["status"] == "APPROVED" for item in feed["items"]))

    def test_08_disabled_admin_is_denied_even_with_preexisting_valid_cookie(self):
        java = os.environ.get("ADMIN_TEST_JAVA")
        classpath = os.environ.get("ADMIN_TEST_CLASSPATH")
        if not java or not classpath:
            self.skipTest("Set ADMIN_TEST_JAVA and ADMIN_TEST_CLASSPATH for synthetic DB fixture updates")
        def fixture(operation):
            subprocess.run([java, "--class-path", classpath, "scripts/AdminTestDatabase.java", operation], check=True, capture_output=True, text=True)
        fixture("stale-admin-active")
        stale, _ = login("stale@admin-api-it.invalid")
        try:
            fixture("stale-admin-disabled")
            for path in ["/api/admin/users", "/api/admin/articles", "/api/admin/recipes", "/api/admin/posts-videos", "/api/admin/dashboard/statistics/ai-messages"]:
                self.check(stale, "GET", path, 403)
        finally:
            fixture("stale-admin-active")


if __name__ == "__main__":
    try:
        unittest.main(verbosity=2)
    finally:
        (ARTIFACTS / DATABASE / f"http-receipts-{time.time_ns()}.json").write_text(json.dumps(RECEIPTS, indent=2))
