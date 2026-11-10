package com.chaybook.backend.admin.user.service;

import com.chaybook.backend.admin.user.dto.UpdateUserStatusRequest;
import com.chaybook.backend.admin.user.exception.AdminUserException;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminUserAuthorizationTest {
    private final UserRepository users = mock(UserRepository.class);
    private final AdminUserService service = new AdminUserService(users);

    @Test void requiresAnExistingActiveAdminEvenWithAValidToken() {
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(AdminUserException.class, () -> service.requireActiveAdmin(null)).getStatus());
        assertEquals(HttpStatus.UNAUTHORIZED, assertThrows(AdminUserException.class, () -> service.requireActiveAdmin(1)).getStatus());
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("DISABLED");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(AdminUserException.class, () -> service.requireActiveAdmin(1)).getStatus());
        admin.setStatus("ACTIVE"); admin.setRole("USER");
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(AdminUserException.class, () -> service.requireActiveAdmin(1)).getStatus());
        admin.setRole("ADMIN");
        assertDoesNotThrow(() -> service.requireActiveAdmin(1));
    }

    @Test void adminAccountsCannotBeDisabledThroughUserManagement() {
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(AdminUserException.class,
                () -> service.updateStatus(1, new UpdateUserStatusRequest("DISABLED"))).getStatus());
        verify(users, never()).saveAndFlush(any());
    }
}
