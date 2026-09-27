import PostCard from "../post/PostCard";

function PostGrid({ posts }) {
  return (
    <section
      className="
                grid
                grid-cols-1
                gap-6
                md:grid-cols-2
            "
    >
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}

export default PostGrid;
