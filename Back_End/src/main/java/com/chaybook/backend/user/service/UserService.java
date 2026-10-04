package com.chaybook.backend.user.service;

import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.community.dto.PostResponse;
import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.community.repository.CommentRepository;
import com.chaybook.backend.community.repository.PostInteractionRepository;
import com.chaybook.backend.community.repository.PostRepository;
import com.chaybook.backend.user.dto.*;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.exception.IncorrectCurrentPasswordException;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PostRepository postRepository;
    private final PostInteractionRepository postInteractionRepository;
    private final CommentRepository commentRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PostRepository postRepository,
            PostInteractionRepository postInteractionRepository,
            CommentRepository commentRepository
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;  //Cos kha nang anh huong Auth
        this.postRepository = postRepository;
        this.postInteractionRepository = postInteractionRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * Lấy thông tin profile + danh sách bài viết của user hiện tại.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Integer currentUserId) {
        if (currentUserId == null || currentUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        // Lấy tất cả bài viết (trừ DELETED) của user
        List<Post> posts = postRepository.findPostsByUserId(currentUserId);

        // Đếm tương tác (LIKE, BOOKMARK) cho các bài viết của user
        Map<Integer, Long> likeCounts = new HashMap<>();
        Map<Integer, Long> bookmarkCounts = new HashMap<>();
        Map<Integer, Long> commentCounts = new HashMap<>();

        for (PostInteractionRepository.InteractionCount count
                : postInteractionRepository.findInteractionCountsByAuthor(currentUserId)) {

            if ("LIKE".equals(count.getInteractionType())) {
                likeCounts.put(count.getPostId(), count.getTotal());
            } else if ("BOOKMARK".equals(count.getInteractionType())) {
                bookmarkCounts.put(count.getPostId(), count.getTotal());
            }
        }

        for (CommentRepository.CommentCount count
                : commentRepository.findCommentCountsByAuthor(currentUserId)) {

            commentCounts.put(count.getPostId(), count.getTotal());
        }

        // Tương tác mà chính user này đã thực hiện
        Set<Integer> likedPostIds = new HashSet<>();
        Set<Integer> bookmarkedPostIds = new HashSet<>();

        List<PostInteractionRepository.CurrentUserInteraction> interactions =
                postInteractionRepository.findCurrentUserInteractionsByAuthor(
                        currentUserId,
                        currentUserId
                );

        for (PostInteractionRepository.CurrentUserInteraction interaction : interactions) {
            if ("LIKE".equals(interaction.getInteractionType())) {
                likedPostIds.add(interaction.getPostId());
            } else if ("BOOKMARK".equals(interaction.getInteractionType())) {
                bookmarkedPostIds.add(interaction.getPostId());
            }
        }

        // Build post responses
        List<PostResponse> postResponses = new ArrayList<>(posts.size());

        for (Post post : posts) {
            Integer postId = post.getPostId();
            User author = post.getUser();
            Category category = post.getCategory();

            postResponses.add(new PostResponse(
                    postId,
                    author == null ? null : author.getUserId(),
                    author == null ? null : author.getUsername(),
                    author == null ? null : author.getAvatarUrl(),
                    category == null ? null : category.getCategoryId(),
                    category == null ? null : category.getName(),
                    post.getTitle(),
                    post.getContent(),
                    post.getImageUrl(),
                    post.getStatus(),
                    post.getCreatedAt(),
                    likeCounts.getOrDefault(postId, 0L),
                    bookmarkCounts.getOrDefault(postId, 0L),
                    commentCounts.getOrDefault(postId, 0L),
                    likedPostIds.contains(postId),
                    bookmarkedPostIds.contains(postId)
            ));
        }

        return new UserProfileResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                postResponses
        );
    }

    @Transactional
    public UpdateProfileResponse updateProfile(
            Integer userId,
            Integer authenticatedUserId,
            UpdateProfileRequest request
    ) {
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid user ID"
            );
        }

        if (!userId.equals(authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only update your own profile"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        boolean usernameTaken =
                userRepository.existsByUsernameIgnoreCaseAndUserIdNot(
                        request.username(),
                        userId
                );

        if (usernameTaken) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username is already in use"
            );
        }

        user.setUsername(request.username());
        user.setFullName(request.fullName());
        user.setAvatarUrl(request.avatarUrl());

        User savedUser = userRepository.saveAndFlush(user);

        return new UpdateProfileResponse(
                "Profile updated successfully",
                new UpdateProfileResponse.UserData(
                        savedUser.getUserId(),
                        savedUser.getUsername(),
                        savedUser.getEmail(),
                        savedUser.getFullName(),
                        savedUser.getAvatarUrl(),
                        savedUser.getRole(),
                        savedUser.getStatus()
                )
        );
    }



    @Transactional
    public void changePassword(
            Integer userId,
            Integer authenticatedUserId,
            ChangePasswordRequest request
    ) {
        if (authenticatedUserId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid user ID"
            );
        }

        if (!userId.equals(authenticatedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only change your own password"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        if (request.currentPassword()
                .getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IncorrectCurrentPasswordException();
        }

        boolean correctPassword = passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
        );

        if (!correctPassword) {
            throw new IncorrectCurrentPasswordException();
        }

        if (request.newPassword()
                .getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "New password must not exceed 72 UTF-8 bytes"
            );
        }

        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword())
        );

        userRepository.saveAndFlush(user);
    }


}