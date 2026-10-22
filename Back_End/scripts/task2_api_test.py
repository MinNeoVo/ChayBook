"""Real API integration, synthetic data in a guarded isolated SQL database.
Gemini must point at task2_mock_provider.py; no external provider calls.
"""
import json
import time
import unittest
from urllib.parse import urlencode
from admin_sql_api_test import ARTIFACTS, DATABASE, MANIFEST, RECEIPTS, client, login, request
from admin_moderation_sql_test import fixture

STATE = {}

class Task2ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.admin, identity = login(MANIFEST["adminEmail"])
        assert identity["role"] == "ADMIN" and identity["email"].endswith("@admin-api-it.invalid")
        cls.member, _ = login("user@admin-api-it.invalid")
        cls.other, _ = login("member16@admin-api-it.invalid")

    def check(self, method, path, expected=200, body=None, session=None):
        code, payload, headers = request(session or self.admin, method, path, body)
        self.assertEqual(expected, code, f"{method} {path}: {payload}")
        return payload

    def test_01_recipe_contract_validation_and_nutrition_persistence(self):
        body = {"categoryId": 2, "name": "IT Task2 Recipe", "description": "Integration", "imageUrl": "",
                "prepTime": 5, "cookTime": 10, "servings": 3, "difficulty": "Medium", "instructions": "Cook",
                "calories": 234.5, "protein": 12.25, "carbs": 30.5, "fat": 7.75,
                "ingredients": [{"ingredientId": 1, "quantity": 123.5, "unit": "g"}]}
        for field, value in (("servings", None), ("servings", -1), ("servings", 1.5), ("difficulty", ""),
                             ("calories", -1), ("protein", -1), ("prepTime", 1.5)):
            self.check("POST", "/api/admin/recipes", 400, {**body, field: value})
        saved = self.check("POST", "/api/admin/recipes", 201, body)
        STATE["recipeId"] = saved["recipeId"]
        path = f"/api/admin/recipes/{saved['recipeId']}"
        updated = {**body, "name": "IT Task2 Recipe revised"}
        self.check("PUT", path, body=updated)
        actual = self.check("GET", path)
        for key in ("servings", "difficulty", "calories", "protein", "carbs", "fat"):
            self.assertEqual(body[key], actual[key])
        self.assertEqual(123.5, actual["ingredients"][0]["quantity"])
        self.check("DELETE", path)
        self.check("GET", path.replace("/admin/", "/"), 404, session=client())
        optional = self.check("POST", "/api/admin/recipes", 201,
                              {**body, "name": "IT Optional Nutrition", **dict.fromkeys(("calories", "protein", "carbs", "fat"))})
        self.assertIsNone(optional["calories"])
        self.check("DELETE", f"/api/admin/recipes/{optional['recipeId']}")

    def test_02_public_article_draft_security_list_detail_and_admin_crud(self):
        body = {"categoryId": 1, "title": "IT Task2 Hidden Draft", "content": "Unpublished secret test text", "coverImage": "", "status": "DRAFT"}
        saved = self.check("POST", "/api/admin/articles", 201, body)
        identifier = saved["articleId"]; STATE["draftId"] = identifier
        for session in (client(), self.member):
            self.check("GET", f"/api/articles/{identifier}", 404, session=session)
            for query in ("", "?categoryId=1", "?status=PUBLISHED", "?status=DRAFT", "?page=1&size=2"):
                page = self.check("GET", "/api/articles" + query, session=session)
                self.assertTrue(all(item["status"] == "PUBLISHED" for item in page["content"]))
                self.assertNotIn(identifier, [item["articleId"] for item in page["content"]])
        self.check("GET", f"/api/admin/articles/{identifier}")
        self.check("PUT", f"/api/admin/articles/{identifier}", body={**body, "status": "PUBLISHED"})
        self.check("GET", f"/api/articles/{identifier}", session=client())
        self.check("PUT", f"/api/admin/articles/{identifier}", body=body)
        self.check("GET", f"/api/articles/{identifier}", 404, session=client())

    def test_03_disabled_existing_jwt_block_unblock_and_public_routes(self):
        self.check("PATCH", "/api/admin/users/2/status", body={"status": "DISABLED"})
        try:
            for path in ("/api/auth/me", "/api/users/me/profile", "/api/users/2/bmi", "/api/meal-plans", "/api/users/me/allergies", "/api/chatbot/conversations"):
                self.check("GET", path, 403, session=self.member)
            for path, body in (("/api/bmi", {"height": 170, "weight": 65}), ("/api/chatbot/messages", {"message": "Must not reach AI"}), ("/api/meal-plans", {"healthGoal": "MAINTAIN"})):
                self.check("POST", path, 403, body, self.member)
            self.check("GET", "/api/articles", session=self.member)
            self.check("POST", "/api/auth/login", 403, {"email": "user@admin-api-it.invalid", "password": MANIFEST["password"]}, client())
        finally:
            self.check("PATCH", "/api/admin/users/2/status", body={"status": "ACTIVE"})
        self.check("GET", "/api/users/me/profile", session=self.member)

    def test_04_profile_post_edit_delete_ownership_and_terminal_states(self):
        self.check("PUT", "/api/posts/1", 403, {"title": "Other user's post"}, self.other)
        self.check("PUT", "/api/posts/1", body={"title": "IT Task Edited Post", "content": "Edited content"}, session=self.member)
        detail = self.check("GET", "/api/admin/posts-videos/POST/1")
        self.assertEqual(("IT Task Edited Post", "PENDING"), (detail["title"], detail["status"]))
        for identifier in (4, 5):
            self.check("PUT", f"/api/posts/{identifier}", 404, {"title": "Cannot restore"}, self.member)
            self.check("DELETE", f"/api/posts/{identifier}", 404, session=self.member)
        self.check("DELETE", "/api/posts/1", 403, session=self.other)
        self.check("DELETE", "/api/posts/1", session=self.member)
        profile = self.check("GET", "/api/users/me/profile", session=self.member)
        self.assertNotIn(1, [post["postId"] for post in profile["posts"]])

    def test_05_change_password_wrong_valid_ownership_and_relogin(self):
        session, _ = login("member16@admin-api-it.invalid")
        path = "/api/users/16/password"
        self.check("PUT", path, 400, {"currentPassword": "wrong", "newPassword": "IT_New_Password_2026"}, session)
        self.check("PUT", path, 400, {"currentPassword": MANIFEST["password"], "newPassword": "short"}, session)
        self.check("PUT", "/api/users/15/password", 403, {"currentPassword": MANIFEST["password"], "newPassword": "IT_New_Password_2026"}, session)
        self.check("PUT", path, body={"currentPassword": MANIFEST["password"], "newPassword": "IT_New_Password_2026"}, session=session)
        self.check("GET", "/api/auth/me", 401, session=session)
        self.check("POST", "/api/auth/login", 401, {"email": "member16@admin-api-it.invalid", "password": MANIFEST["password"]}, client())
        updated = client()
        self.check("POST", "/api/auth/login", body={"email": "member16@admin-api-it.invalid", "password": "IT_New_Password_2026"}, session=updated)
        self.check("PUT", path, body={"currentPassword": "IT_New_Password_2026", "newPassword": MANIFEST["password"]}, session=updated)

    def test_06_community_sort_pagination_interaction_and_comments(self):
        fixture("pagination-fixtures")
        for identifier in (6, 7, 8):
            self.check("PATCH", f"/api/admin/posts-videos/POST/{identifier}/status", 204, {"status": "APPROVED"})
        for sort in ("latest", "top", "discussed"):
            first = self.check("GET", f"/api/posts?sort={sort}&size=1", session=self.member)
            second = self.check("GET", f"/api/posts?sort={sort}&size=1&page=1", session=self.member)
            self.assertNotEqual(first["items"][0]["postId"], second["items"][0]["postId"])
        self.check("POST", "/api/posts/7/interactions", body={"type": "LIKE"}, session=self.member)
        self.check("POST", "/api/posts/7/interactions", body={"type": "BOOKMARK"}, session=self.member)
        top = self.check("GET", "/api/posts?sort=top&size=1", session=self.member)
        self.assertEqual(7, top["items"][0]["postId"])
        self.assertTrue(top["items"][0]["likedByCurrentUser"] and top["items"][0]["bookmarkedByCurrentUser"])
        self.check("DELETE", "/api/posts/7/interactions?type=LIKE", session=self.member)
        self.check("DELETE", "/api/posts/7/interactions?type=BOOKMARK", session=self.member)
        comment = self.check("POST", "/api/posts/8/comments", 201, {"content": "IT Task2 comment"}, self.member)
        STATE["commentResponse"] = comment
        self.check("GET", "/api/posts/8/comments", session=self.member)

    def test_07_ai_guest_ownership_history_context_and_failure_rollback(self):
        a, b = client(), client()
        reply = self.check("POST", "/api/chatbot/messages", body={"message": "Remember red lentils"}, session=a)
        self.assertTrue(reply["content"].startswith("MOCK_AI:"))
        identifier = reply["conversationId"]
        self.check("POST", "/api/chatbot/messages", 403, {"message": "Steal", "conversationId": identifier}, b)
        self.check("POST", "/api/chatbot/messages", 403, {"message": "Claim guest", "conversationId": identifier}, self.member)
        self.check("POST", "/api/chatbot/messages", body={"message": "What did I avoid?", "conversationId": identifier}, session=a)
        history = self.check("GET", "/api/chatbot/conversations", session=self.member)
        self.check("POST", "/api/chatbot/messages", 502, {"message": "FAIL_PROVIDER"}, self.member)
        self.assertEqual(len(history), len(self.check("GET", "/api/chatbot/conversations", session=self.member)))
        owned = self.check("POST", "/api/chatbot/messages", body={"message": "Remember tofu curry"}, session=self.member)
        self.check("POST", "/api/chatbot/messages", body={"message": "Follow-up", "conversationId": owned["conversationId"]}, session=self.member)
        self.check("GET", f"/api/chatbot/conversations/{owned['conversationId']}/messages", 404, session=self.other)
        messages = self.check("GET", f"/api/chatbot/conversations/{owned['conversationId']}/messages", session=self.member)
        self.assertEqual(4, len(messages))
        self.assertEqual("Remember tofu curry", messages[0]["message"])
        prompts = [json.loads(line)["prompt"] for line in (ARTIFACTS / "task2-mock-prompts.jsonl").read_text(encoding="utf-8").splitlines()]
        self.assertTrue(any("USER: Remember tofu curry" in prompt and "Follow-up" in prompt for prompt in prompts))

    def test_08_bmi_mealplan_allergies_persistence_and_ownership(self):
        self.check("POST", "/api/bmi", body={"height": 170, "weight": 65, "userId": 999}, session=self.member)
        latest = self.check("GET", "/api/users/2/bmi/latest", session=self.member)
        self.assertAlmostEqual(22.49, latest["bmi"], places=2)
        self.check("GET", "/api/users/2/bmi/latest", 403, session=self.other)
        plan = self.check("POST", "/api/meal-plans", 201, {"healthGoal": "MAINTAIN", "durationDays": 7}, self.member)
        self.assertEqual(21, len(plan["items"]))
        self.check("GET", f"/api/meal-plans/{plan['mealPlanId']}", session=self.member)
        self.check("GET", f"/api/meal-plans/{plan['mealPlanId']}", 404, session=self.other)
        self.check("PUT", "/api/users/me/allergies", body={"allergyIds": []}, session=self.member)
        self.assertEqual([], self.check("GET", "/api/users/me/allergies", session=self.member))

    def test_09_places_disabled_provider_is_explicit_503(self):
        self.check("POST", "/api/shops/recommendations", 503, {"source": "SEARCH", "query": "vegetarian", "latitude": 10.8, "longitude": 106.7, "radiusMeters": 10000, "limit": 10, "dietaryMode": "VEGETARIAN"}, self.member)

if __name__ == "__main__":
    try:
        unittest.main(verbosity=2)
    finally:
        root = ARTIFACTS / DATABASE
        (root / "task2-api-state.json").write_text(json.dumps(STATE, indent=2), encoding="utf-8")
        (root / f"task2-http-receipts-{time.time_ns()}.json").write_text(json.dumps(RECEIPTS, indent=2), encoding="utf-8")
