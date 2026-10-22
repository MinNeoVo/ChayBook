package com.chaybook.backend.article.service;

import com.chaybook.backend.article.entity.Article;
import com.chaybook.backend.article.repository.ArticleRepository;
import com.chaybook.backend.article.service.impl.ArticleServiceImpl;
import com.chaybook.backend.category.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class PublicArticleSecurityTest {
    private final ArticleRepository repository=mock(ArticleRepository.class);
    private final ArticleServiceImpl service=new ArticleServiceImpl(repository,mock(CategoryRepository.class));
    @Test void defaultListAlwaysQueriesPublished() {
        when(repository.findByStatus(eq("PUBLISHED"),any(Pageable.class))).thenReturn(Page.empty());
        assertTrue(service.getArticles(null,null,0,10).isEmpty());
        verify(repository).findByStatus(eq("PUBLISHED"),any(Pageable.class));
        verify(repository,never()).findAll(any(Pageable.class));
    }
    @Test void draftFilterCannotExposeDrafts() {
        assertTrue(service.getArticles(null,"DRAFT",0,10).isEmpty());
        verifyNoInteractions(repository);
    }
    @Test void categoryStillRequiresPublished() {
        when(repository.findByCategory_CategoryIdAndStatus(eq(3),eq("PUBLISHED"),any())).thenReturn(Page.empty());
        service.getArticles(3,null,0,10);
        verify(repository).findByCategory_CategoryIdAndStatus(eq(3),eq("PUBLISHED"),any());
    }
    @Test void detailHasPublicationPredicateAnd404ForDraft() {
        when(repository.findByArticleIdAndStatus(1,"PUBLISHED")).thenReturn(Optional.empty());
        assertEquals(HttpStatus.NOT_FOUND,assertThrows(ResponseStatusException.class,()->service.getArticleDetail(1)).getStatusCode());
        verify(repository,never()).findById(anyInt());
    }
    @Test void invalidPaginationFailsBeforeRepository() {
        assertThrows(ResponseStatusException.class,()->service.getArticles(null,null,Integer.MAX_VALUE,10));
        verifyNoInteractions(repository);
    }
}
