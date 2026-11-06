package com.chaybook.backend.auth.social.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.social")
public class SocialAuthProperties {

    private boolean loginEnabled;
    private String frontendUrl = "http://localhost:5173";
    private String backendUrl = "http://localhost:8080";
    private boolean secureCookie;

    private final Provider google = new Provider();
    private final Provider facebook = new Provider();

    public boolean isLoginEnabled() {
        return loginEnabled;
    }

    public void setLoginEnabled(boolean loginEnabled) {
        this.loginEnabled = loginEnabled;
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }

    public void setFrontendUrl(String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    public String getBackendUrl() {
        return backendUrl;
    }

    public void setBackendUrl(String backendUrl) {
        this.backendUrl = backendUrl;
    }

    public boolean isSecureCookie() {
        return secureCookie;
    }

    public void setSecureCookie(boolean secureCookie) {
        this.secureCookie = secureCookie;
    }

    public Provider getGoogle() {
        return google;
    }

    public Provider getFacebook() {
        return facebook;
    }

    public static class Provider {

        private String clientId = "";
        private String clientSecret = "";
        private String apiVersion = "v25.0";

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getClientSecret() {
            return clientSecret;
        }

        public void setClientSecret(String clientSecret) {
            this.clientSecret = clientSecret;
        }

        public String getApiVersion() {
            return apiVersion;
        }

        public void setApiVersion(String apiVersion) {
            this.apiVersion = apiVersion;
        }

        public boolean isConfigured() {
            return clientId != null
                    && !clientId.isBlank()
                    && clientSecret != null
                    && !clientSecret.isBlank();
        }
    }
}