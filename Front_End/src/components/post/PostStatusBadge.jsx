function PostStatusBadge({ status }) {
  const statusConfig = {
    APPROVED: {
      label: "Approved",
      dot: "bg-secondary",
      className: "bg-secondary-container/60 text-on-secondary-container",
    },

    PENDING: {
      label: "Pending Review",
      dot: "bg-tertiary animate-pulse",
      className: "bg-surface-container-high text-tertiary",
    },

    DENIED: {
      label: "Denied",
      dot: "bg-error",
      className: "bg-error-container text-on-error-container",
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

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
