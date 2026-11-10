import PostCard from "../post/PostCard";

function PostGrid({ posts, onLike, onBookmark, onComment }) {
  return (
    <section className="columns-1 gap-6 md:columns-2">
      {posts.map((post) => {
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
            fullName: post.username ?? post.author?.name ?? "Thành viên ChayBook",
            avatarUrl: post.avatarUrl ?? post.author?.avatarUrl,
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
          <div key={normalizedPost.id} className="mb-6 break-inside-avoid">
            <PostCard
              post={normalizedPost}
              onLike={() => onLike?.(normalizedPost.id)}
              onBookmark={() => onBookmark?.(normalizedPost.id)}
              onComment={() => onComment?.(normalizedPost)}
            />
          </div>
        );
      })}
    </section>
  );
}

export default PostGrid;
