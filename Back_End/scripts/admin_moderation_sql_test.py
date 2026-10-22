"""Post/Video HTTP integration tests against AdminTestDatabase's isolated SQL database only."""
import json
import time
import unittest
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode

from admin_sql_api_test import ARTIFACTS, DATABASE, MANIFEST, RECEIPTS, client, login, request


def fixture(operation):
    java = os.environ["ADMIN_TEST_JAVA"]
    classpath = os.environ["ADMIN_TEST_CLASSPATH"]
    subprocess.run([java, "--class-path", classpath, "scripts/AdminTestDatabase.java", operation],
                   check=True, capture_output=True, text=True)


class AdminModerationSqlTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.admin, identity = login(MANIFEST["adminEmail"])
        assert identity["role"] == "ADMIN" and identity["email"] == MANIFEST["adminEmail"]
        cls.second_admin, identity = login("stale@admin-api-it.invalid")
        assert identity["role"] == "ADMIN" and identity["userId"] == 4
        cls.member, identity = login("user@admin-api-it.invalid")
        assert identity["role"] == "USER"

    def check(self, method, path, expected=200, body=None, session=None):
        code, payload, _ = request(session or self.admin, method, "/api/admin/posts-videos" + path, body)
        self.assertEqual(expected, code, f"{method} {path}: {payload}")
        return payload

    def test_01_filters_search_pagination_statistics_and_validation(self):
        page = self.check("GET", "?size=2")
        self.assertEqual((6, 3, 2), (page["totalElements"], page["totalPages"], len(page["items"])))
        next_page = self.check("GET", "?size=2&page=1")
        first_ids = {(item["type"], item["id"]) for item in page["items"]}
        self.assertTrue(first_ids.isdisjoint((item["type"], item["id"]) for item in next_page["items"]))
        for content_type in ("POST", "VIDEO"):
            filtered = self.check("GET", "?" + urlencode({"type": content_type, "status": "ALL"}))
            self.assertEqual(3, filtered["totalElements"])
            self.assertTrue(all(item["type"] == content_type for item in filtered["items"]))
            for status in ("PENDING", "APPROVED", "REJECTED"):
                result = self.check("GET", f"?type={content_type}&status={status}")
                self.assertEqual(1, result["totalElements"])
                self.assertEqual(status, result["items"][0]["status"])
        searched = self.check("GET", "?" + urlencode({"q": "IT Post PENDING"}))
        self.assertEqual(1, searched["totalElements"])
        self.assertEqual("POST", searched["items"][0]["type"])
        self.assertEqual(0, self.check("GET", "?q=no_such_moderation_item")["totalElements"])
        stats = self.check("GET", "/statistics")
        self.assertEqual((6, 2, 2, 2), tuple(stats[key] for key in (
            "totalSubmission", "pendingModeration", "approvedLive", "rejectedEntries")))
        for query in ("?page=-1", "?size=0", "?size=101", "?type=ARTICLE", "?status=INVALID"):
            self.check("GET", query, 400)

    def test_02_authorization_for_reads_and_writes(self):
        for session, expected in ((client(), 401), (self.member, 403)):
            for path in ("", "/statistics", "/POST/1", "/VIDEO/1"):
                self.check("GET", path, expected, session=session)
            for content_type in ("POST", "VIDEO"):
                for status in ("APPROVED", "REJECTED", "REMOVED"):
                    self.check("PATCH", f"/{content_type}/1/status", expected,
                               {"status": status, "reason": "Unauthorized feedback"}, session)

    def test_03_reject_requires_reason_without_changing_content(self):
        for content_type in ("POST", "VIDEO"):
            for reason in (None, "", "  \n\t "):
                body = {"status": "REJECTED"}
                if reason is not None:
                    body["reason"] = reason
                self.check("PATCH", f"/{content_type}/1/status", 400, body)
            detail = self.check("GET", f"/{content_type}/1")
            self.assertEqual("PENDING", detail["status"])
            for field in ("adminReason", "reviewerId", "reviewer", "reviewedAt"):
                self.assertIsNone(detail[field])

    def test_04_reject_and_approve_both_types_persist_with_authenticated_reviewer(self):
        fresh, _ = login(MANIFEST["adminEmail"])
        for content_type in ("POST", "VIDEO"):
            path = f"/{content_type}/1"
            reason = f"Nội dung {content_type} không phù hợp.\nVui lòng chỉnh sửa."
            self.check("PATCH", path + "/status", 204, {
                "status": "REJECTED", "reason": f"  {reason}  ", "reviewerId": 999,
            })
            detail = self.check("GET", path, session=fresh)
            self.assertEqual(("REJECTED", reason, 1, "IT Reviewer One"), (
                detail["status"], detail["adminReason"], detail["reviewerId"], detail["reviewer"]))
            self.assertEqual("IT Creator", detail["creator"])
            self.assertTrue(detail["reviewedAt"])
            if content_type == "POST":
                self.assertNotEqual(detail["aiReason"], detail["adminReason"])
            else:
                self.assertIsNone(detail["aiReason"])
            listed = self.check("GET", "?" + urlencode({"type": content_type, "status": "REJECTED", "q": f"IT {content_type.title()} PENDING"}), session=fresh)
            self.assertEqual(1, listed["totalElements"])
            for field in ("adminReason", "reviewerId", "reviewer", "reviewedAt"):
                self.assertEqual(detail[field], listed["items"][0][field])
            self.check("PATCH", path + "/status", 409, {"status": "REJECTED", "reason": reason})
            self.check("PATCH", path + "/status", 204, {"status": "APPROVED"}, self.second_admin)
            detail = self.check("GET", path, session=fresh)
            self.assertEqual("APPROVED", detail["status"])
            self.assertIsNone(detail["adminReason"])
            self.assertEqual((4, "IT Reviewer Two"), (detail["reviewerId"], detail["reviewer"]))
            self.assertTrue(detail["reviewedAt"])
        stats = self.check("GET", "/statistics")
        self.assertEqual((6, 0, 4, 2), tuple(stats[key] for key in (
            "totalSubmission", "pendingModeration", "approvedLive", "rejectedEntries")))

    def test_05_remove_and_missing_content_regression(self):
        for content_type in ("POST", "VIDEO"):
            self.check("PATCH", f"/{content_type}/2/status", 204, {"status": "REMOVED"})
            self.check("GET", f"/{content_type}/2", 404)
            self.check("PATCH", f"/{content_type}/2/status", 409, {"status": "APPROVED"})
        stats = self.check("GET", "/statistics")
        self.assertEqual(4, stats["totalSubmission"])
        self.assertEqual(4, self.check("GET", "")["totalElements"])
        self.check("GET", "/ARTICLE/1", 400)
        self.check("GET", "/POST/99999", 404)

    def test_06_terminal_states_owner_writes_and_admin_delete_bypass(self):
        for content_type in ("POST", "VIDEO"):
            for content_id in (4, 5):
                self.check("GET", f"/{content_type}/{content_id}", 404)
                for status in ("APPROVED", "REJECTED", "REMOVED"):
                    self.check("PATCH", f"/{content_type}/{content_id}/status", 409,
                               {"status": status, "reason": "Cannot restore"})
        for content_id in (2, 4, 5):
            for method in ("PUT", "DELETE"):
                code, _, _ = request(self.member, method, f"/api/posts/{content_id}",
                                     {"title": "Attempted restore"} if method == "PUT" else None)
                self.assertEqual(404, code)
            for method, suffix, body in (("GET", "/comments", None), ("POST", "/interactions", {"type": "LIKE"})):
                code, _, _ = request(self.member, method, f"/api/posts/{content_id}{suffix}", body)
                self.assertEqual(404, code)
        code, _, _ = request(self.admin, "DELETE", "/api/posts/1")
        self.assertEqual(403, code)
        code, profile, _ = request(self.member, "GET", "/api/users/me/profile")
        self.assertEqual(200, code)
        self.assertEqual({1, 3}, {post["postId"] for post in profile["posts"]})
        code, feed, _ = request(self.member, "GET", "/api/posts?size=100")
        self.assertEqual(200, code)
        self.assertEqual({1}, {post["postId"] for post in feed["items"]})

    def test_07_disabled_admin_existing_jwt_cannot_read_or_write(self):
        fixture("stale-admin-disabled")
        try:
            for path in ("", "/statistics", "/POST/1", "/VIDEO/1"):
                self.check("GET", path, 403, session=self.second_admin)
            for content_type in ("POST", "VIDEO"):
                for status in ("APPROVED", "REJECTED", "REMOVED"):
                    self.check("PATCH", f"/{content_type}/1/status", 403,
                               {"status": status, "reason": "Disabled admin"}, self.second_admin)
        finally:
            fixture("stale-admin-active")

    def test_08_concurrent_duplicate_decisions_and_rejected_resubmission(self):
        fixture("pagination-fixtures")
        for content_type in ("POST", "VIDEO"):
            # Two separate logged-in sessions race for the same PENDING row.
            sessions = (self.admin, self.second_admin)
            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(lambda session: request(session, "PATCH",
                    f"/api/admin/posts-videos/{content_type}/6/status", {"status": "APPROVED"})[0], sessions))
            self.assertEqual([204, 409], sorted(responses))
            self.assertIn(self.check("GET", f"/{content_type}/6")["reviewerId"], (1, 4))
        self.check("PATCH", "/POST/7/status", 204, {"status": "REJECTED", "reason": "Resubmission feedback"})
        code, _, _ = request(self.member, "PUT", "/api/posts/7", {"title": "IT Page Post 2 revised"})
        self.assertEqual(200, code)
        detail = self.check("GET", "/POST/7")
        self.assertEqual("PENDING", detail["status"])
        for field in ("adminReason", "reviewerId", "reviewer", "reviewedAt"):
            self.assertIsNone(detail[field])
        self.assertGreaterEqual(self.check("GET", "?status=PENDING")["totalPages"], 2)


if __name__ == "__main__":
    try:
        unittest.main(verbosity=2)
    finally:
        (ARTIFACTS / DATABASE / f"moderation-http-receipts-{time.time_ns()}.json").write_text(
            json.dumps(RECEIPTS, indent=2), encoding="utf-8")
