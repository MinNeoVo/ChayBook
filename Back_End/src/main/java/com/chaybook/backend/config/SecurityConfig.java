package com.chaybook.backend.config;

import com.chaybook.backend.security.CookieBearerTokenResolver;
import com.chaybook.backend.security.JwtAuthenticationConverter;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class SecurityConfig {
    @Bean
    public SecretKey jwtSecretKey(@Value("${jwt.secret}") String jwtSecret) {
        return new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        var cookieResolver = new CookieBearerTokenResolver();
        var paths = PathPatternRequestMatcher.withDefaults();
        var login = paths.matcher(HttpMethod.POST, "/api/auth/login");
        var register = paths.matcher(HttpMethod.POST, "/api/auth/register");
        var logout = paths.matcher(HttpMethod.POST, "/api/auth/logout");
        return request -> {
            // A stale cookie must not prevent logging in again or clearing the cookie.
            if (login.matches(request) || register.matches(request) || logout.matches(request)) {
                return null;
            }
            return cookieResolver.resolve(request);
        };
    }

    // Temporary constructor dependencies for the existing SessionAuthenticationService.
    // The JWT filter chain and AuthController do not use these beans. Remove them
    // together with that service when the remaining session callers are migrated.
    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        return new ChangeSessionIdAuthenticationStrategy();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   BearerTokenResolver bearerTokenResolver) throws Exception {
        var unauthorized = new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);
        return http
                // Use the existing CorsConfigurationSource in CorsConfig.
                .cors(Customizer.withDefaults())
                // TODO: Enable CSRF protection together with frontend CSRF-token handling.
                // Cookie-based JWT authentication still requires CSRF protection.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                // AuthController owns POST /api/auth/logout and returns JSON.
                .logout(AbstractHttpConfigurer::disable)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(unauthorized)
                        .accessDeniedHandler((request, response, exception) -> response.setStatus(403)))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login",
                                "/api/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/articles", "/api/articles/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/articles", "/api/articles/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/articles", "/api/articles/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/articles", "/api/articles/**",
                                "/api/categories", "/api/categories/**", "/api/recipes", "/api/recipes/**",
                                "/api/ingredients", "/api/ingredients/**").permitAll()
                        // Preserve the existing BMI API access policy during this migration.
                        .requestMatchers(HttpMethod.POST, "/api/bmi").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/{userId}/bmi",
                                "/api/users/{userId}/bmi/latest").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(bearerTokenResolver)
                        .authenticationEntryPoint(unauthorized)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new JwtAuthenticationConverter())))
                .build();
    }
}
