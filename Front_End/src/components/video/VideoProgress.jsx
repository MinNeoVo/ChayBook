import { LoaderCircle } from "lucide-react";

const STAGES = ["Tiếp nhận video", "Kiểm tra món chay", "Trích xuất công thức"];

export default function VideoProgress({ title = "Đang xử lý video…", status, description }) {
  const step = status === "CHECKING" ? 1 : status === "PROCESSING" || status === "ACCEPTED" ? 2 : 0;

  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-chaybook-primary">
          <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin motion-reduce:animate-none" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {description || "Bạn có thể mở Công thức của tôi. Video vẫn tiếp tục được xử lý."}
          </p>
        </div>
      </div>

      {status && (
        <ol className="grid gap-2 text-xs sm:grid-cols-3">
          {STAGES.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={`rounded-lg px-3 py-2 ${index === step ? "bg-green-100 font-semibold text-chaybook-primary" : "bg-gray-50 text-gray-500"}`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
