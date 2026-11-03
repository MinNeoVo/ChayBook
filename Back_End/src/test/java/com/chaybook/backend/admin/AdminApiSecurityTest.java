package com.chaybook.backend.admin;

import com.chaybook.backend.admin.article.controller.*;
import com.chaybook.backend.admin.article.service.*;
import com.chaybook.backend.admin.category.controller.AdminCategoryController;
import com.chaybook.backend.admin.category.service.AdminCategoryService;
import com.chaybook.backend.admin.dashboard.controller.AdminDashboardStatisticsController;
import com.chaybook.backend.admin.dashboard.service.AdminDashboardStatisticsService;
import com.chaybook.backend.admin.post.controller.AdminPostVideoController;
import com.chaybook.backend.admin.post.service.AdminPostVideoService;
import com.chaybook.backend.admin.recipe.controller.AdminRecipeController;
import com.chaybook.backend.admin.recipe.service.impl.AdminRecipeServiceImpl;
import com.chaybook.backend.admin.user.controller.AdminUserController;
import com.chaybook.backend.admin.user.service.AdminUserService;
import com.chaybook.backend.common.exception.GlobalExceptionHandler;
import com.chaybook.backend.config.SecurityConfig;
import com.chaybook.backend.config.CorsConfig;
import jakarta.servlet.Filter;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.time.Instant;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Real SecurityFilterChain, cookie resolver, JWT signature checks, MVC mapping,
// validation and exception handling; service mocks keep this test DB-independent.
class AdminApiSecurityTest {
    private AnnotationConfigWebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new org.springframework.mock.web.MockServletContext());
        TestPropertySourceUtils.addInlinedPropertiesToEnvironment(context,
                "jwt.secret=admin-api-test-only-signing-key-not-used-by-the-application-1234567890");
        context.register(Fixture.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters((Filter) context.getBean("springSecurityFilterChain")).build();
    }

    @AfterEach void close() { context.close(); }

    private Cookie token(String role) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().subject("1").claim("role", role)
                .issuedAt(now).expiresAt(now.plusSeconds(60)).build();
        String encoded = context.getBean(JwtEncoder.class).encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new Cookie("CHAYBOOK_TOKEN", encoded);
    }

    @Test void allFiveAdminAreasRejectAnonymousAndUserButAcceptAdmin() throws Exception {
        String[] paths = {"/api/admin/dashboard/statistics/ai-messages", "/api/admin/users",
                "/api/admin/articles", "/api/admin/recipes", "/api/admin/posts-videos"};
        for (String path : paths) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).cookie(token("USER"))).andExpect(status().isForbidden());
            mvc.perform(get(path).cookie(token("ADMIN"))).andExpect(status().isOk());
        }
        verify(context.getBean(AdminUserService.class)).requireActiveAdmin(1);
    }

    @Test void invalidCookieIsRejectedAndPublicImageReadDoesNotOpenAdminWrites() throws Exception {
        mvc.perform(get("/api/admin/users").cookie(new Cookie("CHAYBOOK_TOKEN", "invalid")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/articles/images")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/article-images/test.jpg")).andExpect(status().isOk());
    }

    @Test void articleQueryMappingKeepsExistingDefaultsAndSupportsOldest() throws Exception {
        mvc.perform(get("/api/admin/articles").cookie(token("ADMIN"))
                .param("q", "soup").param("status", "DRAFT").param("categoryId", "2")
                .param("page", "1").param("size", "6").param("sort", "oldest"))
                .andExpect(status().isOk());
        verify(context.getBean(AdminArticleService.class)).getArticles(1, "soup", 2, "DRAFT", 1, 6, "oldest");
    }

    @Test void invalidWriteBodiesReturn400BeforeCallingServices() throws Exception {
        mvc.perform(post("/api/admin/articles").cookie(token("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\":1,\"title\":\"\",\"content\":\"body\",\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.title").exists());
        mvc.perform(post("/api/admin/recipes").cookie(token("ADMIN")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Soup\",\"ingredients\":[]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/admin/posts-videos/VIDEO/7/status").cookie(token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INVALID\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(context.getBean(AdminPostVideoService.class));
    }

    @Test void onlyAdminCanPublishUsingTheExistingArticleUpdateEndpoint() throws Exception {
        String body = "{\"categoryId\":1,\"title\":\"Draft title\",\"content\":\"Draft content\",\"status\":\"PUBLISHED\"}";
        mvc.perform(put("/api/admin/articles/7").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/admin/articles/7").cookie(token("USER"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        verifyNoInteractions(context.getBean(AdminArticleService.class));
        mvc.perform(put("/api/admin/articles/7").cookie(token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        verify(context.getBean(AdminArticleService.class)).updateArticle(eq(1), eq(7),
                argThat(request -> "PUBLISHED".equals(request.status()) && "Draft content".equals(request.content())));
    }

    @Test void moderationPreservesTypeAndReturns204() throws Exception {
        mvc.perform(patch("/api/admin/posts-videos/VIDEO/7/status").cookie(token("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPROVED\"}"))
                .andExpect(status().isNoContent());
        verify(context.getBean(AdminPostVideoService.class)).updateStatus(1, "VIDEO", 7, "APPROVED", null);
    }

    @Test void defaultCorsAllowsTheExistingFrontendAndRejectsOtherOrigins() throws Exception {
        mvc.perform(options("/api/admin/articles/images")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        mvc.perform(options("/api/admin/articles/images")
                .header("Origin", "http://untrusted.invalid")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Configuration
    @EnableWebMvc
    @EnableWebSecurity
    @Import({SecurityConfig.class, CorsConfig.class, AdminArticleController.class, AdminArticleImageController.class,
            AdminCategoryController.class, AdminDashboardStatisticsController.class,
            AdminPostVideoController.class, AdminRecipeController.class, AdminUserController.class,
            GlobalExceptionHandler.class})
    static class Fixture {
        @Bean AdminArticleService articles() { return mock(AdminArticleService.class); }
        @Bean AdminArticleImageService images() { return mock(AdminArticleImageService.class); }
        @Bean AdminCategoryService categories() { return mock(AdminCategoryService.class); }
        @Bean AdminDashboardStatisticsService dashboard() { return mock(AdminDashboardStatisticsService.class); }
        @Bean AdminPostVideoService posts() { return mock(AdminPostVideoService.class); }
        @Bean AdminRecipeServiceImpl recipes() { return mock(AdminRecipeServiceImpl.class); }
        @Bean AdminUserService users() { return mock(AdminUserService.class); }
    }
}
