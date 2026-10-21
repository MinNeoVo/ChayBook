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

        <span>Sống có ý thức</span>
      </div>

      <h1
        className="
                    text-4xl
                    font-bold
                    tracking-tight
                    text-chaybook-primary
                "
      >
        Cộng đồng
      </h1>

      <p className="text-lg leading-7 text-gray-600">
        Chia sẻ hành trình ăn chay, công thức lành mạnh và bí quyết nấu ăn từ
        thực vật.
      </p>
    </section>
  );
}

export default CommunityHeader;
