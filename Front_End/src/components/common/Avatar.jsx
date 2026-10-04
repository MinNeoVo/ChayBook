import { UserRound } from "lucide-react";

function Avatar({ src, alt = "Avatar", size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  return (
    <div
      className={`${
        sizes[size] || sizes.md
      } shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <UserRound className="h-1/2 w-1/2  text-chaybook-primary " />
      )}
    </div>
  );
}

export default Avatar;
