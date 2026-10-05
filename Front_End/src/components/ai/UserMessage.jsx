import { CheckCheck } from "lucide-react";

function UserMessage({ message, userName = "You" }) {
  return (
    <div className="flex justify-end gap-2.5 sm:gap-3 pl-6 sm:pl-16">
      <div className="flex flex-col items-end gap-1 max-w-[88%] sm:max-w-[78%] md:max-w-[68%]">
        {/* Metadata Header */}
        <div className="flex items-center gap-1.5 px-1 text-xs text-gray-400">
          <span className="font-medium text-gray-600">{userName}</span>
          <span>•</span>
          <span>{message.createdAt || "Just now"}</span>
        </div>

        {/* User Message Bubble */}
        <div className="rounded-2xl rounded-tr-xs bg-chaybook-primary px-4 py-3 text-white shadow-xs">
          <p className="whitespace-pre-wrap break-words text-sm sm:text-[15px] leading-relaxed font-normal">
            {message.content}
          </p>
        </div>

        {/* Delivery status */}
        <div className="flex items-center gap-1 px-1 text-[11px] text-gray-400">
          <span>Sent</span>
          <CheckCheck className="h-3 w-3 text-chaybook-primary" />
        </div>
      </div>
    </div>
  );
}

export default UserMessage;
