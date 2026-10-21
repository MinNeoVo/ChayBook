package com.chaybook.backend.admin.article.service;

import com.chaybook.backend.admin.article.repository.AdminArticleRepository;
import com.chaybook.backend.admin.article.service.impl.AdminArticleServiceImpl;
import com.chaybook.backend.admin.category.repository.AdminCategoryRepository;
import com.chaybook.backend.media.dto.MediaUploadResponse;
import com.chaybook.backend.media.service.MediaService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminArticleIntegrationTest {
    @Test void uploadsArticleMediaToCloudinaryAfterCheckingAdministratorAccess() {
        var users = mock(UserRepository.class);
        var mediaService = mock(MediaService.class);
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        when(mediaService.upload(any())).thenReturn(
                new MediaUploadResponse(
                        "https://res.cloudinary.com/demo/video/upload/chaybook/cover.mp4",
                        "video",
                        "chaybook/cover"
                )
        );
        var service = new AdminArticleImageService(users, mediaService);
        var file = new MockMultipartFile("file", "cover.mp4", "video/mp4", new byte[]{1, 2, 3});

        assertEquals(
                "https://res.cloudinary.com/demo/video/upload/chaybook/cover.mp4",
                service.upload(1, file)
        );
        verify(mediaService).upload(file);

        admin.setStatus("DISABLED");
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> service.upload(1, file)).getStatusCode());
        verifyNoMoreInteractions(mediaService);
    }
    @Test void oldestSortIsAppliedBeforeServerPaginationAndInvalidSortIsRejected() {
        var articles = mock(AdminArticleRepository.class);
        var users = mock(UserRepository.class);
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        when(articles.search(any(), any(), any(), any())).thenReturn(Page.empty());
        var service = new AdminArticleServiceImpl(articles, mock(AdminCategoryRepository.class), users);
        service.getArticles(1, "soup", null, "DRAFT", 2, 6, "oldest");
        var page = ArgumentCaptor.forClass(Pageable.class);
        verify(articles).search(eq("soup"), isNull(), eq("DRAFT"), page.capture());
        assertEquals(2, page.getValue().getPageNumber());
        assertEquals(Sort.Direction.ASC, page.getValue().getSort().getOrderFor("createdAt").getDirection());
        assertThrows(ResponseStatusException.class, () -> service.getArticles(1, "", null, null, 0, 6, "unknown"));
    }

    @Test void rejectsInvalidMediaAndInvalidLegacyImagePaths() {
        var users = mock(UserRepository.class);
        var mediaService = mock(MediaService.class);
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        var service = new AdminArticleImageService(users, mediaService);
        var fake = new MockMultipartFile("file", "cover.jpg", "image/jpeg", "<script>bad</script>".getBytes());
        when(mediaService.upload(fake)).thenThrow(new IllegalArgumentException("Only images and videos are supported"));
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class, () -> service.upload(1, fake)).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class, () -> service.load("../application.properties")).getStatusCode());
    }
}
