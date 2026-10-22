package com.chaybook.backend.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

import com.chaybook.backend.security.CookieBearerTokenResolver;
import com.chaybook.backend.security.JwtAuthenticationConverter;
import com.chaybook.backend.security.ActiveAccountFilter;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecretKey jwtSecretKey() {
        return new SecretKeySpec(
                jwtSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(
                new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder
                .withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return new CookieBearerTokenResolver();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            BearerTokenResolver bearerTokenResolver,
            UserRepository userRepository) throws Exception {

        http

                .cors(cors -> {
                })

                .csrf(csrf -> csrf.disable())

                .sessionManagement(session -> session.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // Mở cửa cho Chatbot (Guest)
                        .requestMatchers("/api/chatbot/**").permitAll()

                        // Mở cửa cho các API công khai khác
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/register/verify",
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/forgot-password/verify",
                                "/api/auth/reset-password",
                                "/api/auth/logout",
                                "/api/categories/**"
                                )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/recipes",
                                "/api/recipes/",
                                "/api/recipes/**",
                                "/api/articles",
                                "/api/article-images/*",
                                "/api/articles/**")
                        .permitAll()

                        .requestMatchers(
                                "/api/articles",
                                "/api/articles/**"
                        ).denyAll()

                        .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/allergies").permitAll()

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")

                        .requestMatchers(
                                "/api/posts",
                                "/api/posts/**"
                        ).hasAnyRole("USER", "ADMIN")

                        .anyRequest().authenticated())

                .oauth2ResourceServer(oauth2 -> oauth2
                        .bearerTokenResolver(bearerTokenResolver)
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(
                                new JwtAuthenticationConverter())));

        http.addFilterAfter(new ActiveAccountFilter(userRepository), BearerTokenAuthenticationFilter.class);
        return http.build();
    }
}
