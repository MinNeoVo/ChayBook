import PostCard from "../post/PostCard";

function PostGrid({ posts, onLike, onBookmark }) {
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
          <div key={normalizedPost.id} className="mb-6 break-inside-avoid">
            <PostCard
              post={normalizedPost}
              onLike={() => onLike?.(normalizedPost.id)}
              onBookmark={() => onBookmark?.(normalizedPost.id)}
            />
          </div>
        );
      })}
    </section>
  );
}

export default PostGrid;
