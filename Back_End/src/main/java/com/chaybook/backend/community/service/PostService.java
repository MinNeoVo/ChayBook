package com.chaybook.backend.community.service;

import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.community.dto.PostCreateRequest;
import com.chaybook.backend.community.dto.PostCreateResponse;
import com.chaybook.backend.community.dto.PostResponse;
import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.community.exception.PostException;
import com.chaybook.backend.community.repository.CommentRepository;
import com.chaybook.backend.community.repository.PostInteractionRepository;
import com.chaybook.backend.community.repository.PostRepository;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final PostInteractionRepository postInteractionRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public PostService(
            PostRepository postRepository,
            PostInteractionRepository postInteractionRepository,
            CommentRepository commentRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository
    ) {
        this.postRepository = postRepository;
        this.postInteractionRepository = postInteractionRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPosts(
            Integer categoryId,
            Integer currentUserId
    ) {
        if (categoryId != null && categoryId <= 0) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "categoryId must be greater than 0"
            );
        }

        List<Post> posts = postRepository.findApprovedPosts(categoryId);

        if (posts.isEmpty()) {
            return List.of();
        }

        Map<Integer, Long> likeCounts = new HashMap<>();
        Map<Integer, Long> bookmarkCounts = new HashMap<>();
        Map<Integer, Long> commentCounts = new HashMap<>();

        // Lấy tổng tương tác cho toàn bộ danh sách bằng một truy vấn.
        for (PostInteractionRepository.InteractionCount count
                : postInteractionRepository.findInteractionCounts(categoryId)) {

            if ("LIKE".equals(count.getInteractionType())) {
                likeCounts.put(count.getPostId(), count.getTotal());
            } else if ("BOOKMARK".equals(count.getInteractionType())) {
                bookmarkCounts.put(count.getPostId(), count.getTotal());
            }
        }

        for (CommentRepository.CommentCount count
                : commentRepository.findCommentCounts(categoryId)) {

            commentCounts.put(count.getPostId(), count.getTotal());
        }

        Set<Integer> likedPostIds = new HashSet<>();
        Set<Integer> bookmarkedPostIds = new HashSet<>();

        if (currentUserId != null) {
            List<PostInteractionRepository.CurrentUserInteraction> interactions =
                    postInteractionRepository.findCurrentUserInteractions(
                            categoryId,
                            currentUserId
                    );

            for (PostInteractionRepository.CurrentUserInteraction interaction
                    : interactions) {

                if ("LIKE".equals(interaction.getInteractionType())) {
                    likedPostIds.add(interaction.getPostId());
                } else if ("BOOKMARK".equals(interaction.getInteractionType())) {
                    bookmarkedPostIds.add(interaction.getPostId());
                }
            }
        }

        List<PostResponse> responses = new ArrayList<>(posts.size());

        for (Post post : posts) {
            Integer postId = post.getPostId();
            User author = post.getUser();
            Category category = post.getCategory();

            responses.add(new PostResponse(
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

        return responses;
    }

    @Transactional
    public PostCreateResponse createPost(
            Integer currentUserId,
            PostCreateRequest request
    ) {
        User currentUser = requireActiveUser(currentUserId);
        Category category = findOptionalCategory(request.categoryId());

        Post post = new Post();

        // Tác giả lấy từ tài khoản đã đăng nhập.
        post.setUser(currentUser);

        post.setCategory(category);
        post.setTitle(request.title().strip());
        post.setContent(request.content().strip());
        post.setImageUrl(normalizeImageUrl(request.imageUrl()));

        // Không nhận trạng thái từ frontend.
        post.setStatus("PENDING");

        // Không tự set postId hoặc createdAt.
        Post savedPost = postRepository.saveAndFlush(post);

        PostCreateResponse.PostData postData =
                new PostCreateResponse.PostData(
                        savedPost.getPostId(),
                        currentUser.getUserId(),
                        category == null ? null : category.getCategoryId(),
                        savedPost.getTitle(),
                        savedPost.getContent(),
                        savedPost.getImageUrl(),
                        savedPost.getStatus(),
                        savedPost.getCreatedAt()
                );

        return new PostCreateResponse(
                "Post created successfully",
                postData
        );
    }

    private User requireActiveUser(Integer currentUserId) {
        if (currentUserId == null || currentUserId <= 0) {
            throw new PostException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in"
            );
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new PostException(
                        HttpStatus.UNAUTHORIZED,
                        "User no longer exists. Please log in again"
                ));

        // Kiểm tra DB để tài khoản bị khóa không tiếp tục tạo bài
        // chỉ vì JWT cũ vẫn còn hạn.
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new PostException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not active"
            );
        }

        return user;
    }

    private Category findOptionalCategory(Integer categoryId) {
        if (categoryId == null) {
            return null;
        }

        if (categoryId <= 0) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "categoryId must be greater than 0"
            );
        }

        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new PostException(
                        HttpStatus.NOT_FOUND,
                        "Category not found"
                ));
    }

    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        return imageUrl.strip();
    }
}
