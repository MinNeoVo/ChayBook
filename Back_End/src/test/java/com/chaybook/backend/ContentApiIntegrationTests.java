package com.chaybook.backend;

import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.article.repository.ArticleRepository;
import com.chaybook.backend.user.repository.UserRepository;
import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import com.chaybook.backend.auth.session.SessionAttributes;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;


import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ContentApiIntegrationTests {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ArticleRepository articleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User admin;
    private Category category;
    private Category recipeCategory;
    private MockHttpSession adminSession;

    @BeforeEach
    void setUp() throws Exception {
        admin = new User();
        admin.setUsername("content-admin");
        admin.setEmail("content-admin@example.com");
        admin.setPasswordHash(passwordEncoder.encode("test-password"));
        admin.setRole("ADMIN");
        admin = userRepository.saveAndFlush(admin);
        adminSession = login(admin.getEmail(), "test-password");
        category = categoryRepository.saveAndFlush(new Category("Nutrition", "ARTICLE", "Nutrition articles"));
        recipeCategory = categoryRepository.saveAndFlush(new Category("Recipes", "RECIPE", "Recipes"));
    }

    @Test
    void categoriesSupportOptionalTypeAndDetail() throws Exception {
        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/categories").param("type", "article"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].categoryId").value(category.getCategoryId()))
                .andExpect(jsonPath("$[0].name").value("Nutrition"))
                .andExpect(jsonPath("$[0].type").value("ARTICLE"))
                .andExpect(jsonPath("$[0].description").value("Nutrition articles"));
        mvc.perform(get("/api/categories/{id}", category.getCategoryId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(category.getCategoryId()));
        mvc.perform(get("/api/categories").param("type", "UNKNOWN"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test
    void articleFiltersWorkIndividuallyAndTogetherWithoutReturningContent() throws Exception {
        Category second = categoryRepository.saveAndFlush(new Category("Health", "ARTICLE", null));
        Article published = saveArticle(category, "PUBLISHED");
        saveArticle(category, "DRAFT");
        saveArticle(second, "PUBLISHED");

        mvc.perform(get("/api/articles"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].content").doesNotExist())
                .andExpect(jsonPath("$[0].updatedAt").doesNotExist());
        mvc.perform(get("/api/articles").param("categoryId", category.getCategoryId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/articles").param("status", "published"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/articles").param("categoryId", category.getCategoryId().toString())
                        .param("status", "PUBLISHED"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].articleId").value(published.getArticleId()))
                .andExpect(jsonPath("$[0].createdBy").value(admin.getUserId()));
        mvc.perform(get("/api/articles").param("categoryId", "2147483647"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/api/articles/{id}", published.getArticleId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Full content"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());
    }

    @Test
    void adminCanCreateUpdateAndDeleteAndAuthorComesFromSession() throws Exception {
        // Extra client-supplied metadata must never determine the author.
        String body = requestBody(category.getCategoryId(), "DRAFT")
                .replace("\"title\":", "\"createdBy\":999,\"title\":");
        String createdJson = mvc.perform(post("/api/articles")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.createdBy").value(admin.getUserId()))
                .andExpect(jsonPath("$.content").value("New content"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        JsonNode created = objectMapper.readTree(createdJson);
        int articleId = created.get("articleId").asInt();

        User editor = new User();
        editor.setUsername("another-admin");
        editor.setEmail("another-admin@example.com");
        editor.setPasswordHash(admin.getPasswordHash());
        editor.setRole("ADMIN");
        editor = userRepository.saveAndFlush(editor);
        mvc.perform(put("/api/articles/{id}", articleId)
                        .session(login(editor.getEmail(), "test-password"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(category.getCategoryId(), "PUBLISHED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articleId").value(articleId))
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.createdBy").value(admin.getUserId()))
                .andExpect(jsonPath("$.createdAt").value(created.get("createdAt").asString()));
        mvc.perform(delete("/api/articles/{id}", articleId).session(adminSession))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\":\"Article deleted successfully\"}"));
        assertThat(articleRepository.existsById(articleId)).isFalse();
    }

    @Test
    void writesRequireAuthenticationAndAdminRole() throws Exception {
        User user = new User();
        user.setUsername("reader");
        user.setEmail("reader@example.com");
        user.setPasswordHash(admin.getPasswordHash());
        user = userRepository.saveAndFlush(user);
        MockHttpSession userSession = login(user.getEmail(), "test-password");
        String body = requestBody(category.getCategoryId(), "DRAFT");

        mvc.perform(post("/api/articles").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/articles/1").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/articles/1")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/articles").session(userSession)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/articles/1").session(userSession)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/articles/1").session(userSession))
                .andExpect(status().isForbidden());
        assertThat(articleRepository.count()).isZero();
    }

    @Test
    void missingResourcesReturn404() throws Exception {
        mvc.perform(get("/api/categories/2147483647")).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles/2147483647")).andExpect(status().isNotFound());
        mvc.perform(put("/api/articles/2147483647").session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(category.getCategoryId(), "DRAFT")))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/articles/2147483647").session(adminSession))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/articles").session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON).content(requestBody(2147483647, "DRAFT")))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidRequestsAndNonArticleCategoriesReturn400() throws Exception {
        mvc.perform(post("/api/articles").session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.categoryId").exists())
                .andExpect(jsonPath("$.errors.title").exists())
                .andExpect(jsonPath("$.errors.content").exists())
                .andExpect(jsonPath("$.errors.status").exists());
        mvc.perform(post("/api/articles").session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(category.getCategoryId(), "INVALID")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/articles").session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(recipeCategory.getCategoryId(), "DRAFT")))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/articles").param("categoryId", "-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/articles/not-a-number")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/categories/0")).andExpect(status().isBadRequest());
        assertThat(articleRepository.count()).isZero();
    }

    @Test
    void loginRotatesSessionAndPersistsAuthentication() throws Exception {
        var session = new MockHttpSession();
        String originalId = session.getId();

        String response = mvc.perform(post("/api/auth/login").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"content-admin@example.com\",\"password\":\"test-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.user.userId").value(admin.getUserId()))
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(response).size()).isEqualTo(2);
        assertThat(session.getId()).isNotEqualTo(originalId);
        assertThat(session.getAttribute(SessionAttributes.AUTH_USER_ID)).isEqualTo(admin.getUserId());

        mvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(admin.getUserId()));
        mvc.perform(post("/api/articles").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(category.getCategoryId(), "DRAFT")))
                .andExpect(status().isCreated());
    }

    @Test
    void badCredentialsAndInvalidLoginDoNotAuthenticate() throws Exception {
        var session = new MockHttpSession();
        mvc.perform(post("/api/auth/login").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"content-admin@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        assertThat(session.getAttribute(SessionAttributes.AUTH_USER_ID)).isNull();
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        admin.setStatus("DISABLED");
        userRepository.saveAndFlush(admin);
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"content-admin@example.com\",\"password\":\"test-password\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutInvalidatesSessionAndOldCookieCannotAuthenticate() throws Exception {
        String oldId = adminSession.getId();
        mvc.perform(post("/api/auth/logout").session(adminSession))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("JSESSIONID", 0));
        assertThat(adminSession.isInvalid()).isTrue();
        mvc.perform(get("/api/auth/me").cookie(new jakarta.servlet.http.Cookie("JSESSIONID", oldId)))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(category.getCategoryId(), "DRAFT")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginKeepsTeamErrorResponses() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@example.com\",\"password\":\"test-password\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("No account found with this email."));

        admin.setStatus("DISABLED");
        userRepository.saveAndFlush(admin);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"content-admin@example.com\",\"password\":\"test-password\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Your account has been disabled."));
    }

    @Test
    void loginSessionIsRecognizedByTeamRecipeController() throws Exception {
        mvc.perform(delete("/api/recipes/2147483647"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/recipes/2147483647").session(adminSession))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Recipe not found"));
    }

    @Test
    void articleSecurityDoesNotBlockTeamBmiHistoryRoute() throws Exception {
        mvc.perform(get("/api/users/{userId}/bmi", admin.getUserId()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        mvc.perform(put("/api/users/{userId}", admin.getUserId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"updated_admin\",\"fullName\":\"Updated name\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/users/{userId}/password", admin.getUserId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"test-password\",\"newPassword\":\"updated-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerAndLoginWorkWithoutCsrfToken() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"session_reader","email":"session-reader@example.com",
                                 "password":"reader-password","fullName":"Session Reader"}
                                """))
                .andExpect(status().isCreated());
        MockHttpSession session = login("session-reader@example.com", "reader-password");
        mvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
        mvc.perform(get("/api/auth/csrf")).andExpect(status().isNotFound());
    }

    @Test
    void getLogoutDoesNotInvalidateSession() throws Exception {
        mvc.perform(get("/api/auth/logout").session(adminSession)).andExpect(status().isNotFound());
        assertThat(adminSession.isInvalid()).isFalse();
        mvc.perform(get("/api/auth/me").session(adminSession)).andExpect(status().isOk());
    }

    @Test
    void changedPasswordInvalidatesSessionAndRequiresNewPassword() throws Exception {
        mvc.perform(put("/api/users/{id}/password", admin.getUserId()).session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"test-password\",\"newPassword\":\"updated-password\"}"))
                .andExpect(status().isOk());
        assertThat(adminSession.isInvalid()).isTrue();
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"content-admin@example.com\",\"password\":\"test-password\"}"))
                .andExpect(status().isUnauthorized());
        MockHttpSession newSession = login(admin.getEmail(), "updated-password");
        mvc.perform(get("/api/auth/me").session(newSession)).andExpect(status().isOk());
    }

    @Test
    void profileUsesTheSameSessionAndRejectsAnotherUserId() throws Exception {
        String body = "{\"username\":\"updated_admin\",\"fullName\":\"Updated name\",\"avatarUrl\":null}";
        mvc.perform(put("/api/users/{id}", admin.getUserId()).session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.user.username").value("updated_admin"));
        mvc.perform(put("/api/users/{id}", admin.getUserId() + 1).session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/auth/me").session(adminSession))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("updated_admin"));
    }

    @Test
    void currentAccountStateIsCheckedEvenWhenSessionStillSaysAdmin() throws Exception {
        admin.setStatus("DISABLED");
        userRepository.saveAndFlush(admin);
        mvc.perform(post("/api/articles").session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody(category.getCategoryId(), "DRAFT")))
                .andExpect(status().isForbidden());
        admin.setStatus("ACTIVE");
        admin.setRole("USER");
        userRepository.saveAndFlush(admin);
        mvc.perform(delete("/api/articles/1").session(adminSession))
                .andExpect(status().isForbidden());
        assertThat(articleRepository.count()).isZero();
    }

    @Test
    void corsAllowsFrontendCookiesAndContentTypeHeader() throws Exception {
        mvc.perform(options("/api/articles")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        mvc.perform(options("/api/articles").header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    private Article saveArticle(Category articleCategory, String status) {
        Article article = new Article();
        article.setCategory(articleCategory);
        article.setCreatedBy(admin);
        article.setTitle("An article");
        article.setContent("Full content");
        article.setStatus(status);
        return articleRepository.saveAndFlush(article);
    }

    private String requestBody(Integer categoryId, String status) {
        return """
                {"categoryId":%d,"title":"New article","content":"New content",
                 "coverImage":"/images/article.jpg","status":"%s"}
                """.formatted(categoryId, status);
    }

    private MockHttpSession login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of("email", email, "password", password));
        var result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

}
