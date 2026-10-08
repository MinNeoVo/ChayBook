package com.chaybook.backend.community.service;

import com.chaybook.backend.category.entity.Category;
import com.chaybook.backend.category.repository.CategoryRepository;
import com.chaybook.backend.common.pagination.PageResponse;
import com.chaybook.backend.community.dto.*;
import com.chaybook.backend.community.entity.*;
import com.chaybook.backend.community.exception.PostException;
import com.chaybook.backend.community.repository.*;
import com.chaybook.backend.user.entity.User;
import com.chaybook.backend.user.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
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
    public PageResponse<PostResponse> getPosts(
            Integer categoryId,
            Integer currentUserId,
            int page,
            int size,
            String sort
    ) {
        requireActiveUser(currentUserId);

        if (categoryId != null && categoryId <= 0) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "categoryId must be greater than 0"
            );
        }

        if (categoryId != null) {
            findOptionalCategory(categoryId);
        }

        if (page < 0) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Page must be greater than or equal to zero"
            );
        }

        if (size < 1 || size > 100) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Size must be between 1 and 100"
            );
        }

        if ((long) page * size > Integer.MAX_VALUE) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Requested page is too large"
            );
        }

        String sortMode = sort == null
                ? "latest"
                : sort.strip().toLowerCase(Locale.ROOT);

        if (!Set.of("latest", "top", "discussed").contains(sortMode)) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Sort must be latest, top or discussed"
            );
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<Post> postPage = postRepository.findApprovedPosts(
                categoryId,
                sortMode,
                pageable
        );

        if (postPage.isEmpty()) {
            return new PageResponse<>(
                    List.of(),
                    postPage.getNumber(),
                    postPage.getSize(),
                    postPage.getTotalElements(),
                    postPage.getTotalPages()
            );
        }

        List<Integer> postIds = postPage.getContent()
                .stream()
                .map(Post::getPostId)
                .toList();

        Map<Integer, Long> likeCounts = new HashMap<>();
        Map<Integer, Long> bookmarkCounts = new HashMap<>();
        Map<Integer, Long> commentCounts = new HashMap<>();

        for (PostInteractionRepository.InteractionCount count
                : postInteractionRepository.findInteractionCountsByPostIds(
                postIds
        )) {

            if ("LIKE".equals(count.getInteractionType())) {
                likeCounts.put(count.getPostId(), count.getTotal());
            } else if ("BOOKMARK".equals(count.getInteractionType())) {
                bookmarkCounts.put(count.getPostId(), count.getTotal());
            }
        }

        for (CommentRepository.CommentCount count
                : commentRepository.findCommentCountsByPostIds(postIds)) {

            commentCounts.put(count.getPostId(), count.getTotal());
        }

        Set<Integer> likedPostIds = new HashSet<>();
        Set<Integer> bookmarkedPostIds = new HashSet<>();

        List<PostInteractionRepository.CurrentUserInteraction> interactions =
                postInteractionRepository.findCurrentUserInteractionsByPostIds(
                        postIds,
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

        Page<PostResponse> responsePage = postPage.map(post -> {
            Integer postId = post.getPostId();
            User author = post.getUser();
            Category category = post.getCategory();

            return new PostResponse(
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
            );
        });

        return PageResponse.from(responsePage);
    }

   
@Transactional
public PostCreateResponse createPost(
        Integer currentUserId,
        Integer categoryId,
        String title,
        String content,
        MultipartFile image
) {
    User currentUser = requireActiveUser(currentUserId);

    if (title == null || title.isBlank() || title.strip().length() > 255) {
        throw new PostException(
                HttpStatus.BAD_REQUEST,
                "Title is required and must not exceed 255 characters"
        );
    }

    if (content == null || content.isBlank()) {
        throw new PostException(
                HttpStatus.BAD_REQUEST,
                "Content is required"
        );
    }

    Category category = findOptionalCategory(categoryId);

    String imageUrl = savePostImage(image);

    Post post = new Post();
    post.setUser(currentUser);
    post.setCategory(category);
    post.setTitle(title.strip());
    post.setContent(content.strip());
    post.setImageUrl(imageUrl);
    post.setStatus("PENDING");

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

private String savePostImage(MultipartFile image) {
    if (image == null || image.isEmpty()) {
        return null;
    }

    if (image.getSize() > 5 * 1024 * 1024) {
        throw new PostException(
                HttpStatus.BAD_REQUEST,
                "Image must not exceed 5 MB"
        );
    }

    String contentType = image.getContentType();

    if (contentType == null ||
            !(contentType.equalsIgnoreCase("image/jpeg")
                    || contentType.equalsIgnoreCase("image/png"))) {
        throw new PostException(
                HttpStatus.BAD_REQUEST,
                "Only JPEG and PNG images are allowed"
        );
    }

    String extension = contentType.equalsIgnoreCase("image/png")
            ? ".png"
            : ".jpg";

    String fileName = UUID.randomUUID() + extension;
    Path uploadDir = Paths.get("uploads", "posts").toAbsolutePath();
    Path destination = uploadDir.resolve(fileName).normalize();

    try {
        Files.createDirectories(uploadDir);
        Files.copy(
                image.getInputStream(),
                destination,
                StandardCopyOption.REPLACE_EXISTING
        );

        return "/uploads/posts/" + fileName;
    } catch (IOException exception) {
        throw new PostException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to save image"
        );
    }
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
    
    private User requireActiveUser(Integer userId) {
        if (userId == null || userId <= 0) {
            throw new PostException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PostException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));

        if (user.getStatus() == null
                || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new PostException(
                    HttpStatus.FORBIDDEN,
                    "User account is not active"
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

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new PostException(
                        HttpStatus.BAD_REQUEST,
                        "Category not found"
                ));

        if (!"ACTIVE".equals(category.getStatus())) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot select a deleted category"
            );
        }

        if (!"POST".equals(category.getType())) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Category must have type POST"
            );
        }

        return category;
    }
    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null) {
            return null;
        }

        String normalizedUrl = imageUrl.strip();

        if (normalizedUrl.isEmpty()) {
            return null;
        }

        if (normalizedUrl.length() > 255) {
            throw new PostException(
                    HttpStatus.BAD_REQUEST,
                    "Image URL must not exceed 255 characters"
            );
        }

        return normalizedUrl;
    }
}
