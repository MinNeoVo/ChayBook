function PostStatusBadge({ status }) {
  const normalizedStatus = String(status || "").trim().toUpperCase();
  const statusConfig = {
    APPROVED: {
      label: "Đã duyệt",
      dot: "bg-secondary",
      className: "bg-secondary-container/60 text-on-secondary-container",
    },

    PENDING: {
      label: "Chờ duyệt",
      dot: "bg-tertiary animate-pulse",
      className: "bg-surface-container-high text-tertiary",
    },

    REJECTED: {
      label: "Đã từ chối",
      dot: "bg-error",
      className: "bg-error-container text-on-error-container",
    },

    DENIED: {
      label: "Đã từ chối",
      dot: "bg-error",
      className: "bg-error-container text-on-error-container",
    },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.PENDING;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-full
        font-label-sm
        text-label-sm
        font-semibold
        ${config.className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default PostStatusBadge;
