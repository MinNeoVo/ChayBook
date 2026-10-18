package com.chaybook.backend.admin.post.service;

import com.chaybook.backend.admin.post.repository.AdminPostVideoRepository;
import com.chaybook.backend.admin.post.service.impl.AdminPostVideoServiceImpl;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminPostVideoServiceTest {
    private final AdminPostVideoRepository repository = mock(AdminPostVideoRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final AdminPostVideoService service = new AdminPostVideoServiceImpl(repository, users);
    private User admin;

    @BeforeEach void setup() {
        admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
    }

    @ParameterizedTest
    @CsvSource({"PENDING,APPROVED", "PENDING,REJECTED", "APPROVED,REJECTED", "APPROVED,REMOVED", "REJECTED,APPROVED"})
    void writesAllowedTransitionsUsingBothTypeAndId(String current, String next) {
        when(repository.findStatus("VIDEO", 7)).thenReturn(current);
        when(repository.updateStatus("VIDEO", 7, current, next)).thenReturn(1);
        service.updateStatus(
                1,
                "VIDEO",
                7,
                next,
                "REJECTED".equals(next) ? "Lý do thử nghiệm" : null
        );        verify(repository).updateStatus("VIDEO", 7, current, next);
        verify(repository, never()).updateStatus(eq("POST"), anyInt(), anyString(), anyString());
    }

    @Test void refusesInvalidTransitionsWithoutWriting() {
        when(repository.findStatus("POST", 7)).thenReturn("PENDING");
// Case chuyển POST sang REMOVED:
        service.updateStatus(1, "POST", 7, "REMOVED", null);
        verify(repository, never()).updateStatus(anyString(), anyInt(), anyString(), anyString());
    }

    @Test void detectsConcurrentModeration() {
        when(repository.findStatus("POST", 7)).thenReturn("PENDING");
        when(repository.updateStatus("POST", 7, "PENDING", "APPROVED")).thenReturn(0);
// Case chuyển POST sang APPROVED:
        service.updateStatus(1, "POST", 7, "APPROVED", null);    }

    @Test void rejectsInvalidFiltersAndOverflowBeforeQuerying() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.getSubmissions(1, "ARTICLE", "ALL", "", 0, 7));
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.getSubmissions(1, "ALL", "UNKNOWN", "", 0, 7));
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.getSubmissions(1, "ALL", "ALL", "", Integer.MAX_VALUE, 100));
        verifyNoInteractions(repository);
    }

    @Test void disabledAdminAndUserCannotReadOrModerate() {
        admin.setStatus("DISABLED");
        assertStatus(HttpStatus.FORBIDDEN, () -> service.getStatistics(1));
        admin.setStatus("ACTIVE"); admin.setRole("USER");
        assertStatus(HttpStatus.FORBIDDEN, () -> service.updateStatus(1, "POST", 7, "APPROVED", null));
        verifyNoInteractions(repository);
    }

    @Test void detailChecksTypeIdAndMissingContent() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.getDetail(1, "ARTICLE", 1));
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.getDetail(1, "POST", -1));
        assertStatus(HttpStatus.NOT_FOUND, () -> service.getDetail(1, "POST", 7));
    }

    private void assertStatus(HttpStatus status, org.junit.jupiter.api.function.Executable action) {
        assertEquals(status, assertThrows(ResponseStatusException.class, action).getStatusCode());
    }
}
