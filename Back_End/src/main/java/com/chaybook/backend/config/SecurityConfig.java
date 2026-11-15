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
import org.springframework.http.HttpMethod;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import com.chaybook.backend.security.CookieBearerTokenResolver;
import com.chaybook.backend.security.JwtAuthenticationConverter;
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
                        BearerTokenResolver bearerTokenResolver) throws Exception {

                http

                                .cors(cors -> {
                                })

                                .csrf(csrf -> csrf.disable())

                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                .authorizeHttpRequests(auth -> auth

                                                .requestMatchers("/api/test").permitAll()
                                                // Cho phép CORS preflight request
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                // Mở cửa cho Chatbot (Guest)
                                                .requestMatchers("/api/chatbot/**").permitAll()

                                                // Mở cửa cho Webhook thanh toán PayOS
                                                .requestMatchers("/api/payment/payos-webhook").permitAll()

                                                // Mở cửa cho các API công khai khác
                                                .requestMatchers(
                                                                "/api/auth/register",
                                                                "/api/auth/register/verify",
                                                                "/api/auth/login",
                                                                "/api/auth/forgot-password",
                                                                "/api/auth/forgot-password/verify",
                                                                "/api/auth/reset-password",
                                                                "/api/auth/logout",
                                                                "/api/categories/**")
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
                                                                "/api/articles/**")
                                                .denyAll()

                                                .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/allergies").permitAll()

                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")

                                                .requestMatchers(
                                                                "/api/posts",
                                                                "/api/posts/**",
                                                                "/api/notifications",
                                                                "/api/notifications/**")
                                                .hasAnyRole("USER", "ADMIN")

                                                .anyRequest().authenticated())

                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .bearerTokenResolver(bearerTokenResolver)
                                                .jwt(jwt -> jwt.jwtAuthenticationConverter(
                                                                new JwtAuthenticationConverter())));

                return http.build();
        }

        @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,https://chay-book.vercel.app}")
        private String allowedOrigins;

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                List<String> patterns = new java.util.ArrayList<>();
                patterns.add("http://localhost:*");
                patterns.add("https://*.vercel.app");
                patterns.add("https://*.onrender.com");

                if (allowedOrigins != null && !allowedOrigins.isBlank()) {
                        for (String origin : allowedOrigins.split(",")) {
                                String trimmed = origin.trim();
                                if (!trimmed.isEmpty() && !patterns.contains(trimmed)) {
                                        patterns.add(trimmed);
                                }
                        }
                }

                configuration.setAllowedOriginPatterns(patterns);

                configuration.setAllowedMethods(List.of(
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE",
                                "PATCH",
                                "OPTIONS"));

                configuration.setAllowedHeaders(List.of("*"));

                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", configuration);

                return source;
        }
}
