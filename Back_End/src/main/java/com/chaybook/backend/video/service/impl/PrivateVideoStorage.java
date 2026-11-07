package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.config.VideoAnalysisProperties;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import java.io.*;
import java.nio.file.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PrivateVideoStorage {
    private final Path root;
    private final VideoAnalysisProperties p;
    public PrivateVideoStorage(VideoAnalysisProperties p) throws IOException {
        this.p = p;
        this.root = Path.of(p.storageDirectory()).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String save(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw error(HttpStatus.BAD_REQUEST, "EMPTY_VIDEO", "Hãy chọn video.");
        if (file.getSize() > p.maxBytes())
            throw error(HttpStatus.PAYLOAD_TOO_LARGE, "VIDEO_TOO_LARGE", "Video vượt dung lượng cho phép.");
        String key = UUID.randomUUID() + ".mp4";
        Path target = resolve(key);
        try (InputStream in = file.getInputStream();
             OutputStream out = Files.newOutputStream(target, StandardOpenOption.CREATE_NEW)) {
            byte[] buffer = new byte[8192];
            long total = 0;
            int count;
            while ((count = in.read(buffer)) != -1) {
                total += count;
                if (total > p.maxBytes())
                    throw error(HttpStatus.PAYLOAD_TOO_LARGE, "VIDEO_TOO_LARGE", "Video vượt dung lượng cho phép.");
                out.write(buffer, 0, count);
            }
            return key;
        } catch (IOException | RuntimeException e) {
            deleteQuietly(key);
            if (e instanceof VideoAnalysisException known) throw known;
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "STORAGE_FAILED", "Không lưu được video.");
        }
    }

    public Path requireFile(String key) {
        Path path = resolve(key);
        if (!Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS))
            throw error(HttpStatus.GONE, "SOURCE_EXPIRED", "Video tạm không còn. Hãy gửi lại video.");
        return path;
    }

    private Path resolve(String key) {
        if (key == null || !key.matches("[0-9a-fA-F-]{36}\\.mp4"))
            throw error(HttpStatus.BAD_REQUEST, "INVALID_STORAGE_KEY", "Định danh video không hợp lệ.");
        Path path = root.resolve(key).normalize();
        if (!path.getParent().equals(root))
            throw error(HttpStatus.BAD_REQUEST, "INVALID_STORAGE_KEY", "Định danh video không hợp lệ.");
        return path;
    }

    public void deleteQuietly(String key) {
        try { Files.deleteIfExists(resolve(key)); }
        catch (IOException | RuntimeException ignored) { /* TTL sweep will retry. */ }
    }

    public void removeExpired() {
        Instant cutoff = Instant.now().minus(p.retentionHours(), ChronoUnit.HOURS);
        try (var paths = Files.list(root)) {
            paths.filter(path -> path.getFileName().toString().matches("[0-9a-fA-F-]{36}\\.mp4"))
                    .filter(path -> Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS))
                    .forEach(path -> {
                        try {
                            if (Files.getLastModifiedTime(path).toInstant().isBefore(cutoff))
                                Files.deleteIfExists(path);
                        } catch (IOException ignored) { /* Retry on next sweep. */ }
                    });
        } catch (IOException e) {
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "STORAGE_CLEANUP_FAILED", "Không dọn được video tạm.");
        }
    }

    private VideoAnalysisException error(HttpStatus status, String code, String message) {
        return new VideoAnalysisException(status, code, message);
    }
}
