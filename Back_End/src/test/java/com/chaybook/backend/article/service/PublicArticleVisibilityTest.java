package com.chaybook.backend.article.service;

import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.article.repository.ArticleRepository;
import com.chaybook.backend.article.service.impl.ArticleServiceImpl;
import com.chaybook.backend.category.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicArticleVisibilityTest {
    private final ArticleRepository articles = mock(ArticleRepository.class);
    private final ArticleServiceImpl service = new ArticleServiceImpl(articles, mock(CategoryRepository.class));

    private Article article(String status) {
        Article article = new Article();
        org.springframework.test.util.ReflectionTestUtils.setField(article, "articleId", 7);
        article.setStatus(status);
        article.setTitle("Private draft title");
        article.setContent("Private draft content");
        return article;
    }

    @Test void defaultAndBlankPublicFiltersOnlyQueryPublishedRows() {
        when(articles.findByStatus(eq("PUBLISHED"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(article("PUBLISHED"))));
        for (String filter : new String[]{null, "", "  ", " published "}) {
            var page = service.getArticles(null, filter, 0, 6);
            assertEquals(1, page.getTotalElements());
            assertEquals("PUBLISHED", page.getContent().getFirst().status());
        }
        verify(articles, times(4)).findByStatus(eq("PUBLISHED"), any(Pageable.class));
        verifyNoMoreInteractions(articles);
    }

    @Test void categoryFilteringCannotBypassPublishedRestriction() {
        when(articles.findByCategory_CategoryIdAndStatus(eq(3), eq("PUBLISHED"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(article("PUBLISHED"))));
        assertEquals(1, service.getArticles(3, null, 0, 10).getTotalElements());
        verify(articles).findByCategory_CategoryIdAndStatus(eq(3), eq("PUBLISHED"), any(Pageable.class));
        verifyNoMoreInteractions(articles);
    }

    @Test void explicitDraftQueryReturnsAnEmptyPageWithoutReadingDrafts() {
        var result = service.getArticles(3, " draft ", 0, 6);
        assertTrue(result.isEmpty());
        assertEquals(0, result.getTotalElements());
        verifyNoInteractions(articles);
    }

    @Test void directDraftOrUnknownStatusReadsReturn404WithoutContent() {
        for (String status : new String[]{"DRAFT", null, "ARCHIVED"}) {
            when(articles.findById(7)).thenReturn(Optional.of(article(status)));
            var error = assertThrows(ResponseStatusException.class, () -> service.getArticleDetail(7));
            assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
            assertFalse(error.getReason().contains("Private draft"));
        }
    }

    @Test void publishedDetailRemainsReadable() {
        when(articles.findById(7)).thenReturn(Optional.of(article("PUBLISHED")));
        assertEquals("PUBLISHED", service.getArticleDetail(7).status());
    }

    @Test void invalidFiltersAndPaginationAreStillRejected() {
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> service.getArticles(null, "unknown", 0, 6)).getStatusCode());
        assertThrows(ResponseStatusException.class, () -> service.getArticles(null, null, -1, 6));
        assertThrows(ResponseStatusException.class, () -> service.getArticles(null, null, 0, 11));
        assertThrows(ResponseStatusException.class, () -> service.getArticles(0, null, 0, 6));
        verifyNoInteractions(articles);
    }
}
