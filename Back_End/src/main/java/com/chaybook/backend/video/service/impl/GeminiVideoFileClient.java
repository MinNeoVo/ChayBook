package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.config.VideoAnalysisProperties;
import com.chaybook.backend.video.dto.*;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import java.net.URI;
import java.nio.file.Files;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class GeminiVideoFileClient {
    private static final String HOST = "https://generativelanguage.googleapis.com";
    private final RestClient client;
    private final VideoAnalysisProperties p;
    private final PrivateVideoStorage storage;
    private final ObjectMapper mapper;
    private final GeminiVideoErrors errors;
    public GeminiVideoFileClient(@Qualifier("videoRestClient") RestClient client,
            VideoAnalysisProperties p, PrivateVideoStorage storage, ObjectMapper mapper,
            GeminiVideoErrors errors) {
        this.client = client; this.p = p; this.storage = storage; this.mapper = mapper;
        this.errors = errors;
    }

    public PreparedVideo prepare(VideoSourceInfo source) {
        requireKey();
        if ("YOUTUBE".equals(source.sourceType()))
            return new PreparedVideo(source.sourceUrl(), "video/mp4", null);
        String name = null;
        try {
            var path = storage.requireFile(source.storageKey());
            long bytes = Files.size(path);
            var start = client.post().uri(HOST + "/upload/v1beta/files")
                    .header("x-goog-api-key", p.apiKey())
                    .header("X-Goog-Upload-Protocol", "resumable")
                    .header("X-Goog-Upload-Command", "start")
                    .header("X-Goog-Upload-Header-Content-Length", Long.toString(bytes))
                    .header("X-Goog-Upload-Header-Content-Type", "video/mp4")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("file", Map.of("display_name", "chaybook-video")))
                    .retrieve().toBodilessEntity();
            String uploadUrl = start.getHeaders().getFirst("X-Goog-Upload-URL");
            URI uri = URI.create(uploadUrl == null ? "" : uploadUrl);
            if (!"https".equals(uri.getScheme())
                    || !"generativelanguage.googleapis.com".equals(uri.getHost())
                    || uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443))
                throw failure("AI_UPLOAD_FAILED");
            String uploaded = client.post().uri(uri)
                    .header("X-Goog-Upload-Offset", "0")
                    .header("X-Goog-Upload-Command", "upload, finalize")
                    .contentType(MediaType.valueOf("video/mp4")).contentLength(bytes)
                    .body(new FileSystemResource(path)).retrieve().body(String.class);
            JsonNode file = mapper.readTree(uploaded).path("file");
            name = file.path("name").asText();
            validateName(name);
            Instant deadline = Instant.now().plusSeconds(p.fileReadyTimeoutSeconds());
            while (!"ACTIVE".equals(file.path("state").asText())) {
                if (!"PROCESSING".equals(file.path("state").asText()))
                    throw failure("AI_FILE_FAILED");
                if (Instant.now().isAfter(deadline)) throw failure("AI_FILE_TIMEOUT");
                Thread.sleep(2000);
                file = mapper.readTree(client.get().uri(HOST + "/v1beta/" + name)
                        .header("x-goog-api-key", p.apiKey()).retrieve().body(String.class));
            }
            String fileUri = file.path("uri").asText();
            if (!fileUri.equals(HOST + "/v1beta/" + name)) throw failure("AI_FILE_INVALID");
            return new PreparedVideo(fileUri, "video/mp4", name);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (name != null) delete(name);
            throw failure("AI_INTERRUPTED");
        } catch (VideoAnalysisException e) {
            if (name != null) delete(name);
            throw e;
        } catch (RestClientResponseException e) {
            if (name != null) delete(name);
            throw errors.http(e, "prepare", p.model());
        } catch (ResourceAccessException e) {
            if (name != null) delete(name);
            throw errors.transport(e, "prepare", p.model());
        } catch (Exception e) {
            if (name != null) delete(name);
            throw failure("AI_UPLOAD_FAILED");
        }
    }

    public void release(PreparedVideo video) {
        if (video != null && video.providerFileName() != null) delete(video.providerFileName());
    }

    private void delete(String name) {
        try {
            validateName(name);
            client.delete().uri(HOST + "/v1beta/" + name)
                    .header("x-goog-api-key", p.apiKey()).retrieve().toBodilessEntity();
        } catch (RuntimeException ignored) { /* Do not replace the original analysis result. */ }
    }
    private void validateName(String name) {
        if (name == null || !name.matches("files/[a-zA-Z0-9_-]+")) throw failure("AI_FILE_INVALID");
    }
    private void requireKey() {
        if (p.apiKey() == null || p.apiKey().isBlank())
            throw new VideoAnalysisException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI_NOT_CONFIGURED", "Chưa cấu hình API phân tích video.");
    }
    private VideoAnalysisException failure(String code) {
        return new VideoAnalysisException(HttpStatus.BAD_GATEWAY, code, "Không chuẩn bị được video cho AI.");
    }
}
