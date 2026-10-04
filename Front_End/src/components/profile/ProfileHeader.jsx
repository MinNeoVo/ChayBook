import { CalendarDays, FileText, Heart, Plus, Edit3 } from "lucide-react";

import Button from "../common/Button";

function ProfileHeader({ profile }) {
  const username = profile?.username || "ChayBook User";
  const fullName = profile?.fullName || username;
  const avatarUrl = profile?.avatarUrl;
  const role = profile?.role || "USER";
  const createdAt = profile?.createdAt;
  const postCount = Array.isArray(profile?.posts) ? profile.posts.length : 0;

  // Tính tổng likes từ tất cả bài viết
  const totalLikes = Array.isArray(profile?.posts)
    ? profile.posts.reduce((sum, post) => sum + (post.likeCount ?? 0), 0)
    : 0;

  // Format ngày tham gia
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      })
    : "Chưa xác định";

  // Chữ cái đầu cho avatar placeholder
  const initials = (fullName || username || "CB").slice(0, 2).toUpperCase();

  // Role badge
  const roleLabel =
    role === "ADMIN" ? "Administrator" : "Plant-based Food Enthusiast";

  return (
    <section className="w-full px-4 pt-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        {/* Botanical Banner */}
        <div
          className="
            relative h-48 w-full overflow-hidden rounded-2xl
            bg-gradient-to-r from-[#caead6] via-[#92f5a4]/40 to-[#e6e9e6]
            shadow-sm
            md:h-64
          "
        >
          {/* Pattern */}
          <div
            className="
              absolute inset-0
              opacity-15
              bg-[radial-gradient(#006b2c_1px,transparent_1px)]
              [background-size:16px_16px]
            "
          />

          {/* Right decoration */}
          <div
            className="
              pointer-events-none
              absolute -bottom-16 -right-12
              h-80 w-80
              rounded-full
              bg-[#7ffc97]/30
              blur-3xl
            "
          />

          {/* Left decoration */}
          <div
            className="
              pointer-events-none
              absolute -left-8 -top-12
              h-64 w-64
              rounded-full
              bg-[#95f8a7]/40
              blur-2xl
            "
          />

          {/* Certification badge */}
          <div
            className="
              absolute right-4 top-4
              rounded-full
              bg-white/80
              px-3 py-1.5
              text-xs font-semibold text-gray-600
              shadow-sm
              backdrop-blur-md
            "
          >
            🌱 {roleLabel}
          </div>
        </div>

        {/* Profile Card */}
        <div
          className="
            relative z-10
            mx-3 -mt-16
            rounded-2xl
            bg-white
            p-6
            shadow-sm
            md:-mt-20 md:mx-6 md:p-8
          "
        >
          <div
            className="
              flex flex-col justify-between gap-6
              md:flex-row md:items-end
            "
          >
            {/* Identity */}
            <div
              className="
                flex flex-col items-start gap-4
                sm:flex-row sm:items-end
              "
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="
                    h-28 w-28
                    overflow-hidden
                    rounded-full
                    bg-gradient-to-b from-[#006d30] to-[#006b2c]
                    p-1
                    shadow-md
                    md:h-36 md:w-36
                  "
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-chaybook-primary text-3xl font-bold text-white">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Online status */}
                <span
                  className="
                    absolute bottom-2 right-2
                    flex h-5 w-5 items-center justify-center
                    rounded-full
                    border-2 border-white
                    bg-[#00873a]
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              </div>

              {/* User information */}
              <div className="flex flex-col gap-1">
                {/* Name + Role */}
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="
                      text-2xl font-bold text-gray-900
                      md:text-3xl
                    "
                  >
                    {fullName}
                  </h1>

                  <span
                    className="
                      rounded-full
                      bg-[#caead6]
                      px-2 py-0.5
                      text-xs font-semibold
                      text-[#314d3e]
                    "
                  >
                    {roleLabel}
                  </span>
                </div>

                {/* Username */}
                <p className="text-sm text-gray-600">
                  @{username} • {profile?.email || ""}
                </p>

                {/* Statistics */}
                <div
                  className="
                    flex flex-wrap items-center gap-2
                    pt-1
                  "
                >
                  {/* Member since */}
                  <span
                    className="
                      flex items-center gap-1
                      rounded-full
                      bg-[#f1f4f1]
                      px-2.5 py-1
                      text-xs text-gray-600
                    "
                  >
                    <CalendarDays
                      size={15}
                      className="text-chaybook-primary"
                    />
                    Thành viên từ {memberSince}
                  </span>

                  {/* Published posts */}
                  <span
                    className="
                      flex items-center gap-1
                      rounded-full
                      bg-[#f1f4f1]
                      px-2.5 py-1
                      text-xs text-gray-600
                    "
                  >
                    <FileText size={15} className="text-chaybook-primary" />
                    {postCount} bài viết
                  </span>

                  {/* Total likes */}
                  <span
                    className="
                      flex items-center gap-1
                      rounded-full
                      bg-[#f1f4f1]
                      px-2.5 py-1
                      text-xs text-gray-600
                    "
                  >
                    <Heart size={15} className="text-chaybook-primary" />
                    {totalLikes} lượt thích
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full items-center gap-2 md:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 md:flex-none"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Edit3 size={17} />
                  Edit Profile
                </span>
              </Button>

              <Button type="button" size="sm" className="flex-1 md:flex-none">
                <span className="flex items-center justify-center gap-1.5">
                  <Plus size={18} />
                  Create Post
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileHeader;
