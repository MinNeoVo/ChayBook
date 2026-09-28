package com.chaybook.backend.auth.service;

import com.chaybook.backend.auth.dto.LoginResponse;
import com.chaybook.backend.auth.session.SessionAttributes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class SessionAuthenticationService {
    private final SecurityContextRepository securityContextRepository;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;

    public SessionAuthenticationService(SecurityContextRepository securityContextRepository,
                                        SessionAuthenticationStrategy sessionAuthenticationStrategy) {
        this.securityContextRepository = securityContextRepository;
        this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
    }

    // Call only after AuthService has verified the credentials.
    public void signIn(LoginResponse.UserData user, HttpServletRequest request, HttpServletResponse response) {
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                user.userId(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role().toUpperCase(Locale.ROOT))));
        sessionAuthenticationStrategy.onAuthentication(authentication, request, response);

        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true).setAttribute(SessionAttributes.AUTH_USER_ID, user.userId());
        securityContextRepository.saveContext(context, request, response);
    }
}
