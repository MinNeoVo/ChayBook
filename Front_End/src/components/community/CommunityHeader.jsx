import { Leaf } from "lucide-react";

function CommunityHeader() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
      <div
        className="
                    mb-1
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    bg-[#92f5a4]
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-[#007233]
                "
      >
        <Leaf size={16} />

        <span>Living Consciously</span>
      </div>

      <h1
        className="
                    text-4xl
                    font-bold
                    tracking-tight
                    text-chaybook-primary
                "
      >
        Community
      </h1>

      <p className="text-lg leading-7 text-gray-600">
        Share your vegetarian journey, mindful recipes, and botanical kitchen
        rituals.
      </p>
    </section>
  );
}

export default CommunityHeader;
