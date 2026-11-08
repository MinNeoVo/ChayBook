package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class VideoJson {
    private static final Logger log = LoggerFactory.getLogger(VideoJson.class);

    private final ObjectMapper mapper;
    public VideoJson(ObjectMapper mapper) { this.mapper = mapper; }

    public String write(Object value) { return mapper.writeValueAsString(value); }

    public <T> T readStored(String value, Class<T> type) {
        if (value == null) return null;
        try { return mapper.readValue(value, type); }
        catch (JacksonException e) {
            throw new VideoAnalysisException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "STORED_DATA_INVALID", "Không đọc được dữ liệu đã lưu.");
        }
    }

    public <T> T readProvider(String value, Class<T> type) {
        if (value == null || value.isBlank() || value.length() > 150_000) {
            log.warn(
                    "Video AI JSON invalid: target={}, length={}",
                    type.getSimpleName(),
                    value == null ? null : value.length()
            );

            throw badOutput();
        }

        try {
            return mapper.readValue(value, type);
        } catch (JacksonException e) {
            log.warn(
                    "Video AI JSON mapping failed: target={}, error={}, path={}",
                    type.getSimpleName(),
                    e.getClass().getSimpleName(),
                    e.getPathReference()
            );

            throw badOutput();
        }
    }

    private VideoAnalysisException badOutput() {
        return new VideoAnalysisException(HttpStatus.BAD_GATEWAY,
                "INVALID_AI_RESPONSE", "AI trả dữ liệu không hợp lệ.");
    }
}
