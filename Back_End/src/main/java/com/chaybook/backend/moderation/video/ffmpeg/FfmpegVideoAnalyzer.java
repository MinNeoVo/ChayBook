package com.chaybook.backend.moderation.video.ffmpeg;

import com.chaybook.backend.moderation.config.VideoProcessingProperties;
import com.chaybook.backend.moderation.video.VideoAnalysis;
import com.chaybook.backend.moderation.video.VideoAnalyzer;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class FfmpegVideoAnalyzer implements VideoAnalyzer {

    private static final int PROCESS_TIMEOUT_SECONDS = 45;

    private final VideoProcessingProperties properties;
    private final RestClient downloadClient = RestClient.create();

    public FfmpegVideoAnalyzer(VideoProcessingProperties properties) {
        this.properties = properties;
    }

    @Override
    public VideoAnalysis analyze(String videoUrl) {
        Path workDir = null;

        try {
            workDir = Files.createTempDirectory("chaybook-video-");
            Path videoFile = workDir.resolve("source-video");
            downloadVideo(videoUrl, videoFile);

            if (Files.size(videoFile) > properties.maxFileSizeBytes()) {
                return failed("Video vượt quá giới hạn dung lượng 50 MB.");
            }

            double duration = readDuration(videoFile);
            if (duration <= 0 || duration > properties.maxDurationSeconds()) {
                return failed("Video không hợp lệ hoặc dài hơn 60 giây.");
            }

            boolean hasAudio = hasAudioTrack(videoFile);
            List<String> frames = extractFrames(videoFile, workDir, duration);

            byte[] audio = hasAudio
                    ? extractAudio(videoFile, workDir)
                    : null;

            if (frames.isEmpty()) {
                return new VideoAnalysis(
                        List.of(),
                        audio,
                        hasAudio,
                        "FFmpeg không trích xuất được frame video."
                );
            }

            return new VideoAnalysis(frames, audio, hasAudio, null);

        } catch (Exception exception) {
            return failed("Không thể phân tích video bằng FFmpeg.");
        } finally {
            deleteDirectory(workDir);
        }
    }

    private void downloadVideo(String videoUrl, Path destination)
            throws IOException {
        byte[] bytes = downloadClient.get()
                .uri(videoUrl)
                .retrieve()
                .body(byte[].class);

        if (bytes == null || bytes.length == 0) {
            throw new IOException("Video tải về rỗng.");
        }

        if (bytes.length > properties.maxFileSizeBytes()) {
            throw new IOException("Video vượt quá giới hạn 50 MB.");
        }

        Files.write(destination, bytes);
    }

    private double readDuration(Path videoFile) throws Exception {
        String output = runCommand(List.of(
                properties.ffprobePath(),
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                videoFile.toString()
        ));

        return Double.parseDouble(output.strip());
    }

    private boolean hasAudioTrack(Path videoFile) throws Exception {
        String output = runCommand(List.of(
                properties.ffprobePath(),
                "-v", "error",
                "-select_streams", "a:0",
                "-show_entries", "stream=codec_type",
                "-of", "csv=p=0",
                videoFile.toString()
        ));

        return !output.isBlank();
    }

    private List<String> extractFrames(
            Path videoFile,
            Path workDir,
            double duration
    ) throws Exception {
        double[] timestamps = {
                0,
                duration / 2,
                Math.max(0, duration - 0.5)
        };

        List<String> frames = new ArrayList<>();

        for (int index = 0; index < timestamps.length; index++) {
            Path framePath = workDir.resolve("frame-" + index + ".jpg");

            runCommand(List.of(
                    properties.ffmpegPath(),
                    "-y",
                    "-ss", String.format(java.util.Locale.ROOT, "%.2f", timestamps[index]),
                    "-i", videoFile.toString(),
                    "-frames:v", "1",
                    "-vf", "scale=-2:720",
                    "-q:v", "3",
                    framePath.toString()
            ));

            if (Files.exists(framePath) && Files.size(framePath) > 0) {
                String base64 = Base64.getEncoder()
                        .encodeToString(Files.readAllBytes(framePath));
                frames.add("data:image/jpeg;base64," + base64);
            }
        }

        return List.copyOf(frames);
    }

    private byte[] extractAudio(Path videoFile, Path workDir)
            throws Exception {
        Path audioPath = workDir.resolve("audio.wav");

        runCommand(List.of(
                properties.ffmpegPath(),
                "-y",
                "-i", videoFile.toString(),
                "-vn",
                "-ac", "1",
                "-ar", "16000",
                "-c:a", "pcm_s16le",
                audioPath.toString()
        ));

        if (!Files.exists(audioPath) || Files.size(audioPath) == 0) {
            throw new IOException("Không trích xuất được audio.");
        }

        return Files.readAllBytes(audioPath);
    }

    private String runCommand(List<String> command) throws Exception {
        Process process = new ProcessBuilder(command)
                .redirectErrorStream(true)
                .start();

        boolean finished = process.waitFor(
                PROCESS_TIMEOUT_SECONDS,
                TimeUnit.SECONDS
        );

        if (!finished) {
            process.destroyForcibly();
            throw new IOException("FFmpeg process timeout.");
        }

        String output = new String(
                process.getInputStream().readAllBytes(),
                java.nio.charset.StandardCharsets.UTF_8
        );

        if (process.exitValue() != 0) {
            throw new IOException(output);
        }

        return output;
    }

    private VideoAnalysis failed(String reason) {
        return new VideoAnalysis(List.of(), null, false, reason);
    }

    private void deleteDirectory(Path directory) {
        if (directory == null || !Files.exists(directory)) {
            return;
        }

        try (var paths = Files.walk(directory)) {
            paths.sorted(java.util.Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException ignored) {
                        }
                    });
        } catch (IOException ignored) {
        }
    }
}