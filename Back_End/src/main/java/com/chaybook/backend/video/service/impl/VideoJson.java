package com.chaybook.backend.video.service.impl;
import com.chaybook.backend.video.exception.VideoAnalysisException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class VideoJson {
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
            throw badOutput();
        }
        try { return mapper.readValue(value, type); }
        catch (JacksonException e) { throw badOutput(); }
    }

    private VideoAnalysisException badOutput() {
        return new VideoAnalysisException(HttpStatus.BAD_GATEWAY,
                "INVALID_AI_RESPONSE", "AI trả dữ liệu không hợp lệ.");
    }
}
