package com.chaybook.backend.admin.article.service;

import com.chaybook.backend.admin.article.repository.AdminArticleRepository;
import com.chaybook.backend.admin.article.service.impl.AdminArticleServiceImpl;
import com.chaybook.backend.admin.category.repository.AdminCategoryRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import java.nio.file.Path;
import java.nio.file.Files;
import java.util.Base64;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminArticleIntegrationTest {
    @TempDir Path temporaryImages;

    @Test void storesValidatedImageUnderGeneratedNameAndReadsItWithoutUsingTheClientFilename() throws Exception {
        var users = mock(UserRepository.class);
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        var service = new AdminArticleImageService(users);
        ReflectionTestUtils.setField(service, "directory", temporaryImages);
        byte[] png = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=");
        String url = service.upload(1, new MockMultipartFile("file", "../../cover.html", "text/html", png));
        assertTrue(url.matches("/api/article-images/[a-f0-9-]{36}\\.png"));
        String filename = url.substring(url.lastIndexOf('/') + 1);
        assertArrayEquals(png, service.load(filename).getContentAsByteArray());
        assertTrue(Files.isRegularFile(temporaryImages.resolve(filename)));
        admin.setStatus("DISABLED");
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> service.upload(1, new MockMultipartFile("file", png))).getStatusCode());
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

    @Test void imageUploadRejectsHtmlAndOversizedFilesWithoutWritingAnything() {
        var users = mock(UserRepository.class);
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        when(users.findById(1)).thenReturn(Optional.of(admin));
        var service = new AdminArticleImageService(users);
        var fake = new MockMultipartFile("file", "cover.jpg", "image/jpeg", "<script>bad</script>".getBytes());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class, () -> service.upload(1, fake)).getStatusCode());
        var big = new MockMultipartFile("file", "big.png", "image/png", new byte[5 * 1024 * 1024 + 1]);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class, () -> service.upload(1, big)).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class, () -> service.load("../application.properties")).getStatusCode());
    }
}
