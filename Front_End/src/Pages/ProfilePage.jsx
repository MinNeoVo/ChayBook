import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import Input from "../components/common/Input";
import Button from "../components/common/Button";

import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileSidebar from "../components/profile/ProfileSidebar";
import PostCard from "../components/post/PostCard";

import profilePosts from "../data/profilePosts";

function ProfilePage() {
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return profilePosts.filter((post) => {
      const matchesStatus =
        activeStatus === "ALL" || post.status === activeStatus;

      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, searchQuery]);

  const statusCount = {
    ALL: profilePosts.length,

    APPROVED: profilePosts.filter((post) => post.status === "APPROVED").length,

    PENDING: profilePosts.filter((post) => post.status === "PENDING").length,

    DENIED: profilePosts.filter((post) => post.status === "DENIED").length,
  };

  const handleLike = (post) => {
    console.log("Like:", post.id);
  };

  const handleComment = (post) => {
    console.log("Comment:", post.id);
  };

  const handleShare = (post) => {
    console.log("Share:", post.id);
  };

  const handleBookmark = (post) => {
    console.log("Bookmark:", post.id);
  };

  const handleMore = (post) => {
    console.log("More:", post.id);
  };

  const handleEdit = (post) => {
    console.log("Edit:", post.id);
  };

  const handleDelete = (post) => {
    console.log("Delete:", post.id);
  };

  const handleWithdraw = (post) => {
    console.log("Withdraw:", post.id);
  };

  return (
    <div
      className="
      min-h-screen
      bg-[#f7faf7]
      text-[#181c1b]
      antialiased
    "
    >
      <main className="w-full pt-20 bg-[#f7faf7]">
        {/* ================= PROFILE HEADER ================= */}
        <ProfileHeader />

        {/* ================= MAIN CONTENT ================= */}
        <section
          className="
          w-full
          px-4
          md:px-8
          lg:px-12
          py-8
        "
        >
          <div
            className="
            max-w-[1280px]
            mx-auto
            grid
            grid-cols-1
            lg:grid-cols-12
            gap-8
            items-start
          "
          >
            {/* LEFT SIDEBAR */}
            <ProfileSidebar />

            {/* RIGHT CONTENT */}
            <section
              className="
              lg:col-span-8
              flex
              flex-col
              gap-6
              min-w-0
            "
            >
              {/* ================= POSTS HEADER ================= */}
              <div
                className="
                bg-white
                rounded-2xl
                p-4
                md:p-6
                shadow-sm
                flex
                flex-col
                gap-4
              "
              >
                <div
                  className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  justify-between
                  gap-3
                "
                >
                  <div className="flex items-center gap-2">
                    <h2
                      className="
                      text-[22px]
                      leading-[30px]
                      font-semibold
                      text-gray-900
                    "
                    >
                      My Posts
                    </h2>

                    <span
                      className="
                      text-xs
                      px-2.5
                      py-0.5
                      rounded-full
                      bg-gray-100
                      text-gray-600
                      font-bold
                    "
                    >
                      ({profilePosts.length} posts)
                    </span>
                  </div>

                  <div className="w-full sm:w-64">
                    <Input
                      type="search"
                      icon={Search}
                      placeholder="Search my recipes & notes..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                </div>

                {/* ================= STATUS FILTER ================= */}
                <div
                  className="
                  flex
                  items-center
                  gap-2
                  overflow-x-auto
                  pb-1
                "
                >
                  <StatusFilter
                    label={`All (${statusCount.ALL})`}
                    active={activeStatus === "ALL"}
                    onClick={() => setActiveStatus("ALL")}
                  />

                  <StatusFilter
                    label={`Approved (${statusCount.APPROVED})`}
                    active={activeStatus === "APPROVED"}
                    color="green"
                    onClick={() => setActiveStatus("APPROVED")}
                  />

                  <StatusFilter
                    label={`Pending (${statusCount.PENDING})`}
                    active={activeStatus === "PENDING"}
                    color="gray"
                    onClick={() => setActiveStatus("PENDING")}
                  />

                  <StatusFilter
                    label={`Denied (${statusCount.DENIED})`}
                    active={activeStatus === "DENIED"}
                    color="red"
                    onClick={() => setActiveStatus("DENIED")}
                  />
                </div>
              </div>

              {/* ================= POST LIST ================= */}
              <div className="flex flex-col gap-6">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                      onBookmark={handleBookmark}
                      onMore={handleMore}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onWithdraw={handleWithdraw}
                    />
                  ))
                ) : (
                  <div
                    className="
                    bg-white
                    rounded-2xl
                    p-10
                    text-center
                    shadow-sm
                  "
                  >
                    <h3
                      className="
                      text-lg
                      font-semibold
                      text-gray-900
                      mb-2
                    "
                    >
                      No posts found
                    </h3>

                    <p className="text-sm text-gray-500 mb-5">
                      Try another search keyword or status.
                    </p>

                    <Button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveStatus("ALL");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              {/* ================= LOAD MORE ================= */}
              {filteredPosts.length > 0 && (
                <div
                  className="
                  w-full
                  py-3
                  flex
                  items-center
                  justify-center
                "
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="rounded-full px-6"
                  >
                    Load Archived Posts ↓
                  </Button>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusFilter({ label, active, color, onClick }) {
  const dotColor = {
    green: "bg-chaybook-primary",
    gray: "bg-gray-400",
    red: "bg-red-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3.5
        py-1.5
        rounded-full
        text-xs
        font-semibold
        shrink-0
        transition-colors
        ${
          active
            ? "bg-chaybook-primary text-white shadow-sm"
            : "bg-chaybook-container text-gray-600 hover:bg-[#ebefec]"
        }
      `}
    >
      {!active && color && (
        <span
          className={`
            inline-block
            w-2
            h-2
            rounded-full
            mr-1.5
            ${dotColor[color]}
          `}
        />
      )}

      {label}
    </button>
  );
}

export default ProfilePage;
