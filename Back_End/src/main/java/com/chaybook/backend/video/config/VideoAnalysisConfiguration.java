package com.chaybook.backend.video.config;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.client.RestClient;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(VideoAnalysisProperties.class)
public class VideoAnalysisConfiguration {
    @Bean("videoRestClient")
    public RestClient videoRestClient(VideoAnalysisProperties p) {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(p.connectTimeoutSeconds()))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
        factory.setReadTimeout(Duration.ofSeconds(p.readTimeoutSeconds()));
        return RestClient.builder().requestFactory(factory).build();
    }

    @Bean("videoScheduler")
    public ThreadPoolTaskScheduler videoScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("video-worker-");
        scheduler.setWaitForTasksToCompleteOnShutdown(false);
        return scheduler;
    }
}
