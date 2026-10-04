import PostCard from "../post/PostCard";

function PostGrid({ posts, onLike, onBookmark }) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {posts.map((post) => {
        // Chuẩn hóa dữ liệu tương thích giữa Backend DTO và Mock data
        const normalizedPost = {
          ...post,
          id: post.postId ?? post.id,
          title: post.title,
          description: post.content ?? post.description,
          image: post.imageUrl ?? post.image,
          time: post.createdAt
            ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : post.time || "Vừa xong",
          author: {
            name: post.username ?? post.author?.name ?? "Thành viên ChayBook",
            avatar: post.avatarUrl ?? post.author?.avatar,
            initials: (post.username || post.author?.name || "CB")
              .slice(0, 2)
              .toUpperCase(),
          },
          stats: {
            likes: post.likeCount ?? post.stats?.likes ?? 0,
            comments: post.commentCount ?? post.stats?.comments ?? 0,
          },
          likedByCurrentUser: post.likedByCurrentUser,
          bookmarkedByCurrentUser: post.bookmarkedByCurrentUser,
        };

        return (
          <PostCard
            key={normalizedPost.id}
            post={normalizedPost}
            onLike={() => onLike?.(normalizedPost.id)}
            onBookmark={() => onBookmark?.(normalizedPost.id)}
          />
        );
      })}
    </section>
  );
}

export default PostGrid;
