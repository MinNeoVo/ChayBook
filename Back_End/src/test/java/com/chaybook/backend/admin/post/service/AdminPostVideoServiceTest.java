package com.chaybook.backend.admin.post.service;

import com.chaybook.backend.admin.post.repository.AdminPostVideoRepository;
import com.chaybook.backend.admin.post.service.impl.AdminPostVideoServiceImpl;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
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
        ReflectionTestUtils.setField(admin, "userId", 1);
        when(users.findById(1)).thenReturn(Optional.of(admin));
    }

    @ParameterizedTest
    @CsvSource({
            "POST,PENDING,APPROVED", "POST,PENDING,REJECTED", "POST,APPROVED,REJECTED",
            "POST,APPROVED,REMOVED", "POST,REJECTED,APPROVED",
            "VIDEO,PENDING,APPROVED", "VIDEO,PENDING,REJECTED", "VIDEO,APPROVED,REJECTED",
            "VIDEO,APPROVED,REMOVED", "VIDEO,REJECTED,APPROVED"
    })
    void writesAllowedTransitionsUsingBothTypeAndId(String type, String current, String next) {
        when(repository.findStatus(type, 7)).thenReturn(current);
        when(repository.updateStatus(type, 7, current, next)).thenReturn(1);
        String reason = "REJECTED".equals(next) ? "Lý do thử nghiệm" : null;
        service.updateStatus(
                1,
                type,
                7,
                next,
                reason
        );
        verify(repository).updateStatus(type, 7, current, next);
        verify(repository).insertDecision(type, 7, 1, current, next, reason);
        verify(repository).markLatestModerationReviewed(type, 7, 1);
        verify(repository, never()).updateStatus(eq("POST".equals(type) ? "VIDEO" : "POST"), anyInt(), anyString(), anyString());
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "VIDEO"})
    void rejectsMissingOrWhitespaceReasonBeforeWriting(String type) {
        for (String reason : java.util.Arrays.asList(null, "", "  \n\t ")) {
            assertStatus(HttpStatus.BAD_REQUEST, () -> service.updateStatus(1, type, 7, "REJECTED", reason));
        }
        verifyNoInteractions(repository);
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "VIDEO"})
    void trimsAdminReasonAndUsesAuthenticatedReviewer(String type) {
        when(repository.findStatus(type, 7)).thenReturn("PENDING");
        when(repository.updateStatus(type, 7, "PENDING", "REJECTED")).thenReturn(1);
        service.updateStatus(1, type, 7, "REJECTED", "  Nội dung không phù hợp  ");
        verify(repository).insertDecision(type, 7, 1, "PENDING", "REJECTED", "Nội dung không phù hợp");
        verify(repository).markLatestModerationReviewed(type, 7, 1);
    }

    @Test void refusesInvalidTransitionsWithoutWriting() {
        when(repository.findStatus("POST", 7)).thenReturn("PENDING");
        assertStatus(HttpStatus.CONFLICT, () -> service.updateStatus(1, "POST", 7, "REMOVED", null));
        verify(repository, never()).updateStatus(anyString(), anyInt(), anyString(), anyString());
        verify(repository, never()).insertDecision(anyString(), anyInt(), anyInt(), anyString(), anyString(), any());
    }

    @Test void detectsConcurrentModeration() {
        when(repository.findStatus("POST", 7)).thenReturn("PENDING");
        when(repository.updateStatus("POST", 7, "PENDING", "APPROVED")).thenReturn(0);
        assertStatus(HttpStatus.CONFLICT, () -> service.updateStatus(1, "POST", 7, "APPROVED", null));
        verify(repository, never()).insertDecision(anyString(), anyInt(), anyInt(), anyString(), anyString(), any());
        verify(repository, never()).markLatestModerationReviewed(anyString(), anyInt(), anyInt());
    }

    @ParameterizedTest
    @CsvSource({"POST,REMOVED", "POST,DELETED", "VIDEO,REMOVED", "VIDEO,DELETED"})
    void terminalStatesCannotBeRestoredOrModerated(String type, String current) {
        when(repository.findStatus(type, 7)).thenReturn(current);
        for (String next : java.util.List.of("APPROVED", "REJECTED", "REMOVED")) {
            assertStatus(HttpStatus.CONFLICT, () -> service.updateStatus(1, type, 7, next, "Reason"));
        }
        verify(repository, never()).updateStatus(anyString(), anyInt(), anyString(), anyString());
        verify(repository, never()).insertDecision(anyString(), anyInt(), anyInt(), anyString(), anyString(), any());
    }

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
