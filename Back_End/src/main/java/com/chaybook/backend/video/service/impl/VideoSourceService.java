package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.config.VideoAnalysisProperties;
import com.chaybook.backend.video.dto.VideoSourceInfo;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import com.chaybook.backend.video.policy.VideoDurationPolicy;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class VideoSourceService {
    private final PrivateVideoStorage storage;
    private final VideoAnalysisProperties p;
    private final RestClient client;
    private final ObjectMapper mapper;
    private final VideoDurationPolicy durations;
    public VideoSourceService(PrivateVideoStorage storage, VideoAnalysisProperties p,
            @Qualifier("videoRestClient") RestClient client, ObjectMapper mapper, VideoDurationPolicy durations) {
        this.storage = storage; this.p = p; this.client = client; this.mapper = mapper;
        this.durations = durations;
    }

    public VideoSourceInfo upload(MultipartFile file) {
        String key = storage.save(file);
        try {
            BigDecimal duration = probe(storage.requireFile(key));
            return new VideoSourceInfo("UPLOAD", null, key, duration);
        } catch (RuntimeException e) {
            storage.deleteQuietly(key);
            throw e;
        }
    }

    public VideoSourceInfo youtube(String input) {
        String id = youtubeId(input);
        return new VideoSourceInfo("YOUTUBE", "https://www.youtube.com/watch?v=" + id,
                null, youtubeDuration(id));
    }

    public void verifyAvailable(VideoSourceInfo source) {
        if ("UPLOAD".equals(source.sourceType())) {
            storage.requireFile(source.storageKey());
        } else if ("YOUTUBE".equals(source.sourceType())) {
            BigDecimal duration = youtubeDuration(youtubeId(source.sourceUrl()));
            if (duration.compareTo(source.durationSeconds()) != 0)
                throw error(HttpStatus.UNPROCESSABLE_CONTENT, "SOURCE_CHANGED", "Video nguồn đã thay đổi.");
        } else {
            throw error(HttpStatus.BAD_REQUEST, "UNSUPPORTED_SOURCE", "Nguồn video không được hỗ trợ.");
        }
    }

    public String youtubeId(String input) {
        try {
            if (input == null || input.length() > 2048) throw new IllegalArgumentException();
            URI uri = URI.create(input.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getUserInfo() != null
                    || (uri.getPort() != -1 && uri.getPort() != 443)) throw new IllegalArgumentException();
            String host = Optional.ofNullable(uri.getHost()).orElse("").toLowerCase(Locale.ROOT);
            String path = Optional.ofNullable(uri.getPath()).orElse("");
            String id = null;
            if ("youtu.be".equals(host) && path.matches("/[A-Za-z0-9_-]{11}/?")) {
                id = path.substring(1, 12);
            } else if (Set.of("youtube.com", "www.youtube.com", "m.youtube.com").contains(host)) {
                if (path.matches("/shorts/[A-Za-z0-9_-]{11}/?")) id = path.substring(8, 19);
                if ("/watch".equals(path) && uri.getRawQuery() != null) {
                    for (String pair : uri.getRawQuery().split("&")) {
                        String[] parts = pair.split("=", 2);
                        if ("v".equals(parts[0]) && parts.length == 2) {
                            if (id != null) throw new IllegalArgumentException();
                            id = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
                        }
                    }
                }
            }
            if (id == null || !id.matches("[A-Za-z0-9_-]{11}")) throw new IllegalArgumentException();
            return id;
        } catch (IllegalArgumentException e) {
            throw error(HttpStatus.BAD_REQUEST, "INVALID_VIDEO_URL",
                    "Chỉ hỗ trợ link YouTube công khai: watch, Shorts hoặc youtu.be.");
        }
    }

    private BigDecimal youtubeDuration(String id) {
        if (p.youtubeApiKey() == null || p.youtubeApiKey().isBlank())
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "YOUTUBE_NOT_CONFIGURED", "Chưa cấu hình YouTube API.");
        try {
            String body = client.get().uri(builder -> builder.scheme("https")
                    .host("www.googleapis.com").path("/youtube/v3/videos")
                    .queryParam("part", "contentDetails,status,snippet").queryParam("id", id)
                    .queryParam("key", p.youtubeApiKey()).build()).retrieve().body(String.class);
            JsonNode items = mapper.readTree(body).path("items");
            if (!items.isArray() || items.size() != 1)
                throw error(HttpStatus.UNPROCESSABLE_CONTENT, "VIDEO_UNAVAILABLE", "Không truy cập được video.");
            JsonNode item = items.get(0);
            if (!"public".equals(item.path("status").path("privacyStatus").asText())
                    || !"processed".equals(item.path("status").path("uploadStatus").asText())
                    || !"none".equals(item.path("snippet").path("liveBroadcastContent").asText()))
                throw error(HttpStatus.UNPROCESSABLE_CONTENT, "VIDEO_UNAVAILABLE",
                        "Chỉ hỗ trợ video công khai đã xử lý xong, không phải livestream.");
            Duration duration = Duration.parse(item.path("contentDetails").path("duration").asText());
            return durations.youtube(BigDecimal.valueOf(duration.getSeconds()));
        } catch (VideoAnalysisException e) { throw e; }
        catch (RuntimeException e) {
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "YOUTUBE_LOOKUP_FAILED", "Không kiểm tra được video YouTube.");
        }
    }

    private BigDecimal probe(Path path) {
        Path output = null;
        Process process = null;
        try {
            output = Files.createTempFile("chaybook-ffprobe-", ".json");
            process = new ProcessBuilder(p.ffprobePath(), "-v", "error",
                    "-protocol_whitelist", "file,pipe", "-show_entries",
                    "format=format_name,duration:format_tags=major_brand:stream=codec_type",
                    "-of", "json", path.toString())
                    .redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(output.toFile()).start();
            if (!process.waitFor(p.probeTimeoutSeconds(), TimeUnit.SECONDS)) {
                process.destroyForcibly();
                process.waitFor(2, TimeUnit.SECONDS);
                throw error(HttpStatus.UNPROCESSABLE_CONTENT, "VIDEO_PROBE_TIMEOUT", "Không đọc được thông tin video.");
            }
            if (process.exitValue() != 0 || Files.size(output) > 262144)
                throw error(HttpStatus.BAD_REQUEST, "INVALID_VIDEO_FILE", "File video không hợp lệ.");
            JsonNode root = mapper.readTree(Files.readString(output));
            String format = root.path("format").path("format_name").asText();
            String brand = root.path("format").path("tags").path("major_brand").asText().trim();
            boolean video = false;
            for (JsonNode stream : root.path("streams"))
                if ("video".equals(stream.path("codec_type").asText())) video = true;
            // Conservative MP4 subset for the first release.
            if (!video || !format.contains("mp4")
                    || !Set.of("isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V").contains(brand))
                throw error(HttpStatus.BAD_REQUEST, "UNSUPPORTED_VIDEO_FORMAT", "Hãy dùng video MP4 chuẩn.");
            return durations.upload(new BigDecimal(root.path("format").path("duration").asText()));
        } catch (VideoAnalysisException e) { throw e; }
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "VIDEO_PROBE_INTERRUPTED", "Tác vụ bị gián đoạn.");
        } catch (IOException e) {
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "VIDEO_PROBE_UNAVAILABLE", "Kiểm tra cấu hình ffprobe và thư mục tạm.");
        } catch (RuntimeException e) {
            throw error(HttpStatus.BAD_REQUEST, "INVALID_VIDEO_FILE", "Không đọc được video MP4.");
        } finally {
            if (process != null && process.isAlive()) process.destroyForcibly();
            if (output != null) try { Files.deleteIfExists(output); } catch (IOException ignored) {}
        }
    }

    private VideoAnalysisException error(HttpStatus status, String code, String message) {
        return new VideoAnalysisException(status, code, message);
    }
}
