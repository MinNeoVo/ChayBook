package com.chaybook.backend.community.service;

import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.community.dto.*;
import com.chaybook.backend.community.entity.Post;
import com.chaybook.backend.community.entity.PostInteraction;
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

    @Transactional
    public PostMessageResponse updatePost(
            Integer postId,
            Integer currentUserId,
            PostUpdateRequest request
    ) {
        User currentUser = requireActiveUser(currentUserId);
        Post post = requirePostForWrite(postId);

        // Kể cả ADMIN cũng chỉ được sửa bài của chính mình.
        if (!isPostOwner(post, currentUser)) {
            throw new PostException(
                    HttpStatus.FORBIDDEN,
                    "You can only update your own posts"
            );
        }

        // Không gửi hoặc gửi null thì giữ nguyên.
        String newTitle = request.title() == null
                ? post.getTitle()
                : normalizePostText(request.title(), "Title");

        String newContent = request.content() == null
                ? post.getContent()
                : normalizePostText(request.content(), "Content");

        String newImageUrl = request.imageUrl() == null
                ? post.getImageUrl()
                : normalizeImageUrl(request.imageUrl());

        Category newCategory = post.getCategory();

        Integer oldCategoryId = post.getCategory() == null
                ? null
                : post.getCategory().getCategoryId();

        if (request.categoryId() != null
                && !Objects.equals(oldCategoryId, request.categoryId())) {
            newCategory = findOptionalCategory(request.categoryId());
        }

        Integer newCategoryId = newCategory == null
                ? null
                : newCategory.getCategoryId();

        boolean changed =
                !Objects.equals(post.getTitle(), newTitle)
                        || !Objects.equals(post.getContent(), newContent)
                        || !Objects.equals(post.getImageUrl(), newImageUrl)
                        || !Objects.equals(oldCategoryId, newCategoryId);

        // Không gọi setter hoặc save khi dữ liệu không đổi.
        if (!changed) {
            return new PostMessageResponse("No changes were made");
        }

        post.setTitle(newTitle);
        post.setContent(newContent);
        post.setImageUrl(newImageUrl);
        post.setCategory(newCategory);

        // Nội dung đã thay đổi nên phải duyệt lại.
        post.setStatus("PENDING");

        // Không đổi tác giả, createdAt hoặc các tương tác.
        postRepository.saveAndFlush(post);

        return new PostMessageResponse("Post updated successfully");
    }

    @Transactional
    public PostMessageResponse deletePost(
            Integer postId,
            Integer currentUserId
    ) {
        User currentUser = requireActiveUser(currentUserId);
        Post post = requirePostForWrite(postId);

        boolean owner = isPostOwner(post, currentUser);
        boolean admin = "ADMIN".equalsIgnoreCase(currentUser.getRole());

        // Chủ bài được xóa bài của mình; ADMIN được xóa mọi bài.
        if (!owner && !admin) {
            throw new PostException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own posts"
            );
        }

        // Xóa mềm: không xóa bản ghi hoặc dữ liệu liên quan.
        post.setStatus("DELETED");

        postRepository.saveAndFlush(post);

        return new PostMessageResponse("Post deleted successfully");
    }

    private Post requirePostForWrite(Integer postId) {
        if (postId == null || postId <= 0) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "postId must be greater than 0"
            );
        }

        Post post = postRepository.findByIdForUpdate(postId)
                .orElseThrow(() -> new PostException(
                        HttpStatus.NOT_FOUND,
                        "Post not found"
                ));

        // Bài đã xóa không được sửa lại hoặc xóa lần nữa.
        if ("DELETED".equalsIgnoreCase(post.getStatus())) {
            throw new PostException(
                    HttpStatus.NOT_FOUND,
                    "Post not found"
            );
        }

        return post;
    }

    private boolean isPostOwner(Post post, User currentUser) {
        return post.getUser() != null
                && Objects.equals(
                post.getUser().getUserId(),
                currentUser.getUserId()
        );
    }

    private String normalizePostText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must not be blank"
            );
        }

        return value.strip();
    }

    @Transactional
    public PostInteractionResponse addInteraction(
            Integer postId,
            Integer currentUserId,
            PostInteractionRequest request
    ) {
        User currentUser = requireActiveUser(currentUserId);

        boolean allowedRole =
                "USER".equalsIgnoreCase(currentUser.getRole())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole());

        if (!allowedRole) {
            throw new PostException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not allowed to interact with posts"
            );
        }

        String type = request.type();

        if (!"LIKE".equals(type) && !"BOOKMARK".equals(type)) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Interaction type must be LIKE or BOOKMARK"
            );
        }

        Post post = requirePostForWrite(postId);

        if (!"APPROVED".equalsIgnoreCase(post.getStatus())) {
            throw new PostException(
                    HttpStatus.CONFLICT,
                    "Only approved posts can receive interactions"
            );
        }

        boolean alreadyExists =
                postInteractionRepository
                        .existsByPost_PostIdAndUser_UserIdAndType(
                                post.getPostId(),
                                currentUser.getUserId(),
                                type
                        );

        // Đã có tương tác thì giữ nguyên, không toggle hoặc thêm trùng.
        if (!alreadyExists) {
            PostInteraction interaction = new PostInteraction();

            interaction.setPost(post);
            interaction.setUser(currentUser);
            interaction.setType(type);

            // interactionId và createdAt tự sinh.
            postInteractionRepository.saveAndFlush(interaction);
        }

        String message = "LIKE".equals(type)
                ? "Post like successfully"
                : "Post bookmark successfully";

        return new PostInteractionResponse(
                message,
                type,
                true
        );
    }


    @Transactional
    public PostInteractionResponse removeInteraction(
            Integer postId,
            Integer currentUserId,
            String type
    ) {
        User currentUser = requireActiveUser(currentUserId);

        boolean allowedRole =
                "USER".equalsIgnoreCase(currentUser.getRole())
                        || "ADMIN".equalsIgnoreCase(currentUser.getRole());

        if (!allowedRole) {
            throw new PostException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not allowed to interact with posts"
            );
        }

        if (!"LIKE".equals(type) && !"BOOKMARK".equals(type)) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Interaction type must be LIKE or BOOKMARK"
            );
        }

        // Kiểm tra ID, khóa bài trong transaction và chặn bài DELETED.
        Post post = requirePostForWrite(postId);

        if (!"APPROVED".equalsIgnoreCase(post.getStatus())) {
            throw new PostException(
                    HttpStatus.CONFLICT,
                    "Only approved posts allow interaction changes"
            );
        }

        // Không nhận userId từ frontend.
        // Nếu bản ghi không tồn tại thì query xóa 0 dòng, vẫn thành công.
        postInteractionRepository.deleteInteraction(
                post.getPostId(),
                currentUser.getUserId(),
                type
        );

        String message = "LIKE".equals(type)
                ? "Post unliked successfully"
                : "Post unbookmarked successfully";

        return new PostInteractionResponse(
                message,
                type,
                false
        );
    }
}
