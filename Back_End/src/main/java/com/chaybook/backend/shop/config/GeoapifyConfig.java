package com.chaybook.backend.shop.config;

import com.chaybook.backend.shop.provider.ShopSearchProvider;
import com.chaybook.backend.shop.provider.geoapify.GeoapifyPlacesSearchProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        prefix = "chaybook.geoapify",
        name = "enabled",
        havingValue = "true"
)
@EnableConfigurationProperties(GeoapifyProperties.class)
public class GeoapifyConfig {

    @Bean
    public ShopSearchProvider geoapifyPlacesSearchProvider(
            GeoapifyProperties properties
    ) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(
                        Duration.ofSeconds(properties.connectTimeoutSeconds())
                )
                .build();

        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);

        requestFactory.setReadTimeout(
                Duration.ofSeconds(properties.readTimeoutSeconds())
        );

        RestClient restClient = RestClient.builder()
                .baseUrl("https://api.geoapify.com")
                .requestFactory(requestFactory)
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE
                )
                .build();

        return new GeoapifyPlacesSearchProvider(
                restClient,
                properties.apiKey()
        );
    }
}