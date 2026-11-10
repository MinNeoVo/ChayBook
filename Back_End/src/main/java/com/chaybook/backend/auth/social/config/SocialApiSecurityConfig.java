package com.chaybook.backend.auth.social.config;

import com.chaybook.backend.security.JwtAuthenticationConverter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.ObjectPostProcessor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

@Configuration
@EnableConfigurationProperties(SocialAuthProperties.class)
public class SocialApiSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain socialApiSecurityFilterChain(
            HttpSecurity http,
            BearerTokenResolver bearerTokenResolver
    ) throws Exception {

        BearerTokenResolver socialTokenResolver = request -> {
            String path = request.getServletPath();

            boolean requiresUser =
                    path.equals("/api/auth/social/connections")
                            || path.startsWith("/api/auth/social/link/");

            return requiresUser
                    ? bearerTokenResolver.resolve(request)
                    : null;
        };

        http
                .securityMatcher("/api/auth/social/**")

                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf
                    .csrfTokenRepository(new HttpSessionCsrfTokenRepository())
                    .withObjectPostProcessor(new ObjectPostProcessor<CsrfFilter>() {
                        @Override
                        public <O extends CsrfFilter> O postProcess(O filter) {
                            // Bắt buộc kiểm tra các method thay đổi dữ liệu,
                            // kể cả request có JWT lấy từ cookie.
                            filter.setRequireCsrfProtectionMatcher(
                                    CsrfFilter.DEFAULT_CSRF_MATCHER
                            );

                            filter.setAccessDeniedHandler((request, response, exception) -> {
                                response.setStatus(403);
                                response.setContentType("application/problem+json");
                                response.setCharacterEncoding("UTF-8");
                                response.setHeader("Cache-Control", "no-store");

                                response.getWriter().write(
                                        "{\"status\":403,\"code\":\"CSRF_INVALID\","
                                                + "\"detail\":\"Invalid CSRF token.\"}"
                                );
                            });

                            return filter;
                        }
                    })
                )

                .sessionManagement(session -> session
                        .sessionCreationPolicy(
                                SessionCreationPolicy.IF_REQUIRED
                        )
                )

                .securityContext(context -> context
                        .securityContextRepository(
                                new NullSecurityContextRepository()
                        )
                )

                .requestCache(cache -> cache
                        .requestCache(new NullRequestCache())
                )

                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/auth/social/providers",
                            "/api/auth/social/csrf",
                            "/api/auth/social/pending"
                    ).permitAll()

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/auth/social/registration/code",
                            "/api/auth/social/registration/complete"
                    ).permitAll()

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/auth/social/connections"
                    ).authenticated()

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/auth/social/link/code",
                            "/api/auth/social/link/google",
                            "/api/auth/social/link/facebook"
                    ).authenticated()

                    .anyRequest().denyAll()
                )

                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )
                )

                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(socialTokenResolver)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(
                                new JwtAuthenticationConverter()
                        ))
                );

        return http.build();
    }
}