package com.chaybook.backend.security;

import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class ActiveAccountFilterTest {
    private final UserRepository users=mock(UserRepository.class);
    private final ActiveAccountFilter filter=new ActiveAccountFilter(users);
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    @ParameterizedTest @ValueSource(strings={"/api/users/me/profile","/api/bmi/history","/api/meal-plans","/api/users/me/allergies","/api/chatbot/messages","/api/admin/posts-videos","/api/auth/me"})
    void disabledTokenIsDeniedAndUnblockIsImmediate(String path) throws Exception {
        var jwt=Jwt.withTokenValue("synthetic").header("alg","HS256").subject("2").claim("role","USER").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        User user=new User(); user.setStatus("DISABLED");
        when(users.findById(2)).thenReturn(Optional.of(user));
        var request=new MockHttpServletRequest("GET",path);
        var response=new MockHttpServletResponse();
        var chain=new MockFilterChain(); filter.doFilter(request,response,chain);
        assertEquals(403,response.getStatus()); assertNull(chain.getRequest());
        user.setStatus("ACTIVE"); response=new MockHttpServletResponse(); chain=new MockFilterChain();
        filter.doFilter(new MockHttpServletRequest("GET",path),response,chain);
        assertEquals(200,response.getStatus()); assertNotNull(chain.getRequest());
    }
    @ParameterizedTest @ValueSource(strings={"/api/articles","/api/articles/1","/api/recipes","/api/categories","/api/allergies","/api/auth/logout"})
    void publicAndLogoutRemainAvailable(String path) throws Exception {
        var chain=new MockFilterChain();
        filter.doFilter(new MockHttpServletRequest(path.endsWith("logout")?"POST":"GET",path),new MockHttpServletResponse(),chain);
        assertNotNull(chain.getRequest()); verifyNoInteractions(users);
    }
}
