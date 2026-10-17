package com.chaybook.backend.shop.config;

import com.chaybook.backend.shop.provider.ShopSearchProvider;
import com.chaybook.backend.shop.provider.geoapify.GeoapifyPlacesSearchProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class GeoapifyConfigTest {
    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(GeoapifyConfig.class);

    @Test
    void providerIsAbsentWhenTheFeatureIsNotEnabled() {
        contextRunner.run(context -> assertThat(context)
                .hasNotFailed()
                .doesNotHaveBean(ShopSearchProvider.class));
    }

    @Test
    void disabledFeatureDoesNotRequireAKey() {
        contextRunner.withPropertyValues("chaybook.geoapify.enabled=false")
                .run(context -> assertThat(context)
                        .hasNotFailed()
                        .doesNotHaveBean(ShopSearchProvider.class));
    }

    @Test
    void enabledFeatureCreatesOneProviderAndBindsTimeoutDefaults() {
        enabledContext().run(context -> {
            assertThat(context).hasNotFailed().hasSingleBean(ShopSearchProvider.class);
            assertThat(context.getBean(ShopSearchProvider.class))
                    .isInstanceOf(GeoapifyPlacesSearchProvider.class);
            GeoapifyProperties properties = context.getBean(GeoapifyProperties.class);
            assertThat(properties.connectTimeoutSeconds()).isEqualTo(3);
            assertThat(properties.readTimeoutSeconds()).isEqualTo(5);
        });
    }

    @Test
    void enabledFeatureWithMissingKeyFailsDuringConfiguration() {
        contextRunner.withPropertyValues("chaybook.geoapify.enabled=true")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void enabledFeatureWithBlankKeyFailsDuringConfiguration() {
        contextRunner.withPropertyValues(
                        "chaybook.geoapify.enabled=true",
                        "chaybook.geoapify.api-key= ")
                .run(context -> assertThat(context).hasFailed());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "chaybook.geoapify.connect-timeout-seconds=0",
            "chaybook.geoapify.connect-timeout-seconds=31",
            "chaybook.geoapify.read-timeout-seconds=0",
            "chaybook.geoapify.read-timeout-seconds=61"
    })
    void invalidTimeoutsFailDuringConfiguration(String property) {
        enabledContext().withPropertyValues(property)
                .run(context -> assertThat(context).hasFailed());
    }

    private ApplicationContextRunner enabledContext() {
        return contextRunner.withPropertyValues(
                "chaybook.geoapify.enabled=true",
                "chaybook.geoapify.api-key=test-only-geoapify-key-not-valid"
        );
    }
}
