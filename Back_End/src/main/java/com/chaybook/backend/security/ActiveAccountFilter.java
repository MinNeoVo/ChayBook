package com.chaybook.backend.security;

import com.chaybook.backend.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Set;

/** Re-check account status for each authenticated protected request, including
 * optional authentication on the guest chatbot. JWT expiry alone cannot revoke a block.
 */
public class ActiveAccountFilter extends OncePerRequestFilter {
    private final UserRepository users;
    public ActiveAccountFilter(UserRepository users) { this.users = users; }

    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath().isEmpty() ? request.getRequestURI() : request.getServletPath();
        if ("OPTIONS".equals(request.getMethod())) return true;
        if (Set.of("/api/auth/login", "/api/auth/logout", "/api/auth/register", "/api/auth/register/verify",
                "/api/auth/forgot-password", "/api/auth/forgot-password/verify", "/api/auth/reset-password").contains(path)) return true;
        return "GET".equals(request.getMethod()) && Set.of("/api/recipes", "/api/articles", "/api/categories",
                "/api/allergies", "/api/article-images", "/uploads").stream()
                .anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                              FilterChain chain) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            Integer id;
            try { id = Integer.valueOf(token.getToken().getSubject()); }
            catch (NumberFormatException e) { deny(response,401,"Invalid authentication information"); return; }
            var user = users.findById(id);
            if (id <= 0 || user.isEmpty()) { deny(response,401,"Account no longer exists"); return; }
            if (!"ACTIVE".equalsIgnoreCase(user.get().getStatus())) {
                deny(response,403,"Your account has been disabled."); return;
            }
        }
        chain.doFilter(request,response);
    }
    private void deny(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":"+status+",\"message\":\""+message+"\"}");
    }
}
