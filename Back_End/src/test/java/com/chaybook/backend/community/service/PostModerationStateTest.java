package com.chaybook.backend.community.service;

import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.community.dto.PostUpdateRequest;
import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.community.exception.PostException;
import com.chaybook.backend.community.repository.*;
import com.chaybook.backend.moderation.service.AiModerationService;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostModerationStateTest {
    private final PostRepository posts = mock(PostRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final AiModerationService ai = mock(AiModerationService.class);
    private final PostService service = new PostService(posts, mock(PostInteractionRepository.class),
            mock(CommentRepository.class), users, mock(CategoryRepository.class), ai);
    private final User owner = new User();
    private final Post post = new Post();

    @BeforeEach void setup() {
        ReflectionTestUtils.setField(owner, "userId", 2);
        owner.setRole("USER"); owner.setStatus("ACTIVE");
        post.setUser(owner); post.setTitle("Original"); post.setContent("Original content");
        when(users.findById(2)).thenReturn(Optional.of(owner));
        when(posts.findByIdForUpdate(1)).thenReturn(Optional.of(post));
    }

    @ParameterizedTest @ValueSource(strings = {"REMOVED", "DELETED"})
    void terminalPostsCannotBeEditedOrDeletedAgain(String status) {
        post.setStatus(status);
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(PostException.class,
                () -> service.updatePost(1, 2, new PostUpdateRequest(null,"Changed",null,null))).getStatus());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(PostException.class,
                () -> service.deletePost(1, 2)).getStatus());
        assertEquals(status, post.getStatus());
        assertEquals("Original", post.getTitle());
        verify(posts, never()).saveAndFlush(any());
        verifyNoInteractions(ai);
    }

    @ParameterizedTest @ValueSource(strings = {"PENDING", "APPROVED", "REJECTED"})
    void changedContentAlwaysReturnsToPending(String status) {
        post.setStatus(status);
        service.updatePost(1, 2, new PostUpdateRequest(null,"Changed",null,null));
        assertEquals("PENDING", post.getStatus());
        verify(posts).saveAndFlush(post);
        verifyNoInteractions(ai);
    }

    @Test void noChangeDoesNotResetRejection() {
        post.setStatus("REJECTED");
        service.updatePost(1, 2, new PostUpdateRequest(null,null,null,null));
        assertEquals("REJECTED", post.getStatus());
        verify(posts, never()).saveAndFlush(any());
    }

    @ParameterizedTest @ValueSource(strings = {"PENDING", "APPROVED", "REJECTED"})
    void onlyAuthorDeletesNonTerminalPost(String status) {
        post.setStatus(status);
        service.deletePost(1, 2);
        assertEquals("DELETED", post.getStatus());
        verify(posts).saveAndFlush(post);
    }

    @Test void adminCannotBypassDecisionAuditUsingAuthorDelete() {
        User admin = new User(); admin.setRole("ADMIN"); admin.setStatus("ACTIVE");
        ReflectionTestUtils.setField(admin,"userId",1);
        when(users.findById(1)).thenReturn(Optional.of(admin));
        post.setStatus("APPROVED");
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(PostException.class,
                () -> service.deletePost(1,1)).getStatus());
        assertEquals("APPROVED", post.getStatus());
        verify(posts, never()).saveAndFlush(any());
    }
}
