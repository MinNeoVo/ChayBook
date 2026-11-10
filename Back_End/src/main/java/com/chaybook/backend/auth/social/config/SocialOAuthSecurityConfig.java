package com.chaybook.backend.auth.social.config;

import com.chaybook.backend.auth.social.oauth.SocialAuthorizationRequestRepository;
import com.chaybook.backend.auth.social.oauth.SocialOAuthHandlers;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.ObjectPostProcessor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class SocialOAuthSecurityConfig {

    @Bean
    public ClientRegistrationRepository socialClientRegistrations(
            SocialAuthProperties properties
    ) {
        Map<String, ClientRegistration> registrations = new HashMap<>();

        String backend = properties.getBackendUrl().replaceAll("/+$", "");

        if (properties.isLoginEnabled()
                && properties.getGoogle().isConfigured()) {
            var google = properties.getGoogle();

            registrations.put(
                    "google",
                    CommonOAuth2Provider.GOOGLE.getBuilder("google")
                            .clientId(google.getClientId())
                            .clientSecret(google.getClientSecret())
                            .scope("openid", "profile", "email")
                            .redirectUri(backend + "/login/oauth2/code/google")
                            .build()
            );
        }

        if (properties.isLoginEnabled()
                && properties.getFacebook().isConfigured()) {
            var facebook = properties.getFacebook();
            String version = facebook.getApiVersion();

            if (version == null || !version.matches("v[0-9]+\\.[0-9]+")) {
                throw new IllegalStateException(
                        "Invalid Facebook Graph API version"
                );
            }

            registrations.put(
                    "facebook",
                    CommonOAuth2Provider.FACEBOOK.getBuilder("facebook")
                            .clientId(facebook.getClientId())
                            .clientSecret(facebook.getClientSecret())
                            .scope("public_profile", "email")
                            .authorizationUri(
                                    "https://www.facebook.com/"
                                            + version + "/dialog/oauth"
                            )
                            .tokenUri(
                                    "https://graph.facebook.com/"
                                            + version + "/oauth/access_token"
                            )
                            .userInfoUri(
                                    "https://graph.facebook.com/"
                                            + version
                                            + "/me?fields=id,name,email,picture"
                            )
                            .userNameAttributeName("id")
                            .redirectUri(backend + "/login/oauth2/code/facebook")
                            .build()
            );
        }

        Map<String, ClientRegistration> immutable = Map.copyOf(registrations);

        // Cho phép khởi động khi chưa cấu hình provider nào.
        return immutable::get;
    }

    @Bean
    @Order(0)
    public SecurityFilterChain socialOAuthSecurityFilterChain(
            HttpSecurity http,
            ClientRegistrationRepository registrations,
            SocialAuthorizationRequestRepository authorizationRequests,
            SocialOAuthHandlers handlers
    ) throws Exception {

        http
                .securityMatcher(
                        "/oauth2/authorization/*",
                        "/login/oauth2/code/*"
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .securityContext(context -> context
                        .securityContextRepository(
                                new NullSecurityContextRepository()
                        )
                )
                .requestCache(cache -> cache
                        .requestCache(new NullRequestCache())
                )
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .oauth2Login(oauth -> oauth
                        .clientRegistrationRepository(registrations)
                        .authorizedClientRepository(discardAuthorizedClients())
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestRepository(
                                        authorizationRequests
                                )
                        )
                        .successHandler(handlers::success)
                        .failureHandler(handlers::failure)
                        .withObjectPostProcessor(
                                new ObjectPostProcessor<
                                        OAuth2AuthorizationRequestRedirectFilter>() {
                                    @Override
                                    public <
                                            O extends OAuth2AuthorizationRequestRedirectFilter
                                            > O postProcess(O filter) {
                                        filter.setAuthenticationFailureHandler(
                                                handlers::failure
                                        );
                                        return filter;
                                    }
                                }
                        )
                );

        return http.build();
    }

    private OAuth2AuthorizedClientRepository discardAuthorizedClients() {
        return new OAuth2AuthorizedClientRepository() {

            @Override
            public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(
                    String registrationId,
                    Authentication principal,
                    HttpServletRequest request
            ) {
                return null;
            }

            @Override
            public void saveAuthorizedClient(
                    OAuth2AuthorizedClient authorizedClient,
                    Authentication principal,
                    HttpServletRequest request,
                    HttpServletResponse response
            ) {
                // Chỉ dùng token provider trong quá trình xác thực.
            }

            @Override
            public void removeAuthorizedClient(
                    String registrationId,
                    Authentication principal,
                    HttpServletRequest request,
                    HttpServletResponse response
            ) {
                // Không lưu authorized client sau đăng nhập.
            }
        };
    }
}